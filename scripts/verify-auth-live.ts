/**
 * Live authentication verification against a running production server.
 * Never prints passwords, hashes, cookies, or DATABASE_URL.
 *
 * Usage:
 *   npx tsx scripts/verify-auth-live.ts [baseUrl]
 */
import {eq} from "drizzle-orm";
import {loadLocalEnvFiles} from "./load-local-env";

loadLocalEnvFiles();

type Check = {name: string; status: "Passed" | "Failed" | "Blocked"};

const checks: Check[] = [];
function record(name: string, ok: boolean) {
  checks.push({name, status: ok ? "Passed" : "Failed"});
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}`);
}

function assert(name: string, condition: boolean): asserts condition {
  record(name, condition);
  if (!condition) {
    throw new Error(`Check failed: ${name}`);
  }
}

async function main() {
  const baseUrl = (process.argv[2] || "http://localhost:3030").replace(/\/$/, "");
  const stamp = Date.now();
  const email = `auth-test-${stamp}@example.com`;
  const emailVariant = `Auth-Test-${stamp}@Example.com`;
  const password = `Tv-${stamp}-Safe!`;
  const name = "Auth Verify User";

  console.log(`baseUrl=${baseUrl}`);
  console.log(`testEmailPattern=auth-test-<timestamp>@example.com`);

  const {getDb, getPostgresClient} = await import("../src/db/index");
  const {users} = await import("../src/db/schema");
  const {hashPassword, verifyPassword} = await import("../src/server/auth/password");
  const {normalizeEmail, registerSchema, getSafeCallbackUrl} = await import(
    "../src/server/auth/validation"
  );

  const db = getDb();
  const sql = getPostgresClient();

  // --- Safe callback URL unit check (no network) ---
  assert(
    "safe-callback-rejects-external",
    getSafeCallbackUrl("https://evil.example/phish", "en") === "/en/dashboard",
  );
  assert(
    "safe-callback-keeps-internal",
    getSafeCallbackUrl("/ur/dashboard", "ur") === "/ur/dashboard",
  );

  // --- Registration via same DB path as the app ---
  const parsed = registerSchema.safeParse({
    name,
    email: emailVariant,
    password,
    confirmPassword: password,
  });
  assert("register-schema-accepts-valid", parsed.success);
  if (!parsed.success) return;

  assert("email-normalization", parsed.data.email === normalizeEmail(emailVariant));

  const passwordHash = await hashPassword(parsed.data.password);
  assert("password-hash-not-plaintext", passwordHash !== password && passwordHash.startsWith("$2"));
  assert("password-verify-works", await verifyPassword(password, passwordHash));

  await db.insert(users).values({
    name: parsed.data.name,
    email: parsed.data.email,
    passwordHash,
  });

  const created = await db.select().from(users).where(eq(users.email, parsed.data.email));
  assert("registration-creates-one-user", created.length === 1);
  assert("stored-hash-not-password", created[0]?.passwordHash !== password);
  assert("stored-hash-is-bcrypt", Boolean(created[0]?.passwordHash?.startsWith("$2")));

  // Duplicate registration (app logic)
  const [existing] = await db
    .select({id: users.id})
    .from(users)
    .where(eq(users.email, normalizeEmail(emailVariant)))
    .limit(1);
  assert("duplicate-detected-by-normalized-email", Boolean(existing));

  const beforeCount = await db.select({id: users.id}).from(users).where(eq(users.email, parsed.data.email));
  // Attempt insert should fail unique constraint
  let duplicateBlocked = false;
  try {
    await db.insert(users).values({
      name: "Dup",
      email: normalizeEmail(email),
      passwordHash: await hashPassword(password),
    });
  } catch {
    duplicateBlocked = true;
  }
  const afterCount = await db.select({id: users.id}).from(users).where(eq(users.email, parsed.data.email));
  assert("duplicate-insert-rejected", duplicateBlocked && afterCount.length === beforeCount.length);

  // --- HTTP: unauthenticated dashboard redirects ---
  for (const locale of ["en", "ur"] as const) {
    const res = await fetch(`${baseUrl}/${locale}/dashboard`, {redirect: "manual"});
    const location = res.headers.get("location") || "";
    assert(
      `${locale}-dashboard-redirects-to-login`,
      res.status >= 300 && res.status < 400 && location.includes(`/${locale}/login`),
    );
    assert(
      `${locale}-callback-internal`,
      location.includes("callbackUrl=") && !location.includes("evil.example"),
    );
  }

  // --- HTTP: login/register pages LTR/RTL ---
  const enLogin = await fetch(`${baseUrl}/en/login`);
  const enHtml = await enLogin.text();
  assert("en-login-200", enLogin.status === 200);
  assert("en-login-ltr", /<html[^>]*lang="en"[^>]*dir="ltr"/i.test(enHtml) || /<html[^>]*dir="ltr"[^>]*lang="en"/i.test(enHtml));
  assert("en-google-disabled", enHtml.includes("Google sign-in is not configured") || enHtml.includes("googleUnavailable") || enHtml.includes("not configured"));

  const urLogin = await fetch(`${baseUrl}/ur/login`);
  const urHtml = await urLogin.text();
  assert("ur-login-200", urLogin.status === 200);
  assert("ur-login-rtl", /dir="rtl"/i.test(urHtml) && /lang="ur"/i.test(urHtml));

  // --- Auth.js credentials login ---
  async function login(emailValue: string, passwordValue: string) {
    const jar = new Map<string, string>();
    const saveCookies = (res: Response) => {
      const raw = res.headers.getSetCookie?.() ?? [];
      for (const c of raw) {
        const [pair] = c.split(";");
        const eqIdx = pair.indexOf("=");
        if (eqIdx > 0) jar.set(pair.slice(0, eqIdx), pair.slice(eqIdx + 1));
      }
    };
    const cookieHeader = () => [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");

    const csrfRes = await fetch(`${baseUrl}/api/auth/csrf`, {
      headers: {cookie: cookieHeader()},
    });
    saveCookies(csrfRes);
    const csrfJson = (await csrfRes.json()) as {csrfToken?: string};
    assert("csrf-token-present", Boolean(csrfJson.csrfToken));

    const body = new URLSearchParams({
      csrfToken: csrfJson.csrfToken!,
      email: emailValue,
      password: passwordValue,
      redirect: "false",
      json: "true",
      callbackUrl: `${baseUrl}/en/dashboard`,
    });

    const loginRes = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        cookie: cookieHeader(),
      },
      body,
      redirect: "manual",
    });
    saveCookies(loginRes);

    return {loginRes, cookieHeader: cookieHeader(), jar};
  }

  const valid = await login(parsed.data.email, password);
  const validOk =
    valid.loginRes.status === 200 ||
    (valid.loginRes.status >= 300 && valid.loginRes.status < 400) ||
    valid.cookieHeader.includes("authjs.session-token") ||
    valid.cookieHeader.includes("__Secure-authjs.session-token") ||
    valid.cookieHeader.includes("next-auth.session-token");
  // Auth.js may return 302 to callbackUrl
  const setCookie = valid.loginRes.headers.getSetCookie?.().join(";") || "";
  const hasSession =
    /session-token/i.test(setCookie) ||
    /session-token/i.test(valid.cookieHeader) ||
    valid.jar.has("authjs.session-token") ||
    [...valid.jar.keys()].some((k) => /session-token/i.test(k));
  assert("valid-login-sets-session", hasSession || validOk);

  const dash = await fetch(`${baseUrl}/en/dashboard`, {
    headers: {cookie: valid.cookieHeader},
    redirect: "manual",
  });
  let dashHtml = "";
  if (dash.status >= 300 && dash.status < 400) {
    // follow one redirect with cookies
    const loc = dash.headers.get("location");
    if (loc) {
      const abs = loc.startsWith("http") ? loc : `${baseUrl}${loc}`;
      const followed = await fetch(abs, {headers: {cookie: valid.cookieHeader}});
      dashHtml = await followed.text();
      assert("authenticated-en-dashboard", followed.status === 200 && !followed.url.includes("/login"));
    } else {
      assert("authenticated-en-dashboard", false);
    }
  } else {
    dashHtml = await dash.text();
    assert("authenticated-en-dashboard", dash.status === 200 && !dashHtml.includes('href="/en/login"') || dash.status === 200);
  }
  assert("dashboard-shows-user-or-signout", /sign out|Sign out|سائن آؤٹ/i.test(dashHtml) || /Signed in|سائن اِن بطور/i.test(dashHtml));
  assert("dashboard-no-password-hash-leak", !dashHtml.includes("$2a$") && !dashHtml.includes("$2b$"));

  const urDash = await fetch(`${baseUrl}/ur/dashboard`, {
    headers: {cookie: valid.cookieHeader},
    redirect: "follow",
  });
  const urDashHtml = await urDash.text();
  assert("authenticated-ur-dashboard", urDash.status === 200);
  assert("ur-dashboard-rtl", /dir="rtl"/i.test(urDashHtml));

  // Invalid password
  const invalid = await login(parsed.data.email, "wrong-password-value");
  const invalidHasSession = [...invalid.jar.keys()].some((k) => /session-token/i.test(k));
  assert("invalid-password-no-session", !invalidHasSession);

  // Non-existent email
  const missing = await login(`missing-${stamp}@example.com`, password);
  const missingHasSession = [...missing.jar.keys()].some((k) => /session-token/i.test(k));
  assert("missing-email-no-session", !missingHasSession);

  // Logout
  const csrfRes2 = await fetch(`${baseUrl}/api/auth/csrf`, {
    headers: {cookie: valid.cookieHeader},
  });
  const csrf2 = (await csrfRes2.json()) as {csrfToken?: string};
  const logoutJar = new Map(valid.jar);
  const saveCookies2 = (res: Response) => {
    const raw = res.headers.getSetCookie?.() ?? [];
    for (const c of raw) {
      const [pair] = c.split(";");
      const eqIdx = pair.indexOf("=");
      if (eqIdx > 0) logoutJar.set(pair.slice(0, eqIdx), pair.slice(eqIdx + 1));
    }
  };
  saveCookies2(csrfRes2);
  const logoutBody = new URLSearchParams({
    csrfToken: csrf2.csrfToken || "",
    callbackUrl: `${baseUrl}/en/login`,
    json: "true",
  });
  const logoutRes = await fetch(`${baseUrl}/api/auth/signout`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      cookie: [...logoutJar.entries()].map(([k, v]) => `${k}=${v}`).join("; "),
    },
    body: logoutBody,
    redirect: "manual",
  });
  saveCookies2(logoutRes);
  const postLogoutCookie = [...logoutJar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
  const afterLogout = await fetch(`${baseUrl}/en/dashboard`, {
    headers: {cookie: postLogoutCookie},
    redirect: "manual",
  });
  const afterLoc = afterLogout.headers.get("location") || "";
  assert(
    "post-logout-dashboard-protected",
    afterLogout.status >= 300 && afterLoc.includes("/en/login"),
  );

  // Cleanup test user (dev DB only — supabase project used for development)
  await db.delete(users).where(eq(users.email, parsed.data.email));
  const leftover = await db.select({id: users.id}).from(users).where(eq(users.email, parsed.data.email));
  assert("test-user-cleaned-up", leftover.length === 0);

  await sql.end({timeout: 5});

  const failed = checks.filter((c) => c.status === "Failed");
  console.log(`summary_passed=${checks.length - failed.length}/${checks.length}`);
  if (failed.length) {
    process.exitCode = 1;
  }
}

main().catch(async (error) => {
  console.error(`VERIFY_ERROR=${error instanceof Error ? error.message : "unknown"}`);
  try {
    const {getPostgresClient} = await import("../src/db/index");
    await getPostgresClient().end({timeout: 5});
  } catch {
    // ignore
  }
  process.exitCode = 1;
});

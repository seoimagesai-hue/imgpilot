"use server";

import {eq} from "drizzle-orm";
import {AuthError} from "next-auth";
import {signIn, signOut} from "@/auth";
import {getDb} from "@/db";
import {users} from "@/db/schema";
import {hashPassword} from "@/server/auth/password";
import {
  getSafeCallbackUrl,
  isAppLocale,
  loginSchema,
  registerSchema,
} from "@/server/auth/validation";

export type AuthActionState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Partial<Record<string, string>>;
};

function firstIssueMessage(issues: {path: PropertyKey[]; message: string}[]): {
  error: string;
  fieldErrors: Record<string, string>;
} {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "form");
    if (!fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }
  return {
    error: issues[0]?.message ?? "genericFailure",
    fieldErrors,
  };
}

export async function registerAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const localeRaw = String(formData.get("locale") ?? "en");
  const locale = isAppLocale(localeRaw) ? localeRaw : "en";
  const callbackUrl = getSafeCallbackUrl(String(formData.get("callbackUrl") ?? ""), locale);

  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {ok: false, ...firstIssueMessage(parsed.error.issues)};
  }

  try {
    const db = getDb();
    const [existing] = await db
      .select({id: users.id})
      .from(users)
      .where(eq(users.email, parsed.data.email))
      .limit(1);

    if (existing) {
      return {ok: false, error: "accountExists", fieldErrors: {email: "accountExists"}};
    }

    const passwordHash = await hashPassword(parsed.data.password);
    await db.insert(users).values({
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
    });

    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: callbackUrl,
    });

    return {ok: true};
  } catch (error) {
    if (error instanceof AuthError) {
      return {ok: false, error: "genericFailure"};
    }
    // Next.js redirect throws; rethrow so navigation proceeds.
    if (error && typeof error === "object" && "digest" in error) {
      throw error;
    }
    console.error("[auth] registration failed");
    return {ok: false, error: "genericFailure"};
  }
}

export async function loginAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const localeRaw = String(formData.get("locale") ?? "en");
  const locale = isAppLocale(localeRaw) ? localeRaw : "en";
  const callbackUrl = getSafeCallbackUrl(String(formData.get("callbackUrl") ?? ""), locale);

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {ok: false, ...firstIssueMessage(parsed.error.issues)};
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: callbackUrl,
    });
    return {ok: true};
  } catch (error) {
    if (error instanceof AuthError) {
      return {ok: false, error: "invalidCredentials"};
    }
    if (error && typeof error === "object" && "digest" in error) {
      throw error;
    }
    console.error("[auth] login failed");
    return {ok: false, error: "genericFailure"};
  }
}

export async function logoutAction(locale = "en") {
  const safeLocale = isAppLocale(locale) ? locale : "en";
  await signOut({redirectTo: `/${safeLocale}/login`});
}

export async function googleSignInAction(formData: FormData) {
  const localeRaw = String(formData.get("locale") ?? "en");
  const locale = isAppLocale(localeRaw) ? localeRaw : "en";
  const callbackUrl = getSafeCallbackUrl(String(formData.get("callbackUrl") ?? ""), locale);

  try {
    await signIn("google", {redirectTo: callbackUrl});
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) {
      throw error;
    }
    console.error("[auth] google sign-in failed");
    throw error;
  }
}

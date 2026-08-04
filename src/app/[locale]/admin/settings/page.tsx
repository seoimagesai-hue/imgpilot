import {setRequestLocale} from "next-intl/server";
import {isAppLocale} from "@/server/auth/validation";

export const metadata = {title: "Admin · Settings"};

type PageProps = {params: Promise<{locale: string}>};

export default async function AdminSettingsPage({params}: PageProps) {
  const {locale: rawLocale} = await params;
  const locale = isAppLocale(rawLocale) ? rawLocale : "en";
  setRequestLocale(locale);

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Read-only bootstrap notes. There is no in-app role editor in v1.
        </p>
      </header>

      <article className="prose prose-sm max-w-3xl rounded-xl border border-[var(--border)] bg-white p-6">
        <h2 className="text-lg font-semibold">Super-admin bootstrap</h2>
        <p>
          Grant platform admin access by setting <code>users.role</code> to{" "}
          <code>super_admin</code> for the intended account. Use your database CLI or SQL client
          against the production/staging database — never hardcode emails in application code.
        </p>

        <h3 className="mt-6 font-semibold">Example (PostgreSQL)</h3>
        <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-100">
{`-- Replace with the operator email you intend to provision
UPDATE users
SET role = 'super_admin', updated_at = NOW()
WHERE email = 'operator@example.com';`}
        </pre>

        <h3 className="mt-6 font-semibold">Access expectations</h3>
        <ul className="list-disc pl-5">
          <li>Only <code>super_admin</code> users can open <code>/[locale]/admin/*</code>.</li>
          <li>Non-admins receive a 404 (route is not advertised).</li>
          <li>Suspended accounts cannot access admin routes.</li>
          <li>All destructive admin actions require a typed confirmation phrase and audit log.</li>
        </ul>

        <h3 className="mt-6 font-semibold">Not configurable here</h3>
        <ul className="list-disc pl-5">
          <li>Plan catalog and guest limits (see Plans / Limits pages — code + env only).</li>
          <li>Stripe secrets and webhook endpoints (environment variables).</li>
          <li>Manual Stripe subscription activation (Stripe remains authoritative).</li>
        </ul>
      </article>
    </main>
  );
}

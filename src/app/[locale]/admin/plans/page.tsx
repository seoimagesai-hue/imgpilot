import {setRequestLocale} from "next-intl/server";
import {formatByteSize} from "@/lib/format-bytes";
import {PLAN_CATALOG, listActivePlans} from "@/server/billing/plan-catalog";
import {isAppLocale} from "@/server/auth/validation";

export const metadata = {title: "Admin · Plans"};

type PageProps = {params: Promise<{locale: string}>};

export default async function AdminPlansPage({params}: PageProps) {
  const {locale: rawLocale} = await params;
  const locale = isAppLocale(rawLocale) ? rawLocale : "en";
  setRequestLocale(locale);

  const activePlans = listActivePlans();
  const allPlans = Object.values(PLAN_CATALOG);

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Plans</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Read-only view of the server plan catalog. Commercial changes require code + env updates.
        </p>
      </header>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">Active plans ({activePlans.length})</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {activePlans.map((plan) => (
            <article key={plan.code} className="rounded-xl border border-[var(--border)] p-5">
              <h3 className="font-semibold">
                {plan.displayName}{" "}
                <span className="text-sm font-normal text-[var(--muted)]">({plan.code})</span>
              </h3>
              <p className="mt-2 text-sm text-[var(--muted)]">{plan.description}</p>
              <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <dt className="text-[var(--muted)]">Projects</dt>
                  <dd>{plan.maxProjects}</dd>
                </div>
                <div>
                  <dt className="text-[var(--muted)]">Images / project</dt>
                  <dd>{plan.maxImagesPerProject}</dd>
                </div>
                <div>
                  <dt className="text-[var(--muted)]">Original storage</dt>
                  <dd>{formatByteSize(plan.maxOriginalStorageBytes, locale)}</dd>
                </div>
                <div>
                  <dt className="text-[var(--muted)]">Generated storage</dt>
                  <dd>{formatByteSize(plan.maxGeneratedStorageBytes, locale)}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Full catalog ({allPlans.length})</h2>
        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-slate-50">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3">Monthly env key</th>
              </tr>
            </thead>
            <tbody>
              {allPlans.map((plan) => (
                <tr key={plan.code} className="border-b last:border-0">
                  <td className="px-4 py-3 font-mono text-xs">{plan.code}</td>
                  <td className="px-4 py-3">{plan.displayName}</td>
                  <td className="px-4 py-3">{plan.active ? "yes" : "no"}</td>
                  <td className="px-4 py-3 font-mono text-xs">{plan.monthlyPriceEnvKey ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

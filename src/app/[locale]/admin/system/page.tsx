import {setRequestLocale} from "next-intl/server";
import {buildFullHealth} from "@/server/health/probes";
import {isAppLocale} from "@/server/auth/validation";

export const metadata = {title: "Admin · System"};

type PageProps = {params: Promise<{locale: string}>};

export default async function AdminSystemPage({params}: PageProps) {
  const {locale: rawLocale} = await params;
  const locale = isAppLocale(rawLocale) ? rawLocale : "en";
  setRequestLocale(locale);

  let health: Awaited<ReturnType<typeof buildFullHealth>>;
  try {
    health = await buildFullHealth();
  } catch (err) {
    console.error("[admin] buildFullHealth failed", err instanceof Error ? err.message : err);
    health = {
      status: "fail",
      checkedAt: new Date().toISOString(),
      probes: {
        error: {
          status: "fail",
          latencyMs: 0,
          detail: "Health probes unavailable",
        },
      },
    };
  }

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">System</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Health probes (no secrets). Checked at {health.checkedAt}.
        </p>
      </header>

      <div className="mb-4 rounded-lg border border-[var(--border)] px-4 py-3 text-sm">
        Overall status:{" "}
        <span className="font-semibold uppercase">{health.status}</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-slate-50">
            <tr>
              <th className="px-4 py-3">Probe</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Latency</th>
              <th className="px-4 py-3">Detail</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(health.probes).map(([name, probe]) => (
              <tr key={name} className="border-b last:border-0">
                <td className="px-4 py-3 font-mono text-xs">{name}</td>
                <td className="px-4 py-3">{probe.status}</td>
                <td className="px-4 py-3">{probe.latencyMs} ms</td>
                <td className="px-4 py-3">{probe.detail ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

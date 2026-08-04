import {setRequestLocale} from "next-intl/server";
import {Link} from "@/i18n/navigation";

type PageProps = {params: Promise<{locale: string; projectId: string}>};

/** Phase 1 stub — activity page placeholder. */
export default async function ProjectActivityPage({params}: PageProps) {
  const {locale, projectId} = await params;
  setRequestLocale(locale);
  return (
    <main className="p-6">
      <p>Activity feed is temporarily unavailable.</p>
      <Link href={`/dashboard/projects/${projectId}`}>Back to project</Link>
    </main>
  );
}

"use client";

import {useLocale, useTranslations} from "next-intl";
import {archiveProjectAction, restoreProjectAction} from "@/server/projects/actions";

type Props = {
  projectId: string;
  status: "active" | "archived";
};

export function ProjectStatusActions({projectId, status}: Props) {
  const t = useTranslations("projects");
  const locale = useLocale();

  if (status === "active") {
    return (
      <form action={archiveProjectAction}>
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="projectId" value={projectId} />
        <button
          type="submit"
          className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
          onClick={(event) => {
            if (!window.confirm(t("confirmArchive"))) event.preventDefault();
          }}
        >
          {t("archive")}
        </button>
      </form>
    );
  }

  return (
    <form action={restoreProjectAction}>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="projectId" value={projectId} />
      <button type="submit" className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm">
        {t("restore")}
      </button>
    </form>
  );
}

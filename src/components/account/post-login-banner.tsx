"use client";

import {useEffect, useState} from "react";
import {useTranslations} from "next-intl";

const FLAG = "seoimages_post_login_banner_seen";

export function PostLoginBanner({signedIn}: {signedIn: boolean}) {
  const t = useTranslations("account.banner");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!signedIn) return;
    try {
      if (sessionStorage.getItem(FLAG) === "1") return;
      sessionStorage.setItem(FLAG, "1");
      setVisible(true);
    } catch {
      setVisible(true);
    }
  }, [signedIn]);

  if (!visible) return null;

  return (
    <div
      className="border-b border-[var(--border)] bg-[var(--accent-soft)] px-4 py-3 text-sm text-[var(--foreground)]"
      role="status"
    >
      <div className="marketing-container flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p>
          {t("signedIn")} {t("reselect")}
        </p>
        <button
          type="button"
          className="shrink-0 rounded-lg border border-[var(--border)] bg-white px-3 py-1.5 text-xs font-medium"
          onClick={() => setVisible(false)}
        >
          {t("dismiss")}
        </button>
      </div>
    </div>
  );
}

"use client";

import {useActionState, useState} from "react";
import {useTranslations} from "next-intl";
import {getCloudinaryDeliveryUrlAction, type CloudinaryActionState} from "@/server/cloudinary/actions";

const initial: CloudinaryActionState = {ok: false};

/** Fixed preset list — mirrors `ALL_TRANSFORMATION_PRESETS` in `server/cloudinary/policy.ts`. */
const PRESET_OPTIONS = ["original", "thumbnail", "small", "medium", "large"] as const;
type PresetOption = (typeof PRESET_OPTIONS)[number];

export type DeliveryLinkMapping = {
  id: string;
  remotePublicId: string;
  deliveryType: "upload" | "private" | "authenticated" | "signed";
  secureUrlSafe: string | null;
};

/**
 * Safe delivery link for an already-published Cloudinary asset. The
 * browser never talks to Cloudinary directly — every non-default preset URL
 * is fetched (and, for `signed` delivery, freshly signed) via the
 * `getCloudinaryDeliveryUrlAction` server action.
 */
export function DeliveryLink({mapping}: {mapping: DeliveryLinkMapping}) {
  const t = useTranslations("cloudinary");
  const tErr = useTranslations("cloudinary.errors");
  const [state, action, pending] = useActionState(getCloudinaryDeliveryUrlAction, initial);
  const [preset, setPreset] = useState<PresetOption>("original");

  function msg(code?: string) {
    if (!code) return null;
    try {
      return tErr(code as "INTERNAL_ERROR");
    } catch {
      return tErr("INTERNAL_ERROR");
    }
  }

  return (
    <div className="rounded-xl border border-[var(--border)] p-3 text-sm">
      <p className="text-xs uppercase tracking-wide text-[var(--muted)]">{t("deliveryLinkTitle")}</p>
      <p className="mt-1 break-all font-mono text-xs">{mapping.remotePublicId}</p>
      <p className="mt-1 text-xs text-[var(--muted)]">
        {t(`deliveryTypeValues.${mapping.deliveryType}` as "deliveryTypeValues.upload")}
      </p>
      {mapping.secureUrlSafe ? (
        <a
          href={mapping.secureUrlSafe}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block break-all text-xs font-medium text-[var(--accent)] underline"
        >
          {t("deliveryLinkOpenDefault")}
        </a>
      ) : null}

      <form action={action} className="mt-3 flex flex-wrap items-center gap-2">
        <input type="hidden" name="mappingId" value={mapping.id} />
        <select
          name="preset"
          value={preset}
          onChange={(e) => setPreset(e.target.value as PresetOption)}
          disabled={pending}
          className="rounded-lg border border-[var(--border)] px-2 py-1.5 text-xs"
        >
          {PRESET_OPTIONS.map((p) => (
            <option key={p} value={p}>
              {t(`transformationPresetLabels.${p}` as "transformationPresetLabels.original")}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-xs font-medium hover:bg-gray-50 disabled:opacity-60"
        >
          {pending ? t("deliveryLinkFetching") : t("deliveryLinkFetch")}
        </button>
      </form>

      {state.error ? (
        <p role="alert" className="mt-2 text-xs text-red-700">
          {msg(state.error)}
        </p>
      ) : null}
      {state.ok && state.delivery ? (
        <a
          href={state.delivery.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 block break-all text-xs font-medium text-[var(--accent)] underline"
        >
          {state.delivery.url}
        </a>
      ) : null}
    </div>
  );
}

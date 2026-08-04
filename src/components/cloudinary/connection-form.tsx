"use client";

import {useActionState, useEffect, useRef, useState} from "react";
import {useLocale, useTranslations} from "next-intl";
import {Link} from "@/i18n/navigation";
import {
  acknowledgeCloudinaryPublicDeliveryAction,
  createCloudinaryConnectionAction,
  type CloudinaryActionState,
} from "@/server/cloudinary/actions";

const initial: CloudinaryActionState = {ok: false};

type ConnectionFormProps = {
  workspaceType: "personal" | "organization";
  workspaceId: string;
};

/**
 * Create-connection form. Mirrors `components/webflow/connection-form.tsx`.
 * The API secret is a write-only password field — it is never repopulated,
 * not even right after a successful save. `upload` (public) delivery
 * requires an explicit acknowledgement checkbox before the form can submit;
 * once the connection is created, that acknowledgement is recorded via a
 * follow-up server action call (never a call to Cloudinary from the browser).
 */
export function ConnectionForm({workspaceType, workspaceId}: ConnectionFormProps) {
  const t = useTranslations("cloudinary");
  const tErr = useTranslations("cloudinary.errors");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState(createCloudinaryConnectionAction, initial);
  const [ackState, ackAction] = useActionState(acknowledgeCloudinaryPublicDeliveryAction, initial);
  const formRef = useRef<HTMLFormElement>(null);
  const lastConnectionId = useRef<string | undefined>(undefined);
  const [deliveryType, setDeliveryType] = useState<"upload" | "signed">("upload");
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    if (state.ok && state.connection && state.connection.id !== lastConnectionId.current) {
      lastConnectionId.current = state.connection.id;
      if (state.connection.defaultDeliveryType === "upload" && acknowledged) {
        const fd = new FormData();
        fd.set("locale", locale);
        fd.set("workspaceType", workspaceType);
        fd.set("workspaceId", workspaceId);
        fd.set("connectionId", state.connection.id);
        ackAction(fd);
      }
      formRef.current?.reset();
      setAcknowledged(false);
      setDeliveryType("upload");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.ok, state.connection]);

  function msg(code?: string) {
    if (!code) return null;
    try {
      return tErr(code as "INTERNAL_ERROR");
    } catch {
      return tErr("INTERNAL_ERROR");
    }
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-4 rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm"
      noValidate
    >
      <h2 className="text-lg font-semibold">{t("createTitle")}</h2>
      <p className="text-sm text-[var(--muted)]">{t("createHint")}</p>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="workspaceType" value={workspaceType} />
      <input type="hidden" name="workspaceId" value={workspaceId} />

      {state.error && !state.fieldErrors ? (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {msg(state.error)}
        </div>
      ) : null}

      {state.ok && state.connection ? (
        <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {t("createdNotice")}{" "}
          <Link href={`/dashboard/settings/integrations/cloudinary/${state.connection.id}`} className="font-medium underline">
            {t("viewDetails")}
          </Link>
        </div>
      ) : null}

      <div>
        <label htmlFor="cloudinary-name" className="mb-1.5 block text-sm font-medium">
          {t("name")}
        </label>
        <input
          id="cloudinary-name"
          name="name"
          required
          maxLength={120}
          disabled={pending}
          placeholder={t("namePlaceholder")}
          className="w-full rounded-xl border border-[var(--border)] px-3 py-2.5"
        />
        {state.fieldErrors?.name ? <p className="mt-1 text-sm text-red-700">{msg(state.fieldErrors.name)}</p> : null}
      </div>

      <div>
        <label htmlFor="cloudinary-cloud-name" className="mb-1.5 block text-sm font-medium">
          {t("cloudName")}
        </label>
        <input
          id="cloudinary-cloud-name"
          name="cloudName"
          required
          maxLength={200}
          disabled={pending}
          placeholder={t("cloudNamePlaceholder")}
          className="w-full rounded-xl border border-[var(--border)] px-3 py-2.5"
        />
        <p className="mt-1 text-xs text-[var(--muted)]">{t("cloudNameHint")}</p>
        {state.fieldErrors?.cloudName ? (
          <p className="mt-1 text-sm text-red-700">{msg(state.fieldErrors.cloudName)}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="cloudinary-api-key" className="mb-1.5 block text-sm font-medium">
          {t("apiKey")}
        </label>
        <input
          id="cloudinary-api-key"
          name="apiKey"
          type="password"
          required
          maxLength={200}
          autoComplete="new-password"
          disabled={pending}
          placeholder={t("apiKeyPlaceholder")}
          className="w-full rounded-xl border border-[var(--border)] px-3 py-2.5"
        />
        {state.fieldErrors?.apiKey ? <p className="mt-1 text-sm text-red-700">{msg(state.fieldErrors.apiKey)}</p> : null}
      </div>

      <div>
        <label htmlFor="cloudinary-api-secret" className="mb-1.5 block text-sm font-medium">
          {t("apiSecret")}
        </label>
        <input
          id="cloudinary-api-secret"
          name="apiSecret"
          type="password"
          required
          maxLength={500}
          autoComplete="new-password"
          disabled={pending}
          placeholder={t("apiSecretPlaceholder")}
          className="w-full rounded-xl border border-[var(--border)] px-3 py-2.5"
        />
        <p className="mt-1 text-xs text-[var(--muted)]">{t("apiSecretNeverShown")}</p>
        {state.fieldErrors?.apiSecret ? (
          <p className="mt-1 text-sm text-red-700">{msg(state.fieldErrors.apiSecret)}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="cloudinary-folder" className="mb-1.5 block text-sm font-medium">
          {t("defaultFolder")}
        </label>
        <input
          id="cloudinary-folder"
          name="defaultFolder"
          maxLength={200}
          disabled={pending}
          defaultValue="seo-tool"
          placeholder={t("defaultFolderPlaceholder")}
          className="w-full rounded-xl border border-[var(--border)] px-3 py-2.5"
        />
        <p className="mt-1 text-xs text-[var(--muted)]">{t("defaultFolderHint")}</p>
      </div>

      <div>
        <span className="mb-1.5 block text-sm font-medium">{t("deliveryType")}</span>
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm">
            <input
              type="radio"
              name="defaultDeliveryType"
              value="upload"
              checked={deliveryType === "upload"}
              onChange={() => setDeliveryType("upload")}
              disabled={pending}
            />
            {t("deliveryTypeUpload")}
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm">
            <input
              type="radio"
              name="defaultDeliveryType"
              value="signed"
              checked={deliveryType === "signed"}
              onChange={() => {
                setDeliveryType("signed");
                setAcknowledged(false);
              }}
              disabled={pending}
            />
            {t("deliveryTypeSigned")}
          </label>
        </div>
        <p className="mt-1 text-xs text-[var(--muted)]">
          {deliveryType === "upload" ? t("deliveryTypeUploadHint") : t("deliveryTypeSignedHint")}
        </p>
      </div>

      {deliveryType === "upload" ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
          <label className="flex items-start gap-2 text-sm text-amber-900">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              disabled={pending}
              className="mt-0.5"
            />
            <span>{t("publicDeliveryAcknowledgement")}</span>
          </label>
        </div>
      ) : null}

      <p className="text-xs text-[var(--muted)]">{t("r2SourceOfTruthNote")}</p>

      <button
        type="submit"
        disabled={pending || (deliveryType === "upload" && !acknowledged)}
        className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? t("connecting") : t("connect")}
      </button>
      {ackState.error ? (
        <p role="alert" className="text-sm text-red-700">
          {msg(ackState.error)}
        </p>
      ) : null}
    </form>
  );
}

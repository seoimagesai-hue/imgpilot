"use client";

import {useActionState, useEffect, useState} from "react";
import {useTranslations} from "next-intl";
import {searchWebflowCollectionItemsAction, type WebflowActionState} from "@/server/webflow/actions";

const initial: WebflowActionState = {ok: false};

export type WebflowCmsItemOption = {
  id: string;
  title: string;
};

type CmsItemSearchProps = {
  connectionId: string;
  collectionId: string;
  workspaceType: "personal" | "organization";
  workspaceId: string;
  selected: WebflowCmsItemOption | null;
  onSelect: (item: WebflowCmsItemOption | null) => void;
  disabled?: boolean;
};

/**
 * Search + select an EXISTING Webflow CMS collection item by name. This never
 * talks to Webflow from the browser — every search goes through
 * `searchWebflowCollectionItemsAction`, a server action that decrypts the
 * connection's site access token server-side only. Publishing only ever
 * updates the fields on the item chosen here — it never creates new items.
 */
export function CmsItemSearch({
  connectionId,
  collectionId,
  workspaceType,
  workspaceId,
  selected,
  onSelect,
  disabled,
}: CmsItemSearchProps) {
  const t = useTranslations("webflow.cmsItemSearch");
  const tErr = useTranslations("webflow.errors");
  const [query, setQuery] = useState("");
  const [state, searchAction, pending] = useActionState(searchWebflowCollectionItemsAction, initial);

  useEffect(() => {
    setQuery("");
    onSelect(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionId]);

  function msg(code?: string) {
    if (!code) return null;
    try {
      return tErr(code as "INTERNAL_ERROR");
    } catch {
      return tErr("INTERNAL_ERROR");
    }
  }

  function handleSearch() {
    if (!collectionId) return;
    const formData = new FormData();
    formData.set("connectionId", connectionId);
    formData.set("collectionId", collectionId);
    formData.set("workspaceType", workspaceType);
    formData.set("workspaceId", workspaceId);
    formData.set("query", query);
    searchAction(formData);
  }

  if (!collectionId) {
    return <p className="text-sm text-[var(--muted)]">{t("selectCollectionFirst")}</p>;
  }

  if (selected) {
    return (
      <div>
        <span className="mb-1.5 block text-sm font-medium">{t("label")}</span>
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--border)] bg-gray-50 px-3 py-2.5">
          <span className="text-sm font-medium">
            {t("selected")}: {selected.title}
          </span>
          <button
            type="button"
            onClick={() => onSelect(null)}
            disabled={disabled}
            className="rounded-lg border border-[var(--border)] bg-white px-2.5 py-1.5 text-xs font-medium hover:bg-gray-50 disabled:opacity-60"
          >
            {t("change")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label htmlFor="webflow-cms-item-search" className="mb-1.5 block text-sm font-medium">
        {t("label")}
      </label>
      <p className="mb-2 text-xs text-[var(--muted)]">{t("hint")}</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="webflow-cms-item-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={disabled || pending}
          placeholder={t("placeholder")}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSearch();
            }
          }}
          className="w-full rounded-xl border border-[var(--border)] px-3 py-2.5 text-sm"
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={disabled || pending}
          className="rounded-xl border border-[var(--border)] px-3 py-2.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-60"
        >
          {pending ? t("searching") : t("search")}
        </button>
      </div>

      {state.error ? (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {msg(state.error)}
        </p>
      ) : null}

      {state.ok && state.items ? (
        state.items.length === 0 ? (
          <p role="status" className="mt-2 text-sm text-[var(--muted)]">
            {t("empty")}
          </p>
        ) : (
          <ul className="mt-2 max-h-64 overflow-y-auto rounded-xl border border-[var(--border)]" role="listbox">
            {state.items.map((item) => (
              <li key={item.itemId} className="border-b border-[var(--border)] last:border-b-0">
                <button
                  type="button"
                  role="option"
                  aria-selected="false"
                  onClick={() => onSelect({id: item.itemId, title: item.nameSafe || item.itemId})}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-start text-sm hover:bg-gray-50"
                >
                  <span className="truncate">{item.nameSafe || item.itemId}</span>
                  {item.isDraft || item.isArchived ? (
                    <span className="shrink-0 text-xs text-[var(--muted)]">
                      {item.isDraft ? t("draft") : t("archived")}
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        )
      ) : null}
    </div>
  );
}

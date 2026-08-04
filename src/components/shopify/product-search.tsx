"use client";

import {useActionState, useState} from "react";
import {useTranslations} from "next-intl";
import {searchShopifyProductsAction, type ShopifyActionState} from "@/server/shopify/actions";

const initial: ShopifyActionState = {ok: false};

export type ShopifyProductOption = {
  id: string;
  title: string;
};

type ProductSearchProps = {
  connectionId: string;
  workspaceType: "personal" | "organization";
  workspaceId: string;
  selected: ShopifyProductOption | null;
  onSelect: (product: ShopifyProductOption | null) => void;
  disabled?: boolean;
};

/**
 * Search + select an EXISTING Shopify product by title. This never talks to
 * Shopify from the browser — every search goes through `searchShopifyProductsAction`,
 * a server action that decrypts the connection's access token server-side only.
 */
export function ProductSearch({connectionId, workspaceType, workspaceId, selected, onSelect, disabled}: ProductSearchProps) {
  const t = useTranslations("shopify.publish");
  const tErr = useTranslations("shopify.errors");
  const [query, setQuery] = useState("");
  const [state, searchAction, pending] = useActionState(searchShopifyProductsAction, initial);

  function msg(code?: string) {
    if (!code) return null;
    try {
      return tErr(code as "INTERNAL_ERROR");
    } catch {
      return tErr("INTERNAL_ERROR");
    }
  }

  function handleSearch() {
    const formData = new FormData();
    formData.set("connectionId", connectionId);
    formData.set("workspaceType", workspaceType);
    formData.set("workspaceId", workspaceId);
    formData.set("query", query);
    searchAction(formData);
  }

  if (selected) {
    return (
      <div>
        <span className="mb-1.5 block text-sm font-medium">{t("productSearchLabel")}</span>
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--border)] bg-gray-50 px-3 py-2.5">
          <span className="text-sm font-medium">{t("productSelected")}: {selected.title}</span>
          <button
            type="button"
            onClick={() => onSelect(null)}
            disabled={disabled}
            className="rounded-lg border border-[var(--border)] bg-white px-2.5 py-1.5 text-xs font-medium hover:bg-gray-50 disabled:opacity-60"
          >
            {t("productSearchChange")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label htmlFor="shopify-product-search" className="mb-1.5 block text-sm font-medium">
        {t("productSearchLabel")}
      </label>
      <p className="mb-2 text-xs text-[var(--muted)]">{t("productSearchHint")}</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="shopify-product-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={disabled || pending}
          placeholder={t("productSearchPlaceholder")}
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

      {state.ok && state.products ? (
        state.products.length === 0 ? (
          <p role="status" className="mt-2 text-sm text-[var(--muted)]">
            {t("productSearchEmpty")}
          </p>
        ) : (
          <ul className="mt-2 max-h-64 overflow-y-auto rounded-xl border border-[var(--border)]" role="listbox">
            {state.products.map((product) => (
              <li key={product.productId} className="border-b border-[var(--border)] last:border-b-0">
                <button
                  type="button"
                  role="option"
                  aria-selected="false"
                  onClick={() => onSelect({id: product.productId, title: product.titleSafe || product.productId})}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-start text-sm hover:bg-gray-50"
                >
                  <span className="truncate">{product.titleSafe || product.productId}</span>
                  {product.statusSafe ? (
                    <span className="shrink-0 text-xs text-[var(--muted)]">{product.statusSafe}</span>
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

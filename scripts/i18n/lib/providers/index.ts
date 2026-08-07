import fs from "node:fs";
import {GLOSSARY_PATH} from "../paths";
import {createBlockedProvider} from "./blocked";
import {createDeepLProvider} from "./deepl";
import {createGoogleCloudProvider} from "./google-cloud";
import {createGtxProvider} from "./gtx";
import {createOpenAIProvider} from "./openai";
import type {TranslationProvider} from "./types";

function loadDoNotTranslate(): string[] {
  try {
    const raw = JSON.parse(fs.readFileSync(GLOSSARY_PATH, "utf8")) as {
      doNotTranslate?: string[];
    };
    return raw.doNotTranslate || [];
  } catch {
    return [];
  }
}

/**
 * Resolve translation provider (CLI-only — never imported from client bundles).
 * Priority: OPENAI → DeepL → Google Cloud → optional public GTX bootstrap → Blocked.
 */
export function resolveProvider(): TranslationProvider {
  const openai = (process.env.OPENAI_API_KEY || "").trim();
  if (openai) return createOpenAIProvider(openai);

  const deepl = (process.env.DEEPL_API_KEY || "").trim();
  if (deepl) return createDeepLProvider(deepl);

  const google = (process.env.GOOGLE_TRANSLATE_API_KEY || "").trim();
  if (google) return createGoogleCloudProvider(google);

  if ((process.env.I18N_ALLOW_PUBLIC_MT || "").trim() === "1") {
    return createGtxProvider(loadDoNotTranslate());
  }

  return createBlockedProvider();
}

export type {TranslationProvider, TranslationBatch, TranslationBatchResult} from "./types";

/**
 * Guest AI alt-text provider adapter.
 * Reuses OpenAI Chat Completions + prepareAnalysisImage.
 * Responses API is not implemented in this repo — single Completions path only.
 */
import OpenAI from "openai";
import {getServerEnv} from "@/lib/env";
import {AI_REQUEST_TIMEOUT_MS} from "@/server/images/ai-metadata-policy";
import {prepareAnalysisImage} from "@/server/images/ai-analysis-image";
import {
  getAiConfigStatus,
  isAiConfigured,
  type AiConfigStatus,
} from "@/server/images/ai-provider";
import {buildGuestAiAltPrompt} from "@/server/guest/ai-alt-prompt";
import {
  normalizeGuestAiStructured,
  type GuestAiAltOptions,
  type GuestAiStructuredResult,
} from "@/server/guest/ai-alt-policy";

export type GuestAiProviderResult = {
  result: GuestAiStructuredResult;
  model: string;
  promptVersion: string;
};

export function getGuestAiPublicStatus(): {
  configured: boolean;
  provider: "openai" | null;
} {
  const status = getAiConfigStatus();
  if (!status.configured) return {configured: false, provider: null};
  return {configured: true, provider: "openai"};
}

export {isAiConfigured, getAiConfigStatus};
export type {AiConfigStatus};

/**
 * Generate structured guest AI metadata. Throws Error with message codes
 * used by the guest service mapper (NOT_CONFIGURED | TIMEOUT | RATE_LIMITED |
 * PROVIDER_UNAVAILABLE | RESPONSE_INVALID).
 */
export async function generateGuestAiAltText(params: {
  imageBytes: Buffer;
  options: GuestAiAltOptions;
}): Promise<GuestAiProviderResult> {
  const status = getAiConfigStatus();
  if (!status.configured) {
    throw new Error("NOT_CONFIGURED");
  }

  const env = getServerEnv();
  const analysis = await prepareAnalysisImage(params.imageBytes);
  const prompt = buildGuestAiAltPrompt({
    purpose: params.options.purpose,
    language: params.options.outputLanguage,
  });

  const client = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
    timeout: AI_REQUEST_TIMEOUT_MS,
  });
  const b64 = analysis.bytes.toString("base64");

  try {
    const response = await client.chat.completions.create({
      model: status.model,
      temperature: 0.2,
      response_format: {type: "json_object"},
      messages: [
        {role: "system", content: prompt.system},
        {
          role: "user",
          content: [
            {type: "text", text: prompt.user},
            {
              type: "image_url",
              image_url: {url: `data:${analysis.mimeType};base64,${b64}`},
            },
          ],
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("RESPONSE_INVALID");
    let json: unknown;
    try {
      json = JSON.parse(content);
    } catch {
      throw new Error("RESPONSE_INVALID");
    }
    const result = normalizeGuestAiStructured(json);
    return {
      result,
      model: status.model,
      promptVersion: prompt.promptVersion,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message === "NOT_CONFIGURED" ||
        error.message === "RESPONSE_INVALID" ||
        error.message === "RESULT_TOO_LARGE"
      ) {
        throw error;
      }
      if (/timeout|timed out/i.test(error.message)) throw new Error("TIMEOUT");
      if (/429|rate.?limit/i.test(error.message)) throw new Error("RATE_LIMITED");
    }
    throw new Error("PROVIDER_UNAVAILABLE");
  }
}

/** Test seam — run normalization without network. */
export function normalizeGuestAiAltForTest(raw: unknown): GuestAiStructuredResult {
  return normalizeGuestAiStructured(raw);
}

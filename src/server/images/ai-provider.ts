/**
 * AI provider abstraction — Prompt 17.
 * Only OpenAI is implemented; no SDK leakage into routes/UI.
 */
import OpenAI from "openai";
import {getServerEnv} from "@/lib/env";
import {AI_REQUEST_TIMEOUT_MS} from "@/server/images/ai-metadata-policy";
import {AiDomainError} from "@/server/images/ai-errors";
import {buildMetadataPrompt, type MetadataPromptContext} from "@/server/images/ai-metadata-prompt";
import {
  validateStructuredMetadata,
  type MetadataStructuredOutput,
} from "@/server/images/ai-metadata-schema";
import type {AnalysisImage} from "@/server/images/ai-analysis-image";

export type MetadataGenerationInput = {
  analysis: AnalysisImage;
  context: MetadataPromptContext;
};

export type MetadataGenerationResult = {
  output: MetadataStructuredOutput;
  provider: string;
  model: string;
  promptVersion: string;
  inputTokens: number | null;
  outputTokens: number | null;
  requestId: string | null;
};

export interface ImageMetadataProvider {
  generateMetadata(input: MetadataGenerationInput): Promise<MetadataGenerationResult>;
}

export type AiConfigStatus =
  | {configured: true; provider: "openai"; model: string}
  | {configured: false; reason: "AI_NOT_CONFIGURED" | "AI_PROVIDER_UNAVAILABLE"};

export function getAiConfigStatus(env = getServerEnv()): AiConfigStatus {
  const provider = env.AI_PROVIDER;
  if (!provider) return {configured: false, reason: "AI_NOT_CONFIGURED"};
  if (provider === "openai") {
    if (!env.OPENAI_API_KEY) return {configured: false, reason: "AI_NOT_CONFIGURED"};
    return {
      configured: true,
      provider: "openai",
      model: process.env.AI_MODEL?.trim() || "gpt-4o-mini",
    };
  }
  // gemini listed in env but not implemented in Prompt 17
  if (provider === "gemini") {
    if (!env.GEMINI_API_KEY) return {configured: false, reason: "AI_NOT_CONFIGURED"};
    return {configured: false, reason: "AI_PROVIDER_UNAVAILABLE"};
  }
  return {configured: false, reason: "AI_NOT_CONFIGURED"};
}

export function isAiConfigured(): boolean {
  return getAiConfigStatus().configured;
}

class OpenAiMetadataProvider implements ImageMetadataProvider {
  constructor(
    private readonly apiKey: string,
    private readonly model: string,
  ) {}

  async generateMetadata(input: MetadataGenerationInput): Promise<MetadataGenerationResult> {
    const client = new OpenAI({apiKey: this.apiKey, timeout: AI_REQUEST_TIMEOUT_MS});
    const prompt = buildMetadataPrompt(input.context);
    const b64 = input.analysis.bytes.toString("base64");

    try {
      const response = await client.chat.completions.create({
        model: this.model,
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
                image_url: {url: `data:${input.analysis.mimeType};base64,${b64}`},
              },
            ],
          },
        ],
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new AiDomainError("AI_RESPONSE_INVALID");
      let json: unknown;
      try {
        json = JSON.parse(content);
      } catch {
        throw new AiDomainError("AI_RESPONSE_INVALID");
      }
      if (typeof json === "object" && json && !("language" in json)) {
        (json as {language: string}).language = input.context.language;
      }
      const output = validateStructuredMetadata(json);
      if (output.language !== input.context.language) {
        output.language = input.context.language;
      }
      return {
        output,
        provider: "openai",
        model: this.model,
        promptVersion: prompt.promptVersion,
        inputTokens: response.usage?.prompt_tokens ?? null,
        outputTokens: response.usage?.completion_tokens ?? null,
        requestId: response.id ?? null,
      };
    } catch (error) {
      if (error instanceof AiDomainError) throw error;
      const message = error instanceof Error ? error.message : "";
      if (/timeout|timed out/i.test(message)) throw new AiDomainError("AI_REQUEST_TIMEOUT");
      if (/429|rate.?limit/i.test(message)) throw new AiDomainError("AI_RATE_LIMITED");
      throw new AiDomainError("AI_PROVIDER_UNAVAILABLE");
    }
  }
}

export function getImageMetadataProvider(): ImageMetadataProvider {
  const status = getAiConfigStatus();
  if (!status.configured) {
    throw new AiDomainError(status.reason);
  }
  const env = getServerEnv();
  return new OpenAiMetadataProvider(env.OPENAI_API_KEY, status.model);
}

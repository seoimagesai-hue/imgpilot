/**
 * Prompt 31 — sync batch item counters when a child metadata generation reaches terminal state.
 */
import {syncAiMetadataBatchItemFromGeneration} from "@/server/images/ai-metadata-batch-service";

export async function syncAiMetadataBatchFromGenerationTerminal(params: {
  generationId: string;
  projectId: string;
  generationStatus: string;
  errorCode?: string | null;
}): Promise<void> {
  await syncAiMetadataBatchItemFromGeneration(params.generationId);
}

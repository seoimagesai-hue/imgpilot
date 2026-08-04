/** Minimal ai-metadata-quality stub for Phase 1 typecheck. */

export type MetadataQualityScore = {
  overall: number;
  altText: number;
  title: number;
  description: number;
  filenameSuggestion: number;
};

export function scoreMetadataFields(_fields: {
  altText?: string | null;
  title?: string | null;
  caption?: string | null;
  description?: string | null;
  filenameSuggestion?: string | null;
  originalFilename?: string | null;
}): MetadataQualityScore {
  return {
    overall: 0,
    altText: 0,
    title: 0,
    description: 0,
    filenameSuggestion: 0,
  };
}

export function isLowQuality(score: MetadataQualityScore): boolean {
  return score.overall < 50;
}

/** Minimal ai-metadata-duplicates stub for Phase 1 typecheck. */

export type MetadataDuplicateHit = {
  imageIds: string[];
  field: "altText" | "title" | "filenameSuggestion";
  value: string;
};

export function findMetadataDuplicates(
  _items: Array<{
    imageId: string;
    generationId: string;
    altText: string | null;
    title: string | null;
    filenameSuggestion: string | null;
  }>,
): MetadataDuplicateHit[] {
  return [];
}

export function imageIdsInDuplicates(hits: MetadataDuplicateHit[]): Set<string> {
  const ids = new Set<string>();
  for (const hit of hits) {
    for (const id of hit.imageIds) ids.add(id);
  }
  return ids;
}

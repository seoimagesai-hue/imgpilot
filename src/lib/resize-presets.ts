/** Shared resize preset ids — safe for client and server. No Sharp options here. */
export const RESIZE_PRESETS = {
  px_256: {id: "px_256", maxEdge: 256},
  px_512: {id: "px_512", maxEdge: 512},
  px_1024: {id: "px_1024", maxEdge: 1024},
  px_2048: {id: "px_2048", maxEdge: 2048},
} as const;

export type ResizePresetId = keyof typeof RESIZE_PRESETS;

export const RESIZE_PRESET_IDS = Object.keys(RESIZE_PRESETS) as ResizePresetId[];

export function isResizePresetId(value: string | null | undefined): value is ResizePresetId {
  return Boolean(value && value in RESIZE_PRESETS);
}

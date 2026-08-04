/** In-memory file handoff from homepage → tool page (same tab navigation). */
let pendingGuestFile: File | null = null;

export function setPendingGuestFile(file: File): void {
  pendingGuestFile = file;
}

export function takePendingGuestFile(): File | null {
  const file = pendingGuestFile;
  pendingGuestFile = null;
  return file;
}

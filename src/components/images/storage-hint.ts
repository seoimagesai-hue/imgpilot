/** Tiny helper so client components don't import server env modules. */
export function isR2ConfiguredClientHint(configured: boolean): string {
  return configured ? "storage-configured" : "storage-not-configured";
}

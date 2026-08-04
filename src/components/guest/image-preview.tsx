type Props = {
  src?: string | null;
  alt?: string;
};

export function ImagePreview({src, alt = ""}: Props) {
  if (!src) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className="max-h-64 w-full rounded-xl object-contain bg-[var(--muted)]"
    />
  );
}

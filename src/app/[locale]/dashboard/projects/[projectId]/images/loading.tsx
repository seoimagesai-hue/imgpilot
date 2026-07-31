export default function ImagesLoading() {
  return (
    <main className="space-y-4 p-4 sm:p-6 lg:p-8" aria-busy="true" aria-live="polite">
      <div className="h-8 w-48 animate-pulse rounded bg-[var(--border)]" />
      <div className="h-10 w-full max-w-xl animate-pulse rounded-xl bg-[var(--border)]" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({length: 8}).map((_, index) => (
          <div key={index} className="aspect-[4/3] animate-pulse rounded-2xl bg-[var(--border)]" />
        ))}
      </div>
    </main>
  );
}

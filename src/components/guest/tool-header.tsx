type Props = {
  title: string;
  description?: string;
};

export function ToolHeader({title, description}: Props) {
  return (
    <header className="mb-6 space-y-2">
      <h1 className="text-3xl font-semibold tracking-tight text-[var(--foreground)]">{title}</h1>
      {description ? (
        <p className="max-w-2xl text-[var(--muted-foreground)]">{description}</p>
      ) : null}
    </header>
  );
}

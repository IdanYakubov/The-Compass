/**
 * A streaming-style content row: section title on top, horizontally
 * scrolling cards beneath (scrollbar hidden, snap per card).
 */
export function Shelf({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline gap-3">
        <h2 className="font-serif text-xl tracking-tight">{title}</h2>
        {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
      </div>
      <div className="no-scrollbar -mx-1 flex snap-x gap-4 overflow-x-auto px-1 pb-2">
        {children}
      </div>
    </section>
  );
}

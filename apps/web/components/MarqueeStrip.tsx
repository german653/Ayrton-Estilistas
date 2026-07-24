export default function MarqueeStrip({ text }: { text: string }) {
  const repeated = Array.from({ length: 6 }, () => text).join(' · ');

  return (
    <div className="relative bg-ink text-paper py-4 overflow-hidden border-y border-brass/30" aria-hidden="true">
      <div className="flex whitespace-nowrap animate-marquee">
        <span className="font-display text-2xl sm:text-3xl tracking-widest px-4">{repeated}</span>
        <span className="font-display text-2xl sm:text-3xl tracking-widest px-4">{repeated}</span>
      </div>
    </div>
  );
}

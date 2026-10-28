const items = ["Afrobeats", "Studio Ghibli", "Air Max", "Murakami", "Nollywood", "Gilmore Girls", "Jazz", "Wes Anderson", "K-pop", "Vintage denim", "Chimamanda Adichie", "Lo-fi", "Anime", "Taylor Swift", "Street food", "Bossa nova"];

export function TasteMarquee() {
  const row = [...items, ...items];
  return (
    <div className="tt-marquee-wrap relative overflow-hidden border-y border-border bg-card/70 py-4 [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]" aria-hidden>
      <div className="tt-marquee flex w-max items-center gap-8 whitespace-nowrap">
        {row.map((t, i) => (
          <span key={i} className="flex items-center gap-8 font-heading text-xl text-foreground/80 italic sm:text-2xl">
            {t}
            <span className="size-1.5 rounded-full bg-primary" />
          </span>
        ))}
      </div>
    </div>
  );
}

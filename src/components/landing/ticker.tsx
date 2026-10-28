const lines = ["Tokyo, for a Wizkid fan", "Lisbon, for a Burna Boy fan", "New York, for a Swiftie"];

export function Ticker() {
  return (
    <span className="inline-block h-[1.4em] overflow-hidden">
      <span className="tt-ticker block">
        {[...lines, lines[0]].map((l, i) => (
          <span key={i} className="block h-[1.4em] leading-[1.4em] font-semibold text-foreground">{l}</span>
        ))}
      </span>
    </span>
  );
}

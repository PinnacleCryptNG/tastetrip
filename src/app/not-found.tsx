import Link from "next/link";
import { SplitFlap } from "@/components/landing/split-flap";
import { Logo } from "@/components/logo";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-content-center gap-6 bg-[var(--tt-primary)] px-6 text-center text-white">
      <Link href="/" className="mx-auto"><Logo tone="light" /></Link>
      <div className="mx-auto rounded-xl bg-[var(--tt-ink)] p-4 text-lg sm:text-2xl">
        <SplitFlap text="Cancelled" length={9} />
      </div>
      <h1 className="text-6xl">This trip has <span className="text-[var(--tt-accent)]">departed.</span></h1>
      <p className="mx-auto max-w-sm text-white/75">Shared trips last 180 days. This one may have expired, or the link was cut short.</p>
      <Link href="/#plan" className="mx-auto inline-flex h-12 items-center rounded-md bg-[var(--tt-accent)] px-5 font-bold text-[var(--tt-ink)] shadow-[0_6px_0_var(--tt-accent-deep)]">Plan a new one</Link>
    </main>
  );
}

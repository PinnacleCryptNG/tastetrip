import Link from "next/link";
import { SplitFlap } from "@/components/landing/split-flap";
import { Logo } from "@/components/logo";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-content-center gap-6 bg-[#2f3cff] px-6 text-center text-white">
      <Link href="/" className="mx-auto"><Logo tone="light" /></Link>
      <div className="mx-auto rounded-xl bg-[#0b0d17] p-4 text-lg sm:text-2xl">
        <SplitFlap text="Cancelled" length={9} />
      </div>
      <h1 className="text-6xl">This trip has <span className="text-[#ffd23f]">departed.</span></h1>
      <p className="mx-auto max-w-sm text-white/75">Shared trips last 180 days. This one may have expired, or the link was cut short.</p>
      <Link href="/#plan" className="mx-auto inline-flex h-12 items-center rounded-md bg-[#ffd23f] px-5 font-bold text-[#0b0d17] shadow-[0_6px_0_#c99f12]">Plan a new one</Link>
    </main>
  );
}

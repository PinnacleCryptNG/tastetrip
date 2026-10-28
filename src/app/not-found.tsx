import Link from "next/link";
import { LogoMark } from "@/components/logo";

export default function NotFound() {
  return (
    <main className="mx-auto grid min-h-dvh max-w-md place-content-center gap-4 px-6 text-center">
      <LogoMark className="mx-auto size-16" />
      <h1 className="text-4xl font-semibold">This trip has <em className="text-primary">moved on.</em></h1>
      <p className="text-muted-foreground">Shared trips last 180 days. This one may have expired, or the link was cut short.</p>
      <Link href="/#plan" className="mx-auto mt-2 inline-flex h-11 items-center rounded-full bg-foreground px-5 text-sm font-semibold text-background hover:bg-primary">Plan a new one</Link>
    </main>
  );
}

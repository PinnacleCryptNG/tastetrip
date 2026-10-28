import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto grid min-h-dvh max-w-md place-content-center gap-3 px-6 text-center">
      <h1 className="text-3xl font-extrabold">Trip not found</h1>
      <p className="text-muted-foreground">This link may have expired or never existed.</p>
      <Link href="/" className="mx-auto mt-2 rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background">Plan a new trip</Link>
    </main>
  );
}

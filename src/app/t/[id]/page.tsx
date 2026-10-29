import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TripView } from "@/components/trip/trip-view";
import { getTrip } from "@/lib/trips";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const trip = await getTrip((await params).id);
  if (!trip) return { title: "Trip not found · TasteTrip" };
  const title = `${trip.days}-day ${trip.matchedCity ?? trip.city} trip for fans of ${trip.seeds.map((s) => s.name).join(", ")}`;
  return { title: `${title} · TasteTrip`, description: trip.itinerary.flatMap((d) => d.stops.map((s) => s.name)).slice(0, 8).join(" · "), openGraph: { title, type: "article" }, twitter: { card: "summary_large_image", title } };
}

export default async function TripPage({ params }: { params: Promise<{ id: string }> }) {
  const trip = await getTrip((await params).id);
  if (!trip) notFound();
  return <TripView initial={trip} />;
}

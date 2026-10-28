import { getTrip } from "@/lib/trips";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const trip = await getTrip((await params).id);
  if (!trip) return Response.json({ error: "Trip not found" }, { status: 404 });
  return Response.json({ trip });
}

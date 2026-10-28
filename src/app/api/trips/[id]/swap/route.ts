import { z } from "zod";
import { swapStop } from "@/lib/planner";
import { friendlyQlooError } from "@/lib/qloo/client";
import { rateLimit, tooMany } from "@/lib/ratelimit";
import { canEdit, getTrip, saveTrip } from "@/lib/trips";

export const maxDuration = 60;
const Body = z.object({ day: z.number().int().min(0).max(2), stop: z.number().int().min(0).max(6) });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const rl = await rateLimit(req, "edit", 30, 600);
  if (!rl.ok) return tooMany(rl.retryAfter);
  const { id } = await params;
  if (!(await canEdit(id, req.headers.get("x-edit-key")))) return Response.json({ error: "Only the trip's creator can edit it." }, { status: 403 });
  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) return Response.json({ error: "Bad request" }, { status: 400 });
  const trip = await getTrip(id);
  if (!trip) return Response.json({ error: "Trip not found" }, { status: 404 });
  try {
    const next = await swapStop(trip, body.data.day, body.data.stop);
    await saveTrip(next);
    return Response.json({ trip: next });
  } catch (e) {
    const f = friendlyQlooError(e, trip.city);
    return Response.json({ error: f.msg, hint: f.hint }, { status: f.status });
  }
}

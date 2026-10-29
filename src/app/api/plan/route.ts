import { planTrip } from "@/lib/planner";
import { friendlyQlooError, QlooError } from "@/lib/qloo/client";
import { rateLimit, tooMany } from "@/lib/ratelimit";
import { PlanInputSchema, type PlanEvent } from "@/lib/types";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const rl = await rateLimit(req, "plan", 6, 600);
  if (!rl.ok) return tooMany(rl.retryAfter);
  const body = await req.json().catch(() => null);
  const parsed = PlanInputSchema.safeParse(body);
  if (!parsed.success)
    return Response.json({ error: "Pick a city, 1–30 days and 3–6 tastes from the suggestions." }, { status: 400 });
  const input = parsed.data;
  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (ev: PlanEvent) => controller.enqueue(enc.encode(JSON.stringify(ev) + "\n"));
      try {
        const { trip, editKey } = await planTrip(input, send);
        send({ type: "done", tripId: trip.id, editKey });
      } catch (e) {
        console.error("[plan] failed", e);
        if (e instanceof QlooError || !(e instanceof Error) || !/LLM/.test(e.message)) {
          const f = friendlyQlooError(e, input.city);
          send({ type: "error", msg: f.msg, hint: f.hint });
        } else send({ type: "error", msg: "The planner model is unavailable right now.", hint: "Try again in a minute." });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store", "X-Accel-Buffering": "no" },
  });
}

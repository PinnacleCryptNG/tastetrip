import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { kvGet, kvSet } from "./kv";
import type { Trip } from "./types";

const TRIP_TTL = 60 * 60 * 24 * 180;
const hash = (s: string) => createHash("sha256").update(s).digest("hex");

export const newEditKey = () => randomBytes(18).toString("base64url");

export async function saveTrip(trip: Trip, editKey?: string) {
  await kvSet(`tt:trip:${trip.id}`, trip, TRIP_TTL);
  if (editKey) await kvSet(`tt:trip:${trip.id}:key`, hash(editKey), TRIP_TTL);
}

export async function getTrip(id: string): Promise<Trip | null> {
  if (!/^[\w-]{6,24}$/.test(id)) return null;
  return kvGet<Trip>(`tt:trip:${id}`);
}

export async function canEdit(id: string, editKey: string | null): Promise<boolean> {
  if (!editKey) return false;
  const stored = await kvGet<string>(`tt:trip:${id}:key`);
  if (!stored) return false;
  const a = Buffer.from(stored);
  const b = Buffer.from(hash(editKey));
  return a.length === b.length && timingSafeEqual(a, b);
}

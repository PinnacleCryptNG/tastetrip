import "server-only";
import { Redis } from "@upstash/redis";
import { env } from "./env";

type MemEntry = { v: unknown; exp: number };
const g = globalThis as unknown as { __ttMem?: Map<string, MemEntry>; __ttRedis?: Redis | null };
const mem = (g.__ttMem ??= new Map());

export function redis(): Redis | null {
  if (g.__ttRedis !== undefined) return g.__ttRedis;
  const url = env.kvUrl();
  const token = env.kvToken();
  g.__ttRedis = url && token ? new Redis({ url, token }) : null;
  if (!g.__ttRedis) console.warn("[kv] KV_REST_API_URL/TOKEN not set: using in-memory store (dev only)");
  return g.__ttRedis;
}

export async function kvGet<T>(key: string): Promise<T | null> {
  const r = redis();
  if (r) return (await r.get<T>(key)) ?? null;
  const e = mem.get(key);
  if (!e) return null;
  if (e.exp && e.exp < Date.now()) {
    mem.delete(key);
    return null;
  }
  return e.v as T;
}

export async function kvSet(key: string, value: unknown, ttlSec?: number): Promise<void> {
  const r = redis();
  if (r) {
    if (ttlSec) await r.set(key, value, { ex: ttlSec });
    else await r.set(key, value);
    return;
  }
  mem.set(key, { v: structuredClone(value), exp: ttlSec ? Date.now() + ttlSec * 1000 : 0 });
}

import { z } from "zod";

export const SLOTS = ["breakfast", "morning", "lunch", "afternoon", "dinner", "night"] as const;
export type Slot = (typeof SLOTS)[number];
export const SlotSchema = z.enum(SLOTS);

export const SLOT_LABEL: Record<Slot, string> = {
  breakfast: "Breakfast",
  morning: "Morning",
  lunch: "Lunch",
  afternoon: "Afternoon",
  dinner: "Dinner",
  night: "Night",
};

export const SLOT_TIME: Record<Slot, string> = {
  breakfast: "8:30",
  morning: "10:00",
  lunch: "13:00",
  afternoon: "15:00",
  dinner: "19:30",
  night: "21:30",
};

export const FOOD_SLOTS: Slot[] = ["breakfast", "lunch", "dinner", "night"];

export const TasteSeedSchema = z.object({
  entity_id: z.string().min(1).max(120),
  name: z.string().min(1).max(160),
  type: z.string().min(1).max(60),
});
export type TasteSeed = z.infer<typeof TasteSeedSchema>;

export type Explain = { seed_name: string; entity_id: string; score: number };

export type Candidate = {
  entity_id: string;
  name: string;
  address?: string;
  neighborhood?: string;
  lat?: number;
  lon?: number;
  tags: { id: string; name: string; type?: string }[];
  affinity?: number;
  popularity?: number;
  price_level?: number;
  rating?: number;
  website?: string;
  explain: { entity_id: string; score: number }[];
};

export type SlotQuery = {
  label: string;
  tagId?: string;
  tagName?: string;
  weekday?: string;
};

export type Stop = {
  slot: Slot;
  entity_id: string;
  name: string;
  address?: string;
  neighborhood?: string;
  lat?: number;
  lon?: number;
  tags: string[];
  affinity?: number;
  price_level?: number;
  rating?: number;
  website?: string;
  explain: Explain[];
  why: string;
  alternates: string[];
  query: SlotQuery;
};

export type Day = { index: number; theme: string; weekday?: string; stops: Stop[] };

export type Trip = {
  id: string;
  city: string;
  matchedCity?: string;
  days: number;
  budget?: number;
  startDate?: string;
  seeds: TasteSeed[];
  itinerary: Day[];
  candidates: Record<string, Candidate>;
  seen: string[];
  createdAt: string;
  updatedAt?: string;
  stats: { qlooCalls: number; llmCalls: number; rejected: number };
};

export type PublicTrip = Trip;

export const PlanInputSchema = z.object({
  city: z.string().trim().min(2).max(80),
  days: z.number().int().min(1).max(30),
  budget: z.number().int().min(1).max(4).optional(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  seeds: z.array(TasteSeedSchema).max(6).default([]),
});
export type PlanInput = z.infer<typeof PlanInputSchema>;

export type PlanEvent =
  | { type: "step"; id: string; tool?: string; msg: string; detail?: string; status: "run" | "ok" | "warn" }
  | { type: "error"; msg: string; hint?: string }
  | { type: "done"; tripId: string; editKey: string };

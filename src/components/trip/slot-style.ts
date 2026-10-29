import type { Slot } from "@/lib/types";

export const SLOT_COLOR: Record<Slot, string> = {
  breakfast: "var(--tt-slot-breakfast)",
  morning: "var(--tt-slot-morning)",
  lunch: "var(--tt-slot-lunch)",
  afternoon: "var(--tt-slot-afternoon)",
  dinner: "var(--tt-slot-dinner)",
  night: "var(--tt-slot-night)",
};

// Map tiles stay light in both themes, so pins use fixed colours with white numbers.
export const SLOT_PIN: Record<Slot, string> = {
  breakfast: "#b5651d",
  morning: "#1f7a5e",
  lunch: "#c8102e",
  afternoon: "#6d1a36",
  dinner: "#7a3fa0",
  night: "#1a0d12",
};

"use client";

import { LoaderCircle, Plus, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { SearchHit } from "@/lib/qloo/api";
import type { TasteSeed } from "@/lib/types";
import { cn } from "@/lib/utils";
import { TypeIcon, typeLabel } from "./icons";

export function TasteInput({ seeds, onChange, max = 6 }: { seeds: TasteSeed[]; onChange: (s: TasteSeed[]) => void; max?: number }) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const full = seeds.length >= max;

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setHits([]);
      setError(null);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: ctrl.signal });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error ?? "Search failed");
        setHits(j.hits ?? []);
        setError(null);
        setActive(0);
      } catch (e) {
        if ((e as Error).name !== "AbortError") setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  const add = (h: SearchHit) => {
    if (full || seeds.some((s) => s.entity_id === h.entity_id)) return;
    onChange([...seeds, { entity_id: h.entity_id, name: h.name, type: h.type }]);
    setQ("");
    setHits([]);
    inputRef.current?.focus();
  };

  return (
    <div className="space-y-3">
      {seeds.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {seeds.map((s) => (
            <li key={s.entity_id} className="flex items-center gap-1.5 rounded-full border border-border bg-background py-1 pr-1 pl-3 text-sm animate-in fade-in zoom-in-95">
              <TypeIcon type={s.type} className="size-3.5 text-primary" />
              <span className="max-w-[14rem] truncate font-medium">{s.name}</span>
              <button type="button" onClick={() => onChange(seeds.filter((x) => x.entity_id !== s.entity_id))} className="grid size-6 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={`Remove ${s.name}`}>
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="relative">
        <Plus className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          value={q}
          disabled={full}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (!hits.length) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => (a + 1) % hits.length);
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => (a - 1 + hits.length) % hits.length);
            } else if (e.key === "Enter") {
              e.preventDefault();
              add(hits[active]);
            }
            else if (e.key === "Escape") setOpen(false);
          }}
          placeholder={full ? `That's ${max} — perfect.` : "An artist, film, show, book or brand you love…"}
          className="h-12 w-full rounded-2xl border border-input bg-background pr-10 pl-10 text-[15px] outline-none transition placeholder:text-muted-foreground focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/12 disabled:opacity-60"
          role="combobox"
          aria-expanded={open && hits.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
        />
        {loading && <LoaderCircle className="absolute top-1/2 right-3.5 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
        {open && (hits.length > 0 || error) && (
          <ul id={listId} role="listbox" className="absolute z-30 mt-2 max-h-80 w-full overflow-auto rounded-2xl border border-border bg-popover p-1.5 shadow-xl animate-in fade-in slide-in-from-top-1">
            {error && <li className="px-3 py-2 text-sm text-destructive">{error}</li>}
            {hits.map((h, i) => {
              const picked = seeds.some((s) => s.entity_id === h.entity_id);
              return (
                <li key={h.entity_id} role="option" aria-selected={i === active}>
                  <button
                    type="button"
                    disabled={picked}
                    onMouseEnter={() => setActive(i)}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => add(h)}
                    className={cn("flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left", i === active && "bg-muted", picked && "opacity-50")}
                  >
                    {h.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={h.image} alt="" className="size-9 shrink-0 rounded-md bg-muted object-cover" />
                    ) : (
                      <span className="grid size-9 shrink-0 place-items-center rounded-md bg-secondary">
                        <TypeIcon type={h.type} className="size-4 text-primary" />
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{h.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {typeLabel(h.type)}
                        {h.subtitle ? ` · ${h.subtitle}` : ""}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

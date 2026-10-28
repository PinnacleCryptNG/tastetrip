"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import type { Stop } from "@/lib/types";
import { SLOT_COLOR } from "./slot-style";

function Fit({ pts }: { pts: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (pts.length === 1) map.setView(pts[0], 14);
    else if (pts.length > 1) map.fitBounds(L.latLngBounds(pts), { padding: [36, 36], maxZoom: 15 });
  }, [map, pts]);
  return null;
}

export default function TripMap({ stops, activeId, onSelect }: { stops: Stop[]; activeId?: string; onSelect?: (id: string) => void }) {
  const located = stops.map((s, i) => ({ s, n: i + 1 })).filter(({ s }) => s.lat != null && s.lon != null);
  const pts = useMemo(() => located.map(({ s }) => [s.lat!, s.lon!] as [number, number]), [located.map(({ s }) => s.entity_id).join()]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!located.length)
    return <div className="grid h-full place-items-center p-6 text-center text-sm text-muted-foreground">Qloo didn&apos;t return coordinates for these stops.</div>;
  return (
    <MapContainer center={pts[0]} zoom={13} scrollWheelZoom={false} className="h-full w-full">
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Polyline positions={pts} pathOptions={{ color: "#1d1a16", weight: 2, opacity: 0.45, dashArray: "4 6" }} />
      {located.map(({ s, n }) => (
        <Marker
          key={s.entity_id}
          position={[s.lat!, s.lon!]}
          zIndexOffset={s.entity_id === activeId ? 1000 : 0}
          eventHandlers={{ click: () => onSelect?.(s.entity_id) }}
          icon={L.divIcon({
            className: "",
            iconSize: [30, 30],
            iconAnchor: [4, 30],
            html: `<div class="tt-pin" style="background:${SLOT_COLOR[s.slot]};${s.entity_id === activeId ? "outline:3px solid #1d1a16;" : ""}"><span>${n}</span></div>`,
          })}
        >
          <Popup>
            <strong>{s.name}</strong>
            {s.neighborhood ? <div>{s.neighborhood}</div> : null}
          </Popup>
        </Marker>
      ))}
      <Fit pts={pts} />
    </MapContainer>
  );
}

"use client";

import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";

// Used only until a location is chosen (zoomed out over the whole country)
const DEFAULT_CENTER: [number, number] = [22.9734, 78.6569];

function Recenter({ position }: { position: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(position, Math.max(map.getZoom(), 16));
  }, [map, position]);
  return null;
}

function ClickToPick({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6)));
    },
  });
  return null;
}

type Props = {
  latitude?: number;
  longitude?: number;
  readOnly?: boolean;
  onPick?: (lat: number, lng: number) => void;
};

export default function LocationMap({ latitude, longitude, readOnly = false, onPick }: Props) {
  const position: [number, number] | null =
    typeof latitude === "number" && typeof longitude === "number" ? [latitude, longitude] : null;

  return (
    <MapContainer
      center={position ?? DEFAULT_CENTER}
      zoom={position ? 16 : 5}
      scrollWheelZoom={!readOnly}
      className="z-0 h-72 w-full rounded-lg border"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {position && (
        <>
          <CircleMarker
            center={position}
            radius={10}
            pathOptions={{ color: "#1e3a8a", fillColor: "#2563eb", fillOpacity: 0.85 }}
          />
          <Recenter position={position} />
        </>
      )}
      {!readOnly && onPick && <ClickToPick onPick={onPick} />}
    </MapContainer>
  );
}

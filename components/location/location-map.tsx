"use client";

import { useEffect } from "react";
import {
  Circle,
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";

import type { Coords } from "@/lib/geo";

import "leaflet/dist/leaflet.css";

/**
 * O Leaflet monta os ícones padrão a partir de URLs relativas ao CSS,
 * que o bundler quebra. Definimos um marcador próprio em SVG (nas cores
 * da marca) e evitamos o problema por completo.
 */
const pinIcon = L.divIcon({
  className: "",
  html: `<svg width="30" height="42" viewBox="0 0 24 34" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 22 12 22s12-13 12-22c0-6.6-5.4-12-12-12z" fill="#DA3363"/>
    <circle cx="12" cy="12" r="4.5" fill="#fff"/>
  </svg>`,
  iconSize: [30, 42],
  iconAnchor: [15, 42],
});

/** Recentraliza o mapa quando a coordenada muda por fora (campos manuais). */
function RecenterOn({ center }: { center: Coords }) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.latitude, center.longitude], map.getZoom());
  }, [center.latitude, center.longitude, map]);
  return null;
}

/** Clicar no mapa move o ponto da empresa. */
function ClickToSet({ onPick }: { onPick: (coords: Coords) => void }) {
  useMapEvents({
    click(e) {
      onPick({ latitude: e.latlng.lat, longitude: e.latlng.lng });
    },
  });
  return null;
}

interface LocationMapProps {
  center: Coords;
  radiusMeters: number;
  onPick: (coords: Coords) => void;
  /** Somente leitura: sem clique nem marcador arrastável. */
  readOnly?: boolean;
}

/** Mapa OpenStreetMap com o ponto da empresa e o círculo de cobertura. */
export default function LocationMap({
  center,
  radiusMeters,
  onPick,
  readOnly = false,
}: LocationMapProps) {
  return (
    <MapContainer
      center={[center.latitude, center.longitude]}
      zoom={16}
      scrollWheelZoom
      className="h-72 w-full rounded-lg border sm:h-96"
      // O mapa fica sob os menus e diálogos da aplicação.
      style={{ zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <RecenterOn center={center} />
      {!readOnly && <ClickToSet onPick={onPick} />}

      <Marker
        position={[center.latitude, center.longitude]}
        icon={pinIcon}
        draggable={!readOnly}
        eventHandlers={{
          dragend(e) {
            const { lat, lng } = e.target.getLatLng();
            onPick({ latitude: lat, longitude: lng });
          },
        }}
      />

      <Circle
        center={[center.latitude, center.longitude]}
        radius={radiusMeters}
        pathOptions={{
          color: "#DA3363",
          fillColor: "#DA3363",
          fillOpacity: 0.12,
          weight: 2,
        }}
      />
    </MapContainer>
  );
}

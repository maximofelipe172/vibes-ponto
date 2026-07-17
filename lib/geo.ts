/**
 * Geolocalização e geofencing.
 *
 * Módulo sem dependências de servidor: a MESMA fórmula roda no navegador
 * (para o feedback ao vivo) e no servidor (para a validação que vale).
 * Duplicar o cálculo abriria espaço para os dois discordarem — o usuário
 * veria "dentro da área" e levaria um bloqueio ao registrar.
 */

/** Raio médio da Terra, em metros. */
const EARTH_RADIUS_M = 6_371_008.8;

export interface Coords {
  latitude: number;
  longitude: number;
}

/** Limites de raio aceitos ao configurar a área da empresa. */
export const MIN_RADIUS_M = 20;
export const MAX_RADIUS_M = 5_000;

/**
 * Distância em metros entre duas coordenadas (fórmula de Haversine).
 *
 * Considera a Terra uma esfera. O erro é de ~0,3% — irrelevante para
 * raios de dezenas ou centenas de metros.
 */
export function haversineDistance(a: Coords, b: Coords): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const dLat = lat2 - lat1;
  const dLng = toRad(b.longitude - a.longitude);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** A coordenada está dentro do raio permitido? */
export function isWithinRadius(
  posicao: Coords,
  empresa: Coords,
  radiusMeters: number
): boolean {
  return haversineDistance(posicao, empresa) <= radiusMeters;
}

/** Coordenadas plausíveis? Protege contra dados forjados ou corrompidos. */
export function isValidCoords(value: unknown): value is Coords {
  if (typeof value !== "object" || value === null) return false;
  const { latitude, longitude } = value as Partial<Coords>;
  return (
    typeof latitude === "number" &&
    Number.isFinite(latitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    typeof longitude === "number" &&
    Number.isFinite(longitude) &&
    longitude >= -180 &&
    longitude <= 180
  );
}

/** "28 m" ou "1,4 km" — legível conforme a grandeza. */
export function formatDistance(meters: number): string {
  if (meters < 1_000) return `${Math.round(meters)} m`;
  return `${(meters / 1_000).toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} km`;
}

/** Link para abrir a coordenada num mapa (OpenStreetMap). */
export function mapUrl({ latitude, longitude }: Coords): string {
  return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=18/${latitude}/${longitude}`;
}

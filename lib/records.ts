import type { TimeRecord } from "@prisma/client";

import { formatDate, formatDuration, formatTime } from "@/lib/time";
import { formatDistance, mapUrl } from "@/lib/geo";
import type { PunchLocation, TimeRecordRow } from "@/types";

type RecordWithProfile = TimeRecord & { profile?: { nome: string } };

/** Monta a localização de uma batida, ou null se não foi capturada. */
function toLocation(
  lat: number | null,
  lng: number | null,
  accuracy: number | null,
  distance: number | null,
  device: string | null
): PunchLocation | null {
  if (lat === null || lng === null) return null;

  return {
    latitude: lat,
    longitude: lng,
    accuracy: accuracy !== null ? formatDistance(accuracy) : null,
    distance: distance !== null ? formatDistance(distance) : null,
    device,
    mapUrl: mapUrl({ latitude: lat, longitude: lng }),
  };
}

/** Serializa registros de ponto para exibição em tabela. */
export function toRecordRows(records: RecordWithProfile[]): TimeRecordRow[] {
  return records.map((record) => ({
    id: record.id,
    colaborador: record.profile?.nome,
    data: formatDate(record.entrada),
    entrada: formatTime(record.entrada),
    saida: record.saida ? formatTime(record.saida) : "—",
    total: formatDuration(record.entrada, record.saida),
    entradaLocal: toLocation(
      record.entradaLat,
      record.entradaLng,
      record.entradaAccuracy,
      record.entradaDistance,
      record.entradaDevice
    ),
    saidaLocal: toLocation(
      record.saidaLat,
      record.saidaLng,
      record.saidaAccuracy,
      record.saidaDistance,
      record.saidaDevice
    ),
  }));
}

/** Total de minutos trabalhados em um conjunto de registros fechados. */
export function totalMinutes(records: TimeRecord[]): number {
  return records.reduce((sum, record) => {
    if (!record.saida) return sum;
    return (
      sum +
      Math.max(
        0,
        Math.round((record.saida.getTime() - record.entrada.getTime()) / 60_000)
      )
    );
  }, 0);
}

/** "8h 15min" a partir de um total de minutos. */
export function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `${hours}h ${String(rest).padStart(2, "0")}min`;
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  LogIn,
  LogOut,
  Loader2,
  MapPin,
  MapPinOff,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

import { useGeolocation } from "@/hooks/use-geolocation";
import { formatDistance, haversineDistance } from "@/lib/geo";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ClockResponse, DayStatus } from "@/types";

interface PunchPanelProps {
  status: DayStatus;
  /** Área autorizada, ou null quando o geofencing está desligado. */
  geofence: { latitude: number; longitude: number; radiusMeters: number } | null;
}

interface PunchError {
  error?: string;
  detail?: string;
}

/**
 * Registro de ponto com validação de localização.
 *
 * A distância aqui é só para o usuário entender o que está acontecendo —
 * quem decide se o ponto vale é o servidor, que recalcula tudo.
 */
export function PunchPanel({ status, geofence }: PunchPanelProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const encerrado = status === "ENCERRADO";

  // Sem geofence (ou dia encerrado) não faz sentido acionar o GPS.
  const precisaLocal = !!geofence && !encerrado;
  const geo = useGeolocation(precisaLocal);

  const distancia =
    geofence && geo.position
      ? haversineDistance(geo.position, {
          latitude: geofence.latitude,
          longitude: geofence.longitude,
        })
      : null;

  const dentroDaArea =
    distancia !== null && geofence ? distancia <= geofence.radiusMeters : false;

  const podeRegistrar =
    !encerrado && !loading && (!precisaLocal || (geo.status === "success" && dentroDaArea));

  async function handlePunch() {
    setLoading(true);
    try {
      const res = await fetch("/api/time-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          geo.position
            ? {
                location: {
                  latitude: geo.position.latitude,
                  longitude: geo.position.longitude,
                  accuracy: geo.position.accuracy,
                },
              }
            : {}
        ),
      });
      const data = (await res.json()) as ClockResponse & PunchError;

      if (!res.ok) {
        toast.error(data.error ?? "Não foi possível registrar o ponto.", {
          description: data.detail,
        });
        return;
      }

      const hora = new Date(
        data.action === "ENTRADA" ? data.record.entrada : data.record.saida!
      ).toLocaleTimeString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        hour: "2-digit",
        minute: "2-digit",
      });

      toast.success(
        data.action === "ENTRADA"
          ? `Entrada registrada às ${hora}. Bom trabalho!`
          : `Saída registrada às ${hora}. Até amanhã!`
      );
      router.refresh();
    } catch {
      toast.error("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-stretch gap-3 sm:items-end">
      {precisaLocal && <LocationStatus geo={geo} distancia={distancia} dentro={dentroDaArea} />}

      {encerrado ? (
        <Button size="lg" disabled className="w-full sm:w-auto">
          <CheckCircle2 />
          Expediente encerrado
        </Button>
      ) : (
        <Button
          size="lg"
          onClick={handlePunch}
          disabled={!podeRegistrar}
          variant={status === "SEM_REGISTRO" ? "brand" : "graphite"}
          className="w-full sm:w-auto"
        >
          {loading ? (
            <Loader2 className="animate-spin" />
          ) : status === "SEM_REGISTRO" ? (
            <LogIn />
          ) : (
            <LogOut />
          )}
          {status === "SEM_REGISTRO" ? "Registrar Entrada" : "Registrar Saída"}
        </Button>
      )}
    </div>
  );
}

/** Bloco de status da localização: carregando, validada ou fora da área. */
function LocationStatus({
  geo,
  distancia,
  dentro,
}: {
  geo: ReturnType<typeof useGeolocation>;
  distancia: number | null;
  dentro: boolean;
}) {
  if (geo.status === "loading" || geo.status === "idle") {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Obtendo sua localização...
      </div>
    );
  }

  if (geo.status !== "success") {
    return (
      <div className="flex flex-col items-stretch gap-2 sm:items-end">
        <div className="flex items-start gap-2 text-sm text-destructive">
          <MapPinOff className="mt-0.5 size-4 shrink-0" />
          <span className="max-w-64 sm:text-right">{geo.message}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={geo.retry} className="sm:w-fit">
          <RotateCcw />
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-stretch gap-1.5 sm:items-end">
      <Badge variant={dentro ? "success" : "destructive"} className="w-fit">
        <MapPin className="size-3" />
        {dentro ? "Localização validada" : "Fora da área permitida"}
      </Badge>
      {distancia !== null && (
        <p
          className={cn(
            "text-xs",
            dentro ? "text-muted-foreground" : "text-destructive"
          )}
        >
          Você está a {formatDistance(distancia)} da empresa
          {geo.position && ` · precisão de ${formatDistance(geo.position.accuracy)}`}
        </p>
      )}
    </div>
  );
}

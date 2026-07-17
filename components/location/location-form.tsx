"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Crosshair, Loader2, MapPin, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { useGeolocation } from "@/hooks/use-geolocation";
import { MAX_RADIUS_M, MIN_RADIUS_M, type Coords } from "@/lib/geo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { FormError } from "@/components/auth/form-error";
import type { ApiResponse } from "@/types";

/**
 * O Leaflet acessa `window` na importação, então o mapa só pode ser
 * carregado no navegador.
 */
const LocationMap = dynamic(() => import("@/components/location/location-map"), {
  ssr: false,
  loading: () => <Skeleton className="h-72 w-full rounded-lg sm:h-96" />,
});

/** Praça da Sé, São Paulo — ponto de partida quando nada foi cadastrado. */
const PADRAO: Coords = { latitude: -23.55052, longitude: -46.633308 };

interface LocationFormProps {
  atual: { latitude: number; longitude: number; radiusMeters: number } | null;
}

export function LocationForm({ atual }: LocationFormProps) {
  const router = useRouter();
  const [coords, setCoords] = useState<Coords>(
    atual ? { latitude: atual.latitude, longitude: atual.longitude } : PADRAO
  );
  const [raio, setRaio] = useState(String(atual?.radiusMeters ?? 100));
  const [salvando, setSalvando] = useState(false);
  const [removendo, setRemovendo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [usarMinha, setUsarMinha] = useState(false);

  const geo = useGeolocation(usarMinha);

  // Ao ativar "usar minha localização", move o ponto para onde eu estou.
  useEffect(() => {
    if (!usarMinha) return;

    if (geo.status === "success" && geo.position) {
      setCoords({
        latitude: geo.position.latitude,
        longitude: geo.position.longitude,
      });
      setUsarMinha(false);
      toast.success("Ponto movido para a sua localização atual.");
      return;
    }

    if (geo.status !== "loading" && geo.status !== "idle" && geo.message) {
      setErro(geo.message);
      setUsarMinha(false);
    }
  }, [usarMinha, geo.status, geo.position, geo.message]);

  const raioNum = Number(raio);
  const raioValido =
    Number.isInteger(raioNum) && raioNum >= MIN_RADIUS_M && raioNum <= MAX_RADIUS_M;

  async function salvar() {
    setErro(null);
    if (!raioValido) {
      setErro(`O raio deve ser um número entre ${MIN_RADIUS_M} e ${MAX_RADIUS_M} metros.`);
      return;
    }

    setSalvando(true);
    try {
      const res = await fetch("/api/company-location", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...coords, radiusMeters: raioNum }),
      });
      const data = (await res.json()) as ApiResponse;

      if (!res.ok || !data.ok) {
        setErro(data.error ?? "Não foi possível salvar.");
        return;
      }
      toast.success("Localização salva! O ponto agora exige presença na área.");
      router.refresh();
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  async function remover() {
    const ok = window.confirm(
      "Desativar a verificação de localização? Todos poderão registrar ponto de qualquer lugar."
    );
    if (!ok) return;

    setRemovendo(true);
    try {
      const res = await fetch("/api/company-location", { method: "DELETE" });
      const data = (await res.json()) as ApiResponse;
      if (!res.ok || !data.ok) {
        setErro(data.error ?? "Não foi possível desativar.");
        return;
      }
      toast.success("Verificação de localização desativada.");
      router.refresh();
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setRemovendo(false);
    }
  }

  /** Campos manuais: aceita vírgula como separador decimal. */
  function atualizarCoord(campo: keyof Coords, valor: string) {
    const n = Number(valor.replace(",", "."));
    if (Number.isFinite(n)) setCoords((c) => ({ ...c, [campo]: n }));
  }

  return (
    <div className="flex flex-col gap-5">
      <LocationMap
        center={coords}
        radiusMeters={raioValido ? raioNum : 100}
        onPick={setCoords}
      />

      <p className="text-xs text-muted-foreground">
        Clique no mapa ou arraste o marcador para definir o local. O círculo
        mostra a área em que o ponto será aceito.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="lat">Latitude</Label>
          <Input
            id="lat"
            inputMode="decimal"
            value={coords.latitude}
            onChange={(e) => atualizarCoord("latitude", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="lng">Longitude</Label>
          <Input
            id="lng"
            inputMode="decimal"
            value={coords.longitude}
            onChange={(e) => atualizarCoord("longitude", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="raio">Raio permitido (metros)</Label>
          <Input
            id="raio"
            inputMode="numeric"
            value={raio}
            onChange={(e) => setRaio(e.target.value)}
            aria-invalid={!raioValido}
          />
          {!raioValido && (
            <p className="text-xs text-destructive">
              Entre {MIN_RADIUS_M} e {MAX_RADIUS_M} metros.
            </p>
          )}
        </div>
      </div>

      <FormError message={erro} />

      <div className="flex flex-wrap gap-2">
        <Button onClick={salvar} disabled={salvando || !raioValido} variant="brand">
          {salvando ? <Loader2 className="animate-spin" /> : <MapPin />}
          {salvando ? "Salvando..." : "Salvar localização"}
        </Button>

        <Button
          variant="outline"
          onClick={() => {
            setErro(null);
            setUsarMinha(true);
          }}
          disabled={geo.status === "loading" && usarMinha}
        >
          {geo.status === "loading" && usarMinha ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Crosshair />
          )}
          Usar minha localização
        </Button>

        {atual && (
          <Button variant="ghost" onClick={remover} disabled={removendo}>
            {removendo ? <Loader2 className="animate-spin" /> : <Trash2 />}
            Desativar verificação
          </Button>
        )}
      </div>
    </div>
  );
}

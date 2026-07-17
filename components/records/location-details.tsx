"use client";

import { useState } from "react";
import { ExternalLink, MapPin, MapPinOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import type { PunchLocation, TimeRecordRow } from "@/types";

/** Uma batida com localização, para exibição no diálogo. */
function Batida({ titulo, local }: { titulo: string; local: PunchLocation | null }) {
  if (!local) {
    return (
      <div className="flex flex-col gap-1 rounded-lg border p-3">
        <p className="text-sm font-medium">{titulo}</p>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPinOff className="size-3" />
          Sem localização registrada
        </p>
      </div>
    );
  }

  const linhas = [
    { label: "Coordenadas", valor: `${local.latitude.toFixed(6)}, ${local.longitude.toFixed(6)}` },
    { label: "Distância da empresa", valor: local.distance ?? "—" },
    { label: "Precisão do GPS", valor: local.accuracy ?? "—" },
    { label: "Dispositivo", valor: local.device ?? "—" },
  ];

  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3">
      <p className="text-sm font-medium">{titulo}</p>
      <dl className="flex flex-col gap-1">
        {linhas.map((l) => (
          <div key={l.label} className="flex justify-between gap-3 text-xs">
            <dt className="text-muted-foreground">{l.label}</dt>
            <dd className="text-right font-medium tabular-nums">{l.valor}</dd>
          </div>
        ))}
      </dl>
      <a
        href={local.mapUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex w-fit items-center gap-1.5 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        <ExternalLink className="size-3" />
        Abrir no mapa
      </a>
    </div>
  );
}

/** Botão que abre a localização das batidas de um registro. */
export function LocationDetails({ record }: { record: TimeRecordRow }) {
  const [open, setOpen] = useState(false);
  const temLocal = !!(record.entradaLocal || record.saidaLocal);

  if (!temLocal) {
    return (
      <span
        title="Registro anterior à verificação de localização"
        className="text-xs text-muted-foreground"
      >
        —
      </span>
    );
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        aria-label={`Ver localização de ${record.colaborador ?? "registro"} em ${record.data}`}
      >
        <MapPin />
        Ver
      </Button>

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Localização do registro"
        description={`${record.colaborador ? `${record.colaborador} · ` : ""}${record.data}`}
      >
        <div className="flex flex-col gap-3">
          <Batida titulo={`Entrada · ${record.entrada}`} local={record.entradaLocal ?? null} />
          <Batida titulo={`Saída · ${record.saida}`} local={record.saidaLocal ?? null} />
        </div>
      </Dialog>
    </>
  );
}

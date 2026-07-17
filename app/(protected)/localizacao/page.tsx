import type { Metadata } from "next";
import { MapPin, ShieldCheck, ShieldOff } from "lucide-react";

import { LocationForm } from "@/components/location/location-form";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDistance } from "@/lib/geo";
import { formatDate, formatTime } from "@/lib/time";

export const metadata: Metadata = { title: "Localização da Empresa" };

/** Configuração da área autorizada para bater ponto. */
export default async function LocalizacaoPage() {
  await requirePermission("companyLocation:manage");

  const atual = await prisma.companyLocation.findFirst({
    include: { updatedBy: { select: { nome: true } } },
  });

  const ativo = !!atual;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Localização da Empresa
          </h1>
          <p className="text-sm text-muted-foreground">
            Define de onde os colaboradores podem registrar o ponto.
          </p>
        </div>
        <Badge variant={ativo ? "success" : "warning"} className="shrink-0">
          {ativo ? <ShieldCheck className="size-3" /> : <ShieldOff className="size-3" />}
          {ativo ? "Verificação ativa" : "Verificação desativada"}
        </Badge>
      </div>

      {!ativo && (
        <Card className="animate-fade-in-up border-amber-500/40 bg-amber-500/5">
          <CardContent className="flex gap-3 p-4">
            <ShieldOff className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="text-sm text-muted-foreground">
              Nenhuma área cadastrada — hoje o ponto pode ser registrado de
              qualquer lugar. Ao salvar uma localização, a verificação passa a
              valer <strong>imediatamente para toda a equipe</strong>.
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="animate-fade-in-up">
        <CardHeader>
          <CardTitle>Área autorizada</CardTitle>
          <CardDescription>
            Escolha o local no mapa (ou informe as coordenadas) e defina o raio
            de tolerância.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LocationForm
            atual={
              atual
                ? {
                    latitude: atual.latitude,
                    longitude: atual.longitude,
                    radiusMeters: atual.radiusMeters,
                  }
                : null
            }
          />
        </CardContent>
      </Card>

      {atual && (
        <Card className="animate-fade-in-up [animation-delay:80ms]">
          <CardHeader>
            <CardTitle>Configuração atual</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            {[
              {
                label: "Coordenadas",
                value: `${atual.latitude.toFixed(6)}, ${atual.longitude.toFixed(6)}`,
              },
              { label: "Raio permitido", value: formatDistance(atual.radiusMeters) },
              {
                label: "Última alteração",
                value: `${formatDate(atual.updatedAt)} às ${formatTime(atual.updatedAt)}${
                  atual.updatedBy ? ` · ${atual.updatedBy.nome}` : ""
                }`,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 last:border-0 last:pb-0"
              >
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-medium tabular-nums">{item.value}</span>
              </div>
            ))}
            <a
              href={`https://www.openstreetmap.org/?mlat=${atual.latitude}&mlon=${atual.longitude}#map=17/${atual.latitude}/${atual.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-fit items-center gap-1.5 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              <MapPin className="size-3" />
              Abrir no mapa
            </a>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { ElapsedTime } from "@/components/elapsed-time";
import { LiveClock } from "@/components/live-clock";
import { PunchPanel } from "@/components/punch-panel";
import { RecordsTable } from "@/components/records-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatFullDate, formatTime, todayRange } from "@/lib/time";
import { toRecordRows } from "@/lib/records";
import type { DayStatus } from "@/types";

export const metadata: Metadata = { title: "Dashboard" };

function greeting(): string {
  const hour = Number(
    new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "numeric",
      hour12: false,
    }).format(new Date())
  );
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

const STATUS_INFO: Record<
  DayStatus,
  { label: string; variant: "secondary" | "success" | "warning" }
> = {
  SEM_REGISTRO: { label: "Sem registro hoje", variant: "secondary" },
  TRABALHANDO: { label: "Trabalhando", variant: "success" },
  ENCERRADO: { label: "Expediente encerrado", variant: "warning" },
};

/**
 * Dashboard pessoal — de TODO colaborador, inclusive administradores
 * (o admin também registra entrada e saída).
 */
export default async function DashboardPage() {
  const profile = await requireUser();
  const { start, end } = todayRange();

  const [todayRecord, recent, empresa] = await Promise.all([
    prisma.timeRecord.findFirst({
      where: { profileId: profile.id, entrada: { gte: start, lt: end } },
      orderBy: { entrada: "desc" },
    }),
    prisma.timeRecord.findMany({
      where: { profileId: profile.id },
      orderBy: { entrada: "desc" },
      take: 5,
    }),
    prisma.companyLocation.findFirst(),
  ]);

  // null = geofencing desligado (nenhuma área cadastrada).
  const geofence = empresa
    ? {
        latitude: empresa.latitude,
        longitude: empresa.longitude,
        radiusMeters: empresa.radiusMeters,
      }
    : null;

  const status: DayStatus = !todayRecord
    ? "SEM_REGISTRO"
    : todayRecord.saida
      ? "ENCERRADO"
      : "TRABALHANDO";

  const statusInfo = STATUS_INFO[status];
  const firstName = profile.nome.split(" ")[0];
  const horasEmAndamento = status === "TRABALHANDO";

  return (
    <div className="flex flex-col gap-6">
      <Card className="animate-fade-in-up">
        <CardHeader>
          <CardDescription className="capitalize">
            {formatFullDate(new Date())}
          </CardDescription>
          <CardTitle className="text-2xl">
            {greeting()}, {firstName} 👋
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-3">
            <LiveClock />
            <Badge variant={statusInfo.variant} className="w-fit">
              {statusInfo.label}
            </Badge>
          </div>
          <PunchPanel status={status} geofence={geofence} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            label: "Entrada",
            value: todayRecord ? formatTime(todayRecord.entrada) : "—",
          },
          {
            label: "Saída",
            value: todayRecord?.saida ? formatTime(todayRecord.saida) : "—",
          },
          {
            label: horasEmAndamento
              ? "Trabalhando há"
              : "Horas trabalhadas hoje",
            // Com o expediente aberto, conta ao vivo desde a entrada.
            value: todayRecord ? (
              <ElapsedTime
                entrada={todayRecord.entrada.toISOString()}
                saida={todayRecord.saida?.toISOString() ?? null}
              />
            ) : (
              "—"
            ),
          },
        ].map((item, index) => (
          <Card
            key={item.label}
            className="animate-fade-in-up"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <CardContent className="flex flex-col gap-1 p-6">
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <div className="font-mono text-2xl font-semibold tabular-nums">
                {item.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="animate-fade-in-up [animation-delay:180ms]">
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="min-w-0">
            <CardTitle>Registros recentes</CardTitle>
            <CardDescription>Seus últimos 5 registros de ponto.</CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm" className="shrink-0">
            <Link href="/historico">
              Ver histórico
              <ArrowRight />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <RecordsTable
            records={toRecordRows(recent)}
            emptyMessage="Você ainda não possui registros de ponto."
          />
        </CardContent>
      </Card>
    </div>
  );
}

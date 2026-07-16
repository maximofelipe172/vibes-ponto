import type { Metadata } from "next";

import { RecordsTable } from "@/components/records-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatMinutes, toRecordRows, totalMinutes } from "@/lib/records";

export const metadata: Metadata = { title: "Histórico" };

/**
 * Histórico do próprio colaborador. Um funcionário nunca vê registros de
 * terceiros: a consulta é sempre filtrada pelo id do perfil da sessão.
 */
export default async function HistoricoPage() {
  const profile = await requireUser();

  const records = await prisma.timeRecord.findMany({
    where: { profileId: profile.id },
    orderBy: { entrada: "desc" },
    take: 100,
  });

  const minutos = totalMinutes(records);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Meu histórico
        </h1>
        <p className="text-sm text-muted-foreground">
          Seus registros de ponto e o total de horas trabalhadas.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="animate-fade-in-up">
          <CardContent className="flex flex-col gap-1 p-6">
            <p className="text-sm text-muted-foreground">Registros</p>
            <p className="text-3xl font-semibold tabular-nums">
              {records.length}
            </p>
          </CardContent>
        </Card>
        <Card className="animate-fade-in-up [animation-delay:60ms]">
          <CardContent className="flex flex-col gap-1 p-6">
            <p className="text-sm text-muted-foreground">
              Total de horas (expedientes encerrados)
            </p>
            <p className="text-3xl font-semibold tabular-nums">
              {formatMinutes(minutos)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="animate-fade-in-up [animation-delay:120ms]">
        <CardHeader>
          <CardTitle>Registros de ponto</CardTitle>
          <CardDescription>Seus últimos 100 registros.</CardDescription>
        </CardHeader>
        <CardContent>
          <RecordsTable
            records={toRecordRows(records)}
            emptyMessage="Você ainda não possui registros de ponto."
          />
        </CardContent>
      </Card>
    </div>
  );
}

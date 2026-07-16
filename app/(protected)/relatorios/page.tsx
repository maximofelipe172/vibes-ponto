import type { Metadata } from "next";
import { Suspense } from "react";
import type { Prisma } from "@prisma/client";

import { SearchFilters } from "@/components/filters/search-filters";
import { RecordsTable } from "@/components/records-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dayRange } from "@/lib/time";
import { formatMinutes, toRecordRows, totalMinutes } from "@/lib/records";

export const metadata: Metadata = { title: "Relatórios" };

interface PageProps {
  searchParams: Promise<{ q?: string; data?: string }>;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Todos os registros de ponto, com pesquisa e filtro por data. */
export default async function RelatoriosPage({ searchParams }: PageProps) {
  await requirePermission("reports:read");
  const { q, data } = await searchParams;

  const where: Prisma.TimeRecordWhereInput = {};
  if (q) {
    where.profile = { nome: { contains: q, mode: "insensitive" } };
  }
  if (data && ISO_DATE.test(data)) {
    const { start, end } = dayRange(data);
    where.entrada = { gte: start, lt: end };
  }

  const records = await prisma.timeRecord.findMany({
    where,
    include: { profile: { select: { nome: true } } },
    orderBy: { entrada: "desc" },
    take: 200,
  });

  const minutos = totalMinutes(records);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Relatórios</h1>
        <p className="text-sm text-muted-foreground">
          Registros de ponto de todos os colaboradores.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="animate-fade-in-up">
          <CardContent className="flex flex-col gap-1 p-6">
            <p className="text-sm text-muted-foreground">Registros listados</p>
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
        <CardHeader className="gap-4">
          <div>
            <CardTitle>Registros de ponto</CardTitle>
            <CardDescription>
              Até 200 registros — use a pesquisa e o filtro por data para
              refinar.
            </CardDescription>
          </div>
          <Suspense fallback={<Skeleton className="h-9 w-full" />}>
            <SearchFilters
              searchPlaceholder="Pesquisar por colaborador..."
              withDate
            />
          </Suspense>
        </CardHeader>
        <CardContent>
          <RecordsTable
            records={toRecordRows(records)}
            showCollaborator
            emptyMessage="Nenhum registro encontrado para os filtros selecionados."
          />
        </CardContent>
      </Card>
    </div>
  );
}

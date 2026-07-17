import type { Metadata } from "next";
import { Suspense } from "react";
import type { Prisma } from "@prisma/client";

import { PeriodFilter } from "@/components/admin/period-filter";
import { SearchFilters } from "@/components/filters/search-filters";
import { StatsCards } from "@/components/admin/stats-cards";
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
import { dateParts, formatTime, periodLabel, periodRange } from "@/lib/time";
import { formatMinutes, toRecordRows, totalMinutes } from "@/lib/records";
import type { StatCardData, StatPerson } from "@/types";

export const metadata: Metadata = { title: "Painel Admin" };

interface PageProps {
  searchParams: Promise<{
    q?: string;
    dia?: string;
    mes?: string;
    ano?: string;
  }>;
}

/** Lê um número da URL dentro de um intervalo, ou null. */
function parseNum(
  value: string | undefined,
  min: number,
  max: number
): number | null {
  const n = Number(value);
  return value && Number.isInteger(n) && n >= min && n <= max ? n : null;
}

function toPerson(p: {
  id: string;
  nome: string;
  email: string;
  role: "admin" | "employee";
}, detalhe?: string): StatPerson {
  return { id: p.id, nome: p.nome, email: p.email, role: p.role, detalhe };
}

/**
 * Painel administrativo: indicadores clicáveis, filtro de período e os
 * registros de toda a equipe. Exige permissão de ver o ponto de todos.
 */
export default async function AdminPage({ searchParams }: PageProps) {
  await requirePermission("timeRecord:readAll");
  const { q, dia: diaRaw, mes: mesRaw, ano: anoRaw } = await searchParams;

  const hoje = dateParts();
  // Sem filtro na URL, o período é o dia de hoje.
  const semFiltro = !diaRaw && !mesRaw && !anoRaw;
  const ano = parseNum(anoRaw, 2000, 2100) ?? hoje.ano;
  const mes = semFiltro ? hoje.mes : parseNum(mesRaw, 1, 12);
  const dia = semFiltro ? hoje.dia : mes ? parseNum(diaRaw, 1, 31) : null;

  const isHoje = dia === hoje.dia && mes === hoje.mes && ano === hoje.ano;
  const { start, end } = periodRange({ dia, mes, ano });
  const label = periodLabel({ dia, mes, ano });

  const where: Prisma.TimeRecordWhereInput = {
    entrada: { gte: start, lt: end },
  };
  if (q) where.profile = { nome: { contains: q, mode: "insensitive" } };

  const [ativos, registrosPeriodo, novos, registrosTabela, maisAntigo] =
    await Promise.all([
      // Uma consulta cobre total, admins e funcionários.
      prisma.profile.findMany({
        where: { status: "active" },
        select: { id: true, nome: true, email: true, role: true },
        orderBy: { nome: "asc" },
      }),
      // Quem bateu ponto no período (e o horário da 1ª entrada).
      prisma.timeRecord.findMany({
        where: { entrada: { gte: start, lt: end } },
        select: {
          entrada: true,
          profile: { select: { id: true, nome: true, email: true, role: true } },
        },
        orderBy: { entrada: "asc" },
      }),
      prisma.profile.findMany({
        where: { createdAt: { gte: start, lt: end } },
        select: { id: true, nome: true, email: true, role: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.timeRecord.findMany({
        where,
        include: { profile: { select: { nome: true } } },
        orderBy: { entrada: "desc" },
        take: 200,
      }),
      prisma.timeRecord.findFirst({
        orderBy: { entrada: "asc" },
        select: { entrada: true },
      }),
    ]);

  const admins = ativos.filter((p) => p.role === "admin");
  const employees = ativos.filter((p) => p.role === "employee");

  // Primeira entrada de cada pessoa no período (a lista vem ordenada).
  const presentesMap = new Map<string, StatPerson>();
  for (const registro of registrosPeriodo) {
    if (!presentesMap.has(registro.profile.id)) {
      presentesMap.set(
        registro.profile.id,
        toPerson(registro.profile, formatTime(registro.entrada))
      );
    }
  }
  const presentes = [...presentesMap.values()];
  const ausentes = ativos.filter((p) => !presentesMap.has(p.id));

  const cards: StatCardData[] = [
    {
      key: "total",
      label: "Total de colaboradores",
      value: ativos.length,
      description: "Contas ativas no sistema",
      icon: "Users",
      pessoas: ativos.map((p) => toPerson(p)),
    },
    {
      key: "admins",
      label: "Administradores",
      value: admins.length,
      description: "Com acesso à gestão",
      icon: "Shield",
      pessoas: admins.map((p) => toPerson(p)),
    },
    {
      key: "employees",
      label: "Funcionários",
      value: employees.length,
      description: "Sem acesso administrativo",
      icon: "Users",
      pessoas: employees.map((p) => toPerson(p)),
    },
    {
      key: "presentes",
      label: isHoje ? "Presentes hoje" : "Presentes no período",
      value: presentes.length,
      description: `Registraram entrada em ${label}`,
      icon: "CheckCircle2",
      pessoas: presentes,
    },
    {
      key: "ausentes",
      label: "Ausentes",
      value: ausentes.length,
      description: `Sem registro em ${label}`,
      icon: "UserX",
      pessoas: ausentes.map((p) => toPerson(p)),
    },
    {
      key: "novos",
      label: "Novos usuários",
      value: novos.length,
      description: `Cadastrados em ${label}`,
      icon: "UserPlus",
      pessoas: novos.map((p) => toPerson(p)),
    },
  ];

  // Anos disponíveis: do registro mais antigo até o atual.
  const primeiroAno = maisAntigo
    ? dateParts(maisAntigo.entrada).ano
    : hoje.ano;
  const anos = Array.from(
    { length: Math.max(1, hoje.ano - primeiroAno + 1) },
    (_, i) => primeiroAno + i
  ).reverse();

  const minutos = totalMinutes(registrosTabela);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Painel do administrador
          </h1>
          <p className="text-sm text-muted-foreground">
            Visão geral da equipe e dos registros de ponto.
          </p>
        </div>
        <Suspense fallback={<Skeleton className="h-9 w-80" />}>
          <PeriodFilter
            dia={dia}
            mes={mes}
            ano={ano}
            anos={anos}
            isHoje={isHoje}
          />
        </Suspense>
      </div>

      <StatsCards cards={cards} />

      <Card className="animate-fade-in-up [animation-delay:180ms]">
        <CardHeader className="gap-4">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
            <div className="min-w-0">
              <CardTitle>Registros de ponto</CardTitle>
              <CardDescription>
                {registrosTabela.length} registro
                {registrosTabela.length === 1 ? "" : "s"} em {label}.
              </CardDescription>
            </div>
            <span className="text-sm text-muted-foreground">
              Total: <span className="font-medium tabular-nums text-foreground">
                {formatMinutes(minutos)}
              </span>
            </span>
          </div>
          <Suspense fallback={<Skeleton className="h-9 w-full" />}>
            <SearchFilters searchPlaceholder="Pesquisar por colaborador..." />
          </Suspense>
        </CardHeader>
        <CardContent>
          <RecordsTable
            records={toRecordRows(registrosTabela)}
            showCollaborator
            showLocation
            emptyMessage={`Nenhum registro de ponto em ${label}.`}
          />
        </CardContent>
      </Card>
    </div>
  );
}

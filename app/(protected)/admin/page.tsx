import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Shield, UserPlus, UserX, Users } from "lucide-react";

import { RecordsTable } from "@/components/records-table";
import { StatsCards, type StatCard } from "@/components/admin/stats-cards";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, todayRange } from "@/lib/time";
import { toRecordRows } from "@/lib/records";
import { ROLE_BADGE_VARIANT, ROLE_LABELS } from "@/lib/rbac/permissions";

export const metadata: Metadata = { title: "Painel Admin" };

/** Dashboard administrativo — exige permissão de ver o ponto de todos. */
export default async function AdminPage() {
  await requirePermission("timeRecord:readAll");
  const { start, end } = todayRange();

  const [
    totalAtivos,
    totalAdmins,
    totalEmployees,
    presentesHoje,
    ultimosRegistros,
    novosUsuarios,
  ] = await Promise.all([
    prisma.profile.count({ where: { status: "active" } }),
    prisma.profile.count({ where: { status: "active", role: "admin" } }),
    prisma.profile.count({ where: { status: "active", role: "employee" } }),
    prisma.timeRecord.findMany({
      where: { entrada: { gte: start, lt: end } },
      select: { profileId: true },
      distinct: ["profileId"],
    }),
    prisma.timeRecord.findMany({
      include: { profile: { select: { nome: true } } },
      orderBy: { entrada: "desc" },
      take: 8,
    }),
    prisma.profile.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    }),
  ]);

  const presentes = presentesHoje.length;
  const ausentes = Math.max(0, totalAtivos - presentes);

  const cards: StatCard[] = [
    {
      key: "total",
      label: "Total de colaboradores",
      value: totalAtivos,
      description: "Contas ativas no sistema",
      icon: Users,
    },
    {
      key: "admins",
      label: "Administradores",
      value: totalAdmins,
      description: "Com acesso à gestão",
      icon: Shield,
    },
    {
      key: "employees",
      label: "Funcionários",
      value: totalEmployees,
      description: "Sem acesso administrativo",
      icon: Users,
    },
    {
      key: "presentes",
      label: "Presentes hoje",
      value: presentes,
      description: "Já registraram entrada",
      icon: CheckCircle2,
    },
    {
      key: "ausentes",
      label: "Ausentes",
      value: ausentes,
      description: "Ainda não bateram o ponto",
      icon: UserX,
    },
    {
      key: "novos",
      label: "Novos usuários",
      value: novosUsuarios.length,
      description: "Cadastros mais recentes",
      icon: UserPlus,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Painel do administrador
        </h1>
        <p className="text-sm text-muted-foreground">
          Visão geral da equipe e dos registros de ponto.
        </p>
      </div>

      <StatsCards cards={cards} />

      <Card className="animate-fade-in-up [animation-delay:180ms]">
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="min-w-0">
            <CardTitle>Últimos registros</CardTitle>
            <CardDescription>
              Os 8 registros de ponto mais recentes da equipe.
            </CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm" className="shrink-0">
            <Link href="/relatorios">
              Ver todos
              <ArrowRight />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <RecordsTable
            records={toRecordRows(ultimosRegistros)}
            showCollaborator
            emptyMessage="Nenhum registro de ponto ainda."
          />
        </CardContent>
      </Card>

      <Card className="animate-fade-in-up [animation-delay:220ms]">
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="min-w-0">
            <CardTitle>Usuários recém cadastrados</CardTitle>
            <CardDescription>Os 5 cadastros mais recentes.</CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm" className="shrink-0">
            <Link href="/usuarios">
              Gerenciar
              <ArrowRight />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {novosUsuarios.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhum usuário cadastrado.
            </p>
          ) : (
            novosUsuarios.map((user) => (
              <div
                key={user.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 last:border-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{user.nome}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={ROLE_BADGE_VARIANT[user.role]}>
                    {ROLE_LABELS[user.role]}
                  </Badge>
                  {user.status === "inactive" && (
                    <Badge variant="warning">Inativo</Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {formatDate(user.createdAt)}
                  </span>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

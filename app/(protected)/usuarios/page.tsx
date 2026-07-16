import type { Metadata } from "next";
import { Suspense } from "react";
import type { Prisma } from "@prisma/client";

import { SearchFilters } from "@/components/filters/search-filters";
import { UsersTable } from "@/components/users/users-table";
import { AddUserButton } from "@/components/users/add-user-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PermissionGuard } from "@/components/auth/guards";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can, ROLE_LABELS } from "@/lib/rbac/permissions";
import { formatDate } from "@/lib/time";
import type { UserRow } from "@/types";

export const metadata: Metadata = { title: "Usuários" };

interface PageProps {
  searchParams: Promise<{ q?: string; role?: string; status?: string }>;
}

const ROLE_VALUES = ["admin", "employee"] as const;
const STATUS_VALUES = ["active", "inactive"] as const;

/** Gerenciar Usuários — exige a permissão `user:read`. */
export default async function UsuariosPage({ searchParams }: PageProps) {
  const profile = await requirePermission("user:read");
  const { q, role, status } = await searchParams;

  const where: Prisma.ProfileWhereInput = {};
  if (q) {
    where.OR = [
      { nome: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }
  if (role && ROLE_VALUES.includes(role as (typeof ROLE_VALUES)[number])) {
    where.role = role as (typeof ROLE_VALUES)[number];
  }
  if (status && STATUS_VALUES.includes(status as (typeof STATUS_VALUES)[number])) {
    where.status = status as (typeof STATUS_VALUES)[number];
  }

  const profiles = await prisma.profile.findMany({
    where,
    orderBy: [{ status: "asc" }, { nome: "asc" }],
    take: 200,
  });

  const users: UserRow[] = profiles.map((user) => ({
    id: user.id,
    nome: user.nome,
    email: user.email,
    role: user.role,
    status: user.status,
    cargo: user.cargo,
    departamento: user.departamento,
    criadoEm: formatDate(user.createdAt),
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Gerenciar usuários
          </h1>
          <p className="text-sm text-muted-foreground">
            Cadastre, edite, altere o tipo e ative ou desative colaboradores.
          </p>
        </div>
        <PermissionGuard permission="user:create">
          <AddUserButton />
        </PermissionGuard>
      </div>

      <Card className="animate-fade-in-up">
        <CardHeader className="gap-4">
          <div>
            <CardTitle>Usuários</CardTitle>
            <CardDescription>
              {users.length} usuário{users.length === 1 ? "" : "s"} listado
              {users.length === 1 ? "" : "s"}.
            </CardDescription>
          </div>
          <Suspense fallback={<Skeleton className="h-9 w-full" />}>
            <SearchFilters
              searchPlaceholder="Pesquisar por nome ou e-mail..."
              selects={[
                {
                  name: "role",
                  label: "Tipo",
                  options: [
                    { value: "admin", label: ROLE_LABELS.admin },
                    { value: "employee", label: ROLE_LABELS.employee },
                  ],
                },
                {
                  name: "status",
                  label: "Status",
                  options: [
                    { value: "active", label: "Ativo" },
                    { value: "inactive", label: "Inativo" },
                  ],
                },
              ]}
            />
          </Suspense>
        </CardHeader>
        <CardContent>
          <UsersTable
            users={users}
            currentUserId={profile.id}
            canDelete={can(profile.role, "user:delete")}
          />
        </CardContent>
      </Card>
    </div>
  );
}

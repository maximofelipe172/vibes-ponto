import type { Metadata } from "next";
import { Check, Minus } from "lucide-react";
import type { Role } from "@prisma/client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requirePermission } from "@/lib/auth";
import {
  can,
  PERMISSIONS,
  ROLE_LABELS,
  ROLE_PERMISSIONS,
  type Permission,
} from "@/lib/rbac/permissions";
import { MIN_PASSWORD_LENGTH } from "@/lib/validations";

export const metadata: Metadata = { title: "Configurações" };

/** Descrição legível de cada permissão. */
const PERMISSION_LABELS: Record<Permission, string> = {
  "timeRecord:create": "Registrar o próprio ponto",
  "timeRecord:readOwn": "Ver o próprio histórico",
  "timeRecord:readAll": "Ver o ponto de todos",
  "profile:updateOwn": "Editar o próprio perfil",
  "profile:changeOwnPassword": "Alterar a própria senha",
  "user:read": "Listar usuários",
  "user:create": "Criar usuários",
  "user:update": "Editar usuários",
  "user:changeRole": "Alterar o tipo de usuário",
  "user:changeStatus": "Ativar/desativar usuários",
  "user:delete": "Excluir usuários",
  "settings:manage": "Gerenciar configurações",
  "companyLocation:manage": "Definir a localização da empresa",
};

const ROLES = Object.keys(ROLE_PERMISSIONS) as Role[];

/**
 * Configurações do sistema — exige `settings:manage`.
 *
 * A matriz de permissões é derivada do RBAC em tempo de execução: ela
 * reflete exatamente o que o servidor aplica, sem duplicar regras.
 */
export default async function ConfiguracoesPage() {
  await requirePermission("settings:manage");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          Parâmetros e regras de acesso do sistema.
        </p>
      </div>

      <Card className="animate-fade-in-up">
        <CardHeader>
          <CardTitle>Matriz de permissões</CardTitle>
          <CardDescription>
            O que cada tipo de usuário pode fazer. Reflete as regras aplicadas
            pelo servidor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                {/* Coluna fixa: mantém a permissão visível ao rolar no celular. */}
                <TableHead className="sticky left-0 bg-card">Permissão</TableHead>
                {ROLES.map((role) => (
                  <TableHead key={role} className="text-center">
                    {ROLE_LABELS[role]}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {PERMISSIONS.map((permission) => (
                <TableRow key={permission}>
                  <TableCell className="sticky left-0 bg-card whitespace-normal">
                    {PERMISSION_LABELS[permission]}
                  </TableCell>
                  {ROLES.map((role) => (
                    <TableCell key={role} className="text-center">
                      {can(role, permission) ? (
                        <Check
                          className="mx-auto size-4 text-success"
                          aria-label="Permitido"
                        />
                      ) : (
                        <Minus
                          className="mx-auto size-4 text-muted-foreground/40"
                          aria-label="Não permitido"
                        />
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="animate-fade-in-up [animation-delay:80ms]">
        <CardHeader>
          <CardTitle>Parâmetros do sistema</CardTitle>
          <CardDescription>
            Valores em vigor nesta instalação.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          {[
            { label: "Fuso horário dos registros", value: "America/São_Paulo (UTC-3)" },
            { label: "Tamanho mínimo de senha", value: `${MIN_PASSWORD_LENGTH} caracteres` },
            { label: "Regra de ponto", value: "Um registro por dia (entrada + saída)" },
            { label: "Autenticação", value: "E-mail e senha (Supabase Auth)" },
          ].map((item) => (
            <div
              key={item.label}
              className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 last:border-0 last:pb-0"
            >
              <span className="text-muted-foreground">{item.label}</span>
              <span className="font-medium">{item.value}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Para adicionar um novo perfil (ex.: RH, Supervisor), inclua o valor no
        enum <code className="font-mono">Role</code> e as permissões dele em{" "}
        <code className="font-mono">lib/rbac/permissions.ts</code> — telas,
        menus e rotas se ajustam sozinhos.
      </p>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Power, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ROLE_BADGE_VARIANT, ROLE_LABELS } from "@/lib/rbac/permissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserFormDialog } from "@/components/users/user-form-dialog";
import type { ApiResponse, UserRow } from "@/types";

interface UsersTableProps {
  users: UserRow[];
  /** Id do perfil logado — não pode desativar/excluir a si mesmo. */
  currentUserId: string;
  canDelete: boolean;
}

export function UsersTable({
  users,
  currentUserId,
  canDelete,
}: UsersTableProps) {
  const router = useRouter();
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [, startTransition] = useTransition();

  async function toggleStatus(user: UserRow) {
    const nextStatus = user.status === "active" ? "inactive" : "active";
    const res = await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: user.nome,
        cargo: user.cargo ?? "",
        departamento: user.departamento ?? "",
        role: user.role,
        status: nextStatus,
      }),
    });
    const data = (await res.json()) as ApiResponse;

    if (!res.ok || !data.ok) {
      toast.error(data.error ?? "Não foi possível alterar o status.");
      return;
    }
    toast.success(
      nextStatus === "active" ? "Usuário reativado!" : "Usuário desativado!"
    );
    startTransition(() => router.refresh());
  }

  async function remove(user: UserRow) {
    const confirmed = window.confirm(
      `Excluir ${user.nome}? Os registros de ponto dele também serão removidos. Esta ação não pode ser desfeita.`
    );
    if (!confirmed) return;

    const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
    const data = (await res.json()) as ApiResponse;

    if (!res.ok || !data.ok) {
      toast.error(data.error ?? "Não foi possível excluir.");
      return;
    }
    toast.success("Usuário excluído.");
    startTransition(() => router.refresh());
  }

  /** Menu de ações — compartilhado pelas visões de celular e desktop. */
  function Actions({ user }: { user: UserRow }) {
    const isSelf = user.id === currentUserId;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Ações para ${user.nome}`}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditing(user)}>
            <Pencil />
            Editar
          </DropdownMenuItem>
          {!isSelf && (
            <DropdownMenuItem onClick={() => toggleStatus(user)}>
              <Power />
              {user.status === "active" ? "Desativar" : "Reativar"}
            </DropdownMenuItem>
          )}
          {canDelete && !isSelf && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => remove(user)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 />
                Excluir
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  function RoleBadge({ user }: { user: UserRow }) {
    return (
      <Badge variant={ROLE_BADGE_VARIANT[user.role]}>
        {ROLE_LABELS[user.role]}
      </Badge>
    );
  }

  function StatusBadge({ user }: { user: UserRow }) {
    return (
      <Badge variant={user.status === "active" ? "success" : "warning"}>
        {user.status === "active" ? "Ativo" : "Inativo"}
      </Badge>
    );
  }

  if (users.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Nenhum usuário encontrado para os filtros selecionados.
      </p>
    );
  }

  return (
    <>
      {/* ── Celular: cards ─────────────────────────────────────────── */}
      <ul className="flex flex-col gap-3 md:hidden">
        {users.map((user) => (
          <li key={user.id} className="flex flex-col gap-3 rounded-lg border p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {user.nome}
                  {user.id === currentUserId && (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      (você)
                    </span>
                  )}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {user.email}
                </p>
              </div>
              <Actions user={user} />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <RoleBadge user={user} />
              <StatusBadge user={user} />
              {user.cargo && (
                <span className="text-xs text-muted-foreground">
                  {user.cargo}
                  {user.departamento && ` · ${user.departamento}`}
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>

      {/* ── Desktop: tabela ────────────────────────────────────────── */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {user.nome}
                      {user.id === currentUserId && (
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          (você)
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {user.cargo ?? "—"}
                  {user.departamento && (
                    <span className="block text-xs">{user.departamento}</span>
                  )}
                </TableCell>
                <TableCell>
                  <RoleBadge user={user} />
                </TableCell>
                <TableCell>
                  <StatusBadge user={user} />
                </TableCell>
                <TableCell>
                  <Actions user={user} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <UserFormDialog
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
        user={editing}
      />
    </>
  );
}

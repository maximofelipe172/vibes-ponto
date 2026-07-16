import { NextResponse } from "next/server";

import type { Role, UserStatus } from "@prisma/client";

import { authorize } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { prisma } from "@/lib/prisma";
import { ADMIN_CAPABILITY, rolesWith } from "@/lib/rbac/permissions";
import { updateUserSchema } from "@/lib/validations";
import type { ApiResponse } from "@/types";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * O sistema não pode ficar sem ninguém capaz de administrar usuários.
 * A regra é expressa por PERMISSÃO: qualquer papel futuro que possa gerir
 * usuários conta automaticamente, sem alterar este código.
 *
 * Retorna uma mensagem de erro se a mudança deixaria o sistema órfão.
 */
async function wouldOrphanSystem(target: {
  id: string;
  role: Role;
  status: UserStatus;
}, next: { role: Role; status: UserStatus }): Promise<string | null> {
  const adminRoles = rolesWith(ADMIN_CAPABILITY);

  const targetAdministra =
    adminRoles.includes(target.role) && target.status === "active";
  const continuaAdministrando =
    adminRoles.includes(next.role) && next.status === "active";

  if (!targetAdministra || continuaAdministrando) return null;

  const outros = await prisma.profile.count({
    where: {
      role: { in: adminRoles },
      status: "active",
      id: { not: target.id },
    },
  });

  return outros === 0
    ? "É preciso manter ao menos um administrador ativo."
    : null;
}

/**
 * PATCH /api/users/[id]
 * Atualiza nome, cargo, departamento, papel e status de um usuário.
 * Exige `user:update`; alterar papel/status exige as permissões
 * específicas — verificadas individualmente.
 */
export async function PATCH(request: Request, { params }: RouteContext) {
  const auth = await authorize("user:update");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const parsed = updateUserSchema.safeParse(
    await request.json().catch(() => ({}))
  );
  if (!parsed.success) {
    return NextResponse.json<ApiResponse>(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 }
    );
  }

  const target = await prisma.profile.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json<ApiResponse>(
      { error: "Usuário não encontrado." },
      { status: 404 }
    );
  }

  const { nome, cargo, departamento, role, status } = parsed.data;

  // Trocar papel e status são ações distintas — checa cada permissão.
  if (role !== target.role) {
    const roleAuth = await authorize("user:changeRole");
    if (!roleAuth.ok) return roleAuth.response;
  }
  if (status !== target.status) {
    const statusAuth = await authorize("user:changeStatus");
    if (!statusAuth.ok) return statusAuth.response;
  }

  // Guarda-corpo: o admin não pode se auto-rebaixar nem se desativar —
  // evita que o último administrador perca o acesso por engano.
  const isSelf = target.id === auth.profile.id;
  if (isSelf && (role !== target.role || status !== target.status)) {
    return NextResponse.json<ApiResponse>(
      { error: "Você não pode alterar o próprio papel ou status." },
      { status: 400 }
    );
  }

  const orphanError = await wouldOrphanSystem(target, { role, status });
  if (orphanError) {
    return NextResponse.json<ApiResponse>(
      { error: orphanError },
      { status: 400 }
    );
  }

  await prisma.profile.update({
    where: { id },
    data: {
      nome,
      role,
      status,
      cargo: cargo || null,
      departamento: departamento || null,
    },
  });

  return NextResponse.json<ApiResponse>({ ok: true });
}

/**
 * DELETE /api/users/[id]
 * Remove o usuário do Auth e o perfil (o histórico de ponto vai junto,
 * por cascade). Exige `user:delete`.
 */
export async function DELETE(_request: Request, { params }: RouteContext) {
  const auth = await authorize("user:delete");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const target = await prisma.profile.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json<ApiResponse>(
      { error: "Usuário não encontrado." },
      { status: 404 }
    );
  }

  if (target.id === auth.profile.id) {
    return NextResponse.json<ApiResponse>(
      { error: "Você não pode excluir a própria conta." },
      { status: 400 }
    );
  }

  // Excluir equivale a deixar de administrar — mesma regra do PATCH.
  const orphanError = await wouldOrphanSystem(target, {
    role: target.role,
    status: "inactive",
  });
  if (orphanError) {
    return NextResponse.json<ApiResponse>(
      { error: orphanError },
      { status: 400 }
    );
  }

  // Remove a conta de autenticação correspondente (busca pelo e-mail,
  // já que o id do Auth é independente do id do perfil).
  const admin = createAdminClient();
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const authUser = data.users.find((u) => u.email === target.email);
  if (authUser) await admin.auth.admin.deleteUser(authUser.id);

  await prisma.profile.delete({ where: { id } });

  return NextResponse.json<ApiResponse>({ ok: true });
}

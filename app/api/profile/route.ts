import { NextResponse } from "next/server";

import { authorize } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { updateProfileSchema } from "@/lib/validations";
import type { ApiResponse } from "@/types";

/**
 * PATCH /api/profile
 * Atualiza os dados do próprio perfil. Note que `role` e `status` NÃO são
 * aceitos aqui — só a tela de gestão de usuários altera isso, e apenas
 * com as permissões correspondentes.
 */
export async function PATCH(request: Request) {
  const auth = await authorize("profile:updateOwn");
  if (!auth.ok) return auth.response;

  const parsed = updateProfileSchema.safeParse(
    await request.json().catch(() => ({}))
  );
  if (!parsed.success) {
    return NextResponse.json<ApiResponse>(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 }
    );
  }

  const { nome, cargo, departamento } = parsed.data;

  await prisma.profile.update({
    where: { id: auth.profile.id },
    data: {
      nome,
      cargo: cargo || null,
      departamento: departamento || null,
    },
  });

  return NextResponse.json<ApiResponse>({ ok: true });
}

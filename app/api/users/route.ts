import { NextResponse } from "next/server";

import { authorize } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { prisma } from "@/lib/prisma";
import { createUserSchema } from "@/lib/validations";
import type { ApiResponse } from "@/types";

/**
 * POST /api/users
 * Cria um usuário (Supabase Auth + perfil). Exclusivo de quem tem a
 * permissão `user:create` — verificado no servidor, nunca só na tela.
 */
export async function POST(request: Request) {
  const auth = await authorize("user:create");
  if (!auth.ok) return auth.response;

  const parsed = createUserSchema.safeParse(
    await request.json().catch(() => ({}))
  );
  if (!parsed.success) {
    return NextResponse.json<ApiResponse>(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 }
    );
  }

  const { nome, email, senha, cargo, departamento, role, status } = parsed.data;

  const existing = await prisma.profile.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json<ApiResponse>(
      { error: "Já existe um usuário com este e-mail." },
      { status: 409 }
    );
  }

  const admin = createAdminClient();
  const { error: createError } = await admin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
    user_metadata: { nome },
  });

  if (createError) {
    const message = createError.message.toLowerCase();
    if (
      createError.code === "email_exists" ||
      message.includes("already been registered") ||
      message.includes("already registered")
    ) {
      return NextResponse.json<ApiResponse>(
        { error: "Já existe uma conta com este e-mail." },
        { status: 409 }
      );
    }
    console.error("[users:create] falhou:", createError.message);
    return NextResponse.json<ApiResponse>(
      { error: "Não foi possível criar o usuário." },
      { status: 500 }
    );
  }

  await prisma.profile.create({
    data: {
      nome,
      email,
      role,
      status,
      cargo: cargo || null,
      departamento: departamento || null,
    },
  });

  return NextResponse.json<ApiResponse>({ ok: true }, { status: 201 });
}

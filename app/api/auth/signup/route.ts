import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { prisma } from "@/lib/prisma";
import { signUpSchema } from "@/lib/validations";
import type { AuthResponse } from "@/types";

/**
 * POST /api/auth/signup
 * Cadastro público: cria a conta no Supabase Auth (que armazena o hash da
 * senha), cria o perfil em `profiles` como `employee` e já autentica.
 *
 * A conta é criada via API administrativa com `email_confirm: true` para
 * que o login automático funcione sem depender de e-mail de confirmação.
 */
export async function POST(request: Request) {
  const parsed = signUpSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json<AuthResponse>(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 }
    );
  }

  const { nome, email, senha } = parsed.data;

  // Perfil desativado não pode ser "revivido" por um novo cadastro.
  const existing = await prisma.profile.findUnique({ where: { email } });
  if (existing?.status === "inactive") {
    return NextResponse.json<AuthResponse>(
      { error: "Esta conta está desativada. Fale com o administrador." },
      { status: 403 }
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
    const duplicated =
      createError.code === "email_exists" ||
      message.includes("already been registered") ||
      message.includes("already registered");

    if (duplicated) {
      return NextResponse.json<AuthResponse>(
        { error: "Este e-mail já está cadastrado. Faça login." },
        { status: 409 }
      );
    }

    console.error("[signup] createUser falhou:", {
      status: createError.status,
      code: createError.code,
      message: createError.message,
    });
    return NextResponse.json<AuthResponse>(
      { error: "Não foi possível criar a conta. Tente novamente." },
      { status: 500 }
    );
  }

  // Cria a sessão (cookies httpOnly) — login automático após o cadastro.
  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: senha,
  });

  if (signInError) {
    console.error("[signup] login automático falhou:", signInError.message);
    return NextResponse.json<AuthResponse>(
      { error: "Conta criada. Faça login para continuar." },
      { status: 500 }
    );
  }

  // Reaproveita perfil pré-cadastrado (preservando o papel definido pelo
  // administrador) ou cria um novo como `employee`.
  const profile = await prisma.profile.upsert({
    where: { email },
    update: { nome },
    create: { nome, email },
  });

  return NextResponse.json<AuthResponse>({ ok: true, role: profile.role });
}

import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { signInSchema } from "@/lib/validations";
import type { AuthResponse } from "@/types";

/**
 * POST /api/auth/login
 * Autentica com e-mail e senha via Supabase Auth e cria a sessão.
 * `lembrarMe: false` grava cookies de sessão (descartados ao fechar o
 * navegador); `true` mantém o login.
 */
export async function POST(request: Request) {
  const parsed = signInSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json<AuthResponse>(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 }
    );
  }

  const { email, senha, lembrarMe } = parsed.data;

  const supabase = await createClient(lembrarMe);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: senha,
  });

  if (error || !data.user) {
    // Mensagem genérica de propósito: não revela se o e-mail existe.
    return NextResponse.json<AuthResponse>(
      { error: "E-mail ou senha incorretos." },
      { status: 401 }
    );
  }

  // Garante o perfil — cobre contas criadas fora do fluxo de cadastro.
  const profile = await prisma.profile.upsert({
    where: { email },
    update: {},
    create: {
      email,
      nome: (data.user.user_metadata?.nome as string | undefined) ?? email,
    },
  });

  // Usuário desativado não entra, mesmo com a senha correta.
  if (profile.status === "inactive") {
    await supabase.auth.signOut();
    return NextResponse.json<AuthResponse>(
      { error: "Sua conta está desativada. Fale com o administrador." },
      { status: 403 }
    );
  }

  return NextResponse.json<AuthResponse>({ ok: true, role: profile.role });
}

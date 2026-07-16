import { NextResponse } from "next/server";

import { authorize } from "@/lib/api-auth";
import { createClient } from "@/lib/supabase/server";
import { changePasswordSchema } from "@/lib/validations";
import type { ApiResponse } from "@/types";

/**
 * PATCH /api/profile/password
 * Altera a própria senha. A senha atual é reconferida antes da troca —
 * assim uma sessão esquecida aberta não permite sequestrar a conta.
 */
export async function PATCH(request: Request) {
  const auth = await authorize("profile:changeOwnPassword");
  if (!auth.ok) return auth.response;

  const parsed = changePasswordSchema.safeParse(
    await request.json().catch(() => ({}))
  );
  if (!parsed.success) {
    return NextResponse.json<ApiResponse>(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 }
    );
  }

  const { senhaAtual, novaSenha } = parsed.data;
  const supabase = await createClient();

  // Reconfere a senha atual.
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: auth.profile.email,
    password: senhaAtual,
  });
  if (signInError) {
    return NextResponse.json<ApiResponse>(
      { error: "Senha atual incorreta." },
      { status: 401 }
    );
  }

  const { error } = await supabase.auth.updateUser({ password: novaSenha });
  if (error) {
    console.error("[profile:password] updateUser falhou:", error.message);
    return NextResponse.json<ApiResponse>(
      { error: "Não foi possível alterar a senha." },
      { status: 500 }
    );
  }

  return NextResponse.json<ApiResponse>({ ok: true });
}

import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { forgotPasswordSchema } from "@/lib/validations";
import type { AuthResponse } from "@/types";

/**
 * POST /api/auth/forgot-password
 * Envia o e-mail com o link de redefinição de senha. Responde sempre com
 * sucesso (mesmo se o e-mail não existir) para não revelar quais e-mails
 * estão cadastrados.
 */
export async function POST(request: Request) {
  const parsed = forgotPasswordSchema.safeParse(
    await request.json().catch(() => ({}))
  );
  if (!parsed.success) {
    return NextResponse.json<AuthResponse>(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 }
    );
  }

  const { email } = parsed.data;
  const origin = new URL(request.url).origin;

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/redefinir-senha`,
  });

  if (error) {
    console.error("[forgot-password] resetPasswordForEmail falhou:", {
      status: error.status,
      code: error.code,
      message: error.message,
    });

    if (error.status === 429 || error.code === "over_email_send_rate_limit") {
      return NextResponse.json<AuthResponse>(
        {
          error:
            "Muitas solicitações de redefinição. Aguarde alguns minutos e tente novamente.",
        },
        { status: 429 }
      );
    }
    // Demais erros não são expostos — resposta neutra abaixo.
  }

  return NextResponse.json<AuthResponse>({ ok: true });
}

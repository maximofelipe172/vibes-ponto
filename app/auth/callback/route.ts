import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * GET /auth/callback
 * Destino do link enviado por e-mail na recuperação de senha. Troca o
 * `code` por uma sessão temporária e encaminha para `next` (a tela de
 * redefinição), onde o usuário define a nova senha.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=link_invalido`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=link_expirado`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}

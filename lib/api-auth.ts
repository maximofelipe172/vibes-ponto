import { NextResponse } from "next/server";
import type { Profile } from "@prisma/client";

import { getCurrentProfile } from "@/lib/auth";
import { can, type Permission } from "@/lib/rbac/permissions";

/**
 * Autorização para rotas de API.
 *
 * "Nunca confiar apenas na interface": toda rota que expõe ou altera
 * dados deve começar por aqui. Retorna o perfil OU uma resposta de erro
 * pronta — nunca os dois.
 *
 * Uso:
 *   const auth = await authorize("user:read");
 *   if (!auth.ok) return auth.response;
 *   const { profile } = auth;
 */
type AuthorizeResult =
  | { ok: true; profile: Profile }
  | { ok: false; response: NextResponse };

export async function authorize(
  permission?: Permission
): Promise<AuthorizeResult> {
  const profile = await getCurrentProfile();

  if (!profile) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Não autenticado." },
        { status: 401 }
      ),
    };
  }

  if (permission && !can(profile.role, permission)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Você não tem permissão para esta ação." },
        { status: 403 }
      ),
    };
  }

  return { ok: true, profile };
}

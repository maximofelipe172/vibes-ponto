import { cache } from "react";
import { redirect } from "next/navigation";
import type { Profile } from "@prisma/client";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { can, type Permission } from "@/lib/rbac/permissions";

/** Para onde mandamos quem está autenticado mas sem permissão. */
const FALLBACK_ROUTE = "/dashboard";

/**
 * Perfil do colaborador autenticado, ou null.
 *
 * Resolvido pelo e-mail da sessão (o id de `auth.users` é independente do
 * id do perfil). Usuários **inativos** são tratados como sem acesso.
 * `cache` evita consultas duplicadas dentro do mesmo request.
 */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const email = user?.email?.toLowerCase();
  if (!email) return null;

  const profile = await prisma.profile.findUnique({ where: { email } });
  if (!profile || profile.status === "inactive") return null;

  return profile;
});

/** Garante colaborador autenticado — redireciona para /login caso contrário. */
export async function requireUser(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  return profile;
}

/**
 * Garante que o colaborador autenticado possui a permissão.
 * Sem sessão → /login. Sem permissão → /dashboard.
 */
export async function requirePermission(
  permission: Permission
): Promise<Profile> {
  const profile = await requireUser();
  if (!can(profile.role, permission)) redirect(FALLBACK_ROUTE);
  return profile;
}

/** Versão booleana, para decidir o que renderizar sem redirecionar. */
export async function hasPermission(permission: Permission): Promise<boolean> {
  const profile = await getCurrentProfile();
  return profile ? can(profile.role, permission) : false;
}

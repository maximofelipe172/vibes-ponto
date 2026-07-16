import type { Role } from "@prisma/client";

import { getCurrentProfile } from "@/lib/auth";
import { can, canAny, type Permission } from "@/lib/rbac/permissions";

/**
 * Guards de renderização (Server Components).
 *
 * Servem para ESCONDER interface — nunca para proteger dados. A proteção
 * real é sempre no servidor: `requirePermission` nas páginas e
 * `authorize` nas rotas de API.
 */

interface GuardProps {
  children: React.ReactNode;
  /** Renderizado quando o acesso é negado (padrão: nada). */
  fallback?: React.ReactNode;
}

/** Renderiza os filhos apenas para quem está autenticado (e ativo). */
export async function AuthGuard({ children, fallback = null }: GuardProps) {
  const profile = await getCurrentProfile();
  return <>{profile ? children : fallback}</>;
}

/** Renderiza os filhos apenas para os papéis informados. */
export async function RoleGuard({
  roles,
  children,
  fallback = null,
}: GuardProps & { roles: Role[] }) {
  const profile = await getCurrentProfile();
  const allowed = !!profile && roles.includes(profile.role);
  return <>{allowed ? children : fallback}</>;
}

/**
 * Renderiza os filhos apenas para quem tem a permissão.
 * Prefira este ao RoleGuard: descreve a intenção e não precisa mudar
 * quando novos papéis surgirem.
 */
export async function PermissionGuard({
  permission,
  anyOf,
  children,
  fallback = null,
}: GuardProps & { permission?: Permission; anyOf?: Permission[] }) {
  const profile = await getCurrentProfile();

  const allowed =
    !!profile &&
    (permission ? can(profile.role, permission) : true) &&
    (anyOf ? canAny(profile.role, anyOf) : true);

  return <>{allowed ? children : fallback}</>;
}

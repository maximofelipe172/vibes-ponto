import type { Permission } from "@/lib/rbac/permissions";

/**
 * Mapa rota → permissão exigida.
 *
 * Rotas não listadas exigem apenas sessão válida (ex.: /dashboard,
 * /historico e /perfil, acessíveis a todos os colaboradores).
 * A verificação real acontece no servidor (`requirePermission`), nunca
 * apenas na interface.
 */
interface ProtectedRoute {
  prefix: string;
  permission: Permission;
}

export const PROTECTED_ROUTES: readonly ProtectedRoute[] = [
  { prefix: "/admin", permission: "timeRecord:readAll" },
  { prefix: "/usuarios", permission: "user:read" },
  { prefix: "/relatorios", permission: "reports:read" },
  { prefix: "/configuracoes", permission: "settings:manage" },
];

/** Permissão exigida por uma rota, ou null se basta estar autenticado. */
export function permissionForRoute(pathname: string): Permission | null {
  const match = PROTECTED_ROUTES.find(
    (route) => pathname === route.prefix || pathname.startsWith(`${route.prefix}/`)
  );
  return match?.permission ?? null;
}

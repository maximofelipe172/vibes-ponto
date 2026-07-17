import type { Role } from "@prisma/client";

/**
 * ════════════════════════════════════════════════════════════════════
 *  RBAC — fonte única de verdade das permissões do sistema
 * ════════════════════════════════════════════════════════════════════
 *
 * Regra de ouro: NUNCA verificar papel diretamente (`role === "admin"`)
 * fora deste módulo. Sempre pergunte por uma PERMISSÃO (`can(role, ...)`).
 * Assim, adicionar um novo perfil (RH, Supervisor, Gestor) é só:
 *
 *   1. incluir o valor no enum `Role` (prisma/schema.prisma);
 *   2. adicionar uma entrada em `ROLE_PERMISSIONS` abaixo.
 *
 * Nenhuma tela, rota ou API precisa ser alterada.
 */

/** Todas as permissões do sistema, agrupadas por recurso. */
export const PERMISSIONS = [
  // Ponto próprio — todo colaborador (inclusive o admin) bate ponto.
  "timeRecord:create",
  "timeRecord:readOwn",
  // Ponto de terceiros
  "timeRecord:readAll",
  // Perfil próprio
  "profile:updateOwn",
  "profile:changeOwnPassword",
  // Gestão de usuários
  "user:read",
  "user:create",
  "user:update",
  "user:changeRole",
  "user:changeStatus",
  "user:delete",
  // Áreas administrativas
  "settings:manage",
  "companyLocation:manage",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

/** Permissões que todo colaborador possui, independente do papel. */
const COLLABORATOR_PERMISSIONS: Permission[] = [
  "timeRecord:create",
  "timeRecord:readOwn",
  "profile:updateOwn",
  "profile:changeOwnPassword",
];

/**
 * Mapa papel → permissões.
 *
 * O `Record<Role, ...>` faz o TypeScript exigir uma entrada para cada
 * papel: ao adicionar um novo valor no enum `Role`, o build quebra aqui
 * até que as permissões dele sejam declaradas — evitando que um perfil
 * novo nasça sem permissões definidas por esquecimento.
 */
export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  // O administrador também é um colaborador: bate ponto normalmente e
  // ainda acumula as permissões de gestão.
  admin: [
    ...COLLABORATOR_PERMISSIONS,
    "timeRecord:readAll",
    "user:read",
    "user:create",
    "user:update",
    "user:changeRole",
    "user:changeStatus",
    "user:delete",
    "settings:manage",
    "companyLocation:manage",
  ],
  employee: COLLABORATOR_PERMISSIONS,
};

/** Rótulo legível de cada papel (para exibição na interface). */
export const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrador",
  employee: "Funcionário",
};

/** Aparência do badge de cada papel — evita `role === "admin"` na interface. */
export const ROLE_BADGE_VARIANT: Record<Role, "default" | "secondary"> = {
  admin: "default",
  employee: "secondary",
};

/**
 * Permissão que caracteriza "administrar o sistema".
 *
 * Usada nas regras que protegem o sistema de ficar sem ninguém no comando.
 * Descrever a regra por permissão (e não por `role === "admin"`) faz com que
 * um perfil futuro como Gestor, se puder gerir usuários, conte para ela.
 */
export const ADMIN_CAPABILITY: Permission = "user:changeRole";

/** Papéis que possuem a permissão informada. */
export function rolesWith(permission: Permission): Role[] {
  return (Object.keys(ROLE_PERMISSIONS) as Role[]).filter((role) =>
    can(role, permission)
  );
}

/** O papel possui a permissão? */
export function can(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

/** O papel possui TODAS as permissões informadas? */
export function canAll(role: Role, permissions: Permission[]): boolean {
  return permissions.every((permission) => can(role, permission));
}

/** O papel possui AO MENOS UMA das permissões informadas? */
export function canAny(role: Role, permissions: Permission[]): boolean {
  return permissions.some((permission) => can(role, permission));
}

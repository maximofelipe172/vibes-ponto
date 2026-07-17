import type { Role } from "@prisma/client";

import { can, type Permission } from "@/lib/rbac/permissions";

/**
 * Menu lateral declarado uma única vez e filtrado por permissão.
 * Novos perfis herdam o menu automaticamente a partir das permissões —
 * não há lista de menu por papel para manter em sincronia.
 */
export interface NavItem {
  href: string;
  label: string;
  /** Nome do ícone em `lucide-react` (resolvido no componente). */
  icon: "LayoutDashboard" | "History" | "Users" | "Settings" | "User" | "Shield" | "MapPin";
  /** null = basta estar autenticado. */
  permission: Permission | null;
}

// "Relatórios" não é um item próprio: os registros de toda a equipe, com
// pesquisa e filtro de data, vivem no Painel Admin — era a mesma tela.
const NAV_ITEMS: readonly NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard", permission: null },
  { href: "/historico", label: "Histórico", icon: "History", permission: null },
  { href: "/admin", label: "Painel Admin", icon: "Shield", permission: "timeRecord:readAll" },
  { href: "/usuarios", label: "Usuários", icon: "Users", permission: "user:read" },
  { href: "/localizacao", label: "Localização", icon: "MapPin", permission: "companyLocation:manage" },
  { href: "/configuracoes", label: "Configurações", icon: "Settings", permission: "settings:manage" },
  { href: "/perfil", label: "Perfil", icon: "User", permission: null },
];

/** Itens de menu visíveis para o papel informado. */
export function navItemsFor(role: Role): NavItem[] {
  return NAV_ITEMS.filter(
    (item) => item.permission === null || can(role, item.permission)
  );
}

"use client";

import Link from "next/link";
import { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import {
  History,
  LayoutDashboard,
  Loader2,
  Settings,
  Shield,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { NavItem } from "@/lib/rbac/navigation";

const ICONS: Record<NavItem["icon"], LucideIcon> = {
  LayoutDashboard,
  History,
  Users,
  Settings,
  User,
  Shield,
};

/**
 * Ícone do item: vira spinner enquanto a navegação está em andamento.
 * `useLinkStatus` só funciona dentro de um <Link>.
 */
function NavIcon({ icon }: { icon: NavItem["icon"] }) {
  const { pending } = useLinkStatus();
  const Icon = ICONS[icon];

  return pending ? (
    <Loader2 className="size-4 shrink-0 animate-spin" />
  ) : (
    <Icon className="size-4 shrink-0" />
  );
}

interface SidebarNavProps {
  items: NavItem[];
  /** Fecha o menu mobile ao navegar. */
  onNavigate?: () => void;
}

/** Lista de links do menu, com destaque para a rota ativa. */
export function SidebarNav({ items, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            prefetch
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-secondary text-secondary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <NavIcon icon={item.icon} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

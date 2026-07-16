import Link from "next/link";
import { ChevronDown, Clock } from "lucide-react";
import type { Profile } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogoutButton } from "@/components/logout-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ROLE_LABELS } from "@/lib/rbac/permissions";
import { navItemsFor } from "@/lib/rbac/navigation";

function initials(nome: string): string {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

export function AppHeader({ profile }: { profile: Profile }) {
  const items = navItemsFor(profile.role);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-sm">
      <div className="flex h-14 items-center justify-between gap-2 px-4 sm:px-6">
        <div className="flex items-center gap-1">
          <MobileNav items={items} />
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-semibold"
          >
            <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Clock className="size-4" />
            </span>
            <span className="hidden sm:inline">Vibes Ponto</span>
          </Link>
        </div>

        <div className="flex items-center gap-1">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 px-2">
                <span className="flex size-7 items-center justify-center rounded-full bg-secondary text-xs font-semibold">
                  {initials(profile.nome)}
                </span>
                <span className="hidden max-w-32 truncate text-sm sm:inline">
                  {profile.nome}
                </span>
                <ChevronDown className="size-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="flex flex-col gap-1">
                <span>{profile.nome}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {profile.email}
                </span>
                <Badge variant="secondary" className="mt-1 w-fit">
                  {ROLE_LABELS[profile.role]}
                </Badge>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/perfil">Meu perfil</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <LogoutButton />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

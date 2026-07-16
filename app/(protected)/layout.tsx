import { AppHeader } from "@/components/layout/app-header";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { requireUser } from "@/lib/auth";
import { navItemsFor } from "@/lib/rbac/navigation";

/**
 * Layout das rotas autenticadas (AuthGuard de fato: sem sessão válida,
 * `requireUser` redireciona para /login antes de renderizar qualquer
 * coisa). O menu é montado a partir das permissões do papel.
 */
export default async function ProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const profile = await requireUser();
  const items = navItemsFor(profile.role);

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader profile={profile} />

      <div className="flex flex-1">
        <aside className="hidden w-56 shrink-0 border-r p-4 md:block">
          <SidebarNav items={items} />
        </aside>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentProfile } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { VibesLogo } from "@/components/vibes-logo";

/**
 * Tela inicial. Quem já está logado vai para o dashboard pessoal —
 * inclusive o administrador, que também é um colaborador e bate ponto.
 */
export default async function HomePage() {
  const profile = await getCurrentProfile();
  if (profile) redirect("/dashboard");

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 p-4">
      <div className="flex flex-col items-center gap-4 text-center animate-fade-in-up">
        <VibesLogo className="h-16 sm:h-20" />
        <h1 className="text-sm font-medium tracking-[0.25em] text-muted-foreground uppercase">
          Ponto
        </h1>
        <p className="max-w-xs text-sm text-muted-foreground">
          Registre sua entrada e saída e acompanhe seu histórico de horas.
        </p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-3 animate-fade-in-up [animation-delay:80ms]">
        <Button asChild size="lg" variant="brand">
          <Link href="/login">Entrar</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/cadastro">Criar conta</Link>
        </Button>
      </div>
    </main>
  );
}

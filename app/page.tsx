import Link from "next/link";
import { redirect } from "next/navigation";
import { Clock } from "lucide-react";

import { getCurrentProfile } from "@/lib/auth";
import { Button } from "@/components/ui/button";

/**
 * Tela inicial. Quem já está logado vai para o dashboard pessoal —
 * inclusive o administrador, que também é um colaborador e bate ponto.
 */
export default async function HomePage() {
  const profile = await getCurrentProfile();
  if (profile) redirect("/dashboard");

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 p-4">
      <div className="flex flex-col items-center gap-3 text-center animate-fade-in-up">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
          <Clock className="size-7" />
        </span>
        <h1 className="text-3xl font-semibold tracking-tight">Vibes Ponto</h1>
        <p className="max-w-xs text-sm text-muted-foreground">
          Registre sua entrada e saída e acompanhe seu histórico de horas.
        </p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-3 animate-fade-in-up [animation-delay:80ms]">
        <Button asChild size="lg">
          <Link href="/login">Entrar</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/cadastro">Criar conta</Link>
        </Button>
      </div>
    </main>
  );
}

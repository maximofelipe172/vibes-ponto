import Link from "next/link";
import { Clock } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface AuthShellProps {
  title: string;
  description: string;
  children: React.ReactNode;
  /** Rodapé opcional abaixo do card (ex.: "Não tem conta? Criar conta"). */
  footer?: React.ReactNode;
}

/** Moldura compartilhada pelas telas de autenticação. */
export function AuthShell({
  title,
  description,
  children,
  footer,
}: AuthShellProps) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-4">
      <Link
        href="/"
        className="flex flex-col items-center gap-2 animate-fade-in-up"
      >
        <span className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Clock className="size-6" />
        </span>
        <span className="text-2xl font-semibold tracking-tight">
          Vibes Ponto
        </span>
      </Link>

      <Card className="w-full max-w-sm animate-fade-in-up [animation-delay:60ms]">
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>

      {footer && (
        <div className="animate-fade-in-up text-center text-sm text-muted-foreground [animation-delay:120ms]">
          {footer}
        </div>
      )}
    </main>
  );
}

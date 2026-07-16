import type { Metadata } from "next";
import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Criar conta",
};

export default function CadastroPage() {
  return (
    <AuthShell
      title="Criar conta"
      description="Preencha seus dados para começar a registrar o ponto."
      footer={
        <>
          Já tem uma conta?{" "}
          <Link
            href="/login"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Entrar
          </Link>
        </>
      }
    >
      <SignUpForm />
    </AuthShell>
  );
}

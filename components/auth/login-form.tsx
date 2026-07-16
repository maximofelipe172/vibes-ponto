"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { signInSchema, type SignInInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormError } from "@/components/auth/form-error";
import { PasswordInput } from "@/components/auth/password-input";
import type { AuthResponse } from "@/types";

const LINK_ERRORS: Record<string, string> = {
  link_invalido: "Link de redefinição inválido. Solicite um novo.",
  link_expirado: "Link de redefinição expirado. Solicite um novo.",
};

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);

  const linkError = searchParams.get("error");
  const initialError = linkError ? (LINK_ERRORS[linkError] ?? null) : null;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", senha: "", lembrarMe: true },
  });

  async function onSubmit(values: SignInInput) {
    setServerError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = (await res.json()) as AuthResponse;

      if (!res.ok || !data.ok) {
        setServerError(data.error ?? "Não foi possível entrar.");
        return;
      }

      toast.success("Login realizado com sucesso!");
      router.push("/");
      router.refresh();
    } catch {
      setServerError("Erro de conexão. Tente novamente.");
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-4"
      noValidate
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          placeholder="voce@vibes.com"
          autoComplete="email"
          autoFocus
          aria-invalid={!!errors.email}
          {...register("email")}
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="senha">Senha</Label>
          <Link
            href="/esqueci-senha"
            className="text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            Esqueci minha senha
          </Link>
        </div>
        <PasswordInput
          id="senha"
          placeholder="••••••••"
          autoComplete="current-password"
          aria-invalid={!!errors.senha}
          {...register("senha")}
        />
        {errors.senha && (
          <p className="text-xs text-destructive">{errors.senha.message}</p>
        )}
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          className="size-4 cursor-pointer rounded border-input accent-primary"
          {...register("lembrarMe")}
        />
        Lembrar-me neste dispositivo
      </label>

      <FormError message={serverError ?? initialError} />

      <Button type="submit" disabled={isSubmitting} className="mt-1">
        {isSubmitting && <Loader2 className="animate-spin" />}
        {isSubmitting ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}

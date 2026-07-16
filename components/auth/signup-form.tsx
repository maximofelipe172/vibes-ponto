"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  MIN_PASSWORD_LENGTH,
  signUpSchema,
  type SignUpInput,
} from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormError } from "@/components/auth/form-error";
import { PasswordInput } from "@/components/auth/password-input";
import type { AuthResponse } from "@/types";

export function SignUpForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { nome: "", email: "", senha: "", confirmarSenha: "" },
  });

  async function onSubmit(values: SignUpInput) {
    setServerError(null);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = (await res.json()) as AuthResponse;

      // Exige `ok` explícito: respostas 2xx sem sessão (ex.: 202) não são sucesso.
      if (!res.ok || !data.ok) {
        setServerError(data.error ?? "Não foi possível criar a conta.");
        return;
      }

      toast.success("Conta criada com sucesso. Bem-vindo(a)!");
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
        <Label htmlFor="nome">Nome completo</Label>
        <Input
          id="nome"
          placeholder="Seu nome completo"
          autoComplete="name"
          autoFocus
          aria-invalid={!!errors.nome}
          {...register("nome")}
        />
        {errors.nome && (
          <p className="text-xs text-destructive">{errors.nome.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          placeholder="voce@vibes.com"
          autoComplete="email"
          aria-invalid={!!errors.email}
          {...register("email")}
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="senha">Senha</Label>
        <PasswordInput
          id="senha"
          placeholder={`Mínimo de ${MIN_PASSWORD_LENGTH} caracteres`}
          autoComplete="new-password"
          aria-invalid={!!errors.senha}
          {...register("senha")}
        />
        {errors.senha && (
          <p className="text-xs text-destructive">{errors.senha.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="confirmarSenha">Confirmar senha</Label>
        <PasswordInput
          id="confirmarSenha"
          placeholder="Repita a senha"
          autoComplete="new-password"
          aria-invalid={!!errors.confirmarSenha}
          {...register("confirmarSenha")}
        />
        {errors.confirmarSenha && (
          <p className="text-xs text-destructive">
            {errors.confirmarSenha.message}
          </p>
        )}
      </div>

      <FormError message={serverError} />

      <Button type="submit" disabled={isSubmitting} className="mt-1">
        {isSubmitting && <Loader2 className="animate-spin" />}
        {isSubmitting ? "Criando conta..." : "Criar conta"}
      </Button>
    </form>
  );
}

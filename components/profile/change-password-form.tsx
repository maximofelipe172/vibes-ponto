"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  MIN_PASSWORD_LENGTH,
  changePasswordSchema,
  type ChangePasswordInput,
} from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FormError } from "@/components/auth/form-error";
import { PasswordInput } from "@/components/auth/password-input";
import type { ApiResponse } from "@/types";

export function ChangePasswordForm() {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { senhaAtual: "", novaSenha: "", confirmarSenha: "" },
  });

  async function onSubmit(values: ChangePasswordInput) {
    setServerError(null);
    try {
      const res = await fetch("/api/profile/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = (await res.json()) as ApiResponse;

      if (!res.ok || !data.ok) {
        setServerError(data.error ?? "Não foi possível alterar a senha.");
        return;
      }

      toast.success("Senha alterada com sucesso!");
      reset();
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
        <Label htmlFor="senhaAtual">Senha atual</Label>
        <PasswordInput
          id="senhaAtual"
          autoComplete="current-password"
          aria-invalid={!!errors.senhaAtual}
          {...register("senhaAtual")}
        />
        {errors.senhaAtual && (
          <p className="text-xs text-destructive">{errors.senhaAtual.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="novaSenha">Nova senha</Label>
        <PasswordInput
          id="novaSenha"
          placeholder={`Mínimo de ${MIN_PASSWORD_LENGTH} caracteres`}
          autoComplete="new-password"
          aria-invalid={!!errors.novaSenha}
          {...register("novaSenha")}
        />
        {errors.novaSenha && (
          <p className="text-xs text-destructive">{errors.novaSenha.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="confirmarSenha">Confirmar nova senha</Label>
        <PasswordInput
          id="confirmarSenha"
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

      <Button type="submit" disabled={isSubmitting} className="mt-1 w-fit">
        {isSubmitting && <Loader2 className="animate-spin" />}
        {isSubmitting ? "Alterando..." : "Alterar senha"}
      </Button>
    </form>
  );
}

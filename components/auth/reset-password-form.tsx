"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import {
  MIN_PASSWORD_LENGTH,
  resetPasswordSchema,
  type ResetPasswordInput,
} from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FormError } from "@/components/auth/form-error";
import { PasswordInput } from "@/components/auth/password-input";

/**
 * Define a nova senha. Depende da sessão temporária criada em
 * /auth/callback ao abrir o link recebido por e-mail.
 */
export function ResetPasswordForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { senha: "", confirmarSenha: "" },
  });

  async function onSubmit(values: ResetPasswordInput) {
    setServerError(null);
    const supabase = createClient();

    const { error } = await supabase.auth.updateUser({ password: values.senha });

    if (error) {
      setServerError(
        error.message.toLowerCase().includes("session")
          ? "Sessão de redefinição expirada. Solicite um novo link."
          : "Não foi possível redefinir a senha. Tente novamente."
      );
      return;
    }

    toast.success("Senha redefinida com sucesso!");
    router.push("/");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-4"
      noValidate
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="senha">Nova senha</Label>
        <PasswordInput
          id="senha"
          placeholder={`Mínimo de ${MIN_PASSWORD_LENGTH} caracteres`}
          autoComplete="new-password"
          autoFocus
          aria-invalid={!!errors.senha}
          {...register("senha")}
        />
        {errors.senha && (
          <p className="text-xs text-destructive">{errors.senha.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="confirmarSenha">Confirmar nova senha</Label>
        <PasswordInput
          id="confirmarSenha"
          placeholder="Repita a nova senha"
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
        {isSubmitting ? "Salvando..." : "Redefinir senha"}
      </Button>
    </form>
  );
}

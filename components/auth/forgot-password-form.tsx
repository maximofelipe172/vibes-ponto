"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, MailCheck } from "lucide-react";

import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormError } from "@/components/auth/form-error";
import type { AuthResponse } from "@/types";

export function ForgotPasswordForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordInput) {
    setServerError(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = (await res.json()) as AuthResponse;

      if (!res.ok) {
        setServerError(data.error ?? "Não foi possível enviar o e-mail.");
        return;
      }

      setSentTo(values.email);
    } catch {
      setServerError("Erro de conexão. Tente novamente.");
    }
  }

  if (sentTo) {
    return (
      <div className="flex flex-col items-center gap-3 py-2 text-center animate-fade-in-up">
        <span className="flex size-10 items-center justify-center rounded-full bg-success/15">
          <MailCheck className="size-5 text-success" />
        </span>
        <p className="text-sm">
          Se houver uma conta para{" "}
          <span className="font-medium">{sentTo}</span>, enviamos um link para
          redefinir a senha.
        </p>
        <p className="text-xs text-muted-foreground">
          Confira sua caixa de entrada e o spam. O link expira em 1 hora.
        </p>
      </div>
    );
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

      <FormError message={serverError} />

      <Button type="submit" disabled={isSubmitting} className="mt-1">
        {isSubmitting && <Loader2 className="animate-spin" />}
        {isSubmitting ? "Enviando..." : "Enviar link de redefinição"}
      </Button>
    </form>
  );
}

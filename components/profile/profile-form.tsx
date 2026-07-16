"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Profile } from "@prisma/client";

import { updateProfileSchema, type UpdateProfileInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormError } from "@/components/auth/form-error";
import type { ApiResponse } from "@/types";

/** Edição dos próprios dados. Papel e status não são editáveis aqui. */
export function ProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      nome: profile.nome,
      cargo: profile.cargo ?? "",
      departamento: profile.departamento ?? "",
    },
  });

  async function onSubmit(values: UpdateProfileInput) {
    setServerError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = (await res.json()) as ApiResponse;

      if (!res.ok || !data.ok) {
        setServerError(data.error ?? "Não foi possível salvar.");
        return;
      }

      toast.success("Dados atualizados com sucesso!");
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
        <Input id="nome" aria-invalid={!!errors.nome} {...register("nome")} />
        {errors.nome && (
          <p className="text-xs text-destructive">{errors.nome.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" value={profile.email} disabled readOnly />
        <p className="text-xs text-muted-foreground">
          O e-mail é a identificação da conta e não pode ser alterado aqui.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="cargo">Cargo</Label>
          <Input
            id="cargo"
            placeholder="Ex.: Analista"
            {...register("cargo")}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="departamento">Departamento</Label>
          <Input
            id="departamento"
            placeholder="Ex.: Operações"
            {...register("departamento")}
          />
        </div>
      </div>

      <FormError message={serverError} />

      <Button type="submit" disabled={isSubmitting} className="mt-1 w-fit">
        {isSubmitting && <Loader2 className="animate-spin" />}
        {isSubmitting ? "Salvando..." : "Salvar alterações"}
      </Button>
    </form>
  );
}

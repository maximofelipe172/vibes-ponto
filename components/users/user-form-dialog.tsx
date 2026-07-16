"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  MIN_PASSWORD_LENGTH,
  createUserSchema,
  updateUserSchema,
  type CreateUserInput,
  type UpdateUserInput,
} from "@/lib/validations";
import { ROLE_LABELS } from "@/lib/rbac/permissions";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { FormError } from "@/components/auth/form-error";
import { PasswordInput } from "@/components/auth/password-input";
import type { ApiResponse, UserRow } from "@/types";

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Ausente = criação; presente = edição. */
  user?: UserRow | null;
}

type FormValues = CreateUserInput & Partial<UpdateUserInput>;

/** Formulário único para criar e editar usuários. */
export function UserFormDialog({
  open,
  onOpenChange,
  user,
}: UserFormDialogProps) {
  const router = useRouter();
  const isEdit = !!user;
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(isEdit ? updateUserSchema : createUserSchema),
    defaultValues: {
      nome: "",
      email: "",
      senha: "",
      cargo: "",
      departamento: "",
      role: "employee",
      status: "active",
    },
  });

  // Recarrega os valores ao abrir (ou ao trocar o usuário editado).
  useEffect(() => {
    if (!open) return;
    reset({
      nome: user?.nome ?? "",
      email: user?.email ?? "",
      senha: "",
      cargo: user?.cargo ?? "",
      departamento: user?.departamento ?? "",
      role: user?.role ?? "employee",
      status: user?.status ?? "active",
    });
    setServerError(null);
  }, [open, user, reset]);

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      const res = await fetch(
        isEdit ? `/api/users/${user!.id}` : "/api/users",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        }
      );
      const data = (await res.json()) as ApiResponse;

      if (!res.ok || !data.ok) {
        setServerError(data.error ?? "Não foi possível salvar.");
        return;
      }

      toast.success(isEdit ? "Usuário atualizado!" : "Usuário criado!");
      onOpenChange(false);
      router.refresh();
    } catch {
      setServerError("Erro de conexão. Tente novamente.");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Editar usuário" : "Adicionar usuário"}
      description={
        isEdit
          ? "Atualize os dados, o tipo de usuário e o status."
          : "A conta é criada já ativa e pronta para uso."
      }
    >
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
          <Input
            id="email"
            type="email"
            disabled={isEdit}
            readOnly={isEdit}
            aria-invalid={!!errors.email}
            {...register("email")}
          />
          {isEdit && (
            <p className="text-xs text-muted-foreground">
              O e-mail identifica a conta e não pode ser alterado.
            </p>
          )}
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        {!isEdit && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="senha">Senha inicial</Label>
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
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="cargo">Cargo</Label>
            <Input id="cargo" placeholder="Ex.: Analista" {...register("cargo")} />
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="role">Tipo de usuário</Label>
            <Select id="role" {...register("role")}>
              <option value="employee">{ROLE_LABELS.employee}</option>
              <option value="admin">{ROLE_LABELS.admin}</option>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="status">Status</Label>
            <Select id="status" {...register("status")}>
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
            </Select>
          </div>
        </div>

        <FormError message={serverError} />

        <div className="mt-1 flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            {isSubmitting ? "Salvando..." : isEdit ? "Salvar" : "Criar usuário"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

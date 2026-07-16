import type { Metadata } from "next";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProfileForm } from "@/components/profile/profile-form";
import { ChangePasswordForm } from "@/components/profile/change-password-form";
import { requireUser } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/rbac/permissions";

export const metadata: Metadata = { title: "Perfil" };

/** Perfil próprio — disponível a todos os colaboradores. */
export default async function PerfilPage() {
  const profile = await requireUser();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Meu perfil</h1>
          <p className="text-sm text-muted-foreground">
            Atualize seus dados pessoais e sua senha.
          </p>
        </div>
        <Badge variant="secondary">{ROLE_LABELS[profile.role]}</Badge>
      </div>

      <Card className="animate-fade-in-up">
        <CardHeader>
          <CardTitle>Dados pessoais</CardTitle>
          <CardDescription>Como você aparece no sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm profile={profile} />
        </CardContent>
      </Card>

      <Card className="animate-fade-in-up [animation-delay:80ms]">
        <CardHeader>
          <CardTitle>Alterar senha</CardTitle>
          <CardDescription>
            Confirme a senha atual para definir uma nova.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}

import { createClient } from "@supabase/supabase-js";

import { supabasePublicEnv, supabaseServiceRoleKey } from "@/lib/env";

/**
 * Cliente administrativo do Supabase (service role).
 *
 * ATENÇÃO: ignora todas as políticas de acesso — use SOMENTE em Route
 * Handlers / código de servidor, nunca em componentes client. A chave
 * vem de `SUPABASE_SERVICE_ROLE_KEY`, que não tem o prefixo
 * `NEXT_PUBLIC_` justamente para nunca ser enviada ao navegador.
 *
 * Usado no cadastro para criar a conta já confirmada, permitindo o login
 * automático sem depender de e-mail de confirmação.
 */
export function createAdminClient() {
  const { url } = supabasePublicEnv();
  return createClient(url, supabaseServiceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

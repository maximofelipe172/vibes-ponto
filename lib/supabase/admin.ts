import { createClient } from "@supabase/supabase-js";

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
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

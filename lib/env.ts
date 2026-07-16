/**
 * Leitura validada das variáveis de ambiente.
 *
 * Usar `process.env.X!` engana o TypeScript: se a variável não existir em
 * produção (o `.env` não vai para o repositório), o erro que estoura é
 * genérico e longe da causa — no middleware, vira um
 * `MIDDLEWARE_INVOCATION_FAILED` sem explicação.
 *
 * Aqui a falha é explícita e diz exatamente o que configurar.
 */
function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Variável de ambiente ausente: ${name}. ` +
        `Configure-a no .env (local) ou nas variáveis de ambiente da ` +
        `plataforma de deploy (Vercel: Settings → Environment Variables).`
    );
  }
  return value;
}

/** URL e chave pública do Supabase — seguras no navegador. */
export function supabasePublicEnv() {
  return {
    url: required(
      "NEXT_PUBLIC_SUPABASE_URL",
      process.env.NEXT_PUBLIC_SUPABASE_URL
    ),
    anonKey: required(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ),
  };
}

/** Chave service role — SOMENTE no servidor. */
export function supabaseServiceRoleKey(): string {
  return required(
    "SUPABASE_SERVICE_ROLE_KEY",
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

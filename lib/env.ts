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

/**
 * URL pública e canônica do site — base dos links enviados por e-mail
 * (ex.: redefinição de senha).
 *
 * Não derivamos da requisição porque, na Vercel, cada deploy tem uma URL
 * própria (`vibes-ponto-abc123-org.vercel.app`). Um link apontando para
 * ela seria rejeitado pela lista de "Redirect URLs" do Supabase, que
 * silenciosamente cai no Site URL — e o e-mail chega com um link errado.
 *
 * Ordem: NEXT_PUBLIC_SITE_URL → domínio de produção da Vercel → origem
 * da requisição (desenvolvimento local).
 */
export function siteUrl(requestOrigin?: string): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");

  const vercelProduction = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelProduction) return `https://${vercelProduction}`;

  if (requestOrigin) return requestOrigin;

  throw new Error(
    "Não foi possível determinar a URL do site. Configure NEXT_PUBLIC_SITE_URL."
  );
}

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

import { supabasePublicEnv } from "@/lib/env";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Cliente Supabase para Server Components e Route Handlers.
 *
 * `persistSession` controla o "Lembrar-me": quando `false`, os cookies de
 * sessão são gravados sem `maxAge`/`expires`, virando cookies de sessão —
 * o navegador os descarta ao ser fechado. Quando `true` (padrão), vale a
 * expiração do próprio Supabase e o login sobrevive ao fechar o navegador.
 */
export async function createClient(persistSession = true) {
  const cookieStore = await cookies();
  const { url, anonKey } = supabasePublicEnv();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            const cookieOptions = persistSession
              ? options
              : { ...options, maxAge: undefined, expires: undefined };
            cookieStore.set(name, value, cookieOptions);
          });
        } catch {
          // Chamado a partir de um Server Component — pode ser ignorado
          // quando o middleware está atualizando a sessão.
        }
      },
    },
  });
}

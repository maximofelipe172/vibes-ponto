import { Skeleton } from "@/components/ui/skeleton";

/**
 * Exibido instantaneamente enquanto a página é renderizada no servidor.
 *
 * Sem isto o Next segura a navegação até o servidor responder (~1-2s,
 * por causa da latência do banco): a tela fica parada e parece que o
 * clique não funcionou — levando o usuário a clicar de novo.
 */
export default function Loading() {
  return (
    <div className="flex animate-pulse flex-col gap-6" aria-busy="true">
      <span className="sr-only">Carregando…</span>

      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-72" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>

      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

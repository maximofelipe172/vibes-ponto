import { cn } from "@/lib/utils";

/**
 * Logo oficial da Vibes.
 *
 * Servida como arquivo (`public/vibes-logo.svg`) em vez de SVG inline:
 * o arquivo usa gradientes com `id` fixo, e duas cópias inline na mesma
 * página colidiriam os ids.
 *
 * A arte vai de rosa a laranja (a ponta escura do gradiente fica fora do
 * desenho), então funciona nos temas claro e escuro sem ajuste.
 */
export function VibesLogo({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/vibes-logo.svg"
      alt="Vibes"
      // Proporção original: 17058 × 9861.
      width={1706}
      height={986}
      className={cn("h-auto w-auto select-none", className)}
      draggable={false}
    />
  );
}

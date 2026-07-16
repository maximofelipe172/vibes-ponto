"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, Loader2, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { daysInMonth } from "@/lib/time";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

interface PeriodFilterProps {
  dia: number | null;
  mes: number | null;
  ano: number;
  /** Anos disponíveis (do registro mais antigo até hoje). */
  anos: number[];
  /** true quando o período é exatamente o dia de hoje. */
  isHoje: boolean;
}

/**
 * Seletores de dia, mês e ano — refletidos na URL para que o servidor
 * refaça as contas do período. "Todos" em mês/dia amplia o período.
 */
export function PeriodFilter({ dia, mes, ano, anos, isHoje }: PeriodFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function apply(next: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }

  const totalDias = daysInMonth(mes ?? 1, ano);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <CalendarDays className="size-4" />
        Período:
      </span>

      <Select
        aria-label="Dia"
        className="w-28"
        value={dia ?? ""}
        // Sem mês definido não há dia a escolher.
        disabled={!mes}
        onChange={(e) => apply({ dia: e.target.value })}
      >
        <option value="">Todos</option>
        {Array.from({ length: totalDias }, (_, i) => i + 1).map((d) => (
          <option key={d} value={d}>
            Dia {d}
          </option>
        ))}
      </Select>

      <Select
        aria-label="Mês"
        className="w-36"
        value={mes ?? ""}
        onChange={(e) =>
          // Ao limpar o mês, o dia perde o sentido.
          apply({ mes: e.target.value, dia: e.target.value ? String(dia ?? "") : "" })
        }
      >
        <option value="">Todos os meses</option>
        {MESES.map((label, index) => (
          <option key={label} value={index + 1}>
            {label}
          </option>
        ))}
      </Select>

      <Select
        aria-label="Ano"
        className="w-28"
        value={ano}
        onChange={(e) => apply({ ano: e.target.value })}
      >
        {anos.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </Select>

      {!isHoje && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => apply({ dia: "", mes: "", ano: "" })}
        >
          <RotateCcw />
          Hoje
        </Button>
      )}

      {isPending && (
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
      )}
    </div>
  );
}

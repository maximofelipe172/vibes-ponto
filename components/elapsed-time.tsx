"use client";

import { useEffect, useState } from "react";

interface ElapsedTimeProps {
  /** Instante da entrada (ISO). */
  entrada: string;
  /** Instante da saída (ISO) ou null quando o expediente está aberto. */
  saida: string | null;
}

/** "5h 30min" a partir de uma duração em milissegundos. */
function format(ms: number): string {
  const totalMin = Math.max(0, Math.floor(ms / 60_000));
  const horas = Math.floor(totalMin / 60);
  const minutos = totalMin % 60;
  return `${horas}h ${String(minutos).padStart(2, "0")}min`;
}

/**
 * Horas trabalhadas no dia.
 *
 * Com o expediente aberto, conta ao vivo desde a entrada — assim a
 * pessoa sabe quanto já trabalhou sem precisar registrar a saída.
 * Encerrado, mostra o total fechado.
 *
 * O valor só é calculado após a montagem no client: o horário do
 * servidor e o do navegador nunca batem no milissegundo, e renderizar
 * "agora" no servidor causaria erro de hidratação.
 */
export function ElapsedTime({ entrada, saida }: ElapsedTimeProps) {
  const emAndamento = !saida;
  const [agora, setAgora] = useState<number | null>(null);

  useEffect(() => {
    if (!emAndamento) return;

    function tick() {
      setAgora(Date.now());
    }
    tick();
    const intervalo = setInterval(tick, 1000);
    return () => clearInterval(intervalo);
  }, [emAndamento]);

  if (!emAndamento) {
    const total = new Date(saida).getTime() - new Date(entrada).getTime();
    return <span className="tabular-nums">{format(total)}</span>;
  }

  if (agora === null) {
    return <span className="tabular-nums text-muted-foreground">--</span>;
  }

  return (
    <span className="flex items-center gap-2">
      <span className="tabular-nums">
        {format(agora - new Date(entrada).getTime())}
      </span>
      <span
        aria-label="Contando em tempo real"
        title="Contando em tempo real"
        className="size-2 shrink-0 animate-pulse rounded-full bg-success"
      />
    </span>
  );
}

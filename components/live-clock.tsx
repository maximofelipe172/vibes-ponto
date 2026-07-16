"use client";

import { useEffect, useState } from "react";

/** Relógio ao vivo (HH:mm:ss) renderizado apenas no client para evitar
 *  divergência de hidratação. */
export function LiveClock() {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    function tick() {
      setTime(
        new Date().toLocaleTimeString("pt-BR", {
          timeZone: "America/Sao_Paulo",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    }
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <p className="font-mono text-4xl font-semibold tabular-nums tracking-tight sm:text-5xl">
      {time ?? "--:--:--"}
    </p>
  );
}

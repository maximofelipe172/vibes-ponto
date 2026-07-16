"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, LogIn, LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { ClockResponse, DayStatus } from "@/types";

interface PunchButtonProps {
  status: DayStatus;
}

/**
 * Botão inteligente de ponto: alterna automaticamente entre
 * "Registrar Entrada" e "Registrar Saída" conforme o status do dia,
 * e é desabilitado quando o expediente já foi encerrado.
 */
export function PunchButton({ status }: PunchButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handlePunch() {
    setLoading(true);
    try {
      const res = await fetch("/api/time-records", { method: "POST" });
      const data = (await res.json()) as ClockResponse & { error?: string };

      if (!res.ok) {
        toast.error(data.error ?? "Não foi possível registrar o ponto.");
        return;
      }

      const time = new Date(
        data.action === "ENTRADA" ? data.record.entrada : data.record.saida!
      ).toLocaleTimeString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        hour: "2-digit",
        minute: "2-digit",
      });

      toast.success(
        data.action === "ENTRADA"
          ? `Entrada registrada com sucesso às ${time}. Bom trabalho!`
          : `Saída registrada com sucesso às ${time}. Até amanhã!`
      );
      router.refresh();
    } catch {
      toast.error("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (status === "ENCERRADO") {
    return (
      <Button size="lg" disabled className="w-full sm:w-auto">
        <CheckCircle2 />
        Expediente encerrado
      </Button>
    );
  }

  const isEntrada = status === "SEM_REGISTRO";

  return (
    <Button
      size="lg"
      onClick={handlePunch}
      disabled={loading}
      variant={isEntrada ? "default" : "destructive"}
      className="w-full sm:w-auto"
    >
      {loading ? <Loader2 className="animate-spin" /> : isEntrada ? <LogIn /> : <LogOut />}
      {isEntrada ? "Registrar Entrada" : "Registrar Saída"}
    </Button>
  );
}

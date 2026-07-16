/**
 * Datas e horas no fuso de referência da empresa (São Paulo, UTC-3).
 * O Brasil não adota horário de verão desde 2019, então o offset é fixo.
 * Toda formatação usa Intl com `timeZone` explícito para funcionar
 * corretamente independentemente do fuso do servidor.
 */
const TZ = "America/Sao_Paulo";
const UTC_OFFSET_HOURS = 3; // 00:00 em São Paulo = 03:00 em UTC
const MS_PER_HOUR = 3_600_000;

/** Data "YYYY-MM-DD" de um instante, no fuso de São Paulo. */
export function toIsoDate(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Intervalo [início, fim) de uma data "YYYY-MM-DD" no fuso de São Paulo. */
export function dayRange(isoDate: string): { start: Date; end: Date } {
  const [year, month, day] = isoDate.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, day, UTC_OFFSET_HOURS));
  const end = new Date(start.getTime() + 24 * MS_PER_HOUR);
  return { start, end };
}

/** Intervalo [início, fim) do dia atual no fuso de São Paulo. */
export function todayRange(now: Date = new Date()): { start: Date; end: Date } {
  return dayRange(toIsoDate(now));
}

/** "14/03/2026" */
export function formatDate(date: Date): string {
  return date.toLocaleDateString("pt-BR", { timeZone: TZ });
}

/** "08:32" */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString("pt-BR", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "segunda-feira, 14 de março de 2026" */
export function formatFullDate(date: Date): string {
  return date.toLocaleDateString("pt-BR", {
    timeZone: TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Partes da data (no fuso de São Paulo) de um instante. */
export function dateParts(date: Date = new Date()): {
  dia: number;
  mes: number;
  ano: number;
} {
  const [ano, mes, dia] = toIsoDate(date).split("-").map(Number);
  return { dia, mes, ano };
}

/**
 * Intervalo [início, fim) para um período flexível no fuso de São Paulo.
 *
 * - dia + mês + ano → aquele dia
 * - mês + ano       → o mês inteiro
 * - só ano          → o ano inteiro
 */
export function periodRange(period: {
  dia?: number | null;
  mes?: number | null;
  ano: number;
}): { start: Date; end: Date } {
  const { dia, mes, ano } = period;

  if (mes && dia) {
    const start = new Date(Date.UTC(ano, mes - 1, dia, UTC_OFFSET_HOURS));
    return { start, end: new Date(start.getTime() + 24 * MS_PER_HOUR) };
  }

  if (mes) {
    return {
      start: new Date(Date.UTC(ano, mes - 1, 1, UTC_OFFSET_HOURS)),
      end: new Date(Date.UTC(ano, mes, 1, UTC_OFFSET_HOURS)),
    };
  }

  return {
    start: new Date(Date.UTC(ano, 0, 1, UTC_OFFSET_HOURS)),
    end: new Date(Date.UTC(ano + 1, 0, 1, UTC_OFFSET_HOURS)),
  };
}

/** Quantidade de dias de um mês (para montar o seletor de dia). */
export function daysInMonth(mes: number, ano: number): number {
  return new Date(Date.UTC(ano, mes, 0)).getUTCDate();
}

/** Rótulo legível do período selecionado. */
export function periodLabel(period: {
  dia?: number | null;
  mes?: number | null;
  ano: number;
}): string {
  const { dia, mes, ano } = period;
  const meses = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
  ];

  if (mes && dia) return `${String(dia).padStart(2, "0")}/${String(mes).padStart(2, "0")}/${ano}`;
  if (mes) return `${meses[mes - 1]} de ${ano}`;
  return String(ano);
}

/** Duração entre entrada e saída no formato "8h 15min". */
export function formatDuration(entrada: Date, saida: Date | null): string {
  if (!saida) return "—";
  const totalMinutes = Math.max(
    0,
    Math.round((saida.getTime() - entrada.getTime()) / 60_000)
  );
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${String(minutes).padStart(2, "0")}min`;
}

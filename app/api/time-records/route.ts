import { NextResponse } from "next/server";

import { authorize } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { todayRange } from "@/lib/time";
import { formatDistance, haversineDistance } from "@/lib/geo";
import { punchLocationSchema } from "@/lib/validations";
import type { ClockResponse } from "@/types";

/** Identificação enxuta do dispositivo, a partir do User-Agent. */
function parseDevice(userAgent: string | null): string {
  if (!userAgent) return "Desconhecido";

  const so = /iPhone|iPad/i.test(userAgent)
    ? "iOS"
    : /Android/i.test(userAgent)
      ? "Android"
      : /Windows/i.test(userAgent)
        ? "Windows"
        : /Mac OS X|Macintosh/i.test(userAgent)
          ? "macOS"
          : /Linux/i.test(userAgent)
            ? "Linux"
            : "Outro";

  const navegador = /Edg\//i.test(userAgent)
    ? "Edge"
    : /OPR\//i.test(userAgent)
      ? "Opera"
      : /Chrome\//i.test(userAgent)
        ? "Chrome"
        : /Safari\//i.test(userAgent)
          ? "Safari"
          : /Firefox\//i.test(userAgent)
            ? "Firefox"
            : "Navegador";

  return `${so} · ${navegador}`;
}

/**
 * POST /api/time-records
 * Registra o ponto do colaborador autenticado — administradores
 * inclusive, que também são colaboradores.
 *
 * Geofencing: quando existe uma área cadastrada, a posição é
 * OBRIGATÓRIA e a distância é RECALCULADA aqui. O navegador só sugere;
 * quem decide é o servidor — do contrário bastaria adulterar o request
 * para bater ponto de casa.
 */
export async function POST(request: Request) {
  const auth = await authorize("timeRecord:create");
  if (!auth.ok) return auth.response;

  const { profile } = auth;
  const body = await request.json().catch(() => ({}));
  const empresa = await prisma.companyLocation.findFirst();

  let posicao: { lat: number; lng: number; accuracy: number | null } | null =
    null;
  let distancia: number | null = null;

  // Sem área cadastrada, o geofencing fica desligado: exigir posição
  // travaria a equipe inteira até alguém configurar a localização.
  if (empresa) {
    const parsed = punchLocationSchema.safeParse(body?.location);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            "É necessário permitir o acesso à localização para registrar seu ponto.",
          code: "LOCATION_REQUIRED",
        },
        { status: 400 }
      );
    }

    const { latitude, longitude, accuracy } = parsed.data;
    distancia = haversineDistance(
      { latitude, longitude },
      { latitude: empresa.latitude, longitude: empresa.longitude }
    );

    if (distancia > empresa.radiusMeters) {
      return NextResponse.json(
        {
          error: "Você não está dentro da área autorizada para registrar o ponto.",
          code: "OUT_OF_RANGE",
          distance: Math.round(distancia),
          radius: empresa.radiusMeters,
          detail: `Você está a ${formatDistance(distancia)} da empresa (limite: ${formatDistance(empresa.radiusMeters)}).`,
        },
        { status: 403 }
      );
    }

    posicao = { lat: latitude, lng: longitude, accuracy: accuracy ?? null };
  }

  const device = parseDevice(request.headers.get("user-agent"));
  const now = new Date();
  const { start, end } = todayRange(now);

  const existing = await prisma.timeRecord.findFirst({
    where: { profileId: profile.id, entrada: { gte: start, lt: end } },
    orderBy: { entrada: "desc" },
  });

  if (existing?.saida) {
    return NextResponse.json(
      { error: "Expediente de hoje já foi encerrado." },
      { status: 409 }
    );
  }

  // Clock-out: completa o registro aberto.
  if (existing) {
    const record = await prisma.timeRecord.update({
      where: { id: existing.id },
      data: {
        saida: now,
        saidaLat: posicao?.lat ?? null,
        saidaLng: posicao?.lng ?? null,
        saidaAccuracy: posicao?.accuracy ?? null,
        saidaDistance: distancia,
        saidaDevice: device,
      },
    });
    const body: ClockResponse = {
      action: "SAIDA",
      record: {
        id: record.id,
        entrada: record.entrada.toISOString(),
        saida: record.saida!.toISOString(),
      },
    };
    return NextResponse.json(body);
  }

  // Clock-in: abre o registro do dia.
  const record = await prisma.timeRecord.create({
    data: {
      profileId: profile.id,
      entrada: now,
      entradaLat: posicao?.lat ?? null,
      entradaLng: posicao?.lng ?? null,
      entradaAccuracy: posicao?.accuracy ?? null,
      entradaDistance: distancia,
      entradaDevice: device,
    },
  });
  const responseBody: ClockResponse = {
    action: "ENTRADA",
    record: {
      id: record.id,
      entrada: record.entrada.toISOString(),
      saida: null,
    },
  };
  return NextResponse.json(responseBody, { status: 201 });
}

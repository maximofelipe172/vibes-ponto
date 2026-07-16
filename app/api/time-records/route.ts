import { NextResponse } from "next/server";

import { authorize } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { todayRange } from "@/lib/time";
import type { ClockResponse } from "@/types";

/**
 * POST /api/time-records
 * Registra o ponto do colaborador autenticado — inclusive administradores,
 * que também são colaboradores:
 * - sem registro hoje  → cria registro com `entrada` (clock-in)
 * - com entrada aberta → preenche `saida` (clock-out)
 * - expediente já encerrado → 409
 */
export async function POST() {
  const auth = await authorize("timeRecord:create");
  if (!auth.ok) return auth.response;

  const { profile } = auth;
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

  if (existing) {
    const record = await prisma.timeRecord.update({
      where: { id: existing.id },
      data: { saida: now },
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

  const record = await prisma.timeRecord.create({
    data: { profileId: profile.id, entrada: now },
  });
  const body: ClockResponse = {
    action: "ENTRADA",
    record: {
      id: record.id,
      entrada: record.entrada.toISOString(),
      saida: null,
    },
  };
  return NextResponse.json(body, { status: 201 });
}

import { NextResponse } from "next/server";

import { authorize } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { companyLocationSchema } from "@/lib/validations";
import type { ApiResponse } from "@/types";

/** A área autorizada é uma linha única — id fixo garante isso no banco. */
const SINGLETON = "SINGLETON";

/**
 * PUT /api/company-location
 * Define (ou atualiza) a área autorizada para bater ponto.
 * Exige `companyLocation:manage` — verificado no servidor.
 */
export async function PUT(request: Request) {
  const auth = await authorize("companyLocation:manage");
  if (!auth.ok) return auth.response;

  const parsed = companyLocationSchema.safeParse(
    await request.json().catch(() => ({}))
  );
  if (!parsed.success) {
    return NextResponse.json<ApiResponse>(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 }
    );
  }

  const { latitude, longitude, radiusMeters } = parsed.data;

  await prisma.companyLocation.upsert({
    where: { id: SINGLETON },
    update: { latitude, longitude, radiusMeters, updatedById: auth.profile.id },
    create: {
      id: SINGLETON,
      latitude,
      longitude,
      radiusMeters,
      updatedById: auth.profile.id,
    },
  });

  return NextResponse.json<ApiResponse>({ ok: true });
}

/**
 * DELETE /api/company-location
 * Remove a área autorizada — desliga o geofencing e libera o ponto de
 * qualquer lugar. Útil para destravar a equipe se a coordenada foi
 * cadastrada errada.
 */
export async function DELETE() {
  const auth = await authorize("companyLocation:manage");
  if (!auth.ok) return auth.response;

  await prisma.companyLocation.deleteMany({ where: { id: SINGLETON } });

  return NextResponse.json<ApiResponse>({ ok: true });
}

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const resultados = await prisma.resultadoRecabacion.findMany({
    where: { sesion: { subproceso: { proceso: { proyecto_id: id } } } },
    include: {
      sesion: {
        include: {
          tecnica: true,
          subproceso: { include: { proceso: true } },
        },
      },
    },
    orderBy: { creado_en: "desc" },
  });

  return NextResponse.json(resultados);
}

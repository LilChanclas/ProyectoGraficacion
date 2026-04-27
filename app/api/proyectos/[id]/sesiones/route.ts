import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const sesiones = await prisma.sesionRecabacion.findMany({
    where: { subproceso: { proceso: { proyecto_id: id } } },
    include: {
      tecnica: true,
      subproceso: { include: { proceso: true } },
      participantes: { include: { persona: { include: { rol: true } } } },
      _count: { select: { resultados: true } },
    },
    orderBy: { fecha: "desc" },
  });

  return NextResponse.json(sesiones);
}

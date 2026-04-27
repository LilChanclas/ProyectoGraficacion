import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const sesiones = await prisma.sesionRecabacion.findMany({
    where: { subproceso_id: id },
    include: {
      tecnica: true,
      participantes: { include: { persona: { include: { rol: true } } } },
      _count: { select: { resultados: true } },
    },
    orderBy: { fecha: "desc" },
  });

  return NextResponse.json(sesiones);
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const { tecnica_id, fecha, notas } = body;

  if (!tecnica_id) {
    return NextResponse.json({ error: "tecnica_id es obligatorio" }, { status: 400 });
  }
  if (!fecha) {
    return NextResponse.json({ error: "La fecha es obligatoria" }, { status: 400 });
  }

  const asignacion = await prisma.subprocesoTecnica.findUnique({
    where: { subproceso_id_tecnica_id: { subproceso_id: id, tecnica_id } },
  });
  if (!asignacion) {
    return NextResponse.json(
      { error: "La técnica no está asignada a este subproceso" },
      { status: 400 }
    );
  }

  const sesion = await prisma.sesionRecabacion.create({
    data: {
      subproceso_id: id,
      tecnica_id,
      fecha: new Date(fecha),
      notas: notas?.trim() || null,
    },
    include: {
      tecnica: true,
      participantes: { include: { persona: true } },
      _count: { select: { resultados: true } },
    },
  });

  return NextResponse.json(sesion, { status: 201 });
}

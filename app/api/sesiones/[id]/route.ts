import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const sesion = await prisma.sesionRecabacion.findUnique({
    where: { id },
    include: {
      tecnica: true,
      subproceso: { include: { proceso: true } },
      participantes: { include: { persona: { include: { rol: true } } } },
      resultados: { orderBy: { creado_en: "asc" } },
    },
  });

  if (!sesion) {
    return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 });
  }

  return NextResponse.json(sesion);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const { fecha, estado, notas } = body;

  const sesion = await prisma.sesionRecabacion.update({
    where: { id },
    data: {
      ...(fecha !== undefined && { fecha: new Date(fecha) }),
      ...(estado !== undefined && { estado }),
      ...(notas !== undefined && { notas: notas?.trim() || null }),
    },
    include: {
      tecnica: true,
      participantes: { include: { persona: { include: { rol: true } } } },
      _count: { select: { resultados: true } },
    },
  });

  return NextResponse.json(sesion);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  await prisma.sesionRecabacion.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

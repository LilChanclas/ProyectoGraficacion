import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const { contenido, notas } = body;

  const resultado = await prisma.resultadoRecabacion.update({
    where: { id },
    data: {
      ...(contenido !== undefined && { contenido: contenido.trim() }),
      ...(notas !== undefined && { notas: notas?.trim() || null }),
    },
  });

  return NextResponse.json(resultado);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  await prisma.resultadoRecabacion.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

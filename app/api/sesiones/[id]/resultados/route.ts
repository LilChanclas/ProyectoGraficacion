import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const resultados = await prisma.resultadoRecabacion.findMany({
    where: { sesion_id: id },
    include: {
      requisito_fuentes: {
        include: { requisito: true },
      },
    },
    orderBy: { creado_en: "asc" },
  });

  return NextResponse.json(resultados);
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const { contenido, notas } = body;

  if (!contenido || !contenido.trim()) {
    return NextResponse.json({ error: "El contenido es obligatorio" }, { status: 400 });
  }

  const resultado = await prisma.resultadoRecabacion.create({
    data: {
      sesion_id: id,
      contenido: contenido.trim(),
      notas: notas?.trim() || null,
    },
    include: {
      requisito_fuentes: { include: { requisito: true } },
    },
  });

  return NextResponse.json(resultado, { status: 201 });
}

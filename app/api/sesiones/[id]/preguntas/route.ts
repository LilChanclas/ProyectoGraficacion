import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const preguntas = await prisma.preguntaSesion.findMany({
    where: { sesion_id: id },
    include: {
      respuestas: {
        include: { persona: { include: { rol: true } } },
        orderBy: { creado_en: "asc" },
      },
    },
    orderBy: { orden: "asc" },
  });

  return NextResponse.json(preguntas);
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const { texto } = body;

  if (!texto || !texto.trim()) {
    return NextResponse.json({ error: "El texto de la pregunta es obligatorio" }, { status: 400 });
  }

  const count = await prisma.preguntaSesion.count({ where: { sesion_id: id } });

  const pregunta = await prisma.preguntaSesion.create({
    data: { sesion_id: id, texto: texto.trim(), orden: count },
    include: { respuestas: { include: { persona: { include: { rol: true } } } } },
  });

  return NextResponse.json(pregunta, { status: 201 });
}

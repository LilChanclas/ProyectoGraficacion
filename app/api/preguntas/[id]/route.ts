import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const { texto } = body;

  const pregunta = await prisma.preguntaSesion.update({
    where: { id },
    data: { texto: texto.trim() },
    include: { respuestas: { include: { persona: { include: { rol: true } } } } },
  });

  return NextResponse.json(pregunta);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  await prisma.preguntaSesion.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

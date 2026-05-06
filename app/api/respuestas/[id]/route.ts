import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const { respuesta } = body;

  const updated = await prisma.respuestaPregunta.update({
    where: { id },
    data: { respuesta: respuesta.trim() },
    include: { persona: { include: { rol: true } } },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  await prisma.respuestaPregunta.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

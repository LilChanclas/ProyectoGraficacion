import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const { respuesta, persona_id } = body;

  if (!respuesta || !respuesta.trim()) {
    return NextResponse.json({ error: "La respuesta es obligatoria" }, { status: 400 });
  }

  const nueva = await prisma.respuestaPregunta.create({
    data: {
      pregunta_id: id,
      respuesta: respuesta.trim(),
      persona_id: persona_id || null,
    },
    include: { persona: { include: { rol: true } } },
  });

  return NextResponse.json(nueva, { status: 201 });
}

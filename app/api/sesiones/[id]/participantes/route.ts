import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const participantes = await prisma.sesionParticipante.findMany({
    where: { sesion_id: id },
    include: { persona: { include: { rol: true } } },
  });

  return NextResponse.json(participantes.map((p) => p.persona));
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const { persona_id } = body;

  if (!persona_id) {
    return NextResponse.json({ error: "persona_id es obligatorio" }, { status: 400 });
  }

  try {
    await prisma.sesionParticipante.create({
      data: { sesion_id: id, persona_id },
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Esta persona ya es participante de la sesión" },
      { status: 409 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const persona_id = searchParams.get("persona_id");

  if (!persona_id) {
    return NextResponse.json({ error: "persona_id es obligatorio" }, { status: 400 });
  }

  await prisma.sesionParticipante.delete({
    where: { sesion_id_persona_id: { sesion_id: id, persona_id } },
  });

  return NextResponse.json({ ok: true });
}

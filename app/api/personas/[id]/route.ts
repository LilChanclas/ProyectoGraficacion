import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const { nombre_completo, correo, telefono, notas, rol_id } = body;

  const persona = await prisma.persona.update({
    where: { id },
    data: {
      ...(nombre_completo !== undefined && { nombre_completo: nombre_completo.trim() }),
      ...(correo !== undefined && { correo: correo?.trim() || null }),
      ...(telefono !== undefined && { telefono: telefono?.trim() || null }),
      ...(notas !== undefined && { notas: notas?.trim() || null }),
      ...(rol_id !== undefined && { rol_id }),
    },
    include: { rol: true },
  });

  return NextResponse.json(persona);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  await prisma.persona.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

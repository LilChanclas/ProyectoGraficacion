import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const personas = await prisma.persona.findMany({
    where: { proyecto_id: id },
    include: { rol: true },
    orderBy: { creado_en: "desc" },
  });

  return NextResponse.json(personas);
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const { nombre_completo, correo, telefono, notas, rol_id } = body;

  if (!nombre_completo || !nombre_completo.trim()) {
    return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
  }
  if (!rol_id) {
    return NextResponse.json({ error: "El rol es obligatorio" }, { status: 400 });
  }

  const persona = await prisma.persona.create({
    data: {
      proyecto_id: id,
      rol_id,
      nombre_completo: nombre_completo.trim(),
      correo: correo?.trim() || null,
      telefono: telefono?.trim() || null,
      notas: notas?.trim() || null,
    },
    include: { rol: true },
  });

  return NextResponse.json(persona, { status: 201 });
}

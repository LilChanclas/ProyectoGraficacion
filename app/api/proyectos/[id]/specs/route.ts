import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const specs = await prisma.spec.findMany({
    where: { proyecto_id: id },
    orderBy: { creado_en: "desc" },
    select: { id: true, nombre: true, descripcion: true, creado_en: true, actualizado_en: true },
  });
  return NextResponse.json(specs);
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const { nombre, descripcion, contenido } = body;

  if (!nombre?.trim()) {
    return NextResponse.json({ error: "nombre es obligatorio" }, { status: 400 });
  }

  const spec = await prisma.spec.create({
    data: {
      proyecto_id: id,
      nombre: nombre.trim(),
      descripcion: descripcion?.trim() || null,
      contenido: contenido || "",
    },
  });
  return NextResponse.json(spec, { status: 201 });
}

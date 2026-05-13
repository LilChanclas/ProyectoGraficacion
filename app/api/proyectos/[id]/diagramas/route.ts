import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const diagramas = await prisma.diagrama.findMany({
    where: { proyecto_id: id },
    orderBy: { creado_en: "asc" },
  });
  return NextResponse.json(diagramas);
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const { tipo, nombre, contenido } = body;

  if (!tipo || !nombre?.trim()) {
    return NextResponse.json({ error: "tipo y nombre son obligatorios" }, { status: 400 });
  }

  const diagrama = await prisma.diagrama.create({
    data: {
      proyecto_id: id,
      tipo,
      nombre: nombre.trim(),
      contenido: contenido || "",
    },
  });
  return NextResponse.json(diagrama, { status: 201 });
}

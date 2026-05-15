import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const subprocesos = await prisma.subproceso.findMany({
    where: { proceso_id: id },
    include: { subproceso_tecnicas: { include: { tecnica: true } } },
    orderBy: { nombre: "asc" },
  });

  return NextResponse.json(subprocesos);
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const { nombre, descripcion } = body;

  if (!nombre || !nombre.trim()) {
    return NextResponse.json({ error: "El nombre del subproceso es obligatorio" }, { status: 400 });
  }

  try {
    const subproceso = await prisma.subproceso.create({
      data: {
        proceso_id: id,
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || null,
      },
    });
    return NextResponse.json(subproceso, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Ya existe un subproceso con ese nombre en este proceso" }, { status: 409 });
  }
}

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const procesos = await prisma.proceso.findMany({
    where: { proyecto_id: id },
    include: {
      subprocesos: {
        include: { subproceso_tecnicas: { include: { tecnica: true } } },
        orderBy: { nombre: "asc" },
      },
    },
    orderBy: { nombre: "asc" },
  });

  return NextResponse.json(procesos);
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const { nombre, descripcion } = body;

  if (!nombre || !nombre.trim()) {
    return NextResponse.json({ error: "El nombre del proceso es obligatorio" }, { status: 400 });
  }

  try {
    const proceso = await prisma.proceso.create({
      data: {
        proyecto_id: id,
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || null,
      },
      include: { subprocesos: true },
    });
    return NextResponse.json(proceso, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Ya existe un proceso con ese nombre en este proyecto" }, { status: 409 });
  }
}

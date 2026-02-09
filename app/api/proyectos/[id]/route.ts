import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const proyecto = await prisma.proyecto.findUnique({
    where: { id },
    include: {
      roles: { include: { _count: { select: { personas: true } } } },
      personas: { include: { rol: true } },
      procesos: {
        include: {
          subprocesos: {
            include: { subproceso_tecnicas: { include: { tecnica: true } } },
          },
        },
      },
    },
  });

  if (!proyecto) {
    return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
  }

  return NextResponse.json(proyecto);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const { nombre, descripcion } = body;

  const proyecto = await prisma.proyecto.update({
    where: { id },
    data: {
      ...(nombre !== undefined && { nombre: nombre.trim() }),
      ...(descripcion !== undefined && { descripcion: descripcion?.trim() || null }),
    },
  });

  return NextResponse.json(proyecto);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  await prisma.proyecto.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

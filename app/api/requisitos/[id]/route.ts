import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const { nombre, descripcion, prioridad, estado, codigo } = body;

  const requisito = await prisma.requisito.update({
    where: { id },
    data: {
      ...(nombre !== undefined && { nombre: nombre.trim() }),
      ...(descripcion !== undefined && { descripcion: descripcion?.trim() || null }),
      ...(prioridad !== undefined && { prioridad }),
      ...(estado !== undefined && { estado }),
      ...(codigo !== undefined && { codigo: codigo?.trim() || null }),
    },
    include: {
      fuentes: {
        include: {
          resultado: {
            include: {
              sesion: { include: { tecnica: true } },
            },
          },
        },
      },
    },
  });

  return NextResponse.json(requisito);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  await prisma.requisito.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

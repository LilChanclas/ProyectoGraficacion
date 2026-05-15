import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const { nombre, descripcion } = body;

  try {
    const subproceso = await prisma.subproceso.update({
      where: { id },
      data: {
        ...(nombre !== undefined && { nombre: nombre.trim() }),
        ...(descripcion !== undefined && { descripcion: descripcion?.trim() || null }),
      },
    });
    return NextResponse.json(subproceso);
  } catch {
    return NextResponse.json({ error: "No se pudo actualizar el subproceso" }, { status: 409 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  await prisma.subproceso.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

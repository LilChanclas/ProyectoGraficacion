import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const { nombre } = body;

  if (!nombre || !nombre.trim()) {
    return NextResponse.json({ error: "El nombre del rol es obligatorio" }, { status: 400 });
  }

  try {
    const rol = await prisma.rol.update({
      where: { id },
      data: { nombre: nombre.trim() },
    });
    return NextResponse.json(rol);
  } catch {
    return NextResponse.json({ error: "No se pudo actualizar el rol" }, { status: 409 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  try {
    await prisma.rol.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "No se puede eliminar: hay personas asignadas a este rol" },
      { status: 409 }
    );
  }
}

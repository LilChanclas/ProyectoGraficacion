import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const roles = await prisma.rol.findMany({
    where: { proyecto_id: id },
    include: { _count: { select: { personas: true } } },
    orderBy: { nombre: "asc" },
  });

  return NextResponse.json(roles);
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const { nombre } = body;

  if (!nombre || !nombre.trim()) {
    return NextResponse.json({ error: "El nombre del rol es obligatorio" }, { status: 400 });
  }

  try {
    const rol = await prisma.rol.create({
      data: { proyecto_id: id, nombre: nombre.trim() },
    });
    return NextResponse.json(rol, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Ya existe un rol con ese nombre en este proyecto" }, { status: 409 });
  }
}

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const spec = await prisma.spec.findUnique({ where: { id } });
  if (!spec) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(spec);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const { nombre, descripcion, contenido } = body;

  const spec = await prisma.spec.update({
    where: { id },
    data: {
      ...(nombre !== undefined && { nombre: nombre.trim() }),
      ...(descripcion !== undefined && { descripcion: descripcion?.trim() || null }),
      ...(contenido !== undefined && { contenido }),
    },
  });
  return NextResponse.json(spec);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  await prisma.spec.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

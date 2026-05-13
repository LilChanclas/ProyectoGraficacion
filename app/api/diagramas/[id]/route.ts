import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const diagrama = await prisma.diagrama.findUnique({ where: { id } });
  if (!diagrama) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(diagrama);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const { nombre, contenido } = body;

  const diagrama = await prisma.diagrama.update({
    where: { id },
    data: {
      ...(nombre !== undefined && { nombre: nombre.trim() }),
      ...(contenido !== undefined && { contenido }),
    },
  });
  return NextResponse.json(diagrama);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  await prisma.diagrama.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const asignaciones = await prisma.subprocesoTecnica.findMany({
    where: { subproceso_id: id },
    include: { tecnica: true },
  });

  return NextResponse.json(asignaciones.map((a) => a.tecnica));
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const { tecnica_id } = body;

  if (!tecnica_id) {
    return NextResponse.json({ error: "tecnica_id es obligatorio" }, { status: 400 });
  }

  try {
    await prisma.subprocesoTecnica.create({
      data: { subproceso_id: id, tecnica_id },
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Esta técnica ya está asignada a este subproceso" }, { status: 409 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const tecnica_id = searchParams.get("tecnica_id");

  if (!tecnica_id) {
    return NextResponse.json({ error: "tecnica_id es obligatorio" }, { status: 400 });
  }

  await prisma.subprocesoTecnica.delete({
    where: {
      subproceso_id_tecnica_id: { subproceso_id: id, tecnica_id },
    },
  });

  return NextResponse.json({ ok: true });
}

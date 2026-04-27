import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const fuentes = await prisma.requisitoFuente.findMany({
    where: { requisito_id: id },
    include: {
      resultado: {
        include: {
          sesion: {
            include: { tecnica: true, subproceso: { include: { proceso: true } } },
          },
        },
      },
    },
  });

  return NextResponse.json(fuentes);
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const { resultado_id } = body;

  if (!resultado_id) {
    return NextResponse.json({ error: "resultado_id es obligatorio" }, { status: 400 });
  }

  try {
    await prisma.requisitoFuente.create({
      data: { requisito_id: id, resultado_id },
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Este resultado ya está vinculado al requisito" },
      { status: 409 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const resultado_id = searchParams.get("resultado_id");

  if (!resultado_id) {
    return NextResponse.json({ error: "resultado_id es obligatorio" }, { status: 400 });
  }

  await prisma.requisitoFuente.delete({
    where: { requisito_id_resultado_id: { requisito_id: id, resultado_id } },
  });

  return NextResponse.json({ ok: true });
}

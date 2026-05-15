import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const requisitos = await prisma.requisito.findMany({
    where: { proyecto_id: id },
    include: {
      fuentes: {
        include: {
          resultado: {
            include: {
              sesion: {
                include: { tecnica: true, subproceso: { include: { proceso: true } } },
              },
            },
          },
        },
      },
    },
    orderBy: { creado_en: "asc" },
  });

  return NextResponse.json(requisitos);
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const { nombre, descripcion, prioridad, codigo } = body;

  if (!nombre || !nombre.trim()) {
    return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
  }

  const count = await prisma.requisito.count({ where: { proyecto_id: id } });
  const codigoGenerado = codigo?.trim() || `REQ-${String(count + 1).padStart(3, "0")}`;

  const requisito = await prisma.requisito.create({
    data: {
      proyecto_id: id,
      nombre: nombre.trim(),
      descripcion: descripcion?.trim() || null,
      prioridad: prioridad || "MEDIA",
      codigo: codigoGenerado,
    },
    include: { fuentes: { include: { resultado: true } } },
  });

  return NextResponse.json(requisito, { status: 201 });
}

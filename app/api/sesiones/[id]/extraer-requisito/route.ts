import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

// Crea ResultadoRecabacion + Requisito + RequisitoFuente en una sola transacción
export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const { contenido_resultado, nombre_requisito, descripcion, prioridad } = body;

  if (!contenido_resultado?.trim()) {
    return NextResponse.json({ error: "contenido_resultado es obligatorio" }, { status: 400 });
  }
  if (!nombre_requisito?.trim()) {
    return NextResponse.json({ error: "nombre_requisito es obligatorio" }, { status: 400 });
  }

  const sesion = await prisma.sesionRecabacion.findUnique({
    where: { id },
    select: { subproceso: { select: { proceso: { select: { proyecto_id: true } } } } },
  });

  if (!sesion) {
    return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 });
  }

  const proyecto_id = sesion.subproceso.proceso.proyecto_id;

  const count = await prisma.requisito.count({ where: { proyecto_id } });
  const codigo = `REQ-${String(count + 1).padStart(3, "0")}`;

  const [resultado, requisito] = await prisma.$transaction(async (tx) => {
    const resultado = await tx.resultadoRecabacion.create({
      data: { sesion_id: id, contenido: contenido_resultado.trim() },
    });

    const requisito = await tx.requisito.create({
      data: {
        proyecto_id,
        codigo,
        nombre: nombre_requisito.trim(),
        descripcion: descripcion?.trim() || null,
        prioridad: prioridad || "MEDIA",
      },
    });

    await tx.requisitoFuente.create({
      data: { requisito_id: requisito.id, resultado_id: resultado.id },
    });

    return [resultado, requisito];
  });

  return NextResponse.json({ resultado, requisito }, { status: 201 });
}

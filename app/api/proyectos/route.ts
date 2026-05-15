import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const proyectos = await prisma.proyecto.findMany({
    orderBy: { creado_en: "desc" },
    include: {
      _count: { select: { roles: true, personas: true, procesos: true } },
    },
  });
  return NextResponse.json(proyectos);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { nombre, descripcion, productOwner, techLead } = body;

  if (!nombre || !nombre.trim()) {
    return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
  }

  const proyecto = await prisma.proyecto.create({
    data: {
      nombre: nombre.trim(),
      descripcion: descripcion?.trim() || null,
      roles: {
        create: [
          { nombre: "Product Owner" },
          { nombre: "Líder de Tecnología" },
        ],
      },
    },
    include: { roles: true },
  });

  // Crear personas para los roles iniciales si se proporcionaron datos
  const rolPO = proyecto.roles.find((r) => r.nombre === "Product Owner");
  const rolTL = proyecto.roles.find((r) => r.nombre === "Líder de Tecnología");

  if (productOwner?.nombre_completo && rolPO) {
    await prisma.persona.create({
      data: {
        proyecto_id: proyecto.id,
        rol_id: rolPO.id,
        nombre_completo: productOwner.nombre_completo,
        correo: productOwner.correo || null,
      },
    });
  }

  if (techLead?.nombre_completo && rolTL) {
    await prisma.persona.create({
      data: {
        proyecto_id: proyecto.id,
        rol_id: rolTL.id,
        nombre_completo: techLead.nombre_completo,
        correo: techLead.correo || null,
      },
    });
  }

  const proyectoCompleto = await prisma.proyecto.findUnique({
    where: { id: proyecto.id },
    include: { roles: true, personas: { include: { rol: true } } },
  });

  return NextResponse.json(proyectoCompleto, { status: 201 });
}

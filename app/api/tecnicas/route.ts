import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const tecnicas = await prisma.tecnica.findMany({
    orderBy: { nombre: "asc" },
  });
  return NextResponse.json(tecnicas);
}

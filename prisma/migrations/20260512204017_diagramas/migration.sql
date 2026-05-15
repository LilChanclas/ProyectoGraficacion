-- CreateEnum
CREATE TYPE "TipoDiagrama" AS ENUM ('PAQUETES', 'CLASES', 'CASOS_USO', 'SECUENCIA');

-- CreateTable
CREATE TABLE "Diagrama" (
    "id" TEXT NOT NULL,
    "proyecto_id" TEXT NOT NULL,
    "tipo" "TipoDiagrama" NOT NULL,
    "nombre" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Diagrama_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Diagrama_proyecto_id_idx" ON "Diagrama"("proyecto_id");

-- AddForeignKey
ALTER TABLE "Diagrama" ADD CONSTRAINT "Diagrama_proyecto_id_fkey" FOREIGN KEY ("proyecto_id") REFERENCES "Proyecto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

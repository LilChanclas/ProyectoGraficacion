-- CreateEnum
CREATE TYPE "EstadoSesion" AS ENUM ('PENDIENTE', 'EN_CURSO', 'COMPLETADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "PrioridadRequisito" AS ENUM ('ALTA', 'MEDIA', 'BAJA');

-- CreateEnum
CREATE TYPE "EstadoRequisito" AS ENUM ('PENDIENTE', 'VALIDADO', 'DESCARTADO');

-- CreateTable
CREATE TABLE "SesionRecabacion" (
    "id" TEXT NOT NULL,
    "subproceso_id" TEXT NOT NULL,
    "tecnica_id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoSesion" NOT NULL DEFAULT 'PENDIENTE',
    "notas" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SesionRecabacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SesionParticipante" (
    "sesion_id" TEXT NOT NULL,
    "persona_id" TEXT NOT NULL,

    CONSTRAINT "SesionParticipante_pkey" PRIMARY KEY ("sesion_id","persona_id")
);

-- CreateTable
CREATE TABLE "ResultadoRecabacion" (
    "id" TEXT NOT NULL,
    "sesion_id" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "notas" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResultadoRecabacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Requisito" (
    "id" TEXT NOT NULL,
    "proyecto_id" TEXT NOT NULL,
    "codigo" TEXT,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "prioridad" "PrioridadRequisito" NOT NULL DEFAULT 'MEDIA',
    "estado" "EstadoRequisito" NOT NULL DEFAULT 'PENDIENTE',
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Requisito_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequisitoFuente" (
    "requisito_id" TEXT NOT NULL,
    "resultado_id" TEXT NOT NULL,

    CONSTRAINT "RequisitoFuente_pkey" PRIMARY KEY ("requisito_id","resultado_id")
);

-- CreateIndex
CREATE INDEX "SesionRecabacion_subproceso_id_idx" ON "SesionRecabacion"("subproceso_id");

-- CreateIndex
CREATE INDEX "SesionRecabacion_tecnica_id_idx" ON "SesionRecabacion"("tecnica_id");

-- CreateIndex
CREATE INDEX "SesionParticipante_persona_id_idx" ON "SesionParticipante"("persona_id");

-- CreateIndex
CREATE INDEX "ResultadoRecabacion_sesion_id_idx" ON "ResultadoRecabacion"("sesion_id");

-- CreateIndex
CREATE INDEX "Requisito_proyecto_id_idx" ON "Requisito"("proyecto_id");

-- CreateIndex
CREATE INDEX "RequisitoFuente_resultado_id_idx" ON "RequisitoFuente"("resultado_id");

-- AddForeignKey
ALTER TABLE "SesionRecabacion" ADD CONSTRAINT "SesionRecabacion_subproceso_id_fkey" FOREIGN KEY ("subproceso_id") REFERENCES "Subproceso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SesionRecabacion" ADD CONSTRAINT "SesionRecabacion_tecnica_id_fkey" FOREIGN KEY ("tecnica_id") REFERENCES "Tecnica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SesionParticipante" ADD CONSTRAINT "SesionParticipante_sesion_id_fkey" FOREIGN KEY ("sesion_id") REFERENCES "SesionRecabacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SesionParticipante" ADD CONSTRAINT "SesionParticipante_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "Persona"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultadoRecabacion" ADD CONSTRAINT "ResultadoRecabacion_sesion_id_fkey" FOREIGN KEY ("sesion_id") REFERENCES "SesionRecabacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Requisito" ADD CONSTRAINT "Requisito_proyecto_id_fkey" FOREIGN KEY ("proyecto_id") REFERENCES "Proyecto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequisitoFuente" ADD CONSTRAINT "RequisitoFuente_requisito_id_fkey" FOREIGN KEY ("requisito_id") REFERENCES "Requisito"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequisitoFuente" ADD CONSTRAINT "RequisitoFuente_resultado_id_fkey" FOREIGN KEY ("resultado_id") REFERENCES "ResultadoRecabacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

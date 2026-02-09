-- CreateEnum
CREATE TYPE "TipoMetodoTecnica" AS ENUM ('ENTREVISTA', 'CUESTIONARIO', 'OBSERVACION', 'HISTORIA_USUARIO', 'FOCUS_GROUP', 'DOCUMENTOS', 'SEGUIMIENTO_TRANSACCIONAL');

-- CreateTable
CREATE TABLE "Proyecto" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proyecto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rol" (
    "id" TEXT NOT NULL,
    "proyecto_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "Rol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Persona" (
    "id" TEXT NOT NULL,
    "proyecto_id" TEXT NOT NULL,
    "rol_id" TEXT NOT NULL,
    "nombre_completo" TEXT NOT NULL,
    "correo" TEXT,
    "telefono" TEXT,
    "notas" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Persona_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proceso" (
    "id" TEXT NOT NULL,
    "proyecto_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "Proceso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subproceso" (
    "id" TEXT NOT NULL,
    "proceso_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "Subproceso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tecnica" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo_metodo" "TipoMetodoTecnica" NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "Tecnica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubprocesoTecnica" (
    "subproceso_id" TEXT NOT NULL,
    "tecnica_id" TEXT NOT NULL,

    CONSTRAINT "SubprocesoTecnica_pkey" PRIMARY KEY ("subproceso_id","tecnica_id")
);

-- CreateIndex
CREATE INDEX "Rol_proyecto_id_idx" ON "Rol"("proyecto_id");

-- CreateIndex
CREATE UNIQUE INDEX "Rol_proyecto_id_nombre_key" ON "Rol"("proyecto_id", "nombre");

-- CreateIndex
CREATE INDEX "Persona_proyecto_id_idx" ON "Persona"("proyecto_id");

-- CreateIndex
CREATE INDEX "Persona_rol_id_idx" ON "Persona"("rol_id");

-- CreateIndex
CREATE INDEX "Proceso_proyecto_id_idx" ON "Proceso"("proyecto_id");

-- CreateIndex
CREATE UNIQUE INDEX "Proceso_proyecto_id_nombre_key" ON "Proceso"("proyecto_id", "nombre");

-- CreateIndex
CREATE INDEX "Subproceso_proceso_id_idx" ON "Subproceso"("proceso_id");

-- CreateIndex
CREATE UNIQUE INDEX "Subproceso_proceso_id_nombre_key" ON "Subproceso"("proceso_id", "nombre");

-- CreateIndex
CREATE INDEX "SubprocesoTecnica_tecnica_id_idx" ON "SubprocesoTecnica"("tecnica_id");

-- AddForeignKey
ALTER TABLE "Rol" ADD CONSTRAINT "Rol_proyecto_id_fkey" FOREIGN KEY ("proyecto_id") REFERENCES "Proyecto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Persona" ADD CONSTRAINT "Persona_proyecto_id_fkey" FOREIGN KEY ("proyecto_id") REFERENCES "Proyecto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Persona" ADD CONSTRAINT "Persona_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "Rol"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proceso" ADD CONSTRAINT "Proceso_proyecto_id_fkey" FOREIGN KEY ("proyecto_id") REFERENCES "Proyecto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subproceso" ADD CONSTRAINT "Subproceso_proceso_id_fkey" FOREIGN KEY ("proceso_id") REFERENCES "Proceso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubprocesoTecnica" ADD CONSTRAINT "SubprocesoTecnica_subproceso_id_fkey" FOREIGN KEY ("subproceso_id") REFERENCES "Subproceso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubprocesoTecnica" ADD CONSTRAINT "SubprocesoTecnica_tecnica_id_fkey" FOREIGN KEY ("tecnica_id") REFERENCES "Tecnica"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "PreguntaSesion" (
    "id" TEXT NOT NULL,
    "sesion_id" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PreguntaSesion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RespuestaPregunta" (
    "id" TEXT NOT NULL,
    "pregunta_id" TEXT NOT NULL,
    "persona_id" TEXT,
    "respuesta" TEXT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RespuestaPregunta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PreguntaSesion_sesion_id_idx" ON "PreguntaSesion"("sesion_id");

-- CreateIndex
CREATE INDEX "RespuestaPregunta_pregunta_id_idx" ON "RespuestaPregunta"("pregunta_id");

-- CreateIndex
CREATE INDEX "RespuestaPregunta_persona_id_idx" ON "RespuestaPregunta"("persona_id");

-- AddForeignKey
ALTER TABLE "PreguntaSesion" ADD CONSTRAINT "PreguntaSesion_sesion_id_fkey" FOREIGN KEY ("sesion_id") REFERENCES "SesionRecabacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespuestaPregunta" ADD CONSTRAINT "RespuestaPregunta_pregunta_id_fkey" FOREIGN KEY ("pregunta_id") REFERENCES "PreguntaSesion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespuestaPregunta" ADD CONSTRAINT "RespuestaPregunta_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "Persona"("id") ON DELETE SET NULL ON UPDATE CASCADE;

/*
  Warnings:

  - You are about to drop the `Requisito` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RequisitoFuente` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Requisito" DROP CONSTRAINT "Requisito_proyecto_id_fkey";

-- DropForeignKey
ALTER TABLE "RequisitoFuente" DROP CONSTRAINT "RequisitoFuente_requisito_id_fkey";

-- DropForeignKey
ALTER TABLE "RequisitoFuente" DROP CONSTRAINT "RequisitoFuente_resultado_id_fkey";

-- DropTable
DROP TABLE "Requisito";

-- DropTable
DROP TABLE "RequisitoFuente";

-- DropEnum
DROP TYPE "EstadoRequisito";

-- DropEnum
DROP TYPE "PrioridadRequisito";

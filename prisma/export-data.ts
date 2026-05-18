import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { writeFileSync } from "fs";
import path from "path";

function getDirectUrl(): string {
  const dbUrl = process.env.DATABASE_URL || "";
  const match = dbUrl.match(/api_key=(.+)/);
  if (match) {
    try {
      const decoded = JSON.parse(Buffer.from(match[1], "base64").toString());
      return decoded.databaseUrl;
    } catch { /* fallback */ }
  }
  return dbUrl;
}

const directUrl = getDirectUrl();
const adapter = new PrismaPg({ connectionString: directUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log(" Exportando datos de la base de datos...\n");

  const [
    tecnicas,
    proyectos,
    roles,
    personas,
    procesos,
    subprocesos,
    subprocesoTecnicas,
    sesiones,
    participantes,
    preguntas,
    respuestas,
    resultados,
    diagramas,
    specs,
  ] = await Promise.all([
    prisma.tecnica.findMany(),
    prisma.proyecto.findMany(),
    prisma.rol.findMany(),
    prisma.persona.findMany(),
    prisma.proceso.findMany(),
    prisma.subproceso.findMany(),
    prisma.subprocesoTecnica.findMany(),
    prisma.sesionRecabacion.findMany(),
    prisma.sesionParticipante.findMany(),
    prisma.preguntaSesion.findMany(),
    prisma.respuestaPregunta.findMany(),
    prisma.resultadoRecabacion.findMany(),
    prisma.diagrama.findMany(),
    prisma.spec.findMany(),
  ]);

  const data = {
    tecnicas,
    proyectos,
    roles,
    personas,
    procesos,
    subprocesos,
    subprocesoTecnicas,
    sesiones,
    participantes,
    preguntas,
    respuestas,
    resultados,
    diagramas,
    specs,
  };

  const outputPath = path.join(process.cwd(), "prisma", "seed-data.json");
  writeFileSync(outputPath, JSON.stringify(data, null, 2), "utf-8");

  console.log(" Exportado a prisma/seed-data.json\n");
  console.log(`   Técnicas:                ${tecnicas.length}`);
  console.log(`   Proyectos:               ${proyectos.length}`);
  console.log(`   Roles:                   ${roles.length}`);
  console.log(`   Personas:                ${personas.length}`);
  console.log(`   Procesos:                ${procesos.length}`);
  console.log(`   Subprocesos:             ${subprocesos.length}`);
  console.log(`   Técnica/Subproceso:      ${subprocesoTecnicas.length}`);
  console.log(`   Sesiones:                ${sesiones.length}`);
  console.log(`   Participantes sesión:    ${participantes.length}`);
  console.log(`   Preguntas:               ${preguntas.length}`);
  console.log(`   Respuestas:              ${respuestas.length}`);
  console.log(`   Resultados/Hallazgos:    ${resultados.length}`);
  console.log(`   Diagramas:               ${diagramas.length}`);
  console.log(`   Specs:                   ${specs.length}`);
  console.log("\n  Ahora haz commit de prisma/seed-data.json y súbelo a GitHub.");
  console.log("   Tu amigo solo necesita ejecutar: npx tsx prisma/seed.ts");
}

main()
  .catch((e) => {
    console.error(" Error al exportar:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

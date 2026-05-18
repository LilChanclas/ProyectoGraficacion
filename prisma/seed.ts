import "dotenv/config";
import { PrismaClient, TipoMetodoTecnica } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { existsSync, readFileSync } from "fs";
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

// Técnicas por defecto (se usan solo si no hay seed-data.json)
const TECNICAS_DEFAULT = [
  { id: "entrevista",                tipo_metodo: TipoMetodoTecnica.ENTREVISTA,                nombre: "Entrevista",               descripcion: "Conversación estructurada o semiestructurada con stakeholders para obtener información detallada." },
  { id: "cuestionario",              tipo_metodo: TipoMetodoTecnica.CUESTIONARIO,              nombre: "Cuestionario",             descripcion: "Conjunto de preguntas escritas para recopilar información de múltiples personas." },
  { id: "observacion",               tipo_metodo: TipoMetodoTecnica.OBSERVACION,               nombre: "Observación",              descripcion: "Observación directa de procesos y actividades en el entorno del cliente." },
  { id: "historia_usuario",          tipo_metodo: TipoMetodoTecnica.HISTORIA_USUARIO,          nombre: "Historia de Usuario",      descripcion: "Descripción breve de una funcionalidad desde la perspectiva del usuario final." },
  { id: "focus_group",               tipo_metodo: TipoMetodoTecnica.FOCUS_GROUP,               nombre: "Focus Group",              descripcion: "Sesión grupal facilitada para discutir temas específicos con múltiples stakeholders." },
  { id: "documentos",                tipo_metodo: TipoMetodoTecnica.DOCUMENTOS,                nombre: "Análisis Documental",      descripcion: "Revisión y análisis de documentos existentes del cliente (manuales, reportes, políticas)." },
  { id: "seguimiento_transaccional", tipo_metodo: TipoMetodoTecnica.SEGUIMIENTO_TRANSACCIONAL, nombre: "Seguimiento Transaccional",descripcion: "Rastreo y análisis de transacciones o flujos de trabajo existentes." },
];

async function seedFromJson(dataPath: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: Record<string, any[]> = JSON.parse(readFileSync(dataPath, "utf-8"));

  const {
    tecnicas = [],
    proyectos = [],
    roles = [],
    personas = [],
    procesos = [],
    subprocesos = [],
    subprocesoTecnicas = [],
    sesiones = [],
    participantes = [],
    preguntas = [],
    respuestas = [],
    resultados = [],
    diagramas = [],
    specs = [],
  } = data;

  console.log("🌱 Sembrando datos desde seed-data.json...\n");

  // 1. Técnicas
  for (const t of tecnicas) {
    await prisma.tecnica.upsert({
      where: { id: t.id },
      update: {},
      create: { id: t.id, nombre: t.nombre, tipo_metodo: t.tipo_metodo, descripcion: t.descripcion ?? null },
    });
  }
  console.log(`   ✓ ${tecnicas.length} técnicas`);

  // 2. Proyectos
  for (const p of proyectos) {
    await prisma.proyecto.upsert({
      where: { id: p.id },
      update: {},
      create: { id: p.id, nombre: p.nombre, descripcion: p.descripcion ?? null },
    });
  }
  console.log(`   ✓ ${proyectos.length} proyectos`);

  // 3. Roles
  for (const r of roles) {
    await prisma.rol.upsert({
      where: { id: r.id },
      update: {},
      create: { id: r.id, proyecto_id: r.proyecto_id, nombre: r.nombre },
    });
  }
  console.log(`   ✓ ${roles.length} roles`);

  // 4. Personas
  for (const p of personas) {
    await prisma.persona.upsert({
      where: { id: p.id },
      update: {},
      create: {
        id: p.id,
        proyecto_id: p.proyecto_id,
        rol_id: p.rol_id,
        nombre_completo: p.nombre_completo,
        correo: p.correo ?? null,
        telefono: p.telefono ?? null,
        notas: p.notas ?? null,
      },
    });
  }
  console.log(`   ✓ ${personas.length} personas`);

  // 5. Procesos
  for (const p of procesos) {
    await prisma.proceso.upsert({
      where: { id: p.id },
      update: {},
      create: { id: p.id, proyecto_id: p.proyecto_id, nombre: p.nombre, descripcion: p.descripcion ?? null },
    });
  }
  console.log(`   ✓ ${procesos.length} procesos`);

  // 6. Subprocesos
  for (const s of subprocesos) {
    await prisma.subproceso.upsert({
      where: { id: s.id },
      update: {},
      create: { id: s.id, proceso_id: s.proceso_id, nombre: s.nombre, descripcion: s.descripcion ?? null },
    });
  }
  console.log(`   ✓ ${subprocesos.length} subprocesos`);

  // 7. Asignaciones técnica ↔ subproceso
  for (const st of subprocesoTecnicas) {
    await prisma.subprocesoTecnica.upsert({
      where: { subproceso_id_tecnica_id: { subproceso_id: st.subproceso_id, tecnica_id: st.tecnica_id } },
      update: {},
      create: { subproceso_id: st.subproceso_id, tecnica_id: st.tecnica_id },
    });
  }
  console.log(`   ✓ ${subprocesoTecnicas.length} asignaciones técnica/subproceso`);

  // 8. Sesiones
  for (const s of sesiones) {
    await prisma.sesionRecabacion.upsert({
      where: { id: s.id },
      update: {},
      create: {
        id: s.id,
        subproceso_id: s.subproceso_id,
        tecnica_id: s.tecnica_id,
        fecha: new Date(s.fecha),
        estado: s.estado,
        notas: s.notas ?? null,
      },
    });
  }
  console.log(`   ✓ ${sesiones.length} sesiones`);

  // 9. Participantes de sesión
  for (const p of participantes) {
    await prisma.sesionParticipante.upsert({
      where: { sesion_id_persona_id: { sesion_id: p.sesion_id, persona_id: p.persona_id } },
      update: {},
      create: { sesion_id: p.sesion_id, persona_id: p.persona_id },
    });
  }
  console.log(`   ✓ ${participantes.length} participantes`);

  // 10. Preguntas de sesión
  for (const p of preguntas) {
    await prisma.preguntaSesion.upsert({
      where: { id: p.id },
      update: {},
      create: { id: p.id, sesion_id: p.sesion_id, texto: p.texto, orden: p.orden ?? 0 },
    });
  }
  console.log(`   ✓ ${preguntas.length} preguntas`);

  // 11. Respuestas
  for (const r of respuestas) {
    await prisma.respuestaPregunta.upsert({
      where: { id: r.id },
      update: {},
      create: { id: r.id, pregunta_id: r.pregunta_id, persona_id: r.persona_id ?? null, respuesta: r.respuesta },
    });
  }
  console.log(`   ✓ ${respuestas.length} respuestas`);

  // 12. Resultados / hallazgos
  for (const r of resultados) {
    await prisma.resultadoRecabacion.upsert({
      where: { id: r.id },
      update: {},
      create: { id: r.id, sesion_id: r.sesion_id, contenido: r.contenido, notas: r.notas ?? null },
    });
  }
  console.log(`   ✓ ${resultados.length} resultados`);

  // 13. Diagramas
  for (const d of diagramas) {
    await prisma.diagrama.upsert({
      where: { id: d.id },
      update: {},
      create: { id: d.id, proyecto_id: d.proyecto_id, tipo: d.tipo, nombre: d.nombre, contenido: d.contenido },
    });
  }
  console.log(`   ✓ ${diagramas.length} diagramas`);

  // 14. Specs
  for (const s of specs) {
    await prisma.spec.upsert({
      where: { id: s.id },
      update: {},
      create: { id: s.id, proyecto_id: s.proyecto_id, nombre: s.nombre, descripcion: s.descripcion ?? null, contenido: s.contenido },
    });
  }
  console.log(`   ✓ ${specs.length} specs`);

  console.log("\n✅ Seed completado. Todos los datos fueron importados.");
}

async function seedDefault() {
  console.log("🌱 Sembrando técnicas por defecto...\n");
  for (const t of TECNICAS_DEFAULT) {
    await prisma.tecnica.upsert({
      where: { id: t.id },
      update: { nombre: t.nombre, descripcion: t.descripcion },
      create: t,
    });
  }
  console.log(`   ✓ ${TECNICAS_DEFAULT.length} técnicas\n`);
  console.log("✅ Seed completado.");
}

async function main() {
  const dataPath = path.join(process.cwd(), "prisma", "seed-data.json");
  if (existsSync(dataPath)) {
    await seedFromJson(dataPath);
  } else {
    console.log("ℹ️  No se encontró prisma/seed-data.json — sembrando solo técnicas por defecto.");
    await seedDefault();
  }
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

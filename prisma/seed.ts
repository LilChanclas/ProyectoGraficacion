import "dotenv/config";
import { PrismaClient, TipoMetodoTecnica } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Extraer la URL TCP directa del DATABASE_URL (prisma+postgres con API key codificada)
function getDirectUrl(): string {
  const dbUrl = process.env.DATABASE_URL || "";
  const match = dbUrl.match(/api_key=(.+)/);
  if (match) {
    try {
      const decoded = JSON.parse(Buffer.from(match[1], "base64").toString());
      return decoded.databaseUrl;
    } catch {
      // fallback
    }
  }
  return dbUrl;
}

const directUrl = getDirectUrl();
const adapter = new PrismaPg({ connectionString: directUrl });
const prisma = new PrismaClient({ adapter });

const tecnicas = [
  {
    nombre: "Entrevista",
    tipo_metodo: TipoMetodoTecnica.ENTREVISTA,
    descripcion: "Conversación estructurada o semiestructurada con stakeholders para obtener información detallada.",
  },
  {
    nombre: "Cuestionario",
    tipo_metodo: TipoMetodoTecnica.CUESTIONARIO,
    descripcion: "Conjunto de preguntas escritas para recopilar información de múltiples personas.",
  },
  {
    nombre: "Observación",
    tipo_metodo: TipoMetodoTecnica.OBSERVACION,
    descripcion: "Observación directa de procesos y actividades en el entorno del cliente.",
  },
  {
    nombre: "Historia de Usuario",
    tipo_metodo: TipoMetodoTecnica.HISTORIA_USUARIO,
    descripcion: "Descripción breve de una funcionalidad desde la perspectiva del usuario final.",
  },
  {
    nombre: "Focus Group",
    tipo_metodo: TipoMetodoTecnica.FOCUS_GROUP,
    descripcion: "Sesión grupal facilitada para discutir temas específicos con múltiples stakeholders.",
  },
  {
    nombre: "Análisis Documental",
    tipo_metodo: TipoMetodoTecnica.DOCUMENTOS,
    descripcion: "Revisión y análisis de documentos existentes del cliente (manuales, reportes, políticas).",
  },
  {
    nombre: "Seguimiento Transaccional",
    tipo_metodo: TipoMetodoTecnica.SEGUIMIENTO_TRANSACCIONAL,
    descripcion: "Rastreo y análisis de transacciones o flujos de trabajo existentes.",
  },
];

async function main() {
  console.log("Seeding técnicas...");

  for (const tecnica of tecnicas) {
    await prisma.tecnica.upsert({
      where: {
        id: tecnica.tipo_metodo.toLowerCase(),
      },
      update: {
        nombre: tecnica.nombre,
        descripcion: tecnica.descripcion,
      },
      create: {
        id: tecnica.tipo_metodo.toLowerCase(),
        ...tecnica,
      },
    });
  }

  console.log("Seed completado.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

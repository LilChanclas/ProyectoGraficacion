// lib/spec-generators.ts
// Parsers de Mermaid + generadores de specs para el paquete de codificación.

export interface DiagramaInput {
  id: string;
  tipo: string;
  nombre: string;
  contenido: string;
}

export interface SpecFile {
  filename: string;
  title: string;
  content: string;
}

// ─── Parsers internos ────────────────────────────────────────────────────────

interface ClassMember {
  visibility: string;
  type?: string;
  name: string;
  isMethod: boolean;
}
interface ClassDef { name: string; members: ClassMember[] }
interface ClassRelation { from: string; arrow: string; to: string; label?: string }

function parseClassDiagram(mermaid: string): { classes: ClassDef[]; relations: ClassRelation[] } {
  const classes: ClassDef[] = [];
  const relations: ClassRelation[] = [];

  const classBlockRegex = /class\s+(\w+)\s*\{([^}]*)\}/g;
  let m: RegExpExecArray | null;
  while ((m = classBlockRegex.exec(mermaid)) !== null) {
    const [, name, body] = m;
    const members: ClassMember[] = [];
    for (const line of body.split("\n")) {
      const t = line.trim();
      if (!t || !["+", "-", "#", "~"].includes(t[0])) continue;
      const rest = t.slice(1).trim();
      const isMethod = rest.endsWith(")") || rest.includes("(");
      if (isMethod) {
        members.push({ visibility: t[0], name: rest, isMethod: true });
      } else {
        const parts = rest.split(/\s+/);
        if (parts.length >= 2) {
          members.push({ visibility: t[0], type: parts[0], name: parts.slice(1).join(" "), isMethod: false });
        } else {
          members.push({ visibility: t[0], name: rest, isMethod: false });
        }
      }
    }
    classes.push({ name, members });
  }

  const relRegex = /(\w+)\s*(--|-->|<\|--|<\|\.\.|\.\.|o--|--o|\*--|--\*|\.\.>|<\.\.)\s*(\w+)(?:\s*:\s*(.+))?/g;
  while ((m = relRegex.exec(mermaid)) !== null) {
    const [, from, arrow, to, label] = m;
    if (from && to && from !== to) {
      relations.push({ from, arrow: arrow.trim(), to, label: label?.trim() });
    }
  }

  return { classes, relations };
}

interface UseCaseDiagram {
  actors: string[];
  useCases: string[];
  actorRelations: { actor: string; useCase: string }[];
}

function parseUseCaseDiagram(mermaid: string): UseCaseDiagram {
  const actors: string[] = [];
  const useCases: string[] = [];
  const actorRelations: { actor: string; useCase: string }[] = [];
  const nodeMap = new Map<string, { type: "actor" | "useCase"; label: string }>();

  let m: RegExpExecArray | null;

  // Actors: id([Label]) — stadium/cylinder shapes used for actors
  const actorNodeRegex = /(\w+)\(\[([^\]]+)\]\)/g;
  while ((m = actorNodeRegex.exec(mermaid)) !== null) {
    const [, id, label] = m;
    nodeMap.set(id, { type: "actor", label: label.trim() });
    if (!actors.includes(label.trim())) actors.push(label.trim());
  }

  // Use cases: id((Label)) — circle shapes
  const ucDoubleRegex = /(\w+)\(\(([^)]+)\)\)/g;
  while ((m = ucDoubleRegex.exec(mermaid)) !== null) {
    const [, id, label] = m;
    if (!nodeMap.has(id)) {
      nodeMap.set(id, { type: "useCase", label: label.trim() });
      if (!useCases.includes(label.trim())) useCases.push(label.trim());
    }
  }

  // Use cases: id(Label) — single parens
  const ucSingleRegex = /(\w+)\(([^()[\]]+)\)/g;
  while ((m = ucSingleRegex.exec(mermaid)) !== null) {
    const [, id, label] = m;
    if (!nodeMap.has(id)) {
      nodeMap.set(id, { type: "useCase", label: label.trim() });
      if (!useCases.includes(label.trim())) useCases.push(label.trim());
    }
  }

  // Use cases: id[Label] — rect shapes (alternative)
  const ucRectRegex = /(\w+)\[([^\]]+)\]/g;
  while ((m = ucRectRegex.exec(mermaid)) !== null) {
    const [, id, label] = m;
    if (!nodeMap.has(id)) {
      nodeMap.set(id, { type: "useCase", label: label.trim() });
      if (!useCases.includes(label.trim())) useCases.push(label.trim());
    }
  }

  // Relations: A --> B
  const relRegex = /(\w+)\s*-->\s*(\w+)/g;
  while ((m = relRegex.exec(mermaid)) !== null) {
    const [, fromId, toId] = m;
    const from = nodeMap.get(fromId);
    const to = nodeMap.get(toId);
    if (from?.type === "actor" && to?.type === "useCase") {
      actorRelations.push({ actor: from.label, useCase: to.label });
    }
  }

  return { actors, useCases, actorRelations };
}

interface PackageDiagram {
  packages: { name: string; components: string[] }[];
  relations: string[];
}

function parsePackageDiagram(mermaid: string): PackageDiagram {
  const packages: { name: string; components: string[] }[] = [];
  const relations: string[] = [];

  // Match subgraph blocks (greedy-safe using named approach)
  const lines = mermaid.split("\n");
  let current: { name: string; components: string[] } | null = null;

  for (const line of lines) {
    const t = line.trim();
    const sgMatch = t.match(/^subgraph\s+"?([^"]+)"?$/);
    if (sgMatch) {
      current = { name: sgMatch[1].trim(), components: [] };
      continue;
    }
    if (t === "end" && current) {
      packages.push(current);
      current = null;
      continue;
    }
    if (current) {
      // Extract node label from id[Label], id(Label), id([Label])
      const nodeMatch = t.match(/^\w+\[([^\]]+)\]/) || t.match(/^\w+\(([^)]+)\)/);
      if (nodeMatch) {
        const label = nodeMatch[1].trim();
        if (!current.components.includes(label)) current.components.push(label);
      }
    } else {
      // Cross-package relations outside subgraphs
      const relMatch = t.match(/^(\w+)\s*-->\s*(\w+)(?:\s*:\s*(.+))?$/);
      if (relMatch) {
        const label = relMatch[3] ? `: ${relMatch[3].trim()}` : "";
        relations.push(`${relMatch[1]} → ${relMatch[2]}${label}`);
      }
    }
  }

  return { packages, relations };
}

interface SeqMessage { from: string; to: string; type: "async" | "return" | "sync"; text: string }
interface SequenceDiagram { name: string; participants: string[]; messages: SeqMessage[]; notes: string[] }

function parseSequenceDiagram(mermaid: string, diagramName: string): SequenceDiagram {
  const participants: string[] = [];
  const messages: SeqMessage[] = [];
  const notes: string[] = [];
  const aliasMap = new Map<string, string>(); // alias/id → display name

  let m: RegExpExecArray | null;

  // participant "Display Name" as alias  OR  participant Name
  const partRegex = /participant\s+(?:"([^"]+)"|(\S+))(?:\s+as\s+(\S+))?/g;
  while ((m = partRegex.exec(mermaid)) !== null) {
    const displayName = (m[1] || m[2] || "").trim();
    const alias = (m[3] || m[2] || m[1] || "").trim();
    if (displayName && !participants.includes(displayName)) {
      participants.push(displayName);
      aliasMap.set(alias, displayName);
      aliasMap.set(displayName, displayName);
    }
  }

  // actor shorthand
  const actorRegex = /^actor\s+(?:"([^"]+)"|(\S+))(?:\s+as\s+(\S+))?$/gm;
  while ((m = actorRegex.exec(mermaid)) !== null) {
    const displayName = (m[1] || m[2] || "").trim();
    const alias = (m[3] || m[2] || m[1] || "").trim();
    if (displayName && !participants.includes(displayName)) {
      participants.push(displayName);
      aliasMap.set(alias, displayName);
      aliasMap.set(displayName, displayName);
    }
  }

  // Messages: A->>B: text  or A-->B: text
  const msgRegex = /^(\S+)\s*(->>|->|-->>|-->)\s*(\S+)\s*:\s*(.+)$/gm;
  while ((m = msgRegex.exec(mermaid)) !== null) {
    const [, fromRaw, arrow, toRaw, text] = m;
    const from = aliasMap.get(fromRaw.trim()) || fromRaw.trim();
    const to = aliasMap.get(toRaw.trim()) || toRaw.trim();
    const type: SeqMessage["type"] = arrow.startsWith("--") ? "return" : arrow === "->>" ? "async" : "sync";
    messages.push({ from, to, type, text: text.trim() });
  }

  // Notes
  const noteRegex = /Note\s+(?:over|left of|right of)\s+[\w,\s"]+:\s*(.+)/g;
  while ((m = noteRegex.exec(mermaid)) !== null) {
    notes.push(m[1].trim());
  }

  return { name: diagramName, participants, messages, notes };
}

// ─── Utilidades ───────────────────────────────────────────────────────────────

function mapToPrismaType(type: string): string {
  const map: Record<string, string> = {
    String: "String", string: "String", str: "String",
    int: "Int", Int: "Int", Integer: "Int", integer: "Int",
    float: "Float", Float: "Float", double: "Float", Double: "Float", number: "Float",
    boolean: "Boolean", Boolean: "Boolean", bool: "Boolean",
    Date: "DateTime", DateTime: "DateTime", date: "DateTime",
    JSON: "Json", json: "Json", object: "Json",
  };
  return map[type] || "String";
}

function toSlug(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const ARROW_MAP: Record<string, string> = {
  "-->": "asociación →",
  "--": "asociación",
  "<|--": "hereda de",
  "<|..": "implementa",
  "..": "dependencia",
  "o--": "agregación ◇",
  "--o": "agregación ◇",
  "*--": "composición ◆",
  "--*": "composición ◆",
  "..>": "usa →",
  "<..": "usa ←",
};

// ─── Generadores de specs ─────────────────────────────────────────────────────

function genModelosDatos(diagramas: DiagramaInput[], proyectoNombre: string, dateStr: string): string {
  const src = diagramas.filter((d) => d.tipo === "CLASES");
  const L: string[] = [];

  L.push("# SPEC-01: Modelo de Datos y Entidades");
  L.push("");
  L.push(`> **Proyecto:** ${proyectoNombre}  `);
  L.push(`> **Generado:** ${dateStr}  `);
  L.push(`> **Fuente:** ${src.length} diagrama(s) de clases`);
  L.push("");
  L.push(
    "Este spec describe todas las entidades del sistema, sus atributos y relaciones," +
    " derivados de los diagramas de clases del proyecto."
  );
  L.push("");

  if (src.length === 0) {
    L.push("> ⚠️ No se encontraron diagramas de clases en este proyecto.");
    return L.join("\n");
  }

  const allClasses: ClassDef[] = [];
  const allRelations: ClassRelation[] = [];

  for (const d of src) {
    const { classes, relations } = parseClassDiagram(d.contenido);
    allClasses.push(...classes);
    allRelations.push(...relations);

    L.push(`## Diagrama: ${d.nombre}`);
    L.push("");

    if (classes.length === 0) {
      L.push("> No se pudieron extraer entidades de este diagrama.");
      L.push("");
      L.push("```mermaid");
      L.push(d.contenido);
      L.push("```");
      L.push("");
      continue;
    }

    L.push("### Entidades");
    L.push("");

    for (const cls of classes) {
      L.push(`#### \`${cls.name}\``);
      L.push("");
      const props = cls.members.filter((m) => !m.isMethod);
      const methods = cls.members.filter((m) => m.isMethod);

      if (props.length > 0) {
        L.push("| Visibilidad | Tipo | Atributo |");
        L.push("|-------------|------|----------|");
        for (const p of props) {
          const vis = p.visibility === "+" ? "público" : p.visibility === "-" ? "privado" : "protegido";
          L.push(`| ${vis} | \`${p.type || "—"}\` | \`${p.name}\` |`);
        }
        L.push("");
      }

      if (methods.length > 0) {
        L.push("**Operaciones:**");
        L.push("");
        for (const mt of methods) {
          L.push(`- \`${mt.name}\``);
        }
        L.push("");
      }
    }

    if (relations.length > 0) {
      L.push("### Relaciones");
      L.push("");
      for (const rel of relations) {
        const type = ARROW_MAP[rel.arrow] || rel.arrow;
        L.push(
          `- \`${rel.from}\` **${type}** \`${rel.to}\`${rel.label ? ` — *${rel.label}*` : ""}`
        );
      }
      L.push("");
    }

    L.push("```mermaid");
    L.push(d.contenido);
    L.push("```");
    L.push("");
  }

  // Prisma schema sugerido
  L.push("---");
  L.push("");
  L.push("## Implementación: Schema Prisma sugerido");
  L.push("");
  L.push("Añade o adapta los siguientes modelos en `prisma/schema.prisma`:");
  L.push("");
  L.push("```prisma");

  const seen = new Set<string>();
  for (const cls of allClasses) {
    if (seen.has(cls.name)) continue;
    seen.add(cls.name);

    L.push(`model ${cls.name} {`);
    L.push("  id             String   @id @default(cuid())");

    const props = cls.members.filter((m) => !m.isMethod);
    for (const p of props) {
      const lname = p.name.toLowerCase();
      if (["id", "creado_en", "actualizado_en", "created_at", "updated_at"].includes(lname)) continue;
      const prismaType = mapToPrismaType(p.type || "String");
      const optional = p.visibility === "-" ? "?" : "";
      const col = p.name.padEnd(14);
      L.push(`  ${col} ${prismaType}${optional}`);
    }

    L.push("  creado_en      DateTime @default(now())");
    L.push("  actualizado_en DateTime @updatedAt");
    L.push("}");
    L.push("");
  }

  L.push("```");
  L.push("");
  L.push("> ⚡ Después de definir los modelos ejecuta:");
  L.push("> ```bash");
  L.push("> npx prisma migrate dev --name <nombre-descriptivo>");
  L.push("> npx prisma generate");
  L.push("> ```");
  L.push("");

  L.push("## Checklist de implementación");
  L.push("");
  for (const cls of [...seen].map((name) => ({ name }))) {
    L.push(`- [ ] Modelo \`${cls.name}\` definido en Prisma schema`);
    L.push(`- [ ] Endpoints CRUD para \`${cls.name}\` (GET / POST / PUT / DELETE)`);
  }
  if (allRelations.length > 0) {
    L.push("- [ ] Relaciones implementadas con `onDelete: Cascade` o `SetNull` según corresponda");
    L.push("- [ ] `@@index` en todas las claves foráneas");
  }
  L.push("- [ ] `npx tsc --noEmit` sin errores");
  L.push("");

  return L.join("\n");
}

function genCasosUso(diagramas: DiagramaInput[], proyectoNombre: string, dateStr: string): string {
  const src = diagramas.filter((d) => d.tipo === "CASOS_USO");
  const L: string[] = [];

  L.push("# SPEC-02: Casos de Uso y Funcionalidades");
  L.push("");
  L.push(`> **Proyecto:** ${proyectoNombre}  `);
  L.push(`> **Generado:** ${dateStr}  `);
  L.push(`> **Fuente:** ${src.length} diagrama(s) de casos de uso`);
  L.push("");
  L.push(
    "Este spec describe los actores del sistema y todas las funcionalidades que deben" +
    " ser implementadas, derivadas de los diagramas de casos de uso."
  );
  L.push("");

  if (src.length === 0) {
    L.push("> ⚠️ No se encontraron diagramas de casos de uso en este proyecto.");
    return L.join("\n");
  }

  const allActors = new Set<string>();
  const allUseCases: string[] = [];

  for (const d of src) {
    const { actors, useCases, actorRelations } = parseUseCaseDiagram(d.contenido);
    actors.forEach((a) => allActors.add(a));
    useCases.forEach((uc) => { if (!allUseCases.includes(uc)) allUseCases.push(uc); });

    L.push(`## Diagrama: ${d.nombre}`);
    L.push("");

    if (actors.length > 0) {
      L.push("### Actores");
      L.push("");
      for (const actor of actors) {
        L.push(`- **${actor}**`);
      }
      L.push("");
    }

    if (useCases.length > 0) {
      L.push("### Casos de uso identificados");
      L.push("");
      for (const uc of useCases) {
        L.push(`- ${uc}`);
      }
      L.push("");
    }

    if (actorRelations.length > 0) {
      L.push("### Actor ↔ Caso de Uso");
      L.push("");
      const byActor = new Map<string, string[]>();
      for (const rel of actorRelations) {
        if (!byActor.has(rel.actor)) byActor.set(rel.actor, []);
        byActor.get(rel.actor)!.push(rel.useCase);
      }
      for (const [actor, ucs] of byActor) {
        L.push(`**${actor}** puede:`);
        for (const uc of ucs) {
          L.push(`  - ${uc}`);
        }
        L.push("");
      }
    }

    L.push("```mermaid");
    L.push(d.contenido);
    L.push("```");
    L.push("");
  }

  L.push("---");
  L.push("");
  L.push("## Implementación requerida");
  L.push("");
  L.push("Cada caso de uso debe traducirse en al menos uno de:");
  L.push("- Una ruta de API (`app/api/.../route.ts`)");
  L.push("- Una página o componente (`app/.../page.tsx`)");
  L.push("- Una función de lógica de negocio");
  L.push("");

  if (allActors.size > 0) {
    L.push("## Roles / Actores del sistema");
    L.push("");
    for (const actor of allActors) {
      L.push(`- **${actor}**: definir qué rutas y acciones tiene permitidas`);
    }
    L.push("");
  }

  L.push("## Checklist de implementación");
  L.push("");
  for (const uc of allUseCases) {
    L.push(`- [ ] **${uc}** — implementado y probado`);
  }
  L.push("- [ ] Control de acceso por rol implementado");
  L.push("- [ ] `npx tsc --noEmit` sin errores");
  L.push("");

  return L.join("\n");
}

function genArquitectura(diagramas: DiagramaInput[], proyectoNombre: string, dateStr: string): string {
  const src = diagramas.filter((d) => d.tipo === "PAQUETES");
  const L: string[] = [];

  L.push("# SPEC-03: Arquitectura y Módulos del Sistema");
  L.push("");
  L.push(`> **Proyecto:** ${proyectoNombre}  `);
  L.push(`> **Generado:** ${dateStr}  `);
  L.push(`> **Fuente:** ${src.length} diagrama(s) de paquetes`);
  L.push("");
  L.push(
    "Este spec describe la arquitectura modular del sistema y cómo organizar" +
    " el código en carpetas y módulos, derivado de los diagramas de paquetes."
  );
  L.push("");

  if (src.length === 0) {
    L.push("> ⚠️ No se encontraron diagramas de paquetes en este proyecto.");
    return L.join("\n");
  }

  const allPackages: { name: string; components: string[] }[] = [];

  for (const d of src) {
    const { packages, relations } = parsePackageDiagram(d.contenido);
    allPackages.push(...packages);

    L.push(`## Diagrama: ${d.nombre}`);
    L.push("");

    if (packages.length > 0) {
      L.push("### Módulos identificados");
      L.push("");
      for (const pkg of packages) {
        L.push(`#### ${pkg.name}`);
        if (pkg.components.length > 0) {
          L.push("");
          L.push("**Componentes:**");
          for (const comp of pkg.components) {
            L.push(`- ${comp}`);
          }
        }
        L.push("");
      }
    }

    if (relations.length > 0) {
      L.push("### Dependencias entre módulos");
      L.push("");
      for (const rel of relations) {
        L.push(`- ${rel}`);
      }
      L.push("");
    }

    L.push("```mermaid");
    L.push(d.contenido);
    L.push("```");
    L.push("");
  }

  L.push("---");
  L.push("");
  L.push("## Estructura de carpetas sugerida");
  L.push("");
  L.push("```");
  L.push("app/");
  L.push("  api/");
  const seen = new Set<string>();
  for (const pkg of allPackages) {
    const slug = toSlug(pkg.name);
    if (seen.has(slug)) continue;
    seen.add(slug);
    L.push(`    ${slug}/`);
    L.push(`      route.ts          # GET, POST`);
    L.push(`      [id]/`);
    L.push(`        route.ts        # GET, PUT, DELETE`);
  }
  L.push("  (pages)/");
  for (const slug of seen) {
    L.push(`    ${slug}/`);
    L.push(`      page.tsx`);
  }
  L.push("lib/");
  L.push("  prisma.ts");
  L.push("prisma/");
  L.push("  schema.prisma");
  L.push("```");
  L.push("");

  L.push("## Checklist de implementación");
  L.push("");
  for (const pkg of allPackages) {
    L.push(`- [ ] Módulo **${pkg.name}** implementado`);
    for (const comp of pkg.components) {
      L.push(`  - [ ] ${comp}`);
    }
  }
  L.push("- [ ] `npx tsc --noEmit` sin errores");
  L.push("");

  return L.join("\n");
}

function genFlujosSistema(diagramas: DiagramaInput[], proyectoNombre: string, dateStr: string): string {
  const src = diagramas.filter((d) => d.tipo === "SECUENCIA");
  const L: string[] = [];

  L.push("# SPEC-04: Flujos del Sistema e Interacciones");
  L.push("");
  L.push(`> **Proyecto:** ${proyectoNombre}  `);
  L.push(`> **Generado:** ${dateStr}  `);
  L.push(`> **Fuente:** ${src.length} diagrama(s) de secuencia`);
  L.push("");
  L.push(
    "Este spec describe los flujos de interacción entre componentes del sistema," +
    " incluyendo la secuencia de operaciones para cada caso de uso."
  );
  L.push("");

  if (src.length === 0) {
    L.push("> ⚠️ No se encontraron diagramas de secuencia en este proyecto.");
    return L.join("\n");
  }

  const detectedEndpoints: string[] = [];

  for (const d of src) {
    const seq = parseSequenceDiagram(d.contenido, d.nombre);

    L.push(`## Flujo: ${d.nombre}`);
    L.push("");

    if (seq.participants.length > 0) {
      L.push(`**Participantes:** ${seq.participants.join(", ")}`);
      L.push("");
    }

    if (seq.messages.length > 0) {
      L.push("**Secuencia de operaciones:**");
      L.push("");
      seq.messages.forEach((msg, i) => {
        const arrow = msg.type === "return" ? "⤏ (respuesta)" : "→";
        L.push(`${i + 1}. \`${msg.from}\` ${arrow} \`${msg.to}\`: *${msg.text}*`);

        // Detect HTTP calls inside messages
        const httpMatch = msg.text.match(/^(GET|POST|PUT|PATCH|DELETE)\s+(\/[\w/{}:]+)/i);
        if (httpMatch) {
          const ep = `${httpMatch[1].toUpperCase()} ${httpMatch[2]}`;
          if (!detectedEndpoints.includes(ep)) detectedEndpoints.push(ep);
        }
      });
      L.push("");
    }

    if (seq.notes.length > 0) {
      L.push("**Notas del diagrama:**");
      for (const note of seq.notes) {
        L.push(`- ${note}`);
      }
      L.push("");
    }

    L.push("```mermaid");
    L.push(d.contenido);
    L.push("```");
    L.push("");
  }

  if (detectedEndpoints.length > 0) {
    L.push("---");
    L.push("");
    L.push("## Endpoints de API detectados en diagramas");
    L.push("");
    L.push("```");
    for (const ep of detectedEndpoints) {
      L.push(ep);
    }
    L.push("```");
    L.push("");
  }

  L.push("---");
  L.push("");
  L.push("## Instrucciones de implementación");
  L.push("");
  L.push("Para cada flujo:");
  L.push("1. Implementar los Route Handlers en `app/api/` (un archivo por recurso)");
  L.push("2. Cada paso de la secuencia debe tener manejo de errores `try/catch`");
  L.push("3. Validar el body de cada request antes de acceder a la BD");
  L.push("4. En el cliente, usar `useQuery` y `useMutation` de TanStack Query");
  L.push("5. Invalidar queries relevantes en `onSuccess` de cada mutación");
  L.push("");

  L.push("## Checklist de implementación");
  L.push("");
  for (const d of src) {
    L.push(`- [ ] Flujo **${d.nombre}** implementado end-to-end`);
    L.push(`  - [ ] Backend: endpoint(s) y lógica de negocio`);
    L.push(`  - [ ] Frontend: UI y llamadas a la API`);
    L.push(`  - [ ] Manejo de errores y estados de carga`);
  }
  L.push("- [ ] `npx tsc --noEmit` sin errores");
  L.push("");

  return L.join("\n");
}

function genIndice(
  diagramas: DiagramaInput[],
  proyectoNombre: string,
  dateStr: string,
  specFiles: { filename: string; title: string }[]
): string {
  const L: string[] = [];
  const byType = {
    CLASES:    diagramas.filter((d) => d.tipo === "CLASES"),
    CASOS_USO: diagramas.filter((d) => d.tipo === "CASOS_USO"),
    PAQUETES:  diagramas.filter((d) => d.tipo === "PAQUETES"),
    SECUENCIA: diagramas.filter((d) => d.tipo === "SECUENCIA"),
  };

  L.push("# SPEC-00: Índice del Paquete de Especificaciones");
  L.push("");
  L.push(`> **Proyecto:** ${proyectoNombre}  `);
  L.push(`> **Generado:** ${dateStr}  `);
  L.push(`> **Diagramas procesados:** ${diagramas.length} en total`);
  L.push("");
  L.push("## Instrucciones para el Agente de Codificación");
  L.push("");
  L.push(
    `Este paquete contiene toda la información técnica derivada del análisis de requerimientos` +
    ` del proyecto **${proyectoNombre}**. Úsalo **junto con el archivo maestro** del proyecto.`
  );
  L.push("");
  L.push("**Orden de lectura recomendado:**");
  L.push("");
  L.push("1. Lee el archivo maestro del proyecto (instrucciones generales, stack, diseño)");
  L.push("2. `SPEC-01-modelo-datos.md` → entidades, atributos, relaciones, schema Prisma");
  L.push("3. `SPEC-02-casos-uso.md` → funcionalidades requeridas, actores, permisos");
  L.push("4. `SPEC-03-arquitectura.md` → módulos, estructura de carpetas, componentes");
  L.push("5. `SPEC-04-flujos-sistema.md` → flujos, contratos de API, secuencia de operaciones");
  L.push("");
  L.push("**Regla de implementación:** implementa en el orden de los specs. Empieza por el");
  L.push("schema de Prisma, luego los endpoints de API, luego las páginas UI.");
  L.push("");
  L.push("---");
  L.push("");
  L.push("## Archivos en este paquete");
  L.push("");
  L.push("| Archivo | Contenido |");
  L.push("|---------|-----------|");
  for (const s of specFiles) {
    L.push(`| \`${s.filename}\` | ${s.title} |`);
  }
  L.push("");
  L.push("## Resumen de diagramas procesados");
  L.push("");

  if (byType.CLASES.length > 0) {
    L.push(`### Diagramas de Clases (${byType.CLASES.length})`);
    for (const d of byType.CLASES) L.push(`- ${d.nombre}`);
    L.push("");
  }
  if (byType.CASOS_USO.length > 0) {
    L.push(`### Diagramas de Casos de Uso (${byType.CASOS_USO.length})`);
    for (const d of byType.CASOS_USO) L.push(`- ${d.nombre}`);
    L.push("");
  }
  if (byType.PAQUETES.length > 0) {
    L.push(`### Diagramas de Paquetes (${byType.PAQUETES.length})`);
    for (const d of byType.PAQUETES) L.push(`- ${d.nombre}`);
    L.push("");
  }
  if (byType.SECUENCIA.length > 0) {
    L.push(`### Diagramas de Secuencia (${byType.SECUENCIA.length})`);
    for (const d of byType.SECUENCIA) L.push(`- ${d.nombre}`);
    L.push("");
  }

  L.push("---");
  L.push("");
  L.push(`*Generado automáticamente por ReqTracker · ${dateStr}*`);
  L.push("");

  return L.join("\n");
}

// ─── Función principal exportada ─────────────────────────────────────────────

export function generateAllSpecs(
  diagramas: DiagramaInput[],
  proyectoNombre: string
): SpecFile[] {
  const dateStr = new Date().toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const specs: SpecFile[] = [
    {
      filename: "SPEC-01-modelo-datos.md",
      title: "Modelo de Datos y Entidades",
      content: genModelosDatos(diagramas, proyectoNombre, dateStr),
    },
    {
      filename: "SPEC-02-casos-uso.md",
      title: "Casos de Uso y Funcionalidades",
      content: genCasosUso(diagramas, proyectoNombre, dateStr),
    },
    {
      filename: "SPEC-03-arquitectura.md",
      title: "Arquitectura y Módulos del Sistema",
      content: genArquitectura(diagramas, proyectoNombre, dateStr),
    },
    {
      filename: "SPEC-04-flujos-sistema.md",
      title: "Flujos del Sistema e Interacciones",
      content: genFlujosSistema(diagramas, proyectoNombre, dateStr),
    },
  ];

  const indice: SpecFile = {
    filename: "SPEC-00-indice.md",
    title: "Índice del Paquete de Especificaciones",
    content: genIndice(
      diagramas,
      proyectoNombre,
      dateStr,
      specs.map((s) => ({ filename: s.filename, title: s.title }))
    ),
  };

  return [indice, ...specs];
}

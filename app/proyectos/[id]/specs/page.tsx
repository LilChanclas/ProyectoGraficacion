"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import {
  HiPlus,
  HiOutlineTrash,
  HiOutlinePencil,
  HiCheck,
  HiX,
  HiOutlineClipboardCopy,
  HiOutlineDownload,
  HiOutlineCode,
  HiOutlineEye,
  HiOutlineLightningBolt,
  HiOutlineDocumentText,
} from "react-icons/hi";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SpecMeta {
  id: string;
  nombre: string;
  descripcion: string | null;
  creado_en: string;
  actualizado_en: string;
}

interface Spec extends SpecMeta {
  contenido: string;
}

interface Subproceso {
  id: string;
  nombre: string;
  descripcion: string | null;
  subproceso_tecnicas: { tecnica: { nombre: string; tipo_metodo: string } }[];
}

interface Proceso {
  id: string;
  nombre: string;
  descripcion: string | null;
  subprocesos: Subproceso[];
}

interface Persona {
  id: string;
  nombre_completo: string;
  rol: { nombre: string };
}

interface Requisito {
  id: string;
  codigo: string | null;
  nombre: string;
  descripcion: string | null;
  prioridad: string;
  estado: string;
}

interface Diagrama {
  id: string;
  tipo: string;
  nombre: string;
}

interface ResultadoRecabacion {
  id: string;
  contenido: string;
  sesion: {
    subproceso: { nombre: string };
    tecnica: { nombre: string };
  };
}

// ── Spec Generation ───────────────────────────────────────────────────────────

interface GenConfig {
  featureName: string;
  featureDesc: string;
  includeRequisitos: string[];
  includeProcesos: string[];
  targetStack: string;
  extraContext: string;
}

function generateSpec(
  config: GenConfig,
  proyecto: { nombre: string; descripcion: string | null },
  procesos: Proceso[],
  personas: Persona[],
  requisitos: Requisito[],
  diagramas: Diagrama[],
  resultados: ResultadoRecabacion[]
): string {
  const selectedReqs = requisitos.filter((r) =>
    config.includeRequisitos.includes(r.id)
  );
  const selectedProcs = procesos.filter((p) =>
    config.includeProcesos.includes(p.id)
  );
  const roles = [...new Set(personas.map((p) => p.rol.nombre))];

  const lines: string[] = [];

  // ── Header ──
  lines.push(`# Feature Spec: ${config.featureName}`);
  lines.push("");
  lines.push(`> Generado desde el proyecto **${proyecto.nombre}** en ReqTracker.`);
  if (config.featureDesc) {
    lines.push(`> ${config.featureDesc}`);
  }
  lines.push("");

  // ── Stack ──
  lines.push("## Stack y convenciones");
  lines.push("");
  if (config.targetStack) {
    lines.push(config.targetStack);
  } else {
    lines.push("```");
    lines.push("Framework : Next.js 16 App Router + TypeScript (strict)");
    lines.push("Base de datos : PostgreSQL vía Prisma 7 ORM");
    lines.push("UI : Tailwind CSS v4");
    lines.push("Estado del servidor : TanStack Query v5 (React Query)");
    lines.push("Iconos : react-icons/hi (HiOutline*)");
    lines.push("Rutas API : App Router Route Handlers (app/api/**/route.ts)");
    lines.push("Componentes cliente : directiva 'use client' explícita");
    lines.push("Convención de nombres : snake_case en BD, camelCase en TS");
    lines.push("```");
  }
  lines.push("");

  // ── Domain Context ──
  lines.push("## Contexto del dominio");
  lines.push("");
  if (proyecto.descripcion) {
    lines.push(`**Proyecto:** ${proyecto.descripcion}`);
    lines.push("");
  }

  if (roles.length) {
    lines.push(`**Actores/Roles:** ${roles.join(", ")}`);
    lines.push("");
  }

  if (selectedProcs.length) {
    lines.push("**Procesos y subprocesos involucrados:**");
    lines.push("");
    selectedProcs.forEach((proc) => {
      lines.push(`- **${proc.nombre}**${proc.descripcion ? `: ${proc.descripcion}` : ""}`);
      proc.subprocesos.forEach((sub) => {
        const tecnicas = sub.subproceso_tecnicas.map((st) => st.tecnica.nombre).join(", ");
        lines.push(
          `  - ${sub.nombre}${sub.descripcion ? ` — ${sub.descripcion}` : ""}${tecnicas ? ` *(técnicas: ${tecnicas})*` : ""}`
        );
      });
    });
    lines.push("");
  }

  // ── Evidencia de sesiones ──
  const relevantResultados = resultados.filter((r) =>
    selectedProcs.some(
      (p) =>
        p.subprocesos.some((s) => s.nombre === r.sesion.subproceso.nombre)
    )
  );
  if (relevantResultados.length) {
    lines.push("**Hallazgos de sesiones de recabación:**");
    lines.push("");
    relevantResultados.slice(0, 8).forEach((r) => {
      lines.push(
        `- *[${r.sesion.tecnica.nombre} / ${r.sesion.subproceso.nombre}]* ${r.contenido}`
      );
    });
    lines.push("");
  }

  // ── Diagramas disponibles ──
  if (diagramas.length) {
    lines.push("**Diagramas disponibles en el proyecto:**");
    lines.push("");
    diagramas.forEach((d) => {
      lines.push(`- ${d.tipo}: ${d.nombre}`);
    });
    lines.push("");
  }

  // ── Requisitos ──
  if (selectedReqs.length) {
    lines.push("## Requisitos a implementar");
    lines.push("");
    lines.push(
      "| Código | Nombre | Descripción | Prioridad |"
    );
    lines.push("|--------|--------|-------------|-----------|");
    selectedReqs
      .sort((a, b) => {
        const order = { ALTA: 0, MEDIA: 1, BAJA: 2 };
        return (order[a.prioridad as keyof typeof order] ?? 1) - (order[b.prioridad as keyof typeof order] ?? 1);
      })
      .forEach((r) => {
        const desc = r.descripcion?.replace(/\|/g, "\\|") || "—";
        lines.push(
          `| ${r.codigo || "—"} | ${r.nombre} | ${desc} | ${r.prioridad} |`
        );
      });
    lines.push("");
  }

  // ── Modelo de datos sugerido ──
  lines.push("## Modelo de datos sugerido");
  lines.push("");
  lines.push(
    "Añade los siguientes modelos al archivo `prisma/schema.prisma`:"
  );
  lines.push("");
  lines.push("```prisma");
  lines.push("// TODO: define los modelos Prisma necesarios para esta feature.");
  lines.push("// Convenciones del proyecto:");
  lines.push("//   - id: String @id @default(cuid())");
  lines.push("//   - creado_en: DateTime @default(now())");
  lines.push("//   - actualizado_en: DateTime @updatedAt");
  lines.push("//   - Relaciones con onDelete: Cascade cuando el hijo depende del padre");
  lines.push("//   - @@index([foreign_key]) en todas las claves foráneas");
  lines.push("```");
  lines.push("");
  lines.push(
    "> Después de modificar el schema ejecuta: `npx prisma migrate dev --name <nombre>` y luego `npx prisma generate`."
  );
  lines.push("");

  // ── API Endpoints ──
  lines.push("## API Endpoints");
  lines.push("");
  lines.push(
    "Crea los siguientes Route Handlers bajo `app/api/`. Cada archivo exporta funciones HTTP nombradas (`GET`, `POST`, `PUT`, `DELETE`)."
  );
  lines.push("");
  lines.push("```");
  lines.push("app/api/");

  if (selectedProcs.length) {
    const slug = config.featureName
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    lines.push(`  ${slug}/`);
    lines.push(`    route.ts          # GET (listar) · POST (crear)`);
    lines.push(`    [id]/`);
    lines.push(`      route.ts        # GET · PUT · DELETE`);
  } else {
    lines.push("  <recurso>/");
    lines.push("    route.ts          # GET · POST");
    lines.push("    [id]/");
    lines.push("      route.ts        # GET · PUT · DELETE");
  }

  lines.push("```");
  lines.push("");

  lines.push("### Contratos de cada endpoint");
  lines.push("");
  lines.push("**GET /api/<recurso>**");
  lines.push("```json");
  lines.push("// Response 200");
  lines.push('[{ "id": "...", "nombre": "...", "...": "..." }]');
  lines.push("```");
  lines.push("");
  lines.push("**POST /api/<recurso>**");
  lines.push("```json");
  lines.push("// Body");
  lines.push('{ "nombre": "string (requerido)", "descripcion": "string (opcional)" }');
  lines.push("// Response 201");
  lines.push('{ "id": "...", "nombre": "...", "creado_en": "..." }');
  lines.push("```");
  lines.push("");
  lines.push("**PUT /api/<recurso>/[id]**");
  lines.push("```json");
  lines.push("// Body — solo los campos a actualizar (partial update)");
  lines.push('{ "nombre": "string" }');
  lines.push("// Response 200 — objeto actualizado completo");
  lines.push("```");
  lines.push("");
  lines.push("**DELETE /api/<recurso>/[id]**");
  lines.push("```json");
  lines.push('// Response 200: { "ok": true }');
  lines.push("```");
  lines.push("");

  // ── UI Specification ──
  lines.push("## Interfaz de usuario");
  lines.push("");
  lines.push(
    "Crea la siguiente página bajo `app/proyectos/[id]/` siguiendo el patrón establecido:"
  );
  lines.push("");
  lines.push("```");
  lines.push("app/proyectos/[id]/");

  const uiSlug = config.featureName
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  lines.push(`  ${uiSlug}/`);
  lines.push(`    page.tsx`);
  lines.push("```");
  lines.push("");
  lines.push("### Comportamiento esperado");
  lines.push("");
  lines.push("- **Listado:** muestra todos los registros del proyecto actual (`useParams` → `id`).");
  lines.push("- **Crear:** botón `+ Nuevo` abre formulario inline o modal. `useMutation` → POST → `queryClient.invalidateQueries`.");
  lines.push("- **Editar:** click en ítem activa modo edición inline. `useMutation` → PUT.");
  lines.push("- **Eliminar:** botón de papelera con confirmación nativa (`confirm()`). `useMutation` → DELETE.");
  lines.push("- **Estados de carga:** skeleton o spinner mientras `isLoading`.");
  lines.push("- **Estados vacíos:** mensaje descriptivo cuando no hay registros.");
  lines.push("");
  lines.push("### Patrones de estilo a seguir");
  lines.push("");
  lines.push("```tsx");
  lines.push("// Botón primario");
  lines.push('<button className="px-4 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700">');
  lines.push("");
  lines.push("// Tarjeta / contenedor");
  lines.push('<div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">');
  lines.push("");
  lines.push("// Input");
  lines.push('<input className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-full" />');
  lines.push("");
  lines.push("// Badge de estado");
  lines.push('<span className="text-xs font-medium px-2 py-0.5 rounded bg-violet-100 text-violet-700">');
  lines.push("```");
  lines.push("");

  // ── Files to create ──
  lines.push("## Archivos a crear o modificar");
  lines.push("");
  lines.push("```");
  lines.push("prisma/schema.prisma                          # añadir modelos");
  lines.push("prisma/migrations/<timestamp>_<nombre>/       # generado automáticamente");
  lines.push(`app/api/${uiSlug}/route.ts                    # GET, POST`);
  lines.push(`app/api/${uiSlug}/[id]/route.ts               # GET, PUT, DELETE`);
  lines.push(`app/proyectos/[id]/${uiSlug}/page.tsx         # página principal`);
  lines.push("app/proyectos/[id]/layout.tsx                 # añadir tab al nav");
  lines.push("```");
  lines.push("");

  // ── Acceptance criteria ──
  lines.push("## Criterios de aceptación");
  lines.push("");
  lines.push(
    "Usa esta lista como checklist al terminar la implementación:"
  );
  lines.push("");

  if (selectedReqs.length) {
    selectedReqs.forEach((r) => {
      lines.push(`- [ ] **${r.codigo || r.nombre}** — ${r.nombre}${r.descripcion ? `: ${r.descripcion}` : ""}`);
    });
  } else {
    lines.push("- [ ] El CRUD completo funciona sin errores de consola");
    lines.push("- [ ] La página aparece correctamente en la tab del proyecto");
    lines.push("- [ ] Los datos persisten al recargar la página");
    lines.push("- [ ] Los estados vacíos y de carga se muestran correctamente");
  }

  lines.push("- [ ] `npx tsc --noEmit` pasa sin errores");
  lines.push("- [ ] La navegación entre tabs no rompe nada (no hay errores en otras páginas)");
  lines.push("");

  // ── Extra context ──
  if (config.extraContext.trim()) {
    lines.push("## Contexto adicional");
    lines.push("");
    lines.push(config.extraContext);
    lines.push("");
  }

  // ── Footer ──
  lines.push("---");
  lines.push("");
  lines.push(
    `*Spec generada el ${new Date().toLocaleDateString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })} desde ReqTracker · Proyecto: ${proyecto.nombre}*`
  );

  return lines.join("\n");
}

// ── Generate Dialog ───────────────────────────────────────────────────────────

interface GenerateDialogProps {
  proyectoId: string;
  proyecto: { nombre: string; descripcion: string | null };
  procesos: Proceso[];
  personas: Persona[];
  requisitos: Requisito[];
  diagramas: Diagrama[];
  resultados: ResultadoRecabacion[];
  onClose: () => void;
  onGenerated: (spec: Spec) => void;
}

function GenerateDialog({
  proyectoId,
  proyecto,
  procesos,
  personas,
  requisitos,
  diagramas,
  resultados,
  onClose,
  onGenerated,
}: GenerateDialogProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [config, setConfig] = useState<GenConfig>({
    featureName: "",
    featureDesc: "",
    includeRequisitos: requisitos.filter((r) => r.prioridad === "ALTA").map((r) => r.id),
    includeProcesos: procesos.map((p) => p.id),
    targetStack: "",
    extraContext: "",
  });
  const [saving, setSaving] = useState(false);

  function toggleReq(id: string) {
    setConfig((c) => ({
      ...c,
      includeRequisitos: c.includeRequisitos.includes(id)
        ? c.includeRequisitos.filter((x) => x !== id)
        : [...c.includeRequisitos, id],
    }));
  }

  function toggleProc(id: string) {
    setConfig((c) => ({
      ...c,
      includeProcesos: c.includeProcesos.includes(id)
        ? c.includeProcesos.filter((x) => x !== id)
        : [...c.includeProcesos, id],
    }));
  }

  async function handleGenerate() {
    if (!config.featureName.trim()) return;
    setSaving(true);
    const contenido = generateSpec(
      config,
      proyecto,
      procesos,
      personas,
      requisitos,
      diagramas,
      resultados
    );
    const res = await fetch(`/api/proyectos/${proyectoId}/specs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: config.featureName.trim(),
        descripcion: config.featureDesc.trim() || null,
        contenido,
      }),
    });
    const spec = await res.json();
    setSaving(false);
    onGenerated(spec);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Generar Feature Spec</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {step === 1 ? "Paso 1 de 2 — Describe la feature" : "Paso 2 de 2 — Selecciona el contenido"}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <HiX className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nombre de la feature <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={config.featureName}
                  onChange={(e) => setConfig((c) => ({ ...c, featureName: e.target.value }))}
                  placeholder="Ej: Módulo de Autenticación, CRUD de Productos..."
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Descripción breve
                </label>
                <textarea
                  value={config.featureDesc}
                  onChange={(e) => setConfig((c) => ({ ...c, featureDesc: e.target.value }))}
                  placeholder="¿Qué hace esta feature? ¿Cuál es su propósito?"
                  rows={3}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Stack objetivo{" "}
                  <span className="text-slate-400 font-normal">(déjalo vacío para usar el stack del proyecto)</span>
                </label>
                <textarea
                  value={config.targetStack}
                  onChange={(e) => setConfig((c) => ({ ...c, targetStack: e.target.value }))}
                  placeholder="Ej: React Native + Expo, FastAPI + SQLAlchemy..."
                  rows={3}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Contexto adicional para el agente
                </label>
                <textarea
                  value={config.extraContext}
                  onChange={(e) => setConfig((c) => ({ ...c, extraContext: e.target.value }))}
                  placeholder="Restricciones, decisiones de diseño, dependencias externas, notas de arquitectura..."
                  rows={4}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm resize-none"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              {/* Procesos */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2">
                  Procesos a incluir ({config.includeProcesos.length}/{procesos.length})
                </h4>
                {procesos.length === 0 && (
                  <p className="text-xs text-slate-400">No hay procesos en este proyecto.</p>
                )}
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {procesos.map((p) => (
                    <label
                      key={p.id}
                      className="flex items-start gap-2 p-2 rounded-lg hover:bg-slate-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={config.includeProcesos.includes(p.id)}
                        onChange={() => toggleProc(p.id)}
                        className="mt-0.5"
                      />
                      <div>
                        <p className="text-sm text-slate-800">{p.nombre}</p>
                        {p.descripcion && (
                          <p className="text-xs text-slate-500">{p.descripcion}</p>
                        )}
                        <p className="text-xs text-slate-400">
                          {p.subprocesos.length} subproceso(s)
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Requisitos */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2">
                  Requisitos a incluir ({config.includeRequisitos.length}/{requisitos.length})
                </h4>
                {requisitos.length === 0 && (
                  <p className="text-xs text-slate-400">No hay requisitos en este proyecto.</p>
                )}
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {requisitos.map((r) => (
                    <label
                      key={r.id}
                      className="flex items-start gap-2 p-2 rounded-lg hover:bg-slate-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={config.includeRequisitos.includes(r.id)}
                        onChange={() => toggleReq(r.id)}
                        className="mt-0.5"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {r.codigo && (
                            <span className="text-xs font-mono text-slate-500">{r.codigo}</span>
                          )}
                          <p className="text-sm text-slate-800">{r.nombre}</p>
                          <span
                            className={`ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded ${
                              r.prioridad === "ALTA"
                                ? "bg-red-100 text-red-700"
                                : r.prioridad === "MEDIA"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {r.prioridad}
                          </span>
                        </div>
                        {r.descripcion && (
                          <p className="text-xs text-slate-500 mt-0.5">{r.descripcion}</p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between gap-2 px-6 py-4 border-t border-slate-200">
          {step === 1 ? (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={() => setStep(2)}
                disabled={!config.featureName.trim()}
                className="px-4 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
              >
                Siguiente →
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                ← Atrás
              </button>
              <button
                onClick={handleGenerate}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
              >
                <HiOutlineLightningBolt className="h-4 w-4" />
                {saving ? "Generando..." : "Generar Spec"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SpecsPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showGenerate, setShowGenerate] = useState(false);
  const [view, setView] = useState<"preview" | "raw">("preview");
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [rawEdit, setRawEdit] = useState(false);
  const [rawContent, setRawContent] = useState("");
  const [dirty, setDirty] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: proyecto } = useQuery<{ id: string; nombre: string; descripcion: string | null }>({
    queryKey: ["proyecto", id],
    queryFn: () => fetch(`/api/proyectos/${id}`).then((r) => r.json()),
  });

  const { data: specsList = [] } = useQuery<SpecMeta[]>({
    queryKey: ["specs", id],
    queryFn: () => fetch(`/api/proyectos/${id}/specs`).then((r) => r.json()),
  });

  const { data: selectedSpec } = useQuery<Spec>({
    queryKey: ["spec", selectedId],
    queryFn: () => fetch(`/api/specs/${selectedId}`).then((r) => r.json()),
    enabled: !!selectedId,
  });

  const { data: procesos = [] } = useQuery<Proceso[]>({
    queryKey: ["procesos", id],
    queryFn: () => fetch(`/api/proyectos/${id}/procesos`).then((r) => r.json()),
  });

  const { data: personas = [] } = useQuery<Persona[]>({
    queryKey: ["personas", id],
    queryFn: () => fetch(`/api/proyectos/${id}/personas`).then((r) => r.json()),
  });

  const { data: requisitos = [] } = useQuery<Requisito[]>({
    queryKey: ["requisitos", id],
    queryFn: () => fetch(`/api/proyectos/${id}/requisitos`).then((r) => r.json()),
  });

  const { data: diagramas = [] } = useQuery<Diagrama[]>({
    queryKey: ["diagramas", id],
    queryFn: () => fetch(`/api/proyectos/${id}/diagramas`).then((r) => r.json()),
  });

  const { data: resultados = [] } = useQuery<ResultadoRecabacion[]>({
    queryKey: ["resultados", id],
    queryFn: () => fetch(`/api/proyectos/${id}/resultados`).then((r) => r.json()),
  });

  useEffect(() => {
    if (selectedSpec) {
      setRawContent(selectedSpec.contenido);
      setNameValue(selectedSpec.nombre);
      setDirty(false);
      setRawEdit(false);
    }
  }, [selectedSpec?.id]);

  const saveMutation = useMutation({
    mutationFn: (data: { contenido?: string; nombre?: string }) =>
      fetch(`/api/specs/${selectedId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["specs", id] });
      queryClient.invalidateQueries({ queryKey: ["spec", selectedId] });
      setDirty(false);
      setEditingName(false);
      setRawEdit(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (specId: string) =>
      fetch(`/api/specs/${specId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["specs", id] });
      setSelectedId(null);
    },
  });

  function handleCopy() {
    if (!selectedSpec) return;
    navigator.clipboard.writeText(rawContent || selectedSpec.contenido);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    if (!selectedSpec) return;
    const blob = new Blob([rawContent || selectedSpec.contenido], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedSpec.nombre.replace(/\s+/g, "-").toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleGenerated(spec: Spec) {
    queryClient.invalidateQueries({ queryKey: ["specs", id] });
    setShowGenerate(false);
    setSelectedId(spec.id);
  }

  const content = rawContent || selectedSpec?.contenido || "";

  return (
    <div className="flex h-[calc(100vh-140px)] gap-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* ── Sidebar ── */}
      <aside className="w-64 flex-shrink-0 border-r border-slate-200 flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <span className="text-sm font-semibold text-slate-700">Specs</span>
          <button
            onClick={() => setShowGenerate(true)}
            className="flex items-center gap-1 text-xs bg-violet-600 text-white px-2 py-1 rounded-lg hover:bg-violet-700"
          >
            <HiOutlineLightningBolt className="h-3.5 w-3.5" />
            Generar
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {specsList.length === 0 && (
            <div className="px-4 py-8 text-center">
              <HiOutlineDocumentText className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-400">
                Genera tu primer Feature Spec desde los datos del proyecto.
              </p>
            </div>
          )}
          {specsList.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedId(s.id)}
              className={`w-full text-left px-4 py-2.5 hover:bg-slate-50 transition ${
                selectedId === s.id ? "bg-violet-50 border-r-2 border-violet-600" : ""
              }`}
            >
              <p className="text-sm text-slate-800 truncate font-medium">{s.nombre}</p>
              {s.descripcion && (
                <p className="text-xs text-slate-500 truncate mt-0.5">{s.descripcion}</p>
              )}
              <p className="text-[10px] text-slate-400 mt-1">
                {new Date(s.actualizado_en).toLocaleDateString("es-MX")}
              </p>
            </button>
          ))}
        </div>
      </aside>

      {/* ── Content ── */}
      {!selectedSpec ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400">
          <HiOutlineDocumentText className="h-12 w-12 text-slate-200" />
          <p className="text-sm">Selecciona un spec o genera uno nuevo</p>
          <button
            onClick={() => setShowGenerate(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700"
          >
            <HiOutlineLightningBolt className="h-4 w-4" />
            Generar Feature Spec
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-200 bg-slate-50">
            {editingName ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  className="border border-slate-300 rounded px-2 py-1 text-sm flex-1 max-w-xs"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter")
                      saveMutation.mutate({ nombre: nameValue, contenido: rawContent });
                    if (e.key === "Escape") setEditingName(false);
                  }}
                />
                <button
                  onClick={() => saveMutation.mutate({ nombre: nameValue, contenido: rawContent })}
                  className="text-emerald-600 hover:text-emerald-700"
                >
                  <HiCheck className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setEditingName(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <HiX className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-1">
                <h2 className="text-sm font-semibold text-slate-800">{selectedSpec.nombre}</h2>
                <button
                  onClick={() => setEditingName(true)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <HiOutlinePencil className="h-4 w-4" />
                </button>
              </div>
            )}

            <div className="flex items-center gap-1 ml-auto">
              {/* View toggle */}
              <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xs">
                <button
                  onClick={() => setView("preview")}
                  className={`px-3 py-1.5 flex items-center gap-1 ${
                    view === "preview"
                      ? "bg-violet-600 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <HiOutlineEye className="h-3.5 w-3.5" />
                  Preview
                </button>
                <button
                  onClick={() => setView("raw")}
                  className={`px-3 py-1.5 flex items-center gap-1 ${
                    view === "raw"
                      ? "bg-violet-600 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <HiOutlineCode className="h-3.5 w-3.5" />
                  Markdown
                </button>
              </div>

              <button
                onClick={handleCopy}
                title="Copiar markdown"
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
              >
                <HiOutlineClipboardCopy className="h-3.5 w-3.5" />
                {copied ? "¡Copiado!" : "Copiar"}
              </button>

              <button
                onClick={handleDownload}
                title="Descargar como .md"
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
              >
                <HiOutlineDownload className="h-3.5 w-3.5" />
                .md
              </button>

              {dirty && (
                <button
                  onClick={() => saveMutation.mutate({ contenido: rawContent })}
                  disabled={saveMutation.isPending}
                  className="text-xs px-3 py-1.5 rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50"
                >
                  {saveMutation.isPending ? "Guardando..." : "Guardar *"}
                </button>
              )}

              <button
                onClick={() => {
                  if (confirm(`¿Eliminar "${selectedSpec.nombre}"?`))
                    deleteMutation.mutate(selectedSpec.id);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50"
              >
                <HiOutlineTrash className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Content area */}
          {view === "preview" ? (
            <div className="flex-1 overflow-auto px-8 py-6">
              <div className="prose prose-slate prose-sm max-w-none">
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-3 py-1.5 text-xs text-slate-500 border-b border-slate-100 bg-slate-50">
                <span>Edición directa del markdown</span>
                {dirty && (
                  <span className="text-amber-600 font-medium">Sin guardar</span>
                )}
              </div>
              <textarea
                value={rawContent}
                onChange={(e) => {
                  setRawContent(e.target.value);
                  setDirty(true);
                }}
                spellCheck={false}
                className="flex-1 font-mono text-sm p-4 resize-none outline-none text-slate-100 bg-slate-950"
              />
            </div>
          )}
        </div>
      )}

      {showGenerate && proyecto && (
        <GenerateDialog
          proyectoId={id}
          proyecto={proyecto}
          procesos={procesos}
          personas={personas}
          requisitos={requisitos}
          diagramas={diagramas}
          resultados={resultados}
          onClose={() => setShowGenerate(false)}
          onGenerated={handleGenerated}
        />
      )}
    </div>
  );
}

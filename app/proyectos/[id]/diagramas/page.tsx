"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import {
  HiPlus,
  HiOutlineTrash,
  HiOutlinePencil,
  HiCheck,
  HiX,
  HiOutlineRefresh,
  HiOutlineCode,
  HiOutlineEye,
} from "react-icons/hi";

// ── Types ─────────────────────────────────────────────────────────────────────

type TipoDiagrama = "PAQUETES" | "CLASES" | "CASOS_USO" | "SECUENCIA";

interface Diagrama {
  id: string;
  tipo: TipoDiagrama;
  nombre: string;
  contenido: string;
  creado_en: string;
  actualizado_en: string;
}

interface Subproceso {
  id: string;
  nombre: string;
  subproceso_tecnicas: { tecnica: { nombre: string } }[];
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
}

// ── Mermaid Renderer ──────────────────────────────────────────────────────────

function MermaidRenderer({ code }: { code: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ref.current || !code.trim()) return;

    let cancelled = false;

    async function render() {
      const mermaid = (await import("mermaid")).default;
      mermaid.initialize({
        startOnLoad: false,
        theme: "default",
        securityLevel: "loose",
        fontFamily: "Inter, system-ui, sans-serif",
      });

      try {
        const id = `mermaid-${Math.random().toString(36).slice(2)}`;
        const { svg } = await mermaid.render(id, code);
        if (!cancelled && ref.current) {
          ref.current.innerHTML = svg;
          setError(null);
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Error al renderizar");
        }
      }
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [code]);

  if (!code.trim()) {
    return (
      <div className="flex h-full items-center justify-center text-slate-400 text-sm">
        El diagrama aparecerá aquí cuando escribas código Mermaid
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-600 text-sm font-mono whitespace-pre-wrap bg-red-50 rounded-lg">
        {error}
      </div>
    );
  }

  return <div ref={ref} className="flex justify-center items-start p-4 overflow-auto" />;
}

// ── Auto-generation helpers ───────────────────────────────────────────────────

function generarPaquetes(procesos: Proceso[], proyecto: { nombre: string }): string {
  if (!procesos.length) {
    return `graph TD\n    A["${proyecto.nombre}"]`;
  }
  const lines: string[] = ["graph TD"];
  procesos.forEach((proc) => {
    const pid = `P_${proc.id.slice(0, 6)}`;
    lines.push(`    subgraph ${pid}["📦 ${proc.nombre}"]`);
    proc.subprocesos.forEach((sub) => {
      const sid = `S_${sub.id.slice(0, 6)}`;
      lines.push(`        ${sid}["${sub.nombre}"]`);
    });
    lines.push("    end");
  });
  return lines.join("\n");
}

function generarClases(procesos: Proceso[], personas: Persona[]): string {
  const lines: string[] = ["classDiagram"];

  // One class per proceso with subprocesos as methods
  procesos.forEach((proc) => {
    const className = proc.nombre.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");
    lines.push(`    class ${className} {`);
    proc.subprocesos.forEach((sub) => {
      const method = sub.nombre.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");
      lines.push(`        +ejecutar${method}()`);
    });
    lines.push("    }");
  });

  // One class per unique role
  const roles = [...new Set(personas.map((p) => p.rol.nombre))];
  roles.forEach((rol) => {
    const className = rol.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");
    lines.push(`    class ${className} {`);
    lines.push(`        +nombre: String`);
    lines.push("    }");
  });

  // Relationships: roles use procesos
  roles.forEach((rol) => {
    const rc = rol.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");
    procesos.forEach((proc) => {
      const pc = proc.nombre.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");
      lines.push(`    ${rc} --> ${pc} : participa`);
    });
  });

  return lines.join("\n");
}

function generarCasosUso(personas: Persona[], requisitos: Requisito[]): string {
  const lines: string[] = ["graph LR"];

  // Actors (unique roles)
  const roles = [...new Map(personas.map((p) => [p.rol.nombre, p.rol])).values()];
  roles.forEach((rol, i) => {
    const rid = `Actor${i}`;
    lines.push(`    ${rid}(["👤 ${rol.nombre}"])`);
  });

  // Use cases from requisitos
  requisitos.slice(0, 12).forEach((req, i) => {
    const uid = `UC${i}`;
    const label = req.nombre.length > 35 ? req.nombre.slice(0, 32) + "..." : req.nombre;
    lines.push(`    ${uid}(("${req.codigo || `UC-${i + 1}`}: ${label}"))`);
  });

  // Each actor → each use case
  roles.forEach((_rol, ri) => {
    requisitos.slice(0, 12).forEach((_req, ui) => {
      lines.push(`    Actor${ri} --> UC${ui}`);
    });
  });

  return lines.join("\n");
}

function generarSecuencia(subproceso: Subproceso, personas: Persona[]): string {
  const lines: string[] = ["sequenceDiagram"];

  const actores = personas.slice(0, 4);
  actores.forEach((p) => {
    const alias = p.nombre_completo.split(" ")[0];
    lines.push(`    participant ${alias} as ${p.nombre_completo}`);
  });
  lines.push("    participant Sistema");

  subproceso.subproceso_tecnicas.forEach((st, i) => {
    const from = actores[i % actores.length]?.nombre_completo.split(" ")[0] || "Actor";
    lines.push(`    ${from}->>Sistema: ${st.tecnica.nombre}`);
    lines.push(`    Sistema-->>${ from}: Confirmación`);
  });

  if (!subproceso.subproceso_tecnicas.length) {
    const first = actores[0]?.nombre_completo.split(" ")[0] || "Actor";
    lines.push(`    ${first}->>Sistema: Iniciar ${subproceso.nombre}`);
    lines.push(`    Sistema-->>${first}: OK`);
  }

  return lines.join("\n");
}

// ── Diagram Sidebar Item ──────────────────────────────────────────────────────

const TIPO_LABELS: Record<TipoDiagrama, string> = {
  PAQUETES: "Paquetes",
  CLASES: "Clases",
  CASOS_USO: "Casos de Uso",
  SECUENCIA: "Secuencia",
};

const TIPO_COLORS: Record<TipoDiagrama, string> = {
  PAQUETES: "bg-violet-100 text-violet-700",
  CLASES: "bg-blue-100 text-blue-700",
  CASOS_USO: "bg-emerald-100 text-emerald-700",
  SECUENCIA: "bg-amber-100 text-amber-700",
};

// ── Create Dialog ─────────────────────────────────────────────────────────────

interface CreateDialogProps {
  proyectoId: string;
  diagramas: Diagrama[];
  procesos: Proceso[];
  onClose: () => void;
  onCreated: (d: Diagrama) => void;
}

function CreateDialog({ proyectoId, diagramas, procesos, onClose, onCreated }: CreateDialogProps) {
  const [tipo, setTipo] = useState<TipoDiagrama>("SECUENCIA");
  const [nombre, setNombre] = useState("");
  const [subprocesoId, setSubprocesoId] = useState("");
  const [saving, setSaving] = useState(false);

  const tiposUnicos: TipoDiagrama[] = ["PAQUETES", "CLASES", "CASOS_USO"];
  const tiposExistentes = new Set(diagramas.map((d) => d.tipo));

  const allSubprocesos = procesos.flatMap((p) =>
    p.subprocesos.map((s) => ({ ...s, procesoNombre: p.nombre }))
  );

  const tiposDisponibles = [
    ...tiposUnicos.filter((t) => !tiposExistentes.has(t)),
    "SECUENCIA" as TipoDiagrama,
  ];

  async function handleCreate() {
    if (!nombre.trim()) return;
    if (tipo === "SECUENCIA" && !subprocesoId) return;
    setSaving(true);
    const res = await fetch(`/api/proyectos/${proyectoId}/diagramas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo, nombre: nombre.trim(), contenido: "" }),
    });
    const d = await res.json();
    setSaving(false);
    onCreated(d);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Nuevo diagrama</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <HiX className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoDiagrama)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            >
              {tiposDisponibles.map((t) => (
                <option key={t} value={t}>
                  {TIPO_LABELS[t]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder={
                tipo === "SECUENCIA"
                  ? "Ej: Flujo de login"
                  : `Diagrama de ${TIPO_LABELS[tipo]}`
              }
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          {tipo === "SECUENCIA" && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Subproceso base (opcional)
              </label>
              <select
                value={subprocesoId}
                onChange={(e) => setSubprocesoId(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">— Sin subproceso —</option>
                {allSubprocesos.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.procesoNombre} / {s.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            Cancelar
          </button>
          <button
            onClick={handleCreate}
            disabled={saving || !nombre.trim()}
            className="px-4 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
          >
            {saving ? "Creando..." : "Crear"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function DiagramasPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [code, setCode] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [view, setView] = useState<"split" | "code" | "preview">("split");
  const [dirty, setDirty] = useState(false);

  const { data: proyecto } = useQuery<{ id: string; nombre: string }>({
    queryKey: ["proyecto", id],
    queryFn: () => fetch(`/api/proyectos/${id}`).then((r) => r.json()),
  });

  const { data: diagramas = [] } = useQuery<Diagrama[]>({
    queryKey: ["diagramas", id],
    queryFn: () => fetch(`/api/proyectos/${id}/diagramas`).then((r) => r.json()),
  });

  const { data: procesos = [] } = useQuery<Proceso[]>({
    queryKey: ["procesos", id],
    queryFn: () =>
      fetch(`/api/proyectos/${id}/procesos`).then((r) => r.json()),
  });

  const { data: personas = [] } = useQuery<Persona[]>({
    queryKey: ["personas", id],
    queryFn: () => fetch(`/api/proyectos/${id}/personas`).then((r) => r.json()),
  });

  const { data: requisitos = [] } = useQuery<Requisito[]>({
    queryKey: ["requisitos", id],
    queryFn: () => fetch(`/api/proyectos/${id}/requisitos`).then((r) => r.json()),
  });

  const selected = diagramas.find((d) => d.id === selectedId) ?? null;

  // Sync code when selected diagram changes
  useEffect(() => {
    if (selected) {
      setCode(selected.contenido);
      setNameValue(selected.nombre);
      setDirty(false);
    }
  }, [selected?.id]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: ({ diagramaId, contenido, nombre }: { diagramaId: string; contenido: string; nombre?: string }) =>
      fetch(`/api/diagramas/${diagramaId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contenido, ...(nombre !== undefined && { nombre }) }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diagramas", id] });
      setDirty(false);
      setEditingName(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (diagramaId: string) =>
      fetch(`/api/diagramas/${diagramaId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diagramas", id] });
      setSelectedId(null);
    },
  });

  function handleAutoGenerate() {
    if (!selected) return;
    let generated = "";
    const allSubprocesos = procesos.flatMap((p) => p.subprocesos);

    switch (selected.tipo) {
      case "PAQUETES":
        generated = generarPaquetes(procesos, proyecto || { nombre: "Proyecto" });
        break;
      case "CLASES":
        generated = generarClases(procesos, personas);
        break;
      case "CASOS_USO":
        generated = generarCasosUso(personas, requisitos);
        break;
      case "SECUENCIA": {
        const sub = allSubprocesos[0];
        if (sub) generated = generarSecuencia(sub, personas);
        else generated = "sequenceDiagram\n    Actor->>Sistema: Acción\n    Sistema-->>Actor: Respuesta";
        break;
      }
    }
    setCode(generated);
    setDirty(true);
  }

  function handleSave() {
    if (!selected) return;
    saveMutation.mutate({ diagramaId: selected.id, contenido: code });
  }

  function handleSaveName() {
    if (!selected || !nameValue.trim()) return;
    saveMutation.mutate({ diagramaId: selected.id, contenido: code, nombre: nameValue.trim() });
  }

  function handleCreated(d: Diagrama) {
    queryClient.invalidateQueries({ queryKey: ["diagramas", id] });
    setShowCreate(false);
    setSelectedId(d.id);
  }

  const tiposUnicos = new Set(diagramas.filter((d) => d.tipo !== "SECUENCIA").map((d) => d.tipo));
  const canCreate =
    tiposUnicos.size < 3 ||
    true; // SECUENCIA is always allowed

  return (
    <div className="flex h-[calc(100vh-140px)] gap-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* ── Sidebar ── */}
      <aside className="w-64 flex-shrink-0 border-r border-slate-200 flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <span className="text-sm font-semibold text-slate-700">Diagramas</span>
          {canCreate && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1 text-xs bg-violet-600 text-white px-2 py-1 rounded-lg hover:bg-violet-700"
            >
              <HiPlus className="h-3.5 w-3.5" />
              Nuevo
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {diagramas.length === 0 && (
            <p className="px-4 py-6 text-xs text-slate-400 text-center">
              No hay diagramas aún. Crea uno para comenzar.
            </p>
          )}
          {diagramas.map((d) => (
            <button
              key={d.id}
              onClick={() => setSelectedId(d.id)}
              className={`w-full text-left px-4 py-2.5 hover:bg-slate-50 transition ${
                selectedId === d.id ? "bg-violet-50 border-r-2 border-violet-600" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${TIPO_COLORS[d.tipo]}`}
                >
                  {TIPO_LABELS[d.tipo]}
                </span>
              </div>
              <p className="text-sm text-slate-800 mt-0.5 truncate">{d.nombre}</p>
            </button>
          ))}
        </div>
      </aside>

      {/* ── Editor Area ── */}
      {!selected ? (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
          Selecciona un diagrama o crea uno nuevo
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
                    if (e.key === "Enter") handleSaveName();
                    if (e.key === "Escape") setEditingName(false);
                  }}
                />
                <button onClick={handleSaveName} className="text-emerald-600 hover:text-emerald-700">
                  <HiCheck className="h-4 w-4" />
                </button>
                <button onClick={() => setEditingName(false)} className="text-slate-400 hover:text-slate-600">
                  <HiX className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-1">
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded ${TIPO_COLORS[selected.tipo]}`}
                >
                  {TIPO_LABELS[selected.tipo]}
                </span>
                <h2 className="text-sm font-semibold text-slate-800">{selected.nombre}</h2>
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
                {(["split", "code", "preview"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={`px-3 py-1.5 flex items-center gap-1 ${
                      view === v
                        ? "bg-violet-600 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {v === "split" && (
                      <>
                        <HiOutlineCode className="h-3.5 w-3.5" />
                        <HiOutlineEye className="h-3.5 w-3.5" />
                      </>
                    )}
                    {v === "code" && <HiOutlineCode className="h-3.5 w-3.5" />}
                    {v === "preview" && <HiOutlineEye className="h-3.5 w-3.5" />}
                  </button>
                ))}
              </div>

              <button
                onClick={handleAutoGenerate}
                title="Auto-generar desde datos del proyecto"
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
              >
                <HiOutlineRefresh className="h-3.5 w-3.5" />
                Auto-generar
              </button>

              <button
                onClick={handleSave}
                disabled={!dirty || saveMutation.isPending}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-40"
              >
                {saveMutation.isPending ? "Guardando..." : dirty ? "Guardar *" : "Guardado"}
              </button>

              <button
                onClick={() => {
                  if (confirm(`¿Eliminar "${selected.nombre}"?`)) {
                    deleteMutation.mutate(selected.id);
                  }
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50"
              >
                <HiOutlineTrash className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Editor + Preview */}
          <div className="flex-1 flex overflow-hidden">
            {(view === "split" || view === "code") && (
              <div
                className={`flex flex-col ${
                  view === "split" ? "w-1/2 border-r border-slate-200" : "flex-1"
                }`}
              >
                <div className="px-3 py-1.5 text-xs font-medium text-slate-500 border-b border-slate-100 bg-slate-50">
                  Código Mermaid
                </div>
                <textarea
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    setDirty(true);
                  }}
                  spellCheck={false}
                  className="flex-1 font-mono text-sm p-4 resize-none outline-none text-slate-800 bg-slate-950 text-slate-100"
                  placeholder={`Escribe código Mermaid aquí...\n\nEj:\ngraph TD\n    A --> B`}
                />
              </div>
            )}

            {(view === "split" || view === "preview") && (
              <div
                className={`flex flex-col overflow-hidden ${
                  view === "split" ? "w-1/2" : "flex-1"
                }`}
              >
                <div className="px-3 py-1.5 text-xs font-medium text-slate-500 border-b border-slate-100 bg-slate-50">
                  Vista previa
                </div>
                <div className="flex-1 overflow-auto">
                  <MermaidRenderer code={code} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showCreate && (
        <CreateDialog
          proyectoId={id}
          diagramas={diagramas}
          procesos={procesos}
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  HiPlus,
  HiTrash,
  HiPencil,
  HiChevronDown,
  HiChevronRight,
  HiX,
  HiCheck,
  HiCalendar,
  HiDocumentText,
} from "react-icons/hi";

type EstadoSesion = "PENDIENTE" | "EN_CURSO" | "COMPLETADA" | "CANCELADA";

interface Tecnica { id: string; nombre: string }
interface Rol { id: string; nombre: string }
interface Persona { id: string; nombre_completo: string; correo: string | null; rol: Rol }
interface SubprocesoTecnica { tecnica: Tecnica }
interface SubprocesoConTecnicas { id: string; nombre: string; subproceso_tecnicas: SubprocesoTecnica[] }
interface ProcesoConSubprocesos { id: string; nombre: string; subprocesos: SubprocesoConTecnicas[] }

interface SesionParticipante {
  sesion_id: string;
  persona_id: string;
  persona: Persona;
}

interface Resultado {
  id: string;
  contenido: string;
  notas: string | null;
  creado_en: string;
  requisito_fuentes: { requisito: { id: string; nombre: string; codigo: string | null } }[];
}

interface Sesion {
  id: string;
  subproceso_id: string;
  tecnica_id: string;
  fecha: string;
  estado: EstadoSesion;
  notas: string | null;
  tecnica: Tecnica;
  subproceso: { id: string; nombre: string; proceso: { id: string; nombre: string } };
  participantes: SesionParticipante[];
  _count: { resultados: number };
}

const ESTADO_CONFIG: Record<EstadoSesion, { label: string; color: string }> = {
  PENDIENTE: { label: "Pendiente", color: "bg-slate-100 text-slate-600" },
  EN_CURSO: { label: "En curso", color: "bg-blue-100 text-blue-700" },
  COMPLETADA: { label: "Completada", color: "bg-green-100 text-green-700" },
  CANCELADA: { label: "Cancelada", color: "bg-red-100 text-red-600" },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function SessionCard({
  sesion,
  personas,
  proyectoId,
}: {
  sesion: Sesion;
  personas: Persona[];
  proyectoId: string;
}) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [selectedPersonaId, setSelectedPersonaId] = useState("");
  const [showAddResult, setShowAddResult] = useState(false);
  const [newResultContent, setNewResultContent] = useState("");
  const [newResultNotas, setNewResultNotas] = useState("");
  const [editingResultId, setEditingResultId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const { data: resultados = [] } = useQuery<Resultado[]>({
    queryKey: ["sesion", sesion.id, "resultados"],
    queryFn: () =>
      fetch(`/api/sesiones/${sesion.id}/resultados`).then((r) => r.json()),
    enabled: expanded,
  });

  const invalidateSesiones = () =>
    qc.invalidateQueries({ queryKey: ["sesiones", proyectoId] });
  const invalidateResultados = () =>
    qc.invalidateQueries({ queryKey: ["sesion", sesion.id, "resultados"] });
  const invalidateAll = () => {
    invalidateSesiones();
    invalidateResultados();
    qc.invalidateQueries({ queryKey: ["resultados", proyectoId] });
  };

  const updateEstado = useMutation({
    mutationFn: (estado: EstadoSesion) =>
      fetch(`/api/sesiones/${sesion.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado }),
      }),
    onSuccess: invalidateSesiones,
  });

  const deleteSesion = useMutation({
    mutationFn: () =>
      fetch(`/api/sesiones/${sesion.id}`, { method: "DELETE" }),
    onSuccess: invalidateAll,
  });

  const addParticipant = useMutation({
    mutationFn: (persona_id: string) =>
      fetch(`/api/sesiones/${sesion.id}/participantes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ persona_id }),
      }),
    onSuccess: () => {
      invalidateSesiones();
      setSelectedPersonaId("");
      setShowAddParticipant(false);
    },
  });

  const removeParticipant = useMutation({
    mutationFn: (persona_id: string) =>
      fetch(
        `/api/sesiones/${sesion.id}/participantes?persona_id=${persona_id}`,
        { method: "DELETE" }
      ),
    onSuccess: invalidateSesiones,
  });

  const addResult = useMutation({
    mutationFn: () =>
      fetch(`/api/sesiones/${sesion.id}/resultados`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contenido: newResultContent,
          notas: newResultNotas || undefined,
        }),
      }),
    onSuccess: () => {
      invalidateAll();
      setNewResultContent("");
      setNewResultNotas("");
      setShowAddResult(false);
    },
  });

  const updateResult = useMutation({
    mutationFn: ({ id, contenido }: { id: string; contenido: string }) =>
      fetch(`/api/resultados/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contenido }),
      }),
    onSuccess: () => {
      invalidateAll();
      setEditingResultId(null);
    },
  });

  const deleteResult = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/resultados/${id}`, { method: "DELETE" }),
    onSuccess: invalidateAll,
  });

  const participanteIds = new Set(sesion.participantes.map((p) => p.persona_id));
  const personasDisponibles = personas.filter((p) => !participanteIds.has(p.id));
  const estado = ESTADO_CONFIG[sesion.estado];

  return (
    <div className="border border-slate-200 rounded-lg bg-white overflow-hidden">
      {/* Summary row */}
      <div
        className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-slate-50 select-none"
        onClick={() => setExpanded((e) => !e)}
      >
        <span className="text-slate-400 shrink-0">
          {expanded ? (
            <HiChevronDown className="h-4 w-4" />
          ) : (
            <HiChevronRight className="h-4 w-4" />
          )}
        </span>
        <span className="text-sm font-medium text-slate-800 min-w-[140px]">
          {sesion.tecnica.nombre}
        </span>
        <span className="text-sm text-slate-500 flex items-center gap-1">
          <HiCalendar className="h-3.5 w-3.5" />
          {formatDate(sesion.fecha)}
        </span>
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full ${estado.color}`}
        >
          {estado.label}
        </span>
        <span className="ml-auto flex items-center gap-4 text-xs text-slate-400">
          <span>👥 {sesion.participantes.length}</span>
          <span>📝 {sesion._count.resultados}</span>
        </span>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-slate-100 px-4 py-4 bg-slate-50/40">
          {/* Controls row */}
          <div className="flex items-center gap-4 mb-5">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Estado:</span>
              <select
                value={sesion.estado}
                onChange={(e) =>
                  updateEstado.mutate(e.target.value as EstadoSesion)
                }
                className="text-xs border border-slate-200 rounded px-2 py-1 bg-white text-slate-700 focus:outline-none focus:border-violet-400"
              >
                {Object.entries(ESTADO_CONFIG).map(([val, cfg]) => (
                  <option key={val} value={val}>
                    {cfg.label}
                  </option>
                ))}
              </select>
            </div>
            {sesion.notas && (
              <p className="text-xs text-slate-400 italic">{sesion.notas}</p>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm("¿Eliminar esta sesión y todos sus datos?"))
                  deleteSesion.mutate();
              }}
              className="ml-auto text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
            >
              <HiTrash className="h-3.5 w-3.5" />
              Eliminar sesión
            </button>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Participants */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Participantes
                </h4>
                {!showAddParticipant && personasDisponibles.length > 0 && (
                  <button
                    onClick={() => setShowAddParticipant(true)}
                    className="text-xs text-violet-600 hover:text-violet-700 flex items-center gap-1"
                  >
                    <HiPlus className="h-3.5 w-3.5" />
                    Agregar
                  </button>
                )}
              </div>

              {sesion.participantes.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Sin participantes aún</p>
              ) : (
                <ul className="space-y-1.5 mb-2">
                  {sesion.participantes.map((p) => (
                    <li
                      key={p.persona_id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-slate-700">{p.persona.nombre_completo}</span>
                      <span className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">
                          {p.persona.rol.nombre}
                        </span>
                        <button
                          onClick={() => removeParticipant.mutate(p.persona_id)}
                          className="text-slate-300 hover:text-red-400"
                        >
                          <HiX className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {showAddParticipant && (
                <div className="flex items-center gap-2 mt-2">
                  <select
                    value={selectedPersonaId}
                    onChange={(e) => setSelectedPersonaId(e.target.value)}
                    className="flex-1 text-xs border border-slate-200 rounded px-2 py-1.5 bg-white focus:outline-none focus:border-violet-400"
                  >
                    <option value="">Seleccionar persona...</option>
                    {personasDisponibles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre_completo} ({p.rol.nombre})
                      </option>
                    ))}
                  </select>
                  <button
                    disabled={!selectedPersonaId || addParticipant.isPending}
                    onClick={() => addParticipant.mutate(selectedPersonaId)}
                    className="text-xs bg-violet-600 text-white px-2 py-1.5 rounded disabled:opacity-40 hover:bg-violet-700"
                  >
                    <HiCheck className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setShowAddParticipant(false);
                      setSelectedPersonaId("");
                    }}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <HiX className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Results */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Resultados
                </h4>
                {!showAddResult && (
                  <button
                    onClick={() => setShowAddResult(true)}
                    className="text-xs text-violet-600 hover:text-violet-700 flex items-center gap-1"
                  >
                    <HiPlus className="h-3.5 w-3.5" />
                    Agregar
                  </button>
                )}
              </div>

              {resultados.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Sin resultados aún</p>
              ) : (
                <ul className="space-y-2.5 mb-2">
                  {resultados.map((r, idx) => (
                    <li key={r.id}>
                      {editingResultId === r.id ? (
                        <div className="space-y-1.5">
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full text-xs border border-violet-200 rounded px-2 py-1.5 resize-none focus:outline-none focus:border-violet-400"
                            rows={3}
                          />
                          <div className="flex gap-1.5">
                            <button
                              disabled={updateResult.isPending}
                              onClick={() =>
                                updateResult.mutate({
                                  id: r.id,
                                  contenido: editContent,
                                })
                              }
                              className="text-xs bg-violet-600 text-white px-2.5 py-1 rounded hover:bg-violet-700"
                            >
                              Guardar
                            </button>
                            <button
                              onClick={() => setEditingResultId(null)}
                              className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2 group">
                          <span className="text-xs text-slate-400 mt-0.5 shrink-0">
                            {idx + 1}.
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-700 leading-relaxed">
                              {r.contenido}
                            </p>
                            {r.requisito_fuentes.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {r.requisito_fuentes.map((f) => (
                                  <span
                                    key={f.requisito.id}
                                    className="text-[10px] bg-violet-50 text-violet-600 border border-violet-100 px-1.5 py-0.5 rounded-full"
                                  >
                                    {f.requisito.codigo || f.requisito.nombre}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 shrink-0 mt-0.5">
                            <button
                              onClick={() => {
                                setEditingResultId(r.id);
                                setEditContent(r.contenido);
                              }}
                              className="text-slate-300 hover:text-violet-500"
                            >
                              <HiPencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm("¿Eliminar este resultado?"))
                                  deleteResult.mutate(r.id);
                              }}
                              className="text-slate-300 hover:text-red-400"
                            >
                              <HiTrash className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {showAddResult && (
                <div className="mt-2 space-y-1.5">
                  <textarea
                    value={newResultContent}
                    onChange={(e) => setNewResultContent(e.target.value)}
                    placeholder="Describe el resultado obtenido en esta sesión..."
                    className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 resize-none focus:outline-none focus:border-violet-400"
                    rows={3}
                    autoFocus
                  />
                  <input
                    value={newResultNotas}
                    onChange={(e) => setNewResultNotas(e.target.value)}
                    placeholder="Notas adicionales (opcional)"
                    className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:border-violet-400"
                  />
                  <div className="flex gap-1.5">
                    <button
                      disabled={!newResultContent.trim() || addResult.isPending}
                      onClick={() => addResult.mutate()}
                      className="text-xs bg-violet-600 text-white px-3 py-1.5 rounded disabled:opacity-40 hover:bg-violet-700"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={() => {
                        setShowAddResult(false);
                        setNewResultContent("");
                        setNewResultNotas("");
                      }}
                      className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1.5"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CreateSesionModal({
  procesos,
  proyectoId,
  onClose,
}: {
  procesos: ProcesoConSubprocesos[];
  proyectoId: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [procesoId, setProcesoId] = useState("");
  const [subprocesoId, setSubprocesoId] = useState("");
  const [tecnicaId, setTecnicaId] = useState("");
  const [fecha, setFecha] = useState("");
  const [notas, setNotas] = useState("");

  const proceso = procesos.find((p) => p.id === procesoId);
  const subproceso = proceso?.subprocesos.find((s) => s.id === subprocesoId);
  const tecnicasDisponibles =
    subproceso?.subproceso_tecnicas.map((st) => st.tecnica) ?? [];

  const create = useMutation({
    mutationFn: () =>
      fetch(`/api/subprocesos/${subprocesoId}/sesiones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tecnica_id: tecnicaId,
          fecha,
          notas: notas || undefined,
        }),
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sesiones", proyectoId] });
      onClose();
    },
  });

  const canSubmit = !!subprocesoId && !!tecnicaId && !!fecha;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-slate-900">Nueva sesión de recabación</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <HiX className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Proceso */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Proceso
            </label>
            <select
              value={procesoId}
              onChange={(e) => {
                setProcesoId(e.target.value);
                setSubprocesoId("");
                setTecnicaId("");
              }}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400"
            >
              <option value="">Seleccionar proceso...</option>
              {procesos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Subproceso */}
          {procesoId && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Subproceso
              </label>
              <select
                value={subprocesoId}
                onChange={(e) => {
                  setSubprocesoId(e.target.value);
                  setTecnicaId("");
                }}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400"
              >
                <option value="">Seleccionar subproceso...</option>
                {proceso?.subprocesos.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}{" "}
                    {s.subproceso_tecnicas.length === 0 ? "(sin técnicas)" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Técnica */}
          {subprocesoId && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Técnica de recabación
              </label>
              {tecnicasDisponibles.length === 0 ? (
                <p className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                  Este subproceso no tiene técnicas asignadas. Agrégalas en la
                  pestaña Procesos primero.
                </p>
              ) : (
                <select
                  value={tecnicaId}
                  onChange={(e) => setTecnicaId(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400"
                >
                  <option value="">Seleccionar técnica...</option>
                  {tecnicasDisponibles.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nombre}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Fecha */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Fecha de la sesión
            </label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400"
            />
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Notas (opcional)
            </label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={2}
              placeholder="Contexto o instrucciones para esta sesión..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-violet-400"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
          >
            Cancelar
          </button>
          <button
            disabled={!canSubmit || create.isPending}
            onClick={() => create.mutate()}
            className="px-4 py-2 text-sm bg-violet-600 text-white rounded-lg disabled:opacity-40 hover:bg-violet-700 transition"
          >
            {create.isPending ? "Creando..." : "Crear sesión"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SesionesPage() {
  const { id } = useParams<{ id: string }>();
  const [showCreate, setShowCreate] = useState(false);

  const { data: sesiones = [], isLoading } = useQuery<Sesion[]>({
    queryKey: ["sesiones", id],
    queryFn: () =>
      fetch(`/api/proyectos/${id}/sesiones`).then((r) => r.json()),
  });

  const { data: procesos = [] } = useQuery<ProcesoConSubprocesos[]>({
    queryKey: ["procesos", id],
    queryFn: () =>
      fetch(`/api/proyectos/${id}/procesos`).then((r) => r.json()),
  });

  const { data: personas = [] } = useQuery<Persona[]>({
    queryKey: ["personas", id],
    queryFn: () =>
      fetch(`/api/proyectos/${id}/personas`).then((r) => r.json()),
  });

  const grouped = useMemo(() => {
    const map = new Map<
      string,
      { procesoNombre: string; sesiones: Sesion[] }
    >();
    for (const s of sesiones) {
      const pid = s.subproceso.proceso.id;
      if (!map.has(pid)) {
        map.set(pid, {
          procesoNombre: s.subproceso.proceso.nombre,
          sesiones: [],
        });
      }
      map.get(pid)!.sesiones.push(s);
    }
    return [...map.values()];
  }, [sesiones]);

  const stats = useMemo(
    () => ({
      total: sesiones.length,
      pendiente: sesiones.filter((s) => s.estado === "PENDIENTE").length,
      enCurso: sesiones.filter((s) => s.estado === "EN_CURSO").length,
      completada: sesiones.filter((s) => s.estado === "COMPLETADA").length,
    }),
    [sesiones]
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Sesiones de Recabación
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Aplica técnicas a los subprocesos y registra los resultados
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-violet-700 transition"
        >
          <HiPlus className="h-4 w-4" />
          Nueva sesión
        </button>
      </div>

      {/* Stats */}
      {sesiones.length > 0 && (
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total", value: stats.total, color: "text-slate-700" },
            {
              label: "Pendientes",
              value: stats.pendiente,
              color: "text-slate-500",
            },
            {
              label: "En curso",
              value: stats.enCurso,
              color: "text-blue-600",
            },
            {
              label: "Completadas",
              value: stats.completada,
              color: "text-green-600",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white border border-slate-200 rounded-lg px-4 py-3 text-center"
            >
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <p className="text-sm text-slate-400 text-center py-10">
          Cargando sesiones...
        </p>
      ) : sesiones.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200 border-dashed">
          <HiDocumentText className="h-10 w-10 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Sin sesiones aún</p>
          <p className="text-sm text-slate-400 mt-1 mb-4">
            Crea la primera sesión para aplicar una técnica a un subproceso
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="text-sm text-violet-600 hover:text-violet-700 font-medium"
          >
            + Nueva sesión
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(({ procesoNombre, sesiones: items }) => (
            <div key={procesoNombre}>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">
                {procesoNombre}
              </p>
              <div className="space-y-2">
                {items.map((sesion) => (
                  <SessionCard
                    key={sesion.id}
                    sesion={sesion}
                    personas={personas}
                    proyectoId={id}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateSesionModal
          procesos={procesos}
          proyectoId={id}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}

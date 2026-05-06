"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  HiPlus,
  HiTrash,
  HiChevronDown,
  HiChevronRight,
  HiX,
  HiDocumentText,
  HiLink,
  HiLightningBolt,
} from "react-icons/hi";

type PrioridadRequisito = "ALTA" | "MEDIA" | "BAJA";
type EstadoRequisito = "PENDIENTE" | "VALIDADO" | "DESCARTADO";

interface SesionInfo {
  id: string;
  tecnica: { id: string; nombre: string };
  subproceso: { id: string; nombre: string; proceso: { id: string; nombre: string } };
}

interface ResultadoBase {
  id: string;
  contenido: string;
  sesion: SesionInfo;
}

interface ResultadoConFuentes extends ResultadoBase {
  requisito_fuentes: { requisito: { id: string } }[];
}

interface RequisitoFuente {
  requisito_id: string;
  resultado_id: string;
  resultado: ResultadoBase;
}

interface Requisito {
  id: string;
  codigo: string | null;
  nombre: string;
  descripcion: string | null;
  prioridad: PrioridadRequisito;
  estado: EstadoRequisito;
  creado_en: string;
  fuentes: RequisitoFuente[];
}

const PRIORIDAD_CONFIG: Record<
  PrioridadRequisito,
  { label: string; color: string }
> = {
  ALTA: { label: "Alta", color: "bg-red-100 text-red-700" },
  MEDIA: { label: "Media", color: "bg-amber-100 text-amber-700" },
  BAJA: { label: "Baja", color: "bg-green-100 text-green-700" },
};

const ESTADO_CONFIG: Record<EstadoRequisito, { label: string; color: string }> =
  {
    PENDIENTE: { label: "Pendiente", color: "bg-slate-100 text-slate-600" },
    VALIDADO: { label: "Validado", color: "bg-green-100 text-green-700" },
    DESCARTADO: { label: "Descartado", color: "bg-red-100 text-red-500" },
  };

function RequisitoCard({
  requisito,
  proyectoId,
  resultadosProyecto,
}: {
  requisito: Requisito;
  proyectoId: string;
  resultadosProyecto: ResultadoConFuentes[];
}) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["requisitos", proyectoId] });

  const updateRequisito = useMutation({
    mutationFn: (data: Partial<Pick<Requisito, "prioridad" | "estado">>) =>
      fetch(`/api/requisitos/${requisito.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: invalidate,
  });

  const deleteRequisito = useMutation({
    mutationFn: () =>
      fetch(`/api/requisitos/${requisito.id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });

  const unlinkFuente = useMutation({
    mutationFn: (resultado_id: string) =>
      fetch(
        `/api/requisitos/${requisito.id}/fuentes?resultado_id=${resultado_id}`,
        { method: "DELETE" }
      ),
    onSuccess: () => {
      invalidate();
      qc.invalidateQueries({ queryKey: ["resultados", proyectoId] });
    },
  });

  const linkFuente = useMutation({
    mutationFn: (resultado_id: string) =>
      fetch(`/api/requisitos/${requisito.id}/fuentes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resultado_id }),
      }),
    onSuccess: () => {
      invalidate();
      qc.invalidateQueries({ queryKey: ["resultados", proyectoId] });
      setShowLinkModal(false);
    },
  });

  const fuenteIds = new Set(requisito.fuentes.map((f) => f.resultado_id));
  const resultadosDisponibles = resultadosProyecto.filter(
    (r) => !fuenteIds.has(r.id)
  );

  const prioridad = PRIORIDAD_CONFIG[requisito.prioridad];
  const estado = ESTADO_CONFIG[requisito.estado];

  return (
    <>
      <div className="border border-slate-200 rounded-lg bg-white overflow-hidden">
        {/* Summary row */}
        <div
          className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 select-none"
          onClick={() => setExpanded((e) => !e)}
        >
          <span className="text-slate-400 shrink-0">
            {expanded ? (
              <HiChevronDown className="h-4 w-4" />
            ) : (
              <HiChevronRight className="h-4 w-4" />
            )}
          </span>
          <span className="text-xs font-mono text-slate-400 w-20 shrink-0">
            {requisito.codigo || "—"}
          </span>
          <span className="text-sm font-medium text-slate-800 flex-1 min-w-0 truncate">
            {requisito.nombre}
          </span>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${prioridad.color}`}
          >
            {prioridad.label}
          </span>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${estado.color}`}
          >
            {estado.label}
          </span>
          <span className="text-xs text-slate-400 shrink-0">
            {requisito.fuentes.length}{" "}
            {requisito.fuentes.length === 1 ? "fuente" : "fuentes"}
          </span>
        </div>

        {/* Expanded content */}
        {expanded && (
          <div className="border-t border-slate-100 px-4 py-4 bg-slate-50/40">
            {/* Controls */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Prioridad:</span>
                <select
                  value={requisito.prioridad}
                  onChange={(e) =>
                    updateRequisito.mutate({
                      prioridad: e.target.value as PrioridadRequisito,
                    })
                  }
                  className="text-xs border border-slate-200 rounded px-2 py-1 bg-white text-slate-700 focus:outline-none focus:border-violet-400"
                >
                  {Object.entries(PRIORIDAD_CONFIG).map(([val, cfg]) => (
                    <option key={val} value={val}>
                      {cfg.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Estado:</span>
                <select
                  value={requisito.estado}
                  onChange={(e) =>
                    updateRequisito.mutate({
                      estado: e.target.value as EstadoRequisito,
                    })
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
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm("¿Eliminar este requisito?"))
                    deleteRequisito.mutate();
                }}
                className="ml-auto text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
              >
                <HiTrash className="h-3.5 w-3.5" />
                Eliminar
              </button>
            </div>

            {/* Description */}
            {requisito.descripcion && (
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                {requisito.descripcion}
              </p>
            )}

            {/* Fuentes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Trazabilidad
                </h4>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowLinkModal(true);
                  }}
                  className="text-xs text-violet-600 hover:text-violet-700 flex items-center gap-1"
                >
                  <HiLink className="h-3.5 w-3.5" />
                  Vincular resultado
                </button>
              </div>

              {requisito.fuentes.length === 0 ? (
                <p className="text-xs text-slate-400 italic">
                  Sin resultados vinculados. Vincúlalos desde las sesiones de
                  recabación.
                </p>
              ) : (
                <ul className="space-y-2">
                  {requisito.fuentes.map((f) => (
                    <li
                      key={f.resultado_id}
                      className="flex gap-3 bg-white border border-slate-100 rounded-lg px-3 py-2.5 group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-medium text-violet-600">
                            {f.resultado.sesion.tecnica.nombre}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {f.resultado.sesion.subproceso.proceso.nombre} /{" "}
                            {f.resultado.sesion.subproceso.nombre}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed line-clamp-2">
                          {f.resultado.contenido}
                        </p>
                      </div>
                      <button
                        onClick={() => unlinkFuente.mutate(f.resultado_id)}
                        className="text-slate-200 hover:text-red-400 opacity-0 group-hover:opacity-100 shrink-0 mt-0.5"
                        title="Desvincular"
                      >
                        <HiX className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Link result modal */}
      {showLinkModal && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
          onClick={() => setShowLinkModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Vincular resultado
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {requisito.codigo || requisito.nombre}
                </p>
              </div>
              <button
                onClick={() => setShowLinkModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <HiX className="h-5 w-5" />
              </button>
            </div>

            {resultadosDisponibles.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-sm text-slate-500">
                  No hay resultados disponibles para vincular.
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Registra resultados en las sesiones de recabación primero.
                </p>
              </div>
            ) : (
              <ul className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {resultadosDisponibles.map((r) => (
                  <li key={r.id}>
                    <button
                      onClick={() => linkFuente.mutate(r.id)}
                      disabled={linkFuente.isPending}
                      className="w-full text-left px-3 py-2.5 rounded-lg border border-slate-200 hover:border-violet-300 hover:bg-violet-50 transition disabled:opacity-50"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-medium text-violet-600">
                          {r.sesion.tecnica.nombre}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {r.sesion.subproceso.proceso.nombre} /{" "}
                          {r.sesion.subproceso.nombre}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 line-clamp-2">
                        {r.contenido}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function CreateRequisitoModal({
  proyectoId,
  onClose,
}: {
  proyectoId: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [prioridad, setPrioridad] = useState<PrioridadRequisito>("MEDIA");

  const create = useMutation({
    mutationFn: () =>
      fetch(`/api/proyectos/${proyectoId}/requisitos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, descripcion, prioridad }),
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["requisitos", proyectoId] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Nuevo requisito
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <HiX className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nombre *
            </label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="El sistema debe permitir..."
              autoFocus
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Descripción (opcional)
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={3}
              placeholder="Detalla el alcance o contexto del requisito..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-violet-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Prioridad
            </label>
            <select
              value={prioridad}
              onChange={(e) =>
                setPrioridad(e.target.value as PrioridadRequisito)
              }
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400"
            >
              <option value="ALTA">Alta</option>
              <option value="MEDIA">Media</option>
              <option value="BAJA">Baja</option>
            </select>
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
            disabled={!nombre.trim() || create.isPending}
            onClick={() => create.mutate()}
            className="px-4 py-2 text-sm bg-violet-600 text-white rounded-lg disabled:opacity-40 hover:bg-violet-700 transition"
          >
            {create.isPending ? "Creando..." : "Crear requisito"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Sección: Propuestas desde sesiones ──────────────────────────────────────

function PropuestaCard({
  resultado,
  proyectoId,
}: {
  resultado: ResultadoConFuentes;
  proyectoId: string;
}) {
  const qc = useQueryClient();
  const [nombre, setNombre] = useState(resultado.contenido.slice(0, 120));
  const [open, setOpen] = useState(false);
  const [prioridad, setPrioridad] = useState("MEDIA");

  const crear = useMutation({
    mutationFn: () =>
      fetch(`/api/sesiones/${resultado.sesion.id}/extraer-requisito`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contenido_resultado: resultado.contenido,
          nombre_requisito: nombre,
          prioridad,
        }),
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["requisitos", proyectoId] });
      qc.invalidateQueries({ queryKey: ["resultados", proyectoId] });
    },
  });

  return (
    <div className="border border-amber-200 bg-amber-50/40 rounded-lg px-4 py-3">
      <div className="flex items-start gap-3">
        <HiLightningBolt className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-medium text-violet-600">
              {resultado.sesion.tecnica.nombre}
            </span>
            <span className="text-[10px] text-slate-400">
              {resultado.sesion.subproceso.proceso.nombre} /{" "}
              {resultado.sesion.subproceso.nombre}
            </span>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed line-clamp-2">
            {resultado.contenido}
          </p>
        </div>
        <button
          onClick={() => setOpen((o) => !o)}
          className="shrink-0 text-xs text-amber-600 hover:text-amber-800 font-medium flex items-center gap-1 border border-amber-300 rounded-lg px-2.5 py-1.5 bg-white hover:bg-amber-50 transition"
        >
          <HiPlus className="h-3.5 w-3.5" />
          Crear requisito
        </button>
      </div>

      {open && (
        <div className="mt-3 ml-7 space-y-2 border-t border-amber-100 pt-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Nombre del requisito
            </label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              autoFocus
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-violet-400"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500">Prioridad:</label>
              <select
                value={prioridad}
                onChange={(e) => setPrioridad(e.target.value)}
                className="text-xs border border-slate-200 rounded px-2 py-1 bg-white focus:outline-none focus:border-violet-400"
              >
                <option value="ALTA">Alta</option>
                <option value="MEDIA">Media</option>
                <option value="BAJA">Baja</option>
              </select>
            </div>
            <div className="flex gap-2 ml-auto">
              <button
                onClick={() => setOpen(false)}
                className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1"
              >
                Cancelar
              </button>
              <button
                disabled={!nombre.trim() || crear.isPending}
                onClick={() => crear.mutate()}
                className="text-xs bg-violet-600 text-white px-3 py-1 rounded-lg disabled:opacity-40 hover:bg-violet-700"
              >
                {crear.isPending ? "Creando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function RequisitosPage() {
  const { id } = useParams<{ id: string }>();
  const [showCreate, setShowCreate] = useState(false);

  const { data: requisitos = [], isLoading } = useQuery<Requisito[]>({
    queryKey: ["requisitos", id],
    queryFn: () =>
      fetch(`/api/proyectos/${id}/requisitos`).then((r) => r.json()),
  });

  const { data: resultadosProyecto = [] } = useQuery<ResultadoConFuentes[]>({
    queryKey: ["resultados", id],
    queryFn: () =>
      fetch(`/api/proyectos/${id}/resultados`).then((r) => r.json()),
  });

  // Resultados sin ningún requisito vinculado = propuestas
  const propuestas = useMemo(
    () => resultadosProyecto.filter((r) => r.requisito_fuentes.length === 0),
    [resultadosProyecto]
  );

  const stats = useMemo(
    () => ({
      total: requisitos.length,
      pendiente: requisitos.filter((r) => r.estado === "PENDIENTE").length,
      validado: requisitos.filter((r) => r.estado === "VALIDADO").length,
      alta: requisitos.filter((r) => r.prioridad === "ALTA").length,
    }),
    [requisitos]
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Requisitos</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Gestiona los requisitos con trazabilidad completa hacia las sesiones
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-violet-700 transition"
        >
          <HiPlus className="h-4 w-4" />
          Nuevo requisito
        </button>
      </div>

      {/* Propuestas desde sesiones */}
      {propuestas.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <HiLightningBolt className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-slate-700">
              Propuestas desde sesiones
            </h3>
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
              {propuestas.length} sin convertir
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-3">
            Resultados registrados en sesiones que aún no tienen un requisito
            asociado.
          </p>
          <div className="space-y-2">
            {propuestas.map((r) => (
              <PropuestaCard key={r.id} resultado={r} proyectoId={id} />
            ))}
          </div>
          <div className="border-t border-slate-200 mt-6 mb-6" />
        </div>
      )}

      {/* Stats */}
      {requisitos.length > 0 && (
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total", value: stats.total, color: "text-slate-700" },
            { label: "Pendientes", value: stats.pendiente, color: "text-slate-500" },
            { label: "Validados", value: stats.validado, color: "text-green-600" },
            { label: "Prioridad Alta", value: stats.alta, color: "text-red-600" },
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

      {/* Lista de requisitos */}
      {isLoading ? (
        <p className="text-sm text-slate-400 text-center py-10">
          Cargando requisitos...
        </p>
      ) : requisitos.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200 border-dashed">
          <HiDocumentText className="h-10 w-10 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Sin requisitos aún</p>
          <p className="text-sm text-slate-400 mt-1 mb-4">
            Crea un requisito manualmente o convierte los resultados de tus
            sesiones usando el rayo ⚡
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="text-sm text-violet-600 hover:text-violet-700 font-medium"
          >
            + Nuevo requisito
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {requisitos.map((req) => (
            <RequisitoCard
              key={req.id}
              requisito={req}
              proyectoId={id}
              resultadosProyecto={resultadosProyecto}
            />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateRequisitoModal
          proyectoId={id}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}

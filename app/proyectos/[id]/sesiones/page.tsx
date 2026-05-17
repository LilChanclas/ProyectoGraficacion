"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  HiPlus, HiTrash, HiPencil, HiChevronDown, HiChevronRight,
  HiX, HiCheck, HiCalendar, HiDocumentText,
} from "react-icons/hi";

// ─── Types ────────────────────────────────────────────────────────────────────

type EstadoSesion = "PENDIENTE" | "EN_CURSO" | "COMPLETADA" | "CANCELADA";
type TipoMetodo =
  | "ENTREVISTA" | "CUESTIONARIO" | "OBSERVACION"
  | "HISTORIA_USUARIO" | "FOCUS_GROUP" | "DOCUMENTOS"
  | "SEGUIMIENTO_TRANSACCIONAL";

interface Rol { id: string; nombre: string }
interface Persona { id: string; nombre_completo: string; correo: string | null; rol: Rol }
interface Tecnica { id: string; nombre: string; tipo_metodo: TipoMetodo }
interface SubprocesoTecnica { tecnica: Tecnica }
interface SubprocesoConTecnicas { id: string; nombre: string; subproceso_tecnicas: SubprocesoTecnica[] }
interface ProcesoConSubprocesos { id: string; nombre: string; subprocesos: SubprocesoConTecnicas[] }
interface SesionParticipante { sesion_id: string; persona_id: string; persona: Persona }

interface RespuestaPregunta {
  id: string; pregunta_id: string; respuesta: string; creado_en: string;
  persona: Persona | null;
}
interface PreguntaSesion {
  id: string; texto: string; orden: number;
  respuestas: RespuestaPregunta[];
}
interface Resultado {
  id: string; contenido: string; notas: string | null; creado_en: string;
  requisito_fuentes: { requisito: { id: string; nombre: string; codigo: string | null } }[];
}
interface Sesion {
  id: string; subproceso_id: string; tecnica_id: string;
  fecha: string; estado: EstadoSesion; notas: string | null;
  tecnica: Tecnica;
  subproceso: { id: string; nombre: string; proceso: { id: string; nombre: string } };
  participantes: SesionParticipante[];
  _count: { resultados: number };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ESTADO_CONFIG: Record<EstadoSesion, { label: string; color: string }> = {
  PENDIENTE:  { label: "Pendiente",  color: "bg-slate-100 text-slate-600" },
  EN_CURSO:   { label: "En curso",   color: "bg-blue-100 text-blue-700"   },
  COMPLETADA: { label: "Completada", color: "bg-green-100 text-green-700" },
  CANCELADA:  { label: "Cancelada",  color: "bg-red-100 text-red-600"     },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("es-MX", { year: "numeric", month: "short", day: "numeric" });
}

// ─── Panel: Entrevista / Cuestionario ─────────────────────────────────────────

function EntrevistaPanel({
  sesion, proyectoId,
}: { sesion: Sesion; proyectoId: string }) {
  const qc = useQueryClient();
  const [nuevaTexto, setNuevaTexto] = useState("");
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editTexto, setEditTexto] = useState("");

  const { data: preguntas = [] } = useQuery<PreguntaSesion[]>({
    queryKey: ["sesion", sesion.id, "preguntas"],
    queryFn: () => fetch(`/api/sesiones/${sesion.id}/preguntas`).then((r) => r.json()),
  });

  const inv = () => qc.invalidateQueries({ queryKey: ["sesion", sesion.id, "preguntas"] });

  const addPregunta = useMutation({
    mutationFn: () =>
      fetch(`/api/sesiones/${sesion.id}/preguntas`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto: nuevaTexto }),
      }).then((r) => r.json()),
    onSuccess: () => { setNuevaTexto(""); inv(); },
  });

  const editPregunta = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/preguntas/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto: editTexto }),
      }),
    onSuccess: () => { setEditandoId(null); inv(); },
  });

  const delPregunta = useMutation({
    mutationFn: (id: string) => fetch(`/api/preguntas/${id}`, { method: "DELETE" }),
    onSuccess: inv,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {sesion.tecnica.tipo_metodo === "CUESTIONARIO" ? "Preguntas del cuestionario" : "Guía de preguntas"}
        </h4>
        <span className="text-xs text-slate-400">{preguntas.length} pregunta{preguntas.length !== 1 ? "s" : ""}</span>
      </div>

      {preguntas.length === 0 && (
        <p className="text-xs text-slate-400 italic mb-3">Agrega las preguntas de la {sesion.tecnica.nombre.toLowerCase()}.</p>
      )}

      <div className="space-y-3 mb-3">
        {preguntas.map((p, idx) => (
          <PreguntaItem
            key={p.id} pregunta={p} idx={idx}
            sesion={sesion} proyectoId={proyectoId}
            editandoId={editandoId} editTexto={editTexto}
            onStartEdit={(id, txt) => { setEditandoId(id); setEditTexto(txt); }}
            onSaveEdit={(id) => editPregunta.mutate(id)}
            onCancelEdit={() => setEditandoId(null)}
            onChangeEditTexto={setEditTexto}
            onDelete={(id) => { if (confirm("¿Eliminar pregunta y sus respuestas?")) delPregunta.mutate(id); }}
          />
        ))}
      </div>

      {/* Nueva pregunta */}
      <div className="flex gap-2">
        <input
          value={nuevaTexto} onChange={(e) => setNuevaTexto(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && nuevaTexto.trim()) addPregunta.mutate(); }}
          placeholder="Escribe una pregunta y presiona Enter..."
          className="flex-1 text-sm border border-dashed border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-violet-400 bg-slate-50/50"
        />
        <button
          disabled={!nuevaTexto.trim() || addPregunta.isPending}
          onClick={() => addPregunta.mutate()}
          className="text-xs bg-violet-600 text-white px-3 py-2 rounded-lg disabled:opacity-40 hover:bg-violet-700"
        >
          <HiPlus className="h-4 w-4" />
        </button>
      </div>

    </div>
  );
}

function PreguntaItem({
  pregunta, idx, sesion, proyectoId,
  editandoId, editTexto,
  onStartEdit, onSaveEdit, onCancelEdit, onChangeEditTexto,
  onDelete,
}: {
  pregunta: PreguntaSesion; idx: number; sesion: Sesion; proyectoId: string;
  editandoId: string | null; editTexto: string;
  onStartEdit: (id: string, txt: string) => void;
  onSaveEdit: (id: string) => void;
  onCancelEdit: () => void;
  onChangeEditTexto: (t: string) => void;
  onDelete: (id: string) => void;
}) {
  const qc = useQueryClient();
  const [showAddResp, setShowAddResp] = useState(false);
  const [respTexto, setRespTexto] = useState("");
  const [personaId, setPersonaId] = useState("");
  const [editRespId, setEditRespId] = useState<string | null>(null);
  const [editRespTexto, setEditRespTexto] = useState("");

  const inv = () => qc.invalidateQueries({ queryKey: ["sesion", sesion.id, "preguntas"] });

  const addResp = useMutation({
    mutationFn: () =>
      fetch(`/api/preguntas/${pregunta.id}/respuestas`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ respuesta: respTexto, persona_id: personaId || null }),
      }),
    onSuccess: () => { setRespTexto(""); setPersonaId(""); setShowAddResp(false); inv(); },
  });

  const editResp = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/respuestas/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ respuesta: editRespTexto }),
      }),
    onSuccess: () => { setEditRespId(null); inv(); },
  });

  const delResp = useMutation({
    mutationFn: (id: string) => fetch(`/api/respuestas/${id}`, { method: "DELETE" }),
    onSuccess: inv,
  });

  const isEditing = editandoId === pregunta.id;

  return (
    <div className="border border-slate-200 rounded-lg bg-white overflow-hidden">
      {/* Cabecera pregunta */}
      <div className="flex items-start gap-2 px-3 py-2.5 bg-slate-50/60">
        <span className="text-xs font-bold text-violet-500 mt-0.5 shrink-0 w-5">{idx + 1}.</span>
        {isEditing ? (
          <div className="flex flex-1 gap-2">
            <input
              value={editTexto} onChange={(e) => onChangeEditTexto(e.target.value)} autoFocus
              className="flex-1 text-sm border border-violet-200 rounded px-2 py-1 focus:outline-none focus:border-violet-400"
            />
            <button onClick={() => onSaveEdit(pregunta.id)} className="text-green-600"><HiCheck className="h-4 w-4" /></button>
            <button onClick={onCancelEdit} className="text-slate-400"><HiX className="h-4 w-4" /></button>
          </div>
        ) : (
          <>
            <span className="flex-1 text-sm font-medium text-slate-700">{pregunta.texto}</span>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => onStartEdit(pregunta.id, pregunta.texto)} className="text-slate-300 hover:text-violet-500 p-0.5">
                <HiPencil className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => onDelete(pregunta.id)} className="text-slate-300 hover:text-red-400 p-0.5">
                <HiTrash className="h-3.5 w-3.5" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Respuestas */}
      <div className="px-3 py-2 space-y-2">
        {pregunta.respuestas.length === 0 && !showAddResp && (
          <p className="text-xs text-slate-400 italic">Sin respuestas aún.</p>
        )}

        {pregunta.respuestas.map((r) => (
          <div key={r.id} className="group flex gap-2 items-start">
            <div className="shrink-0 w-1 h-1 rounded-full bg-violet-300 mt-2" />
            <div className="flex-1 min-w-0">
              {editRespId === r.id ? (
                <div className="flex gap-2">
                  <textarea
                    value={editRespTexto} onChange={(e) => setEditRespTexto(e.target.value)}
                    rows={2} autoFocus
                    className="flex-1 text-xs border border-violet-200 rounded px-2 py-1 resize-none focus:outline-none"
                  />
                  <div className="flex flex-col gap-1">
                    <button onClick={() => editResp.mutate(r.id)} className="text-green-600"><HiCheck className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setEditRespId(null)} className="text-slate-400"><HiX className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              ) : (
                <div>
                  {r.persona && (
                    <span className="text-[10px] font-semibold text-violet-600 mr-1.5">
                      {r.persona.nombre_completo}:
                    </span>
                  )}
                  <span className="text-xs text-slate-700">{r.respuesta}</span>
                </div>
              )}
            </div>
            {editRespId !== r.id && (
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 shrink-0">
                <button onClick={() => { setEditRespId(r.id); setEditRespTexto(r.respuesta); }} className="text-slate-300 hover:text-violet-500 p-0.5">
                  <HiPencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => delResp.mutate(r.id)} className="text-slate-300 hover:text-red-400 p-0.5">
                  <HiTrash className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Agregar respuesta */}
        {showAddResp ? (
          <div className="space-y-1.5 pt-1">
            <select
              value={personaId} onChange={(e) => setPersonaId(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 bg-white focus:outline-none focus:border-violet-400"
            >
              <option value="">Respuesta general (sin persona)</option>
              {sesion.participantes.map((p) => (
                <option key={p.persona_id} value={p.persona_id}>
                  {p.persona.nombre_completo} — {p.persona.rol.nombre}
                </option>
              ))}
            </select>
            <textarea
              value={respTexto} onChange={(e) => setRespTexto(e.target.value)}
              placeholder="Escribe la respuesta..." rows={5} autoFocus
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 resize-y focus:outline-none focus:border-violet-400"
            />
            <div className="flex gap-1.5">
              <button
                disabled={!respTexto.trim() || addResp.isPending}
                onClick={() => addResp.mutate()}
                className="text-xs bg-violet-600 text-white px-3 py-1.5 rounded disabled:opacity-40 hover:bg-violet-700"
              >
                Guardar
              </button>
              <button onClick={() => { setShowAddResp(false); setRespTexto(""); setPersonaId(""); }}
                className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1.5"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddResp(true)}
            className="text-xs text-violet-500 hover:text-violet-700 flex items-center gap-1 mt-1"
          >
            <HiPlus className="h-3 w-3" />
            {sesion.participantes.length > 0 ? "Agregar respuesta" : "Agregar respuesta (sin participantes asignados)"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Panel: Historia de Usuario ───────────────────────────────────────────────

type Prioridad = "ALTA" | "MEDIA" | "BAJA";

interface HUData {
  codigo: string;
  prioridad: Prioridad;
  como: string;
  quiero: string;
  para: string;
  criterios: string[];
}

function parseHU(contenido: string): HUData | null {
  try {
    const d = JSON.parse(contenido);
    if (d && typeof d.codigo === "string" && d.prioridad && d.como) return d as HUData;
  } catch { /* plain text fallback */ }
  return null;
}

const PRIORIDAD_LABEL: Record<Prioridad, string> = { ALTA: "Alta", MEDIA: "Media", BAJA: "Baja" };
const PRIORIDAD_COLOR: Record<Prioridad, string> = {
  ALTA:  "bg-red-100 text-red-700 border-red-200",
  MEDIA: "bg-amber-100 text-amber-700 border-amber-200",
  BAJA:  "bg-green-100 text-green-700 border-green-200",
};

function HUCard({ resultado, onDelete }: { resultado: Resultado; onDelete: () => void }) {
  const hu = parseHU(resultado.contenido);

  if (!hu) {
    return (
      <li className="group flex gap-2 items-start bg-white border border-slate-100 rounded-lg px-3 py-2.5">
        <p className="flex-1 text-xs text-slate-700 leading-relaxed italic">"{resultado.contenido}"</p>
        <button onClick={onDelete} className="text-slate-300 hover:text-red-400 opacity-0 group-hover:opacity-100 shrink-0">
          <HiTrash className="h-3.5 w-3.5" />
        </button>
      </li>
    );
  }

  return (
    <li className="group bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50/60 border-b border-slate-100">
        <span className="text-xs font-bold text-violet-700 font-mono">{hu.codigo}</span>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${PRIORIDAD_COLOR[hu.prioridad]}`}>
          Prioridad: {PRIORIDAD_LABEL[hu.prioridad]}
        </span>
        <button onClick={onDelete} className="ml-auto text-slate-300 hover:text-red-400 opacity-0 group-hover:opacity-100">
          <HiTrash className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="px-4 py-3 space-y-2">
        <p className="text-sm text-slate-700 leading-relaxed">
          <span className="font-medium text-slate-900">Como</span> {hu.como},{" "}
          <span className="font-medium text-slate-900">quiero</span> {hu.quiero},{" "}
          <span className="font-medium text-slate-900">para que</span> {hu.para}.
        </p>
        {hu.criterios.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Criterios de aceptación
            </p>
            <ol className="space-y-1">
              {hu.criterios.map((c, i) => (
                <li key={i} className="text-xs text-slate-600 flex gap-1.5">
                  <span className="text-slate-400 shrink-0">{i + 1}.</span>
                  <span>{c}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </li>
  );
}

function HistoriaUsuarioPanel({ sesion, proyectoId }: { sesion: Sesion; proyectoId: string }) {
  const qc = useQueryClient();
  const [prioridad, setPrioridad] = useState<Prioridad>("MEDIA");
  const [personaId, setPersonaId] = useState("");
  const [customComo, setCustomComo] = useState("");
  const [quiero, setQuiero] = useState("");
  const [para, setPara] = useState("");
  const [criterios, setCriterios] = useState<string[]>([""]);

  const { data: resultados = [] } = useQuery<Resultado[]>({
    queryKey: ["sesion", sesion.id, "resultados"],
    queryFn: () => fetch(`/api/sesiones/${sesion.id}/resultados`).then((r) => r.json()),
  });

  const nextCodigo = `HU-${String(resultados.length + 1).padStart(2, "0")}`;
  const hasParticipants = sesion.participantes.length > 0;
  const selectedParticipant = sesion.participantes.find((p) => p.persona_id === personaId);
  const comoValue = hasParticipants
    ? selectedParticipant
      ? `${selectedParticipant.persona.nombre_completo} (${selectedParticipant.persona.rol.nombre})`
      : ""
    : customComo;

  const addCriterio = () => setCriterios((prev) => [...prev, ""]);
  const updateCriterio = (i: number, val: string) =>
    setCriterios((prev) => prev.map((c, idx) => (idx === i ? val : c)));
  const removeCriterio = (i: number) =>
    setCriterios((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : [""]));

  const guardar = useMutation({
    mutationFn: () => {
      const hu: HUData = {
        codigo: nextCodigo,
        prioridad,
        como: comoValue,
        quiero: quiero.trim(),
        para: para.trim(),
        criterios: criterios.filter((c) => c.trim()),
      };
      return fetch(`/api/sesiones/${sesion.id}/resultados`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contenido: JSON.stringify(hu) }),
      }).then((r) => r.json());
    },
    onSuccess: () => {
      setPrioridad("MEDIA");
      setPersonaId("");
      setCustomComo("");
      setQuiero("");
      setPara("");
      setCriterios([""]);
      qc.invalidateQueries({ queryKey: ["sesion", sesion.id, "resultados"] });
      qc.invalidateQueries({ queryKey: ["sesiones", proyectoId] });
      qc.invalidateQueries({ queryKey: ["resultados", proyectoId] });
    },
  });

  const delResultado = useMutation({
    mutationFn: (id: string) => fetch(`/api/resultados/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sesion", sesion.id, "resultados"] });
      qc.invalidateQueries({ queryKey: ["resultados", proyectoId] });
    },
  });

  const canSave =
    comoValue.trim() && quiero.trim() && para.trim() && criterios.some((c) => c.trim());

  return (
    <div>
      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
        Historias de Usuario
      </h4>

      {/* Form */}
      <div className="space-y-3 border border-slate-200 rounded-xl p-4 bg-slate-50/40 mb-4">
        {/* Código + Prioridad */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500 shrink-0">Código</span>
            <span className="text-xs font-mono font-bold text-violet-700 bg-violet-50 border border-violet-100 px-2 py-1 rounded">
              {nextCodigo}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500 shrink-0">Prioridad</span>
            <select
              value={prioridad}
              onChange={(e) => setPrioridad(e.target.value as Prioridad)}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-violet-400"
            >
              <option value="ALTA">Alta</option>
              <option value="MEDIA">Media</option>
              <option value="BAJA">Baja</option>
            </select>
          </div>
        </div>

        {/* Como */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500 w-20 shrink-0">Como</span>
          {hasParticipants ? (
            <select
              value={personaId}
              onChange={(e) => setPersonaId(e.target.value)}
              className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:border-violet-400"
            >
              <option value="">Seleccionar stakeholder...</option>
              {sesion.participantes.map((p) => (
                <option key={p.persona_id} value={p.persona_id}>
                  {p.persona.nombre_completo} — {p.persona.rol.nombre}
                </option>
              ))}
            </select>
          ) : (
            <input
              value={customComo}
              onChange={(e) => setCustomComo(e.target.value)}
              placeholder="rol o persona (agrega participantes para elegir)..."
              className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:border-violet-400"
            />
          )}
        </div>

        {/* Quiero */}
        <div className="flex items-start gap-2">
          <span className="text-xs font-medium text-slate-500 w-20 shrink-0 mt-2">Quiero</span>
          <textarea
            value={quiero}
            onChange={(e) => setQuiero(e.target.value)}
            placeholder="poder hacer algo..."
            rows={3}
            className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 resize-y focus:outline-none focus:border-violet-400 bg-white"
          />
        </div>

        {/* Para que */}
        <div className="flex items-start gap-2">
          <span className="text-xs font-medium text-slate-500 w-20 shrink-0 mt-2">Para que</span>
          <textarea
            value={para}
            onChange={(e) => setPara(e.target.value)}
            placeholder="lograr algún beneficio..."
            rows={3}
            className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 resize-y focus:outline-none focus:border-violet-400 bg-white"
          />
        </div>

        {/* Criterios de aceptación */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Criterios de aceptación</span>
            <button
              type="button"
              onClick={addCriterio}
              className="text-xs text-violet-600 hover:text-violet-700 flex items-center gap-1"
            >
              <HiPlus className="h-3 w-3" />Agregar criterio
            </button>
          </div>
          <div className="space-y-2">
            {criterios.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs text-slate-400 w-5 shrink-0 text-right">{i + 1}.</span>
                <input
                  value={c}
                  onChange={(e) => updateCriterio(i, e.target.value)}
                  placeholder={`Criterio ${i + 1}...`}
                  className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:border-violet-400"
                />
                <button
                  type="button"
                  onClick={() => removeCriterio(i)}
                  className="text-slate-300 hover:text-red-400 shrink-0"
                >
                  <HiX className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            disabled={!canSave || guardar.isPending}
            onClick={() => guardar.mutate()}
            className="text-xs bg-violet-600 text-white px-4 py-1.5 rounded-lg disabled:opacity-40 hover:bg-violet-700"
          >
            {guardar.isPending ? "Guardando..." : "Guardar historia"}
          </button>
        </div>
      </div>

      {/* Saved HU cards */}
      {resultados.length > 0 && (
        <ul className="space-y-3">
          {resultados.map((r) => (
            <HUCard
              key={r.id}
              resultado={r}
              onDelete={() => {
                if (confirm("¿Eliminar esta historia de usuario?")) delResultado.mutate(r.id);
              }}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Panel: Hallazgos / Observaciones (técnicas genéricas) ───────────────────

const LABEL_TECNICA: Partial<Record<TipoMetodo, { titulo: string; placeholder: string }>> = {
  OBSERVACION:               { titulo: "Observaciones y hallazgos",     placeholder: "Describe lo observado..." },
  FOCUS_GROUP:               { titulo: "Conclusiones del Focus Group",  placeholder: "Hallazgo o conclusión del grupo..." },
  DOCUMENTOS:                { titulo: "Hallazgos del análisis",        placeholder: "Información relevante encontrada..." },
  SEGUIMIENTO_TRANSACCIONAL: { titulo: "Hallazgos del seguimiento",     placeholder: "Observación del proceso/transacción..." },
};

interface HallazgoData { persona?: string; texto: string }

function parseHallazgo(contenido: string): HallazgoData | null {
  try {
    const d = JSON.parse(contenido);
    if (d && typeof d.texto === "string") return d as HallazgoData;
  } catch { /* plain text */ }
  return null;
}

function HallazgosPanel({ sesion, proyectoId }: { sesion: Sesion; proyectoId: string }) {
  const qc = useQueryClient();
  const [texto, setTexto] = useState("");
  const [personaId, setPersonaId] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editTexto, setEditTexto] = useState("");

  const esFocusGroup = sesion.tecnica.tipo_metodo === "FOCUS_GROUP";

  const cfg = LABEL_TECNICA[sesion.tecnica.tipo_metodo] ?? {
    titulo: "Resultados", placeholder: "Describe el resultado obtenido...",
  };

  const { data: resultados = [] } = useQuery<Resultado[]>({
    queryKey: ["sesion", sesion.id, "resultados"],
    queryFn: () => fetch(`/api/sesiones/${sesion.id}/resultados`).then((r) => r.json()),
  });

  const inv = () => {
    qc.invalidateQueries({ queryKey: ["sesion", sesion.id, "resultados"] });
    qc.invalidateQueries({ queryKey: ["sesiones", proyectoId] });
    qc.invalidateQueries({ queryKey: ["resultados", proyectoId] });
  };

  const buildContenido = (t: string, pid: string) => {
    if (esFocusGroup && pid) {
      const p = sesion.participantes.find((x) => x.persona_id === pid);
      const nombre = p ? `${p.persona.nombre_completo} (${p.persona.rol.nombre})` : "";
      return JSON.stringify({ persona: nombre, texto: t.trim() });
    }
    return t.trim();
  };

  const add = useMutation({
    mutationFn: () =>
      fetch(`/api/sesiones/${sesion.id}/resultados`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contenido: buildContenido(texto, personaId) }),
      }),
    onSuccess: () => { setTexto(""); setPersonaId(""); inv(); },
  });

  const edit = useMutation({
    mutationFn: (id: string) => {
      const original = resultados.find((r) => r.id === id);
      const parsed = original ? parseHallazgo(original.contenido) : null;
      const contenido = parsed?.persona
        ? JSON.stringify({ persona: parsed.persona, texto: editTexto.trim() })
        : editTexto.trim();
      return fetch(`/api/resultados/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contenido }),
      });
    },
    onSuccess: () => { setEditId(null); inv(); },
  });

  const del = useMutation({
    mutationFn: (id: string) => fetch(`/api/resultados/${id}`, { method: "DELETE" }),
    onSuccess: inv,
  });

  const startEdit = (r: Resultado) => {
    const parsed = parseHallazgo(r.contenido);
    setEditId(r.id);
    setEditTexto(parsed ? parsed.texto : r.contenido);
  };

  return (
    <div>
      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">{cfg.titulo}</h4>

      {resultados.length === 0 && (
        <p className="text-xs text-slate-400 italic mb-3">Sin hallazgos registrados aún.</p>
      )}

      <div className="space-y-2 mb-3">
        {resultados.map((r, i) => {
          const hallazgo = parseHallazgo(r.contenido);
          const displayTexto = hallazgo ? hallazgo.texto : r.contenido;
          const displayPersona = hallazgo?.persona;

          return (
            <div key={r.id} className="group flex gap-2 items-start">
              <span className="text-xs text-slate-400 shrink-0 mt-0.5">{i + 1}.</span>
              <div className="flex-1 min-w-0">
                {editId === r.id ? (
                  <div className="space-y-1">
                    <textarea
                      value={editTexto} onChange={(e) => setEditTexto(e.target.value)} rows={5} autoFocus
                      className="w-full text-sm border border-violet-200 rounded-lg px-3 py-2 resize-y focus:outline-none"
                    />
                    <div className="flex gap-1.5">
                      <button onClick={() => edit.mutate(r.id)} className="text-xs bg-violet-600 text-white px-2.5 py-1 rounded hover:bg-violet-700">Guardar</button>
                      <button onClick={() => setEditId(null)} className="text-xs text-slate-500 px-2 py-1">Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {displayPersona && (
                      <span className="font-semibold text-violet-600 mr-1">{displayPersona}:</span>
                    )}
                    {displayTexto}
                  </p>
                )}
                {r.requisito_fuentes.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {r.requisito_fuentes.map((f) => (
                      <span key={f.requisito.id} className="text-[10px] bg-violet-50 text-violet-600 border border-violet-100 px-1.5 py-0.5 rounded-full">
                        {f.requisito.codigo || f.requisito.nombre}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {editId !== r.id && (
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 shrink-0">
                  <button onClick={() => startEdit(r)} className="text-slate-300 hover:text-violet-500 p-0.5">
                    <HiPencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => { if (confirm("¿Eliminar?")) del.mutate(r.id); }} className="text-slate-300 hover:text-red-400 p-0.5">
                    <HiTrash className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="space-y-2">
        {esFocusGroup && sesion.participantes.length > 0 && (
          <select
            value={personaId}
            onChange={(e) => setPersonaId(e.target.value)}
            className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-violet-400"
          >
            <option value="">Conclusión general (sin persona específica)</option>
            {sesion.participantes.map((p) => (
              <option key={p.persona_id} value={p.persona_id}>
                {p.persona.nombre_completo} — {p.persona.rol.nombre}
              </option>
            ))}
          </select>
        )}
        <div className="flex gap-2">
          <textarea
            value={texto} onChange={(e) => setTexto(e.target.value)} rows={5}
            placeholder={cfg.placeholder}
            className="flex-1 text-sm border border-dashed border-slate-300 rounded-lg px-3 py-2.5 resize-y focus:outline-none focus:border-violet-400 bg-slate-50/50"
          />
          <button
            disabled={!texto.trim() || add.isPending}
            onClick={() => add.mutate()}
            className="text-xs bg-violet-600 text-white px-3 rounded-lg disabled:opacity-40 hover:bg-violet-700 self-end py-2"
          >
            <HiPlus className="h-4 w-4" />
          </button>
        </div>
      </div>

    </div>
  );
}

// ─── Session Card ─────────────────────────────────────────────────────────────

function SessionCard({ sesion, personas, proyectoId }: {
  sesion: Sesion; personas: Persona[]; proyectoId: string;
}) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [selectedPersonaId, setSelectedPersonaId] = useState("");

  const participanteIds = new Set(sesion.participantes.map((p) => p.persona_id));
  const personasDisponibles = personas.filter((p) => !participanteIds.has(p.id));
  const estado = ESTADO_CONFIG[sesion.estado];

  const invSesiones = () => qc.invalidateQueries({ queryKey: ["sesiones", proyectoId] });

  const updateEstado = useMutation({
    mutationFn: (estado: EstadoSesion) =>
      fetch(`/api/sesiones/${sesion.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado }),
      }),
    onSuccess: invSesiones,
  });

  const deleteSesion = useMutation({
    mutationFn: () => fetch(`/api/sesiones/${sesion.id}`, { method: "DELETE" }),
    onSuccess: invSesiones,
  });

  const addParticipant = useMutation({
    mutationFn: (persona_id: string) =>
      fetch(`/api/sesiones/${sesion.id}/participantes`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ persona_id }),
      }),
    onSuccess: () => { invSesiones(); setSelectedPersonaId(""); setShowAddParticipant(false); },
  });

  const removeParticipant = useMutation({
    mutationFn: (persona_id: string) =>
      fetch(`/api/sesiones/${sesion.id}/participantes?persona_id=${persona_id}`, { method: "DELETE" }),
    onSuccess: invSesiones,
  });

  const tipo = sesion.tecnica.tipo_metodo;
  const usaQA = tipo === "ENTREVISTA" || tipo === "CUESTIONARIO";
  const usaHU = tipo === "HISTORIA_USUARIO";

  return (
    <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
      {/* Fila resumen */}
      <div
        className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-slate-50 select-none"
        onClick={() => setExpanded((e) => !e)}
      >
        <span className="text-slate-400 shrink-0">
          {expanded ? <HiChevronDown className="h-4 w-4" /> : <HiChevronRight className="h-4 w-4" />}
        </span>
        <span className="text-sm font-semibold text-slate-800 min-w-[130px]">{sesion.tecnica.nombre}</span>
        <span className="text-xs text-slate-400 border border-slate-200 rounded-full px-2 py-0.5 truncate max-w-[180px]">
          {sesion.subproceso.nombre}
        </span>
        <span className="text-xs text-slate-500 flex items-center gap-1">
          <HiCalendar className="h-3.5 w-3.5" />{formatDate(sesion.fecha)}
        </span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${estado.color}`}>{estado.label}</span>
        <span className="ml-auto text-xs text-slate-400">
          👥 {sesion.participantes.length}
        </span>
      </div>

      {/* Detalle expandido */}
      {expanded && (
        <div className="border-t border-slate-100 p-4 bg-slate-50/30">
          {/* Controles */}
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Estado:</span>
              <select
                value={sesion.estado}
                onChange={(e) => updateEstado.mutate(e.target.value as EstadoSesion)}
                className="text-xs border border-slate-200 rounded px-2 py-1 bg-white focus:outline-none focus:border-violet-400"
              >
                {Object.entries(ESTADO_CONFIG).map(([v, c]) => (
                  <option key={v} value={v}>{c.label}</option>
                ))}
              </select>
            </div>
            {sesion.notas && <p className="text-xs text-slate-400 italic">{sesion.notas}</p>}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm("¿Eliminar esta sesión y todos sus datos?")) deleteSesion.mutate();
              }}
              className="ml-auto text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
            >
              <HiTrash className="h-3.5 w-3.5" />Eliminar sesión
            </button>
          </div>

          <div className="grid grid-cols-5 gap-5">
            {/* Participantes — col 2/5 */}
            <div className="col-span-2">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Participantes</h4>
                {!showAddParticipant && personasDisponibles.length > 0 && (
                  <button onClick={() => setShowAddParticipant(true)} className="text-xs text-violet-600 hover:text-violet-700 flex items-center gap-1">
                    <HiPlus className="h-3.5 w-3.5" />Agregar
                  </button>
                )}
              </div>

              {sesion.participantes.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Sin participantes.</p>
              ) : (
                <ul className="space-y-1.5 mb-2">
                  {sesion.participantes.map((p) => (
                    <li key={p.persona_id} className="flex items-center justify-between">
                      <span className="text-xs text-slate-700">{p.persona.nombre_completo}</span>
                      <span className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400">{p.persona.rol.nombre}</span>
                        <button onClick={() => removeParticipant.mutate(p.persona_id)} className="text-slate-300 hover:text-red-400">
                          <HiX className="h-3 w-3" />
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {showAddParticipant && (
                <div className="flex items-center gap-1.5 mt-2">
                  <select
                    value={selectedPersonaId}
                    onChange={(e) => setSelectedPersonaId(e.target.value)}
                    className="flex-1 text-xs border border-slate-200 rounded px-2 py-1.5 bg-white focus:outline-none focus:border-violet-400"
                  >
                    <option value="">Seleccionar...</option>
                    {personasDisponibles.map((p) => (
                      <option key={p.id} value={p.id}>{p.nombre_completo} ({p.rol.nombre})</option>
                    ))}
                  </select>
                  <button
                    disabled={!selectedPersonaId}
                    onClick={() => addParticipant.mutate(selectedPersonaId)}
                    className="text-xs bg-violet-600 text-white p-1.5 rounded disabled:opacity-40"
                  >
                    <HiCheck className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => { setShowAddParticipant(false); setSelectedPersonaId(""); }} className="text-slate-400">
                    <HiX className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Panel por técnica — col 3/5 */}
            <div className="col-span-3">
              {usaQA  && <EntrevistaPanel sesion={sesion} proyectoId={proyectoId} />}
              {usaHU  && <HistoriaUsuarioPanel sesion={sesion} proyectoId={proyectoId} />}
              {!usaQA && !usaHU && <HallazgosPanel sesion={sesion} proyectoId={proyectoId} />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Modal: Crear Sesión ──────────────────────────────────────────────────────

function CreateSesionModal({ procesos, proyectoId, onClose }: {
  procesos: ProcesoConSubprocesos[]; proyectoId: string; onClose: () => void;
}) {
  const qc = useQueryClient();
  const [procesoId, setProcesoId] = useState("");
  const [subprocesoId, setSubprocesoId] = useState("");
  const [tecnicaId, setTecnicaId] = useState("");
  const [fecha, setFecha] = useState("");
  const [notas, setNotas] = useState("");

  const proceso = procesos.find((p) => p.id === procesoId);
  const subproceso = proceso?.subprocesos.find((s) => s.id === subprocesoId);
  const tecnicasDisponibles = subproceso?.subproceso_tecnicas.map((st) => st.tecnica) ?? [];

  const create = useMutation({
    mutationFn: () =>
      fetch(`/api/subprocesos/${subprocesoId}/sesiones`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tecnica_id: tecnicaId, fecha, notas: notas || undefined }),
      }).then((r) => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["sesiones", proyectoId] }); onClose(); },
  });

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-slate-900">Nueva sesión de recabación</h2>
          <button onClick={onClose}><HiX className="h-5 w-5 text-slate-400" /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Proceso</label>
            <select value={procesoId} onChange={(e) => { setProcesoId(e.target.value); setSubprocesoId(""); setTecnicaId(""); }}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400"
            >
              <option value="">Seleccionar proceso...</option>
              {procesos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>

          {procesoId && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Subproceso</label>
              <select value={subprocesoId} onChange={(e) => { setSubprocesoId(e.target.value); setTecnicaId(""); }}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400"
              >
                <option value="">Seleccionar subproceso...</option>
                {proceso?.subprocesos.map((s) => (
                  <option key={s.id} value={s.id}>{s.nombre}{s.subproceso_tecnicas.length === 0 ? " (sin técnicas)" : ""}</option>
                ))}
              </select>
            </div>
          )}

          {subprocesoId && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Técnica de recabación</label>
              {tecnicasDisponibles.length === 0 ? (
                <p className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                  Sin técnicas asignadas. Agrégalas en la pestaña Procesos.
                </p>
              ) : (
                <select value={tecnicaId} onChange={(e) => setTecnicaId(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400"
                >
                  <option value="">Seleccionar técnica...</option>
                  {tecnicasDisponibles.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                </select>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notas (opcional)</label>
            <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={2}
              placeholder="Contexto o instrucciones..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-violet-400"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">Cancelar</button>
          <button
            disabled={!subprocesoId || !tecnicaId || !fecha || create.isPending}
            onClick={() => create.mutate()}
            className="px-4 py-2 text-sm bg-violet-600 text-white rounded-lg disabled:opacity-40 hover:bg-violet-700"
          >
            {create.isPending ? "Creando..." : "Crear sesión"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function SesionesPage() {
  const { id } = useParams<{ id: string }>();
  const [showCreate, setShowCreate] = useState(false);

  const { data: sesiones = [], isLoading } = useQuery<Sesion[]>({
    queryKey: ["sesiones", id],
    queryFn: () => fetch(`/api/proyectos/${id}/sesiones`).then((r) => r.json()),
  });

  const { data: procesos = [] } = useQuery<ProcesoConSubprocesos[]>({
    queryKey: ["procesos", id],
    queryFn: () => fetch(`/api/proyectos/${id}/procesos`).then((r) => r.json()),
  });

  const { data: personas = [] } = useQuery<Persona[]>({
    queryKey: ["personas", id],
    queryFn: () => fetch(`/api/proyectos/${id}/personas`).then((r) => r.json()),
  });

  const grouped = useMemo(() => {
    const map = new Map<string, { procesoNombre: string; sesiones: Sesion[] }>();
    for (const s of sesiones) {
      const pid = s.subproceso.proceso.id;
      if (!map.has(pid)) map.set(pid, { procesoNombre: s.subproceso.proceso.nombre, sesiones: [] });
      map.get(pid)!.sesiones.push(s);
    }
    return [...map.values()];
  }, [sesiones]);

  const stats = useMemo(() => ({
    total: sesiones.length,
    pendiente: sesiones.filter((s) => s.estado === "PENDIENTE").length,
    enCurso:   sesiones.filter((s) => s.estado === "EN_CURSO").length,
    completada:sesiones.filter((s) => s.estado === "COMPLETADA").length,
  }), [sesiones]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Sesiones de Recabación</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Aplica técnicas, registra preguntas y respuestas, y extrae requisitos
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-violet-700 transition"
        >
          <HiPlus className="h-4 w-4" />Nueva sesión
        </button>
      </div>

      {sesiones.length > 0 && (
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total",       value: stats.total,      color: "text-slate-700" },
            { label: "Pendientes",  value: stats.pendiente,  color: "text-slate-500" },
            { label: "En curso",    value: stats.enCurso,    color: "text-blue-600"  },
            { label: "Completadas", value: stats.completada, color: "text-green-600" },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-slate-200 rounded-lg px-4 py-3 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-slate-400 text-center py-10">Cargando sesiones...</p>
      ) : sesiones.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-200">
          <HiDocumentText className="h-10 w-10 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Sin sesiones aún</p>
          <p className="text-sm text-slate-400 mt-1 mb-4">Crea la primera sesión para comenzar a recabar información</p>
          <button onClick={() => setShowCreate(true)} className="text-sm text-violet-600 hover:text-violet-700 font-medium">
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
                  <SessionCard key={sesion.id} sesion={sesion} personas={personas} proyectoId={id} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateSesionModal procesos={procesos} proyectoId={id} onClose={() => setShowCreate(false)} />
      )}
    </div>
  );
}

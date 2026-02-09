"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  HiPlus,
  HiOutlineTrash,
  HiOutlinePencil,
  HiChevronDown,
  HiChevronRight,
  HiX,
  HiCheck,
} from "react-icons/hi";

interface Tecnica {
  id: string;
  nombre: string;
  tipo_metodo: string;
  descripcion: string | null;
}

interface SubprocesoTecnica {
  tecnica: Tecnica;
}

interface Subproceso {
  id: string;
  nombre: string;
  descripcion: string | null;
  subproceso_tecnicas: SubprocesoTecnica[];
}

interface Proceso {
  id: string;
  nombre: string;
  descripcion: string | null;
  subprocesos: Subproceso[];
}

export default function ProcesosPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set());
  const [subExpandidos, setSubExpandidos] = useState<Set<string>>(new Set());

  // Formularios
  const [nuevoProceso, setNuevoProceso] = useState({ nombre: "", descripcion: "" });
  const [nuevoSub, setNuevoSub] = useState<{ procesoId: string; nombre: string; descripcion: string } | null>(null);
  const [editandoProceso, setEditandoProceso] = useState<string | null>(null);
  const [editandoSub, setEditandoSub] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ nombre: "", descripcion: "" });
  const [asignandoTecnica, setAsignandoTecnica] = useState<string | null>(null);

  const { data: procesos, isLoading } = useQuery<Proceso[]>({
    queryKey: ["procesos", id],
    queryFn: () => fetch(`/api/proyectos/${id}/procesos`).then((r) => r.json()),
  });

  const { data: tecnicasCatalogo } = useQuery<Tecnica[]>({
    queryKey: ["tecnicas"],
    queryFn: () => fetch("/api/tecnicas").then((r) => r.json()),
  });

  const invalidar = () => {
    queryClient.invalidateQueries({ queryKey: ["procesos", id] });
    queryClient.invalidateQueries({ queryKey: ["proyecto", id] });
  };

  const toggle = (set: Set<string>, val: string, setter: (s: Set<string>) => void) => {
    const next = new Set(set);
    next.has(val) ? next.delete(val) : next.add(val);
    setter(next);
  };

  // Mutations
  const crearProcesoMut = useMutation({
    mutationFn: () =>
      fetch(`/api/proyectos/${id}/procesos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevoProceso),
      }).then((r) => { if (!r.ok) throw new Error("Error"); return r.json(); }),
    onSuccess: () => { setNuevoProceso({ nombre: "", descripcion: "" }); invalidar(); },
  });

  const editarProcesoMut = useMutation({
    mutationFn: ({ procesoId, data }: { procesoId: string; data: { nombre: string; descripcion: string } }) =>
      fetch(`/api/procesos/${procesoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => { setEditandoProceso(null); invalidar(); },
  });

  const eliminarProcesoMut = useMutation({
    mutationFn: (procesoId: string) =>
      fetch(`/api/procesos/${procesoId}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: invalidar,
  });

  const crearSubMut = useMutation({
    mutationFn: () => {
      if (!nuevoSub) throw new Error("No sub");
      return fetch(`/api/procesos/${nuevoSub.procesoId}/subprocesos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nuevoSub.nombre, descripcion: nuevoSub.descripcion }),
      }).then((r) => { if (!r.ok) throw new Error("Error"); return r.json(); });
    },
    onSuccess: () => { setNuevoSub(null); invalidar(); },
  });

  const editarSubMut = useMutation({
    mutationFn: ({ subId, data }: { subId: string; data: { nombre: string; descripcion: string } }) =>
      fetch(`/api/subprocesos/${subId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => { setEditandoSub(null); invalidar(); },
  });

  const eliminarSubMut = useMutation({
    mutationFn: (subId: string) =>
      fetch(`/api/subprocesos/${subId}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: invalidar,
  });

  const asignarTecnicaMut = useMutation({
    mutationFn: ({ subId, tecnicaId }: { subId: string; tecnicaId: string }) =>
      fetch(`/api/subprocesos/${subId}/tecnicas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tecnica_id: tecnicaId }),
      }).then((r) => { if (!r.ok) throw new Error("Error"); return r.json(); }),
    onSuccess: invalidar,
  });

  const desasignarTecnicaMut = useMutation({
    mutationFn: ({ subId, tecnicaId }: { subId: string; tecnicaId: string }) =>
      fetch(`/api/subprocesos/${subId}/tecnicas?tecnica_id=${tecnicaId}`, {
        method: "DELETE",
      }).then((r) => r.json()),
    onSuccess: invalidar,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Procesos</h2>
        <p className="mt-1 text-sm text-slate-500">
          Define procesos, subprocesos y asigna técnicas de recabación.
        </p>
      </div>

      {/* Nuevo proceso */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (nuevoProceso.nombre.trim()) crearProcesoMut.mutate();
        }}
        className="flex gap-2"
      >
        <input
          value={nuevoProceso.nombre}
          onChange={(e) => setNuevoProceso({ ...nuevoProceso, nombre: e.target.value })}
          placeholder="Nombre del proceso..."
          className="flex-1 rounded-xl bg-slate-50 px-4 py-2.5 text-sm outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-violet-500"
        />
        <input
          value={nuevoProceso.descripcion}
          onChange={(e) => setNuevoProceso({ ...nuevoProceso, descripcion: e.target.value })}
          placeholder="Descripción (opcional)"
          className="flex-1 rounded-xl bg-slate-50 px-4 py-2.5 text-sm outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-violet-500"
        />
        <button
          type="submit"
          disabled={!nuevoProceso.nombre.trim()}
          className="flex items-center gap-1 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50 transition"
        >
          <HiPlus size={16} />
          Agregar
        </button>
      </form>

      {/* Lista de procesos */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
        </div>
      ) : !procesos?.length ? (
        <p className="py-8 text-center text-sm text-slate-400">
          No hay procesos definidos. Agrega el primero.
        </p>
      ) : (
        <div className="space-y-3">
          {procesos.map((proceso) => {
            const isExp = expandidos.has(proceso.id);
            const isEditingProceso = editandoProceso === proceso.id;

            return (
              <div key={proceso.id} className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 overflow-hidden">
                {/* Cabecera del proceso */}
                <div className="flex items-center justify-between px-5 py-4">
                  <button
                    onClick={() => toggle(expandidos, proceso.id, setExpandidos)}
                    className="flex items-center gap-2 text-left"
                  >
                    {isExp ? <HiChevronDown size={18} className="text-violet-500" /> : <HiChevronRight size={18} className="text-slate-400" />}
                    {isEditingProceso ? (
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <input
                          value={editForm.nombre}
                          onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                          className="rounded-lg bg-slate-50 px-2 py-1 text-sm ring-1 ring-black/10 focus:ring-2 focus:ring-violet-500"
                          autoFocus
                        />
                        <button onClick={() => editarProcesoMut.mutate({ procesoId: proceso.id, data: editForm })} className="text-green-600 hover:bg-green-50 rounded p-1"><HiCheck size={16} /></button>
                        <button onClick={() => setEditandoProceso(null)} className="text-slate-400 hover:bg-slate-100 rounded p-1"><HiX size={16} /></button>
                      </div>
                    ) : (
                      <div>
                        <span className="font-semibold text-slate-900">{proceso.nombre}</span>
                        {proceso.descripcion && (
                          <span className="ml-2 text-sm text-slate-400">{proceso.descripcion}</span>
                        )}
                        <span className="ml-2 text-xs text-slate-400">
                          ({proceso.subprocesos.length} subprocesos)
                        </span>
                      </div>
                    )}
                  </button>

                  {!isEditingProceso && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => { setEditandoProceso(proceso.id); setEditForm({ nombre: proceso.nombre, descripcion: proceso.descripcion || "" }); }}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-violet-600"
                      >
                        <HiOutlinePencil size={16} />
                      </button>
                      <button
                        onClick={() => { if (confirm(`¿Eliminar "${proceso.nombre}" y todos sus subprocesos?`)) eliminarProcesoMut.mutate(proceso.id); }}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <HiOutlineTrash size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Subprocesos */}
                {isExp && (
                  <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-4 space-y-3">
                    {/* Agregar subproceso */}
                    {nuevoSub?.procesoId === proceso.id ? (
                      <div className="flex gap-2">
                        <input
                          value={nuevoSub.nombre}
                          onChange={(e) => setNuevoSub({ ...nuevoSub, nombre: e.target.value })}
                          placeholder="Nombre del subproceso..."
                          className="flex-1 rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-black/10 focus:ring-2 focus:ring-violet-500"
                          autoFocus
                        />
                        <button
                          onClick={() => { if (nuevoSub.nombre.trim()) crearSubMut.mutate(); }}
                          className="rounded-lg bg-violet-600 px-3 py-2 text-sm text-white hover:bg-violet-700"
                        >
                          Agregar
                        </button>
                        <button onClick={() => setNuevoSub(null)} className="rounded-lg px-3 py-2 text-sm text-slate-500 ring-1 ring-black/10 hover:bg-white">
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setNuevoSub({ procesoId: proceso.id, nombre: "", descripcion: "" })}
                        className="flex items-center gap-1 text-sm text-violet-600 hover:text-violet-700 font-medium"
                      >
                        <HiPlus size={14} /> Agregar subproceso
                      </button>
                    )}

                    {/* Lista subprocesos */}
                    {proceso.subprocesos.map((sub) => {
                      const isSubExp = subExpandidos.has(sub.id);
                      const isEditingSub = editandoSub === sub.id;
                      const tecnicasAsignadas = sub.subproceso_tecnicas.map((st) => st.tecnica);
                      const tecnicasDisponibles = tecnicasCatalogo?.filter(
                        (t) => !tecnicasAsignadas.some((ta) => ta.id === t.id)
                      );

                      return (
                        <div key={sub.id} className="rounded-xl bg-white ring-1 ring-black/5 overflow-hidden">
                          <div className="flex items-center justify-between px-4 py-3">
                            <button
                              onClick={() => toggle(subExpandidos, sub.id, setSubExpandidos)}
                              className="flex items-center gap-2 text-left"
                            >
                              {isSubExp ? <HiChevronDown size={16} className="text-violet-400" /> : <HiChevronRight size={16} className="text-slate-300" />}
                              {isEditingSub ? (
                                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                  <input
                                    value={editForm.nombre}
                                    onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                                    className="rounded bg-slate-50 px-2 py-1 text-sm ring-1 ring-black/10"
                                    autoFocus
                                  />
                                  <button onClick={() => editarSubMut.mutate({ subId: sub.id, data: editForm })} className="text-green-600 p-1"><HiCheck size={14} /></button>
                                  <button onClick={() => setEditandoSub(null)} className="text-slate-400 p-1"><HiX size={14} /></button>
                                </div>
                              ) : (
                                <span className="text-sm font-medium text-slate-700">{sub.nombre}</span>
                              )}
                              <span className="text-xs text-slate-400">
                                {tecnicasAsignadas.length} técnica(s)
                              </span>
                            </button>
                            {!isEditingSub && (
                              <div className="flex gap-1">
                                <button
                                  onClick={() => { setEditandoSub(sub.id); setEditForm({ nombre: sub.nombre, descripcion: sub.descripcion || "" }); }}
                                  className="rounded p-1 text-slate-400 hover:text-violet-600 hover:bg-slate-50"
                                >
                                  <HiOutlinePencil size={14} />
                                </button>
                                <button
                                  onClick={() => { if (confirm(`¿Eliminar "${sub.nombre}"?`)) eliminarSubMut.mutate(sub.id); }}
                                  className="rounded p-1 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                >
                                  <HiOutlineTrash size={14} />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Técnicas del subproceso */}
                          {isSubExp && (
                            <div className="border-t border-slate-100 px-4 py-3 space-y-2">
                              {tecnicasAsignadas.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {tecnicasAsignadas.map((t) => (
                                    <span key={t.id} className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-700">
                                      {t.nombre}
                                      <button
                                        onClick={() => desasignarTecnicaMut.mutate({ subId: sub.id, tecnicaId: t.id })}
                                        className="ml-1 rounded-full hover:bg-violet-200 p-0.5"
                                      >
                                        <HiX size={12} />
                                      </button>
                                    </span>
                                  ))}
                                </div>
                              )}

                              {asignandoTecnica === sub.id ? (
                                <div className="flex gap-2 items-center">
                                  <select
                                    id={`tecnica-${sub.id}`}
                                    className="flex-1 rounded-lg bg-slate-50 px-3 py-2 text-sm ring-1 ring-black/10 focus:ring-2 focus:ring-violet-500"
                                    defaultValue=""
                                    onChange={(e) => {
                                      if (e.target.value) {
                                        asignarTecnicaMut.mutate({ subId: sub.id, tecnicaId: e.target.value });
                                        setAsignandoTecnica(null);
                                      }
                                    }}
                                  >
                                    <option value="">Seleccionar técnica...</option>
                                    {tecnicasDisponibles?.map((t) => (
                                      <option key={t.id} value={t.id}>{t.nombre}</option>
                                    ))}
                                  </select>
                                  <button onClick={() => setAsignandoTecnica(null)} className="text-sm text-slate-400 hover:text-slate-600">
                                    Cancelar
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setAsignandoTecnica(sub.id)}
                                  className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700 font-medium"
                                >
                                  <HiPlus size={12} /> Asignar técnica
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineUsers,
  HiOutlineCollection,
  HiOutlineTag,
} from "react-icons/hi";

interface Proyecto {
  id: string;
  nombre: string;
  descripcion: string | null;
  creado_en: string;
  actualizado_en: string;
  roles: { id: string; nombre: string; _count: { personas: number } }[];
  personas: { id: string }[];
  procesos: { id: string; subprocesos: { id: string }[] }[];
}

export default function ProyectoDashboard() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");

  const { data: proyecto, isLoading } = useQuery<Proyecto>({
    queryKey: ["proyecto", id],
    queryFn: () => fetch(`/api/proyectos/${id}`).then((r) => r.json()),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (data: { nombre: string; descripcion: string }) =>
      fetch(`/api/proyectos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proyecto", id] });
      queryClient.invalidateQueries({ queryKey: ["proyectos"] });
      setEditing(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () =>
      fetch(`/api/proyectos/${id}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proyectos"] });
      router.push("/");
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
      </div>
    );
  }

  if (!proyecto) return <p className="py-8 text-center text-slate-500">Proyecto no encontrado.</p>;

  const totalSubprocesos = proyecto.procesos.reduce(
    (acc, p) => acc + p.subprocesos.length,
    0
  );

  const startEditing = () => {
    setNombre(proyecto.nombre);
    setDescripcion(proyecto.descripcion || "");
    setEditing(true);
  };

  return (
    <div className="space-y-6">
      {/* Info del proyecto */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        {editing ? (
          <div className="space-y-4">
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full rounded-xl bg-slate-50 px-4 py-3 text-sm outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-violet-500"
            />
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="min-h-20 w-full resize-none rounded-xl bg-slate-50 px-4 py-3 text-sm outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-violet-500"
            />
            <div className="flex gap-2">
              <button
                onClick={() => updateMutation.mutate({ nombre, descripcion })}
                disabled={updateMutation.isPending}
                className="rounded-lg bg-violet-600 px-3 py-1.5 text-sm text-white hover:bg-violet-700 disabled:opacity-50"
              >
                Guardar
              </button>
              <button
                onClick={() => setEditing(false)}
                className="rounded-lg px-3 py-1.5 text-sm text-slate-600 ring-1 ring-black/10 hover:bg-slate-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">
                  {proyecto.nombre}
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  {proyecto.descripcion || "Sin descripción."}
                </p>
                <p className="mt-3 text-xs text-slate-400">
                  Creado el{" "}
                  {new Date(proyecto.creado_en).toLocaleDateString("es-MX", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={startEditing}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-violet-600 transition"
                >
                  <HiOutlinePencil size={18} />
                </button>
                <button
                  onClick={() => {
                    if (confirm("¿Eliminar este proyecto? Esta acción no se puede deshacer."))
                      deleteMutation.mutate();
                  }}
                  className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                >
                  <HiOutlineTrash size={18} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Contadores */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
              <HiOutlineCollection size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{proyecto.procesos.length}</p>
              <p className="text-xs text-slate-500">Procesos</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-400">{totalSubprocesos} subprocesos</p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <HiOutlineUsers size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{proyecto.personas.length}</p>
              <p className="text-xs text-slate-500">Stakeholders</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
              <HiOutlineTag size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{proyecto.roles.length}</p>
              <p className="text-xs text-slate-500">Roles</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

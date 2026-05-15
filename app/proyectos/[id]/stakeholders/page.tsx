"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { HiPlus, HiOutlineTrash, HiOutlinePencil, HiX } from "react-icons/hi";

interface Rol {
  id: string;
  nombre: string;
}

interface Persona {
  id: string;
  nombre_completo: string;
  correo: string | null;
  telefono: string | null;
  rol: Rol;
}

export default function StakeholdersPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [mostrarForm, setMostrarForm] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [form, setForm] = useState({ nombre_completo: "", correo: "", telefono: "", rol_id: "" });
  const [editandoId, setEditandoId] = useState<string | null>(null);

  const { data: personas, isLoading } = useQuery<Persona[]>({
    queryKey: ["personas", id],
    queryFn: () => fetch(`/api/proyectos/${id}/personas`).then((r) => r.json()),
  });

  const { data: roles } = useQuery<Rol[]>({
    queryKey: ["roles", id],
    queryFn: () => fetch(`/api/proyectos/${id}/roles`).then((r) => r.json()),
  });

  const invalidar = () => {
    queryClient.invalidateQueries({ queryKey: ["personas", id] });
    queryClient.invalidateQueries({ queryKey: ["proyecto", id] });
    queryClient.invalidateQueries({ queryKey: ["roles", id] });
  };

  const crearMutation = useMutation({
    mutationFn: () =>
      fetch(`/api/proyectos/${id}/personas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      }).then((r) => {
        if (!r.ok) throw new Error("Error");
        return r.json();
      }),
    onSuccess: () => {
      setForm({ nombre_completo: "", correo: "", telefono: "", rol_id: "" });
      setMostrarForm(false);
      invalidar();
    },
  });

  const editarMutation = useMutation({
    mutationFn: ({ personaId, data }: { personaId: string; data: typeof form }) =>
      fetch(`/api/personas/${personaId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => {
      setEditandoId(null);
      invalidar();
    },
  });

  const eliminarMutation = useMutation({
    mutationFn: (personaId: string) =>
      fetch(`/api/personas/${personaId}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: invalidar,
  });

  const personasFiltradas = personas?.filter(
    (p) =>
      p.nombre_completo.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.correo?.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.rol.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Stakeholders</h2>
          <p className="mt-1 text-sm text-slate-500">
            Personas involucradas en el proyecto.
          </p>
        </div>
        <button
          onClick={() => setMostrarForm(!mostrarForm)}
          className="flex items-center gap-1 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-700 transition"
        >
          <HiPlus size={16} />
          Agregar Stakeholder
        </button>
      </div>

      {/* Formulario */}
      {mostrarForm && (
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 space-y-4">
          <h3 className="font-medium text-slate-800">
            {editandoId ? "Editar Stakeholder" : "Nuevo Stakeholder"}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              value={form.nombre_completo}
              onChange={(e) => setForm({ ...form, nombre_completo: e.target.value })}
              placeholder="Nombre completo *"
              className="rounded-xl bg-slate-50 px-4 py-2.5 text-sm outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-violet-500"
            />
            <input
              value={form.correo}
              onChange={(e) => setForm({ ...form, correo: e.target.value })}
              placeholder="Correo electrónico"
              type="email"
              className="rounded-xl bg-slate-50 px-4 py-2.5 text-sm outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-violet-500"
            />
            <input
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              placeholder="Teléfono"
              className="rounded-xl bg-slate-50 px-4 py-2.5 text-sm outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-violet-500"
            />
            <select
              value={form.rol_id}
              onChange={(e) => setForm({ ...form, rol_id: e.target.value })}
              className="rounded-xl bg-slate-50 px-4 py-2.5 text-sm outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-violet-500"
            >
              <option value="">Seleccionar rol *</option>
              {roles?.map((r) => (
                <option key={r.id} value={r.id}>{r.nombre}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (editandoId) {
                  editarMutation.mutate({ personaId: editandoId, data: form });
                } else {
                  crearMutation.mutate();
                }
              }}
              disabled={!form.nombre_completo.trim() || !form.rol_id}
              className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50 transition"
            >
              {editandoId ? "Guardar" : "Agregar"}
            </button>
            <button
              onClick={() => {
                setMostrarForm(false);
                setEditandoId(null);
                setForm({ nombre_completo: "", correo: "", telefono: "", rol_id: "" });
              }}
              className="rounded-xl px-4 py-2 text-sm text-slate-600 ring-1 ring-black/10 hover:bg-slate-50 transition"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Búsqueda */}
      <input
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar por nombre, correo o rol..."
        className="w-full max-w-md rounded-xl bg-slate-50 px-4 py-2.5 text-sm outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-violet-500"
      />

      {/* Tabla */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
        </div>
      ) : !personasFiltradas?.length ? (
        <p className="py-8 text-center text-sm text-slate-400">
          No hay stakeholders registrados.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl ring-1 ring-black/5">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Correo</th>
                <th className="px-4 py-3">Teléfono</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {personasFiltradas.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-medium text-slate-800">{p.nombre_completo}</td>
                  <td className="px-4 py-3 text-slate-600">{p.correo || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{p.telefono || "—"}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">
                      {p.rol.nombre}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => {
                          setForm({
                            nombre_completo: p.nombre_completo,
                            correo: p.correo || "",
                            telefono: p.telefono || "",
                            rol_id: p.rol.id,
                          });
                          setEditandoId(p.id);
                          setMostrarForm(true);
                        }}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-violet-600"
                      >
                        <HiOutlinePencil size={16} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`¿Eliminar a "${p.nombre_completo}"?`))
                            eliminarMutation.mutate(p.id);
                        }}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <HiOutlineTrash size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

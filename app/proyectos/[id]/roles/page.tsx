"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { HiPlus, HiOutlinePencil, HiOutlineTrash, HiX, HiCheck } from "react-icons/hi";

interface Rol {
  id: string;
  nombre: string;
  _count: { personas: number };
}

const ROLES_PROTEGIDOS = ["Product Owner", "Líder de Tecnología"];

export default function RolesPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [nuevoRol, setNuevoRol] = useState("");
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editandoNombre, setEditandoNombre] = useState("");

  const { data: roles, isLoading } = useQuery<Rol[]>({
    queryKey: ["roles", id],
    queryFn: () => fetch(`/api/proyectos/${id}/roles`).then((r) => r.json()),
  });

  const invalidar = () => {
    queryClient.invalidateQueries({ queryKey: ["roles", id] });
    queryClient.invalidateQueries({ queryKey: ["proyecto", id] });
  };

  const crearMutation = useMutation({
    mutationFn: () =>
      fetch(`/api/proyectos/${id}/roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nuevoRol }),
      }).then((r) => {
        if (!r.ok) throw new Error("Error");
        return r.json();
      }),
    onSuccess: () => {
      setNuevoRol("");
      invalidar();
    },
  });

  const editarMutation = useMutation({
    mutationFn: ({ rolId, nombre }: { rolId: string; nombre: string }) =>
      fetch(`/api/roles/${rolId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre }),
      }).then((r) => {
        if (!r.ok) throw new Error("Error");
        return r.json();
      }),
    onSuccess: () => {
      setEditandoId(null);
      invalidar();
    },
  });

  const eliminarMutation = useMutation({
    mutationFn: (rolId: string) =>
      fetch(`/api/roles/${rolId}`, { method: "DELETE" }).then((r) => {
        if (!r.ok) throw new Error("Error");
        return r.json();
      }),
    onSuccess: invalidar,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Roles</h2>
          <p className="mt-1 text-sm text-slate-500">
            Gestiona los roles del proyecto. Los roles iniciales no se pueden eliminar.
          </p>
        </div>
      </div>

      {/* Formulario nuevo rol */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (nuevoRol.trim()) crearMutation.mutate();
        }}
        className="flex gap-2"
      >
        <input
          value={nuevoRol}
          onChange={(e) => setNuevoRol(e.target.value)}
          placeholder="Nombre del nuevo rol..."
          className="flex-1 rounded-xl bg-slate-50 px-4 py-2.5 text-sm outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-violet-500"
        />
        <button
          type="submit"
          disabled={!nuevoRol.trim() || crearMutation.isPending}
          className="flex items-center gap-1 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50 transition"
        >
          <HiPlus size={16} />
          Agregar
        </button>
      </form>

      {/* Lista de roles */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
        </div>
      ) : (
        <div className="space-y-2">
          {roles?.map((rol) => {
            const protegido = ROLES_PROTEGIDOS.includes(rol.nombre);
            const isEditing = editandoId === rol.id;

            return (
              <div
                key={rol.id}
                className="flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-black/5"
              >
                {isEditing ? (
                  <div className="flex flex-1 items-center gap-2">
                    <input
                      value={editandoNombre}
                      onChange={(e) => setEditandoNombre(e.target.value)}
                      className="flex-1 rounded-lg bg-slate-50 px-3 py-1.5 text-sm outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-violet-500"
                      autoFocus
                    />
                    <button
                      onClick={() =>
                        editarMutation.mutate({ rolId: rol.id, nombre: editandoNombre })
                      }
                      className="rounded-lg p-1.5 text-green-600 hover:bg-green-50"
                    >
                      <HiCheck size={16} />
                    </button>
                    <button
                      onClick={() => setEditandoId(null)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
                    >
                      <HiX size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div>
                      <span className="text-sm font-medium text-slate-800">
                        {rol.nombre}
                      </span>
                      {protegido && (
                        <span className="ml-2 rounded-full bg-violet-100 px-2 py-0.5 text-xs text-violet-600">
                          Automático
                        </span>
                      )}
                      <span className="ml-2 text-xs text-slate-400">
                        {rol._count.personas} persona(s)
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setEditandoId(rol.id);
                          setEditandoNombre(rol.nombre);
                        }}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-violet-600"
                      >
                        <HiOutlinePencil size={16} />
                      </button>
                      {!protegido && (
                        <button
                          onClick={() => {
                            if (confirm(`¿Eliminar el rol "${rol.nombre}"?`))
                              eliminarMutation.mutate(rol.id);
                          }}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <HiOutlineTrash size={16} />
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

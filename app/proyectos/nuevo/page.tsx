"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { HiOutlineClipboardList, HiOutlineCode } from "react-icons/hi";

interface FormData {
  nombre: string;
  descripcion: string;
  po_nombre: string;
  po_correo: string;
  tl_nombre: string;
  tl_correo: string;
}

export default function NuevoProyectoPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      fetch("/api/proyectos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: data.nombre,
          descripcion: data.descripcion,
          productOwner: {
            nombre_completo: data.po_nombre,
            correo: data.po_correo,
          },
          techLead: {
            nombre_completo: data.tl_nombre,
            correo: data.tl_correo,
          },
        }),
      }).then((r) => {
        if (!r.ok) throw new Error("Error al crear proyecto");
        return r.json();
      }),
    onSuccess: (proyecto) => {
      queryClient.invalidateQueries({ queryKey: ["proyectos"] });
      router.push(`/proyectos/${proyecto.id}`);
    },
  });

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-3xl font-semibold text-purple-500">
          Nuevo proyecto
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          Define la información del proyecto y asigna los roles principales. El
          Product Owner y Tech Lead son obligatorios.
        </p>

        <form onSubmit={handleSubmit((data) => mutation.mutate(data))}>
          <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 transition duration-300 hover:shadow-md hover:-translate-y-[1px]">
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-purple-500">
                  Nombre del proyecto <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej: Sistema para llevar inventario..."
                  className="w-full rounded-xl bg-slate-50 px-4 py-3 text-sm outline-none ring-1 ring-black/10 transition duration-300 focus:ring-2 focus:ring-violet-500"
                  {...register("nombre", { required: "El nombre es obligatorio" })}
                />
                {errors.nombre && (
                  <p className="text-xs text-red-500">{errors.nombre.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-purple-500">
                  Descripción del proyecto
                </label>
                <textarea
                  placeholder="Describe el objetivo, alcance general o problemática a resolver..."
                  className="min-h-28 w-full resize-none rounded-xl bg-slate-50 px-4 py-3 text-sm outline-none ring-1 ring-black/10 transition duration-300 focus:ring-2 focus:ring-violet-500"
                  {...register("descripcion")}
                />
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-semibold text-slate-900">
              Roles Clave del Proyecto
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Estos roles son obligatorios y únicos por proyecto.
            </p>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {/* Product Owner */}
              <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 transition duration-300 hover:shadow-md hover:-translate-y-[1px]">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                    <HiOutlineClipboardList size={20} />
                  </div>
                  <div>
                    <span className="inline-block rounded-full bg-violet-600 px-3 py-0.5 text-xs font-medium text-white">
                      Product Owner
                    </span>
                    <p className="mt-1 text-sm text-slate-600">
                      Responsable del negocio (lado cliente)
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-purple-500">
                      Nombre completo <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Santiago Chávez"
                      className="w-full rounded-xl bg-slate-50 px-3 py-2 text-sm outline-none ring-1 ring-black/10 transition duration-300 focus:ring-2 focus:ring-violet-500"
                      {...register("po_nombre", { required: "Nombre del PO es obligatorio" })}
                    />
                    {errors.po_nombre && (
                      <p className="text-xs text-red-500">{errors.po_nombre.message}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-purple-500">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      placeholder="correo@ejemplo.com"
                      className="w-full rounded-xl bg-slate-50 px-3 py-2 text-sm outline-none ring-1 ring-black/10 transition duration-300 focus:ring-2 focus:ring-violet-500"
                      {...register("po_correo", { required: "Email del PO es obligatorio" })}
                    />
                    {errors.po_correo && (
                      <p className="text-xs text-red-500">{errors.po_correo.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Tech Lead */}
              <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 transition duration-300 hover:shadow-md hover:-translate-y-[1px]">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                    <HiOutlineCode size={20} />
                  </div>
                  <div>
                    <span className="inline-block rounded-full bg-violet-600 px-3 py-0.5 text-xs font-medium text-white">
                      Tech Lead
                    </span>
                    <p className="mt-1 text-sm text-slate-600">
                      Responsable técnico (equipo de desarrollo)
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-purple-500">
                      Nombre completo <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Eduardo Salazar"
                      className="w-full rounded-xl bg-slate-50 px-3 py-2 text-sm outline-none ring-1 ring-black/10 transition duration-300 focus:ring-2 focus:ring-violet-500"
                      {...register("tl_nombre", { required: "Nombre del TL es obligatorio" })}
                    />
                    {errors.tl_nombre && (
                      <p className="text-xs text-red-500">{errors.tl_nombre.message}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-purple-500">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      placeholder="correo@ejemplo.com"
                      className="w-full rounded-xl bg-slate-50 px-3 py-2 text-sm outline-none ring-1 ring-black/10 transition duration-300 focus:ring-2 focus:ring-violet-500"
                      {...register("tl_correo", { required: "Email del TL es obligatorio" })}
                    />
                    {errors.tl_correo && (
                      <p className="text-xs text-red-500">{errors.tl_correo.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {mutation.isError && (
            <p className="mt-4 text-sm text-red-500">
              Error al crear el proyecto. Intenta de nuevo.
            </p>
          )}

          <div className="mt-10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-xl px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-black/10 transition duration-300 hover:bg-slate-50 hover:scale-[1.02] active:scale-[0.98]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white transition duration-300 hover:bg-violet-700 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              {mutation.isPending ? "Creando..." : "Crear proyecto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

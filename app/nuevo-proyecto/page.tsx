import { HiOutlineClipboardList } from "react-icons/hi";

export default function NuevoProyectoPage() {
  return (
    
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-semibold text-purple-700">Nuevo proyecto</h1>

        <p className="mt-2 text-sm text-slate-600">
          Define la información del proyecto y asigna los roles principales. El Product Owner y Tech Lead son obligatorios.
        </p>
        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-purple-500">
                Nombre del proyecto <span className="text-red-500">*</span>
              </label>

              <input
                type="text"
                placeholder="Ej: Sistema de gestión de requisitos"
                className="w-full rounded-xl bg-slate-50 px-4 py-3 text-sm outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-purple-500">
                Descripción del proyecto <span className="text-red-500">*</span>
              </label>

              <textarea
                placeholder="Describe el objetivo, alcance general o problemática a resolver..."
                className="min-h-28 w-full resize-none rounded-xl bg-slate-50 px-4 py-3 text-sm outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-violet-500"
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
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
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
      <label className="text-sm font-medium">
        Nombre completo <span className="text-red-500">*</span>
      </label>
      <input
        type="text"
        placeholder="Ej: Juan Pérez"
        className="w-full rounded-xl bg-slate-50 px-3 py-2 text-sm outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-violet-500"
      />
    </div>

    <div className="space-y-1">
      <label className="text-sm font-medium">
        Email <span className="text-red-500">*</span>
      </label>
      <input
        type="email"
        placeholder="juan.perez@cliente.com"
         className="w-full rounded-xl bg-slate-50 px-3 py-2 text-sm outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-violet-500" />
                        </div>
                     </div>
                </div>
            </div>
          </div>
      </div>
    </div>
  );
}

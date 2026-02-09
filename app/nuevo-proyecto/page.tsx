import { HiOutlineClipboardList, HiOutlineCode } from "react-icons/hi";

export default function NuevoProyectoPage() {
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

        {/* eduardo: aqui emepzamos a asignar el los campos para definir el nombre del proyecto*/}
        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 transition duration-300 hover:shadow-md hover:-translate-y-[1px]">
          <div className="space-y-5">
            {/* Nombre */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-purple-500">
                Nombre del proyecto <span className="text-red-500">*</span>
              </label>

              <input
                type="text"
                placeholder="Ej: Sistema para llevar inventario..."
                className="w-full rounded-xl bg-slate-50 px-4 py-3 text-sm outline-none ring-1 ring-black/10 transition duration-300 focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-purple-500">
                Descripción del proyecto <span className="text-red-500">*</span>
              </label>

              <textarea
                placeholder="Describe el objetivo, alcance general o problemática a resolver..."
                className="min-h-28 w-full resize-none rounded-xl bg-slate-50 px-4 py-3 text-sm outline-none ring-1 ring-black/10 transition duration-300 focus:ring-2 focus:ring-violet-500"
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
    
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 transition duration-300 hover:shadow-md hover:-translate-y-[1px]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 text-violet-600 transition duration-300 group-hover:scale-105">
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
                    Nombre completo <span className="text-red-500 text-purple-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: santiago chavez"
                    className="w-full rounded-xl bg-slate-50 px-3 py-2 text-sm outline-none ring-1 ring-black/10 transition duration-300 focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-purple-500">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="humberto@gmail.com"
                    className="w-full rounded-xl bg-slate-50 px-3 py-2 text-sm outline-none ring-1 ring-black/10 transition duration-300 focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>
            </div>

            {/* ya como tenimaos una tarjeta solo copiamos lo mismo y lo reutilizamos, despues podemos hacer componentes*/}
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 transition duration-300 hover:shadow-md hover:-translate-y-[1px]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 text-violet-600 transition duration-300">
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
                    placeholder="Ej: Eduardo salazar"
                    className="w-full rounded-xl bg-slate-50 px-3 py-2 text-sm outline-none ring-1 ring-black/10 transition duration-300 focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-purple-500">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="Eduardo@gmai.com"
                    className="w-full rounded-xl bg-slate-50 px-3 py-2 text-sm outline-none ring-1 ring-black/10 transition duration-300 focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex items-center justify-end gap-3">
          <button className="rounded-xl px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-black/10 transition duration-300 hover:bg-slate-50 hover:scale-[1.02] active:scale-[0.98]">
            Cancelar
          </button>

          <button className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white transition duration-300 hover:bg-violet-700 hover:scale-[1.02] active:scale-[0.98]">
            Crear proyecto
          </button>
        </div>
      </div>
    </div>
  );
}

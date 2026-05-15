"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { HiOutlineFolder, HiPlus } from "react-icons/hi";

interface Proyecto {
  id: string;
  nombre: string;
  descripcion: string | null;
  creado_en: string;
  _count: { roles: number; personas: number; procesos: number };
}

export default function Home() {
  const { data: proyectos, isLoading } = useQuery<Proyecto[]>({
    queryKey: ["proyectos"],
    queryFn: () => fetch("/api/proyectos").then((r) => r.json()),
  });

  return (
    <main className="min-h-screen px-10 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Proyectos</h1>
            <p className="mt-1 text-sm text-slate-600">
              Selecciona un proyecto o crea uno nuevo para comenzar.
            </p>
          </div>
          <Link
            href="/proyectos/nuevo"
            className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition duration-300 hover:bg-violet-700 hover:scale-[1.02] active:scale-[0.98]"
          >
            <HiPlus size={18} />
            Nuevo Proyecto
          </Link>
        </div>

        {isLoading ? (
          <div className="mt-12 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
          </div>
        ) : !proyectos?.length ? (
          <div className="mt-16 flex flex-col items-center text-center">
            <HiOutlineFolder className="h-16 w-16 text-slate-300" />
            <h2 className="mt-4 text-lg font-medium text-slate-700">
              No hay proyectos aún
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Crea tu primer proyecto para comenzar a recabar información.
            </p>
            <Link
              href="/proyectos/nuevo"
              className="mt-6 flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-violet-700"
            >
              <HiPlus size={18} />
              Crear primer proyecto
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {proyectos.map((p) => (
              <Link
                key={p.id}
                href={`/proyectos/${p.id}`}
                className="group rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 transition duration-300 hover:shadow-md hover:-translate-y-[1px]"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600 transition group-hover:scale-105">
                    <HiOutlineFolder size={20} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-slate-900 group-hover:text-violet-700 transition">
                      {p.nombre}
                    </h3>
                    {p.descripcion && (
                      <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                        {p.descripcion}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex gap-4 text-xs text-slate-400">
                  <span>{p._count.procesos} procesos</span>
                  <span>{p._count.personas} personas</span>
                  <span>{p._count.roles} roles</span>
                </div>

                <p className="mt-2 text-xs text-slate-400">
                  {new Date(p.creado_en).toLocaleDateString("es-MX", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

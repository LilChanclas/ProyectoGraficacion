"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { HiOutlineFolder } from "react-icons/hi";

interface Proyecto {
  id: string;
  nombre: string;
}

const tabs = [
  { label: "Resumen", href: "" },
  { label: "Roles", href: "/roles" },
  { label: "Stakeholders", href: "/stakeholders" },
  { label: "Procesos", href: "/procesos" },
];

export default function ProyectoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { id } = useParams<{ id: string }>();
  const pathname = usePathname();

  const { data: proyecto } = useQuery<Proyecto>({
    queryKey: ["proyecto", id],
    queryFn: () => fetch(`/api/proyectos/${id}`).then((r) => r.json()),
  });

  const basePath = `/proyectos/${id}`;

  return (
    <div>
      <div className="border-b border-gray-200 bg-white px-10">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center gap-3 py-4">
            <HiOutlineFolder className="h-6 w-6 text-violet-600" />
            <h1 className="text-xl font-semibold text-slate-900">
              {proyecto?.nombre || "Cargando..."}
            </h1>
          </div>

          <nav className="flex gap-1">
            {tabs.map((tab) => {
              const fullHref = basePath + tab.href;
              const isActive =
                tab.href === ""
                  ? pathname === basePath
                  : pathname.startsWith(fullHref);

              return (
                <Link
                  key={tab.href}
                  href={fullHref}
                  className={`px-4 py-2.5 text-sm font-medium transition rounded-t-lg ${
                    isActive
                      ? "text-violet-700 border-b-2 border-violet-600 bg-violet-50/50"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="px-10 py-6">
        <div className="mx-auto max-w-6xl">{children}</div>
      </div>
    </div>
  );
}

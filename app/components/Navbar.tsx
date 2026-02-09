"use client";

import Link from "next/link";
import { HiOutlineChip } from "react-icons/hi";
import Dropdown from "./Dropdown";
import { useQuery } from "@tanstack/react-query";

export interface MenuItem {
  title: string;
  route?: string;
  children?: MenuItem[];
}

export default function Navbar() {
  const { data: proyectos } = useQuery<{ id: string; nombre: string }[]>({
    queryKey: ["proyectos"],
    queryFn: () => fetch("/api/proyectos").then((r) => r.json()),
  });

  const menuItem: MenuItem = {
    title: "Proyectos",
    children: [
      ...(proyectos?.map((p) => ({
        title: p.nombre,
        route: `/proyectos/${p.id}`,
      })) || []),
      { title: "+ Nuevo Proyecto", route: "/proyectos/nuevo" },
    ],
  };

  return (
    <nav className="fixed top-0 z-50 w-full flex items-center justify-between py-4 px-10 border-b border-gray-200 bg-white shadow-sm">
      <div className="flex items-center gap-6">
        <Link
          href="/"
          className="flex items-center gap-3 text-purple-700 font-semibold text-lg transition duration-300 hover:scale-105"
        >
          <HiOutlineChip className="w-10 h-10" />
          <span className="text-xl font-bold">ReqTracker</span>
        </Link>
        <Dropdown item={menuItem} />
      </div>
    </nav>
  );
}

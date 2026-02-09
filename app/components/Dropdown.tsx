"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { MenuItem } from "./Navbar";
import { HiOutlineChevronDown } from "react-icons/hi";

interface Props {
  item: MenuItem;
}

export default function Dropdown({ item }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const menuItems = item?.children || [];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        className="flex items-center gap-2 text-purple-700 font-semibold text-sm transition hover:text-purple-900"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{item.title}</span>
        <HiOutlineChevronDown
          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-10 left-0 z-30 w-[240px] rounded-xl bg-white py-2 shadow-lg ring-1 ring-black/10">
          {menuItems.map((child) => (
            <Link
              key={child.route}
              href={child.route || ""}
              onClick={() => setIsOpen(false)}
              className="block px-4 py-2 text-sm text-slate-700 hover:bg-violet-50 hover:text-violet-700 transition"
            >
              {child.title}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";
import { useState } from "react";
import { HiSearch } from "react-icons/hi";


export default function Searchbar() {
  const [value, setValue] = useState<string>("");

  return (
    <div className="flex w-[500px] h-10">
      
      <input
        type="text"
        placeholder="Buscar por nombre, email, rol"
        className="flex-1 px-4 text-sm bg-white border border-gray-300 rounded-l-full outline-none focus:border-purple-500"
        value={value}
        onChange={(e:any)=>setValue(e.target.value)}
      />
      <button className="w-14 flex items-center justify-center bg-gray-100 border border-l-0 border-gray-300 rounded-r-full
      hover:bg-gray-200 transition">
         <HiSearch className="w-5 h-5 text-gray-600" />
      </button>
    </div>
  );
}

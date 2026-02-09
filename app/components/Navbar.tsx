"use client";
import Link from "next/link";
import { HiCog, HiOutlineChip, HiSearch, HiUser } from "react-icons/hi";


const Navbar = () => {
    return (
        <nav className="fixed top-0 w-full flex items-center
        justify-around py-5 px-24 border-b border-gray-700 bg-white">
            <Link href="/" className="flex items-center gap-3 text-purple-700 font-semibold
            text-lg transition duration-300 hover:scale-110">
                <HiOutlineChip className="w-16 h-16" />
                <span className="text-2xl font-bold">TaskMaster+</span>
            </Link>
            
           <ul className="flex gap-10 text-2xl">
                {/* Para buscar */}
                <Link href="/" className="flex items-center gap-3 text-purple-700 font-semibold
                text-lg transition duration-300 hover:scale-110">
                    <HiSearch className="w-10 h-10"/>
                </Link>
                {/* Configuracion */}
                <Link href="/" className="flex items-center gap-3 text-purple-700 font-semibold
                text-lg transition duration-300 hover:scale-110">
                    <HiCog className="w-10 h-10"/>
                </Link>
                {/* Perfil */}
                <Link href="/" className="flex items-center gap-3 text-purple-700 font-semibold
                text-lg transition duration-300 hover:scale-110">
                    <HiUser className="w-10 h-10"/>
                </Link>
           </ul>
        </nav>
    )
}

export default Navbar
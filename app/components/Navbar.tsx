import Link from "next/link";
import { HiCog, HiOutlineChip, HiSearch, HiUser } from "react-icons/hi";
import Dropdown from "./Dropdown";
//import { prisma } from "@/lib/prisma";

/*AQUI SE DEBEN MOSTRAR LOS PROYECTOS, NO LAS TECNICAS, PERO SIRVE DE EJEMPLO - H */
export interface MenuItem {
    title: string;
    route?: string;
    children?: MenuItem[];
}
//Hacerlo dinamico
export const MenuItem = {
    title: "Proyectos",
    children: [
        { title: "Proyecto X", route: "/proyectox" },
        { title: "Proyecto Y", route: "/proyectoy" },
        { title: "Proyecto Z", route: "/proyectoz" },
        { title: "Nuevo Proyecto", route: "/nuevo_proyecto"}
    ]
};

const Navbar = () => {
    //trae datos usando prisma (en este momento (SOS)) - h
    /*
    Aqui no supe que rollo, mejor meti las opciones con codigo duro - h
    const tecnicas =  await prisma.proyectos.findMany({
        select: {nombre: true, id:true }
    });
    */

    return (
        <nav className="fixed top-0 w-full flex items-center
        justify-between py-4 px-10 border-b border-gray-700 bg-white">
            <div className="flex items-center gap-6">
                <Link href="/" className="flex items-center gap-3 text-purple-700 font-semibold
            text-lg transition duration-300 hover:scale-110">
                    <HiOutlineChip className="w-16 h-16" />
                    <span className="text-2xl font-bold">TaskMaster+</span>
                </Link>
                {/* Muestra el dropdown */}
                <Dropdown item={MenuItem} />
            </div>

            <ul className="flex gap-10 text-2xl">

                {/* Para buscar */}
                <Link href="/" className="flex items-center gap-3 text-purple-700 font-semibold
                text-lg transition duration-300 hover:scale-110">
                    <HiSearch className="w-10 h-10" />
                </Link>
                {/* Configuracion */}
                <Link href="/" className="flex items-center gap-3 text-purple-700 font-semibold
                text-lg transition duration-300 hover:scale-110">
                    <HiCog className="w-10 h-10" />
                </Link>
                {/* Perfil */}
                <Link href="/" className="flex items-center gap-3 text-purple-700 font-semibold
                text-lg transition duration-300 hover:scale-110">
                    <HiUser className="w-10 h-10" />
                </Link>
            </ul>
        </nav>
    )
}

export default Navbar
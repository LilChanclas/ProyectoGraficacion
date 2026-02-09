import { HiUsers } from "react-icons/hi";
import Searchbar from "../components/Searchbar";

export default function Stakeholders() {
    return (
        <main className="min-h-screen flex flex-col justify-top items-start">
            <div className="w-full flex items-center justify-between px-15">
                <div className="flex items-center gap-2">
                    <HiUsers className="w-14 h-14" />
                    <span className="text-5xl">Stakeholders</span>
                </div>

                <button
                    className="bg-purple-700 hover:bg-purple-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition"
                >
                    Agregar Stakeholder
                </button>
            </div>
            <div className="w-full flex justify-center px-15">
                <Searchbar />
            </div>

            <div>
                <h1>LA IDEA ES QUE AQUI SE MUESTRE UNA TABLA CON LAS SIGUIENTES COLUMNAS: NOMBRE, CORREO, ROL, PROYECTO, DE CADA STAKEHOLDER QUE NO SEA DEL EQUIPO DE DESARROLLO</h1>
            </div>
        </main>
    );
}
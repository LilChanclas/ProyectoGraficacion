import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col justify-top items-start">
      <div className="min-w-screen flex border-b border-gray-500 bg-white">
        <Link href="/stakeholders" className="flex items-center gap-3 text-gray-600
            text-xl hover:text-purple-700 transition-colors px-15 font-semibold">
              Stakeholders
        </Link>

        <Link href="/procesos" className="flex items-center gap-3 text-gray-600
            text-xl hover:text-purple-700 transition-colors px-15 font-semibold">
              Procesos
        </Link>

      </div>

      <h1> AQUI VA UN RESUMEN DEL PROYECTO ACTUAL, PERO NO SE COMO HACERLO DINAMICO EN ESTE MOMENTO </h1>

    </main>

  );
}

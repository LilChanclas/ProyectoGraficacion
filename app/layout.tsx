import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
<<<<<<< HEAD
=======
import Providers from "./providers";
>>>>>>> main

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ReqTracker",
  description: "Plataforma de Recabación y Análisis de Información para Proyectos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
<<<<<<< HEAD
        <Navbar></Navbar>
        {children}
=======
        <Providers>
          <Navbar />
          <main className="pt-25 bg-white text-black min-h-screen">
            {children}
          </main>
        </Providers>
>>>>>>> main
      </body>
    </html>
  );
}

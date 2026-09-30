'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-slate-900 text-white shadow-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo / Marca */}
        <Link href="/" className="text-xl font-bold tracking-tight">
          Torneos <span className="text-blue-500">BA</span>
        </Link>

        {/* Navegación Desktop */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/torneos" className="hover:text-blue-400 transition-colors font-medium">
            Catálogo
          </Link>
          {/* Aquí la Persona 3 agregará sus links, ej: <Link href="/crear-torneo">Organizar</Link> */}
        </nav>

        {/* Sección de Usuario (Placeholder para P1) */}
        <div className="hidden md:flex items-center">
          {/* Aquí la P1 debe inyectar su componente <UserMenu /> */}
          <div className="bg-slate-800 px-4 py-2 rounded text-sm text-slate-400 border border-slate-700">
            [UserMenu P1]
          </div>
        </div>

        {/* Botón Menú Mobile */}
        <button 
          className="md:hidden p-2 text-slate-300 hover:text-white"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
      </div>

      {/* Menú Mobile */}
      {isMenuOpen && (
        <div className="md:hidden bg-slate-800 border-t border-slate-700">
          <nav className="flex flex-col p-4 gap-4">
            <Link 
              href="/torneos" 
              className="hover:text-blue-400 font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Catálogo
            </Link>
            
            {/* Placeholder Usuario Mobile */}
            <div className="pt-4 border-t border-slate-700 text-slate-400 text-sm text-center">
              [Componente UserMenu P1]
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
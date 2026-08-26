"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Não exibe a barra de navegação nas páginas de autenticação
  if (pathname === "/login" || pathname === "/register") {
    return null;
  }

  const navLinks = [
    { href: "/", label: "Dashboard", icon: "🏠" },
    { href: "/schedule", label: "Schedule", icon: "📅" },
    { href: "/clients", label: "Clients", icon: "👥" },
    { href: "/invoices", label: "Invoices", icon: "📄" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Top Header / Navbar */}
      <header className='sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200'>
        <div className='max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between'>
          {/* Lado Esquerdo: Mobile Hamburger & Logo */}
          <div className='flex items-center gap-3'>
            {/* Hamburger Button (Mobile Only) */}
            <button
              type='button'
              onClick={() => setIsOpen(true)}
              className='md:hidden p-2 -ml-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors'
              aria-label='Open menu'>
              <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M4 6h16M4 12h16M4 18h16' />
              </svg>
            </button>

            {/* Logo / Brand */}
            <Link href='/' className='flex items-center gap-2'>
              <span className='text-xl'>✨</span>
              <span className='font-bold text-gray-900 tracking-tight text-base sm:text-lg'>Cleaner Manager</span>
            </Link>
          </div>

          {/* Links Centrais (Desktop Only) */}
          <nav className='hidden md:flex items-center gap-1'>
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? "bg-blue-50 text-blue-700 font-semibold"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}>
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Ações do Lado Direito (Desktop & Mobile) */}
          <div className='flex items-center gap-2'>
            <Link
              href='/schedule/new'
              className='px-3 py-1.5 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center gap-1'>
              <span>+</span>
              <span className='hidden sm:inline'>Schedule</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Drawer Lateral para Mobile (Slide-over) */}
      {isOpen && (
        <div className='fixed inset-0 z-50 md:hidden'>
          {/* Overlay de fundo desfocado */}
          <div
            className='fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity'
            onClick={() => setIsOpen(false)}
          />

          {/* Painel lateral */}
          <div className='fixed inset-y-0 left-0 max-w-xs w-full bg-white shadow-2xl flex flex-col z-50 animate-in slide-in-from-left duration-200'>
            {/* Header da Gaveta */}
            <div className='p-4 border-b border-gray-100 flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <span className='text-xl'>✨</span>
                <span className='font-bold text-gray-900 tracking-tight'>Cleaner Manager</span>
              </div>
              <button
                type='button'
                onClick={() => setIsOpen(false)}
                className='p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-50 transition-colors'
                aria-label='Close menu'>
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M6 18L18 6M6 6l12 12' />
                </svg>
              </button>
            </div>

            {/* Links Principais */}
            <div className='p-4 space-y-1 flex-1 overflow-y-auto'>
              <div className='text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2'>
                Navigation
              </div>
              {navLinks.map((link) => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      active ? "bg-blue-50 text-blue-700 font-semibold" : "text-gray-700 hover:bg-gray-50"
                    }`}>
                    <span className='text-base'>{link.icon}</span>
                    <span>{link.label}</span>
                  </Link>
                );
              })}

              {/* Atalhos Rápidos */}
              <div className='pt-6'>
                <div className='text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2'>
                  Quick Actions
                </div>
                <div className='space-y-1'>
                  <Link
                    href='/schedule/new'
                    onClick={() => setIsOpen(false)}
                    className='flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors'>
                    <span className='text-blue-600 font-bold'>＋</span>
                    <span>New Appointment</span>
                  </Link>
                  <Link
                    href='/clients/new'
                    onClick={() => setIsOpen(false)}
                    className='flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors'>
                    <span className='text-blue-600 font-bold'>＋</span>
                    <span>New Client</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Rodapé da Gaveta (Logout) */}
            <div className='p-4 border-t border-gray-100 bg-gray-50/50'>
              <Link
                href='/login'
                onClick={() => setIsOpen(false)}
                className='flex items-center gap-2 text-xs font-semibold text-red-600 hover:text-red-700 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors'>
                <span>🚪</span>
                <span>Log Out</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

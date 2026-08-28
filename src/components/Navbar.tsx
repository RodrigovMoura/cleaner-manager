"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutUser } from "@/actions/auth";

export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [prevPathname, setPrevPathname] = useState(pathname);

  // Close drawer when pathname changes without cascading render effect
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setIsOpen(false);
  }

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Do not render navbar on auth pages
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

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logoutUser();
  };

  return (
    <>
      {/* Top Header / Navbar */}
      <header className='sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-xs'>
        <div className='max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4'>
          {/* Left: Mobile Hamburger & Logo */}
          <div className='flex items-center gap-3'>
            {/* Hamburger Button (Mobile Only) */}
            <button
              type='button'
              onClick={() => setIsOpen(true)}
              className='md:hidden p-2 -ml-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500'
              aria-label='Open navigation menu'
              aria-expanded={isOpen}>
              <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M4 6h16M4 12h16M4 18h16' />
              </svg>
            </button>

            {/* Logo / Brand */}
            <Link
              href='/'
              className='flex items-center gap-2.5 group focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-1'>
              <span className='text-xl group-hover:scale-110 transition-transform'>✨</span>
              <span className='font-bold text-gray-900 tracking-tight text-base sm:text-lg'>Cleaner Manager</span>
            </Link>
          </div>

          {/* Center Links (Desktop Only) */}
          <nav className='hidden md:flex items-center gap-1.5' aria-label='Main Navigation'>
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? "bg-blue-50 text-blue-700 font-semibold shadow-2xs"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/80"
                  }`}>
                  <span className='mr-1.5'>{link.icon}</span>
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right: Quick actions & Logout (Desktop) + Quick link on mobile */}
          <div className='flex items-center gap-2'>
            <Link
              href='/schedule/new'
              className='hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors'>
              <span>＋</span>
              <span>Schedule</span>
            </Link>

            <button
              type='button'
              onClick={handleLogout}
              disabled={isLoggingOut}
              aria-label='Log out'
              title='Log out'
              className='hidden md:flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors ml-1 border border-transparent hover:border-red-100 disabled:opacity-50'>
              <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1'
                />
              </svg>
              <span>{isLoggingOut ? "Exiting..." : "Logout"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Drawer Lateral para Mobile (Slide-over) */}
      {isOpen && (
        <div className='fixed inset-0 z-50 md:hidden' role='dialog' aria-modal='true' aria-label='Mobile navigation'>
          {/* Backdrop overlay */}
          <div
            className='fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity'
            onClick={() => setIsOpen(false)}
            aria-hidden='true'
          />

          {/* Drawer container */}
          <div className='fixed inset-y-0 left-0 max-w-xs w-full bg-white shadow-2xl flex flex-col z-50 animate-in slide-in-from-left duration-200'>
            {/* Header da Gaveta */}
            <div className='p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50'>
              <div className='flex items-center gap-2'>
                <span className='text-xl'>✨</span>
                <span className='font-bold text-gray-900 tracking-tight'>Cleaner Manager</span>
              </div>
              <button
                type='button'
                onClick={() => setIsOpen(false)}
                className='p-2 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors'
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
                    className='flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:text-blue-700 hover:bg-blue-50/50 rounded-xl transition-colors'>
                    <span className='text-blue-600 font-bold'>＋</span>
                    <span>New Appointment</span>
                  </Link>
                  <Link
                    href='/clients/new'
                    onClick={() => setIsOpen(false)}
                    className='flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:text-blue-700 hover:bg-blue-50/50 rounded-xl transition-colors'>
                    <span className='text-blue-600 font-bold'>＋</span>
                    <span>New Client</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Rodapé da Gaveta (Logout) */}
            <div className='p-4 border-t border-gray-100 bg-gray-50/80'>
              <button
                type='button'
                onClick={handleLogout}
                disabled={isLoggingOut}
                className='w-full flex items-center justify-center gap-2 text-xs font-semibold text-red-600 hover:text-red-700 px-3 py-2.5 rounded-xl bg-red-50 hover:bg-red-100/70 transition-colors disabled:opacity-50'>
                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1'
                  />
                </svg>
                <span>{isLoggingOut ? "Logging out..." : "Log Out"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

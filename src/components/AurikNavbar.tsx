import { Link, useRouterState } from "@tanstack/react-router";
import { Search, User, X } from "lucide-react";
import { useState } from "react";

interface AurikNavbarProps {
  savedCount?: number;
  onOpenWatchbox?: () => void;
  onFocusSearch?: () => void;
}

export function AurikNavbar({
  savedCount = 0,
  onOpenWatchbox,
  onFocusSearch,
}: AurikNavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  });

  const navLinks = [
    { to: "/", label: "Inicio" },
    { to: "/chollos", label: "Chollos" },
    { to: "/marketplace", label: "Marketplace" },
    { to: "/blog", label: "Guías" },
  ] as const;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#e5e5e5] bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-[68px] max-w-[1440px] items-center justify-between px-4 sm:h-[76px] sm:px-8">
        {/* Left: CRONORA Stencil Brand Logo */}
        <Link
          to="/"
          className="group relative flex items-center gap-2 text-[#111111] transition-opacity hover:opacity-80"
          aria-label="CRONORA Inicio"
        >
          <span className="aurik-brand relative select-none text-[19px] tracking-[0.2em] text-[#111111] sm:text-[23px] sm:tracking-[0.22em]">
            CRONORA
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-1/2 h-[1.5px] -translate-y-1/2 bg-white/75"
            />
          </span>
        </Link>

        {/* Right: Desktop Links + Utility Icons + Two-Line Hamburger */}
        <div className="flex items-center gap-3 sm:gap-6 lg:gap-8">
          <nav
            aria-label="Navegación principal"
            className="hidden items-center gap-7 lg:flex"
          >
            {navLinks.map((item) => {
              const isActive =
                item.to === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`text-[13px] font-semibold tracking-[0.02em] transition-colors ${
                    isActive
                      ? "text-[#e03127]"
                      : "text-[#111111] hover:text-[#e03127]"
                  }`}
                >
                  {isActive && (
                    <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[#e03127] align-middle" />
                  )}
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Search & User/Watchbox Icons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {onFocusSearch ? (
              <button
                type="button"
                onClick={onFocusSearch}
                aria-label="Ir al buscador"
                className="flex h-9 w-9 items-center justify-center text-[#111111] transition-colors hover:text-[#e03127]"
              >
                <Search className="h-[17px] w-[17px]" strokeWidth={1.6} />
              </button>
            ) : (
              <Link
                to="/"
                aria-label="Ir al buscador en Inicio"
                className="flex h-9 w-9 items-center justify-center text-[#111111] transition-colors hover:text-[#e03127]"
              >
                <Search className="h-[17px] w-[17px]" strokeWidth={1.6} />
              </Link>
            )}

            {onOpenWatchbox ? (
              <button
                type="button"
                onClick={onOpenWatchbox}
                aria-label="Mi Caja de piezas guardadas"
                className="relative flex h-9 w-9 items-center justify-center text-[#111111] transition-colors hover:text-[#e03127]"
              >
                <User className="h-[17px] w-[17px]" strokeWidth={1.6} />
                {savedCount > 0 && (
                  <span className="absolute right-0.5 top-0.5 flex h-4 min-w-[16px] items-center justify-center bg-[#e03127] px-1 font-mono text-[9px] font-bold text-white">
                    {savedCount}
                  </span>
                )}
              </button>
            ) : (
              <Link
                to="/favoritos"
                aria-label="Favoritos y cuenta"
                className="relative flex h-9 w-9 items-center justify-center text-[#111111] transition-colors hover:text-[#e03127]"
              >
                <User className="h-[17px] w-[17px]" strokeWidth={1.6} />
                {savedCount > 0 && (
                  <span className="absolute right-0.5 top-0.5 flex h-4 min-w-[16px] items-center justify-center bg-[#e03127] px-1 font-mono text-[9px] font-bold text-white">
                    {savedCount}
                  </span>
                )}
              </Link>
            )}

            {/* Signature AURIK Two-Line Hamburger Button (Matches 2.webp / 3.webp / 4.webp) */}
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="Abrir menú de navegación"
              aria-expanded={menuOpen}
              className="flex h-9 w-11 flex-col items-end justify-center gap-[6px] pl-1 text-[#111111] transition-opacity hover:opacity-70"
            >
              {menuOpen ? (
                <X className="h-5 w-5 text-[#111111]" strokeWidth={1.6} />
              ) : (
                <>
                  <span className="block h-[1.5px] w-9 bg-[#111111] sm:w-10" />
                  <span className="block h-[1.5px] w-9 bg-[#111111] sm:w-10" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Full-Width Navigation Drawer */}
      {menuOpen && (
        <div className="border-t border-[#e5e5e5] bg-white px-4 py-6 sm:px-8">
          <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {navLinks.map((item, idx) => {
              const isActive =
                item.to === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center justify-between border border-[#e5e5e5] p-4 text-xs font-semibold tracking-[0.03em] uppercase transition-colors ${
                    isActive
                      ? "border-[#e03127] bg-[#e03127] text-white"
                      : "bg-[#f4f4f5] text-[#111111] hover:bg-[#111111] hover:text-white"
                  }`}
                >
                  <span>
                    0{idx + 1} · {item.label}
                  </span>
                  <span>&gt;</span>
                </Link>
              );
            })}
            <Link
              to="/vender"
              onClick={() => setMenuOpen(false)}
              className="flex items-center justify-between border border-[#e03127] bg-white p-4 text-xs font-semibold tracking-[0.03em] uppercase text-[#e03127] transition-colors hover:bg-[#e03127] hover:text-white"
            >
              <span>05 · Publicar Reloj</span>
              <span>&gt;</span>
            </Link>
            <Link
              to="/mis-anuncios"
              onClick={() => setMenuOpen(false)}
              className="flex items-center justify-between border border-[#e5e5e5] bg-[#f4f4f5] p-4 text-xs font-semibold tracking-[0.03em] uppercase text-[#111111] transition-colors hover:bg-[#111111] hover:text-white"
            >
              <span>06 · Mis Anuncios</span>
              <span>&gt;</span>
            </Link>
            <Link
              to="/mensajes"
              onClick={() => setMenuOpen(false)}
              className="flex items-center justify-between border border-[#e5e5e5] bg-[#f4f4f5] p-4 text-xs font-semibold tracking-[0.03em] uppercase text-[#111111] transition-colors hover:bg-[#111111] hover:text-white"
            >
              <span>07 · Mensajes</span>
              <span>&gt;</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

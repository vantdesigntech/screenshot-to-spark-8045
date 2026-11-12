import { Link, useRouterState } from "@tanstack/react-router";
import { Search, User, X } from "lucide-react";
import { useState } from "react";

import { AnimatedThemeToggler } from "@/registry/magicui/animated-theme-toggler";

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
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-[68px] max-w-[1440px] items-center justify-between px-4 sm:h-[76px] sm:px-8">
        {/* Left: CRONORA Stencil Brand Logo */}
        <Link
          to="/"
          className="group relative flex items-center gap-2 text-foreground transition-opacity hover:opacity-80"
          aria-label="CRONORA Inicio"
        >
          <span className="aurik-brand relative select-none text-[19px] tracking-[0.2em] text-foreground sm:text-[23px] sm:tracking-[0.22em]">
            CRONORA
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-1/2 h-[1.5px] -translate-y-1/2 bg-background/75"
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
                      ? "text-primary"
                      : "text-foreground hover:text-primary"
                  }`}
                >
                  {isActive && (
                    <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-primary align-middle" />
                  )}
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Search & User/Watchbox Icons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <AnimatedThemeToggler
              variant="square"
              duration={450}
              aria-label="Cambiar entre modo claro y modo noche"
              className="flex h-9 w-9 items-center justify-center border border-border bg-background text-foreground transition-colors hover:bg-muted [&_svg]:h-[17px] [&_svg]:w-[17px]"
            />
            {onFocusSearch ? (
              <button
                type="button"
                onClick={onFocusSearch}
                aria-label="Ir al buscador"
                className="flex h-9 w-9 items-center justify-center text-foreground transition-colors hover:text-primary"
              >
                <Search className="h-[17px] w-[17px]" strokeWidth={1.6} />
              </button>
            ) : (
              <Link
                to="/"
                aria-label="Ir al buscador en Inicio"
                className="flex h-9 w-9 items-center justify-center text-foreground transition-colors hover:text-primary"
              >
                <Search className="h-[17px] w-[17px]" strokeWidth={1.6} />
              </Link>
            )}

            <Link
              to="/mi-caja"
              onClick={onOpenWatchbox}
              aria-label="Mi Caja: recambios favoritos y listas de compra"
              className="relative flex h-11 w-11 items-center justify-center text-foreground transition-colors hover:text-primary"
            >
              <User className="h-[17px] w-[17px]" strokeWidth={1.6} />
              {savedCount > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-4 min-w-[16px] items-center justify-center bg-primary px-1 font-mono text-[9px] font-bold text-primary-foreground">
                  {savedCount}
                </span>
              )}
            </Link>

            {/* Signature AURIK Two-Line Hamburger Button (Matches 2.webp / 3.webp / 4.webp) */}
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="Abrir menú de navegación"
              aria-expanded={menuOpen}
              className="flex h-9 w-11 flex-col items-end justify-center gap-[6px] pl-1 text-foreground transition-opacity hover:opacity-70"
            >
              {menuOpen ? (
                <X className="h-5 w-5 text-foreground" strokeWidth={1.6} />
              ) : (
                <>
                  <span className="block h-[1.5px] w-9 bg-foreground sm:w-10" />
                  <span className="block h-[1.5px] w-9 bg-foreground sm:w-10" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Full-Width Navigation Drawer */}
      {menuOpen && (
        <div className="border-t border-border bg-background px-4 py-6 sm:px-8">
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
                  className={`flex items-center justify-between border border-border p-4 text-xs font-semibold tracking-[0.03em] uppercase transition-colors ${
                    isActive
                      ? "border-primary bg-primary text-primary-foreground"
                      : "bg-muted text-foreground hover:bg-foreground hover:text-primary-foreground"
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
              className="flex items-center justify-between border border-primary bg-background p-4 text-xs font-semibold tracking-[0.03em] uppercase text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              <span>05 · Publicar Reloj</span>
              <span>&gt;</span>
            </Link>
            <Link
              to="/mis-anuncios"
              onClick={() => setMenuOpen(false)}
              className="flex items-center justify-between border border-border bg-muted p-4 text-xs font-semibold tracking-[0.03em] uppercase text-foreground transition-colors hover:bg-foreground hover:text-primary-foreground"
            >
              <span>06 · Mis Anuncios</span>
              <span>&gt;</span>
            </Link>
            <Link
              to="/mensajes"
              onClick={() => setMenuOpen(false)}
              className="flex items-center justify-between border border-border bg-muted p-4 text-xs font-semibold tracking-[0.03em] uppercase text-foreground transition-colors hover:bg-foreground hover:text-primary-foreground"
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

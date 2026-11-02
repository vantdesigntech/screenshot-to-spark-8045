import { Link, useRouterState } from "@tanstack/react-router";
import { X } from "lucide-react";
import { useState } from "react";

interface AurikNavbarProps {
  savedCount?: number;
  onOpenWatchbox?: () => void;
  onFocusSearch?: () => void;
  /** Float over a full-bleed hero photo (home page). */
  overlay?: boolean;
}

const pill =
  "uni-label flex h-9 items-center px-3 text-foreground transition-colors hover:text-primary";

export function AurikNavbar({
  savedCount = 0,
  onOpenWatchbox,
  onFocusSearch,
  overlay = false,
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

  const extraLinks = [
    { to: "/vender", label: "Publicar reloj" },
    { to: "/mis-anuncios", label: "Mis anuncios" },
    { to: "/mensajes", label: "Mensajes" },
  ] as const;

  const isActive = (to: string) =>
    to === "/" ? pathname === "/" : pathname.startsWith(to);

  return (
    <header
      className={`${overlay ? "absolute" : "sticky bg-background/90 backdrop-blur-sm"} inset-x-0 top-0 z-50 w-full`}
    >
      <div className="mx-auto flex max-w-[1920px] items-start justify-between gap-3 px-3 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            aria-label="CRONORA Inicio"
            className={`aurik-brand flex h-9 items-center text-[22px] sm:text-[26px] ${overlay ? "text-background" : "text-foreground"}`}
          >
            CRONORA
          </Link>

          <nav
            aria-label="Navegación principal"
            className="uni-glass hidden items-center px-2 lg:flex"
          >
            {navLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`${pill} ${isActive(item.to) ? "text-primary" : ""}`}
              >
                {item.label}
              </Link>
            ))}
            {extraLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`${pill} ${isActive(item.to) ? "text-primary" : ""}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="uni-glass flex items-center px-1 sm:px-2">
            {onFocusSearch ? (
              <button type="button" onClick={onFocusSearch} aria-label="Ir al buscador" className={pill}>
                Buscar
              </button>
            ) : (
              <Link to="/" aria-label="Ir al buscador en Inicio" className={pill}>
                Buscar
              </Link>
            )}

            {onOpenWatchbox ? (
              <button
                type="button"
                onClick={onOpenWatchbox}
                aria-label="Mi Caja de piezas guardadas"
                className={`${pill} gap-2`}
              >
                Mi caja
                {savedCount > 0 && <span className="h-2 w-2 rounded-full bg-primary" />}
              </button>
            ) : (
              <Link to="/favoritos" aria-label="Favoritos y cuenta" className={`${pill} gap-2`}>
                Mi caja
                {savedCount > 0 && <span className="h-2 w-2 rounded-full bg-primary" />}
              </Link>
            )}

            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="Abrir menú de navegación"
              aria-expanded={menuOpen}
              className={`${pill} lg:hidden`}
            >
              {menuOpen ? <X className="h-4 w-4" strokeWidth={1.6} /> : "Menú"}
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="px-3 pb-3 sm:px-6 lg:hidden">
          <div className="uni-glass grid grid-cols-1 gap-px overflow-hidden p-1 sm:grid-cols-2">
            {[...navLinks, ...extraLinks].map((item, idx) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMenuOpen(false)}
                className={`uni-label flex min-h-11 items-center justify-between rounded-[3px] px-3 transition-colors hover:bg-foreground hover:text-background ${
                  isActive(item.to) ? "bg-foreground text-background" : "text-foreground"
                }`}
              >
                <span>
                  0{idx + 1} · {item.label}
                </span>
                <span>→</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

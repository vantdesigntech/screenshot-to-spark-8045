import { useEffect, useState, type ReactNode } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import {
  ArrowLeft,
  Heart,
  Layers,
  MessageSquare,
  PlusCircle,
  ShieldCheck,
  Store,
  UserCheck,
  Watch,
} from 'lucide-react'
import {
  getCurrentUser,
  listMarketplaceAccounts,
  setCurrentUser,
  subscribeMarketplaceUpdates,
  getMyFavorites,
  getMyConversations,
} from '../services/marketplace-service'
import type { MarketplaceUser } from '../types'

interface MarketplaceShellProps {
  children: ReactNode
  title?: string
  subtitle?: string
  badgeText?: string
}

export function MarketplaceShell({
  children,
  title,
  subtitle,
  badgeText = 'CHRONOPARTS MARKETPLACE · COMPRAVENTA ENTRE COLECCIONISTAS',
}: MarketplaceShellProps) {
  const routerState = useRouterState()
  const pathname = routerState.location.pathname

  const [currentUser, setCurrentUserState] = useState<MarketplaceUser>(() =>
    getCurrentUser(),
  )
  const [favoritesCount, setFavoritesCount] = useState<number>(0)
  const [conversationsCount, setConversationsCount] = useState<number>(0)
  const accounts = listMarketplaceAccounts()

  const refreshCounts = async () => {
    try {
      const [favs, convs] = await Promise.all([
        getMyFavorites(),
        getMyConversations(),
      ])
      setFavoritesCount(favs.length)
      setConversationsCount(convs.length)
    } catch {
      // ignore count error
    }
  }

  useEffect(() => {
    setCurrentUserState(getCurrentUser())
    void refreshCounts()
    const unsubscribe = subscribeMarketplaceUpdates(() => {
      setCurrentUserState(getCurrentUser())
      void refreshCounts()
    })
    return unsubscribe
  }, [])

  const handleSwitchUser = (userId: string) => {
    const updated = setCurrentUser(userId)
    setCurrentUserState(updated)
  }

  const navItems = [
    {
      to: '/marketplace',
      label: 'Catálogo',
      icon: Store,
      active:
        pathname === '/marketplace' ||
        (pathname.startsWith('/marketplace/') && pathname !== '/marketplace'),
    },
    {
      to: '/vender',
      label: 'Publicar reloj',
      icon: PlusCircle,
      active: pathname.startsWith('/vender'),
    },
    {
      to: '/mis-anuncios',
      label:
        currentUser.role === 'moderator'
          ? 'Mis Anuncios & Moderación'
          : 'Mis Anuncios',
      icon: Layers,
      active: pathname.startsWith('/mis-anuncios'),
    },
    {
      to: '/favoritos',
      label: 'Favoritos',
      icon: Heart,
      badge: favoritesCount > 0 ? favoritesCount : undefined,
      active: pathname.startsWith('/favoritos'),
    },
    {
      to: '/mensajes',
      label: 'Mensajes',
      icon: MessageSquare,
      badge: conversationsCount > 0 ? conversationsCount : undefined,
      active: pathname.startsWith('/mensajes'),
    },
  ]

  return (
    <div className="min-h-screen bg-background text-primary-foreground flex flex-col selection:bg-primary selection:text-primary-foreground">
      {/* 1. GLOBAL NAV (#000000, 44px height) */}
      <nav aria-label="Navegación global" className="w-full bg-apple-black text-background">
        <div className="mx-auto flex h-[44px] max-w-[980px] items-center justify-between px-[22px]">
          <div className="flex items-center gap-6">
            <Link
              to="/"
              className="flex items-center gap-2 text-primary-foreground/80 transition hover:text-primary-foreground"
              title="Volver al ChronoParts y recambios"
            >
              <Watch className="h-4 w-4 text-primary-foreground" />
              <span className="text-[12px] font-semibold text-primary-foreground">
                ChronoParts
              </span>
            </Link>
            <Link to="/" className="apple-nav-link hidden sm:inline-block">
              Buscador de piezas
            </Link>
            <Link to="/blog" className="apple-nav-link hidden md:inline-block">
              Guías
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-full bg-background/10 px-2.5 py-1">
              <UserCheck className="w-3.5 h-3.5 text-apple-primary-dark shrink-0" />
              <label htmlFor="marketplace-user-select" className="sr-only">
                Sesión activa
              </label>
              <select
                id="marketplace-user-select"
                aria-label="Cambiar usuario activo del marketplace"
                value={currentUser.id}
                onChange={(e) => handleSwitchUser(e.target.value)}
                className="max-w-[145px] bg-transparent text-[12px] text-primary-foreground focus:outline-none cursor-pointer pr-1"
              >
                {accounts.map((acc) => (
                  <option
                    key={acc.id}
                    value={acc.id}
                    className="bg-foreground text-primary-foreground"
                  >
                    {acc.displayName}
                    {acc.role === 'moderator' ? ' (Moderador)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </nav>

      {/* 2. SUB-NAV FROSTED (52px height, #f5f5f7/80) */}
      <header className="apple-frosted sticky top-0 z-40 border-b border-border bg-secondary/80">
        <div className="mx-auto flex h-[52px] max-w-[980px] items-center justify-between gap-2 overflow-x-auto px-[22px] no-scrollbar">
          <nav
            aria-label="Navegación del Marketplace"
            className="flex items-center gap-1.5"
          >
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] whitespace-nowrap transition-all ${
                    item.active
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : 'text-foreground/75 hover:text-foreground'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span
                      className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${
                        item.active
                          ? 'bg-background text-primary'
                          : 'bg-primary/15 text-primary'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>

          <div className="hidden xl:flex items-center gap-2 text-[12px] text-muted-foreground">
            <span>
              Sesión:{' '}
              <strong className="text-foreground">
                {currentUser.displayName}
              </strong>{' '}
              ({currentUser.location})
            </span>
          </div>
        </div>
      </header>

      {/* Optional Hero Banner (Product Tile Light #ffffff, no gradients) */}
      {title && (
        <section className="w-full border-b border-border bg-background py-[48px] px-[22px]">
          <div className="max-w-[980px] mx-auto text-center">
            <p className="apple-caption font-semibold text-primary mb-2">
              {badgeText}
            </p>
            <h1 className="apple-display-lg text-[34px] sm:text-[44px] text-foreground">
              {title}
            </h1>
            {subtitle && (
              <p className="apple-tagline mt-2.5 text-[19px] text-muted-foreground max-w-2xl mx-auto">
                {subtitle}
              </p>
            )}
          </div>
        </section>
      )}

      {/* Main Content */}
      <main className="min-w-0 flex-1 max-w-[980px] w-full mx-auto px-[22px] py-10">
        {children}
      </main>

      {/* Footer consistent with Apple design system */}
      <footer className="border-t border-border bg-secondary py-[48px] px-[22px] mt-16">
        <div className="max-w-[980px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 apple-fine-print text-muted-foreground">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Watch className="w-3.5 h-3.5 text-primary" />
            <span className="font-semibold text-apple-ink-80">
              ChronoParts Marketplace
            </span>
            <span>
              · Arquitectura modular P2P.
            </span>
          </div>
          <p className="text-center sm:text-right max-w-md">
            La revisión fotográfica evalúa coherencia visual y documental; no
            sustituye una inspección relojera presencial ni garantiza
            autenticidad física.
          </p>
        </div>
      </footer>
    </div>
  )
}

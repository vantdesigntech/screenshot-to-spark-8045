import { useEffect, useState, type ReactNode } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import {
  Heart,
  Layers,
  MessageSquare,
  PlusCircle,
  Store,
  UserCheck,
} from 'lucide-react'
import { AurikNavbar } from '@/components/AurikNavbar'
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
  badgeText = 'CRONORA MARKETPLACE // COMPRAVENTA ENTRE COLECCIONISTAS',
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
    <div className="min-h-screen bg-white text-[#111111] flex flex-col">
      {/* 1. SHARED AURIK GLOBAL NAVBAR */}
      <AurikNavbar savedCount={favoritesCount} />

      {/* 2. MARKETPLACE SUB-HEADER BAR (Sharp AURIK 0px borders) */}
      <div className="border-b border-[#e5e5e5] bg-[#f4f4f5]">
        <div className="mx-auto flex min-h-[52px] max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 py-2 sm:px-8">
          <nav
            aria-label="Navegación del Marketplace"
            className="flex flex-wrap items-center gap-2"
          >
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={
                    item.active ? 'aurik-btn-red' : 'aurik-btn-gray bg-white'
                  }
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="ml-1 px-1.5 py-0.2 font-mono text-[10px]">
                      [{item.badge}]
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Active Collector Session Switcher */}
          <div className="flex items-center gap-2 border border-[#e5e5e5] bg-white px-3 py-1.5">
            <UserCheck className="h-3.5 w-3.5 text-[#e03127] shrink-0" />
            <label htmlFor="marketplace-user-select" className="sr-only">
              Sesión activa
            </label>
            <select
              id="marketplace-user-select"
              aria-label="Cambiar usuario activo del marketplace"
              value={currentUser.id}
              onChange={(e) => handleSwitchUser(e.target.value)}
              className="bg-transparent font-mono text-[11px] uppercase tracking-[0.06em] text-[#111111] focus:outline-none cursor-pointer"
            >
              {accounts.map((acc) => (
                <option
                  key={acc.id}
                  value={acc.id}
                  className="bg-white text-[#111111]"
                >
                  {acc.displayName}
                  {acc.role === 'moderator' ? ' (Moderador)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Optional Hero Banner in AURIK Editorial Style */}
      {title && (
        <section className="mx-auto w-full max-w-[1440px] border-b border-[#e5e5e5] px-4 py-10 sm:px-8 sm:py-14">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <div className="aurik-section-tag">
                <span className="aurik-dot" />
                <span>{badgeText}</span>
              </div>
            </div>
            <div className="lg:col-span-8">
              <h1 className="aurik-hero-title text-2xl sm:text-4xl">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#52525b]">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Main Content */}
      <main className="flex-1 mx-auto w-full max-w-[1440px] px-4 py-10 sm:px-8">
        {children}
      </main>

      {/* CRONORA Technical Footer */}
      <footer className="border-t border-[#e5e5e5] bg-[#f4f4f5] py-10 px-4 sm:px-8 mt-16">
        <div className="mx-auto max-w-[1440px] flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px] uppercase tracking-[0.08em] text-[#71717a]">
          <div className="flex items-center gap-2">
            <span className="text-[#e03127]">●</span>
            <span className="font-semibold text-[#111111]">
              CRONORA MARKETPLACE // P2P HOROLOGY EXCHANGE
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/" className="hover:text-[#111111]">
              INICIO &gt;
            </Link>
            <Link to="/chollos" className="hover:text-[#111111]">
              CHOLLOS &gt;
            </Link>
            <Link to="/blog" className="hover:text-[#111111]">
              GUÍAS &gt;
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

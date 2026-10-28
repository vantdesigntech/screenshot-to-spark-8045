import { useCallback, useEffect, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  AlertCircle,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  PlusCircle,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react'
import { MarketplaceShell } from '../marketplace/components/MarketplaceShell'
import { ListingCard } from '../marketplace/components/ListingCard'
import {
  getAvailableBrands,
  queryCatalogListings,
  subscribeMarketplaceUpdates,
  toggleFavoriteListing,
} from '../marketplace/services/marketplace-service'
import {
  CONDITION_LABELS,
  MOVEMENT_LABELS,
  type ListingFilterParams,
  type MovementType,
  type WatchCondition,
  type WatchListing,
} from '../marketplace/types'

export const Route = createFileRoute('/marketplace/')({
  head: () => ({
    meta: [
      {
        title:
          'Marketplace de Relojes Completos | ChronoParts — Compraventa con Revisión Fotográfica',
      },
      {
        name: 'description',
        content:
          'Explora relojes mecánicos y de cuarzo publicados por coleccionistas. Filtros reales por marca, referencia, calibre, estado y revisión fotográfica.',
      },
    ],
  }),
  component: MarketplaceCatalogPage,
})

export function MarketplaceCatalogPage() {
  const [listings, setListings] = useState<WatchListing[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [brands, setBrands] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  // Real data-driven filter state
  const [query, setQuery] = useState('')
  const [brand, setBrand] = useState('')
  const [reference, setReference] = useState('')
  const [minPrice, setMinPrice] = useState<string>('')
  const [maxPrice, setMaxPrice] = useState<string>('')
  const [condition, setCondition] = useState<WatchCondition | 'all'>('all')
  const [movement, setMovement] = useState<MovementType | 'all'>('all')
  const [location, setLocation] = useState('')
  const [sortBy, setSortBy] =
    useState<NonNullable<ListingFilterParams['sortBy']>>('newest')
  const [page, setPage] = useState(1)
  const pageSize = 6

  const loadCatalog = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const parsedMin =
        minPrice.trim() !== '' && !Number.isNaN(Number(minPrice))
          ? Number(minPrice)
          : undefined
      const parsedMax =
        maxPrice.trim() !== '' && !Number.isNaN(Number(maxPrice))
          ? Number(maxPrice)
          : undefined

      const [result, brandList] = await Promise.all([
        queryCatalogListings({
          query,
          brand: brand || undefined,
          reference: reference || undefined,
          minPrice: parsedMin,
          maxPrice: parsedMax,
          condition,
          movement,
          location: location || undefined,
          sortBy,
          page,
          pageSize,
        }),
        getAvailableBrands(),
      ])

      setListings(result.items)
      setTotal(result.total)
      setTotalPages(result.totalPages)
      setBrands(brandList)
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'No se pudo cargar el catálogo de relojes.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [
    query,
    brand,
    reference,
    minPrice,
    maxPrice,
    condition,
    movement,
    location,
    sortBy,
    page,
  ])

  useEffect(() => {
    void loadCatalog()
  }, [loadCatalog])

  useEffect(() => {
    const unsubscribe = subscribeMarketplaceUpdates(() => {
      void loadCatalog()
    })
    return unsubscribe
  }, [loadCatalog])

  const handleResetFilters = () => {
    setQuery('')
    setBrand('')
    setReference('')
    setMinPrice('')
    setMaxPrice('')
    setCondition('all')
    setMovement('all')
    setLocation('')
    setSortBy('newest')
    setPage(1)
  }

  const handleToggleFavorite = async (listingId: string) => {
    try {
      await toggleFavoriteListing(listingId)
      await loadCatalog()
    } catch (err) {
      alert(
        err instanceof Error ? err.message : 'Error al actualizar favoritos',
      )
    }
  }

  const hasActiveFilters = Boolean(
    query.trim() ||
      brand ||
      reference.trim() ||
      minPrice.trim() ||
      maxPrice.trim() ||
      condition !== 'all' ||
      movement !== 'all' ||
      location.trim(),
  )

  return (
    <MarketplaceShell
      title="Catálogo de Relojes entre Coleccionistas"
      subtitle="Explora relojes completos con trazabilidad documental y control fotográfico de 4 a 10 ángulos. Filtra en tiempo real por referencia exacta, calibre, estado de conservación y ubicación."
    >
      {/* Transparency & Photographic Review Banner */}
      <div className="mb-8 rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-soft flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/15 text-accent flex items-center justify-center shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              Protocolo de Revisión Fotográfica ChronoParts
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border">
                Sin falsas promesas
              </span>
            </h2>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed max-w-3xl">
              Verificamos que cada anuncio incluya fotografías nítidas de esfera,
              trasera, corona y cierre, ocultando públicamente los números de
              serie completos.{' '}
              <strong className="text-foreground">
                La revisión fotográfica reduce riesgos de anuncios fraudulentos,
                pero no garantiza autenticidad física.
              </strong>
            </p>
          </div>
        </div>

        <Link
          to="/vender"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-accent-foreground text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          Vender un Reloj
        </Link>
      </div>

      {/* Top Search & Sort Controls */}
      <div className="bg-card rounded-2xl border border-border p-4 sm:p-5 shadow-soft mb-6 space-y-4">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setPage(1)
              }}
              placeholder="Buscar por marca, modelo, referencia (ej. SKX007, 310.30.42, BB58) o calibre..."
              aria-label="Buscar relojes en el marketplace"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent"
            />
          </div>

          {/* Sort Select */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-background border border-border rounded-xl px-3 py-2">
              <ArrowUpDown className="w-4 h-4 text-accent shrink-0" />
              <label htmlFor="marketplace-sort" className="text-xs text-muted-foreground whitespace-nowrap">
                Ordenar:
              </label>
              <select
                id="marketplace-sort"
                value={sortBy}
                onChange={(e) => {
                  setSortBy(
                    e.target.value as NonNullable<ListingFilterParams['sortBy']>,
                  )
                  setPage(1)
                }}
                className="bg-transparent text-xs font-semibold text-foreground focus:outline-none cursor-pointer"
              >
                <option value="newest" className="bg-card">
                  Más recientes primero
                </option>
                <option value="oldest" className="bg-card">
                  Más antiguos primero
                </option>
                <option value="price_asc" className="bg-card">
                  Precio: menor a mayor
                </option>
                <option value="price_desc" className="bg-card">
                  Precio: mayor a menor
                </option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => setShowMobileFilters((v) => !v)}
              className="lg:hidden inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-secondary text-foreground text-xs font-semibold border border-border cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4 text-accent" />
              Filtros
            </button>
          </div>
        </div>

        {/* Detailed Filter Grid (Always visible on desktop, toggleable on mobile) */}
        <div
          className={`${
            showMobileFilters ? 'grid' : 'hidden lg:grid'
          } grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 pt-3 border-t border-border/70`}
        >
          {/* Brand */}
          <div>
            <label
              htmlFor="filter-brand"
              className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1"
            >
              Marca
            </label>
            <select
              id="filter-brand"
              value={brand}
              onChange={(e) => {
                setBrand(e.target.value)
                setPage(1)
              }}
              className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs text-foreground focus:outline-none focus:border-accent"
            >
              <option value="">Todas las marcas</option>
              {brands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Reference */}
          <div>
            <label
              htmlFor="filter-reference"
              className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1"
            >
              Referencia
            </label>
            <input
              id="filter-reference"
              type="text"
              value={reference}
              onChange={(e) => {
                setReference(e.target.value)
                setPage(1)
              }}
              placeholder="Ej. M79030N, SKX007"
              className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent"
            />
          </div>

          {/* Price Range */}
          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <label
                htmlFor="filter-min-price"
                className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1"
              >
                Mín (€)
              </label>
              <input
                id="filter-min-price"
                type="number"
                min={0}
                value={minPrice}
                onChange={(e) => {
                  setMinPrice(e.target.value)
                  setPage(1)
                }}
                placeholder="0"
                className="w-full px-2.5 py-2 rounded-xl bg-background border border-border text-xs text-foreground focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label
                htmlFor="filter-max-price"
                className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1"
              >
                Máx (€)
              </label>
              <input
                id="filter-max-price"
                type="number"
                min={0}
                value={maxPrice}
                onChange={(e) => {
                  setMaxPrice(e.target.value)
                  setPage(1)
                }}
                placeholder="15000"
                className="w-full px-2.5 py-2 rounded-xl bg-background border border-border text-xs text-foreground focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          {/* Watch Condition */}
          <div>
            <label
              htmlFor="filter-condition"
              className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1"
            >
              Estado del reloj
            </label>
            <select
              id="filter-condition"
              value={condition}
              onChange={(e) => {
                setCondition(e.target.value as WatchCondition | 'all')
                setPage(1)
              }}
              className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs text-foreground focus:outline-none focus:border-accent"
            >
              <option value="all">Cualquier estado</option>
              {(Object.keys(CONDITION_LABELS) as WatchCondition[]).map((c) => (
                <option key={c} value={c}>
                  {CONDITION_LABELS[c]}
                </option>
              ))}
            </select>
          </div>

          {/* Movement Type */}
          <div>
            <label
              htmlFor="filter-movement"
              className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1"
            >
              Movimiento
            </label>
            <select
              id="filter-movement"
              value={movement}
              onChange={(e) => {
                setMovement(e.target.value as MovementType | 'all')
                setPage(1)
              }}
              className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs text-foreground focus:outline-none focus:border-accent"
            >
              <option value="all">Todos los calibres</option>
              {(Object.keys(MOVEMENT_LABELS) as MovementType[]).map((m) => (
                <option key={m} value={m}>
                  {MOVEMENT_LABELS[m]}
                </option>
              ))}
            </select>
          </div>

          {/* Approximate Location */}
          <div>
            <label
              htmlFor="filter-location"
              className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1"
            >
              Ubicación aprox.
            </label>
            <input
              id="filter-location"
              type="text"
              value={location}
              onChange={(e) => {
                setLocation(e.target.value)
                setPage(1)
              }}
              placeholder="Madrid, Barcelona, Valencia..."
              className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        {/* Active Filter Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/50 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-accent" />
            <span>
              Mostrando <strong className="text-foreground">{listings.length}</strong> de{' '}
              <strong className="text-foreground">{total}</strong> relojes publicados
            </span>
            <span className="hidden sm:inline text-[11px]">
              · Los anuncios semilla llevan insignia <strong>DEMO</strong> para
              distinguirlos de tus publicaciones reales.
            </span>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="py-20 text-center space-y-3 bg-card rounded-2xl border border-border">
          <Loader2 className="w-8 h-8 text-accent animate-spin mx-auto" />
          <p className="text-sm font-medium text-muted-foreground">
            Consultando anuncios y estado de revisión fotográfica...
          </p>
        </div>
      )}

      {/* Error State */}
      {!isLoading && errorMessage && (
        <div className="py-12 px-6 text-center bg-red-500/10 border border-red-500/30 rounded-2xl space-y-3">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
          <h3 className="font-serif text-xl text-foreground">
            Error al cargar el catálogo
          </h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            {errorMessage}
          </p>
          <button
            type="button"
            onClick={() => void loadCatalog()}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Empty Results State */}
      {!isLoading && !errorMessage && listings.length === 0 && (
        <div className="py-16 px-6 text-center bg-card rounded-2xl border border-border space-y-4">
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto text-muted-foreground">
            <Sparkles className="w-6 h-6 text-accent" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif text-2xl text-foreground">
              No se encontraron relojes con esos criterios
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
              Prueba a ampliar el rango de precios, limpiar los filtros activos o
              publicar el primer anuncio de esa referencia.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-4 py-2 rounded-xl bg-secondary text-foreground text-xs font-semibold border border-border hover:bg-secondary/80 cursor-pointer"
            >
              Restablecer todos los filtros
            </button>
            <Link
              to="/vender"
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold"
            >
              Publicar un reloj ahora
            </Link>
          </div>
        </div>
      )}

      {/* Listings Grid */}
      {!isLoading && !errorMessage && listings.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((item) => (
              <ListingCard
                key={item.id}
                listing={item}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-card border border-border text-xs font-semibold disabled:opacity-40 hover:bg-secondary transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </button>

              <span className="px-4 py-2 text-xs font-semibold text-muted-foreground">
                Página <strong className="text-foreground">{page}</strong> de{' '}
                <strong className="text-foreground">{totalPages}</strong>
              </span>

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-card border border-border text-xs font-semibold disabled:opacity-40 hover:bg-secondary transition-colors cursor-pointer"
              >
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </MarketplaceShell>
  )
}

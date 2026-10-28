import { useCallback, useEffect, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Heart, Store } from 'lucide-react'
import { MarketplaceShell } from '../marketplace/components/MarketplaceShell'
import { ListingCard } from '../marketplace/components/ListingCard'
import {
  getCurrentUser,
  getMyFavorites,
  subscribeMarketplaceUpdates,
  toggleFavoriteListing,
} from '../marketplace/services/marketplace-service'
import type { WatchListing } from '../marketplace/types'

export const Route = createFileRoute('/favoritos')({
  head: () => ({
    meta: [
      {
        title: 'Mis Relojes Favoritos | ChronoParts Marketplace',
      },
    ],
  }),
  component: FavoritesPage,
})

export function FavoritesPage() {
  const [favorites, setFavorites] = useState<WatchListing[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const currentUser = getCurrentUser()

  const loadFavorites = useCallback(async () => {
    setIsLoading(true)
    try {
      const items = await getMyFavorites()
      setFavorites(items)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadFavorites()
    const unsubscribe = subscribeMarketplaceUpdates(() => {
      void loadFavorites()
    })
    return unsubscribe
  }, [loadFavorites])

  const handleToggleFavorite = async (listingId: string) => {
    await toggleFavoriteListing(listingId)
    await loadFavorites()
  }

  return (
    <MarketplaceShell
      title="Relojes Guardados en Favoritos"
      subtitle={`Lista personal de seguimiento de ${currentUser.displayName}. Compara referencias, precios y estado de revisión fotográfica.`}
    >
      {isLoading ? (
        <div className="py-16 text-center text-sm text-muted-foreground">
          Cargando tus relojes guardados...
        </div>
      ) : favorites.length === 0 ? (
        <div className="py-16 px-6 text-center bg-card rounded-2xl border border-border space-y-4 max-w-xl mx-auto">
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto text-accent">
            <Heart className="w-6 h-6" />
          </div>
          <h2 className="font-serif text-2xl text-foreground">
            Todavía no tienes relojes en favoritos
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Pulsa el icono del corazón en cualquier anuncio del catálogo para
            guardarlo aquí sin duplicados.
          </p>
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold"
          >
            <Store className="w-4 h-4" />
            Explorar el catálogo
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((item) => (
            <ListingCard
              key={item.id}
              listing={item}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </div>
      )}
    </MarketplaceShell>
  )
}

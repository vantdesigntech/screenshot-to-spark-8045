import { Link } from '@tanstack/react-router'
import {
  Calendar,
  FileCheck2,
  Gauge,
  Heart,
  MapPin,
  Package,
  Sparkles,
} from 'lucide-react'
import {
  CONDITION_LABELS,
  MOVEMENT_LABELS,
  type WatchListing,
} from '../types'
import { PhotoReviewBadge } from './PhotoReviewBadge'

interface ListingCardProps {
  listing: WatchListing
  onToggleFavorite?: (listingId: string) => void
}

export function ListingCard({ listing, onToggleFavorite }: ListingCardProps) {
  const coverImage =
    listing.images[0]?.url ||
    'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=900&q=80'

  const formattedPrice = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(listing.priceEur)

  return (
    <article className="bg-card rounded-2xl border border-border overflow-hidden shadow-soft hover:border-accent/45 transition-all flex flex-col group">
      {/* Main Watch Image */}
      <div className="relative h-56 bg-secondary overflow-hidden">
        <Link
          to="/marketplace/$id"
          params={{ id: listing.id }}
          className="block w-full h-full"
        >
          <img
            src={coverImage}
            alt={`${listing.brand} ${listing.model}`}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </Link>

        {/* Top Left Badges: Condition + Demo vs Real indicator */}
        <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-background/90 backdrop-blur-md text-foreground border border-border">
            {CONDITION_LABELS[listing.condition]}
          </span>
          {listing.isDemo ? (
            <span
              className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-secondary/90 backdrop-blur-md text-muted-foreground border border-border"
              title="Anuncio de demostración del catálogo semilla"
            >
              Demo
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-accent text-accent-foreground shadow-sm inline-flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              Comunidad
            </span>
          )}
        </div>

        {/* Top Right Favorite Toggle */}
        {onToggleFavorite && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onToggleFavorite(listing.id)
            }}
            aria-label={
              listing.isFavorited
                ? 'Quitar de favoritos'
                : 'Guardar en favoritos'
            }
            className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md border transition-all cursor-pointer ${
              listing.isFavorited
                ? 'bg-destructive text-foreground border-destructive shadow-sm'
                : 'bg-background/85 text-foreground border-border hover:bg-background'
            }`}
          >
            <Heart
              className={`w-4 h-4 ${listing.isFavorited ? 'fill-current' : ''}`}
            />
          </button>
        )}

        {/* Bottom Overlay: Photo Review Status Badge */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
          <div className="bg-background/90 backdrop-blur-md rounded-full p-0.5 shadow-sm">
            <PhotoReviewBadge status={listing.reviewStatus} compact />
          </div>
          {listing.status !== 'published' && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary text-primary-foreground">
              {listing.status}
            </span>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground mb-1">
            <span className="font-bold uppercase tracking-wider text-accent">
              {listing.brand}
            </span>
            {listing.reference && (
              <span className="font-mono text-[11px] bg-secondary px-2 py-0.5 rounded text-foreground">
                Ref. {listing.reference}
              </span>
            )}
          </div>

          <Link
            to="/marketplace/$id"
            params={{ id: listing.id }}
            className="block group-hover:text-accent transition-colors"
          >
            <h3 className="font-serif text-xl text-foreground leading-snug line-clamp-1">
              {listing.model}
            </h3>
          </Link>

          <p className="text-xs text-muted-foreground line-clamp-2 mt-1.5 leading-relaxed">
            {listing.description}
          </p>

          {/* Specs Pills */}
          <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-border/60 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1.5 truncate">
              <Gauge className="w-3.5 h-3.5 text-accent shrink-0" />
              <span className="truncate">
                {MOVEMENT_LABELS[listing.movement]}
              </span>
            </div>
            <div className="flex items-center gap-1.5 truncate">
              <MapPin className="w-3.5 h-3.5 text-accent shrink-0" />
              <span className="truncate">{listing.location}</span>
            </div>
            <div className="flex items-center gap-1.5 truncate">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span>
                {listing.approxYear ? `Año ~${listing.approxYear}` : 'Año N/D'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 truncate">
              {listing.boxIncluded && listing.papersIncluded ? (
                <>
                  <FileCheck2 className="w-3.5 h-3.5 text-success shrink-0" />
                  <span className="text-emerald-700 font-medium">
                    Full Set (Caja+Doc)
                  </span>
                </>
              ) : (
                <>
                  <Package className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span>
                    {listing.boxIncluded
                      ? 'Con estuche'
                      : listing.papersIncluded
                        ? 'Con papeles'
                        : 'Solo reloj'}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Price and CTA */}
        <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">
              Precio
            </span>
            <span className="font-serif text-2xl text-foreground leading-none">
              {formattedPrice}
            </span>
          </div>

          <Link
            to="/marketplace/$id"
            params={{ id: listing.id }}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            Ver Ficha
          </Link>
        </div>
      </div>
    </article>
  )
}

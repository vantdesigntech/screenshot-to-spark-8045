import { Link } from '@tanstack/react-router'
import { Heart } from 'lucide-react'
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
    <article className="flex flex-col bg-white group">
      {/* 1. Light Gray Image Container (#F4F4F5 like 3.webp) */}
      <div className="relative aspect-square w-full overflow-hidden bg-[#f4f4f5] p-6">
        <Link
          to="/marketplace/$id"
          params={{ id: listing.id }}
          className="block h-full w-full"
        >
          <img
            src={coverImage}
            alt={`${listing.brand} ${listing.model}`}
            loading="lazy"
            className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
          />
        </Link>

        {/* Top Left Badges */}
        <div className="absolute left-3 top-3 flex flex-wrap items-center gap-1.5">
          <span className="border border-[#e5e5e5] bg-white px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-[#111111]">
            {CONDITION_LABELS[listing.condition]}
          </span>
          {listing.isDemo ? (
            <span
              className="border border-[#e5e5e5] bg-white px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-[#71717a]"
              title="Anuncio de demostración del catálogo semilla"
            >
              Demo
            </span>
          ) : (
            <span className="bg-[#e03127] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-white">
              Comunidad ●
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
            className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center border transition-colors cursor-pointer ${
              listing.isFavorited
                ? 'border-[#e03127] bg-[#e03127] text-white'
                : 'border-[#e5e5e5] bg-white text-[#111111] hover:border-[#111111]'
            }`}
          >
            <Heart
              className={`h-3.5 w-3.5 ${
                listing.isFavorited ? 'fill-current' : ''
              }`}
            />
          </button>
        )}

        {/* Bottom Overlay: Photo Review Status Badge */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
          <div className="bg-white/95 border border-[#e5e5e5] px-1.5 py-0.5">
            <PhotoReviewBadge status={listing.reviewStatus} compact />
          </div>
          {listing.status !== 'published' && (
            <span className="bg-[#111111] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-white">
              {listing.status}
            </span>
          )}
        </div>
      </div>

      {/* 2. Title + Red Rectangular CTA (Matches 3.webp) */}
      <div className="mt-4 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#71717a]">
            {listing.brand}{' '}
            {listing.reference ? `// Ref. ${listing.reference}` : ''}
          </p>
          <Link
            to="/marketplace/$id"
            params={{ id: listing.id }}
            className="block hover:text-[#e03127] transition-colors"
          >
            <h3 className="mt-0.5 text-sm font-semibold tracking-tight text-[#111111] line-clamp-1">
              {listing.model}
            </h3>
          </Link>
        </div>

        <Link
          to="/marketplace/$id"
          params={{ id: listing.id }}
          className="aurik-btn-red shrink-0 px-3 py-1.5 text-[10px]"
        >
          <span>Ver Ficha</span>
          <span>&gt;</span>
        </Link>
      </div>

      {/* 3. Horizontal Hairline Spec Rows (1px solid #e5e5e5 like 3.webp) */}
      <div className="mt-4 border-t border-[#e5e5e5]">
        <div className="aurik-spec-row">
          <span className="aurik-spec-label">PRECIO</span>
          <span className="aurik-spec-value font-semibold text-[#111111]">
            {formattedPrice}
          </span>
        </div>
        <div className="aurik-spec-row">
          <span className="aurik-spec-label">MOVIMIENTO</span>
          <span className="aurik-spec-value">
            {MOVEMENT_LABELS[listing.movement]}
          </span>
        </div>
        <div className="aurik-spec-row">
          <span className="aurik-spec-label">UBICACIÓN / AÑO</span>
          <span className="aurik-spec-value">
            {listing.location} ·{' '}
            {listing.approxYear ? `~${listing.approxYear}` : 'N/D'}
          </span>
        </div>
        <div className="aurik-spec-row">
          <span className="aurik-spec-label">DOTACIÓN</span>
          <span className="aurik-spec-value">
            {listing.boxIncluded && listing.papersIncluded
              ? 'Full Set (Caja+Doc)'
              : listing.boxIncluded
                ? 'Con estuche'
                : listing.papersIncluded
                  ? 'Con papeles'
                  : 'Solo reloj'}
          </span>
        </div>
      </div>
    </article>
  )
}

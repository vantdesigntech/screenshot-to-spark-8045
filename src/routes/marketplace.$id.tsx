import { useCallback, useEffect, useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Edit3,
  FileCheck2,
  Flag,
  Gauge,
  Heart,
  Lock,
  MapPin,
  MessageSquare,
  Package,
  ShieldCheck,
  Sparkles,
  User,
} from 'lucide-react'
import { MarketplaceShell } from '../marketplace/components/MarketplaceShell'
import { PhotoReviewBadge } from '../marketplace/components/PhotoReviewBadge'
import {
  createListingReport,
  getCurrentUser,
  getListingById,
  getListingReviewHistory,
  moderatorTransitionReviewStatus,
  startOrSendMessageToListing,
  subscribeMarketplaceUpdates,
  toggleFavoriteListing,
  updateListingCommercialStatus,
} from '../marketplace/services/marketplace-service'
import {
  COMMERCIAL_STATUS_LABELS,
  CONDITION_LABELS,
  MOVEMENT_LABELS,
  PHOTO_SLOT_SPECS,
  type AuthenticityReviewRecord,
  type ListingCommercialStatus,
  type ReviewStatus,
  type WatchListing,
} from '../marketplace/types'

export const Route = createFileRoute('/marketplace/$id')({
  head: () => ({
    meta: [
      { property: 'og:title', content: 'Ficha de reloj — ChronoParts Marketplace' },
      { property: 'og:description', content: 'Consulta fotos, estado, precio y detalles del reloj.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'description', content: 'Consulta fotos, estado, precio y detalles del reloj.' },
      {
        title: 'Ficha de Reloj | ChronoParts Marketplace',
      },
    ],
  }),
  component: ListingDetailPage,
})

export function ListingDetailPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()

  const [listing, setListing] = useState<WatchListing | null>(null)
  const [reviewHistory, setReviewHistory] = useState<AuthenticityReviewRecord[]>(
    [],
  )
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Contact Seller Modal / Panel
  const [showContactForm, setShowContactForm] = useState(false)
  const [messageText, setMessageText] = useState('')
  const [isSendingMessage, setIsSendingMessage] = useState(false)

  // Report Listing Modal / Panel
  const [showReportForm, setShowReportForm] = useState(false)
  const [reportReason, setReportReason] = useState(
    'Incoherencia entre fotografías y referencia declarada',
  )
  const [reportDetails, setReportDetails] = useState('')
  const [reportSuccess, setReportSuccess] = useState<string | null>(null)

  // Moderator action feedback
  const [modNotes, setModNotes] = useState('')
  const [actionFeedback, setActionFeedback] = useState<string | null>(null)

  const currentUser = getCurrentUser()

  const loadDetail = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const found = await getListingById(id)
      if (!found) {
        setListing(null)
        setErrorMessage(
          'El anuncio solicitado no existe, es un borrador privado o ha sido retirado.',
        )
        return
      }
      setListing(found)
      const history = await getListingReviewHistory(found.id)
      setReviewHistory(history)
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Error al cargar el anuncio.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    void loadDetail()
  }, [loadDetail])

  useEffect(() => {
    const unsubscribe = subscribeMarketplaceUpdates(() => {
      void loadDetail()
    })
    return unsubscribe
  }, [loadDetail])

  const handleToggleFavorite = async () => {
    if (!listing) return
    try {
      await toggleFavoriteListing(listing.id)
      await loadDetail()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al guardar favorito')
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!listing || !messageText.trim()) return
    setIsSendingMessage(true)
    try {
      const res = await startOrSendMessageToListing(listing.id, messageText)
      setMessageText('')
      setShowContactForm(false)
      await navigate({
        to: '/mensajes',
        search: { conversationId: res.conversation.id },
      })
    } catch (err) {
      alert(
        err instanceof Error ? err.message : 'No se pudo enviar el mensaje.',
      )
    } finally {
      setIsSendingMessage(false)
    }
  }

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!listing) return
    try {
      await createListingReport({
        listingId: listing.id,
        reason: reportReason,
        details: reportDetails,
      })
      setReportSuccess(
        'Denuncia registrada correctamente. El equipo de moderación revisará las imágenes y la descripción.',
      )
      setReportDetails('')
      setTimeout(() => {
        setShowReportForm(false)
        setReportSuccess(null)
      }, 3000)
    } catch (err) {
      alert(
        err instanceof Error ? err.message : 'No se pudo registrar la denuncia.',
      )
    }
  }

  const handleOwnerStatusChange = async (
    nextStatus: ListingCommercialStatus,
  ) => {
    if (!listing) return
    try {
      await updateListingCommercialStatus(listing.id, nextStatus)
      setActionFeedback(
        `Estado del anuncio actualizado a: ${COMMERCIAL_STATUS_LABELS[nextStatus]}`,
      )
      await loadDetail()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al cambiar estado')
    }
  }

  const handleModeratorDecision = async (nextReview: ReviewStatus) => {
    if (!listing) return
    try {
      await moderatorTransitionReviewStatus({
        listingId: listing.id,
        nextStatus: nextReview,
        internalReason:
          modNotes.trim() ||
          `Actualización manual por moderador (${currentUser.displayName}).`,
      })
      setModNotes('')
      setActionFeedback(
        `Estado de revisión fotográfica actualizado a "${nextReview}".`,
      )
      await loadDetail()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error de moderación')
    }
  }

  if (isLoading) {
    return (
      <MarketplaceShell>
        <div className="py-20 text-center text-sm text-muted-foreground">
          Cargando ficha técnica y galería del reloj...
        </div>
      </MarketplaceShell>
    )
  }

  if (errorMessage || !listing) {
    return (
      <MarketplaceShell>
        <div className="py-16 px-6 text-center bg-card rounded-2xl border border-border max-w-xl mx-auto space-y-4">
          <AlertTriangle className="w-10 h-10 text-primary mx-auto" />
          <h2 className="font-serif text-2xl text-foreground">
            Anuncio no disponible
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {errorMessage}
          </p>
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al catálogo
          </Link>
        </div>
      </MarketplaceShell>
    )
  }

  const isOwner = listing.ownerId === currentUser.id
  const isModerator = currentUser.role === 'moderator'
  const activeImage =
    listing.images[selectedImageIndex] || listing.images[0] || null

  const formattedPrice = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(listing.priceEur)

  const publishedDate = new Date(
    listing.publishedAt || listing.createdAt,
  ).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  const slotLabel = (slot: string) =>
    PHOTO_SLOT_SPECS.find((s) => s.slot === slot)?.label || 'Fotografía'

  return (
    <MarketplaceShell>
      {/* Breadcrumb & Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <Link
          to="/marketplace"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al catálogo de relojes
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {listing.isDemo ? (
            <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-secondary text-muted-foreground border border-border">
              Anuncio de Demostración (Catálogo Semilla)
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-accent/15 text-accent border border-accent/30 inline-flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Anuncio Real de Usuario
            </span>
          )}

          <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-card border border-border text-foreground">
            Estado comercial: {COMMERCIAL_STATUS_LABELS[listing.status]}
          </span>
        </div>
      </div>

      {actionFeedback && (
        <div className="mb-6 p-3.5 rounded-xl bg-success/10 border border-success/30 text-success text-xs font-medium flex items-center justify-between">
          <span>{actionFeedback}</span>
          <button
            type="button"
            onClick={() => setActionFeedback(null)}
            className="text-xs underline ml-4"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Photo Gallery & Description (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Primary Image Viewer */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-soft">
            <div className="relative aspect-[4/3] bg-secondary">
              {activeImage ? (
                <img
                  src={activeImage.url}
                  alt={
                    activeImage.caption || `${listing.brand} ${listing.model}`
                  }
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                  Sin imagen disponible
                </div>
              )}

              {activeImage && (
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 bg-background/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-border text-xs">
                  <span className="font-bold text-foreground">
                    Ángulo {selectedImageIndex + 1}/{listing.images.length}:{' '}
                    <span className="text-accent">
                      {slotLabel(activeImage.slot)}
                    </span>
                  </span>
                  {activeImage.caption && (
                    <span className="text-muted-foreground truncate max-w-xs">
                      {activeImage.caption}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Thumbnail Strip */}
            {listing.images.length > 1 && (
              <div className="p-3 bg-card border-t border-border flex items-center gap-2.5 overflow-x-auto">
                {listing.images.map((img, idx) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative w-20 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                      idx === selectedImageIndex
                        ? 'border-accent scale-105 shadow-sm'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img.url}
                      alt={slotLabel(img.slot)}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Photographic Review Status & Explicit Limits */}
          <PhotoReviewBadge status={listing.reviewStatus} showDetails />

          {/* Detailed Description & Seller Declaration */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-soft space-y-5">
            <div>
              <h2 className="font-serif text-2xl text-foreground mb-2">
                Descripción y Estado de la Pieza
              </h2>
              <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
                {listing.description}
              </p>
            </div>

            <div className="pt-4 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Accesorios y Dotación Incluida
                </span>
                <p className="text-xs text-foreground font-medium">
                  {listing.accessoriesNotes ||
                    (listing.boxIncluded && listing.papersIncluded
                      ? 'Estuche y documentación incluidos.'
                      : 'Sin accesorios adicionales especificados.')}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Modificaciones o Piezas Sustituidas Declaradas
                </span>
                <p className="text-xs text-foreground font-medium">
                  {listing.knownModificationsNotes ||
                    'El vendedor no declara modificaciones conocidas.'}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-secondary/35 border border-border flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Lock className="w-4 h-4 text-accent shrink-0" />
                <span>
                  Número de serie (protegido contra clonación pública):{' '}
                  <strong className="text-foreground font-mono">
                    {listing.serialNumberMasked || 'No expuesto públicamente'}
                  </strong>
                </span>
              </div>
              {listing.authenticityConfirmed && (
                <span className="inline-flex items-center gap-1 text-success font-semibold shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Declaración firmada por vendedor
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Specs, Seller Info, Actions & Moderation (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Primary Watch Summary Card */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-soft space-y-5">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-accent">
                  {listing.brand}
                </span>
                {listing.reference && (
                  <span className="font-mono text-xs bg-secondary px-2.5 py-1 rounded-lg border border-border text-foreground">
                    Ref. {listing.reference}
                  </span>
                )}
              </div>

              <h1 className="font-serif text-3xl text-foreground mt-1 leading-tight">
                {listing.model}
              </h1>

              <div className="mt-4 pt-4 border-t border-border flex items-baseline justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">
                    Precio de venta
                  </span>
                  <span className="font-serif text-4xl text-foreground">
                    {formattedPrice}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  Publicado el {publishedDate}
                </span>
              </div>
            </div>

            {/* Technical Specs Table */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border text-xs">
              <div className="p-3 rounded-xl bg-secondary/40 border border-border/70">
                <span className="text-[10px] uppercase text-muted-foreground block">
                  Estado
                </span>
                <span className="font-semibold text-foreground mt-0.5 block">
                  {CONDITION_LABELS[listing.condition]}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-secondary/40 border border-border/70">
                <span className="text-[10px] uppercase text-muted-foreground block">
                  Movimiento
                </span>
                <span className="font-semibold text-foreground mt-0.5 flex items-center gap-1">
                  <Gauge className="w-3.5 h-3.5 text-accent" />
                  {MOVEMENT_LABELS[listing.movement]}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-secondary/40 border border-border/70">
                <span className="text-[10px] uppercase text-muted-foreground block">
                  Año aproximado
                </span>
                <span className="font-semibold text-foreground mt-0.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-accent" />
                  {listing.approxYear ? `~${listing.approxYear}` : 'No indicado'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-secondary/40 border border-border/70">
                <span className="text-[10px] uppercase text-muted-foreground block">
                  Ubicación aprox.
                </span>
                <span className="font-semibold text-foreground mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-accent" />
                  {listing.location}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-secondary/40 border border-border/70">
                <span className="text-[10px] uppercase text-muted-foreground block">
                  Caja original
                </span>
                <span className="font-semibold text-foreground mt-0.5 flex items-center gap-1">
                  <Package className="w-3.5 h-3.5 text-accent" />
                  {listing.boxIncluded ? 'Sí, incluida' : 'No incluida'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-secondary/40 border border-border/70">
                <span className="text-[10px] uppercase text-muted-foreground block">
                  Documentación
                </span>
                <span className="font-semibold text-foreground mt-0.5 flex items-center gap-1">
                  <FileCheck2 className="w-3.5 h-3.5 text-accent" />
                  {listing.papersIncluded ? 'Sí, incluida' : 'No incluida'}
                </span>
              </div>
            </div>

            {/* Public Seller Information (Strictly factual, no fake ratings or certifications) */}
            <div className="p-4 rounded-xl bg-secondary/50 border border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Información pública del vendedor
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Miembro desde {listing.ownerJoinedLabel}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">
                    {listing.ownerDisplayName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Ubicación declarada: {listing.location} · Sin valoraciones
                    artificiales
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons: Contact Seller, Save Favorite, Report Listing */}
            <div className="space-y-2.5 pt-2">
              {!isOwner ? (
                <button
                  type="button"
                  onClick={() => setShowContactForm((v) => !v)}
                  className="w-full py-3 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  Contactar al vendedor (Conversación privada)
                </button>
              ) : (
                <div className="p-3 rounded-xl bg-accent/12 border border-accent/30 text-xs text-foreground flex items-center justify-between">
                  <span className="font-semibold">
                    Eres el propietario de este anuncio.
                  </span>
                  <Link
                    to="/vender"
                    search={{ edit: listing.id }}
                    className="inline-flex items-center gap-1 font-bold text-accent hover:underline"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Editar anuncio
                  </Link>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handleToggleFavorite}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    listing.isFavorited
                      ? 'bg-destructive/12 border-destructive/30 text-destructive'
                      : 'bg-background border-border text-foreground hover:bg-secondary'
                  }`}
                >
                  <Heart
                    className={`w-4 h-4 ${listing.isFavorited ? 'fill-current' : ''}`}
                  />
                  {listing.isFavorited ? 'En Favoritos' : 'Guardar Favorito'}
                </button>

                <button
                  type="button"
                  onClick={() => setShowReportForm((v) => !v)}
                  className="py-2.5 px-3 rounded-xl bg-background border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Flag className="w-4 h-4" />
                  Denunciar anuncio
                </button>
              </div>
            </div>

            {/* Contact Seller Expandable Form */}
            {showContactForm && !isOwner && (
              <form
                onSubmit={handleSendMessage}
                className="p-4 rounded-xl bg-secondary/70 border border-border space-y-3"
              >
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Mensaje privado para {listing.ownerDisplayName}
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Solo tú y el vendedor podréis leer esta conversación en la
                  sección <strong>/mensajes</strong>.
                </p>
                <textarea
                  rows={3}
                  required
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Hola, me interesa tu reloj. ¿Sigue disponible para entrega en mano o envío asegurado?"
                  className="w-full p-3 rounded-xl bg-background border border-border text-xs text-foreground focus:outline-none focus:border-accent"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowContactForm(false)}
                    className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingMessage}
                    className="px-4 py-2 rounded-xl bg-accent text-accent-foreground text-xs font-bold cursor-pointer"
                  >
                    {isSendingMessage ? 'Enviando...' : 'Enviar mensaje'}
                  </button>
                </div>
              </form>
            )}

            {/* Report Listing Expandable Form */}
            {showReportForm && (
              <form
                onSubmit={handleReportSubmit}
                className="p-4 rounded-xl bg-destructive/5 border border-destructive/25 space-y-3"
              >
                <h3 className="text-xs font-bold uppercase tracking-wider text-destructive">
                  Denunciar irregularidad o sospecha de réplica
                </h3>
                {reportSuccess ? (
                  <p className="text-xs text-success font-medium">
                    {reportSuccess}
                  </p>
                ) : (
                  <>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">
                        Motivo principal
                      </label>
                      <select
                        value={reportReason}
                        onChange={(e) => setReportReason(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-background border border-border text-xs text-foreground"
                      >
                        <option value="Incoherencia entre fotografías y referencia declarada">
                          Incoherencia entre fotografías y referencia declarada
                        </option>
                        <option value="Sospecha de falsificación o piezas aftermarket no declaradas">
                          Sospecha de falsificación o piezas aftermarket no
                          declaradas
                        </option>
                        <option value="Fotografías reutilizadas de otro portal o borrosas">
                          Fotografías reutilizadas de otro portal o borrosas
                        </option>
                        <option value="Precio irreal o intento de estafa externa">
                          Precio irreal o intento de estafa externa
                        </option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">
                        Detalles técnicos (opcional)
                      </label>
                      <textarea
                        rows={2}
                        value={reportDetails}
                        onChange={(e) => setReportDetails(e.target.value)}
                        placeholder="Indica qué detalle en esfera, calibre o tipografía del bisel te resulta sospechoso..."
                        className="w-full p-2.5 rounded-xl bg-background border border-border text-xs text-foreground"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowReportForm(false)}
                        className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-destructive text-primary-foreground text-xs font-bold cursor-pointer"
                      >
                        Enviar denuncia a moderación
                      </button>
                    </div>
                  </>
                )}
              </form>
            )}
          </div>

          {/* Owner Commercial Controls */}
          {isOwner && (
            <div className="bg-card rounded-2xl border border-border p-5 shadow-soft space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Gestión rápida del propietario
              </h3>
              <div className="flex flex-wrap gap-2">
                {listing.status !== 'published' && (
                  <button
                    type="button"
                    onClick={() => void handleOwnerStatusChange('published')}
                    className="px-3 py-1.5 rounded-xl bg-success text-primary-foreground text-xs font-semibold cursor-pointer"
                  >
                    Publicar / Reactivar
                  </button>
                )}
                {listing.status === 'published' && (
                  <button
                    type="button"
                    onClick={() => void handleOwnerStatusChange('paused')}
                    className="px-3 py-1.5 rounded-xl bg-primary/15 text-primary border border-primary/30 text-xs font-semibold cursor-pointer"
                  >
                    Pausar anuncio
                  </button>
                )}
                {listing.status !== 'sold' && (
                  <button
                    type="button"
                    onClick={() => void handleOwnerStatusChange('sold')}
                    className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold cursor-pointer"
                  >
                    Marcar como vendido
                  </button>
                )}
                {listing.status !== 'withdrawn' && (
                  <button
                    type="button"
                    onClick={() => void handleOwnerStatusChange('withdrawn')}
                    className="px-3 py-1.5 rounded-xl bg-destructive/15 text-destructive border border-destructive/30 text-xs font-semibold cursor-pointer"
                  >
                    Retirar anuncio
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Moderator Panel (Only active when currentUser.role === 'moderator') */}
          {isModerator && (
            <div className="bg-card rounded-2xl border-2 border-accent/50 p-5 shadow-soft space-y-4">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-accent">
                  <ShieldCheck className="w-4 h-4" />
                  Panel de Moderación Fotográfica (Backend-Enforced)
                </span>
                <span className="text-[11px] font-mono text-muted-foreground">
                  Estado actual: {listing.reviewStatus}
                </span>
              </div>

              <textarea
                rows={2}
                value={modNotes}
                onChange={(e) => setModNotes(e.target.value)}
                placeholder="Motivo interno de la decisión (queda registrado en authenticity_reviews)..."
                className="w-full p-2.5 rounded-xl bg-background border border-border text-xs text-foreground"
              />

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    void handleModeratorDecision('passed_photo_review')
                  }
                  className="py-2 px-3 rounded-xl bg-success text-primary-foreground text-xs font-bold cursor-pointer"
                >
                  Aprobar revisión fotográfica
                </button>
                <button
                  type="button"
                  onClick={() => void handleModeratorDecision('manual_review')}
                  className="py-2 px-3 rounded-xl bg-success text-primary-foreground text-xs font-bold cursor-pointer"
                >
                  Solicitar revisión manual
                </button>
                <button
                  type="button"
                  onClick={() => void handleModeratorDecision('pending')}
                  className="py-2 px-3 rounded-xl bg-primary text-primary-foreground text-xs font-bold cursor-pointer"
                >
                  Marcar pendiente
                </button>
                <button
                  type="button"
                  onClick={() => void handleModeratorDecision('rejected')}
                  className="py-2 px-3 rounded-xl bg-destructive text-primary-foreground text-xs font-bold cursor-pointer"
                >
                  Rechazar por moderación
                </button>
              </div>
            </div>
          )}

          {/* Review History Log */}
          <div className="bg-card rounded-2xl border border-border p-5 shadow-soft space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-accent" />
              Registro de Trazabilidad de Revisión
            </h3>
            {reviewHistory.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Aún no existen eventos registrados para este anuncio.
              </p>
            ) : (
              <ul className="space-y-2.5 text-xs">
                {reviewHistory.map((rev) => (
                  <li
                    key={rev.id}
                    className="p-3 rounded-xl bg-secondary/40 border border-border/70 space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-foreground">
                        {rev.reviewerName}
                      </span>
                      <span className="text-muted-foreground">
                        {new Date(rev.createdAt).toLocaleDateString('es-ES')} ·{' '}
                        {rev.method}
                      </span>
                    </div>
                    <p className="text-muted-foreground">
                      Estado asignado:{' '}
                      <strong className="text-foreground">{rev.status}</strong>
                    </p>
                    {(isOwner || isModerator) && rev.internalReason && (
                      <p className="text-[11px] text-accent">
                        Nota interna: {rev.internalReason}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </MarketplaceShell>
  )
}

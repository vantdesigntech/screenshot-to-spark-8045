import { useCallback, useEffect, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  CheckCircle2,
  Edit3,
  Eye,
  Layers,
  PauseCircle,
  PlayCircle,
  PlusCircle,
  ShieldAlert,
  ShieldCheck,
  Trash2,
} from 'lucide-react'
import { MarketplaceShell } from '../marketplace/components/MarketplaceShell'
import { PhotoReviewBadge } from '../marketplace/components/PhotoReviewBadge'
import {
  getCurrentUser,
  getModeratorQueue,
  getMyListings,
  moderatorTransitionReviewStatus,
  subscribeMarketplaceUpdates,
  updateListingCommercialStatus,
} from '../marketplace/services/marketplace-service'
import {
  COMMERCIAL_STATUS_LABELS,
  CONDITION_LABELS,
  type ListingCommercialStatus,
  type ListingReportRecord,
  type ReviewStatus,
  type WatchListing,
} from '../marketplace/types'

export const Route = createFileRoute('/mis-anuncios')({
  head: () => ({
    meta: [
      { property: 'og:title', content: 'Mis anuncios — ChronoParts Marketplace' },
      { property: 'og:description', content: 'Consulta y gestiona tus anuncios de relojes.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'description', content: 'Consulta y gestiona tus anuncios de relojes.' },
      {
        title: 'Mis Anuncios y Moderación | ChronoParts Marketplace',
      },
    ],
  }),
  component: MyListingsPage,
})

export function MyListingsPage() {
  const [myListings, setMyListings] = useState<WatchListing[]>([])
  const [modQueueListings, setModQueueListings] = useState<WatchListing[]>([])
  const [modReports, setModReports] = useState<ListingReportRecord[]>([])
  const [activeTab, setActiveTab] = useState<'own' | 'moderation'>('own')
  const [statusFilter, setStatusFilter] = useState<
    ListingCommercialStatus | 'all'
  >('all')
  const [feedback, setFeedback] = useState<string | null>(null)

  const currentUser = getCurrentUser()
  const isModerator = currentUser.role === 'moderator'

  const loadData = useCallback(async () => {
    const mine = await getMyListings()
    setMyListings(mine)

    if (getCurrentUser().role === 'moderator') {
      try {
        const queue = await getModeratorQueue()
        setModQueueListings(queue.listings)
        setModReports(queue.reports)
      } catch {
        // ignore if user switched away from moderator
      }
    }
  }, [])

  useEffect(() => {
    void loadData()
    const unsubscribe = subscribeMarketplaceUpdates(() => {
      void loadData()
    })
    return unsubscribe
  }, [loadData])

  const handleStatusChange = async (
    listingId: string,
    nextStatus: ListingCommercialStatus,
  ) => {
    try {
      await updateListingCommercialStatus(listingId, nextStatus)
      setFeedback(
        `Estado comercial actualizado a "${COMMERCIAL_STATUS_LABELS[nextStatus]}".`,
      )
      await loadData()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al actualizar estado')
    }
  }

  const handleModerate = async (
    listingId: string,
    nextStatus: ReviewStatus,
    reason: string,
  ) => {
    try {
      await moderatorTransitionReviewStatus({
        listingId,
        nextStatus,
        internalReason: reason,
      })
      setFeedback(`Revisión fotográfica actualizada a "${nextStatus}".`)
      await loadData()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error de moderación')
    }
  }

  const filteredOwn = myListings.filter((item) =>
    statusFilter === 'all' ? true : item.status === statusFilter,
  )

  return (
    <MarketplaceShell
      title="Gestión de Mis Anuncios"
      subtitle={`Panel privado de ${currentUser.displayName}. Solo el propietario puede publicar borradores, editar precios, pausar, marcar como vendido o retirar sus relojes.`}
    >
      {/* Top Tabs & Quick CTA */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('own')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'own'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            <Layers className="w-4 h-4" />
            Mis Anuncios ({myListings.length})
          </button>

          {isModerator && (
            <button
              type="button"
              onClick={() => setActiveTab('moderation')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'moderation'
                  ? 'bg-accent text-accent-foreground shadow-sm'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Cola de Moderación ({modQueueListings.length}) · Denuncias (
              {modReports.length})
            </button>
          )}
        </div>

        <Link
          to="/vender"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-accent-foreground text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity"
        >
          <PlusCircle className="w-4 h-4" />
          Nuevo Anuncio
        </Link>
      </div>

      {feedback && (
        <div className="mb-6 p-3.5 rounded-xl bg-success/12 border border-success/30 text-success text-xs font-semibold flex items-center justify-between">
          <span>{feedback}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="underline ml-4"
          >
            Cerrar
          </button>
        </div>
      )}

      {activeTab === 'own' && (
        <div className="space-y-6">
          {/* Commercial Status Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                'all',
                'published',
                'draft',
                'paused',
                'sold',
                'withdrawn',
              ] as const
            ).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-muted-foreground border-border hover:text-foreground'
                }`}
              >
                {st === 'all' ? 'Todos' : COMMERCIAL_STATUS_LABELS[st]}
              </button>
            ))}
          </div>

          {filteredOwn.length === 0 ? (
            <div className="py-16 px-6 text-center bg-card rounded-2xl border border-border space-y-3">
              <Layers className="w-8 h-8 text-accent mx-auto" />
              <h3 className="font-serif text-2xl text-foreground">
                No tienes anuncios en este estado
              </h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Publica un reloj completo o guarda un borrador privado para
                gestionarlo desde aquí.
              </p>
              <Link
                to="/vender"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold"
              >
                <PlusCircle className="w-4 h-4" />
                Crear mi primer anuncio
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOwn.map((item) => {
                const thumb =
                  item.images[0]?.url ||
                  'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=600&q=80'
                return (
                  <div
                    key={item.id}
                    className="bg-card rounded-2xl border border-border p-4 sm:p-5 shadow-soft flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
                  >
                    <div className="flex items-start sm:items-center gap-4">
                      <img
                        src={thumb}
                        alt={item.model}
                        className="w-24 h-20 rounded-xl object-cover bg-secondary border border-border shrink-0"
                      />
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-accent">
                            {item.brand}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-secondary text-foreground border border-border">
                            {COMMERCIAL_STATUS_LABELS[item.status]}
                          </span>
                          <PhotoReviewBadge
                            status={item.reviewStatus}
                            compact
                          />
                        </div>

                        <h3 className="font-serif text-xl text-foreground">
                          {item.model}{' '}
                          {item.reference && (
                            <span className="font-mono text-xs text-muted-foreground">
                              ({item.reference})
                            </span>
                          )}
                        </h3>

                        <p className="text-xs text-muted-foreground">
                          Precio:{' '}
                          <strong className="text-foreground">
                            {item.priceEur.toLocaleString('es-ES')} €
                          </strong>{' '}
                          · Estado: {CONDITION_LABELS[item.condition]} ·{' '}
                          {item.images.length} fotos adjuntas
                        </p>
                      </div>
                    </div>

                    {/* Owner Actions */}
                    <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-border">
                      <Link
                        to="/marketplace/$id"
                        params={{ id: item.id }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-secondary text-foreground text-xs font-semibold border border-border hover:bg-secondary/80"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Ver
                      </Link>

                      <Link
                        to="/vender"
                        search={{ edit: item.id }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-secondary text-foreground text-xs font-semibold border border-border hover:bg-secondary/80"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Editar
                      </Link>

                      {item.status !== 'published' && (
                        <button
                          type="button"
                          onClick={() =>
                            void handleStatusChange(item.id, 'published')
                          }
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-success text-primary-foreground text-xs font-semibold cursor-pointer"
                        >
                          <PlayCircle className="w-3.5 h-3.5" />
                          Publicar
                        </button>
                      )}

                      {item.status === 'published' && (
                        <button
                          type="button"
                          onClick={() =>
                            void handleStatusChange(item.id, 'paused')
                          }
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary/15 text-primary border border-primary/30 text-xs font-semibold cursor-pointer"
                        >
                          <PauseCircle className="w-3.5 h-3.5" />
                          Pausar
                        </button>
                      )}

                      {item.status !== 'sold' && (
                        <button
                          type="button"
                          onClick={() =>
                            void handleStatusChange(item.id, 'sold')
                          }
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Marcar Vendido
                        </button>
                      )}

                      {item.status !== 'withdrawn' && (
                        <button
                          type="button"
                          onClick={() =>
                            void handleStatusChange(item.id, 'withdrawn')
                          }
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-destructive/12 text-destructive border border-destructive/25 text-xs font-semibold cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Retirar
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Moderator Manual Review & Reports Queue */}
      {activeTab === 'moderation' && isModerator && (
        <div className="space-y-8">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-soft space-y-4">
            <h2 className="font-serif text-2xl text-foreground flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-accent" />
              Cola de Revisión Fotográfica Manual
            </h2>
            <p className="text-xs text-muted-foreground">
              Desde esta vista exclusiva para moderadores puedes aprobar la
              revisión fotográfica, derivar a inspección manual o rechazar
              anuncios sospechosos.
            </p>

            <div className="space-y-3">
              {modQueueListings.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-secondary/40 border border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-accent">
                        {item.brand} · {item.model}
                      </span>
                      <PhotoReviewBadge status={item.reviewStatus} compact />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Vendedor: {item.ownerDisplayName} · {item.images.length}{' '}
                      fotos · Serie enmascarada:{' '}
                      <span className="font-mono">
                        {item.serialNumberMasked || 'N/D'}
                      </span>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to="/marketplace/$id"
                      params={{ id: item.id }}
                      className="px-3 py-1.5 rounded-lg bg-background border border-border text-xs font-semibold"
                    >
                      Inspeccionar fotos
                    </Link>
                    <button
                      type="button"
                      onClick={() =>
                        void handleModerate(
                          item.id,
                          'passed_photo_review',
                          'Revisión fotográfica superada tras validación de moderador.',
                        )
                      }
                      className="px-3 py-1.5 rounded-lg bg-success text-primary-foreground text-xs font-bold cursor-pointer"
                    >
                      Superar Revisión Foto
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        void handleModerate(
                          item.id,
                          'manual_review',
                          'Marcado para revisión manual adicional.',
                        )
                      }
                      className="px-3 py-1.5 rounded-lg bg-success text-primary-foreground text-xs font-bold cursor-pointer"
                    >
                      Revisión Manual
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        void handleModerate(
                          item.id,
                          'rejected',
                          'Rechazado por moderación por incoherencia visual o documental.',
                        )
                      }
                      className="px-3 py-1.5 rounded-lg bg-destructive text-primary-foreground text-xs font-bold cursor-pointer"
                    >
                      Rechazar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reports Received */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-soft space-y-4">
            <h2 className="font-serif text-2xl text-foreground flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-destructive" />
              Denuncias de Usuarios ({modReports.length})
            </h2>
            {modReports.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No hay denuncias pendientes de revisión.
              </p>
            ) : (
              <div className="space-y-3">
                {modReports.map((rep) => (
                  <div
                    key={rep.id}
                    className="p-4 rounded-xl bg-destructive/5 border border-destructive/20 space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-destructive">
                        {rep.reason}
                      </span>
                      <span className="text-muted-foreground">
                        Reportado por {rep.reporterName} · Estado: {rep.status}
                      </span>
                    </div>
                    {rep.details && (
                      <p className="text-foreground/90">{rep.details}</p>
                    )}
                    <Link
                      to="/marketplace/$id"
                      params={{ id: rep.listingId }}
                      className="inline-block text-accent font-semibold hover:underline pt-1"
                    >
                      Abrir anuncio denunciado →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </MarketplaceShell>
  )
}

import { useCallback, useEffect, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  AlertCircle,
  ExternalLink,
  Lock,
  MessageSquare,
  Send,
  ShieldCheck,
  User,
} from 'lucide-react'
import { MarketplaceShell } from '../marketplace/components/MarketplaceShell'
import {
  getConversationThread,
  getCurrentUser,
  getMyConversations,
  sendMessageInConversation,
  subscribeMarketplaceUpdates,
} from '../marketplace/services/marketplace-service'
import type {
  MarketplaceConversation,
  MarketplaceMessage,
} from '../marketplace/types'

interface MensajesSearch {
  conversationId?: string | undefined
}

export const Route = createFileRoute('/mensajes')({
  validateSearch: (search: Record<string, unknown>): MensajesSearch => ({
    conversationId:
      typeof search['conversationId'] === 'string'
        ? search['conversationId']
        : undefined,
  }),
  head: () => ({
    meta: [
      { property: 'og:title', content: 'Mensajes — ChronoParts Marketplace' },
      { property: 'og:description', content: 'Consulta las conversaciones sobre tus relojes.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'description', content: 'Consulta las conversaciones sobre tus relojes.' },
      {
        title: 'Mensajes Privados | ChronoParts Marketplace',
      },
    ],
  }),
  component: PrivateMessagesPage,
})

export function PrivateMessagesPage() {
  const { conversationId: initialConvId } = Route.useSearch()
  const [conversations, setConversations] = useState<MarketplaceConversation[]>(
    [],
  )
  const [selectedId, setSelectedId] = useState<string | null>(
    initialConvId || null,
  )
  const [activeConversation, setActiveConversation] =
    useState<MarketplaceConversation | null>(null)
  const [messages, setMessages] = useState<MarketplaceMessage[]>([])
  const [replyContent, setReplyContent] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)

  const currentUser = getCurrentUser()

  const loadInbox = useCallback(async () => {
    setErrorMessage(null)
    try {
      const list = await getMyConversations()
      setConversations(list)

      const targetId =
        selectedId && list.some((c) => c.id === selectedId)
          ? selectedId
          : list[0]?.id || null

      setSelectedId(targetId)

      if (targetId) {
        const thread = await getConversationThread(targetId)
        setActiveConversation(thread.conversation)
        setMessages(thread.messages)
      } else {
        setActiveConversation(null)
        setMessages([])
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Error al cargar las conversaciones privadas.',
      )
    }
  }, [selectedId])

  useEffect(() => {
    void loadInbox()
    const unsubscribe = subscribeMarketplaceUpdates(() => {
      void loadInbox()
    })
    return unsubscribe
  }, [loadInbox])

  const handleSelectConversation = async (convId: string) => {
    setSelectedId(convId)
    setErrorMessage(null)
    try {
      const thread = await getConversationThread(convId)
      setActiveConversation(thread.conversation)
      setMessages(thread.messages)
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Acceso no autorizado.',
      )
    }
  }

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeConversation || !replyContent.trim()) return
    setIsSending(true)
    setErrorMessage(null)
    try {
      await sendMessageInConversation(activeConversation.id, replyContent)
      setReplyContent('')
      const thread = await getConversationThread(activeConversation.id)
      setActiveConversation(thread.conversation)
      setMessages(thread.messages)
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Error al enviar el mensaje.',
      )
    } finally {
      setIsSending(false)
    }
  }

  return (
    <MarketplaceShell
      title="Mensajería Privada entre Compradores y Vendedores"
      subtitle={`Bandeja confidencial de ${currentUser.displayName}. Las conversaciones están protegidas: solo el comprador y el vendedor participantes pueden leer o enviar mensajes.`}
    >
      {/* Privacy Notice */}
      <div className="mb-6 p-3.5 rounded-2xl bg-card border border-border flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-accent shrink-0" />
          <span>
            <strong className="text-foreground">
              Aislamiento estricto de participantes:
            </strong>{' '}
            Si cambias de usuario en el selector superior, comprobarás que cada
            cuenta solo puede ver y responder en sus propias conversaciones.
          </span>
        </div>
        <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-accent font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          RLS & Control de Acceso Activo
        </span>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-700 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {conversations.length === 0 ? (
        <div className="py-16 px-6 text-center bg-card rounded-2xl border border-border space-y-4 max-w-xl mx-auto">
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto text-accent">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h2 className="font-serif text-2xl text-foreground">
            No tienes conversaciones activas con esta cuenta
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Abre cualquier anuncio en el catálogo y pulsa «Contactar al
            vendedor» para iniciar una conversación privada.
          </p>
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold"
          >
            Ir al catálogo de relojes
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[520px]">
          {/* Left Column: Conversation List (4 cols) */}
          <div className="lg:col-span-4 bg-card rounded-2xl border border-border overflow-hidden shadow-soft flex flex-col">
            <div className="p-4 border-b border-border bg-secondary/40">
              <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Conversaciones ({conversations.length})
              </h2>
            </div>

            <div className="divide-y divide-border overflow-y-auto flex-1">
              {conversations.map((conv) => {
                const isBuyer = conv.buyerId === currentUser.id
                const counterpartName = isBuyer
                  ? conv.sellerName
                  : conv.buyerName
                const isSelected = conv.id === activeConversation?.id

                return (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => void handleSelectConversation(conv.id)}
                    className={`w-full text-left p-4 transition-colors flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-accent/12 border-l-4 border-l-accent'
                        : 'hover:bg-secondary/50'
                    }`}
                  >
                    <img
                      src={conv.listingImage}
                      alt={conv.listingTitle}
                      className="w-12 h-12 rounded-xl object-cover bg-secondary border border-border shrink-0"
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-foreground truncate">
                          {counterpartName}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                          {isBuyer ? 'Vendedor' : 'Comprador'}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-accent truncate">
                        {conv.listingTitle} ·{' '}
                        {conv.listingPriceEur.toLocaleString('es-ES')} €
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {conv.lastMessagePreview || 'Sin mensajes'}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Right Column: Active Thread (8 cols) */}
          <div className="lg:col-span-8 bg-card rounded-2xl border border-border overflow-hidden shadow-soft flex flex-col">
            {activeConversation ? (
              <>
                {/* Thread Header */}
                <div className="p-4 border-b border-border bg-secondary/40 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={activeConversation.listingImage}
                      alt={activeConversation.listingTitle}
                      className="w-11 h-11 rounded-xl object-cover border border-border"
                    />
                    <div>
                      <h3 className="text-sm font-bold text-foreground">
                        {activeConversation.listingTitle} (
                        {activeConversation.listingPriceEur.toLocaleString(
                          'es-ES',
                        )}{' '}
                        €)
                      </h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-accent" />
                        Participantes: {activeConversation.buyerName}{' '}
                        (Comprador) y {activeConversation.sellerName} (Vendedor)
                      </p>
                    </div>
                  </div>

                  <Link
                    to="/marketplace/$id"
                    params={{ id: activeConversation.listingId }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-background border border-border text-xs font-semibold hover:border-accent"
                  >
                    Ver ficha del reloj
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Messages Scroll Area */}
                <div className="flex-1 p-5 space-y-4 overflow-y-auto max-h-[380px] bg-background/40">
                  {messages.map((msg) => {
                    const isMine = msg.senderId === currentUser.id
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${
                          isMine ? 'items-end' : 'items-start'
                        }`}
                      >
                        <div
                          className={`max-w-lg rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed ${
                            isMine
                              ? 'bg-primary text-primary-foreground rounded-br-sm'
                              : 'bg-secondary border border-border text-foreground rounded-bl-sm'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-4 mb-1 text-[10px] opacity-75 font-semibold">
                            <span>{msg.senderName}</span>
                            <span>
                              {new Date(msg.createdAt).toLocaleTimeString(
                                'es-ES',
                                {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                },
                              )}
                            </span>
                          </div>
                          <p className="whitespace-pre-line">{msg.content}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Message Composer */}
                <form
                  onSubmit={handleSendReply}
                  className="p-4 border-t border-border bg-card flex items-center gap-3"
                >
                  <input
                    type="text"
                    required
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Escribe un mensaje privado..."
                    aria-label="Escribe un mensaje privado"
                    className="flex-1 px-4 py-2.5 rounded-xl bg-background border border-border text-xs sm:text-sm text-foreground focus:outline-none focus:border-accent"
                  />
                  <button
                    type="submit"
                    disabled={isSending}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-accent-foreground text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Enviar
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-8 text-xs text-muted-foreground">
                Selecciona una conversación a la izquierda.
              </div>
            )}
          </div>
        </div>
      )}
    </MarketplaceShell>
  )
}

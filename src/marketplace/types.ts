/**
 * ChronoParts Marketplace — Domain Types & Constants
 *
 * Modular, decoupled domain contract (`src/marketplace/*`) designed so that
 * the Watch Marketplace can run integrated inside ChronoParts Web today
 * and be extracted as an independent standalone App in the future.
 */

export type WatchCondition =
  | 'new'
  | 'excellent'
  | 'good'
  | 'fair'
  | 'for_parts'

export type MovementType = 'quartz' | 'automatic' | 'manual' | 'other'
export type WatchMovementType = MovementType

export type ListingCommercialStatus =
  | 'draft'
  | 'published'
  | 'paused'
  | 'sold'
  | 'withdrawn'

export type ReviewStatus =
  | 'pending'
  | 'passed_photo_review'
  | 'manual_review'
  | 'rejected'
export type PhotoReviewStatus = ReviewStatus

export type PhotoSlotType =
  | 'dial'
  | 'caseback'
  | 'crown_sides'
  | 'clasp_strap'
  | 'ref_serial'
  | 'extra'

export type UserRole = 'user' | 'moderator'

export interface MarketplaceUser {
  id: string
  displayName: string
  location: string
  joinedLabel: string
  role: UserRole
}

export interface ListingImage {
  id: string
  listingId: string
  url: string
  slot: PhotoSlotType
  caption?: string
  sortOrder: number
  mimeType: string
  sizeBytes: number
  reviewStatus: 'pending' | 'approved' | 'flagged'
  /** If true, image contains a visible serial number and is only shown to owner/moderators */
  isSensitiveSerial?: boolean
}

export interface ListingImageInput {
  id?: string
  url: string
  slot: PhotoSlotType
  caption?: string
  mimeType?: string
  sizeBytes?: number
  isSensitiveSerial?: boolean
}

export interface WatchListing {
  id: string
  ownerId: string
  ownerDisplayName: string
  ownerJoinedLabel: string
  brand: string
  model: string
  reference?: string
  priceEur: number
  condition: WatchCondition
  movement: MovementType
  approxYear?: number
  description: string
  boxIncluded: boolean
  papersIncluded: boolean
  accessoriesNotes: string
  location: string
  status: ListingCommercialStatus
  reviewStatus: ReviewStatus
  authenticityConfirmed: boolean
  knownModificationsNotes: string
  /** Masked serial shown publicly (e.g. "68****14"), never the raw serial */
  serialNumberMasked?: string
  /** True only for pre-loaded demonstration listings; false for user-created listings */
  isDemo: boolean
  createdAt: string
  updatedAt: string
  publishedAt?: string
  images: ListingImage[]
  isFavorited?: boolean
}

export interface AuthenticityReviewRecord {
  id: string
  listingId: string
  status: ReviewStatus
  method: 'automated_slot_check' | 'manual_moderator' | 'external_vision_hook'
  internalReason: string
  reviewerId: string
  reviewerName: string
  createdAt: string
}

export interface ListingReportRecord {
  id: string
  listingId: string
  reporterId: string
  reporterName: string
  reason: string
  details: string
  status: 'open' | 'investigating' | 'resolved' | 'dismissed'
  createdAt: string
}

export interface MarketplaceMessage {
  id: string
  conversationId: string
  senderId: string
  senderName: string
  content: string
  createdAt: string
}

export interface MarketplaceConversation {
  id: string
  listingId: string
  listingTitle: string
  listingImage: string
  listingPriceEur: number
  buyerId: string
  buyerName: string
  sellerId: string
  sellerName: string
  lastMessagePreview: string
  updatedAt: string
}

export interface ListingFilterParams {
  query?: string
  brand?: string
  reference?: string
  minPrice?: number
  maxPrice?: number
  condition?: WatchCondition | 'all'
  movement?: MovementType | 'all'
  location?: string
  sortBy?: 'newest' | 'oldest' | 'price_asc' | 'price_desc'
  page?: number
  pageSize?: number
}

export interface PaginatedListingsResult {
  items: WatchListing[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface CreateOrUpdateListingPayload {
  id?: string
  brand: string
  model: string
  reference?: string
  priceEur: number
  condition: WatchCondition
  movement: MovementType
  approxYear?: number
  description: string
  boxIncluded: boolean
  papersIncluded: boolean
  accessoriesNotes?: string
  location: string
  serialNumberRaw?: string
  authenticityConfirmed: boolean
  knownModificationsNotes?: string
  images: ListingImageInput[]
  intent: 'draft' | 'publish'
  /** Security test field: client-supplied reviewStatus must always be rejected/ignored */
  reviewStatus?: unknown
}

/**
 * Future AI Vision Provider Hook Interface
 * Prepared for future integration of a real visual analysis service without simulating
 * fake AI results in the MVP.
 */
export interface MarketplaceVisionAnalysisHook {
  providerName: string
  isConnected: boolean
  analyzeListingPhotos: (listing: WatchListing) => Promise<{
    flaggedForManualReview: boolean
    signals: string[]
  }>
}

export const CONDITION_LABELS: Record<WatchCondition, string> = {
  new: 'Nuevo / Sin estrenar',
  excellent: 'Excelente',
  good: 'Bueno',
  fair: 'Aceptable',
  for_parts: 'Para reparar / Piezas',
}

export const MOVEMENT_LABELS: Record<MovementType, string> = {
  automatic: 'Automático',
  manual: 'Cuerda manual',
  quartz: 'Cuarzo',
  other: 'Otro (Solar / Kinetic / Spring Drive)',
}

export const COMMERCIAL_STATUS_LABELS: Record<ListingCommercialStatus, string> =
  {
    draft: 'Borrador privado',
    published: 'Publicado',
    paused: 'Pausado',
    sold: 'Vendido',
    withdrawn: 'Retirado',
  }

export interface PhotoReviewCopy {
  badgeLabel: string
  shortSummary: string
  description: string
  limitsDisclaimer: string
}

/**
 * Public copy for photographic review states.
 * Strictly avoids expressions like "100 % original" or "autenticidad garantizada".
 */
export const PHOTO_REVIEW_COPY: Record<ReviewStatus, PhotoReviewCopy> = {
  passed_photo_review: {
    badgeLabel: 'Revisión fotográfica superada',
    shortSummary:
      'Las imágenes han pasado los controles establecidos; no garantiza autenticidad física.',
    description:
      'Se han verificado los ángulos fotográficos requeridos (esfera, trasera, corona/laterales y cierre/correa) y la coherencia declarada por el vendedor.',
    limitsDisclaimer:
      'Revisión fotográfica superada: las imágenes han pasado los controles establecidos; no garantiza autenticidad física ni sustituye la apertura e inspección del calibre por un relojero.',
  },
  pending: {
    badgeLabel: 'Pendiente de revisión',
    shortSummary: 'La revisión fotográfica aún no ha terminado.',
    description:
      'El anuncio ha sido recibido y sus fotografías están en cola para comprobar ángulos obligatorios y coherencia visual.',
    limitsDisclaimer:
      'Pendiente de revisión: la revisión no ha terminado. Exige siempre comprobación documental y evita pagos fuera de canales seguros.',
  },
  manual_review: {
    badgeLabel: 'En revisión manual',
    shortSummary:
      'Derivado a moderación manual para verificar detalles o modificaciones declaradas.',
    description:
      'Un moderador está revisando manualmente las fotografías o las modificaciones declaradas en este reloj antes de validar su revisión fotográfica.',
    limitsDisclaimer:
      'La revisión fotográfica evalúa únicamente la evidencia visual aportada y no constituye un certificado de autenticidad física.',
  },
  rejected: {
    badgeLabel: 'Rechazado por moderación',
    shortSummary:
      'El anuncio no superó los controles fotográficos o de moderación.',
    description:
      'Este anuncio ha sido bloqueado del catálogo público por fotografías insuficientes, incoherencias visuales o incumplimiento de las normas del marketplace.',
    limitsDisclaimer:
      'Los anuncios rechazados no son visibles públicamente en el catálogo.',
  },
}

export const PHOTO_SLOT_SPECS: Array<{
  slot: PhotoSlotType
  label: string
  hint: string
  requiredForReview: boolean
}> = [
  {
    slot: 'dial',
    label: 'Esfera completa',
    hint: 'Vista frontal nítida de esfera, índices, agujas y bisel.',
    requiredForReview: true,
  },
  {
    slot: 'caseback',
    label: 'Parte trasera',
    hint: 'Tapa trasera o fondo visto mostrando grabados y estado.',
    requiredForReview: true,
  },
  {
    slot: 'crown_sides',
    label: 'Laterales y corona',
    hint: 'Perfil de la carrura, asas, pulsadores y firma de la corona.',
    requiredForReview: true,
  },
  {
    slot: 'clasp_strap',
    label: 'Cierre y brazalete o correa',
    hint: 'Cierre desplegable/hebilla, interior del armis o correa.',
    requiredForReview: true,
  },
  {
    slot: 'ref_serial',
    label: 'Referencia y número de serie',
    hint: 'Se ocultará públicamente si marcas la casilla de serie sensible.',
    requiredForReview: false,
  },
  {
    slot: 'extra',
    label: 'Caja, documentación o detalle extra',
    hint: 'Dotación incluida, tarjeta, cronocomparador o foto en muñeca.',
    requiredForReview: false,
  },
]

export const ALLOWED_IMAGE_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB
export const MIN_LISTING_IMAGES = 4
export const MAX_LISTING_IMAGES = 10

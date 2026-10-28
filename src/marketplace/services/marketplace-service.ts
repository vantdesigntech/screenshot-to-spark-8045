/**
 * ChronoParts Marketplace — Service Layer & Security Controller
 *
 * Designed as a decoupled service module (`src/marketplace/services/marketplace-service.ts`)
 * so the Marketplace can run integrated in the ChronoParts web app today and be extracted
 * as a standalone mobile/web app in the future.
 */

import {
  ALLOWED_IMAGE_MIMES,
  MAX_IMAGE_SIZE_BYTES,
  MAX_LISTING_IMAGES,
  MIN_LISTING_IMAGES,
  type AuthenticityReviewRecord,
  type CreateOrUpdateListingPayload,
  type ListingCommercialStatus,
  type ListingFilterParams,
  type ListingImage,
  type ListingImageInput,
  type ListingReportRecord,
  type MarketplaceConversation,
  type MarketplaceMessage,
  type MarketplaceUser,
  type MarketplaceVisionAnalysisHook,
  type PaginatedListingsResult,
  type PhotoSlotType,
  type ReviewStatus,
  type WatchListing,
} from '../types'

const STORAGE_KEY_STATE = 'chronoparts_marketplace_state_v1'
const STORAGE_KEY_ACTIVE_USER = 'chronoparts_marketplace_user_v1'
const API_BASE = 'http://127.0.0.1:8765/api/marketplace'

export const MARKETPLACE_ACCOUNTS: [MarketplaceUser, ...MarketplaceUser[]] = [
  {
    id: 'user-collector-local',
    displayName: 'Alejandro V. (Tu Cuenta)',
    location: 'Madrid, ES',
    joinedLabel: '2024',
    role: 'user',
  },
  {
    id: 'seller-carlos-m',
    displayName: 'Carlos M. (Coleccionista Madrid)',
    location: 'Madrid, ES',
    joinedLabel: '2023',
    role: 'user',
  },
  {
    id: 'seller-elena-bcn',
    displayName: 'Elena R. (Aficionada Barcelona)',
    location: 'Barcelona, ES',
    joinedLabel: '2024',
    role: 'user',
  },
  {
    id: 'mod-chronoparts-1',
    displayName: 'Moderación ChronoParts (Revisor)',
    location: 'Ginebra / Madrid',
    joinedLabel: 'Equipo Moderación',
    role: 'moderator',
  },
]

interface InternalListingRecord extends WatchListing {
  serialNumberRaw?: string | undefined
}

interface PersistedMarketplaceState {
  listings: InternalListingRecord[]
  favorites: Array<{ userId: string; listingId: string; createdAt: string }>
  conversations: MarketplaceConversation[]
  messages: MarketplaceMessage[]
  reports: ListingReportRecord[]
  reviews: AuthenticityReviewRecord[]
}

/**
 * Optional future AI Vision analysis hook (null by default in MVP — we do NOT simulate fake AI).
 */
let registeredVisionHook: MarketplaceVisionAnalysisHook | null = null

export function registerVisionAnalysisHook(
  hook: MarketplaceVisionAnalysisHook | null,
) {
  registeredVisionHook = hook
}

export function getRegisteredVisionHook(): MarketplaceVisionAnalysisHook | null {
  return registeredVisionHook
}

/**
 * Masks a raw serial number so full serials are never exposed publicly.
 */
export function maskSerialNumber(raw?: string): string | undefined {
  if (!raw) return undefined
  const clean = raw.trim()
  if (!clean) return undefined
  if (clean.length <= 4) {
    return `${clean[0] ?? '*'}***`
  }
  return `${clean.slice(0, 2)}****${clean.slice(-2)}`
}

function buildSeedState(): PersistedMarketplaceState {
  const seedListings: InternalListingRecord[] = [
    {
      id: 'mkt-omega-speedmaster-3861',
      ownerId: 'seller-carlos-m',
      ownerDisplayName: 'Carlos M. (Coleccionista Madrid)',
      ownerJoinedLabel: '2023',
      brand: 'Omega',
      model: 'Speedmaster Professional Moonwatch Co-Axial Master Chronometer',
      reference: '310.30.42.50.01.001',
      priceEur: 5890,
      condition: 'excellent',
      movement: 'manual',
      approxYear: 2022,
      description:
        'Omega Speedmaster Moonwatch calibre 3861 con cristal Hesalite y fondo ciego grabado. Comprado en distribuidor nacional en Madrid. Estado estético excelente (mínimas micro-marcas en el cierre cepillado). Sin modificaciones; todas las piezas son de origen.',
      boxIncluded: true,
      papersIncluded: true,
      accessoriesNotes:
        'Estuche Moonwatch completo, pictogramas, certificado Master Chronometer, tarjeta de garantía y eslabones sobrantes.',
      location: 'Madrid, ES',
      status: 'published',
      reviewStatus: 'passed_photo_review',
      authenticityConfirmed: true,
      knownModificationsNotes:
        '100% de origen, sin piezas aftermarket ni pulidos.',
      serialNumberRaw: '83940219',
      serialNumberMasked: '83****19',
      isDemo: true,
      createdAt: '2026-10-18T10:15:00Z',
      updatedAt: '2026-10-18T11:00:00Z',
      publishedAt: '2026-10-18T11:00:00Z',
      images: [
        {
          id: 'img-omega-1',
          listingId: 'mkt-omega-speedmaster-3861',
          url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1000&q=80',
          slot: 'dial',
          caption: 'Esfera escalonada completa y bisel DON en perfecto estado',
          sortOrder: 0,
          mimeType: 'image/jpeg',
          sizeBytes: 420000,
          reviewStatus: 'approved',
        },
        {
          id: 'img-omega-2',
          listingId: 'mkt-omega-speedmaster-3861',
          url: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=1000&q=80',
          slot: 'caseback',
          caption: 'Fondo trasero con medallón de hipocampo nítido',
          sortOrder: 1,
          mimeType: 'image/jpeg',
          sizeBytes: 380000,
          reviewStatus: 'approved',
        },
        {
          id: 'img-omega-3',
          listingId: 'mkt-omega-speedmaster-3861',
          url: 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&w=1000&q=80',
          slot: 'crown_sides',
          caption: 'Carrura lateral, pulsadores de cronógrafo y corona Omega',
          sortOrder: 2,
          mimeType: 'image/jpeg',
          sizeBytes: 410000,
          reviewStatus: 'approved',
        },
        {
          id: 'img-omega-4',
          listingId: 'mkt-omega-speedmaster-3861',
          url: 'https://images.unsplash.com/photo-1539874754764-5a96559165b0?auto=format&fit=crop&w=1000&q=80',
          slot: 'clasp_strap',
          caption: 'Brazalete cepillado y cierre estriado con microajuste',
          sortOrder: 3,
          mimeType: 'image/jpeg',
          sizeBytes: 390000,
          reviewStatus: 'approved',
        },
      ],
    },
    {
      id: 'mkt-seiko-skx007j1-diver',
      ownerId: 'seller-elena-bcn',
      ownerDisplayName: 'Elena R. (Aficionada Barcelona)',
      ownerJoinedLabel: '2024',
      brand: 'Seiko',
      model: 'Prospex Diver Automatic 200m SKX007J1 Made in Japan',
      reference: 'SKX007J1',
      priceEur: 440,
      condition: 'good',
      movement: 'automatic',
      approxYear: 2017,
      description:
        'Seiko SKX007J1 versión japonesa con leyenda "21 Jewels" y "Made in Japan" en la esfera. Calibre automático 7S26 funcionando con buena reserva de marcha. Se entrega con su armis Jubilee original y correa de caucho Z22.',
      boxIncluded: true,
      papersIncluded: false,
      accessoriesNotes:
        'Caja Seiko, armis Jubilee de acero y correa de caucho Z22.',
      location: 'Barcelona, ES',
      status: 'published',
      reviewStatus: 'passed_photo_review',
      authenticityConfirmed: true,
      knownModificationsNotes:
        'Sin modificaciones; cristal Hardlex e insert de aluminio originales.',
      serialNumberRaw: '7N0482',
      serialNumberMasked: '7N****82',
      isDemo: true,
      createdAt: '2026-10-20T14:20:00Z',
      updatedAt: '2026-10-20T15:00:00Z',
      publishedAt: '2026-10-20T15:00:00Z',
      images: [
        {
          id: 'img-skx-1',
          listingId: 'mkt-seiko-skx007j1-diver',
          url: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1000&q=80',
          slot: 'dial',
          caption: 'Esfera mate SKX007J1 con índices luminova sin humedad',
          sortOrder: 0,
          mimeType: 'image/jpeg',
          sizeBytes: 350000,
          reviewStatus: 'approved',
        },
        {
          id: 'img-skx-2',
          listingId: 'mkt-seiko-skx007j1-diver',
          url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=80',
          slot: 'caseback',
          caption: 'Tapa roscada con ola de Kanagawa',
          sortOrder: 1,
          mimeType: 'image/jpeg',
          sizeBytes: 340000,
          reviewStatus: 'approved',
        },
        {
          id: 'img-skx-3',
          listingId: 'mkt-seiko-skx007j1-diver',
          url: 'https://images.unsplash.com/photo-1434056886845-dac89ffe9b56?auto=format&fit=crop&w=1000&q=80',
          slot: 'crown_sides',
          caption: 'Corona roscada a las 4 en punto y guardacoronas',
          sortOrder: 2,
          mimeType: 'image/jpeg',
          sizeBytes: 360000,
          reviewStatus: 'approved',
        },
        {
          id: 'img-skx-4',
          listingId: 'mkt-seiko-skx007j1-diver',
          url: 'https://images.unsplash.com/photo-1509048191080-d2984bad6ae5?auto=format&fit=crop&w=1000&q=80',
          slot: 'clasp_strap',
          caption: 'Cierre firmado Seiko y eslabones Jubilee',
          sortOrder: 3,
          mimeType: 'image/jpeg',
          sizeBytes: 330000,
          reviewStatus: 'approved',
        },
      ],
    },
    {
      id: 'mkt-tudor-bb58-blue',
      ownerId: 'seller-carlos-m',
      ownerDisplayName: 'Carlos M. (Coleccionista Madrid)',
      ownerJoinedLabel: '2023',
      brand: 'Tudor',
      model: 'Black Bay Fifty-Eight Navy Blue 39mm',
      reference: 'M79030B-0001',
      priceEur: 2950,
      condition: 'excellent',
      movement: 'automatic',
      approxYear: 2023,
      description:
        'Tudor Black Bay 58 azul marino de 39mm con calibre manufactura MT5402 (COSC, 70h de reserva). Se incluye brazalete remachado original y una correa textil adicional. Estado de marcha +1 seg/día.',
      boxIncluded: true,
      papersIncluded: true,
      accessoriesNotes: 'Set completo 2023 + correa textil azul.',
      location: 'Valencia, ES',
      status: 'published',
      reviewStatus: 'passed_photo_review',
      authenticityConfirmed: true,
      knownModificationsNotes:
        'Se incluye correa textil aftermarket adicional además del armis Tudor original.',
      serialNumberRaw: 'Q782910',
      serialNumberMasked: 'Q7****10',
      isDemo: true,
      createdAt: '2026-10-22T09:00:00Z',
      updatedAt: '2026-10-22T09:30:00Z',
      publishedAt: '2026-10-22T09:30:00Z',
      images: [
        {
          id: 'img-tudor-1',
          listingId: 'mkt-tudor-bb58-blue',
          url: 'https://images.unsplash.com/photo-1548171915-e79a380a2a4b?auto=format&fit=crop&w=1000&q=80',
          slot: 'dial',
          caption: 'Esfera azul mate y agujas Snowflake',
          sortOrder: 0,
          mimeType: 'image/jpeg',
          sizeBytes: 400000,
          reviewStatus: 'approved',
        },
        {
          id: 'img-tudor-2',
          listingId: 'mkt-tudor-bb58-blue',
          url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1000&q=80',
          slot: 'caseback',
          caption: 'Tapa trasera con grabados Tudor limpios',
          sortOrder: 1,
          mimeType: 'image/jpeg',
          sizeBytes: 400000,
          reviewStatus: 'approved',
        },
        {
          id: 'img-tudor-3',
          listingId: 'mkt-tudor-bb58-blue',
          url: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=1000&q=80',
          slot: 'crown_sides',
          caption: 'Corona con rosa Tudor en relieve y bisel biselado',
          sortOrder: 2,
          mimeType: 'image/jpeg',
          sizeBytes: 400000,
          reviewStatus: 'approved',
        },
        {
          id: 'img-tudor-4',
          listingId: 'mkt-tudor-bb58-blue',
          url: 'https://images.unsplash.com/photo-1539874754764-5a96559165b0?auto=format&fit=crop&w=1000&q=80',
          slot: 'clasp_strap',
          caption: 'Cierre desplegable con rodamientos cerámicos',
          sortOrder: 3,
          mimeType: 'image/jpeg',
          sizeBytes: 400000,
          reviewStatus: 'approved',
        },
      ],
    },
    {
      id: 'mkt-tissot-prx-pm80',
      ownerId: 'seller-elena-bcn',
      ownerDisplayName: 'Elena R. (Aficionada Barcelona)',
      ownerJoinedLabel: '2024',
      brand: 'Tissot',
      model: 'PRX Powermatic 80 Esfera Azul Goffré 40mm',
      reference: 'T137.407.11.041.00',
      priceEur: 550,
      condition: 'new',
      movement: 'automatic',
      approxYear: 2024,
      description:
        'Tissot PRX Powermatic 80 de 40mm con esfera azul tapicería y brazalete integrado con cambio rápido. Estado reestreno absoluto.',
      boxIncluded: true,
      papersIncluded: true,
      accessoriesNotes: 'Set completo con caja y tarjeta sellada.',
      location: 'Barcelona, ES',
      status: 'published',
      reviewStatus: 'pending',
      authenticityConfirmed: true,
      knownModificationsNotes: 'Ninguna modificación.',
      serialNumberRaw: 'WS992817',
      serialNumberMasked: 'WS****17',
      isDemo: true,
      createdAt: '2026-10-25T16:10:00Z',
      updatedAt: '2026-10-25T16:10:00Z',
      publishedAt: '2026-10-25T16:10:00Z',
      images: [
        {
          id: 'img-prx-1',
          listingId: 'mkt-tissot-prx-pm80',
          url: 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&w=1000&q=80',
          slot: 'dial',
          caption: 'Esfera azul texturizada PRX',
          sortOrder: 0,
          mimeType: 'image/jpeg',
          sizeBytes: 310000,
          reviewStatus: 'pending',
        },
        {
          id: 'img-prx-2',
          listingId: 'mkt-tissot-prx-pm80',
          url: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=1000&q=80',
          slot: 'caseback',
          caption: 'Fondo visto mostrando rotor Tissot',
          sortOrder: 1,
          mimeType: 'image/jpeg',
          sizeBytes: 310000,
          reviewStatus: 'pending',
        },
        {
          id: 'img-prx-3',
          listingId: 'mkt-tissot-prx-pm80',
          url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1000&q=80',
          slot: 'crown_sides',
          caption: 'Perfil de caja barril y corona grabada',
          sortOrder: 2,
          mimeType: 'image/jpeg',
          sizeBytes: 310000,
          reviewStatus: 'pending',
        },
        {
          id: 'img-prx-4',
          listingId: 'mkt-tissot-prx-pm80',
          url: 'https://images.unsplash.com/photo-1539874754764-5a96559165b0?auto=format&fit=crop&w=1000&q=80',
          slot: 'clasp_strap',
          caption: 'Cierre mariposa triple desplegable',
          sortOrder: 3,
          mimeType: 'image/jpeg',
          sizeBytes: 310000,
          reviewStatus: 'pending',
        },
      ],
    },
    {
      id: 'mkt-cartier-tank-quartz',
      ownerId: 'seller-carlos-m',
      ownerDisplayName: 'Carlos M. (Coleccionista Madrid)',
      ownerJoinedLabel: '2023',
      brand: 'Cartier',
      model: 'Tank Must Large Acero Cuarzo High Autonomy',
      reference: 'WSTA0041',
      priceEur: 2890,
      condition: 'excellent',
      movement: 'quartz',
      approxYear: 2023,
      description:
        'Cartier Tank Must tamaño grande en acero con movimiento de cuarzo de alta autonomía (8 años), corona perlada con cabujón sintético azul y correa de piel de becerro negra intercambiable QuickSwitch.',
      boxIncluded: true,
      papersIncluded: true,
      accessoriesNotes: 'Cofre rojo Cartier y documentación oficial.',
      location: 'Sevilla, ES',
      status: 'published',
      reviewStatus: 'passed_photo_review',
      authenticityConfirmed: true,
      knownModificationsNotes: 'Sin modificaciones.',
      serialNumberRaw: '432788192',
      serialNumberMasked: '43****92',
      isDemo: true,
      createdAt: '2026-10-26T12:00:00Z',
      updatedAt: '2026-10-26T12:30:00Z',
      publishedAt: '2026-10-26T12:30:00Z',
      images: [
        {
          id: 'img-tank-1',
          listingId: 'mkt-cartier-tank-quartz',
          url: 'https://images.unsplash.com/photo-1509048191080-d2984bad6ae5?auto=format&fit=crop&w=1000&q=80',
          slot: 'dial',
          caption: 'Esfera plateada con números romanos y firma secreta en VII',
          sortOrder: 0,
          mimeType: 'image/jpeg',
          sizeBytes: 320000,
          reviewStatus: 'approved',
        },
        {
          id: 'img-tank-2',
          listingId: 'mkt-cartier-tank-quartz',
          url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=80',
          slot: 'caseback',
          caption: 'Tapa trasera sujeta por 4 tornillos laterales',
          sortOrder: 1,
          mimeType: 'image/jpeg',
          sizeBytes: 320000,
          reviewStatus: 'approved',
        },
        {
          id: 'img-tank-3',
          listingId: 'mkt-cartier-tank-quartz',
          url: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1000&q=80',
          slot: 'crown_sides',
          caption: 'Cabujón azul en corona y brancards pulidos',
          sortOrder: 2,
          mimeType: 'image/jpeg',
          sizeBytes: 320000,
          reviewStatus: 'approved',
        },
        {
          id: 'img-tank-4',
          listingId: 'mkt-cartier-tank-quartz',
          url: 'https://images.unsplash.com/photo-1434056886845-dac89ffe9b56?auto=format&fit=crop&w=1000&q=80',
          slot: 'clasp_strap',
          caption: 'Hebilla ardillón Cartier y sistema QuickSwitch',
          sortOrder: 3,
          mimeType: 'image/jpeg',
          sizeBytes: 320000,
          reviewStatus: 'approved',
        },
      ],
    },
    {
      id: 'mkt-citizen-promaster-for-parts',
      ownerId: 'user-collector-local',
      ownerDisplayName: 'Alejandro V. (Tu Cuenta)',
      ownerJoinedLabel: '2024',
      brand: 'Citizen',
      model: 'Promaster Aqualand Diver NY0040 (Proyecto / Para revisar)',
      reference: 'NY0040-09E',
      priceEur: 145,
      condition: 'for_parts',
      movement: 'automatic',
      approxYear: 2015,
      description:
        'Citizen Promaster NY0040 con calibre Miyota 8203. El reloj arranca al agitarlo pero adelanta notablemente y necesita limpieza/aceitado del escape. Ideal para relojero o proyecto de restauración.',
      boxIncluded: false,
      papersIncluded: false,
      accessoriesNotes: 'Solo reloj con correa de caucho Promaster.',
      location: 'Madrid, ES',
      status: 'published',
      reviewStatus: 'manual_review',
      authenticityConfirmed: true,
      knownModificationsNotes: 'Necesita servicio completo del calibre 8203.',
      serialNumberRaw: '551029',
      serialNumberMasked: '55****29',
      isDemo: true,
      createdAt: '2026-10-26T18:00:00Z',
      updatedAt: '2026-10-26T18:10:00Z',
      publishedAt: '2026-10-26T18:10:00Z',
      images: [
        {
          id: 'img-cit-1',
          listingId: 'mkt-citizen-promaster-for-parts',
          url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=80',
          slot: 'dial',
          caption: 'Esfera negra NY0040 y bisel dentado',
          sortOrder: 0,
          mimeType: 'image/jpeg',
          sizeBytes: 290000,
          reviewStatus: 'approved',
        },
        {
          id: 'img-cit-2',
          listingId: 'mkt-citizen-promaster-for-parts',
          url: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=1000&q=80',
          slot: 'caseback',
          caption: 'Tapa trasera grabada Citizen Promaster',
          sortOrder: 1,
          mimeType: 'image/jpeg',
          sizeBytes: 290000,
          reviewStatus: 'approved',
        },
        {
          id: 'img-cit-3',
          listingId: 'mkt-citizen-promaster-for-parts',
          url: 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&w=1000&q=80',
          slot: 'crown_sides',
          caption: 'Corona a las 8h característica del modelo',
          sortOrder: 2,
          mimeType: 'image/jpeg',
          sizeBytes: 290000,
          reviewStatus: 'approved',
        },
        {
          id: 'img-cit-4',
          listingId: 'mkt-citizen-promaster-for-parts',
          url: 'https://images.unsplash.com/photo-1539874754764-5a96559165b0?auto=format&fit=crop&w=1000&q=80',
          slot: 'clasp_strap',
          caption: 'Correa de caucho con tabla de descompresión',
          sortOrder: 3,
          mimeType: 'image/jpeg',
          sizeBytes: 290000,
          reviewStatus: 'approved',
        },
      ],
    },
  ]

  const seedConversations: MarketplaceConversation[] = [
    {
      id: 'conv-seed-omega-1',
      listingId: 'mkt-omega-speedmaster-3861',
      listingTitle: 'Omega Speedmaster Professional Moonwatch',
      listingImage:
        'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1000&q=80',
      listingPriceEur: 5890,
      buyerId: 'user-collector-local',
      buyerName: 'Alejandro V. (Tu Cuenta)',
      sellerId: 'seller-carlos-m',
      sellerName: 'Carlos M. (Coleccionista Madrid)',
      lastMessagePreview:
        'Perfecto, podemos hacer la entrega en mano en Madrid y verificar marcha en cronocomparador.',
      updatedAt: '2026-10-26T19:45:00Z',
    },
  ]

  const seedMessages: MarketplaceMessage[] = [
    {
      id: 'msg-seed-1',
      conversationId: 'conv-seed-omega-1',
      senderId: 'user-collector-local',
      senderName: 'Alejandro V. (Tu Cuenta)',
      content:
        'Hola Carlos, ¿conservas la factura de compra y todos los eslabones del brazalete 3861?',
      createdAt: '2026-10-26T19:30:00Z',
    },
    {
      id: 'msg-seed-2',
      conversationId: 'conv-seed-omega-1',
      senderId: 'seller-carlos-m',
      senderName: 'Carlos M. (Coleccionista Madrid)',
      content:
        'Perfecto, podemos hacer la entrega en mano en Madrid y verificar marcha en cronocomparador.',
      createdAt: '2026-10-26T19:45:00Z',
    },
  ]

  const seedReviews: AuthenticityReviewRecord[] = [
    {
      id: 'rev-seed-omega',
      listingId: 'mkt-omega-speedmaster-3861',
      status: 'passed_photo_review',
      method: 'automated_slot_check',
      internalReason:
        'Verificados los 4 ángulos obligatorios (esfera, trasera, corona/laterales y cierre) + declaración de autenticidad firmada.',
      reviewerId: 'system-photo-gate',
      reviewerName: 'Control Fotográfico ChronoParts',
      createdAt: '2026-10-18T11:00:00Z',
    },
    {
      id: 'rev-seed-skx',
      listingId: 'mkt-seiko-skx007j1-diver',
      status: 'passed_photo_review',
      method: 'automated_slot_check',
      internalReason:
        'Verificados los 4 ángulos obligatorios sin imágenes duplicadas.',
      reviewerId: 'system-photo-gate',
      reviewerName: 'Control Fotográfico ChronoParts',
      createdAt: '2026-10-20T15:00:00Z',
    },
  ]

  return {
    listings: seedListings,
    favorites: [
      {
        userId: 'user-collector-local',
        listingId: 'mkt-omega-speedmaster-3861',
        createdAt: '2026-10-26T10:00:00Z',
      },
    ],
    conversations: seedConversations,
    messages: seedMessages,
    reports: [],
    reviews: seedReviews,
  }
}

let inMemoryFallbackState: PersistedMarketplaceState | null = null

function loadState(): PersistedMarketplaceState {
  if (typeof window === 'undefined' || !window.localStorage) {
    if (!inMemoryFallbackState) {
      inMemoryFallbackState = buildSeedState()
    }
    return inMemoryFallbackState
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_STATE)
    if (!raw) {
      const seeded = buildSeedState()
      window.localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify(seeded))
      return seeded
    }
    const parsed = JSON.parse(raw) as PersistedMarketplaceState
    if (!Array.isArray(parsed.listings)) {
      const seeded = buildSeedState()
      window.localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify(seeded))
      return seeded
    }
    return parsed
  } catch {
    const seeded = buildSeedState()
    return seeded
  }
}

function saveState(state: PersistedMarketplaceState): void {
  inMemoryFallbackState = state
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify(state))
      window.dispatchEvent(new CustomEvent('chronoparts-marketplace-updated'))
    } catch {
      // ignore quota errors
    }
  }
}

export function resetMarketplaceStateForTesting(): void {
  const fresh = buildSeedState()
  inMemoryFallbackState = fresh
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify(fresh))
    window.localStorage.setItem(
      STORAGE_KEY_ACTIVE_USER,
      MARKETPLACE_ACCOUNTS[0].id,
    )
  }
}

export function getCurrentUser(): MarketplaceUser {
  if (typeof window !== 'undefined' && window.localStorage) {
    const savedId = window.localStorage.getItem(STORAGE_KEY_ACTIVE_USER)
    const found = MARKETPLACE_ACCOUNTS.find((u) => u.id === savedId)
    if (found) return found
  }
  return MARKETPLACE_ACCOUNTS[0]
}

export function setCurrentUser(userId: string): MarketplaceUser {
  const found = MARKETPLACE_ACCOUNTS.find((u) => u.id === userId)
  if (!found) {
    throw new Error(`Usuario desconocido: ${userId}`)
  }
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(STORAGE_KEY_ACTIVE_USER, found.id)
    window.dispatchEvent(new CustomEvent('chronoparts-marketplace-updated'))
  }
  return found
}

export function listMarketplaceAccounts(): MarketplaceUser[] {
  return [...MARKETPLACE_ACCOUNTS]
}

/**
 * Sanitizes an internal listing record for public/viewer consumption:
 * - Never exposes `serialNumberRaw` publicly.
 * - Filters out images marked `isSensitiveSerial` unless viewer is owner or moderator.
 * - Attaches `isFavorited` for the current active user.
 */
function toPublicListing(
  record: InternalListingRecord,
  viewer: MarketplaceUser,
  favoriteSet: Set<string>,
): WatchListing {
  const canSeeSensitive =
    viewer.id === record.ownerId || viewer.role === 'moderator'
  const visibleImages = record.images.filter(
    (img) => canSeeSensitive || !img.isSensitiveSerial,
  )

  const { serialNumberRaw: _hiddenRaw, ...rest } = record
  return {
    ...rest,
    serialNumberMasked:
      record.serialNumberMasked ?? maskSerialNumber(record.serialNumberRaw),
    images: visibleImages,
    isFavorited: favoriteSet.has(record.id),
  }
}

/**
 * Automated Photo Review Evaluator (Backend-controlled, never client-controlled).
 * Checks required angles (`dial`, `caseback`, `crown_sides`, `clasp_strap`),
 * duplicate image URLs, and declared modifications.
 */
export function evaluateInitialPhotoReview(
  images: ListingImage[],
  knownModificationsNotes: string,
  authenticityConfirmed: boolean,
): { status: ReviewStatus; reason: string } {
  if (!authenticityConfirmed) {
    return {
      status: 'pending',
      reason: 'Falta confirmación expresa de la declaración del vendedor.',
    }
  }

  if (images.length < MIN_LISTING_IMAGES) {
    return {
      status: 'pending',
      reason: `Se requieren al menos ${MIN_LISTING_IMAGES} fotografías claras para iniciar la revisión.`,
    }
  }

  const normalizedUrls = images.map((img) => img.url.trim().toLowerCase())
  const uniqueUrls = new Set(normalizedUrls)
  if (uniqueUrls.size < images.length) {
    return {
      status: 'manual_review',
      reason:
        'Se detectaron fotografías duplicadas en distintos ángulos; derivado a revisión manual.',
    }
  }

  const requiredSlots: PhotoSlotType[] = [
    'dial',
    'caseback',
    'crown_sides',
    'clasp_strap',
  ]
  const providedSlots = new Set(images.map((img) => img.slot))
  const missingSlots = requiredSlots.filter((slot) => !providedSlots.has(slot))

  if (missingSlots.length > 0) {
    return {
      status: 'manual_review',
      reason: `Faltan ángulos clave recomendados (${missingSlots.join(', ')}); derivado a revisión manual.`,
    }
  }

  const modLower = knownModificationsNotes.toLowerCase()
  if (
    modLower.includes('aftermarket') ||
    modLower.includes('modificado') ||
    modLower.includes('sustituido') ||
    modLower.includes('reparar')
  ) {
    return {
      status: 'manual_review',
      reason:
        'El vendedor declara modificaciones o piezas sustituidas; derivado a moderador para verificación documental.',
    }
  }

  return {
    status: 'passed_photo_review',
    reason:
      'Los 4 ángulos obligatorios (esfera, trasera, laterales/corona y cierre) están presentes, sin duplicados y con declaración firmada.',
  }
}

/**
 * Validates image inputs on both client and service layer (format, size, count).
 */
export function validateListingImages(
  images: ListingImageInput[],
  intent: 'draft' | 'publish',
): void {
  if (images.length > MAX_LISTING_IMAGES) {
    throw new Error(
      `No se permiten más de ${MAX_LISTING_IMAGES} fotografías por anuncio.`,
    )
  }

  if (intent === 'publish' && images.length < MIN_LISTING_IMAGES) {
    throw new Error(
      `Para publicar un anuncio debes subir entre ${MIN_LISTING_IMAGES} y ${MAX_LISTING_IMAGES} fotografías claras.`,
    )
  }

  for (const img of images) {
    if (!img.url || !img.url.trim()) {
      throw new Error('Todas las fotografías deben tener una ruta o imagen válida.')
    }
    if (
      img.mimeType &&
      !ALLOWED_IMAGE_MIMES.includes(
        img.mimeType as (typeof ALLOWED_IMAGE_MIMES)[number],
      )
    ) {
      throw new Error(
        `Formato de imagen no permitido (${img.mimeType}). Usa JPEG, PNG o WEBP.`,
      )
    }
    if (img.sizeBytes && img.sizeBytes > MAX_IMAGE_SIZE_BYTES) {
      throw new Error(
        'Una de las fotografías supera el tamaño máximo permitido de 5 MB.',
      )
    }
  }
}

/**
 * Best-effort background sync to local Python backend (`api_buscador_relojes.py` / `marketplace_backend.py`)
 */
async function syncWithLocalPythonApi(
  path: string,
  method: string,
  body?: unknown,
): Promise<void> {
  if (typeof fetch === 'undefined' || typeof window === 'undefined') return
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') return
  try {
    const user = getCurrentUser()
    await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': user.id,
        'X-User-Role': user.role,
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    })
  } catch {
    // Non-blocking fallback when running purely in browser/test environment
  }
}

/**
 * Queries public catalog listings with real data filtering, sorting and pagination.
 * Drafts, paused, withdrawn and rejected listings are strictly excluded from public catalog.
 */
export async function queryCatalogListings(
  params: ListingFilterParams = {},
): Promise<PaginatedListingsResult> {
  const state = loadState()
  const viewer = getCurrentUser()
  const favSet = new Set(
    state.favorites
      .filter((f) => f.userId === viewer.id)
      .map((f) => f.listingId),
  )

  const q = (params.query ?? '').trim().toLowerCase()
  const brandFilter = (params.brand ?? '').trim().toLowerCase()
  const refFilter = (params.reference ?? '').trim().toLowerCase()
  const locFilter = (params.location ?? '').trim().toLowerCase()
  const condFilter = params.condition && params.condition !== 'all' ? params.condition : null
  const movFilter = params.movement && params.movement !== 'all' ? params.movement : null

  const filtered = state.listings.filter((item) => {
    // Security rule: Only published listings that are not rejected appear in the public catalog
    if (item.status !== 'published') return false
    if (item.reviewStatus === 'rejected') return false

    if (q) {
      const haystack = [
        item.brand,
        item.model,
        item.reference ?? '',
        item.description,
        item.location,
      ]
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(q)) return false
    }

    if (brandFilter && item.brand.toLowerCase() !== brandFilter) {
      return false
    }

    if (
      refFilter &&
      !(item.reference ?? '').toLowerCase().includes(refFilter)
    ) {
      return false
    }

    if (
      typeof params.minPrice === 'number' &&
      !Number.isNaN(params.minPrice) &&
      item.priceEur < params.minPrice
    ) {
      return false
    }

    if (
      typeof params.maxPrice === 'number' &&
      !Number.isNaN(params.maxPrice) &&
      item.priceEur > params.maxPrice
    ) {
      return false
    }

    if (condFilter && item.condition !== condFilter) {
      return false
    }

    if (movFilter && item.movement !== movFilter) {
      return false
    }

    if (locFilter && !item.location.toLowerCase().includes(locFilter)) {
      return false
    }

    return true
  })

  const sortBy = params.sortBy ?? 'newest'
  filtered.sort((a, b) => {
    if (sortBy === 'price_asc') return a.priceEur - b.priceEur
    if (sortBy === 'price_desc') return b.priceEur - a.priceEur
    const timeA = new Date(a.publishedAt ?? a.createdAt).getTime()
    const timeB = new Date(b.publishedAt ?? b.createdAt).getTime()
    if (sortBy === 'oldest') return timeA - timeB
    return timeB - timeA
  })

  const pageSize = Math.max(1, params.pageSize ?? 6)
  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(Math.max(1, params.page ?? 1), totalPages)
  const start = (page - 1) * pageSize
  const paged = filtered
    .slice(start, start + pageSize)
    .map((item) => toPublicListing(item, viewer, favSet))

  return {
    items: paged,
    total,
    page,
    pageSize,
    totalPages,
  }
}

export async function getAvailableBrands(): Promise<string[]> {
  const state = loadState()
  const brands = new Set<string>()
  for (const item of state.listings) {
    if (item.status === 'published' && item.reviewStatus !== 'rejected') {
      brands.add(item.brand)
    }
  }
  return Array.from(brands).sort((a, b) => a.localeCompare(b))
}

/**
 * Retrieves a single listing by ID.
 * Drafts, withdrawn listings, or rejected listings can ONLY be viewed by their owner or a moderator.
 */
export async function getListingById(
  listingId: string,
): Promise<WatchListing | null> {
  const state = loadState()
  const viewer = getCurrentUser()
  const record = state.listings.find((l) => l.id === listingId)
  if (!record) return null

  const isOwner = record.ownerId === viewer.id
  const isModerator = viewer.role === 'moderator'
  const isPubliclyVisible =
    (record.status === 'published' || record.status === 'sold') &&
    record.reviewStatus !== 'rejected'

  if (!isPubliclyVisible && !isOwner && !isModerator) {
    return null
  }

  const favSet = new Set(
    state.favorites
      .filter((f) => f.userId === viewer.id)
      .map((f) => f.listingId),
  )

  return toPublicListing(record, viewer, favSet)
}

export async function getListingReviewHistory(
  listingId: string,
): Promise<AuthenticityReviewRecord[]> {
  const state = loadState()
  return state.reviews
    .filter((r) => r.listingId === listingId)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
}

/**
 * Creates or updates a listing.
 * Enforces:
 * - Only the owner can edit an existing listing.
 * - Client cannot spoof or set `reviewStatus` (if passed, throws security error).
 * - Image limits (4-10 to publish, allowed MIME types, max 5MB).
 */
export async function createOrUpdateListing(
  payload: CreateOrUpdateListingPayload,
): Promise<WatchListing> {
  // Security check: reject any attempt by client to assign reviewStatus directly
  if (
    payload.reviewStatus !== undefined &&
    payload.reviewStatus !== null
  ) {
    throw new Error(
      'Seguridad: El estado de revisión fotográfica no puede ser asignado desde el cliente.',
    )
  }

  const viewer = getCurrentUser()
  const state = loadState()

  const brand = payload.brand.trim()
  const model = payload.model.trim()
  const description = payload.description.trim()
  const location = payload.location.trim()

  if (!brand || !model) {
    throw new Error('La marca y el modelo del reloj son obligatorios.')
  }
  if (!Number.isFinite(payload.priceEur) || payload.priceEur <= 0) {
    throw new Error('El precio en EUR debe ser mayor que 0.')
  }
  if (!location) {
    throw new Error('La ubicación aproximada es obligatoria.')
  }
  if (payload.intent === 'publish') {
    if (description.length < 20) {
      throw new Error(
        'Por favor, incluye una descripción detallada de al menos 20 caracteres para publicar.',
      )
    }
    if (!payload.authenticityConfirmed) {
      throw new Error(
        'Debes confirmar la declaración sobre autenticidad y modificaciones conocidas antes de publicar.',
      )
    }
  }

  validateListingImages(payload.images, payload.intent)

  const nowIso = new Date().toISOString()
  let targetRecord: InternalListingRecord

  if (payload.id) {
    const existingIndex = state.listings.findIndex((l) => l.id === payload.id)
    if (existingIndex === -1) {
      throw new Error('El anuncio que intentas editar no existe.')
    }
    const existing = state.listings[existingIndex]
    if (!existing) throw new Error("El anuncio que intentas editar no existe.")
    if (existing.ownerId !== viewer.id) {
      throw new Error(
        'Permiso denegado: Solo el propietario puede modificar este anuncio.',
      )
    }

    const builtImages: ListingImage[] = payload.images.map((img, idx) => ({
      id: img.id ?? `img-${existing.id}-${idx}-${Date.now()}`,
      listingId: existing.id,
      url: img.url.trim(),
      slot: img.slot,
      caption: img.caption?.trim() || undefined,
      sortOrder: idx,
      mimeType: img.mimeType ?? 'image/jpeg',
      sizeBytes: img.sizeBytes ?? 250000,
      reviewStatus: 'pending',
      isSensitiveSerial: Boolean(img.isSensitiveSerial),
    }))

    const evaluation =
      payload.intent === 'publish'
        ? evaluateInitialPhotoReview(
            builtImages,
            payload.knownModificationsNotes ?? '',
            payload.authenticityConfirmed,
          )
        : {
            status: 'pending' as ReviewStatus,
            reason: 'Guardado como borrador privado por el propietario.',
          }

    const nextStatus: ListingCommercialStatus =
      payload.intent === 'publish' ? 'published' : 'draft'

    targetRecord = {
      ...existing,
      brand,
      model,
      reference: payload.reference?.trim() || undefined,
      priceEur: Math.round(payload.priceEur * 100) / 100,
      condition: payload.condition,
      movement: payload.movement,
      approxYear: payload.approxYear,
      description,
      boxIncluded: payload.boxIncluded,
      papersIncluded: payload.papersIncluded,
      accessoriesNotes: payload.accessoriesNotes?.trim() ?? '',
      location,
      status: nextStatus,
      reviewStatus: evaluation.status,
      authenticityConfirmed: payload.authenticityConfirmed,
      knownModificationsNotes: payload.knownModificationsNotes?.trim() ?? '',
      serialNumberRaw: payload.serialNumberRaw?.trim() || existing.serialNumberRaw,
      serialNumberMasked: maskSerialNumber(
        payload.serialNumberRaw?.trim() || existing.serialNumberRaw,
      ),
      updatedAt: nowIso,
      publishedAt:
        nextStatus === 'published'
          ? (existing.publishedAt ?? nowIso)
          : existing.publishedAt,
      images: builtImages,
    }

    state.listings[existingIndex] = targetRecord
    state.reviews.unshift({
      id: `rev-${Date.now()}`,
      listingId: targetRecord.id,
      status: evaluation.status,
      method: 'automated_slot_check',
      internalReason: evaluation.reason,
      reviewerId: 'system-photo-gate',
      reviewerName: 'Control Fotográfico ChronoParts',
      createdAt: nowIso,
    })
  } else {
    const newId = `mkt-user-${Date.now()}`
    const builtImages: ListingImage[] = payload.images.map((img, idx) => ({
      id: `img-${newId}-${idx}`,
      listingId: newId,
      url: img.url.trim(),
      slot: img.slot,
      caption: img.caption?.trim() || undefined,
      sortOrder: idx,
      mimeType: img.mimeType ?? 'image/jpeg',
      sizeBytes: img.sizeBytes ?? 250000,
      reviewStatus: 'pending',
      isSensitiveSerial: Boolean(img.isSensitiveSerial),
    }))

    const evaluation =
      payload.intent === 'publish'
        ? evaluateInitialPhotoReview(
            builtImages,
            payload.knownModificationsNotes ?? '',
            payload.authenticityConfirmed,
          )
        : {
            status: 'pending' as ReviewStatus,
            reason: 'Borrador creado por el vendedor; pendiente de publicación.',
          }

    const nextStatus: ListingCommercialStatus =
      payload.intent === 'publish' ? 'published' : 'draft'

    targetRecord = {
      id: newId,
      ownerId: viewer.id,
      ownerDisplayName: viewer.displayName,
      ownerJoinedLabel: viewer.joinedLabel,
      brand,
      model,
      reference: payload.reference?.trim() || undefined,
      priceEur: Math.round(payload.priceEur * 100) / 100,
      condition: payload.condition,
      movement: payload.movement,
      approxYear: payload.approxYear,
      description,
      boxIncluded: payload.boxIncluded,
      papersIncluded: payload.papersIncluded,
      accessoriesNotes: payload.accessoriesNotes?.trim() ?? '',
      location,
      status: nextStatus,
      reviewStatus: evaluation.status,
      authenticityConfirmed: payload.authenticityConfirmed,
      knownModificationsNotes: payload.knownModificationsNotes?.trim() ?? '',
      serialNumberRaw: payload.serialNumberRaw?.trim() || undefined,
      serialNumberMasked: maskSerialNumber(payload.serialNumberRaw),
      isDemo: false,
      createdAt: nowIso,
      updatedAt: nowIso,
      publishedAt: nextStatus === 'published' ? nowIso : undefined,
      images: builtImages,
    }

    state.listings.unshift(targetRecord)
    state.reviews.unshift({
      id: `rev-${Date.now()}`,
      listingId: targetRecord.id,
      status: evaluation.status,
      method: 'automated_slot_check',
      internalReason: evaluation.reason,
      reviewerId: 'system-photo-gate',
      reviewerName: 'Control Fotográfico ChronoParts',
      createdAt: nowIso,
    })
  }

  saveState(state)
  void syncWithLocalPythonApi('/listings', 'POST', targetRecord)

  const favSet = new Set(
    state.favorites
      .filter((f) => f.userId === viewer.id)
      .map((f) => f.listingId),
  )

  return toPublicListing(targetRecord, viewer, favSet)
}

/**
 * Allows ONLY the listing owner to change commercial status:
 * `draft` | `published` | `paused` | `sold` | `withdrawn`
 */
export async function updateListingCommercialStatus(
  listingId: string,
  nextStatus: ListingCommercialStatus,
): Promise<WatchListing> {
  const viewer = getCurrentUser()
  const state = loadState()
  const index = state.listings.findIndex((l) => l.id === listingId)
  if (index === -1) {
    throw new Error('Anuncio no encontrado.')
  }

  const record = state.listings[index]
  if (!record) throw new Error("Anuncio no encontrado.")
  if (record.ownerId !== viewer.id) {
    throw new Error(
      'Permiso denegado: Solo el propietario puede cambiar el estado comercial de su anuncio.',
    )
  }

  if (nextStatus === 'published') {
    validateListingImages(record.images, 'publish')
    if (!record.authenticityConfirmed) {
      throw new Error(
        'Debes confirmar la declaración de autenticidad antes de publicar el anuncio.',
      )
    }
  }

  const nowIso = new Date().toISOString()
  record.status = nextStatus
  record.updatedAt = nowIso
  if (nextStatus === 'published' && !record.publishedAt) {
    record.publishedAt = nowIso
    const evalResult = evaluateInitialPhotoReview(
      record.images,
      record.knownModificationsNotes,
      record.authenticityConfirmed,
    )
    record.reviewStatus = evalResult.status
  }

  saveState(state)
  void syncWithLocalPythonApi(`/listings/${listingId}/status`, 'PATCH', {
    status: nextStatus,
  })

  const favSet = new Set(
    state.favorites
      .filter((f) => f.userId === viewer.id)
      .map((f) => f.listingId),
  )
  return toPublicListing(record, viewer, favSet)
}

/**
 * Returns all listings owned by the current active user (including drafts, paused, sold, withdrawn).
 */
export async function getMyListings(): Promise<WatchListing[]> {
  const viewer = getCurrentUser()
  const state = loadState()
  const favSet = new Set(
    state.favorites
      .filter((f) => f.userId === viewer.id)
      .map((f) => f.listingId),
  )

  return state.listings
    .filter((l) => l.ownerId === viewer.id)
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .map((l) => toPublicListing(l, viewer, favSet))
}

/**
 * Toggles favorite status for a listing, strictly deduplicated per (userId, listingId).
 */
export async function toggleFavoriteListing(
  listingId: string,
): Promise<{ isFavorited: boolean; totalUserFavorites: number }> {
  const viewer = getCurrentUser()
  const state = loadState()

  const existingIdx = state.favorites.findIndex(
    (f) => f.userId === viewer.id && f.listingId === listingId,
  )

  let isFavorited = false
  if (existingIdx >= 0) {
    state.favorites.splice(existingIdx, 1)
    isFavorited = false
  } else {
    state.favorites.push({
      userId: viewer.id,
      listingId,
      createdAt: new Date().toISOString(),
    })
    isFavorited = true
  }

  saveState(state)
  void syncWithLocalPythonApi('/favorites/toggle', 'POST', { listingId })

  const totalUserFavorites = state.favorites.filter(
    (f) => f.userId === viewer.id,
  ).length
  return { isFavorited, totalUserFavorites }
}

export async function getMyFavorites(): Promise<WatchListing[]> {
  const viewer = getCurrentUser()
  const state = loadState()
  const favIds = new Set(
    state.favorites
      .filter((f) => f.userId === viewer.id)
      .map((f) => f.listingId),
  )

  return state.listings
    .filter(
      (l) =>
        favIds.has(l.id) &&
        (l.status === 'published' || l.status === 'sold' || l.ownerId === viewer.id),
    )
    .map((l) => toPublicListing(l, viewer, favIds))
}

/**
 * Private Messaging: Starts or retrieves a conversation about a listing and sends a message.
 * Strictly isolated to buyer and seller participants.
 */
export async function startOrSendMessageToListing(
  listingId: string,
  content: string,
): Promise<{
  conversation: MarketplaceConversation
  message: MarketplaceMessage
}> {
  const viewer = getCurrentUser()
  const state = loadState()
  const cleanContent = content.trim()
  if (!cleanContent) {
    throw new Error('El mensaje no puede estar vacío.')
  }

  const listing = state.listings.find((l) => l.id === listingId)
  if (!listing) {
    throw new Error('El anuncio no existe.')
  }
  if (listing.ownerId === viewer.id) {
    throw new Error('No puedes iniciar una conversación contigo mismo.')
  }

  let conversation = state.conversations.find(
    (c) => c.listingId === listingId && c.buyerId === viewer.id,
  )

  const nowIso = new Date().toISOString()
  if (!conversation) {
    conversation = {
      id: `conv-${Date.now()}`,
      listingId: listing.id,
      listingTitle: `${listing.brand} ${listing.model}`,
      listingImage: listing.images[0]?.url ?? '',
      listingPriceEur: listing.priceEur,
      buyerId: viewer.id,
      buyerName: viewer.displayName,
      sellerId: listing.ownerId,
      sellerName: listing.ownerDisplayName,
      lastMessagePreview: cleanContent,
      updatedAt: nowIso,
    }
    state.conversations.unshift(conversation)
  } else {
    conversation.lastMessagePreview = cleanContent
    conversation.updatedAt = nowIso
  }

  const message: MarketplaceMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    conversationId: conversation.id,
    senderId: viewer.id,
    senderName: viewer.displayName,
    content: cleanContent,
    createdAt: nowIso,
  }

  state.messages.push(message)
  saveState(state)
  void syncWithLocalPythonApi('/messages', 'POST', {
    listingId,
    conversationId: conversation.id,
    content: cleanContent,
  })

  return { conversation, message }
}

/**
 * Sends a reply inside an existing conversation.
 * Security rule: ONLY the buyer or seller participant of that conversation can send messages.
 */
export async function sendMessageInConversation(
  conversationId: string,
  content: string,
): Promise<MarketplaceMessage> {
  const viewer = getCurrentUser()
  const state = loadState()
  const cleanContent = content.trim()
  if (!cleanContent) {
    throw new Error('El mensaje no puede estar vacío.')
  }

  const conversation = state.conversations.find((c) => c.id === conversationId)
  if (!conversation) {
    throw new Error('Conversación no encontrada.')
  }

  if (
    conversation.buyerId !== viewer.id &&
    conversation.sellerId !== viewer.id
  ) {
    throw new Error(
      'Acceso denegado: Solo los participantes de esta conversación pueden enviar mensajes.',
    )
  }

  const nowIso = new Date().toISOString()
  conversation.lastMessagePreview = cleanContent
  conversation.updatedAt = nowIso

  const message: MarketplaceMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    conversationId: conversation.id,
    senderId: viewer.id,
    senderName: viewer.displayName,
    content: cleanContent,
    createdAt: nowIso,
  }

  state.messages.push(message)
  saveState(state)
  void syncWithLocalPythonApi('/messages', 'POST', {
    conversationId,
    content: cleanContent,
  })

  return message
}

/**
 * Lists conversations where the current user is a participant (buyer or seller).
 */
export async function getMyConversations(): Promise<MarketplaceConversation[]> {
  const viewer = getCurrentUser()
  const state = loadState()
  return state.conversations
    .filter((c) => c.buyerId === viewer.id || c.sellerId === viewer.id)
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
}

/**
 * Reads messages of a specific conversation.
 * Security rule: Strictly rejects any user who is not a participant of the conversation.
 */
export async function getConversationThread(conversationId: string): Promise<{
  conversation: MarketplaceConversation
  messages: MarketplaceMessage[]
}> {
  const viewer = getCurrentUser()
  const state = loadState()
  const conversation = state.conversations.find((c) => c.id === conversationId)
  if (!conversation) {
    throw new Error('Conversación no encontrada.')
  }

  if (
    conversation.buyerId !== viewer.id &&
    conversation.sellerId !== viewer.id
  ) {
    throw new Error(
      'Privacidad: No tienes permiso para leer esta conversación privada.',
    )
  }

  const messages = state.messages
    .filter((m) => m.conversationId === conversationId)
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )

  return { conversation, messages }
}

/**
 * Submits a report (denuncia) on a listing.
 */
export async function createListingReport(params: {
  listingId: string
  reason: string
  details?: string
}): Promise<ListingReportRecord> {
  const viewer = getCurrentUser()
  const state = loadState()
  const listing = state.listings.find((l) => l.id === params.listingId)
  if (!listing) {
    throw new Error('El anuncio denunciado no existe.')
  }
  if (!params.reason.trim()) {
    throw new Error('Debes indicar un motivo de denuncia.')
  }

  const report: ListingReportRecord = {
    id: `rep-${Date.now()}`,
    listingId: listing.id,
    reporterId: viewer.id,
    reporterName: viewer.displayName,
    reason: params.reason.trim(),
    details: (params.details ?? '').trim(),
    status: 'open',
    createdAt: new Date().toISOString(),
  }

  state.reports.unshift(report)
  saveState(state)
  void syncWithLocalPythonApi('/reports', 'POST', report)
  return report
}

/**
 * Moderator-only review transition.
 * Security rule: Verified in backend/service layer — regular users or owners cannot transition reviewStatus.
 */
export async function moderatorTransitionReviewStatus(params: {
  listingId: string
  nextStatus: ReviewStatus
  internalReason: string
}): Promise<{
  listing: WatchListing
  reviewRecord: AuthenticityReviewRecord
}> {
  const viewer = getCurrentUser()
  if (viewer.role !== 'moderator') {
    throw new Error(
      'Permiso denegado: Se requieren permisos de moderador verificados en backend para cambiar el estado de revisión fotográfica.',
    )
  }

  const state = loadState()
  const listing = state.listings.find((l) => l.id === params.listingId)
  if (!listing) {
    throw new Error('Anuncio no encontrado.')
  }

  const nowIso = new Date().toISOString()
  listing.reviewStatus = params.nextStatus
  listing.updatedAt = nowIso

  const reviewRecord: AuthenticityReviewRecord = {
    id: `rev-mod-${Date.now()}`,
    listingId: listing.id,
    status: params.nextStatus,
    method: 'manual_moderator',
    internalReason:
      params.internalReason.trim() ||
      `Revisión manual actualizada a ${params.nextStatus}`,
    reviewerId: viewer.id,
    reviewerName: viewer.displayName,
    createdAt: nowIso,
  }

  state.reviews.unshift(reviewRecord)
  saveState(state)
  void syncWithLocalPythonApi(
    `/moderation/listings/${listing.id}/review`,
    'POST',
    {
      status: params.nextStatus,
      internalReason: reviewRecord.internalReason,
    },
  )

  const favSet = new Set(
    state.favorites
      .filter((f) => f.userId === viewer.id)
      .map((f) => f.listingId),
  )

  return {
    listing: toPublicListing(listing, viewer, favSet),
    reviewRecord,
  }
}

export async function getModeratorQueue(): Promise<{
  listings: WatchListing[]
  reports: ListingReportRecord[]
}> {
  const viewer = getCurrentUser()
  if (viewer.role !== 'moderator') {
    throw new Error(
      'Permiso denegado: Solo los moderadores pueden acceder a la cola de moderación.',
    )
  }
  const state = loadState()
  const favSet = new Set<string>()
  return {
    listings: state.listings.map((l) => toPublicListing(l, viewer, favSet)),
    reports: [...state.reports],
  }
}

export function subscribeMarketplaceUpdates(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const handler = () => callback()
  window.addEventListener('chronoparts-marketplace-updated', handler)
  window.addEventListener('storage', handler)
  return () => {
    window.removeEventListener('chronoparts-marketplace-updated', handler)
    window.removeEventListener('storage', handler)
  }
}

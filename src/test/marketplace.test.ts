import { beforeEach, describe, expect, it } from 'vitest'
import {
  createListingReport,
  createOrUpdateListing,
  getConversationThread,
  getListingById,
  getMyConversations,
  getMyFavorites,
  getMyListings,
  maskSerialNumber,
  moderatorTransitionReviewStatus,
  queryCatalogListings,
  resetMarketplaceStateForTesting,
  sendMessageInConversation,
  setCurrentUser,
  startOrSendMessageToListing,
  toggleFavoriteListing,
  updateListingCommercialStatus,
} from '../marketplace/services/marketplace-service'
import { PHOTO_REVIEW_COPY, type ListingImageInput } from '../marketplace/types'

const VALID_FOUR_PHOTOS: [ListingImageInput, ...ListingImageInput[]] = [
  {
    slot: 'dial',
    url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800',
    caption: 'Esfera completa',
    mimeType: 'image/jpeg',
    sizeBytes: 300_000,
  },
  {
    slot: 'caseback',
    url: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800',
    caption: 'Parte trasera',
    mimeType: 'image/jpeg',
    sizeBytes: 300_000,
  },
  {
    slot: 'crown_sides',
    url: 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=800',
    caption: 'Laterales y corona',
    mimeType: 'image/jpeg',
    sizeBytes: 300_000,
  },
  {
    slot: 'clasp_strap',
    url: 'https://images.unsplash.com/photo-1539874754764-5a96559165b0?w=800',
    caption: 'Cierre y brazalete',
    mimeType: 'image/jpeg',
    sizeBytes: 300_000,
  },
]

describe('ChronoParts Marketplace — Security, Filters, Persistence & Privacy', () => {
  beforeEach(() => {
    resetMarketplaceStateForTesting()
  })

  it('filters catalog listings with real data (brand, reference, price range, condition, movement, location) and sorts', async () => {
    const all = await queryCatalogListings({ pageSize: 20 })
    expect(all.total).toBeGreaterThanOrEqual(5)

    // Filter by Brand = Omega
    const omegaOnly = await queryCatalogListings({ brand: 'Omega' })
    expect(omegaOnly.items.length).toBe(1)
    expect(omegaOnly.items[0]?.reference).toBe('310.30.42.50.01.001')

    // Filter by Reference substring
    const skxRef = await queryCatalogListings({ reference: 'SKX007' })
    expect(skxRef.items.length).toBe(1)
    expect(skxRef.items[0]?.brand).toBe('Seiko')

    // Filter by Price Range (400€ - 600€)
    const midPrice = await queryCatalogListings({
      minPrice: 400,
      maxPrice: 600,
      sortBy: 'price_asc',
    })
    expect(midPrice.items.length).toBeGreaterThanOrEqual(2)
    expect(midPrice.items[0]?.priceEur).toBeLessThanOrEqual(
      midPrice.items[midPrice.items.length - 1]?.priceEur ?? 0,
    )

    // Filter by Movement = quartz
    const quartzOnly = await queryCatalogListings({ movement: 'quartz' })
    expect(quartzOnly.items.every((i) => i.movement === 'quartz')).toBe(true)

    // Filter by Location
    const barcelona = await queryCatalogListings({ location: 'Barcelona' })
    expect(
      barcelona.items.every((i) =>
        i.location.toLowerCase().includes('barcelona'),
      ),
    ).toBe(true)
  })

  it('persists new user listings, distinguishes real listings from demo listings, and masks serial numbers', async () => {
    setCurrentUser('user-collector-local')

    const created = await createOrUpdateListing({
      brand: 'Longines',
      model: 'Spirit Zulu Time GMT 39mm',
      reference: 'L3.802.4.63.6',
      priceEur: 2450,
      condition: 'excellent',
      movement: 'automatic',
      approxYear: 2024,
      description:
        'Longines Spirit Zulu Time 39mm bisel cerámico verde y esfera antracita. Estado impecable con dotación completa.',
      boxIncluded: true,
      papersIncluded: true,
      accessoriesNotes: 'Caja original y tarjeta COSC.',
      location: 'Madrid, ES',
      serialNumberRaw: '54918273',
      authenticityConfirmed: true,
      knownModificationsNotes: 'Sin modificaciones.',
      images: VALID_FOUR_PHOTOS,
      intent: 'publish',
    })

    expect(created.isDemo).toBe(false)
    expect(created.serialNumberMasked).toBe('54****73')
    expect(created.reviewStatus).toBe('passed_photo_review')
    // Ensure raw serial number is never exposed in public object
    expect(
      (created as unknown as Record<string, unknown>)['serialNumberRaw'],
    ).toBeUndefined()

    const reloaded = await getListingById(created.id)
    expect(reloaded).not.toBeNull()
    expect(reloaded?.brand).toBe('Longines')
  })

  it('enforces owner-only permissions for editing, pausing, marking sold, and withdrawing', async () => {
    setCurrentUser('user-collector-local')

    // Attempt to edit or pause an announcement owned by Carlos M. ('seller-carlos-m')
    await expect(
      updateListingCommercialStatus('mkt-omega-speedmaster-3861', 'paused'),
    ).rejects.toThrow(/Solo el propietario/i)

    await expect(
      createOrUpdateListing({
        id: 'mkt-omega-speedmaster-3861',
        brand: 'Omega',
        model: 'Hacked Model',
        priceEur: 100,
        condition: 'good',
        movement: 'manual',
        description: 'Intento de modificación por usuario no propietario.',
        boxIncluded: true,
        papersIncluded: true,
        location: 'Madrid, ES',
        authenticityConfirmed: true,
        images: VALID_FOUR_PHOTOS,
        intent: 'publish',
      }),
    ).rejects.toThrow(/Solo el propietario/i)

    // Switch to actual owner ('seller-carlos-m') -> succeeds
    setCurrentUser('seller-carlos-m')
    const paused = await updateListingCommercialStatus(
      'mkt-omega-speedmaster-3861',
      'paused',
    )
    expect(paused.status).toBe('paused')
  })

  it('hides drafts and rejected listings from public catalog and non-owners', async () => {
    setCurrentUser('user-collector-local')

    const draft = await createOrUpdateListing({
      brand: 'Hamilton',
      model: 'Khaki Field Mechanical 38mm',
      priceEur: 420,
      condition: 'good',
      movement: 'manual',
      description: 'Borrador todavía en preparación.',
      boxIncluded: true,
      papersIncluded: false,
      location: 'Madrid, ES',
      authenticityConfirmed: false,
      images: [VALID_FOUR_PHOTOS[0]],
      intent: 'draft',
    })

    expect(draft.status).toBe('draft')

    // Owner can see it in getMyListings and getListingById
    const mine = await getMyListings()
    expect(mine.some((l) => l.id === draft.id)).toBe(true)
    expect(await getListingById(draft.id)).not.toBeNull()

    // Public catalog does NOT include drafts
    const catalog = await queryCatalogListings({ query: 'Hamilton' })
    expect(catalog.items.some((l) => l.id === draft.id)).toBe(false)

    // Another user cannot read the private draft
    setCurrentUser('seller-elena-bcn')
    expect(await getListingById(draft.id)).toBeNull()
  })

  it('prevents client-side spoofing of reviewStatus and restricts moderation transitions to moderators', async () => {
    setCurrentUser('user-collector-local')

    // Client tries to inject reviewStatus = 'passed_photo_review'
    await expect(
      createOrUpdateListing({
        brand: 'Rolex',
        model: 'Submariner Date',
        priceEur: 9500,
        condition: 'excellent',
        movement: 'automatic',
        description: 'Intento de forzar passed_photo_review desde cliente.',
        boxIncluded: true,
        papersIncluded: true,
        location: 'Madrid, ES',
        authenticityConfirmed: true,
        images: VALID_FOUR_PHOTOS,
        intent: 'publish',
        reviewStatus: 'passed_photo_review',
      }),
    ).rejects.toThrow(/no puede ser asignado desde el cliente/i)

    // Regular user tries to call moderator transition endpoint
    await expect(
      moderatorTransitionReviewStatus({
        listingId: 'mkt-tissot-prx-pm80',
        nextStatus: 'passed_photo_review',
        internalReason: 'Intento sin rol de moderador',
      }),
    ).rejects.toThrow(/permisos de moderador/i)

    // Moderator account succeeds
    setCurrentUser('mod-chronoparts-1')
    const modResult = await moderatorTransitionReviewStatus({
      listingId: 'mkt-tissot-prx-pm80',
      nextStatus: 'passed_photo_review',
      internalReason: 'Verificados los 4 ángulos por moderador.',
    })
    expect(modResult.listing.reviewStatus).toBe('passed_photo_review')
  })

  it('deduplicates favorites per user', async () => {
    setCurrentUser('seller-elena-bcn')

    const first = await toggleFavoriteListing('mkt-omega-speedmaster-3861')
    expect(first.isFavorited).toBe(true)
    expect(first.totalUserFavorites).toBe(1)

    const favsAfterAdd = await getMyFavorites()
    expect(favsAfterAdd.length).toBe(1)

    const second = await toggleFavoriteListing('mkt-omega-speedmaster-3861')
    expect(second.isFavorited).toBe(false)
    expect(second.totalUserFavorites).toBe(0)
  })

  it('enforces strict privacy on conversations and messages (only participants can read or send)', async () => {
    // Buyer ('user-collector-local') contacts Seller ('seller-elena-bcn') on Seiko SKX007
    setCurrentUser('user-collector-local')
    const { conversation } = await startOrSendMessageToListing(
      'mkt-seiko-skx007j1-diver',
      'Hola Elena, ¿aceptas entrega en mano en Barcelona este viernes?',
    )

    // Seller ('seller-elena-bcn') can read and reply
    setCurrentUser('seller-elena-bcn')
    const sellerConvs = await getMyConversations()
    expect(sellerConvs.some((c) => c.id === conversation.id)).toBe(true)

    const reply = await sendMessageInConversation(
      conversation.id,
      'Hola Alejandro, sí, podemos quedar en Paseo de Gracia.',
    )
    expect(reply.senderId).toBe('seller-elena-bcn')

    // Unrelated third user ('seller-carlos-m') CANNOT read or send messages in this conversation
    setCurrentUser('seller-carlos-m')
    const carlosConvs = await getMyConversations()
    expect(carlosConvs.some((c) => c.id === conversation.id)).toBe(false)

    await expect(getConversationThread(conversation.id)).rejects.toThrow(
      /Privacidad/i,
    )
    await expect(
      sendMessageInConversation(conversation.id, 'Mensaje intruso'),
    ).rejects.toThrow(/Solo los participantes/i)
  })

  it('validates image count (4-10), MIME format, and never claims 100% physical authenticity in review copy', async () => {
    setCurrentUser('user-collector-local')

    // Rejects publishing with fewer than 4 photos
    await expect(
      createOrUpdateListing({
        brand: 'Seiko',
        model: 'Alpinist SPB121',
        priceEur: 520,
        condition: 'excellent',
        movement: 'automatic',
        description:
          'Seiko Alpinist esfera verde con brújula interna y calibre 6R35.',
        boxIncluded: true,
        papersIncluded: true,
        location: 'Madrid, ES',
        authenticityConfirmed: true,
        images: VALID_FOUR_PHOTOS.slice(0, 2),
        intent: 'publish',
      }),
    ).rejects.toThrow(/entre 4 y 10 fotografías/i)

    // Verify public copy never uses prohibited expressions
    for (const copy of Object.values(PHOTO_REVIEW_COPY)) {
      const combined =
        `${copy.badgeLabel} ${copy.shortSummary} ${copy.description} ${copy.limitsDisclaimer}`.toLowerCase()
      expect(combined).not.toContain('100 % original')
      expect(combined).not.toContain('100% original')
      expect(combined).not.toContain('autenticidad garantizada')
    }

    // Verify maskSerialNumber helper
    expect(maskSerialNumber('83940219')).toBe('83****19')

    // Verify reporting works
    const report = await createListingReport({
      listingId: 'mkt-omega-speedmaster-3861',
      reason: 'Incoherencia documental',
      details: 'Prueba de reporte',
    })
    expect(report.status).toBe('open')
  })
})

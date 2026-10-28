import { useEffect, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  FileText,
  ImagePlus,
  Lock,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react'
import { MarketplaceShell } from '../marketplace/components/MarketplaceShell'
import {
  createOrUpdateListing,
  getCurrentUser,
  getListingById,
} from '../marketplace/services/marketplace-service'
import {
  ALLOWED_IMAGE_MIMES,
  CONDITION_LABELS,
  MAX_IMAGE_SIZE_BYTES,
  MAX_LISTING_IMAGES,
  MIN_LISTING_IMAGES,
  MOVEMENT_LABELS,
  PHOTO_SLOT_SPECS,
  type ListingImageInput,
  type MovementType,
  type PhotoSlotType,
  type WatchCondition,
} from '../marketplace/types'

interface VenderSearch {
  edit?: string | undefined
}

export const Route = createFileRoute('/vender')({
  validateSearch: (search: Record<string, unknown>): VenderSearch => ({
    edit: typeof search['edit'] === 'string' ? search['edit'] : undefined,
  }),
  head: () => ({
    meta: [
      { property: 'og:title', content: 'Publicar reloj — ChronoParts Marketplace' },
      { property: 'og:description', content: 'Prepara tu anuncio con fotografías y detalles del reloj.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'description', content: 'Prepara tu anuncio con fotografías y detalles del reloj.' },
      {
        title:
          'Publicar o Editar Reloj | ChronoParts Marketplace — Revisión Fotográfica',
      },
    ],
  }),
  component: PublishListingPage,
})

const QUICK_SAMPLE_PHOTOS: Array<{
  slot: PhotoSlotType
  url: string
  caption: string
}> = [
  {
    slot: 'dial',
    url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1000&q=80',
    caption: 'Esfera frontal completa y agujas sin retoques',
  },
  {
    slot: 'caseback',
    url: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=1000&q=80',
    caption: 'Tapa trasera e inscripciones de caja',
  },
  {
    slot: 'crown_sides',
    url: 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&w=1000&q=80',
    caption: 'Perfil lateral de carrura y corona firmada',
  },
  {
    slot: 'clasp_strap',
    url: 'https://images.unsplash.com/photo-1539874754764-5a96559165b0?auto=format&fit=crop&w=1000&q=80',
    caption: 'Cierre desplegable y eslabones del brazalete',
  },
]

export function PublishListingPage() {
  const { edit: editId } = Route.useSearch()
  const navigate = useNavigate()
  const currentUser = getCurrentUser()

  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [reference, setReference] = useState('')
  const [priceEur, setPriceEur] = useState<string>('')
  const [condition, setCondition] = useState<WatchCondition>('excellent')
  const [movement, setMovement] = useState<MovementType>('automatic')
  const [approxYear, setApproxYear] = useState<string>('')
  const [description, setDescription] = useState('')
  const [boxIncluded, setBoxIncluded] = useState(true)
  const [papersIncluded, setPapersIncluded] = useState(true)
  const [accessoriesNotes, setAccessoriesNotes] = useState('')
  const [location, setLocation] = useState(currentUser.location || 'Madrid, ES')
  const [serialNumberRaw, setSerialNumberRaw] = useState('')
  const [authenticityConfirmed, setAuthenticityConfirmed] = useState(false)
  const [knownModificationsNotes, setKnownModificationsNotes] = useState('')

  const [images, setImages] = useState<ListingImageInput[]>([
    {
      slot: 'dial',
      url: '',
      caption: 'Esfera completa',
      mimeType: 'image/jpeg',
      sizeBytes: 320_000,
    },
    {
      slot: 'caseback',
      url: '',
      caption: 'Parte trasera',
      mimeType: 'image/jpeg',
      sizeBytes: 320_000,
    },
    {
      slot: 'crown_sides',
      url: '',
      caption: 'Laterales y corona',
      mimeType: 'image/jpeg',
      sizeBytes: 320_000,
    },
    {
      slot: 'clasp_strap',
      url: '',
      caption: 'Cierre y brazalete o correa',
      mimeType: 'image/jpeg',
      sizeBytes: 320_000,
    },
  ])

  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!editId) return
    void (async () => {
      try {
        const existing = await getListingById(editId)
        if (!existing) {
          setErrorMessage('No se encontró el anuncio a editar.')
          return
        }
        if (existing.ownerId !== getCurrentUser().id) {
          setErrorMessage(
            'Acceso denegado: solo el propietario puede editar su anuncio.',
          )
          return
        }
        setBrand(existing.brand)
        setModel(existing.model)
        setReference(existing.reference || '')
        setPriceEur(String(existing.priceEur))
        setCondition(existing.condition)
        setMovement(existing.movement)
        setApproxYear(existing.approxYear ? String(existing.approxYear) : '')
        setDescription(existing.description)
        setBoxIncluded(existing.boxIncluded)
        setPapersIncluded(existing.papersIncluded)
        setAccessoriesNotes(existing.accessoriesNotes)
        setLocation(existing.location)
        setAuthenticityConfirmed(existing.authenticityConfirmed)
        setKnownModificationsNotes(existing.knownModificationsNotes)
        if (existing.images.length > 0) {
          setImages(
            existing.images.map((img) => ({
              id: img.id,
              slot: img.slot,
              url: img.url,
              caption: img.caption,
              mimeType: img.mimeType,
              sizeBytes: img.sizeBytes,
              isSensitiveSerial: img.isSensitiveSerial,
            })),
          )
        }
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : 'Error al cargar el anuncio.',
        )
      }
    })()
  }, [editId])

  const handleImageFieldChange = (
    index: number,
    patch: Partial<ListingImageInput>,
  ) => {
    setImages((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, ...patch } : item)),
    )
  }

  const handleFileUpload = (index: number, file: File | undefined) => {
    if (!file) return
    if (
      !ALLOWED_IMAGE_MIMES.includes(
        file.type as (typeof ALLOWED_IMAGE_MIMES)[number],
      )
    ) {
      setErrorMessage(
        `Formato no soportado (${file.type}). Usa JPEG, PNG o WEBP.`,
      )
      return
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setErrorMessage(
        'La imagen supera el límite máximo permitido de 5 MB por archivo.',
      )
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : ''
      handleImageFieldChange(index, {
        url: dataUrl,
        mimeType: file.type,
        sizeBytes: file.size,
      })
      setErrorMessage(null)
    }
    reader.readAsDataURL(file)
  }

  const handleAddImageSlot = () => {
    if (images.length >= MAX_LISTING_IMAGES) {
      setErrorMessage(
        `Máximo ${MAX_LISTING_IMAGES} fotografías permitidas por anuncio.`,
      )
      return
    }
    setImages((prev) => [
      ...prev,
      {
        slot: 'extra',
        url: '',
        caption: `Fotografía adicional #${prev.length + 1}`,
        mimeType: 'image/jpeg',
        sizeBytes: 300_000,
      },
    ])
  }

  const handleRemoveImageSlot = (index: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== index))
  }

  const handleFillSamplePhotos = () => {
    setImages(
      QUICK_SAMPLE_PHOTOS.map((sample) => ({
        slot: sample.slot,
        url: sample.url,
        caption: sample.caption,
        mimeType: 'image/jpeg',
        sizeBytes: 420_000,
      })),
    )
    setErrorMessage(null)
  }

  const submitListing = async (intent: 'draft' | 'publish') => {
    setErrorMessage(null)
    setSuccessMessage(null)
    setIsSubmitting(true)

    try {
      const filledImages = images.filter((img) => img.url.trim().length > 0)
      const saved = await createOrUpdateListing({
        id: editId,
        brand,
        model,
        reference,
        priceEur: Number(priceEur),
        condition,
        movement,
        approxYear: approxYear.trim() ? Number(approxYear) : undefined,
        description,
        boxIncluded,
        papersIncluded,
        accessoriesNotes,
        location,
        serialNumberRaw: serialNumberRaw.trim() || undefined,
        authenticityConfirmed,
        knownModificationsNotes,
        images: filledImages,
        intent,
      })

      setSuccessMessage(
        intent === 'draft'
          ? 'Borrador guardado de forma privada. Puedes continuar editándolo cuando quieras en Mis Anuncios.'
          : 'Anuncio publicado y sometido a los controles de revisión fotográfica.',
      )

      setTimeout(() => {
        if (intent === 'draft') {
          void navigate({ to: '/mis-anuncios' })
        } else {
          void navigate({
            to: '/marketplace/$id',
            params: { id: saved.id },
          })
        }
      }, 900)
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Error al guardar el anuncio. Verifica los campos.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <MarketplaceShell
      title={editId ? 'Editar Anuncio de Reloj' : 'Publicar un Reloj Completo'}
      subtitle="Completa los datos técnicos, adjunta entre 4 y 10 fotografías claras de los ángulos clave y firma la declaración de autenticidad y modificaciones conocidas."
    >
      <div className="max-w-4xl mx-auto space-y-8">
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-700 text-xs sm:text-sm font-medium flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-4 rounded-2xl bg-emerald-500/12 border border-emerald-500/30 text-emerald-800 text-xs sm:text-sm font-medium flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Section 1: Watch Identity & Specs */}
        <section className="bg-card rounded-2xl border border-border p-6 shadow-soft space-y-5">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="font-serif text-2xl text-foreground">
                1. Identificación y Especificaciones del Reloj
              </h2>
              <p className="text-xs text-muted-foreground">
                Proporciona datos reales. Si desconoces la referencia exacta o el
                año, déjalos en blanco.
              </p>
            </div>
            <span className="text-xs text-muted-foreground">
              Propietario: <strong className="text-foreground">{currentUser.displayName}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="vender-brand"
                className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5"
              >
                Marca *
              </label>
              <input
                id="vender-brand"
                type="text"
                required
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Ej. Omega, Seiko, Tudor, Tissot..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label
                htmlFor="vender-model"
                className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5"
              >
                Modelo *
              </label>
              <input
                id="vender-model"
                type="text"
                required
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Ej. Speedmaster Professional, Prospex..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label
                htmlFor="vender-reference"
                className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5"
              >
                Referencia (Opcional)
              </label>
              <input
                id="vender-reference"
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Ej. 310.30.42.50.01.001"
                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground font-mono focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label
                htmlFor="vender-price"
                className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5"
              >
                Precio en EUR (€) *
              </label>
              <input
                id="vender-price"
                type="number"
                min={1}
                step="1"
                required
                value={priceEur}
                onChange={(e) => setPriceEur(e.target.value)}
                placeholder="Ej. 1850"
                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label
                htmlFor="vender-condition"
                className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5"
              >
                Estado del reloj *
              </label>
              <select
                id="vender-condition"
                value={condition}
                onChange={(e) => setCondition(e.target.value as WatchCondition)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:border-accent"
              >
                {(Object.keys(CONDITION_LABELS) as WatchCondition[]).map(
                  (c) => (
                    <option key={c} value={c}>
                      {CONDITION_LABELS[c]}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div>
              <label
                htmlFor="vender-movement"
                className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5"
              >
                Tipo de movimiento *
              </label>
              <select
                id="vender-movement"
                value={movement}
                onChange={(e) => setMovement(e.target.value as MovementType)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:border-accent"
              >
                {(Object.keys(MOVEMENT_LABELS) as MovementType[]).map((m) => (
                  <option key={m} value={m}>
                    {MOVEMENT_LABELS[m]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="vender-year"
                className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5"
              >
                Año aprox. (Opcional)
              </label>
              <input
                id="vender-year"
                type="number"
                min={1850}
                max={new Date().getFullYear() + 1}
                value={approxYear}
                onChange={(e) => setApproxYear(e.target.value)}
                placeholder="Ej. 2021"
                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="vender-location"
                className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5"
              >
                Ubicación aproximada *
              </label>
              <input
                id="vender-location"
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ej. Madrid, ES / Barcelona, ES"
                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label
                htmlFor="vender-serial"
                className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5"
              >
                Nº de serie (Protegido, nunca público al completo)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-accent absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="vender-serial"
                  type="text"
                  value={serialNumberRaw}
                  onChange={(e) => setSerialNumberRaw(e.target.value)}
                  placeholder="Opcional: se enmascara públicamente (ej. 84****92)"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground font-mono focus:outline-none focus:border-accent"
                />
              </div>
            </div>
          </div>

          <div>
            <label
              htmlFor="vender-description"
              className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5"
            >
              Descripción detallada del estado, marcha y procedencia *
            </label>
            <textarea
              id="vender-description"
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe el estado del cristal, bisel, marcha del calibre, historial de mantenimiento y cualquier marca de uso..."
              className="w-full p-3.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:border-accent"
            />
          </div>

          {/* Box, Papers & Accessories */}
          <div className="pt-3 border-t border-border grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-secondary/50 border border-border cursor-pointer">
              <input
                type="checkbox"
                checked={boxIncluded}
                onChange={(e) => setBoxIncluded(e.target.checked)}
                className="w-4 h-4 accent-accent"
              />
              <span className="text-xs font-semibold text-foreground">
                Incluye caja / estuche original
              </span>
            </label>

            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-secondary/50 border border-border cursor-pointer">
              <input
                type="checkbox"
                checked={papersIncluded}
                onChange={(e) => setPapersIncluded(e.target.checked)}
                className="w-4 h-4 accent-accent"
              />
              <span className="text-xs font-semibold text-foreground">
                Incluye documentación / tarjeta de garantía
              </span>
            </label>

            <div>
              <input
                type="text"
                value={accessoriesNotes}
                onChange={(e) => setAccessoriesNotes(e.target.value)}
                placeholder="Accesorios extra (eslabones sobrantes, correa NATO...)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-xs text-foreground focus:outline-none focus:border-accent"
              />
            </div>
          </div>
        </section>

        {/* Section 2: Guided Photographic Review (4 to 10 images) */}
        <section className="bg-card rounded-2xl border border-border p-6 shadow-soft space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
            <div>
              <h2 className="font-serif text-2xl text-foreground flex items-center gap-2">
                <Camera className="w-5 h-5 text-accent" />
                2. Fotografías para Revisión ({images.length}/
                {MAX_LISTING_IMAGES})
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Para publicar se requieren entre{' '}
                <strong>{MIN_LISTING_IMAGES}</strong> y{' '}
                <strong>{MAX_LISTING_IMAGES}</strong> fotografías claras
                (Esfera, Parte trasera, Laterales/Corona y Cierre/Correa).
                Formatos: JPEG, PNG, WEBP (máx. 5 MB).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleFillSamplePhotos}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary text-foreground border border-border text-xs font-semibold hover:bg-secondary/80 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-accent" />
                Cargar 4 fotos de prueba
              </button>

              {images.length < MAX_LISTING_IMAGES && (
                <button
                  type="button"
                  onClick={handleAddImageSlot}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold cursor-pointer"
                >
                  <ImagePlus className="w-3.5 h-3.5" />
                  Añadir ángulo
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {images.map((img, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-secondary/40 border border-border space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-accent">
                    Fotografía #{idx + 1}
                  </span>
                  {images.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveImageSlot(idx)}
                      className="text-xs text-red-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Quitar
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">
                      Ángulo requerido
                    </label>
                    <select
                      value={img.slot}
                      onChange={(e) =>
                        handleImageFieldChange(idx, {
                          slot: e.target.value as PhotoSlotType,
                        })
                      }
                      className="w-full px-2.5 py-2 rounded-lg bg-background border border-border text-xs text-foreground"
                    >
                      {PHOTO_SLOT_SPECS.map((spec) => (
                        <option key={spec.slot} value={spec.slot}>
                          {spec.label} {spec.requiredForReview ? '(Clave)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">
                      Subir archivo (JPEG/PNG/WEBP)
                    </label>
                    <label className="w-full px-2.5 py-2 rounded-lg bg-background border border-border text-xs text-foreground flex items-center justify-center gap-1.5 cursor-pointer hover:border-accent">
                      <Upload className="w-3.5 h-3.5 text-accent" />
                      <span className="truncate">Seleccionar archivo</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) =>
                          handleFileUpload(idx, e.target.files?.[0])
                        }
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">
                    O pegar URL de imagen
                  </label>
                  <input
                    type="text"
                    value={img.url}
                    onChange={(e) =>
                      handleImageFieldChange(idx, { url: e.target.value })
                    }
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-2.5 py-1.5 rounded-lg bg-background border border-border text-xs text-foreground"
                  />
                </div>

                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={img.caption || ''}
                    onChange={(e) =>
                      handleImageFieldChange(idx, { caption: e.target.value })
                    }
                    placeholder="Nota sobre esta foto (ej. detalle de cierre)"
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-background border border-border text-xs text-foreground"
                  />

                  <label
                    className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer shrink-0"
                    title="Si la foto muestra el número de serie completo, márcala para que solo moderación pueda verla."
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(img.isSensitiveSerial)}
                      onChange={(e) =>
                        handleImageFieldChange(idx, {
                          isSensitiveSerial: e.target.checked,
                        })
                      }
                      className="accent-accent"
                    />
                    <span>Ocultar serie al público</span>
                  </label>
                </div>

                {img.url && (
                  <div className="h-28 rounded-lg overflow-hidden bg-background border border-border">
                    <img
                      src={img.url}
                      alt={img.caption || `Foto ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Section 3: Seller Authenticity & Modifications Declaration */}
        <section className="bg-card rounded-2xl border border-border p-6 shadow-soft space-y-4">
          <h2 className="font-serif text-2xl text-foreground flex items-center gap-2">
            <FileText className="w-5 h-5 text-accent" />
            3. Declaración de Autenticidad y Modificaciones Conocidas
          </h2>

          <div>
            <label
              htmlFor="vender-mods"
              className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5"
            >
              Modificaciones conocidas, piezas aftermarket o sustituciones
            </label>
            <input
              id="vender-mods"
              type="text"
              value={knownModificationsNotes}
              onChange={(e) => setKnownModificationsNotes(e.target.value)}
              placeholder="Indica si tiene cristal sustituido, correa genérica, pulido previo o escribe '100% piezas de origen conocidas'"
              className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:border-accent"
            />
          </div>

          <label className="flex items-start gap-3 p-4 rounded-xl bg-secondary/50 border border-border cursor-pointer">
            <input
              type="checkbox"
              checked={authenticityConfirmed}
              onChange={(e) => setAuthenticityConfirmed(e.target.checked)}
              className="w-4 h-4 mt-0.5 accent-accent shrink-0"
            />
            <span className="text-xs text-foreground leading-relaxed">
              <strong>Declaración responsable del vendedor:</strong> Declaro que
              el reloj fotografiado está en mi posesión, que no se trata de una
              réplica ni falsificación, y que cualquier pieza sustituida o
              modificación conocida ha sido descrita con transparencia. Comprendo
              que el estado de revisión fotográfica lo asigna el backend de
              moderación y que no equivale a una certificación física.
            </span>
          </label>
        </section>

        {/* Submit Actions: Save Draft vs Publish */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="w-4 h-4 text-accent shrink-0" />
            <span>
              Puedes guardar borradores privados con menos fotos o publicar
              directamente al completar los requisitos.
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => void submitListing('draft')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-secondary text-foreground border border-border text-xs font-bold uppercase tracking-wider hover:bg-secondary/80 transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Guardar Borrador
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => void submitListing('publish')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              {editId ? 'Guardar y Publicar' : 'Publicar Reloj'}
            </button>
          </div>
        </div>
      </div>
    </MarketplaceShell>
  )
}

import { useState } from "react";
import { Bell, Check, ChevronDown, Heart, Link2, MessageCircle, Scale } from "lucide-react";
import {
  getStoreSearchUrl,
  resolveCategoryImage,
  type Part,
} from "@/lib/parts";

export function fmtPrice(eur: number, c: "EUR" | "USD" = "EUR") {
  const v = c === "EUR" ? eur : eur * 1.08;
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: c,
    maximumFractionDigits: v < 100 ? 2 : 0,
  }).format(v);
}

export function AurikPartCard({
  part,
  p,
  currency = "EUR",
  isSaved = false,
  isSelectedForCompare,
  oemCounterpartEur,
  onToggleSave,
  onCompare,
  onCreateAlert,
}: {
  part?: Part | undefined;
  p?: Part | undefined;
  currency?: "EUR" | "USD";
  isSaved?: boolean;
  isSelectedForCompare?: boolean | undefined;
  oemCounterpartEur?: number | undefined;
  onToggleSave?: ((id: string) => void) | undefined;
  onCompare?: (() => void) | undefined;
  onCreateAlert?: (() => void) | undefined;
}) {
  const [showTechDetails, setShowTechDetails] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const item = part ?? p;
  if (!item) return null;

  const refOemPrice = item.equivalentOemPriceEur ?? oemCounterpartEur;
  const savingsEur =
    item.origin === "generic" && refOemPrice && refOemPrice > item.priceEur
      ? refOemPrice - item.priceEur
      : null;
  const savingsPct =
    savingsEur && refOemPrice
      ? Math.round((savingsEur / refOemPrice) * 100)
      : null;

  const storeUrl =
    item.customUrl && item.customUrl !== "#"
      ? item.customUrl
      : getStoreSearchUrl(
          item.store,
          `${item.brand === "Generic" ? "" : item.brand} ${item.title}`
        );

  const whatsappShareText = `🔧 Componente relojero encontrado en ChronoParts:\n*${item.title}*\nMarca/Calibre: ${item.brand} (${item.calibre})\nPrecio: ${fmtPrice(item.priceEur, currency)} en ${item.store}\n👉 Ver enlace directo: ${storeUrl}`;
  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(whatsappShareText)}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(storeUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    } catch {
      window.prompt("Copia el enlace del componente:", storeUrl);
    }
  };

  const hasTechDetails = Boolean(
    item.materialSpec ||
      item.toleranceSpec ||
      item.oemRef ||
      item.resaleImpact ||
      item.spec
  );

  return (
    <article
      className={`group flex w-full min-w-0 flex-col justify-between bg-[#ffffff] transition ${
        isSelectedForCompare ? "ring-2 ring-[#e03127]" : ""
      }`}
    >
      <div className="min-w-0">
        {/* 1. Light Gray Product Container (#f4f4f5) matching 3.webp & 4.webp */}
        <div className="relative aspect-square w-full overflow-hidden bg-[#f4f4f5] p-5 sm:p-6">
          <img
            src={item.image}
            alt={item.title}
            loading="lazy"
            width={640}
            height={640}
            onError={(e) => {
              const target = e.currentTarget;
              const fallback = resolveCategoryImage(item.category, item.origin);
              if (target.src !== fallback) {
                target.src = fallback;
              }
            }}
            className="h-full w-full object-contain transition duration-500 group-hover:scale-105"
          />

          {/* Top Left Technical Origin & Savings Tag */}
          <div className="absolute left-3 top-3 flex max-w-[75%] flex-wrap items-center gap-1.5">
            <span
              className={`px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] ${
                item.origin === "oem"
                  ? "bg-[#111111] text-white"
                  : "border border-[#d4d4d8] bg-white text-[#111111]"
              }`}
            >
              {item.origin === "oem" ? "OEM ORIGINAL" : "AFTERMARKET"}
            </span>
            {savingsPct !== null && (
              <span className="bg-[#e03127] px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-white">
                -{savingsPct}% VS OEM
              </span>
            )}
          </div>

          {/* Top Right Save & Price Alert Buttons */}
          <div className="absolute right-3 top-3 flex items-center gap-1.5">
            {onCreateAlert && (
              <button
                type="button"
                onClick={onCreateAlert}
                aria-label="Crear alerta de bajada de precio"
                title="Avisarme si baja de precio"
                className="grid h-7 w-7 place-items-center border border-[#d4d4d8] bg-white text-[#111111] transition hover:border-[#111111]"
              >
                <Bell className="h-3.5 w-3.5" />
              </button>
            )}
            {onToggleSave && (
              <button
                type="button"
                onClick={() => onToggleSave(item.id)}
                aria-label={
                  isSaved ? "Quitar de Mi Caja" : "Guardar pieza en Mi Caja"
                }
                title={
                  isSaved ? "Quitar de Mi Caja" : "Guardar pieza en Mi Caja"
                }
                className={`grid h-7 w-7 place-items-center border transition ${
                  isSaved
                    ? "border-[#e03127] bg-[#e03127] text-white"
                    : "border-[#d4d4d8] bg-white text-[#111111] hover:border-[#111111]"
                }`}
              >
                <Heart
                  className={`h-3.5 w-3.5 ${isSaved ? "fill-current" : ""}`}
                />
              </button>
            )}
          </div>
        </div>

        {/* 2. Header Row Below Image: Model/Ref on Left + Red Rectangular Button on Right (Exact 3.webp match) */}
        <div className="mt-3.5 flex items-center justify-between gap-2.5 pb-2.5">
          <div className="min-w-0 flex-1">
            <p className="truncate font-mono text-[10px] uppercase tracking-[0.1em] text-[#666666]">
              {item.oemRef ? `REF. ${item.oemRef}` : item.brand.toUpperCase()} ·{" "}
              {item.store.toUpperCase()}
            </p>
            <h3
              style={{ fontFamily: "var(--font-display)" }}
              className="mt-0.5 line-clamp-1 text-[14px] font-semibold tracking-tight text-[#111111]"
            >
              {item.title}
            </h3>
          </div>

          <a
            href={storeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="aurik-btn-red shrink-0 px-3 py-1.5 text-[10px]"
          >
            <span>VER OFERTA</span>
            <span>&gt;</span>
          </a>
        </div>

        {/* 3. Technical Specification Rows separated by 1px solid #e5e5e5 hairlines (Exact 3.webp match) */}
        <div className="aurik-spec-row text-[#111111]">
          <span className="aurik-spec-label">
            TYPE : {item.origin === "oem" ? "OEM FACTORY" : "AFTERMARKET"}
          </span>
          <span className="aurik-spec-value font-semibold text-[#111111]">
            {fmtPrice(item.priceEur, currency)}
            {item.origin === "generic" &&
              refOemPrice &&
              refOemPrice > item.priceEur && (
                <span className="ml-1.5 text-[10px] font-normal text-[#666666] line-through">
                  {fmtPrice(refOemPrice, currency)}
                </span>
              )}
          </span>
        </div>

        <div className="aurik-spec-row border-b border-[#e5e5e5] text-[#111111]">
          <span className="min-w-0 flex-1 truncate pr-2">
            FIT : {item.compatibleWith.slice(0, 2).join(" / ")}
          </span>
          <div className="flex shrink-0 items-center gap-3">
            {onCompare && (
              <button
                type="button"
                onClick={onCompare}
                className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.08em] text-[#e03127] hover:underline"
              >
                <Scale className="h-3 w-3" />
                <span>1:1</span>
              </button>
            )}
            {hasTechDetails && (
              <button
                type="button"
                onClick={() => setShowTechDetails((v) => !v)}
                className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.08em] text-[#666666] hover:text-[#111111]"
              >
                <span>SPECS</span>
                <ChevronDown
                  className={`h-3 w-3 transition-transform ${
                    showTechDetails ? "rotate-180" : ""
                  }`}
                />
              </button>
            )}
          </div>
        </div>

        {/* 4. Share Row: WhatsApp & Copy Direct Link */}
        <div className="mt-2 flex items-center justify-between gap-2 pt-0.5">
          <a
            href={whatsappShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Compartir este componente por WhatsApp"
            className="inline-flex flex-1 items-center justify-center gap-1.5 border border-[#25D366]/40 bg-[#25D366]/10 px-2.5 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-[#128C7E] transition hover:border-[#25D366] hover:bg-[#25D366] hover:text-white"
          >
            <MessageCircle className="h-3.5 w-3.5 shrink-0" />
            <span>WHATSAPP</span>
          </a>
          <button
            type="button"
            onClick={handleCopyLink}
            title="Copiar enlace directo del componente"
            className={`inline-flex flex-1 items-center justify-center gap-1.5 border px-2.5 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.06em] transition ${
              copiedLink
                ? "border-emerald-600 bg-emerald-600 text-white"
                : "border-[#e5e5e5] bg-[#f4f4f5] text-[#111111] hover:border-[#111111]"
            }`}
          >
            {copiedLink ? (
              <>
                <Check className="h-3.5 w-3.5 shrink-0" />
                <span>¡COPIADO!</span>
              </>
            ) : (
              <>
                <Link2 className="h-3.5 w-3.5 shrink-0" />
                <span>COPIAR LINK</span>
              </>
            )}
          </button>
        </div>

        {showTechDetails && (
          <dl className="mt-2 space-y-1.5 border border-[#e5e5e5] bg-[#f8f8f8] p-3 text-[11px]">
            {item.spec && (
              <div className="flex justify-between gap-3">
                <dt className="font-mono text-[10px] uppercase text-[#666666]">
                  ESPECIFICACIÓN
                </dt>
                <dd className="text-right font-medium text-[#111111]">
                  {item.spec}
                </dd>
              </div>
            )}
            {item.materialSpec && (
              <div className="flex justify-between gap-3">
                <dt className="font-mono text-[10px] uppercase text-[#666666]">
                  MATERIAL
                </dt>
                <dd className="text-right font-medium text-[#111111]">
                  {item.materialSpec}
                </dd>
              </div>
            )}
            {item.toleranceSpec && (
              <div className="flex justify-between gap-3">
                <dt className="font-mono text-[10px] uppercase text-[#666666]">
                  TOLERANCIA
                </dt>
                <dd className="text-right font-medium text-[#111111]">
                  {item.toleranceSpec}
                </dd>
              </div>
            )}
            {item.resaleImpact && (
              <div className="flex justify-between gap-3">
                <dt className="font-mono text-[10px] uppercase text-[#666666]">
                  IMPACTO
                </dt>
                <dd className="text-right font-medium text-[#111111]">
                  {item.resaleImpact}
                </dd>
              </div>
            )}
          </dl>
        )}
      </div>
    </article>
  );
}

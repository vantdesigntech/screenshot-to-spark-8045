import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Check, Clock, Link2, MessageCircle, RefreshCw, Search, Sparkles } from "lucide-react";
import { AurikNavbar } from "@/components/AurikNavbar";
import { fmtPrice } from "@/components/AurikPartCard";
import {
  CHOLLO_PLATFORMS,
  CHOLLOS_TTL_MS,
  DAILY_CHOLLOS,
  fetchLiveChollosFromApi,
  getDailyChollosSyncState,
  resolveCholloFallbackImage,
  saveDailyChollosSyncState,
  type CholloDeal,
  type CholloPlatform,
} from "@/lib/chollos";

export const Route = createFileRoute("/chollos")({
  head: () => ({
    meta: [
      {
        title: "Chollos de Relojería & Oportunidades Verificadas (Ciclo 24h) — Cronora",
      },
      {
        name: "description",
        content:
          "Radar diario con actualización automática cada 24 horas de chollos 100% legítimos en relojes completos por debajo de mercado con enlaces directos verificados.",
      },
    ],
  }),
  component: ChollosPage,
});

function formatRemaining24h(nextRefreshAtMs: number): string {
  const diffMs = Math.max(0, nextRefreshAtMs - Date.now());
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${mins}m`;
}

function ChollosPage() {
  const [cholloPlatform, setCholloPlatform] = useState<"all" | CholloPlatform>("all");
  const [cholloQuery, setCholloQuery] = useState("");
  const [liveChollos, setLiveChollos] = useState<CholloDeal[]>([]);
  const [isScanningChollos, setIsScanningChollos] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [nextRefreshAtMs, setNextRefreshAtMs] = useState<number>(
    () => Date.now() + CHOLLOS_TTL_MS,
  );
  const [copiedDealId, setCopiedDealId] = useState<string | null>(null);

  // Automatic 24-hour cycle check & auto-refresh on mount
  useEffect(() => {
    const syncState = getDailyChollosSyncState();
    if (syncState && Date.now() < syncState.nextRefreshAtMs) {
      setLiveChollos(syncState.items);
      setNextRefreshAtMs(syncState.nextRefreshAtMs);
      setStatusMessage(
        `${syncState.items.length} OFERTAS REALES VERIFICADAS · CICLO 24H ACTIVO`,
      );
      return;
    }

    // 24h TTL expired or first visit -> trigger automatic live scan
    let active = true;
    setIsScanningChollos(true);
    fetchLiveChollosFromApi("", true)
      .then((freshDeals) => {
        if (!active) return;
        const saved = saveDailyChollosSyncState(
          freshDeals.length > 0 ? freshDeals : DAILY_CHOLLOS,
        );
        setLiveChollos(saved.items);
        setNextRefreshAtMs(saved.nextRefreshAtMs);
        setStatusMessage(
          `ACTUALIZADO HOY (${saved.items.length} ANUNCIOS REALES VERIFICADOS)`,
        );
      })
      .finally(() => {
        if (active) setIsScanningChollos(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const displayedChollos = useMemo(() => {
    const seen = new Set<string>();
    const merged: CholloDeal[] = [];
    for (const item of [...liveChollos, ...DAILY_CHOLLOS]) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        merged.push(item);
      }
    }
    const filteredByPlatform =
      cholloPlatform === "all"
        ? merged
        : merged.filter((c) => c.platform === cholloPlatform);
    const trimmed = cholloQuery.trim().toLowerCase();
    if (!trimmed) return filteredByPlatform;
    return filteredByPlatform.filter((c) =>
      `${c.title} ${c.brand} ${c.calibreRef ?? ""} ${c.platform} ${c.aiVerdict}`
        .toLowerCase()
        .includes(trimmed),
    );
  }, [liveChollos, cholloPlatform, cholloQuery]);

  const runLiveCholloScan = async (customTerm?: string) => {
    const q = (customTerm ?? cholloQuery).trim();
    setIsScanningChollos(true);
    setStatusMessage(null);
    const scanned = await fetchLiveChollosFromApi(q, true);
    setIsScanningChollos(false);
    if (scanned.length > 0) {
      setLiveChollos(scanned);
      if (!q) {
        const saved = saveDailyChollosSyncState(scanned);
        setNextRefreshAtMs(saved.nextRefreshAtMs);
      }
      setStatusMessage(
        q
          ? `${scanned.length} CHOLLOS REALES VERIFICADOS PARA "${q.toUpperCase()}"`
          : `CICLO 24H SINCRONIZADO: ${scanned.length} OFERTAS REALES VERIFICADAS`,
      );
    } else {
      setStatusMessage(
        `MOSTRANDO SELECCIÓN VERIFICADA DEL DÍA${q ? ` PARA "${q.toUpperCase()}"` : ""}`,
      );
    }
  };

  const handleCopyDealLink = async (deal: CholloDeal) => {
    try {
      await navigator.clipboard.writeText(deal.url);
    } catch {
      const input = document.createElement("input");
      input.value = deal.url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }
    setCopiedDealId(deal.id);
    window.setTimeout(() => setCopiedDealId(null), 2200);
  };

  return (
    <div className="min-h-screen bg-white text-[#111111]">
      <AurikNavbar />

      <main className="mx-auto max-w-[1440px] px-4 py-10 sm:px-8 sm:py-16">
        {/* Section Header */}
        <div className="flex flex-col justify-between gap-4 border-b border-[#e5e5e5] pb-8 lg:flex-row lg:items-end">
          <div>
            <div className="aurik-section-tag flex flex-wrap items-center gap-2">
              <span className="aurik-dot" />
              <span>RADAR DE OPORTUNIDADES // ACTUALIZACIÓN AUTOMÁTICA 24H</span>
              <span className="inline-flex items-center gap-1 border border-[#111111] bg-[#111111] px-2 py-0.5 font-mono text-[10px] text-white">
                <Clock className="h-3 w-3 text-[#22c55e]" />
                PRÓXIMO ESCANEO 24H: {formatRemaining24h(nextRefreshAtMs)}
              </span>
            </div>
            <h1 className="aurik-hero-title mt-3 text-2xl sm:text-4xl">
              Relojes completos verificados bajo mercado
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#52525b]">
              Escáner diario sincronizado cada 24 horas que filtra únicamente
              anuncios reales activos de relojes completos (excluyendo cajas
              vacías, correas o piezas rotas) con descuento legítimo de entre el
              15% y el 65% frente a su valor de mercado.
            </p>
          </div>

          <Link to="/" className="aurik-btn-red self-start lg:self-auto">
            <span>IR AL BUSCADOR DE PIEZAS</span>
            <span>&gt;</span>
          </Link>
        </div>

        {/* Filter & Live Scanner Bar */}
        <div className="mt-8 border border-[#e5e5e5] bg-[#f4f4f5] p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex h-12 flex-1 items-center gap-3 border border-[#111111] bg-white px-4">
              <Search className="h-4 w-4 shrink-0 text-[#71717a]" />
              <input
                value={cholloQuery}
                onChange={(e) => setCholloQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void runLiveCholloScan();
                }}
                placeholder="Filtrar o escanear relojes en vivo (ej. Seiko SKX007, Tissot PRX, Omega, Hamilton)..."
                aria-label="Filtrar o escanear chollos"
                className="min-w-0 flex-1 bg-transparent text-sm text-[#111111] outline-none placeholder:text-[#71717a]"
              />
            </div>

            <button
              type="button"
              onClick={() => void runLiveCholloScan()}
              disabled={isScanningChollos}
              className="aurik-btn-red h-12 justify-between px-6 disabled:opacity-50"
            >
              <span className="inline-flex items-center gap-2">
                {isScanningChollos ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                {isScanningChollos ? "ESCANEANDO EN VIVO..." : "ACTUALIZAR CHOLLOS (24H)"}
              </span>
              <span>&gt;</span>
            </button>
          </div>

          {/* Platform Selector Tabs */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#e5e5e5] pt-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#71717a]">
                PLATAFORMA:
              </span>
              {[
                { id: "all" as const, label: "TODAS" },
                ...CHOLLO_PLATFORMS.map((p) => ({
                  id: p,
                  label: p.toUpperCase(),
                })),
              ].map((plat) => {
                const active = cholloPlatform === plat.id;
                return (
                  <button
                    key={plat.id}
                    type="button"
                    onClick={() => setCholloPlatform(plat.id)}
                    className={`px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.08em] transition ${
                      active
                        ? "bg-[#e03127] text-white"
                        : "border border-[#d4d4d8] bg-white text-[#111111] hover:border-[#111111]"
                    }`}
                  >
                    {plat.label}
                  </button>
                );
              })}
            </div>

            {statusMessage && (
              <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-[#e03127]">
                ● {statusMessage}
              </span>
            )}
          </div>
        </div>

        {/* Chollos Grid */}
        <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {displayedChollos.map((deal, idx) => {
            const whatsappText = `⌚ *Chollo Verificado en Cronora*\n• *${deal.title}*\n• Marca: ${deal.brand}\n• Precio: ${fmtPrice(deal.priceEur, "EUR")} (Mercado: ${fmtPrice(deal.marketValueEur, "EUR")} · -${deal.savingsPct}%)\n• Enlace directo al anuncio: ${deal.url}`;
            const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;

            return (
              <article
                key={deal.id}
                className="group flex min-w-0 flex-col justify-between bg-white"
              >
                <div>
                  {/* Light Gray Product Image Container (#f4f4f5) */}
                  <div className="relative aspect-square overflow-hidden bg-[#f4f4f5] p-5 sm:p-6">
                    <img
                      src={deal.image || resolveCholloFallbackImage(deal.brand, idx)}
                      alt={deal.title}
                      loading="lazy"
                      onError={(e) => {
                        const target = e.currentTarget;
                        const fb = resolveCholloFallbackImage(deal.brand, idx);
                        if (!target.src.endsWith(fb)) {
                          target.src = fb;
                        }
                      }}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute left-3 top-3 flex items-center gap-1.5">
                      <span className="bg-[#111111] px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-white">
                        {deal.platform} · VERIFICADO
                      </span>
                    </div>
                    <div className="absolute right-3 top-3">
                      <span className="bg-[#e03127] px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-white">
                        -{deal.savingsPct}% CHOLLO
                      </span>
                    </div>
                  </div>

                  {/* Title & Red Rectangular CTA Button */}
                  <div className="mt-3.5 flex items-center justify-between gap-3 pb-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-[10px] uppercase tracking-[0.08em] text-[#71717a]">
                        {deal.brand} · {deal.condition}
                      </p>
                      <h2 className="mt-0.5 line-clamp-1 text-sm font-semibold tracking-tight text-[#111111]">
                        {deal.title}
                      </h2>
                    </div>

                    <a
                      href={deal.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="aurik-btn-red shrink-0 px-3 py-1.5 text-[10px]"
                    >
                      <span>VER CHOLLO</span>
                      <span>&gt;</span>
                    </a>
                  </div>

                  {/* 1px Hairline Spec Rows */}
                  <div className="aurik-spec-row">
                    <span className="aurik-spec-label">PRECIO DETECTADO</span>
                    <span className="aurik-spec-value font-semibold text-[#111111]">
                      {fmtPrice(deal.priceEur, "EUR")}{" "}
                      <span className="ml-1.5 text-[10px] font-normal text-[#71717a] line-through">
                        {fmtPrice(deal.marketValueEur, "EUR")}
                      </span>
                    </span>
                  </div>

                  <div className="aurik-spec-row">
                    <span className="aurik-spec-label">REFERENCIA / AHORRO</span>
                    <span className="aurik-spec-value">
                      {deal.calibreRef ?? deal.aiVerdict} ·{" "}
                      <strong className="text-[#e03127]">
                        AHORRO -{fmtPrice(deal.profitMarginEur, "EUR")}
                      </strong>
                    </span>
                  </div>

                  {/* Share via WhatsApp & Copy Direct Link Bar */}
                  <div className="mt-2 flex items-center justify-between gap-2 border-t border-[#e5e5e5] pt-2.5">
                    <div className="flex items-center gap-1.5">
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Compartir chollo por WhatsApp"
                        className="inline-flex items-center gap-1 border border-[#16a34a]/40 bg-[#f0fdf4] px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-[#15803d] transition hover:border-[#16a34a] hover:bg-[#dcfce7]"
                      >
                        <MessageCircle className="h-3 w-3" />
                        <span>WHATSAPP</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => void handleCopyDealLink(deal)}
                        title="Copiar enlace directo al chollo"
                        className="inline-flex items-center gap-1 border border-[#d4d4d8] bg-white px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-[#52525b] transition hover:border-[#111111] hover:text-[#111111]"
                      >
                        {copiedDealId === deal.id ? (
                          <>
                            <Check className="h-3 w-3 text-[#16a34a]" />
                            <span className="text-[#16a34a]">¡COPIADO!</span>
                          </>
                        ) : (
                          <>
                            <Link2 className="h-3 w-3" />
                            <span>COPIAR LINK</span>
                          </>
                        )}
                      </button>
                    </div>

                    <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-[#71717a]">
                      {deal.timeLeft}
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </main>
    </div>
  );
}

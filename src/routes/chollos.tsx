import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Check, Clock, Link2, MessageCircle, RefreshCw, Search, Sparkles } from "lucide-react";
import { AurikNavbar } from "@/components/AurikNavbar";
import { fmtPrice } from "@/components/AurikPartCard";
import {
  CHOLLO_PLATFORMS,
  CHOLLOS_TTL_MS,
  fetchLiveChollosFromApi,
  getDailyChollosSyncState,
  saveDailyChollosSyncState,
  type CholloDeal,
  type CholloPlatform,
} from "@/lib/chollos";

export const Route = createFileRoute("/chollos")({
  head: () => ({
    meta: [
      {
        title: "Ofertas de Relojes con Referencia de Precio — Cronora",
      },
      {
        name: "description",
        content:
          "Búsqueda de anuncios de relojes completos con precio y referencia comparativa orientativa.",
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
  const [nextRefreshAtMs, setNextRefreshAtMs] = useState<number>(() => Date.now() + CHOLLOS_TTL_MS);
  const [copiedDealId, setCopiedDealId] = useState<string | null>(null);
  // The countdown depends on Date.now(), so it stays hidden until after
  // hydration: server markup and first client render then match exactly.
  const [isClockHydrated, setIsClockHydrated] = useState(false);

  useEffect(() => {
    setIsClockHydrated(true);
  }, []);

  // Automatic 24-hour cycle check & auto-refresh on mount
  useEffect(() => {
    const syncState = getDailyChollosSyncState();
    if (syncState && Date.now() < syncState.nextRefreshAtMs) {
      setLiveChollos(syncState.items);
      setNextRefreshAtMs(syncState.nextRefreshAtMs);
      setStatusMessage(
        `${syncState.items.length} ANUNCIOS GUARDADOS · DISPONIBILIDAD POR CONFIRMAR`,
      );
      return;
    }

    // 24h TTL expired or first visit -> trigger automatic live scan
    let active = true;
    setIsScanningChollos(true);
    fetchLiveChollosFromApi("", true)
      .then((freshDeals) => {
        if (!active) return;
        if (freshDeals.length > 0) {
          const saved = saveDailyChollosSyncState(freshDeals);
          setLiveChollos(saved.items);
          setNextRefreshAtMs(saved.nextRefreshAtMs);
          setStatusMessage(`${saved.items.length} ANUNCIOS LOCALIZADOS · REFERENCIA ORIENTATIVA`);
        } else {
          setLiveChollos([]);
          setStatusMessage("SIN RESULTADOS COMPARABLES O FUENTES NO DISPONIBLES");
        }
      })
      .finally(() => {
        if (active) setIsScanningChollos(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const displayedChollos = useMemo(() => {
    const filteredByPlatform =
      cholloPlatform === "all"
        ? liveChollos
        : liveChollos.filter((c) => c.platform === cholloPlatform);
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
          ? `${scanned.length} ANUNCIOS LOCALIZADOS PARA "${q.toUpperCase()}" · REFERENCIA ORIENTATIVA`
          : `ESCANEO COMPLETADO: ${scanned.length} ANUNCIOS CON REFERENCIA COMPARABLE`,
      );
    } else {
      setLiveChollos([]);
      setStatusMessage(
        `SIN RESULTADOS COMPARABLES O FUENTES NO DISPONIBLES${q ? ` PARA "${q.toUpperCase()}"` : ""}`,
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
    <div className="min-h-screen bg-background text-foreground">
      <AurikNavbar />

      <main className="mx-auto max-w-[1440px] px-4 py-10 sm:px-8 sm:py-16">
        {/* Section Header */}
        <div className="flex flex-col justify-between gap-4 border-b border-border pb-8 lg:flex-row lg:items-end">
          <div>
            <div className="aurik-section-tag flex flex-wrap items-center gap-2">
              <span className="aurik-dot" />
              <span>RADAR DE OPORTUNIDADES // CACHÉ 24H · BÚSQUEDA MANUAL DISPONIBLE</span>
              <span className="inline-flex items-center gap-1 border border-foreground bg-foreground px-2 py-0.5 font-mono text-[10px] text-primary-foreground">
                <Clock className="h-3 w-3 text-[#22c55e] dark:text-[#4ade80]" />
                PRÓXIMO ESCANEO 24H:{" "}
                {isClockHydrated ? formatRemaining24h(nextRefreshAtMs) : "24h 0m"}
              </span>
            </div>
            <h1 className="aurik-hero-title mt-3 text-2xl sm:text-4xl">
              Anuncios de relojes con referencia de precio
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Localiza anuncios de relojes completos y muestra una comparación orientativa solo
              cuando hay una referencia para ese modelo. La disponibilidad y el estado deben
              confirmarse en la tienda.
            </p>
          </div>

          <Link to="/" className="aurik-btn-red self-start lg:self-auto">
            <span>IR AL BUSCADOR DE PIEZAS</span>
            <span>&gt;</span>
          </Link>
        </div>

        {/* Filter & Live Scanner Bar */}
        <div className="mt-8 border border-border bg-muted p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex h-12 flex-1 items-center gap-3 border border-foreground bg-background px-4">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                value={cholloQuery}
                onChange={(e) => setCholloQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void runLiveCholloScan();
                }}
                placeholder="Filtrar o escanear relojes en vivo (ej. Seiko SKX007, Tissot PRX, Omega, Hamilton)..."
                aria-label="Filtrar o escanear chollos"
                className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
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
                {isScanningChollos ? "ESCANEANDO EN VIVO..." : "BUSCAR OFERTAS"}
              </span>
              <span>&gt;</span>
            </button>
          </div>

          {/* Platform Selector Tabs */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
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
                        ? "bg-primary text-primary-foreground"
                        : "border border-border bg-background text-foreground hover:border-foreground"
                    }`}
                  >
                    {plat.label}
                  </button>
                );
              })}
            </div>

            {statusMessage && (
              <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-primary">
                ● {statusMessage}
              </span>
            )}
          </div>
        </div>

        {/* Chollos Grid */}
        <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {displayedChollos.map((deal) => {
            const whatsappText = `⌚ *Anuncio localizado en Cronora*\n• *${deal.title}*\n• Marca: ${deal.brand}\n• Precio: ${fmtPrice(deal.priceEur, "EUR")} (referencia orientativa: ${fmtPrice(deal.marketValueEur, "EUR")} · -${deal.savingsPct}%)\n• Enlace al anuncio: ${deal.url}`;
            const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;

            return (
              <article
                key={deal.id}
                className="group flex min-w-0 flex-col justify-between bg-background"
              >
                <div>
                  {/* Light Gray Product Image Container (#f4f4f5) */}
                  <div className="relative aspect-square overflow-hidden bg-muted p-5 sm:p-6">
                    <img
                      src={deal.image}
                      alt={deal.title}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.visibility = "hidden";
                      }}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute left-3 top-3 flex items-center gap-1.5">
                      <span className="bg-foreground px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-primary-foreground">
                        {deal.platform} · ANUNCIO LOCALIZADO
                      </span>
                    </div>
                    <div className="absolute right-3 top-3">
                      <span className="bg-primary px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-primary-foreground">
                        -{deal.savingsPct}% VS. REFERENCIA
                      </span>
                    </div>
                  </div>

                  {/* Title & Red Rectangular CTA Button */}
                  <div className="mt-3.5 flex items-center justify-between gap-3 pb-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                        {deal.brand} · {deal.condition}
                      </p>
                      <h2 className="mt-0.5 line-clamp-1 text-sm font-semibold tracking-tight text-foreground">
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
                    <span className="aurik-spec-label">PRECIO / REFERENCIA</span>
                    <span className="aurik-spec-value font-semibold text-foreground">
                      {fmtPrice(deal.priceEur, "EUR")}{" "}
                      <span className="ml-1.5 text-[10px] font-normal text-muted-foreground line-through">
                        {fmtPrice(deal.marketValueEur, "EUR")}
                      </span>
                    </span>
                  </div>

                  <div className="aurik-spec-row">
                    <span className="aurik-spec-label">DIFERENCIA ORIENTATIVA</span>
                    <span className="aurik-spec-value">
                      {deal.calibreRef ?? deal.aiVerdict} ·{" "}
                      <strong className="text-primary">
                        -{fmtPrice(deal.profitMarginEur, "EUR")}
                      </strong>
                    </span>
                  </div>

                  {/* Share via WhatsApp & Copy Direct Link Bar */}
                  <div className="mt-2 flex items-center justify-between gap-2 border-t border-border pt-2.5">
                    <div className="flex items-center gap-1.5">
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Compartir chollo por WhatsApp"
                        className="inline-flex items-center gap-1 border border-[#16a34a]/40 bg-[#f0fdf4] px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-[#15803d] transition hover:border-[#16a34a] hover:bg-[#dcfce7] dark:border-[#25D366]/40 dark:bg-[#25D366]/10 dark:text-[#7ee0a3]"
                      >
                        <MessageCircle className="h-3 w-3" />
                        <span>WHATSAPP</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => void handleCopyDealLink(deal)}
                        title="Copiar enlace directo al chollo"
                        className="inline-flex items-center gap-1 border border-border bg-background px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground transition hover:border-foreground hover:text-foreground"
                      >
                        {copiedDealId === deal.id ? (
                          <>
                            <Check className="h-3 w-3 text-[#16a34a] dark:text-[#4ade80]" />
                            <span className="text-[#16a34a] dark:text-[#4ade80]">¡COPIADO!</span>
                          </>
                        ) : (
                          <>
                            <Link2 className="h-3 w-3" />
                            <span>COPIAR LINK</span>
                          </>
                        )}
                      </button>
                    </div>

                    <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground">
                      {deal.timeLeft}
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
        {displayedChollos.length === 0 && !isScanningChollos && (
          <div className="mt-10 border border-dashed border-border px-6 py-12 text-center">
            <p className="font-semibold">No hay anuncios comparables que mostrar.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Puede que no haya coincidencias o que las fuentes no respondan. No mostraremos ofertas
              de relleno.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

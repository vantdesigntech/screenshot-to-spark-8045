import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";
import { useAccount } from "@/components/AccountProvider";
import { getSavedParts, removeFavorite, saveFavorite } from "@/lib/mi-caja";
import { countActiveFilters } from "@/lib/filter-count";
import { AurikNavbar } from "@/components/AurikNavbar";
import { AurikPartCard } from "@/components/AurikPartCard";
import { buildChronoPartsHeadMeta } from "@/lib/seo-blog";
import { RippleButton } from "@/registry/magicui/ripple-button";
import heroWatch from "@/assets/watch_movement_hero.jpg.asset.json";
import {
  CATEGORIES,
  MAX_PRICE,
  NICHE_PRO_STORES,
  PARTS,
  WATCH_MODELS,
  fetchLivePartsFromApi,
  filterParts,
  ALSO_SEARCH_STORES,
  type SearchSource,
  getStoreSearchUrl,
  isNicheProStore,
  type Category,
  type Filters,
  type Part,
  type Store,
} from "@/lib/parts";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: buildChronoPartsHeadMeta(),
  }),
  component: Index,
});

const ORIGINS: { id: Filters["origin"]; label: string }[] = [
  { id: "all", label: "TODOS" },
  { id: "oem", label: "OEM ORIGINAL" },
  { id: "generic", label: "AFTERMARKET" },
];

const QUICK_SEARCHES = [
  "Seiko NH35",
  "Rolex 124300",
  "Tissot PRX",
  "ETA 2824",
  "Cristal Zafiro",
  "Brazalete Oyster 20mm",
];

type SortOption = "savings" | "price-asc" | "price-desc";

function Index() {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const [origin, setOrigin] = useState<Filters["origin"]>("all");
  const [categories, setCategories] = useState<Category[]>([]);
  const [maxPrice, setMaxPrice] = useState(MAX_PRICE);
  const [currency, setCurrency] = useState<"EUR" | "USD">("EUR");
  const [storeFilter, setStoreFilter] = useState<"all" | "niche-pro" | Store>("all");
  const [sortBy, setSortBy] = useState<SortOption>("savings");

  const [showFiltersSheet, setShowFiltersSheet] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [searchSources, setSearchSources] = useState<SearchSource[]>([]);
  const requestVersion = useRef(0);
  const [apiResults, setApiResults] = useState<Part[]>([]);
  const [isLoadingApi, setIsLoadingApi] = useState(false);

  const searchSectionRef = useRef<HTMLElement>(null);
  const resultsRef = useRef<HTMLElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { user, openAuth } = useAccount();
  useEffect(() => {
    if (!user) { setSavedIds([]); return; }
    getSavedParts().then((rows) => setSavedIds(rows.map((r) => r.part_id))).catch(() => setSavedIds([]));
  }, [user]);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((cur) => (cur === msg ? null : cur));
    }, 3000);
  };

  // Autocomplete suggestions for search input
  const autocompleteSuggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];

    const results: { label: string; type: string; queryValue: string }[] = [];

    for (const m of WATCH_MODELS) {
      if (`${m.brand} ${m.name} ${m.ref} ${m.movement}`.toLowerCase().includes(q)) {
        results.push({
          label: `${m.brand} ${m.name} (${m.ref})`,
          type: "RELOJ",
          queryValue: m.searchKeyword,
        });
      }
    }

    for (const p of PARTS) {
      if (results.length >= 6) break;
      if (
        `${p.title} ${p.brand} ${p.oemRef ?? ""} ${p.compatibleWith.join(" ")}`
          .toLowerCase()
          .includes(q)
      ) {
        results.push({
          label: p.title,
          type: "PIEZA",
          queryValue: p.title,
        });
      }
    }

    return results.slice(0, 6);
  }, [query]);

  const activeFilterCount = countActiveFilters({ origin, categories, storeFilter, maxPrice, maxPriceLimit: MAX_PRICE });


  const allPartsPool = useMemo(() => {
    const map = new Map<string, Part>();
    for (const p of PARTS) map.set(p.id, p);
    for (const p of apiResults) map.set(p.id, p);
    return Array.from(map.values());
  }, [apiResults]);

  const displayedParts = useMemo(() => {
    if (!hasSearched) return [];

    const catalogMatches = filterParts(PARTS, {
      query: submittedQuery,
      origin,
      categories,
      maxPrice,
    });

    const filteredApi = filterParts(apiResults, {
      query: "",
      origin,
      categories,
      maxPrice,
    });

    const ids = new Set(catalogMatches.map((p) => p.id));
    const realMatches = [
      ...catalogMatches,
      ...filteredApi.filter((p) => !ids.has(p.id)),
    ];

    let base = realMatches;
    if (storeFilter === "niche-pro") base = base.filter((p) => isNicheProStore(p.store));
    else if (storeFilter !== "all") base = base.filter((p) => p.store === storeFilter);

    const sorted = [...base];
    if (sortBy === "price-asc") {
      sorted.sort((a, b) => a.priceEur - b.priceEur);
    } else if (sortBy === "price-desc") {
      sorted.sort((a, b) => b.priceEur - a.priceEur);
    } else {
      sorted.sort((a, b) => {
        const savA =
          a.origin === "generic" &&
          a.equivalentOemPriceEur &&
          a.equivalentOemPriceEur > a.priceEur
            ? (a.equivalentOemPriceEur - a.priceEur) / a.equivalentOemPriceEur
            : 0;
        const savB =
          b.origin === "generic" &&
          b.equivalentOemPriceEur &&
          b.equivalentOemPriceEur > b.priceEur
            ? (b.equivalentOemPriceEur - b.priceEur) / b.equivalentOemPriceEur
            : 0;
        return savB - savA;
      });
    }
    return sorted;
  }, [
    hasSearched,
    submittedQuery,
    origin,
    categories,
    maxPrice,
    currency,
    apiResults,
    storeFilter,
    sortBy,
  ]);

  const executeSearch = async (termToSearch?: string) => {
    const clean = (termToSearch ?? query).trim();
    const version = ++requestVersion.current;
    setApiResults([]);
    setSearchSources([]);
    setQuery(clean);
    setSubmittedQuery(clean);
    setSearchFocused(false);
    setHasSearched(true);

    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);

    if (clean.length >= 2) {
      setIsLoadingApi(true);
      const live = await fetchLivePartsFromApi(clean);
      if (version !== requestVersion.current) return;
      setApiResults(live.items);
      setSearchSources(live.sources);
      setIsLoadingApi(false);
    } else {
      setIsLoadingApi(false);
      setApiResults([]);
    }
  };

  const resetSearch = () => {
    requestVersion.current += 1;
    setIsLoadingApi(false);
    setSearchSources([]);
    setQuery("");
    setSubmittedQuery("");
    setOrigin("all");
    setCategories([]);
    setStoreFilter("all");
    setMaxPrice(MAX_PRICE);
    setApiResults([]);
    setHasSearched(false);
  };

  const toggleSaveById = async (id: string) => {
    if (!user) { openAuth(); return; }
    const part = allPartsPool.find((p) => p.id === id);
    const wasSaved = savedIds.includes(id);
    setSavedIds((cur) => (wasSaved ? cur.filter((x) => x !== id) : [...cur, id]));
    try {
      if (wasSaved) await removeFavorite(id);
      else if (part) await saveFavorite(user.id, { id: part.id, title: part.title, priceEur: part.priceEur, store: part.store });
      if (part) triggerToast(`${wasSaved ? "ELIMINADO DE" : "GUARDADO EN"} MI CAJA: ${part.title}`);
    } catch {
      setSavedIds((cur) => (wasSaved ? [...cur, id] : cur.filter((x) => x !== id)));
      triggerToast("NO SE PUDO GUARDAR. INTÉNTALO DE NUEVO.");
    }
  };

  const clearFilters = () => {
    setOrigin("all");
    setCategories([]);
    setStoreFilter("all");
    setMaxPrice(MAX_PRICE);
  };

  const activeChips: { key: string; label: string; remove: () => void }[] = [
    ...(origin !== "all" ? [{ key: "origin", label: ORIGINS.find((o) => o.id === origin)?.label ?? origin, remove: () => setOrigin("all") }] : []),
    ...categories.map((c) => ({ key: `cat-${c}`, label: CATEGORIES.find((x) => x.id === c)?.label ?? c, remove: () => toggleCategory(c) })),
    ...(storeFilter !== "all" ? [{ key: "store", label: storeFilter === "niche-pro" ? "PRO HOROLOGY" : storeFilter, remove: () => setStoreFilter("all") }] : []),
    ...(maxPrice < MAX_PRICE ? [{ key: "price", label: `≤ ${maxPrice} ${currency === "EUR" ? "€" : "$"}`, remove: () => setMaxPrice(MAX_PRICE) }] : []),
  ];


  const toggleCategory = (cat: Category) => {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Shared CRONORA Top Bar */}
      <AurikNavbar
        savedCount={savedIds.length}
        onFocusSearch={() => {
          searchSectionRef.current?.scrollIntoView({ behavior: "smooth" });
          setTimeout(() => searchInputRef.current?.focus(), 200);
        }}
      />

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-4 left-4 right-4 z-50 border border-foreground bg-foreground px-4 py-3 font-mono text-xs uppercase tracking-[0.06em] text-primary-foreground shadow-lg sm:left-auto sm:right-6 sm:max-w-md">
          <span className="mr-2 text-primary">●</span>
          {toastMsg}
        </div>
      )}

      <main>
        {/* =========================================================
            1. HERO SECTION
           ========================================================= */}
        <section className="relative isolate flex min-h-[78svh] items-center overflow-hidden border-b border-border px-4 py-16 sm:px-8">
          <img src={heroWatch.url} alt="" aria-hidden className="absolute inset-0 -z-20 h-full w-full object-cover object-[60%_40%]" />
          <div aria-hidden className="hero-photo-shade absolute inset-0 -z-10" />
          <div className="mx-auto w-full max-w-[1240px]">
          {/* Main Headline using the special display/stencil font */}
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="aurik-hero-title text-hero-foreground text-[44px] sm:text-[80px] md:text-[104px]">
              Recambios para
              <br /> tu reloj
            </h1>
          </div>

          {/* Centered Red Circle Badge + Clean Readable Subtitle Row */}
          <div className="mx-auto mt-5 flex max-w-xl flex-col items-center justify-center gap-4 text-center sm:mt-7 sm:flex-row sm:gap-5 sm:text-left">
            <button
              type="button"
              onClick={() => {
                searchSectionRef.current?.scrollIntoView({
                  behavior: "smooth",
                });
                setTimeout(() => searchInputRef.current?.focus(), 250);
              }}
              aria-label="Ir al buscador"
              className="order-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105 sm:order-1"
            >
              <ChevronDown className="h-5 w-5" strokeWidth={2} />
            </button>

            <p className="order-1 text-sm leading-relaxed text-hero-foreground/85 sm:order-2">
              Encuentra al instante cristales de zafiro, calibres automáticos,
              biseles, agujas, coronas y brazaletes OEM o Aftermarket
              compatibles con tu modelo exacto.
            </p>
          </div>
          </div>
        </section>

        {/* =========================================================
            2. SEARCH SECTION DIRECTLY BELOW HERO
           ========================================================= */}
        <section
          ref={searchSectionRef}
          id="buscador"
          className="mx-auto max-w-[1000px] px-4 py-12 sm:px-8 sm:py-16"
        >
          <div className="w-full">
            <div className="aurik-section-tag mb-3">
              <span className="aurik-dot" />
              <span>BUSCADOR DE RECAMBIOS Y CALIBRES</span>
            </div>

            <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-3xl">
              Busca por referencia de reloj, calibre o pieza compatible
            </h2>

            {/* Search Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void executeSearch(query);
              }}
              className="relative mt-6"
            >
              <div className="flex flex-col gap-2.5 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={query}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setTimeout(() => setSearchFocused(false), 180)}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ej: Seiko NH35, Rolex 124300, Tissot PRX, ETA 2824..."
                    className="h-13 w-full border border-foreground bg-muted pl-11 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:bg-background focus:outline-none"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      aria-label="Borrar texto"
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowFiltersSheet(true)}
                    className="aurik-btn-gray h-13 flex-1 justify-center px-5 sm:flex-initial"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    <span>
                      FILTROS{activeFilterCount > 0 ? ` [${activeFilterCount}]` : ""}
                    </span>
                  </button>

                  <RippleButton
                    type="submit"
                    rippleColor="var(--background)"
                    className="aurik-btn-red h-13 flex-1 justify-between rounded-none bg-primary px-7 py-[0.55rem] text-background sm:flex-initial"
                  >
                    <span>BUSCAR</span>
                    <span>&gt;</span>
                  </RippleButton>
                </div>
              </div>

              {/* Autocomplete Suggestions Dropdown */}
              {searchFocused && autocompleteSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-30 mt-1 border border-foreground bg-background shadow-lg">
                  {autocompleteSuggestions.map((sug) => (
                    <button
                      key={`${sug.type}-${sug.label}`}
                      type="button"
                      onMouseDown={() => void executeSearch(sug.queryValue)}
                      className="flex w-full items-center justify-between gap-2 border-b border-border px-4 py-3 text-left text-xs text-foreground hover:bg-muted last:border-b-0"
                    >
                      <span className="truncate font-medium">{sug.label}</span>
                      <span className="shrink-0 bg-muted px-2 py-0.5 font-mono text-[10px] uppercase text-primary">
                        {sug.type} &gt;
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </form>

            {/* Quick Search Triggers */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                BÚSQUEDAS RÁPIDAS:
              </span>
              {QUICK_SEARCHES.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => void executeSearch(term)}
                  className="border border-border bg-background px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.05em] text-foreground transition-colors hover:border-foreground hover:bg-muted"
                >
                  {term} &gt;
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* =========================================================
            3. CONDITIONAL SEARCH RESULTS (ONLY AFTER SEARCHING!)
           ========================================================= */}
        {hasSearched && (
          <section
            ref={resultsRef}
            id="resultados"
            className="mx-auto max-w-[1440px] border-t border-border px-4 py-10 sm:px-8 sm:py-16"
          >
            {/* Results Header Bar */}
            <div className="mb-8 flex flex-col justify-between gap-4 border-b border-border pb-6 lg:flex-row lg:items-end">
              <div>
                <div className="aurik-section-tag">
                  <span className="aurik-dot" />
                  <span>
                    RESULTADOS DE BÚSQUEDA // {displayedParts.length} PIEZAS
                    ENCONTRADAS
                  </span>
                </div>
                <h3 className="mt-2 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  {submittedQuery
                    ? `Resultados para "${submittedQuery}"`
                    : "Catálogo filtrado de recambios"}
                </h3>
                {isLoadingApi && (
                  <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.08em] text-primary">
                    ● ESCANEANDO DISTRIBUIDORES EN TIEMPO REAL...
                  </p>
                )}
              </div>

              {/* Origin Filter + Sort + Reset Controls */}
              <div className="flex flex-wrap items-center gap-2">
                {ORIGINS.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setOrigin(o.id)}
                    className={
                      origin === o.id ? "aurik-btn-red" : "aurik-btn-gray"
                    }
                  >
                    <span>{o.label}</span>
                  </button>
                ))}

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  aria-label="Ordenar resultados"
                  className="h-9 border border-border bg-muted px-3 font-mono text-[11px] uppercase tracking-[0.05em] text-foreground focus:border-foreground focus:outline-none"
                >
                  <option value="savings">ORDEN: MAYOR AHORRO</option>
                  <option value="price-asc">PRECIO: MENOR A MAYOR</option>
                  <option value="price-desc">PRECIO: MAYOR A MENOR</option>
                </select>

                <button
                  type="button"
                  onClick={resetSearch}
                  className="aurik-btn-gray"
                >
                  <span>CERRAR RESULTADOS</span>
                  <span>[X]</span>
                </button>
              </div>
            </div>

            <div className="mb-6 space-y-3 text-sm text-foreground">
              <ul aria-label="Estado de las fuentes" className="flex flex-wrap gap-x-6 gap-y-2">
                {searchSources.map((source) => (
                  <li key={source.name}>{source.name}: {source.status === "ok" ? `${source.count} resultados` : source.status === "timeout" ? "Tiempo de espera agotado" : "No se pudo consultar"}</li>
                ))}
              </ul>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <span>Buscar también en</span>
                {ALSO_SEARCH_STORES.map((store) => <a key={store} href={getStoreSearchUrl(store, submittedQuery)} target="_blank" rel="noopener noreferrer" className="text-primary underline">{store}</a>)}
              </div>
            </div>
            {activeChips.length > 0 && (
              <div className="mb-5 flex flex-wrap items-center gap-2" aria-label="Filtros activos">
                {activeChips.map((c) => (
                  <button key={c.key} type="button" onClick={c.remove} aria-label={`Quitar filtro ${c.label}`} className="inline-flex min-h-9 items-center gap-1.5 border border-foreground bg-background px-3 font-mono text-[11px] uppercase">
                    {c.label} <X className="h-3.5 w-3.5" />
                  </button>
                ))}
                <button type="button" onClick={clearFilters} className="min-h-9 px-2 text-xs underline">Limpiar todo</button>
              </div>
            )}
            {/* Results Grid (Exact 3.webp Product Card Grid) */}
            {displayedParts.length > 0 ? (
              <>
              <p className="mb-3 text-xs text-muted-foreground sm:hidden">Desliza para ver más · {displayedParts.length} piezas</p>
              <div aria-label="Resultados" className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain px-4 pb-4 sm:mx-0 sm:grid sm:snap-none sm:grid-cols-2 sm:gap-x-6 sm:gap-y-10 sm:overflow-visible sm:px-0 lg:grid-cols-4">
                {displayedParts.map((part) => (
                  <div key={part.id} className="w-[82%] shrink-0 snap-start sm:w-auto">
                  <AurikPartCard
                    key={part.id}
                    part={part}
                    currency={currency}
                    isSaved={savedIds.includes(part.id)}
                    onToggleSave={(id) => void toggleSaveById(id)}
                  />
                  </div>
                ))}
              </div>
              </>
            ) : (
              <div className="border border-border bg-muted p-8 text-center sm:p-12">
                <p className="text-sm font-medium text-foreground">
                  No se han encontrado referencias exactas para esta combinación
                  de filtros.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setOrigin("all");
                      setCategories([]);
                      setStoreFilter("all");
                      setMaxPrice(MAX_PRICE);
                    }}
                    className="aurik-btn-red"
                  >
                    <span>LIMPIAR FILTROS</span>
                    <span>&gt;</span>
                  </button>
                  <button
                    type="button"
                    onClick={resetSearch}
                    className="aurik-btn-gray"
                  >
                    <span>NUEVA BÚSQUEDA</span>
                    <span>&gt;</span>
                  </button>
                </div>
              </div>
            )}
          </section>
        )}
      </main>

      {/* =========================================================
          FILTER MODAL SHEET
         ========================================================= */}
      {showFiltersSheet && (
        <div role="dialog" aria-modal="true" aria-label="Filtros" className="fixed inset-0 z-50 flex items-end justify-end bg-black/50 sm:items-center" onClick={(e) => { if (e.target === e.currentTarget) setShowFiltersSheet(false); }}>
          <div className="flex max-h-[88dvh] w-full flex-col justify-between rounded-t-2xl border-t border-foreground bg-background p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:h-full sm:max-h-none sm:max-w-md sm:rounded-none sm:border-l sm:border-t-0 sm:p-8">
            <div className="overflow-y-auto pr-1">
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border sm:hidden" aria-hidden="true" />
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="aurik-section-tag">
                  <span className="aurik-dot" />
                  <span>FILTROS{activeFilterCount > 0 ? ` · ${activeFilterCount} ACTIVOS` : ""}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFiltersSheet(false)}
                  className="aurik-btn-gray px-2.5 py-1"
                >
                  <span>[X]</span>
                </button>
              </div>

              {/* Origin */}
              <div className="mt-6">
                <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                  01 // ORIGEN DEL COMPONENTE
                </p>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {ORIGINS.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => setOrigin(o.id)}
                      className={
                        origin === o.id
                          ? "aurik-btn-red justify-center"
                          : "aurik-btn-gray justify-center"
                      }
                    >
                      <span>{o.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div className="mt-6">
                <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                  02 // CATEGORÍA DE PIEZA
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {CATEGORIES.map((c) => {
                    const active = categories.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleCategory(c.id)}
                        className={
                          active
                            ? "aurik-btn-red justify-between"
                            : "aurik-btn-gray justify-between"
                        }
                      >
                        <span className="truncate">{c.label}</span>
                        <span>{active ? "●" : "+"}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Store */}
              <div className="mt-6">
                <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                  03 // DISTRIBUIDOR
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setStoreFilter("all")}
                    className={
                      storeFilter === "all" ? "aurik-btn-red" : "aurik-btn-gray"
                    }
                  >
                    <span>TODAS LAS TIENDAS</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStoreFilter("niche-pro")}
                    className={
                      storeFilter === "niche-pro"
                        ? "aurik-btn-red"
                        : "aurik-btn-gray"
                    }
                  >
                    <span>PRO HOROLOGY ({NICHE_PRO_STORES.length})</span>
                  </button>
                </div>
              </div>

              {/* Max Price & Currency */}
              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                    04 // PRECIO MÁXIMO
                  </p>
                  <span className="font-mono text-xs font-semibold text-foreground">
                    {maxPrice} {currency === "EUR" ? "€" : "$"}
                  </span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={MAX_PRICE}
                  step={10}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="mt-3 w-full accent-primary"
                />
              </div>

              {/* Currency */}
              <div className="mt-6">
                <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                  05 // DIVISA
                </p>
                <div className="mt-3 flex gap-2">
                  {(["EUR", "USD"] as const).map((curr) => (
                    <button
                      key={curr}
                      type="button"
                      onClick={() => setCurrency(curr)}
                      className={
                        currency === curr ? "aurik-btn-red" : "aurik-btn-gray"
                      }
                    >
                      <span>{curr}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-2 border-t border-border pt-4">
              <button
                type="button"
                onClick={clearFilters}
                className="aurik-btn-gray flex-1 justify-center py-3"
              >
                <span>LIMPIAR</span>
              </button>
              <RippleButton
                type="button"
                rippleColor="var(--background)"
                onClick={() => {
                  // Let the click ripple play before the panel disappears.
                  window.setTimeout(() => setShowFiltersSheet(false), 260);
                  void executeSearch(query);
                }}
                className="aurik-btn-red flex-1 justify-between rounded-none bg-primary px-[0.95rem] py-3 text-background"
              >
                <span>{hasSearched ? `VER ${displayedParts.length} PIEZAS` : "APLICAR Y BUSCAR"}</span>
                <span>&gt;</span>
              </RippleButton>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

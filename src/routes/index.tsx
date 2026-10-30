import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search, SlidersHorizontal, Trash2, X } from "lucide-react";
import { AnimatedHeroWatch } from "@/components/AnimatedHeroWatch";
import { AurikNavbar } from "@/components/AurikNavbar";
import { AurikPartCard } from "@/components/AurikPartCard";
import { buildChronoPartsHeadMeta } from "@/lib/seo-blog";
import { syncFavoriteToSupabase } from "@/lib/supabase";
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
  const [showWatchbox, setShowWatchbox] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const [savedIds, setSavedIds] = useState<string[]>(["1", "2"]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [searchSources, setSearchSources] = useState<SearchSource[]>([]);
  const requestVersion = useRef(0);
  const [apiResults, setApiResults] = useState<Part[]>([]);
  const [isLoadingApi, setIsLoadingApi] = useState(false);

  const searchSectionRef = useRef<HTMLElement>(null);
  const resultsRef = useRef<HTMLElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const rawFavs = localStorage.getItem("chronoparts_favs");
      if (rawFavs) {
        const parsed = JSON.parse(rawFavs);
        if (Array.isArray(parsed)) setSavedIds(parsed);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

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

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (origin !== "all") count += 1;
    count += categories.length;
    if (storeFilter !== "all") count += 1;
    if (maxPrice < MAX_PRICE) count += 1;
    return count;
  }, [origin, categories, storeFilter, maxPrice]);

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

  const toggleSaveById = (id: string) => {
    const part = allPartsPool.find((p) => p.id === id);
    if (savedIds.includes(id)) {
      const next = savedIds.filter((item) => item !== id);
      setSavedIds(next);
      try {
        localStorage.setItem("chronoparts_favs", JSON.stringify(next));
      } catch {
        // ignore
      }
      if (part) triggerToast(`ELIMINADO DE MI CAJA: ${part.title}`);
      return;
    }

    const next = [...savedIds, id];
    setSavedIds(next);
    try {
      localStorage.setItem("chronoparts_favs", JSON.stringify(next));
    } catch {
      // ignore
    }
    if (part) {
      void syncFavoriteToSupabase({
        id: part.id,
        title: part.title,
        priceEur: part.priceEur,
        store: part.store,
      });
      triggerToast(`GUARDADO EN MI CAJA: ${part.title}`);
    }
  };

  const savedParts = useMemo(
    () => allPartsPool.filter((p) => savedIds.includes(p.id)),
    [allPartsPool, savedIds]
  );

  const toggleCategory = (cat: Category) => {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  return (
    <div className="min-h-screen bg-white text-[#111111]">
      {/* Shared CRONORA Top Bar */}
      <AurikNavbar
        savedCount={savedIds.length}
        onOpenWatchbox={() => setShowWatchbox(true)}
        onFocusSearch={() => {
          searchSectionRef.current?.scrollIntoView({ behavior: "smooth" });
          setTimeout(() => searchInputRef.current?.focus(), 200);
        }}
      />

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-4 left-4 right-4 z-50 border border-[#111111] bg-[#111111] px-4 py-3 font-mono text-xs uppercase tracking-[0.06em] text-white shadow-lg sm:left-auto sm:right-6 sm:max-w-md">
          <span className="mr-2 text-[#e03127]">●</span>
          {toastMsg}
        </div>
      )}

      <main>
        {/* =========================================================
            1. HERO SECTION
           ========================================================= */}
        <section className="mx-auto max-w-[1240px] border-b border-[#e5e5e5] bg-white px-4 pt-10 pb-8 sm:px-8 sm:pt-14 sm:pb-12">
          {/* Main Headline using the special display/stencil font */}
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="aurik-hero-title text-[26px] leading-[1.18] sm:text-[40px] md:text-[46px]">
              BUSCA TUS RECAMBIOS PARA TU RELOJ
              <br className="hidden sm:inline" /> CON UN SOLO CLIC
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
              className="order-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#e03127] text-white transition-transform hover:scale-105 sm:order-1"
            >
              <ChevronDown className="h-5 w-5" strokeWidth={2} />
            </button>

            <p className="order-1 text-sm leading-relaxed text-[#52525b] sm:order-2">
              Encuentra al instante cristales de zafiro, calibres automáticos,
              biseles, agujas, coronas y brazaletes OEM o Aftermarket
              compatibles con tu modelo exacto.
            </p>
          </div>

          {/* Integrated Architectural Macro Watch Stage with 1-Click Part Callouts */}
          <div className="mt-7 sm:mt-9">
            <AnimatedHeroWatch
              onSelectPart={(term) => void executeSearch(term)}
            />
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

            <h2 className="text-xl font-bold tracking-tight text-[#111111] sm:text-3xl">
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
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#71717a]" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={query}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setTimeout(() => setSearchFocused(false), 180)}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ej: Seiko NH35, Rolex 124300, Tissot PRX, ETA 2824..."
                    className="h-13 w-full border border-[#111111] bg-[#f4f4f5] pl-11 pr-10 text-sm text-[#111111] placeholder:text-[#71717a] focus:bg-white focus:outline-none"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      aria-label="Borrar texto"
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#71717a] hover:text-[#111111]"
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

                  <button
                    type="submit"
                    className="aurik-btn-red h-13 flex-1 justify-between px-7 sm:flex-initial"
                  >
                    <span>BUSCAR</span>
                    <span>&gt;</span>
                  </button>
                </div>
              </div>

              {/* Autocomplete Suggestions Dropdown */}
              {searchFocused && autocompleteSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-30 mt-1 border border-[#111111] bg-white shadow-lg">
                  {autocompleteSuggestions.map((sug) => (
                    <button
                      key={`${sug.type}-${sug.label}`}
                      type="button"
                      onMouseDown={() => void executeSearch(sug.queryValue)}
                      className="flex w-full items-center justify-between gap-2 border-b border-[#e5e5e5] px-4 py-3 text-left text-xs text-[#111111] hover:bg-[#f4f4f5] last:border-b-0"
                    >
                      <span className="truncate font-medium">{sug.label}</span>
                      <span className="shrink-0 bg-[#f4f4f5] px-2 py-0.5 font-mono text-[10px] uppercase text-[#e03127]">
                        {sug.type} &gt;
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </form>

            {/* Quick Search Triggers */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#71717a]">
                BÚSQUEDAS RÁPIDAS:
              </span>
              {QUICK_SEARCHES.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => void executeSearch(term)}
                  className="border border-[#e5e5e5] bg-white px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.05em] text-[#111111] transition-colors hover:border-[#111111] hover:bg-[#f4f4f5]"
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
            className="mx-auto max-w-[1440px] border-t border-[#e5e5e5] px-4 py-10 sm:px-8 sm:py-16"
          >
            {/* Results Header Bar */}
            <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[#e5e5e5] pb-6 lg:flex-row lg:items-end">
              <div>
                <div className="aurik-section-tag">
                  <span className="aurik-dot" />
                  <span>
                    RESULTADOS DE BÚSQUEDA // {displayedParts.length} PIEZAS
                    ENCONTRADAS
                  </span>
                </div>
                <h3 className="mt-2 text-xl font-bold tracking-tight text-[#111111] sm:text-2xl">
                  {submittedQuery
                    ? `Resultados para "${submittedQuery}"`
                    : "Catálogo filtrado de recambios"}
                </h3>
                {isLoadingApi && (
                  <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.08em] text-[#e03127]">
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
                  className="h-9 border border-[#e5e5e5] bg-[#f4f4f5] px-3 font-mono text-[11px] uppercase tracking-[0.05em] text-[#111111] focus:border-[#111111] focus:outline-none"
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
            {/* Results Grid (Exact 3.webp Product Card Grid) */}
            {displayedParts.length > 0 ? (
              <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
                {displayedParts.map((part) => (
                  <AurikPartCard
                    key={part.id}
                    part={part}
                    currency={currency}
                    isSaved={savedIds.includes(part.id)}
                    onToggleSave={toggleSaveById}
                  />
                ))}
              </div>
            ) : (
              <div className="border border-[#e5e5e5] bg-[#f4f4f5] p-8 text-center sm:p-12">
                <p className="text-sm font-medium text-[#111111]">
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
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50">
          <div className="flex h-full w-full max-w-md flex-col justify-between border-l border-[#111111] bg-white p-5 sm:p-8">
            <div className="overflow-y-auto pr-1">
              <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-4">
                <div className="aurik-section-tag">
                  <span className="aurik-dot" />
                  <span>FILTROS TÉCNICOS</span>
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
                <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#71717a]">
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
                <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#71717a]">
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
                <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#71717a]">
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
                  <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#71717a]">
                    04 // PRECIO MÁXIMO
                  </p>
                  <span className="font-mono text-xs font-semibold text-[#111111]">
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
                  className="mt-3 w-full accent-[#e03127]"
                />
              </div>

              {/* Currency */}
              <div className="mt-6">
                <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#71717a]">
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

            <div className="mt-6 flex gap-2 border-t border-[#e5e5e5] pt-4">
              <button
                type="button"
                onClick={() => {
                  setOrigin("all");
                  setCategories([]);
                  setStoreFilter("all");
                  setMaxPrice(MAX_PRICE);
                }}
                className="aurik-btn-gray flex-1 justify-center py-3"
              >
                <span>RESETEAR</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowFiltersSheet(false);
                  void executeSearch(query);
                }}
                className="aurik-btn-red flex-1 justify-between py-3"
              >
                <span>APLICAR Y BUSCAR</span>
                <span>&gt;</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          "MI CAJA" SAVED PARTS DRAWER
         ========================================================= */}
      {showWatchbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50">
          <div className="flex h-full w-full max-w-md flex-col justify-between border-l border-[#111111] bg-white p-5 sm:p-8">
            <div className="overflow-y-auto pr-1">
              <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-4">
                <div className="aurik-section-tag">
                  <span className="aurik-dot" />
                  <span>MI CAJA ({savedParts.length} PIEZAS)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWatchbox(false)}
                  className="aurik-btn-gray px-2.5 py-1"
                >
                  <span>[X]</span>
                </button>
              </div>

              {savedParts.length === 0 ? (
                <p className="mt-8 text-xs text-[#71717a]">
                  No tienes piezas guardadas en tu caja de proyecto.
                </p>
              ) : (
                <div className="mt-6 space-y-4">
                  {savedParts.map((part) => {
                    const url =
                      part.customUrl && part.customUrl !== "#"
                        ? part.customUrl
                        : getStoreSearchUrl(part.store, part.title);
                    return (
                      <div
                        key={part.id}
                        className="border border-[#e5e5e5] bg-[#f4f4f5] p-4"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#71717a]">
                              {part.brand} // {part.store}
                            </p>
                            <h4 className="mt-1 text-xs font-semibold text-[#111111]">
                              {part.title}
                            </h4>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleSaveById(part.id)}
                            aria-label="Quitar de Mi Caja"
                            className="shrink-0 p-1 text-[#71717a] hover:text-[#e03127]"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#e5e5e5] pt-3">
                          <span className="font-mono text-xs font-semibold text-[#111111]">
                            {part.priceEur} €
                          </span>
                          <div className="flex items-center gap-1.5">
                            <a
                              href={`https://wa.me/?text=${encodeURIComponent(
                                `🔧 Componente relojero en ChronoParts: ${part.title} (${part.brand}) — ${part.priceEur} € en ${part.store}\n👉 ${url}`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Compartir por WhatsApp"
                              className="border border-[#25D366]/50 bg-[#25D366]/10 px-2 py-1 font-mono text-[10px] font-semibold uppercase text-[#128C7E] hover:bg-[#25D366] hover:text-white"
                            >
                              WHATSAPP
                            </a>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard?.writeText(url);
                                triggerToast("ENLACE COPIADO AL PORTAPAPELES");
                              }}
                              title="Copiar enlace"
                              className="border border-[#d4d4d8] bg-white px-2 py-1 font-mono text-[10px] font-semibold uppercase text-[#111111] hover:border-[#111111]"
                            >
                              LINK
                            </button>
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="aurik-btn-red"
                            >
                              <span>COMPRAR</span>
                              <span>&gt;</span>
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowWatchbox(false)}
              className="aurik-btn-gray mt-4 w-full justify-center py-3"
            >
              <span>CERRAR CAJA</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

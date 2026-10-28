import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  Ruler,
  Droplets,
  Cog,
  Gem,
  ArrowUpRight,
  ArrowDown,
  Truck,
  Heart,
  Bell,
  Scale,
  Sparkles,
  Trash2,
  X,
  ExternalLink,
  Layers,
  Award,
  Wrench,
  Flame,
  BookOpen,
  TrendingUp,
  Clock,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  User,
  RotateCcw,
  Watch,
} from "lucide-react";
import { ExplodedWatch } from "@/components/ExplodedWatch";
import {
  CHOLLO_PLATFORMS,
  DAILY_CHOLLOS,
  fetchLiveChollosFromApi,
  resolveCholloFallbackImage,
  type CholloDeal,
  type CholloPlatform,
} from "@/lib/chollos";
import {
  SEO_BLOG_ARTICLES,
  buildBlogJsonLd,
  buildChronoPartsHeadMeta,
  resolveBlogFallbackImage,
  type BlogArticle,
} from "@/lib/seo-blog";
import {
  syncFavoriteToSupabase,
  syncPriceAlertToSupabase,
} from "@/lib/supabase";
import {
  CATEGORIES,
  MAX_PRICE,
  NICHE_PRO_STORES,
  PARTS,
  WATCH_MODELS,
  fetchLivePartsFromApi,
  filterParts,
  generateLiveComparisonCards,
  getStoreSearchUrl,
  isNicheProStore,
  resolveCategoryImage,
  type Category,
  type Filters,
  type Part,
  type Store,
  type WatchModelSpec,
} from "@/lib/parts";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: buildChronoPartsHeadMeta(),
  }),
  component: Index,
});

const ORIGINS: { id: Filters["origin"]; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "oem", label: "OEM" },
  { id: "generic", label: "Aftermarket" },
];

const QUICK_SEARCHES = [
  "Seiko NH35",
  "Rolex 124300",
  "Tissot PRX",
  "ETA 2824",
];

const WATCH_PREVIEW_IMAGES: Record<WatchModelSpec["id"], string> = {
  "rolex-op41": "/images/hero-rolex-op-pistachio.jpg",
  "omega-speedy": "/models/omega-speedy/dial.png",
  "seiko-skx": "/models/seiko-skx/dial.png",
  "tissot-prx": "/models/tissot-prx/dial.png",
};

const COMMON_PARTS_SHORTCUTS: {
  id: Category;
  title: string;
  subtitle: string;
  savingsCue: string;
  image: string;
}[] = [
  {
    id: "crystals",
    title: "Cristales de zafiro",
    subtitle: "Planos, Double Dome y AR azul",
    savingsCue: "Desde 14 € vs 160 € OEM",
    image: "/parts/crystal-generic.jpg",
  },
  {
    id: "straps",
    title: "Correas y brazaletes",
    subtitle: "Oyster 904L, Jubilee y caucho PRX",
    savingsCue: "Desde 18 € vs 195 € OEM",
    image: "/parts/strap-generic.jpg",
  },
  {
    id: "movements",
    title: "Calibres mecánicos",
    subtitle: "Seiko NH35, ETA 2824-2 y Miyota 9015",
    savingsCue: "Desde 39 € vs 245 € OEM",
    image: "/parts/movement-oem.jpg",
  },
  {
    id: "bezels",
    title: "Biseles y coronas",
    subtitle: "Insertos cerámicos, juntas y tijas",
    savingsCue: "Ahorro medio -72%",
    image: "/parts/bezel-generic.jpg",
  },
];

const PAIR_GROUPS: { id: string; label: string }[] = [
  { id: "oyster-20mm", label: "Brazalete Oyster 20mm" },
  { id: "crystal-124300", label: "Cristal Zafiro Ø31.5mm" },
  { id: "bezel-op41", label: "Bisel 41mm / Cerámico" },
  { id: "movement-auto", label: "Calibres (3230 / ETA / NH35)" },
  { id: "dial-op41", label: "Esfera y Agujas Luminova" },
  { id: "crown-screw", label: "Corona Roscada Hermética" },
  { id: "strap-tissot", label: "Correas Piel / PRX Caucho" },
];

interface PriceAlert {
  partId: string;
  title: string;
  targetEur: number;
}

type SortOption = "savings" | "price-asc" | "price-desc";

function Index() {
  const [selectedModelId, setSelectedModelId] = useState<WatchModelSpec["id"]>("rolex-op41");
  const [query, setQuery] = useState("");
  const [origin, setOrigin] = useState<Filters["origin"]>("all");
  const [categories, setCategories] = useState<Category[]>([]);
  const [maxPrice, setMaxPrice] = useState(MAX_PRICE);
  const [currency, setCurrency] = useState<"EUR" | "USD">("EUR");
  const [storeFilter, setStoreFilter] = useState<"all" | "niche-pro" | Store>("all");
  const [sortBy, setSortBy] = useState<SortOption>("savings");

  // Clean UI panels & interactive states
  const [showFiltersSheet, setShowFiltersSheet] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showWatchbox, setShowWatchbox] = useState(false);
  const [showStickyCompareBar, setShowStickyCompareBar] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const [exploreTab, setExploreTab] = useState<"watches" | "parts">("watches");
  const [activeWatchHotspotLabel, setActiveWatchHotspotLabel] = useState<string | null>(null);

  // Saved parts ("Mi Caja"), alerts & live API state
  const [savedIds, setSavedIds] = useState<string[]>(["1", "2"]);
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [compareGroup, setCompareGroup] = useState<string>("oyster-20mm");
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [apiResults, setApiResults] = useState<Part[]>([]);
  const [isLoadingApi, setIsLoadingApi] = useState(false);

  // Discovery: Chollos de hoy & Guías útiles
  const [cholloPlatform, setCholloPlatform] = useState<"all" | CholloPlatform>("all");
  const [cholloQuery, setCholloQuery] = useState("");
  const [liveChollos, setLiveChollos] = useState<CholloDeal[]>([]);
  const [isScanningChollos, setIsScanningChollos] = useState(false);
  const [activeBlogArticle, setActiveBlogArticle] = useState<BlogArticle | null>(null);

  const searchSectionRef = useRef<HTMLElement>(null);
  const exploreSectionRef = useRef<HTMLElement>(null);
  const resultsRef = useRef<HTMLElement>(null);
  const comparatorRef = useRef<HTMLElement>(null);
  const chollosRef = useRef<HTMLElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const activeModel = useMemo(
    () => (WATCH_MODELS.find((m) => m.id === selectedModelId) ?? WATCH_MODELS[0])!,
    [selectedModelId]
  );

  const dynamicSpecs = useMemo(
    () => [
      { icon: Ruler, k: "Ancho de asas", v: activeModel.lugWidth },
      { icon: Droplets, k: "Hermeticidad", v: activeModel.waterResistance },
      { icon: Cog, k: "Calibre", v: activeModel.movement },
      { icon: Gem, k: "Material", v: activeModel.material },
    ],
    [activeModel]
  );

  useEffect(() => {
    try {
      const rawFavs = localStorage.getItem("chronoparts_favs");
      if (rawFavs) setSavedIds(JSON.parse(rawFavs));
      const rawRecent = localStorage.getItem("chronoparts_recent_searches");
      if (rawRecent) setRecentSearches(JSON.parse(rawRecent));
    } catch {
      // ignore storage errors
    }
  }, []);

  const saveRecentSearch = (term: string) => {
    const clean = term.trim();
    if (clean.length < 2) return;
    setRecentSearches((prev) => {
      const next = [clean, ...prev.filter((item) => item.toLowerCase() !== clean.toLowerCase())].slice(0, 5);
      try {
        localStorage.setItem("chronoparts_recent_searches", JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Live autocomplete suggestions from real data (WATCH_MODELS, calibres, PARTS)
  const searchSuggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const results: { label: string; type: "Modelo" | "Calibre" | "Pieza"; queryValue: string }[] = [];

    for (const m of WATCH_MODELS) {
      if (`${m.brand} ${m.name} ${m.shortName} ${m.ref}`.toLowerCase().includes(q)) {
        results.push({
          label: `${m.brand} ${m.shortName} (${m.ref})`,
          type: "Modelo",
          queryValue: m.searchKeyword,
        });
      }
      if (m.movement.toLowerCase().includes(q)) {
        results.push({
          label: m.movement,
          type: "Calibre",
          queryValue: m.movement.split("/")[0]?.replace("Calibre", "").trim() ?? m.movement,
        });
      }
    }

    for (const p of PARTS) {
      if (results.length >= 6) break;
      if (`${p.title} ${p.brand} ${p.oemRef ?? ""} ${p.compatibleWith.join(" ")}`.toLowerCase().includes(q)) {
        results.push({
          label: p.title,
          type: "Pieza",
          queryValue: p.title,
        });
      }
    }

    const seen = new Set<string>();
    return results
      .filter((item) => {
        const key = item.label.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 6);
  }, [query]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (origin !== "all") count += 1;
    count += categories.length;
    if (storeFilter !== "all") count += 1;
    if (maxPrice < MAX_PRICE) count += 1;
    return count;
  }, [origin, categories, storeFilter, maxPrice]);

  const clearAllFilters = () => {
    setOrigin("all");
    setCategories([]);
    setStoreFilter("all");
    setMaxPrice(MAX_PRICE);
    setQuery("");
    setActiveWatchHotspotLabel(null);
  };

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((cur) => (cur === msg ? null : cur));
    }, 3200);
  };

  const toggleSavePart = (part: Part) => {
    if (savedIds.includes(part.id)) {
      const next = savedIds.filter((id) => id !== part.id);
      setSavedIds(next);
      try {
        localStorage.setItem("chronoparts_favs", JSON.stringify(next));
      } catch {
        // ignore
      }
      triggerToast(`Eliminado de Mi Caja: ${part.title}`);
      return;
    }

    const next = [...savedIds, part.id];
    setSavedIds(next);
    try {
      localStorage.setItem("chronoparts_favs", JSON.stringify(next));
    } catch {
      // ignore
    }
    void syncFavoriteToSupabase({
      id: part.id,
      title: part.title,
      priceEur: part.priceEur,
      store: part.store,
    });
    triggerToast(`Guardado en Mi Caja (${next.length}): ${part.title}`);
  };

  const handleCreateAlert = (part: Part) => {
    const targetEur = Math.round(part.priceEur * 0.85);
    setAlerts((prev) =>
      prev.some((a) => a.partId === part.id)
        ? prev
        : [...prev, { partId: part.id, title: part.title, targetEur }]
    );
    void syncPriceAlertToSupabase({
      partId: part.id,
      title: part.title,
      targetEur,
    });
    triggerToast(`Aviso activado: te notificaremos si baja de ${fmt(targetEur, currency)}.`);
  };

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 3) {
      setApiResults([]);
      setIsLoadingApi(false);
      return;
    }
    let cancelled = false;
    setIsLoadingApi(true);
    const timer = setTimeout(async () => {
      const items = await fetchLivePartsFromApi(trimmed);
      if (!cancelled) {
        setApiResults(items);
        setIsLoadingApi(false);
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const catalogMatches = useMemo(
    () => filterParts(PARTS, { query, origin, categories, maxPrice }),
    [query, origin, categories, maxPrice]
  );

  const liveGenerated = useMemo(() => {
    if (query.trim().length < 3) return [];
    const baseCards = apiResults.length > 0 ? apiResults : generateLiveComparisonCards(query);
    return filterParts(baseCards, { query: "", origin, categories: [], maxPrice });
  }, [query, apiResults, origin, maxPrice]);

  const allPartsPool = useMemo(() => [...PARTS, ...liveGenerated], [liveGenerated]);

  // Map cheapest OEM & Generic prices per pairGroupId so each card can show its exact counterpart price
  const groupPriceSummary = useMemo(() => {
    const map: Record<string, { oemMin?: number; genericMin?: number }> = {};
    for (const p of allPartsPool) {
      if (!p.pairGroupId) continue;
      const entry = (map[p.pairGroupId] ??= {});
      if (p.origin === "oem") {
        entry.oemMin = Math.min(entry.oemMin ?? Infinity, p.priceEur);
      } else {
        entry.genericMin = Math.min(entry.genericMin ?? Infinity, p.priceEur);
      }
    }
    return map;
  }, [allPartsPool]);

  const displayedParts = useMemo(() => {
    let base = catalogMatches;
    if (query.trim().length >= 3) {
      const ids = new Set(catalogMatches.map((p) => p.id));
      base = [...catalogMatches, ...liveGenerated.filter((p) => !ids.has(p.id))];
    }
    if (storeFilter === "niche-pro") {
      base = base.filter((p) => isNicheProStore(p.store));
    } else if (storeFilter !== "all") {
      base = base.filter((p) => p.store === storeFilter);
    }

    const sorted = [...base];
    if (sortBy === "price-asc") {
      sorted.sort((a, b) => a.priceEur - b.priceEur);
    } else if (sortBy === "price-desc") {
      sorted.sort((a, b) => b.priceEur - a.priceEur);
    } else {
      sorted.sort((a, b) => {
        const refA = a.equivalentOemPriceEur ?? (a.pairGroupId ? groupPriceSummary[a.pairGroupId]?.oemMin : undefined);
        const refB = b.equivalentOemPriceEur ?? (b.pairGroupId ? groupPriceSummary[b.pairGroupId]?.oemMin : undefined);
        const savA = a.origin === "generic" && refA && refA > a.priceEur ? (refA - a.priceEur) / refA : 0;
        const savB = b.origin === "generic" && refB && refB > b.priceEur ? (refB - b.priceEur) / refB : 0;
        return savB - savA;
      });
    }
    return sorted;
  }, [query, catalogMatches, liveGenerated, storeFilter, sortBy, groupPriceSummary]);

  const savedParts = useMemo(
    () => allPartsPool.filter((p) => savedIds.includes(p.id)),
    [allPartsPool, savedIds]
  );

  const comparedParts = useMemo(() => {
    if (!compareGroup) return [];
    return allPartsPool.filter((p) => p.pairGroupId === compareGroup);
  }, [allPartsPool, compareGroup]);

  const selectFromWatch = (cats: Category[], label?: string) => {
    setCategories(cats);
    if (label) {
      setActiveWatchHotspotLabel(`${activeModel.shortName} · ${label}`);
      triggerToast(`${activeModel.shortName}: mostrando ${label.toLowerCase()} compatibles`);
    }
    resultsRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const toggleCat = (c: Category) =>
    setCategories((cur) => (cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c]));

  const runExtendedSearch = async (term: string) => {
    const clean = term.trim();
    if (!clean) {
      resultsRef.current?.scrollIntoView({ behavior: "smooth" });
      searchInputRef.current?.focus();
      return;
    }
    saveRecentSearch(clean);
    setSearchFocused(false);
    setQuery(clean);
    setIsLoadingApi(true);
    const liveItems = await fetchLivePartsFromApi(clean);
    setApiResults(liveItems);
    setIsLoadingApi(false);
    resultsRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const applyQuickSuggestion = (term: string) => {
    void runExtendedSearch(term);
  };

  const openComparatorFor = (groupId: string) => {
    setCompareGroup(groupId);
    setShowStickyCompareBar(true);
    const groupLabel = PAIR_GROUPS.find((pg) => pg.id === groupId)?.label ?? groupId;
    triggerToast(`Comparando: ${groupLabel} (OEM vs Aftermarket)`);
  };

  const displayedChollos = useMemo(() => {
    const merged = [...liveChollos, ...DAILY_CHOLLOS];
    const filteredByPlatform =
      cholloPlatform === "all" ? merged : merged.filter((c) => c.platform === cholloPlatform);
    const trimmed = cholloQuery.trim().toLowerCase();
    if (!trimmed) return filteredByPlatform.slice(0, 4);
    return filteredByPlatform
      .filter((c) =>
        `${c.title} ${c.brand} ${c.calibreRef ?? ""} ${c.platform} ${c.aiVerdict}`.toLowerCase().includes(trimmed)
      )
      .slice(0, 4);
  }, [liveChollos, cholloPlatform, cholloQuery]);

  const runLiveCholloScan = async (customTerm?: string) => {
    const q = (customTerm ?? cholloQuery).trim() || "Seiko vintage Omega Tissot";
    setIsScanningChollos(true);
    const scanned = await fetchLiveChollosFromApi(q);
    setIsScanningChollos(false);
    if (scanned.length > 0) {
      setLiveChollos(scanned);
      triggerToast(`${scanned.length} chollos actualizados para "${q}".`);
    } else {
      triggerToast(`Mostrando selección de chollos de hoy para "${q}".`);
    }
    chollosRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const totalSavedEur = savedParts.reduce((acc, p) => acc + p.priceEur, 0);
  const totalSavedOemEquivEur = savedParts.reduce(
    (acc, p) => acc + (p.equivalentOemPriceEur ?? p.priceEur),
    0
  );

  return (
    <div className="min-h-screen bg-[#ffffff] text-[#1d1d1f]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildBlogJsonLd()) }}
      />
      {/* Toast Notification (Apple Floating Pill) */}
      {toastMsg && (
        <div className="fixed bottom-5 left-1/2 z-50 flex w-[92vw] max-w-md -translate-x-1/2 items-center justify-between gap-3 rounded-full bg-[#1d1d1f] px-5 py-3 text-[14px] font-normal text-[#ffffff] sm:w-auto">
          <Sparkles className="h-4 w-4 shrink-0 text-[#2997ff]" />
          <span className="truncate">{toastMsg}</span>
          <button onClick={() => setToastMsg(null)} className="shrink-0 opacity-70 hover:opacity-100">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* 1. GLOBAL NAV (DESIGN_apple.md: background #000000, height 44px, text #ffffff in 12px/400/-0.12px) */}
      <nav
        id="top"
        aria-label="Navegación global"
        className="sticky top-0 z-50 h-[44px] w-full bg-[#000000] text-[#ffffff]"
      >
        <div className="mx-auto flex h-full max-w-[1024px] items-center justify-between px-4 sm:px-6">
          <a
            href="#top"
            className="apple-nav-link text-[14px] font-semibold tracking-[-0.22px] text-[#ffffff] transition-opacity hover:opacity-85"
          >
            ChronoParts
          </a>

          <div className="flex items-center gap-5 sm:gap-8">
            <a
              href="#search"
              className="apple-nav-link text-[#ffffff]/90 transition-opacity hover:text-[#ffffff]"
            >
              Buscar
            </a>
            <a
              href="#chollos"
              className="apple-nav-link text-[#ffffff]/90 transition-opacity hover:text-[#ffffff]"
            >
              Chollos
            </a>
            <Link
              to="/marketplace"
              className="apple-nav-link inline-flex items-center gap-1.5 text-[#ffffff]/90 transition-opacity hover:text-[#ffffff]"
              title="Marketplace de relojes completos"
            >
              <span>Marketplace</span>
              <span className="rounded-full bg-[#272729] px-2 py-0.5 text-[10px] font-normal text-[#2997ff]">
                Próximamente
              </span>
            </Link>
          </div>

          {/* Icono único de Perfil (Mi Caja + Cuenta) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowAccountMenu((v) => !v)}
              aria-expanded={showAccountMenu}
              aria-label="Abrir Mi Caja y menú de perfil"
              className="relative flex h-[32px] items-center gap-1.5 rounded-[8px] bg-[#1d1d1f] px-3 text-[12px] font-normal text-[#ffffff] transition-transform active:scale-95"
            >
              <User className="h-3.5 w-3.5 text-[#ffffff]" />
              <span className="hidden sm:inline">Mi Caja</span>
              {savedIds.length > 0 && (
                <span className="grid h-4 min-w-[16px] place-items-center rounded-full bg-[#0066cc] px-1 text-[10px] font-semibold text-[#ffffff]">
                  {savedIds.length}
                </span>
              )}
            </button>

            {showAccountMenu && (
              <div className="absolute right-0 top-10 z-50 w-64 rounded-[18px] border border-[#e0e0e0] bg-[#ffffff] p-3 text-[#1d1d1f]">
                <div className="border-b border-[#f0f0f0] pb-2.5 px-2">
                  <p className="apple-fine-print uppercase text-[#7a7a7a]">
                    Mi espacio
                  </p>
                  <p className="apple-caption-strong mt-1 text-[#1d1d1f]">
                    Piezas guardadas y accesos
                  </p>
                </div>
                <div className="mt-2 space-y-1 text-[14px]">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAccountMenu(false);
                      setShowWatchbox(true);
                    }}
                    className="flex w-full items-center justify-between rounded-[11px] px-3 py-2 text-left text-[#1d1d1f] transition hover:bg-[#f5f5f7]"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Heart className="h-3.5 w-3.5 text-[#0066cc]" />
                      <span>Mi Caja de piezas</span>
                    </span>
                    <span className="rounded-full bg-[#f5f5f7] px-2 py-0.5 text-[12px] font-semibold text-[#1d1d1f]">
                      {savedIds.length}
                    </span>
                  </button>
                  <Link
                    to="/marketplace"
                    onClick={() => setShowAccountMenu(false)}
                    className="flex w-full items-center justify-between rounded-[11px] px-3 py-2 text-[#1d1d1f] transition hover:bg-[#f5f5f7]"
                  >
                    <span>Marketplace</span>
                    <span className="rounded-full bg-[#f5f5f7] px-2 py-0.5 text-[10px] font-semibold text-[#0066cc]">
                      Próximamente
                    </span>
                  </Link>
                  <Link
                    to="/vender"
                    onClick={() => setShowAccountMenu(false)}
                    className="block rounded-[11px] px-3 py-2 text-[#1d1d1f] transition hover:bg-[#f5f5f7]"
                  >
                    Publicar reloj (/vender)
                  </Link>
                  <Link
                    to="/mis-anuncios"
                    onClick={() => setShowAccountMenu(false)}
                    className="block rounded-[11px] px-3 py-2 text-[#1d1d1f] transition hover:bg-[#f5f5f7]"
                  >
                    Mis anuncios (/mis-anuncios)
                  </Link>
                  <Link
                    to="/favoritos"
                    onClick={() => setShowAccountMenu(false)}
                    className="block rounded-[11px] px-3 py-2 text-[#1d1d1f] transition hover:bg-[#f5f5f7]"
                  >
                    Relojes favoritos (/favoritos)
                  </Link>
                  <Link
                    to="/mensajes"
                    onClick={() => setShowAccountMenu(false)}
                    className="block rounded-[11px] px-3 py-2 text-[#1d1d1f] transition hover:bg-[#f5f5f7]"
                  >
                    Mensajes (/mensajes)
                  </Link>
                  <Link
                    to="/blog"
                    onClick={() => setShowAccountMenu(false)}
                    className="block rounded-[11px] px-3 py-2 text-[#1d1d1f] transition hover:bg-[#f5f5f7]"
                  >
                    Guías útiles (/blog)
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* 2. SUB-NAV FROSTED (DESIGN_apple.md: #f5f5f7 at 80% + backdrop-filter blur, height 52px, 1px rgba(0,0,0,0.08)) */}
      <div className="sticky top-[44px] z-40 h-[52px] w-full border-b border-[rgba(0,0,0,0.08)] apple-frosted">
        <div className="mx-auto flex h-full max-w-[1024px] items-center justify-between px-4 sm:px-6">
          <span className="apple-tagline text-[19px] sm:text-[21px] text-[#1d1d1f]">
            Recambios y Calibres
          </span>
          <div className="flex items-center gap-4">
            <a
              href="#explorar"
              className="hidden text-[14px] font-normal tracking-[-0.224px] text-[#1d1d1f]/80 hover:text-[#0066cc] sm:inline"
            >
              Esquema 3D
            </a>
            <a
              href="#comparator"
              className="hidden text-[14px] font-normal tracking-[-0.224px] text-[#1d1d1f]/80 hover:text-[#0066cc] sm:inline"
            >
              OEM vs Aftermarket
            </a>
            <a
              href="#search"
              onClick={(e) => {
                e.preventDefault();
                searchSectionRef.current?.scrollIntoView({ behavior: "smooth" });
                setTimeout(() => searchInputRef.current?.focus(), 200);
              }}
              className="inline-flex items-center justify-center rounded-full bg-[#0066cc] px-[16px] py-[6px] text-[12px] font-normal text-[#ffffff] transition-transform active:scale-95 focus:outline-2 focus:outline-[#0071e3]"
            >
              Buscar recambios
            </a>
          </div>
        </div>
      </div>

      {/* 3. HERO — PRODUCT TILE LIGHT (DESIGN_apple.md: Pure White #ffffff, NO gradients, rounded-none, 80px desktop / 48px mobile padding) */}
      <header className="w-full rounded-none bg-[#ffffff] py-[48px] lg:py-[80px]">
        <div className="mx-auto grid max-w-[1068px] items-center gap-10 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
          <div>
            <p className="apple-tagline text-[19px] sm:text-[21px] text-[#0066cc]">
              ChronoParts · OEM y Aftermarket
            </p>

            <h1 className="apple-hero-display mt-2 text-[34px] text-[#1d1d1f] sm:text-[44px] lg:text-[56px]">
              Encuentra el recambio exacto para tu reloj.
            </h1>

            <p className="apple-lead mt-4 max-w-lg text-[21px] sm:text-[24px] text-[#7a7a7a]">
              Compara piezas originales y alternativas compatibles por modelo, referencia o calibre.
            </p>

            {/* Two Apple Pill CTAs: button-primary (#0066cc) & button-secondary-pill (1px solid #0066cc) */}
            <div className="mt-7 flex flex-wrap items-center gap-3.5">
              <a
                href="#search"
                onClick={(e) => {
                  e.preventDefault();
                  searchSectionRef.current?.scrollIntoView({ behavior: "smooth" });
                  setTimeout(() => searchInputRef.current?.focus(), 250);
                }}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-[#0066cc] px-[22px] py-[11px] text-[17px] font-normal tracking-[-0.374px] text-[#ffffff] transition-transform active:scale-95 focus:outline-2 focus:outline-[#0071e3]"
              >
                <span>Buscar recambios</span>
                <ArrowDown className="h-4 w-4" />
              </a>
              <a
                href="#explorar"
                className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-[#0066cc] bg-[#ffffff] px-[22px] py-[11px] text-[17px] font-normal tracking-[-0.374px] text-[#0066cc] transition-transform active:scale-95 focus:outline-2 focus:outline-[#0071e3]"
              >
                Ver despiece 3D
              </a>
            </div>
          </div>

          {/* Product Render resting on Pure White surface with the ONLY allowed system drop-shadow */}
          <div className="mx-auto flex w-full max-w-[340px] flex-col items-center sm:max-w-[420px] lg:max-w-[460px]">
            <img
              src="/images/hero-rolex-op-pistachio.jpg"
              alt="Reloj mecánico protagonista en ChronoParts"
              className="aspect-[4/3] w-full rounded-[18px] object-cover shadow-product"
            />
            <div className="mt-5 flex w-full items-center justify-between px-1">
              <div>
                <p className="apple-body-strong text-[#1d1d1f]">
                  {activeModel.brand} {activeModel.shortName}
                </p>
                <p className="apple-caption text-[#7a7a7a]">
                  Ref. {activeModel.ref} · {activeModel.movement}
                </p>
              </div>
              <a
                href="#explorar"
                className="apple-caption text-[#0066cc] hover:underline"
              >
                Explorar piezas →
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* 2. PRODUCT TILE PARCHMENT: BUSCADOR DE RECAMBIOS (#f5f5f7) */}
      <section
        id="search"
        ref={searchSectionRef}
        className="w-full scroll-mt-14 bg-[#f5f5f7] px-[22px] py-[48px] lg:py-[80px]"
      >
        <div className="mx-auto max-w-[980px]">
          <div className="mb-8 flex flex-col items-center text-center">
            <h2 className="apple-display-lg text-[32px] text-[#1d1d1f] sm:text-[40px]">
              Encuentra cada pieza con precisión.
            </h2>
            <p className="apple-tagline mt-2 max-w-[600px] text-[19px] text-[#7a7a7a] sm:text-[21px]">
              Busca por referencia de reloj, calibre mecánico o componente específico.
            </p>
          </div>

          <div className="rounded-[18px] border border-[#e0e0e0] bg-[#ffffff] p-[24px]">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <span className="apple-caption font-semibold text-[#1d1d1f]">
                Búsqueda directa en catálogos verificados
              </span>
              <button
                type="button"
                onClick={() => setShowFiltersSheet(true)}
                className="inline-flex min-h-[36px] items-center gap-2 rounded-full border border-[#e0e0e0] bg-[#f5f5f7] px-4 py-1.5 text-[14px] font-normal text-[#1d1d1f] transition hover:border-[#0071e3]"
              >
                <SlidersHorizontal className="h-3.5 w-3.5 text-[#0066cc]" />
                <span>Filtros</span>
                {activeFilterCount > 0 && (
                  <span className="rounded-full bg-[#0066cc] px-2 py-0.5 text-[11px] font-semibold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            {/* Campo principal Apple Search Input Pill */}
            <div className="relative">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex h-[48px] flex-1 items-center gap-3 rounded-full border border-[rgba(0,0,0,0.12)] bg-[#f5f5f7] px-[20px] transition focus-within:border-[#0071e3] focus-within:bg-[#ffffff] focus-within:ring-2 focus-within:ring-[#0071e3]/25">
                  <Search className="h-4 w-4 shrink-0 text-[#7a7a7a]" />
                  <input
                    ref={searchInputRef}
                    value={query}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setTimeout(() => setSearchFocused(false), 180)}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        setSearchFocused(false);
                        void runExtendedSearch(query);
                      }
                    }}
                    placeholder="Busca por modelo, calibre o pieza (ej. NH35, SKX007, cristal zafiro)"
                    aria-label="Busca por modelo, calibre o pieza"
                    className="min-w-0 flex-1 bg-transparent text-[17px] text-[#1d1d1f] outline-none placeholder:text-[#7a7a7a]"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      className="rounded-full bg-[#e0e0e0]/60 px-2.5 py-0.5 text-[12px] text-[#1d1d1f] hover:bg-[#e0e0e0]"
                    >
                      Limpiar
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSearchFocused(false);
                    void runExtendedSearch(query);
                  }}
                  className="inline-flex h-[48px] items-center justify-center gap-2 rounded-full bg-[#0066cc] px-[24px] text-[17px] font-normal text-white transition hover:bg-[#0071e3]"
                >
                  <Search className="h-4 w-4" />
                  <span>Buscar</span>
                </button>
              </div>

              {/* Sugerencias en vivo y búsquedas recientes */}
              {searchFocused && (searchSuggestions.length > 0 || recentSearches.length > 0) && (
                <div className="absolute left-0 right-0 top-full z-30 mt-2 rounded-[18px] border border-[#e0e0e0] bg-[#ffffff] p-4">
                  {recentSearches.length > 0 && !query.trim() && (
                    <div className="mb-3">
                      <p className="px-2 text-[12px] font-semibold text-[#7a7a7a]">
                        Búsquedas recientes
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5 px-1">
                        {recentSearches.map((recent) => (
                          <button
                            key={recent}
                            type="button"
                            onMouseDown={() => applyQuickSuggestion(recent)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-[#e0e0e0] bg-[#f5f5f7] px-3 py-1 text-[12px] text-[#1d1d1f] hover:border-[#0071e3] hover:text-[#0066cc]"
                          >
                            <Clock className="h-3 w-3 text-[#7a7a7a]" />
                            <span>{recent}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="px-2 text-[12px] font-semibold text-[#7a7a7a]">
                    Sugerencias rápidas
                  </p>
                  <div className="mt-1 grid gap-1 sm:grid-cols-2">
                    {searchSuggestions.map((s) => (
                      <button
                        key={`${s.type}-${s.queryValue}`}
                        type="button"
                        onMouseDown={() => applyQuickSuggestion(s.queryValue)}
                        className="flex items-center justify-between rounded-[12px] px-3 py-2 text-left text-[14px] transition hover:bg-[#f5f5f7]"
                      >
                        <div>
                          <p className="font-semibold text-[#1d1d1f]">{s.label}</p>
                          <p className="text-[12px] text-[#7a7a7a]">{s.type}</p>
                        </div>
                        <ArrowUpRight className="h-3.5 w-3.5 text-[#0066cc]" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Accesos rápidos */}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#e0e0e0] pt-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="apple-caption text-[#7a7a7a]">Empezar por:</span>
                <a
                  href="#explorar"
                  onClick={() => setExploreTab("watches")}
                  className="inline-flex items-center gap-2 rounded-full border border-[#e0e0e0] bg-[#ffffff] px-4 py-1.5 text-[14px] text-[#1d1d1f] transition hover:border-[#0071e3] hover:text-[#0066cc]"
                >
                  <Watch className="h-3.5 w-3.5 text-[#0066cc]" />
                  <span>Elegir mi reloj</span>
                </a>
                <a
                  href="#explorar"
                  onClick={() => setExploreTab("parts")}
                  className="inline-flex items-center gap-2 rounded-full border border-[#e0e0e0] bg-[#ffffff] px-4 py-1.5 text-[14px] text-[#1d1d1f] transition hover:border-[#0071e3] hover:text-[#0066cc]"
                >
                  <Layers className="h-3.5 w-3.5 text-[#0066cc]" />
                  <span>Buscar una pieza</span>
                </a>
                <a
                  href="#chollos"
                  className="inline-flex items-center gap-2 rounded-full border border-[#e0e0e0] bg-[#ffffff] px-4 py-1.5 text-[14px] text-[#1d1d1f] transition hover:border-[#0071e3] hover:text-[#0066cc]"
                >
                  <Flame className="h-3.5 w-3.5 text-[#0066cc]" />
                  <span>Ver chollos</span>
                </a>
              </div>

              {recentSearches.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[12px] text-[#7a7a7a]">Recientes:</span>
                  {recentSearches.slice(0, 3).map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => applyQuickSuggestion(term)}
                      className="rounded-full bg-[#f5f5f7] px-3 py-1 text-[12px] text-[#1d1d1f] transition hover:text-[#0066cc]"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Etiquetas de filtros activos */}
            {(activeFilterCount > 0 || query.trim().length > 0) && (
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#e0e0e0] pt-3">
                <span className="text-[12px] font-semibold text-[#7a7a7a]">Activos:</span>
                {query.trim().length > 0 && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#0071e3] bg-[#f5f5f7] px-3 py-1 text-[12px] font-semibold text-[#1d1d1f]"
                  >
                    <span>"{query}"</span>
                    <X className="h-3 w-3" />
                  </button>
                )}
                {origin !== "all" && (
                  <button
                    type="button"
                    onClick={() => setOrigin("all")}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#0071e3] bg-[#f5f5f7] px-3 py-1 text-[12px] font-semibold text-[#1d1d1f]"
                  >
                    <span>{origin === "oem" ? "OEM" : "Aftermarket"}</span>
                    <X className="h-3 w-3" />
                  </button>
                )}
                {categories.map((catId) => {
                  const catObj = CATEGORIES.find((c) => c.id === catId);
                  return (
                    <button
                      key={catId}
                      type="button"
                      onClick={() => toggleCat(catId)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#0071e3] bg-[#f5f5f7] px-3 py-1 text-[12px] font-semibold text-[#1d1d1f]"
                    >
                      <span>{catObj?.labelEs ?? catId}</span>
                      <X className="h-3 w-3" />
                    </button>
                  );
                })}
                {storeFilter !== "all" && (
                  <button
                    type="button"
                    onClick={() => setStoreFilter("all")}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#0071e3] bg-[#f5f5f7] px-3 py-1 text-[12px] font-semibold text-[#1d1d1f]"
                  >
                    <span>{storeFilter === "niche-pro" ? "Especialistas" : storeFilter}</span>
                    <X className="h-3 w-3" />
                  </button>
                )}
                {maxPrice < MAX_PRICE && (
                  <button
                    type="button"
                    onClick={() => setMaxPrice(MAX_PRICE)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#0071e3] bg-[#f5f5f7] px-3 py-1 text-[12px] font-semibold text-[#1d1d1f]"
                  >
                    <span>Máx. {fmt(maxPrice, currency)}</span>
                    <X className="h-3 w-3" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="inline-flex items-center gap-1 px-2 py-1 text-[12px] text-[#0066cc] hover:underline"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Limpiar todo</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3. PRODUCT TILE DARK: EXPLORAR POR RELOJ O PIEZA (#272729) */}
      <section
        id="explorar"
        className="w-full scroll-mt-14 bg-[#272729] px-[22px] py-[48px] text-[#ffffff] lg:py-[80px]"
      >
        <div className="mx-auto max-w-[980px]">
          <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:items-end sm:text-left">
            <div>
              <p className="apple-caption font-semibold text-[#2997ff]">
                Ingeniería interactiva
              </p>
              <h2 className="apple-display-lg mt-1 text-[32px] text-[#ffffff] sm:text-[40px]">
                Explora por reloj o toca una pieza en el esquema.
              </h2>
            </div>
            <div className="inline-flex rounded-full border border-white/15 bg-[#2a2a2c] p-1">
              <button
                type="button"
                onClick={() => setExploreTab("watches")}
                className={`rounded-full px-4 py-1.5 text-[14px] font-normal transition ${
                  exploreTab === "watches"
                    ? "bg-[#0066cc] text-[#ffffff]"
                    : "text-[#cccccc] hover:text-[#ffffff]"
                }`}
              >
                Relojes populares
              </button>
              <button
                type="button"
                onClick={() => setExploreTab("parts")}
                className={`rounded-full px-4 py-1.5 text-[14px] font-normal transition ${
                  exploreTab === "parts"
                    ? "bg-[#0066cc] text-[#ffffff]"
                    : "text-[#cccccc] hover:text-[#ffffff]"
                }`}
              >
                Piezas comunes
              </button>
            </div>
          </div>

          {/* Selector horizontal de relojes populares o piezas comunes */}
          {exploreTab === "watches" ? (
            <div className="mt-8 flex gap-3 overflow-x-auto pb-2">
              {WATCH_MODELS.map((w) => {
                const isSelected = selectedModelId === w.id;
                const imgUrl = WATCH_PREVIEW_IMAGES[w.id] ?? WATCH_PREVIEW_IMAGES["rolex-op41"];
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => {
                      setSelectedModelId(w.id);
                      setActiveWatchHotspotLabel(null);
                    }}
                    className={`group flex min-w-[240px] shrink-0 items-center gap-3.5 rounded-[18px] p-3.5 text-left transition ${
                      isSelected
                        ? "border-2 border-[#0071e3] bg-[#2a2a2c]"
                        : "border border-white/12 bg-[#2a2a2c]/70 hover:border-white/30 hover:bg-[#2a2a2c]"
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={`${w.brand} ${w.name}`}
                      className="h-14 w-14 shrink-0 rounded-[8px] object-cover"
                      loading="lazy"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-[12px] font-semibold text-[#2997ff]">
                        {w.brand} · {w.movement}
                      </span>
                      <p className="truncate text-[17px] font-semibold text-[#ffffff]">
                        {w.name}
                      </p>
                      <p className="text-[12px] text-[#cccccc]">Ref. {w.ref} · {w.lugWidth}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {COMMON_PARTS_SHORTCUTS.map((item) => {
                const active = categories.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setCategories([item.id]);
                      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                    className={`group overflow-hidden rounded-[18px] bg-[#2a2a2c] text-left transition ${
                      active
                        ? "border-2 border-[#0071e3]"
                        : "border border-white/12 hover:border-white/30"
                    }`}
                  >
                    <div className="aspect-[16/10] overflow-hidden bg-[#252527]">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-4">
                      <p className="text-[14px] font-semibold text-[#ffffff]">{item.title}</p>
                      <p className="mt-0.5 text-[12px] text-[#cccccc]">{item.subtitle}</p>
                      <p className="mt-1.5 text-[12px] text-[#2997ff]">{item.savingsCue}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Esquema interactivo del reloj seleccionado */}
          <div className="mt-6">
            <ExplodedWatch
              selected={categories}
              model={activeModel}
              onSelect={(cats, label) => {
                selectFromWatch(cats, label);
              }}
            />
          </div>
        </div>
      </section>

      {/* 4. PRODUCT TILE LIGHT: RESULTADOS DE RECAMBIOS (#ffffff) */}
      <section
        id="resultados"
        ref={resultsRef}
        className="w-full scroll-mt-14 bg-[#ffffff] px-[22px] py-[48px] lg:py-[80px]"
      >
        <div className="mx-auto max-w-[980px]">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e0e0e0] pb-6">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="apple-display-lg text-[28px] text-[#1d1d1f] sm:text-[34px]">
                {displayedParts.length}{" "}
                {displayedParts.length === 1 ? "recambio compatible" : "recambios compatibles"}
              </h2>
              {activeWatchHotspotLabel ? (
                <span className="rounded-full bg-[#f5f5f7] px-3.5 py-1 text-[12px] font-semibold text-[#0066cc]">
                  {activeWatchHotspotLabel}
                </span>
              ) : (
                <span className="rounded-full bg-[#f5f5f7] px-3.5 py-1 text-[12px] font-semibold text-[#0066cc]">
                  Esquema: {activeModel.brand} {activeModel.shortName}
                </span>
              )}
              {isLoadingApi && (
                <span className="rounded-full bg-[#f5f5f7] px-3 py-1 text-[12px] text-[#7a7a7a]">
                  Buscando ofertas...
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-[14px]">
              <label htmlFor="sort-parts-select" className="text-[#7a7a7a]">
                Ordenar:
              </label>
              <select
                id="sort-parts-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="rounded-full border border-[#e0e0e0] bg-[#ffffff] px-4 py-1.5 text-[14px] text-[#1d1d1f] outline-none focus:border-[#0071e3]"
              >
                <option value="savings">Mayor ahorro y relevancia</option>
                <option value="price-asc">Precio: menor a mayor</option>
                <option value="price-desc">Precio: mayor a menor</option>
              </select>
            </div>
          </div>

          {/* Results Grid (Apple Store Utility Cards) */}
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {displayedParts.map((p) => {
              const pairPrices = p.pairGroupId ? groupPriceSummary[p.pairGroupId] : undefined;
              return (
                <PartCard
                  key={p.id}
                  p={p}
                  currency={currency}
                  isSaved={savedIds.includes(p.id)}
                  isSelectedForCompare={Boolean(p.pairGroupId && p.pairGroupId === compareGroup && showStickyCompareBar)}
                  oemCounterpartEur={pairPrices?.oemMin}
                  onToggleSave={() => toggleSavePart(p)}
                  onCompare={p.pairGroupId ? () => openComparatorFor(p.pairGroupId!) : undefined}
                  onCreateAlert={() => handleCreateAlert(p)}
                />
              );
            })}
            {displayedParts.length === 0 && (
              <div className="col-span-full rounded-[18px] border border-[#e0e0e0] bg-[#f5f5f7] p-12 text-center">
                <p className="apple-lead text-[#1d1d1f]">
                  No hemos encontrado piezas con esos filtros.
                </p>
                <p className="apple-caption mt-2 text-[#7a7a7a]">
                  Prueba a limpiar los filtros o buscar otro modelo o calibre.
                </p>
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#0066cc] px-[22px] py-[11px] text-[14px] text-white hover:bg-[#0071e3]"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Mostrar todas las piezas
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* PANEL DE FILTROS AVANZADOS */}
      {showFiltersSheet && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50 backdrop-blur-xs sm:items-center sm:justify-center sm:p-4">
          <div className="max-h-[86vh] w-full overflow-y-auto rounded-t-[18px] border border-[#e0e0e0] bg-[#ffffff] p-6 sm:max-w-lg sm:rounded-[18px]">
            <div className="flex items-center justify-between border-b border-[#e0e0e0] pb-4">
              <div>
                <h3 className="apple-lead text-[#1d1d1f]">Filtros</h3>
                <p className="text-[12px] text-[#7a7a7a]">
                  {displayedParts.length} resultados disponibles
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowFiltersSheet(false)}
                aria-label="Cerrar filtros"
                className="rounded-full bg-[#f5f5f7] p-2 text-[#1d1d1f] hover:bg-[#e0e0e0]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 space-y-5">
              {/* Origin */}
              <div>
                <p className="text-[12px] font-semibold text-[#7a7a7a]">
                  Tipo de recambio
                </p>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {ORIGINS.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => setOrigin(o.id)}
                      className={`min-h-[42px] rounded-[12px] px-3 py-2 text-[14px] transition ${
                        origin === o.id
                          ? "border-2 border-[#0071e3] bg-[#f5f5f7] font-semibold text-[#1d1d1f]"
                          : "border border-[#e0e0e0] bg-[#ffffff] text-[#1d1d1f]"
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div>
                <p className="text-[12px] font-semibold text-[#7a7a7a]">
                  Categoría de pieza
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => {
                    const active = categories.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleCat(c.id)}
                        className={`min-h-[40px] rounded-[12px] px-3.5 py-1.5 text-[14px] transition ${
                          active
                            ? "border-2 border-[#0071e3] bg-[#f5f5f7] font-semibold text-[#1d1d1f]"
                            : "border border-[#e0e0e0] bg-[#ffffff] text-[#1d1d1f]"
                        }`}
                      >
                        {c.labelEs}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Store */}
              <div>
                <p className="text-[12px] font-semibold text-[#7a7a7a]">
                  Tienda
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setStoreFilter("all")}
                    className={`min-h-[38px] rounded-[12px] px-3.5 py-1.5 text-[14px] ${
                      storeFilter === "all"
                        ? "border-2 border-[#0071e3] bg-[#f5f5f7] font-semibold text-[#1d1d1f]"
                        : "border border-[#e0e0e0] bg-[#ffffff] text-[#1d1d1f]"
                    }`}
                  >
                    Todas
                  </button>
                  {(["eBay", "AliExpress", "Chrono24", ...NICHE_PRO_STORES] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStoreFilter(storeFilter === st ? "all" : st)}
                      className={`min-h-[38px] rounded-[12px] px-3.5 py-1.5 text-[14px] ${
                        storeFilter === st
                          ? "border-2 border-[#0071e3] bg-[#f5f5f7] font-semibold text-[#1d1d1f]"
                          : "border border-[#e0e0e0] bg-[#ffffff] text-[#1d1d1f]"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Max Price & Currency */}
              <div>
                <div className="flex items-center justify-between text-[12px] font-semibold">
                  <span className="text-[#7a7a7a]">Precio máximo</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-semibold text-[#1d1d1f]">{fmt(maxPrice, currency)}</span>
                    <div className="flex rounded-full border border-[#e0e0e0] bg-[#f5f5f7] p-0.5 text-[11px]">
                      {(["EUR", "USD"] as const).map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setCurrency(c)}
                          className={`rounded-full px-2.5 py-0.5 ${
                            currency === c ? "bg-[#0066cc] text-white" : "text-[#1d1d1f]"
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <input
                  type="range"
                  min={5}
                  max={MAX_PRICE}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(+e.target.value)}
                  className="mt-2 w-full accent-[#0066cc]"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3 border-t border-[#e0e0e0] pt-4">
              <button
                type="button"
                onClick={clearAllFilters}
                className="min-h-[44px] flex-1 rounded-full border border-[#0066cc] bg-transparent py-2.5 text-[14px] text-[#0066cc]"
              >
                Limpiar
              </button>
              <button
                type="button"
                onClick={() => setShowFiltersSheet(false)}
                className="min-h-[44px] flex-1 rounded-full bg-[#0066cc] py-2.5 text-[14px] text-white"
              >
                Ver {displayedParts.length} resultados
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. PRODUCT TILE PARCHMENT: COMPARATIVA 1:1 OEM VS AFTERMARKET (#f5f5f7) */}
      <section
        id="comparator"
        ref={comparatorRef}
        className="w-full scroll-mt-14 bg-[#f5f5f7] px-[22px] py-[48px] lg:py-[80px]"
      >
        <div className="mx-auto max-w-[980px]">
          <div className="flex flex-col justify-between gap-4 border-b border-[#e0e0e0] pb-6 lg:flex-row lg:items-end">
            <div>
              <p className="apple-caption font-semibold text-[#0066cc]">
                Comparativa Equivalente · OEM vs Aftermarket
              </p>
              <h2 className="apple-display-lg mt-1 text-[32px] text-[#1d1d1f] sm:text-[40px]">
                Compara OEM y Aftermarket con los mismos criterios.
              </h2>
              <p className="apple-caption mt-1 text-[#7a7a7a]">
                Especificaciones técnicas, tolerancia de encaje e impacto en el valor del reloj cara a cara.
              </p>
            </div>

            {/* Component Group Selector */}
            <div className="flex flex-wrap gap-2">
              {PAIR_GROUPS.map((pg) => (
                <button
                  key={pg.id}
                  type="button"
                  onClick={() => setCompareGroup(pg.id)}
                  className={`rounded-full px-4 py-1.5 text-[14px] transition ${
                    compareGroup === pg.id
                      ? "bg-[#0066cc] text-white"
                      : "border border-[#e0e0e0] bg-[#ffffff] text-[#1d1d1f] hover:border-[#0071e3]"
                  }`}
                >
                  {pg.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {comparedParts.slice(0, 2).map((cp) => {
              const isOem = cp.origin === "oem";
              const otherPart = comparedParts.find((x) => x.id !== cp.id);
              const savingsEur =
                !isOem && otherPart && otherPart.priceEur > cp.priceEur
                  ? otherPart.priceEur - cp.priceEur
                  : null;
              const savingsPct =
                savingsEur && otherPart
                  ? Math.round((savingsEur / otherPart.priceEur) * 100)
                  : null;

              return (
                <div
                  key={cp.id}
                  className="flex flex-col justify-between rounded-[18px] border border-[#e0e0e0] bg-[#ffffff] p-[24px]"
                >
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e0e0e0] pb-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold ${
                            isOem
                              ? "bg-[#1d1d1f] text-white"
                              : "bg-[#f5f5f7] text-[#0066cc]"
                          }`}
                        >
                          {isOem ? (
                            <>
                              <Award className="h-3.5 w-3.5" /> OEM
                            </>
                          ) : (
                            <>
                              <Wrench className="h-3.5 w-3.5" /> Aftermarket
                            </>
                          )}
                        </span>
                        <span className="text-[12px] text-[#7a7a7a]">
                          {isOem ? "Recambio original de marca" : "Alternativa compatible 1:1"}
                        </span>
                      </div>

                      {savingsPct !== null && savingsEur !== null && (
                        <span className="rounded-full bg-[#0066cc]/10 px-3 py-1 text-[12px] font-semibold text-[#0066cc]">
                          Ahorro del {savingsPct}% (-{fmt(savingsEur, currency)})
                        </span>
                      )}
                    </div>

                    <div className="mt-5 flex items-center gap-4">
                      <img
                        src={cp.image}
                        alt={cp.title}
                        className="h-20 w-20 shrink-0 rounded-[8px] border border-[#e0e0e0] object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="apple-body-strong text-[#1d1d1f]">
                          {cp.title}
                        </h3>
                        <p className="mt-1 text-[24px] font-semibold tracking-[-0.015em] text-[#1d1d1f]">
                          {fmt(cp.priceEur, currency)}
                        </p>
                      </div>
                    </div>

                    <dl className="mt-5 divide-y divide-[#e0e0e0] rounded-[12px] border border-[#e0e0e0] bg-[#fafafc] p-4 text-[14px]">
                      <div className="flex justify-between gap-4 pb-2.5">
                        <dt className="text-[#7a7a7a]">Tienda y entrega</dt>
                        <dd className="text-right font-semibold text-[#1d1d1f]">
                          {cp.store} · {cp.delivery}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-4 py-2.5">
                        <dt className="text-[#7a7a7a]">Compatibilidad</dt>
                        <dd className="text-right font-semibold text-[#1d1d1f]">
                          {cp.compatibleWith.slice(0, 2).join(", ")}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-4 py-2.5">
                        <dt className="text-[#7a7a7a]">Material y acabado</dt>
                        <dd className="text-right text-[#1d1d1f]">
                          {cp.materialSpec ?? cp.spec}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-4 py-2.5">
                        <dt className="text-[#7a7a7a]">Tolerancia y encaje</dt>
                        <dd className="text-right text-[#1d1d1f]">
                          {cp.toleranceSpec ?? "Ajuste estándar verificado"}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-4 pt-2.5">
                        <dt className="text-[#7a7a7a]">Impacto en el reloj</dt>
                        <dd className="text-right font-semibold text-[#1d1d1f]">
                          {cp.resaleImpact ?? (isOem ? "Conserva originalidad de fábrica" : "Uso diario / Modificación")}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => toggleSavePart(cp)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#0066cc] bg-transparent px-[18px] py-[9px] text-[14px] text-[#0066cc] transition hover:bg-[#0066cc]/5"
                    >
                      <Heart
                        className={`h-3.5 w-3.5 ${
                          savedIds.includes(cp.id) ? "fill-[#0066cc] text-[#0066cc]" : ""
                        }`}
                      />
                      <span>{savedIds.includes(cp.id) ? "Guardada" : "Guardar pieza"}</span>
                    </button>

                    <a
                      href={cp.customUrl ?? getStoreSearchUrl(cp.store, `${cp.brand} ${cp.title}`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#0066cc] px-[22px] py-[9px] text-[14px] text-white transition hover:bg-[#0071e3]"
                    >
                      <span>Ver oferta en {cp.store}</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* STICKY BOTTOM COMPARISON BAR */}
      {showStickyCompareBar && comparedParts.length > 0 && (
        <div className="apple-frosted fixed bottom-4 left-1/2 z-40 flex w-[94vw] max-w-xl -translate-x-1/2 items-center justify-between gap-3 rounded-full border border-[#e0e0e0] bg-[#f5f5f7]/90 px-5 py-2.5">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-[#0066cc]">
              Comparativa OEM vs Aftermarket
            </p>
            <p className="truncate text-[14px] font-semibold text-[#1d1d1f]">
              {PAIR_GROUPS.find((pg) => pg.id === compareGroup)?.label} ({comparedParts.slice(0, 2).length} piezas)
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <a
              href="#comparator"
              onClick={() => setShowStickyCompareBar(false)}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#0066cc] px-4 py-1.5 text-[14px] text-white"
            >
              <Scale className="h-3.5 w-3.5" />
              <span>Comparar</span>
            </a>
            <button
              type="button"
              onClick={() => setShowStickyCompareBar(false)}
              aria-label="Cerrar barra de comparación"
              className="rounded-full bg-[#e0e0e0]/70 p-1.5 text-[#1d1d1f]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* 6. PRODUCT TILE DARK: CHOLLOS DE HOY (#272729) */}
      <section
        id="chollos"
        ref={chollosRef}
        className="w-full scroll-mt-14 bg-[#272729] px-[22px] py-[48px] text-[#ffffff] lg:py-[80px]"
      >
        <div className="mx-auto max-w-[980px]">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="apple-caption font-semibold text-[#2997ff]">
                Chollos de hoy
              </p>
              <h2 className="apple-display-lg mt-1 text-[32px] text-[#ffffff] sm:text-[40px]">
                Oportunidades verificadas del día.
              </h2>
              <p className="apple-caption mt-1 max-w-xl text-[#cccccc]">
                Selección de piezas, lotes de relojero y relojes por debajo de su precio habitual en Wallapop, eBay, Chrono24 y Todocolección.
              </p>
            </div>

            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#cccccc]" />
                <input
                  value={cholloQuery}
                  onChange={(e) => setCholloQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void runLiveCholloScan();
                  }}
                  placeholder="Filtrar chollos (ej. Seiko, Omega...)"
                  className="h-[40px] w-full rounded-full border border-white/15 bg-[#2a2a2c] pl-10 pr-4 text-[14px] text-[#ffffff] outline-none placeholder:text-[#cccccc]/70 focus:border-[#0071e3]"
                />
              </div>
              <button
                type="button"
                onClick={() => void runLiveCholloScan()}
                disabled={isScanningChollos}
                className="inline-flex h-[40px] items-center gap-1.5 rounded-full bg-[#0066cc] px-5 text-[14px] text-white transition hover:bg-[#0071e3] disabled:opacity-50"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>{isScanningChollos ? "Actualizando..." : "Actualizar chollos"}</span>
              </button>
            </div>
          </div>

          {/* Platform filter pills */}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            {(
              [
                { id: "all" as const, label: "Todas" },
                ...CHOLLO_PLATFORMS.map((p) => ({ id: p, label: p })),
              ]
            ).map((plat) => {
              const active = cholloPlatform === plat.id;
              return (
                <button
                  key={plat.id}
                  type="button"
                  onClick={() => setCholloPlatform(plat.id)}
                  className={`rounded-full px-4 py-1.5 text-[14px] transition ${
                    active
                      ? "bg-[#0066cc] text-white"
                      : "border border-white/15 bg-[#2a2a2c] text-[#cccccc] hover:text-white"
                  }`}
                >
                  {plat.label}
                </button>
              );
            })}
          </div>

          {/* Selección de Chollos de hoy */}
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {displayedChollos.slice(0, 4).map((deal, idx) => (
              <article
                key={deal.id}
                className="group flex flex-col justify-between rounded-[18px] border border-white/12 bg-[#2a2a2c] p-[20px] transition hover:border-white/25"
              >
                <div>
                  <div className="relative aspect-[16/10] overflow-hidden rounded-[8px] bg-[#252527]">
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
                    <div className="absolute left-2.5 top-2.5">
                      <span className="rounded-full bg-black/75 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                        {deal.platform}
                      </span>
                    </div>
                    <div className="absolute right-2.5 top-2.5">
                      <span className="rounded-full bg-[#0066cc] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                        -{deal.savingsPct}%
                      </span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-[12px] text-[#cccccc]">
                      {deal.brand} · {deal.condition}
                    </p>
                    <h3 className="mt-1 line-clamp-2 text-[15px] font-semibold leading-snug text-[#ffffff]">
                      {deal.title}
                    </h3>

                    <div className="mt-3 flex items-baseline justify-between border-t border-white/10 pt-2.5">
                      <div>
                        <span className="text-[19px] font-semibold text-[#ffffff]">{fmt(deal.priceEur, currency)}</span>
                        <span className="ml-1.5 text-[12px] text-[#cccccc] line-through">
                          {fmt(deal.marketValueEur, currency)}
                        </span>
                      </div>
                      <span className="text-[12px] font-semibold text-[#2997ff]">
                        -{fmt(deal.profitMarginEur, currency)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-2">
                  <a
                    href={deal.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-[#0066cc] px-4 py-2 text-[14px] text-white transition hover:bg-[#0071e3]"
                  >
                    <span>Ver en {deal.platform}</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 7. PRODUCT TILE LIGHT: GUÍAS ÚTILES & MI CAJA (#ffffff) */}
      <section
        id="blog"
        className="w-full scroll-mt-14 bg-[#ffffff] px-[22px] py-[48px] lg:py-[80px]"
      >
        <div className="mx-auto max-w-[980px]">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="apple-caption font-semibold text-[#0066cc]">
                Guías de taller
              </p>
              <h2 className="apple-display-lg mt-1 text-[32px] text-[#1d1d1f] sm:text-[40px]">
                Guías breves de compatibilidad y relojería.
              </h2>
            </div>
            <Link
              to="/blog"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#0066cc] px-5 py-2 text-[14px] text-[#0066cc] transition hover:bg-[#0066cc]/5"
            >
              <span>Ver todas las guías</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {SEO_BLOG_ARTICLES.slice(0, 4).map((art, idx) => (
              <article
                key={art.slug}
                className="group flex flex-col justify-between rounded-[18px] border border-[#e0e0e0] bg-[#ffffff] p-[20px]"
              >
                <div>
                  <div className="relative aspect-[16/10] overflow-hidden rounded-[8px] bg-[#f5f5f7]">
                    <img
                      src={art.heroImage || resolveBlogFallbackImage(idx)}
                      alt={art.title}
                      loading="lazy"
                      onError={(e) => {
                        const target = e.currentTarget;
                        const fb = resolveBlogFallbackImage(idx);
                        if (!target.src.endsWith(fb)) {
                          target.src = fb;
                        }
                      }}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute left-2.5 top-2.5">
                      <span className="rounded-full bg-[#ffffff]/90 px-2.5 py-0.5 text-[11px] font-semibold text-[#1d1d1f]">
                        {art.category}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h3 className="apple-body-strong text-[#1d1d1f]">
                      {art.title}
                    </h3>
                    <p className="mt-1.5 line-clamp-2 text-[14px] leading-[1.42] text-[#7a7a7a]">
                      {art.summary}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-[#e0e0e0] pt-3">
                  <button
                    type="button"
                    onClick={() => setActiveBlogArticle(art)}
                    className="inline-flex items-center gap-1 text-[14px] text-[#0066cc] hover:underline"
                  >
                    Leer guía <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => applyQuickSuggestion(art.relatedSearchQuery)}
                    className="rounded-full bg-[#f5f5f7] px-3 py-1 text-[12px] text-[#1d1d1f] transition hover:text-[#0066cc]"
                  >
                    Ver piezas
                  </button>
                </div>
              </article>
            ))}
          </div>

          {/* Bloque de regreso: Mi Caja */}
          <div className="mt-10 flex flex-col justify-between gap-4 rounded-[18px] border border-[#e0e0e0] bg-[#f5f5f7] p-[24px] sm:flex-row sm:items-center">
            <div>
              <h3 className="apple-lead text-[#1d1d1f]">
                Continúa donde lo dejaste.
              </h3>
              <p className="apple-caption mt-1 text-[#7a7a7a]">
                Tus piezas guardadas en Mi Caja y tus búsquedas recientes se conservan en este navegador sin necesidad de registro.
              </p>
              {recentSearches.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span className="text-[12px] text-[#7a7a7a]">Retomar búsqueda:</span>
                  {recentSearches.map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => applyQuickSuggestion(term)}
                      className="inline-flex items-center gap-1 rounded-full border border-[#e0e0e0] bg-[#ffffff] px-3 py-1 text-[12px] text-[#1d1d1f] hover:border-[#0071e3] hover:text-[#0066cc]"
                    >
                      <Clock className="h-3 w-3 text-[#7a7a7a]" />
                      <span>{term}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShowWatchbox(true)}
                className="inline-flex items-center gap-2 rounded-full bg-[#0066cc] px-[22px] py-[11px] text-[14px] text-white transition hover:bg-[#0071e3]"
              >
                <Heart className="h-3.5 w-3.5" />
                <span>Abrir Mi Caja ({savedParts.length})</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SEO BLOG ARTICLE READER MODAL */}
      {activeBlogArticle && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="relative max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-[18px] border border-[#e0e0e0] bg-[#ffffff] p-8">
            <button
              type="button"
              onClick={() => setActiveBlogArticle(null)}
              className="sticky right-0 top-0 float-right rounded-full bg-[#f5f5f7] p-2 text-[#1d1d1f]"
            >
              <X className="h-4 w-4" />
            </button>
            <span className="rounded-full bg-[#f5f5f7] px-3 py-1 text-[12px] font-semibold text-[#0066cc]">
              {activeBlogArticle.category} · {activeBlogArticle.readTime}
            </span>
            <h3 className="apple-display-lg mt-3 text-[28px] text-[#1d1d1f]">{activeBlogArticle.title}</h3>
            <p className="apple-body mt-2 text-[#7a7a7a]">{activeBlogArticle.summary}</p>

            <div className="mt-6 space-y-5 border-t border-[#e0e0e0] pt-5">
              {activeBlogArticle.sections.map((sec) => (
                <div key={sec.heading}>
                  <h4 className="apple-lead text-[#1d1d1f]">{sec.heading}</h4>
                  <p className="apple-body mt-1.5 text-[#333333]">{sec.body}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-[18px] border border-[#e0e0e0] bg-[#f5f5f7] p-5">
              <p className="text-[12px] font-semibold text-[#1d1d1f]">
                Preguntas frecuentes de taller
              </p>
              <div className="mt-3 space-y-3">
                {(activeBlogArticle.faqs ?? []).map((item) => (
                  <div key={item.q} className="text-[14px]">
                    <p className="font-semibold text-[#1d1d1f]">¿{item.q.replace(/^¿/, "")}</p>
                    <p className="mt-0.5 text-[#7a7a7a]">{item.a}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  const q = activeBlogArticle.relatedSearchQuery;
                  setActiveBlogArticle(null);
                  applyQuickSuggestion(q);
                }}
                className="rounded-full bg-[#0066cc] px-[22px] py-[11px] text-[14px] text-white"
              >
                Buscar "{activeBlogArticle.relatedSearchQuery}" en el buscador
              </button>
              <Link
                to="/blog"
                onClick={() => setActiveBlogArticle(null)}
                className="text-[14px] text-[#0066cc] hover:underline"
              >
                Ver todas las guías en /blog →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* MI CAJA / GUARDADOS DRAWER MODAL */}
      {showWatchbox && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs">
          <div className="flex h-full w-full max-w-lg flex-col border-l border-[#e0e0e0] bg-[#ffffff] p-6">
            <div className="flex items-center justify-between border-b border-[#e0e0e0] pb-4">
              <div className="flex items-center gap-2.5">
                <Heart className="h-5 w-5 fill-[#0066cc] text-[#0066cc]" />
                <div>
                  <h3 className="apple-lead text-[#1d1d1f]">Mi Caja</h3>
                  <p className="text-[12px] text-[#7a7a7a]">
                    {savedParts.length}{" "}
                    {savedParts.length === 1 ? "pieza guardada" : "piezas guardadas"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowWatchbox(false)}
                aria-label="Cerrar Mi Caja"
                className="rounded-full bg-[#f5f5f7] p-2 text-[#1d1d1f]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1">
              {savedParts.length === 0 ? (
                <div className="py-16 text-center text-[#7a7a7a]">
                  <p className="apple-lead text-[#1d1d1f]">Tu caja está vacía</p>
                  <p className="mt-2 text-[14px]">
                    Pulsa el icono del corazón en cualquier pieza para guardarla aquí y calcular el presupuesto de tu reloj.
                  </p>
                </div>
              ) : (
                savedParts.map((sp) => (
                  <div key={sp.id} className="flex items-center justify-between gap-3 rounded-[18px] border border-[#e0e0e0] p-3.5">
                    <img src={sp.image} alt={sp.title} className="h-14 w-14 rounded-[8px] object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold text-[#7a7a7a]">
                        {sp.store} · {sp.origin === "oem" ? "OEM" : "Aftermarket"}
                      </p>
                      <h4 className="truncate text-[14px] font-semibold text-[#1d1d1f]">{sp.title}</h4>
                      <p className="text-[15px] font-semibold text-[#1d1d1f]">{fmt(sp.priceEur, currency)}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <a
                        href={sp.customUrl ?? getStoreSearchUrl(sp.store, `${sp.brand} ${sp.title}`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full bg-[#0066cc] px-3.5 py-1.5 text-[12px] text-white"
                      >
                        Ver oferta
                      </a>
                      <button
                        type="button"
                        onClick={() => toggleSavePart(sp)}
                        aria-label="Quitar de Mi Caja"
                        className="rounded-full bg-[#f5f5f7] p-2 text-[#7a7a7a] hover:text-[#1d1d1f]"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}

              {alerts.length > 0 && (
                <div className="mt-6 rounded-[18px] border border-[#e0e0e0] bg-[#f5f5f7] p-4">
                  <p className="flex items-center gap-1.5 text-[12px] font-semibold text-[#1d1d1f]">
                    <Bell className="h-3.5 w-3.5 text-[#0066cc]" /> Alertas de precio ({alerts.length})
                  </p>
                  <ul className="mt-2 space-y-1.5 text-[12px]">
                    {alerts.map((al) => (
                      <li key={al.partId} className="flex justify-between">
                        <span className="truncate pr-2 text-[#1d1d1f]">{al.title}</span>
                        <span className="font-semibold text-[#0066cc]">Aviso &lt; {fmt(al.targetEur, currency)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {savedParts.length > 0 && (
              <div className="mt-4 border-t border-[#e0e0e0] pt-4">
                <div className="flex items-center justify-between text-[14px]">
                  <span className="text-[#7a7a7a]">Presupuesto total:</span>
                  <span className="text-[24px] font-semibold text-[#1d1d1f]">{fmt(totalSavedEur, currency)}</span>
                </div>
                {totalSavedOemEquivEur > totalSavedEur && (
                  <p className="mt-1 text-[12px] font-semibold text-[#0066cc]">
                    Ahorras {fmt(totalSavedOemEquivEur - totalSavedEur, currency)} frente a comprar todo en OEM ({fmt(totalSavedOemEquivEur, currency)})
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* APPLE FOOTER (#f5f5f7, py-[64px], 12px fine print & dense links) */}
      <footer className="w-full border-t border-[#e0e0e0] bg-[#f5f5f7] px-[22px] py-[64px] text-[#333333]">
        <div className="mx-auto max-w-[980px]">
          <p className="apple-fine-print border-b border-[#e0e0e0] pb-4 text-[#7a7a7a]">
            1. Los precios y plazos de envío se consultan en tiempo real o mediante catálogos verificados de eBay, AliExpress, Chrono24, Cousins UK, NamokiMods y B&R Bands. Las marcas citadas pertenecen a sus respectivos propietarios.
          </p>
          <div className="mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <p className="apple-fine-print text-[#7a7a7a]">
              Copyright © 2026 ChronoParts España. Todos los derechos reservados.
            </p>
            <div className="flex flex-wrap items-center gap-6">
              <a href="#search" className="apple-dense-link text-[#333333] hover:text-[#0066cc]">Buscador</a>
              <a href="#explorar" className="apple-dense-link text-[#333333] hover:text-[#0066cc]">Esquema 3D</a>
              <a href="#chollos" className="apple-dense-link text-[#333333] hover:text-[#0066cc]">Chollos</a>
              <Link to="/blog" className="apple-dense-link text-[#333333] hover:text-[#0066cc]">Guías</Link>
              <Link to="/marketplace" className="apple-dense-link text-[#333333] hover:text-[#0066cc]">Marketplace</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function fmt(eur: number, c: "EUR" | "USD") {
  const v = c === "EUR" ? eur : eur * 1.08;
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: c,
    maximumFractionDigits: v < 100 ? 2 : 0,
  }).format(v);
}

function PartCard({
  p,
  currency,
  isSaved,
  isSelectedForCompare,
  oemCounterpartEur,
  onToggleSave,
  onCompare,
  onCreateAlert,
}: {
  p: Part;
  currency: "EUR" | "USD";
  isSaved: boolean;
  isSelectedForCompare?: boolean | undefined;
  oemCounterpartEur?: number | undefined;
  onToggleSave: () => void;
  onCompare?: (() => void) | undefined;
  onCreateAlert?: (() => void) | undefined;
}) {
  const [showTechDetails, setShowTechDetails] = useState(false);

  const refOemPrice = p.equivalentOemPriceEur ?? oemCounterpartEur;
  const savingsEur =
    p.origin === "generic" && refOemPrice && refOemPrice > p.priceEur
      ? refOemPrice - p.priceEur
      : null;
  const savingsPct =
    savingsEur && refOemPrice ? Math.round((savingsEur / refOemPrice) * 100) : null;

  const storeUrl =
    p.customUrl ??
    getStoreSearchUrl(p.store, `${p.brand === "Generic" ? "" : p.brand} ${p.title}`);

  const hasTechDetails = Boolean(
    p.materialSpec || p.toleranceSpec || p.oemRef || p.resaleImpact || p.spec
  );

  return (
    <article
      className={`group flex flex-col justify-between rounded-[18px] bg-[#ffffff] p-[24px] transition ${
        isSelectedForCompare
          ? "border-2 border-[#0071e3]"
          : "border border-[#e0e0e0] hover:border-[#0071e3]/60"
      }`}
    >
      <div>
        {/* 1. Imagen de la pieza (rounded-[8px] inner radius) + Etiqueta OEM/Aftermarket */}
        <div className="relative aspect-[4/3] overflow-hidden rounded-[8px] bg-[#f5f5f7]">
          <img
            src={p.image}
            alt={p.title}
            loading="lazy"
            width={640}
            height={480}
            onError={(e) => {
              const target = e.currentTarget;
              const fallback = resolveCategoryImage(p.category, p.origin);
              if (target.src !== fallback) {
                target.src = fallback;
              }
            }}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-103"
          />

          <div className="absolute left-2.5 top-2.5 flex flex-wrap items-center gap-1.5 pr-16">
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                p.origin === "oem"
                  ? "bg-[#1d1d1f] text-white"
                  : "border border-[#e0e0e0] bg-[#ffffff]/95 text-[#1d1d1f]"
              }`}
            >
              {p.origin === "oem" ? "OEM" : "Aftermarket"}
            </span>
            {savingsPct !== null && savingsEur !== null && (
              <span className="rounded-full bg-[#0066cc] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                -{savingsPct}% ({fmt(savingsEur, currency)})
              </span>
            )}
          </div>

          <div className="absolute right-2.5 top-2.5 flex items-center gap-1.5">
            {onCreateAlert && (
              <button
                type="button"
                onClick={onCreateAlert}
                aria-label="Crear alerta de bajada de precio"
                title="Avisarme si baja de precio"
                className="grid h-8 w-8 place-items-center rounded-full bg-[#ffffff]/90 text-[#1d1d1f] transition hover:bg-[#ffffff]"
              >
                <Bell className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={onToggleSave}
              aria-label={isSaved ? "Quitar de Mi Caja" : "Guardar pieza en Mi Caja"}
              title={isSaved ? "Quitar de Mi Caja" : "Guardar pieza en Mi Caja"}
              className={`grid h-8 w-8 place-items-center rounded-full transition ${
                isSaved
                  ? "bg-[#0066cc] text-white"
                  : "bg-[#ffffff]/90 text-[#1d1d1f] hover:bg-[#ffffff]"
              }`}
            >
              <Heart className={`h-3.5 w-3.5 ${isSaved ? "fill-current" : ""}`} />
            </button>
          </div>
        </div>

        {/* 2. Nombre breve y marca */}
        <div className="mt-4 flex items-center justify-between gap-2 text-[12px] text-[#7a7a7a]">
          <span className="font-semibold text-[#1d1d1f]">
            {p.brand === "Generic" ? "Recambio compatible" : p.brand}
          </span>
          <span className="inline-flex items-center gap-1 text-[12px]">
            <span className="font-semibold text-[#1d1d1f]">{p.store}</span>
            <span>·</span>
            <Truck className="h-3 w-3" />
            <span>{p.delivery}</span>
          </span>
        </div>

        <h3 className="apple-body-strong mt-1.5 line-clamp-2 text-[#1d1d1f]">
          {p.title}
        </h3>

        {/* 3. Relojes o calibres compatibles */}
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {p.compatibleWith.slice(0, 2).map((compat) => (
            <span
              key={compat}
              className="rounded-full bg-[#f5f5f7] px-2.5 py-0.5 text-[12px] text-[#333333]"
            >
              {compat}
            </span>
          ))}
          {p.compatibleWith.length > 2 && (
            <span className="text-[12px] text-[#7a7a7a]">
              +{p.compatibleWith.length - 2} más
            </span>
          )}
        </div>

        {/* 4. Precio y detalles técnicos */}
        <div className="mt-4 flex items-baseline justify-between gap-2 border-t border-[#e0e0e0] pt-3">
          <div>
            <p className="text-[24px] font-semibold tracking-[-0.015em] text-[#1d1d1f]">
              {fmt(p.priceEur, currency)}
            </p>
            {p.origin === "generic" && refOemPrice && refOemPrice > p.priceEur && (
              <p className="text-[12px] text-[#7a7a7a]">
                Ref. OEM: <span className="line-through">{fmt(refOemPrice, currency)}</span>
              </p>
            )}
          </div>

          {hasTechDetails && (
            <button
              type="button"
              onClick={() => setShowTechDetails((v) => !v)}
              className="inline-flex items-center gap-1 text-[12px] text-[#0066cc] hover:underline"
            >
              <span>Detalles técnicos</span>
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${
                  showTechDetails ? "rotate-180" : ""
                }`}
              />
            </button>
          )}
        </div>

        {showTechDetails && (
          <dl className="mt-3 space-y-1.5 rounded-[12px] border border-[#e0e0e0] bg-[#fafafc] p-3 text-[12px]">
            {p.spec && (
              <div className="flex justify-between gap-2">
                <dt className="text-[#7a7a7a]">Especificación</dt>
                <dd className="text-right text-[#1d1d1f]">{p.spec}</dd>
              </div>
            )}
            {p.materialSpec && (
              <div className="flex justify-between gap-2">
                <dt className="text-[#7a7a7a]">Material</dt>
                <dd className="text-right text-[#1d1d1f]">{p.materialSpec}</dd>
              </div>
            )}
            {p.toleranceSpec && (
              <div className="flex justify-between gap-2">
                <dt className="text-[#7a7a7a]">Tolerancia / ajuste</dt>
                <dd className="text-right text-[#1d1d1f]">{p.toleranceSpec}</dd>
              </div>
            )}
            {p.oemRef && (
              <div className="flex justify-between gap-2">
                <dt className="text-[#7a7a7a]">Referencia técnica</dt>
                <dd className="text-right font-mono font-semibold text-[#1d1d1f]">{p.oemRef}</dd>
              </div>
            )}
            {p.resaleImpact && (
              <div className="flex justify-between gap-2">
                <dt className="text-[#7a7a7a]">Nota</dt>
                <dd className="text-right text-[#1d1d1f]">{p.resaleImpact}</dd>
              </div>
            )}
          </dl>
        )}
      </div>

      {/* Acciones Apple Pill: Primaria (#0066cc) y Secundaria (1px solid #0066cc) */}
      <div className="mt-5 flex items-center gap-2.5 pt-2">
        {onCompare && (
          <button
            type="button"
            onClick={onCompare}
            className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border px-[18px] py-[9px] text-[14px] font-normal transition ${
              isSelectedForCompare
                ? "border-2 border-[#0071e3] bg-[#0066cc]/10 font-semibold text-[#0066cc]"
                : "border-[#0066cc] bg-transparent text-[#0066cc] hover:bg-[#0066cc]/5"
            }`}
          >
            <Scale className="h-3.5 w-3.5" />
            <span>Comparar</span>
          </button>
        )}
        <a
          href={storeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex flex-[1.3] items-center justify-center gap-1.5 rounded-full bg-[#0066cc] px-[22px] py-[9px] text-[14px] font-normal text-white transition hover:bg-[#0071e3]"
        >
          <span>Ver oferta</span>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
      </div>
    </article>
  );
}

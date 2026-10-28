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
import { Button } from "@/components/ui/button";
import braceletImage from "@/assets/bracelet.jpg";
import crystalImage from "@/assets/crystal.jpg";
import movementImage from "@/assets/movement.jpg";
import strapImage from "@/assets/strap.jpg";
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
  "rolex-op41": "/blog/blog-2.jpg",
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
    image: crystalImage,
  },
  {
    id: "straps",
    title: "Correas y brazaletes",
    subtitle: "Oyster 904L, Jubilee y caucho PRX",
    savingsCue: "Desde 18 € vs 195 € OEM",
    image: strapImage,
  },
  {
    id: "movements",
    title: "Calibres mecánicos",
    subtitle: "Seiko NH35, ETA 2824-2 y Miyota 9015",
    savingsCue: "Desde 39 € vs 245 € OEM",
    image: movementImage,
  },
  {
    id: "bezels",
    title: "Biseles y coronas",
    subtitle: "Insertos cerámicos, juntas y tijas",
    savingsCue: "Ahorro medio -72%",
    image: braceletImage,
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
    () => WATCH_MODELS.find((m) => m.id === selectedModelId) ?? WATCH_MODELS.find((m) => m.id === "rolex-op41"),
    [selectedModelId]
  );

  const dynamicSpecs = useMemo(
    () => [
      { icon: Ruler, k: "Ancho de asas", v: activeModel?.lugWidth ?? "—" },
      { icon: Droplets, k: "Hermeticidad", v: activeModel?.waterResistance ?? "—" },
      { icon: Cog, k: "Calibre", v: activeModel?.movement ?? "—" },
      { icon: Gem, k: "Material", v: activeModel?.material ?? "—" },
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
    <div className="chrono-home min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildBlogJsonLd()) }}
      />
      {/* Toast Notification (Apple Floating Pill) */}
      {toastMsg && (
        <div className="fixed bottom-5 left-1/2 z-50 flex w-[92vw] max-w-md -translate-x-1/2 items-center justify-between gap-3 rounded-full bg-foreground px-5 py-3 text-[14px] font-normal text-primary-foreground sm:w-auto">
          <Sparkles className="h-4 w-4 shrink-0 text-apple-primary-dark" />
          <span className="truncate">{toastMsg}</span>
          <Button variant="unstyled" onClick={() => setToastMsg(null)} className="shrink-0 opacity-70 hover:opacity-100">
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* 1. GLOBAL NAV (DESIGN_apple.md: background #000000, height 44px, text #ffffff in 12px/400/-0.12px) */}
      <nav
        id="top"
        aria-label="Navegación global"
        className="sticky top-0 z-50 h-[44px] w-full bg-apple-black text-primary-foreground"
      >
        <div className="mx-auto flex h-full max-w-[1024px] items-center justify-between px-4 sm:px-6">
          <a
            href="#top"
            className="apple-nav-link text-[14px] font-semibold text-primary-foreground transition-opacity hover:opacity-85"
          >
            ChronoParts
          </a>

          <div className="flex items-center gap-4 sm:gap-8">
            <a
              href="#search"
              className="apple-nav-link text-primary-foreground/90 transition-opacity hover:text-primary-foreground"
            >
              Buscar
            </a>
            <a
              href="#chollos"
              className="apple-nav-link text-primary-foreground/90 transition-opacity hover:text-primary-foreground"
            >
              Chollos
            </a>
            <Link
              to="/marketplace"
              className="apple-nav-link hidden items-center gap-1.5 sm:inline-flex text-primary-foreground/90 transition-opacity hover:text-primary-foreground"
              title="Marketplace de relojes completos"
            >
              <span>Marketplace</span>
              <span className="rounded-full bg-apple-tile-1 px-2 py-0.5 text-[10px] font-normal text-apple-primary-dark">
                Próximamente
              </span>
            </Link>
          </div>

          {/* Icono único de Perfil (Mi Caja + Cuenta) */}
          <div className="relative">
            <Button variant="unstyled"
              type="button"
              onClick={() => setShowAccountMenu((v) => !v)}
              aria-expanded={showAccountMenu}
              aria-label="Abrir Mi Caja y menú de perfil"
              className="relative flex h-[32px] items-center gap-1.5 rounded-[8px] bg-foreground px-3 text-[12px] font-normal text-primary-foreground transition-transform active:scale-95"
            >
              <User className="h-3.5 w-3.5 text-primary-foreground" />
              <span className="hidden sm:inline">Mi Caja</span>
              {savedIds.length > 0 && (
                <span className="grid h-4 min-w-[16px] place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                  {savedIds.length}
                </span>
              )}
            </Button>

            {showAccountMenu && (
              <div className="absolute right-0 top-10 z-50 w-64 rounded-[18px] border border-border bg-background p-3 text-foreground">
                <div className="border-b border-apple-divider pb-2.5 px-2">
                  <p className="apple-fine-print uppercase text-muted-foreground">
                    Mi espacio
                  </p>
                  <p className="apple-caption-strong mt-1 text-foreground">
                    Piezas guardadas y accesos
                  </p>
                </div>
                <div className="mt-2 space-y-1 text-[14px]">
                  <Button variant="unstyled"
                    type="button"
                    onClick={() => {
                      setShowAccountMenu(false);
                      setShowWatchbox(true);
                    }}
                    className="flex w-full items-center justify-between rounded-[11px] px-3 py-2 text-left text-foreground transition hover:bg-secondary"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Heart className="h-3.5 w-3.5 text-primary" />
                      <span>Mi Caja de piezas</span>
                    </span>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[12px] font-semibold text-foreground">
                      {savedIds.length}
                    </span>
                  </Button>
                  <Link
                    to="/marketplace"
                    onClick={() => setShowAccountMenu(false)}
                    className="flex w-full items-center justify-between rounded-[11px] px-3 py-2 text-foreground transition hover:bg-secondary"
                  >
                    <span>Marketplace</span>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-primary">
                      Próximamente
                    </span>
                  </Link>
                  <Link
                    to="/vender"
                    onClick={() => setShowAccountMenu(false)}
                    className="block rounded-[11px] px-3 py-2 text-foreground transition hover:bg-secondary"
                  >
                    Publicar reloj (/vender)
                  </Link>
                  <Link
                    to="/mis-anuncios"
                    onClick={() => setShowAccountMenu(false)}
                    className="block rounded-[11px] px-3 py-2 text-foreground transition hover:bg-secondary"
                  >
                    Mis anuncios (/mis-anuncios)
                  </Link>
                  <Link
                    to="/favoritos"
                    onClick={() => setShowAccountMenu(false)}
                    className="block rounded-[11px] px-3 py-2 text-foreground transition hover:bg-secondary"
                  >
                    Relojes favoritos (/favoritos)
                  </Link>
                  <Link
                    to="/mensajes"
                    onClick={() => setShowAccountMenu(false)}
                    className="block rounded-[11px] px-3 py-2 text-foreground transition hover:bg-secondary"
                  >
                    Mensajes (/mensajes)
                  </Link>
                  <Link
                    to="/blog"
                    onClick={() => setShowAccountMenu(false)}
                    className="block rounded-[11px] px-3 py-2 text-foreground transition hover:bg-secondary"
                  >
                    Blog
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* 2. SUB-NAV FROSTED (DESIGN_apple.md: #f5f5f7 at 80% + backdrop-filter blur, height 52px, 1px rgba(0,0,0,0.08)) */}
      <div className="sticky top-[44px] z-40 h-[52px] w-full border-b border-border apple-frosted">
        <div className="mx-auto flex h-full max-w-[1024px] items-center justify-between px-4 sm:px-6">
          <span className="apple-tagline text-[15px] sm:text-[21px] text-foreground">
            Recambios y Calibres
          </span>
          <div className="flex items-center gap-4">
            <a
              href="#explorar"
              className="hidden text-[14px] font-normal text-foreground/80 hover:text-primary sm:inline"
            >
              Explorar relojes
            </a>
            <a
              href="#comparator"
              className="hidden text-[14px] font-normal text-foreground/80 hover:text-primary sm:inline"
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
              className="inline-flex items-center justify-center rounded-full bg-primary px-[16px] py-[6px] text-[12px] font-normal text-primary-foreground transition-transform active:scale-95 focus:outline-2 focus:outline-ring"
            >
              Buscar recambios
            </a>
          </div>
        </div>
      </div>

      {/* 3. HERO — PRODUCT TILE LIGHT (DESIGN_apple.md: Pure White #ffffff, NO gradients, rounded-none, 80px desktop / 48px mobile padding) */}
      <header className="w-full rounded-none bg-background py-8 lg:py-16">
        <div className="mx-auto grid max-w-[1068px] items-center gap-6 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
          <div>
            <p className="apple-caption font-semibold text-primary">
              ChronoParts · OEM y Aftermarket
            </p>

            <h1 className="apple-hero-display mt-2 text-[34px] text-foreground sm:text-[44px] lg:text-[56px]">
              Cada pieza exacta. Al mejor precio.
            </h1>

            <p className="apple-body mt-4 max-w-lg text-muted-foreground sm:text-[21px]">
              Compara piezas originales y alternativas compatibles por modelo, referencia o calibre.
            </p>

            {/* Two Apple Pill CTAs: button-primary (#0066cc) & button-secondary-pill (1px solid #0066cc) */}
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <a
                href="#search"
                onClick={(e) => {
                  e.preventDefault();
                  searchSectionRef.current?.scrollIntoView({ behavior: "smooth" });
                  setTimeout(() => searchInputRef.current?.focus(), 250);
                }}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-primary px-[22px] py-[11px] text-[17px] font-normal text-primary-foreground transition-transform active:scale-95 focus:outline-2 focus:outline-ring"
              >
                <span>Buscar recambios</span>
                <ArrowDown className="h-4 w-4" />
              </a>
              <a
                href="#explorar"
                className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-primary bg-background px-[22px] py-[11px] text-[17px] font-normal text-primary transition-transform active:scale-95 focus:outline-2 focus:outline-ring"
              >
                Elegir mi reloj
              </a>
            </div>
          </div>

          {/* Product Render resting on Pure White surface with the ONLY allowed system drop-shadow */}
          <div className="mx-auto flex w-full max-w-[340px] flex-col items-center sm:max-w-[420px] lg:max-w-[460px]">
            <img
              src="/blog/blog-2.jpg"
              alt="Fotografía de un reloj Rolex con brazalete de acero"
              className="aspect-[16/9] w-full rounded-lg object-cover sm:aspect-[4/3]"
            />
            <a href="#explorar" className="mt-3 inline-flex min-h-11 items-center gap-2 text-[14px] text-primary">
              <Watch className="h-4 w-4" /> Explorar relojes <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </header>

      {/* 2. PRODUCT TILE PARCHMENT: BUSCADOR DE RECAMBIOS (#f5f5f7) */}
      <section
        id="search"
        ref={searchSectionRef}
        className="w-full scroll-mt-14 bg-secondary px-[22px] py-[48px] lg:py-[80px]"
      >
        <div className="mx-auto max-w-[980px]">
          <div className="mb-8 flex flex-col items-center text-center">
            <h2 className="apple-display-lg text-[32px] text-foreground sm:text-[40px]">
              Encuentra cada pieza con precisión.
            </h2>
            <p className="apple-tagline mt-2 max-w-[600px] text-[19px] text-muted-foreground sm:text-[21px]">
              Busca por referencia de reloj, calibre mecánico o componente específico.
            </p>
          </div>

          <div className="border-y border-border bg-background py-5 sm:rounded-[18px] sm:border sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <span className="apple-caption font-semibold text-foreground">
                Búsqueda directa en catálogos verificados
              </span>
              <Button variant="unstyled"
                type="button"
                onClick={() => setShowFiltersSheet(true)}
                className="inline-flex min-h-[36px] items-center gap-2 rounded-full border border-border bg-secondary px-4 py-1.5 text-[14px] font-normal text-foreground transition hover:border-ring"
              >
                <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
                <span>Filtros</span>
                {activeFilterCount > 0 && (
                  <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </div>

            {/* Campo principal Apple Search Input Pill */}
            <div className="relative">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex h-[48px] flex-1 items-center gap-3 rounded-full border border-input bg-secondary px-[20px] transition focus-within:border-ring focus-within:bg-background focus-within:ring-2 focus-within:ring-ring/25">
                  <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
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
                    placeholder="Modelo, calibre o pieza"
                    aria-label="Busca por modelo, calibre o pieza"
                    className="min-w-0 flex-1 bg-transparent text-[17px] text-foreground outline-none placeholder:text-muted-foreground"
                  />
                  {query && (
                    <Button variant="unstyled"
                      type="button"
                      onClick={() => setQuery("")}
                      className="rounded-full bg-border/60 px-2.5 py-0.5 text-[12px] text-foreground hover:bg-border"
                    >
                      Limpiar
                    </Button>
                  )}
                </div>

                <Button variant="unstyled"
                  type="button"
                  onClick={() => {
                    setSearchFocused(false);
                    void runExtendedSearch(query);
                  }}
                  className="inline-flex h-[48px] items-center justify-center gap-2 rounded-full bg-primary px-[24px] text-[17px] font-normal text-primary-foreground transition hover:bg-ring"
                >
                  <Search className="h-4 w-4" />
                  <span>Buscar</span>
                </Button>
              </div>

              {/* Sugerencias en vivo y búsquedas recientes */}
              {searchFocused && (searchSuggestions.length > 0 || recentSearches.length > 0) && (
                <div className="absolute left-0 right-0 top-full z-30 mt-2 rounded-[18px] border border-border bg-background p-4">
                  {recentSearches.length > 0 && !query.trim() && (
                    <div className="mb-3">
                      <p className="px-2 text-[12px] font-semibold text-muted-foreground">
                        Búsquedas recientes
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5 px-1">
                        {recentSearches.map((recent) => (
                          <Button variant="unstyled"
                            key={recent}
                            type="button"
                            onClick={() => applyQuickSuggestion(recent)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1 text-[12px] text-foreground hover:border-ring hover:text-primary"
                          >
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span>{recent}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="px-2 text-[12px] font-semibold text-muted-foreground">
                    Sugerencias rápidas
                  </p>
                  <div className="mt-1 grid gap-1 sm:grid-cols-2">
                    {searchSuggestions.map((s) => (
                      <Button variant="unstyled"
                        key={`${s.type}-${s.queryValue}`}
                        type="button"
                        onClick={() => applyQuickSuggestion(s.queryValue)}
                        className="flex items-center justify-between rounded-[12px] px-3 py-2 text-left text-[14px] transition hover:bg-secondary"
                      >
                        <div>
                          <p className="font-semibold text-foreground">{s.label}</p>
                          <p className="text-[12px] text-muted-foreground">{s.type}</p>
                        </div>
                        <ArrowUpRight className="h-3.5 w-3.5 text-primary" />
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Accesos rápidos */}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="apple-caption text-muted-foreground">Empezar por:</span>
                <a
                  href="#explorar"
                  onClick={() => setExploreTab("watches")}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-1.5 text-[14px] text-foreground transition hover:border-ring hover:text-primary"
                >
                  <Watch className="h-3.5 w-3.5 text-primary" />
                  <span>Elegir mi reloj</span>
                </a>
                <a
                  href="#explorar"
                  onClick={() => setExploreTab("parts")}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-1.5 text-[14px] text-foreground transition hover:border-ring hover:text-primary"
                >
                  <Layers className="h-3.5 w-3.5 text-primary" />
                  <span>Buscar una pieza</span>
                </a>
                <a
                  href="#chollos"
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-1.5 text-[14px] text-foreground transition hover:border-ring hover:text-primary"
                >
                  <Flame className="h-3.5 w-3.5 text-primary" />
                  <span>Ver chollos</span>
                </a>
              </div>

              {recentSearches.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[12px] text-muted-foreground">Recientes:</span>
                  {recentSearches.slice(0, 3).map((term) => (
                    <Button variant="unstyled"
                      key={term}
                      type="button"
                      onClick={() => applyQuickSuggestion(term)}
                      className="rounded-full bg-secondary px-3 py-1 text-[12px] text-foreground transition hover:text-primary"
                    >
                      {term}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            {/* Etiquetas de filtros activos */}
            {(activeFilterCount > 0 || query.trim().length > 0) && (
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                <span className="text-[12px] font-semibold text-muted-foreground">Activos:</span>
                {query.trim().length > 0 && (
                  <Button variant="unstyled"
                    type="button"
                    onClick={() => setQuery("")}
                    className="inline-flex items-center gap-1.5 rounded-full border border-ring bg-secondary px-3 py-1 text-[12px] font-semibold text-foreground"
                  >
                    <span>"{query}"</span>
                    <X className="h-3 w-3" />
                  </Button>
                )}
                {origin !== "all" && (
                  <Button variant="unstyled"
                    type="button"
                    onClick={() => setOrigin("all")}
                    className="inline-flex items-center gap-1.5 rounded-full border border-ring bg-secondary px-3 py-1 text-[12px] font-semibold text-foreground"
                  >
                    <span>{origin === "oem" ? "OEM" : "Aftermarket"}</span>
                    <X className="h-3 w-3" />
                  </Button>
                )}
                {categories.map((catId) => {
                  const catObj = CATEGORIES.find((c) => c.id === catId);
                  return (
                    <Button variant="unstyled"
                      key={catId}
                      type="button"
                      onClick={() => toggleCat(catId)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-ring bg-secondary px-3 py-1 text-[12px] font-semibold text-foreground"
                    >
                      <span>{catObj?.labelEs ?? catId}</span>
                      <X className="h-3 w-3" />
                    </Button>
                  );
                })}
                {storeFilter !== "all" && (
                  <Button variant="unstyled"
                    type="button"
                    onClick={() => setStoreFilter("all")}
                    className="inline-flex items-center gap-1.5 rounded-full border border-ring bg-secondary px-3 py-1 text-[12px] font-semibold text-foreground"
                  >
                    <span>{storeFilter === "niche-pro" ? "Especialistas" : storeFilter}</span>
                    <X className="h-3 w-3" />
                  </Button>
                )}
                {maxPrice < MAX_PRICE && (
                  <Button variant="unstyled"
                    type="button"
                    onClick={() => setMaxPrice(MAX_PRICE)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-ring bg-secondary px-3 py-1 text-[12px] font-semibold text-foreground"
                  >
                    <span>Máx. {fmt(maxPrice, currency)}</span>
                    <X className="h-3 w-3" />
                  </Button>
                )}
                <Button variant="unstyled"
                  type="button"
                  onClick={clearAllFilters}
                  className="inline-flex items-center gap-1 px-2 py-1 text-[12px] text-primary hover:underline"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Limpiar todo</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3. PRODUCT TILE DARK: EXPLORAR POR RELOJ O PIEZA (#272729) */}
      <section
        id="explorar"
        className="w-full scroll-mt-14 bg-apple-tile-1 px-[22px] py-[48px] text-primary-foreground lg:py-[80px]"
      >
        <div className="mx-auto max-w-[980px]">
          <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:items-end sm:text-left">
            <div>
              <p className="apple-caption font-semibold text-apple-primary-dark">
                Relojes y componentes
              </p>
              <h2 className="apple-display-lg mt-1 text-[32px] text-primary-foreground sm:text-[40px]">
                Encuentra piezas por reloj o categoría.
              </h2>
            </div>
            <div className="inline-flex rounded-full border border-primary-foreground/15 bg-apple-tile-2 p-1">
              <Button variant="unstyled"
                type="button"
                onClick={() => setExploreTab("watches")}
                className={`rounded-full px-4 py-1.5 text-[14px] font-normal transition ${
                  exploreTab === "watches"
                    ? "bg-primary text-primary-foreground"
                    : "text-apple-body-muted hover:text-primary-foreground"
                }`}
              >
                Relojes populares
              </Button>
              <Button variant="unstyled"
                type="button"
                onClick={() => setExploreTab("parts")}
                className={`rounded-full px-4 py-1.5 text-[14px] font-normal transition ${
                  exploreTab === "parts"
                    ? "bg-primary text-primary-foreground"
                    : "text-apple-body-muted hover:text-primary-foreground"
                }`}
              >
                Piezas comunes
              </Button>
            </div>
          </div>

          {/* Selector horizontal de relojes populares o piezas comunes */}
          {exploreTab === "watches" ? (
            <div className="mt-8 flex gap-3 overflow-x-auto pb-2">
              {WATCH_MODELS.map((w) => {
                const isSelected = selectedModelId === w.id;
                const imgUrl = WATCH_PREVIEW_IMAGES[w.id] ?? WATCH_PREVIEW_IMAGES["rolex-op41"];
                return (
                  <Button variant="unstyled"
                    key={w.id}
                    type="button"
                    onClick={() => {
                      setSelectedModelId(w.id);
                                      }}
                    className={`group flex min-w-[240px] shrink-0 items-center gap-3.5 rounded-[18px] p-3.5 text-left transition ${
                      isSelected
                        ? "border-2 border-ring bg-apple-tile-2"
                        : "border border-primary-foreground/12 bg-apple-tile-2/70 hover:border-primary-foreground/30 hover:bg-apple-tile-2"
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={`${w.brand} ${w.name}`}
                      className="h-14 w-14 shrink-0 rounded-[8px] object-cover"
                      loading="lazy"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-[12px] font-semibold text-apple-primary-dark">
                        {w.brand} · {w.movement}
                      </span>
                      <p className="truncate text-[17px] font-semibold text-primary-foreground">
                        {w.name}
                      </p>
                      <p className="text-[12px] text-apple-body-muted">Ref. {w.ref} · {w.lugWidth}</p>
                    </div>
                  </Button>
                );
              })}
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-4 min-[380px]:grid-cols-2 sm:grid-cols-4">
              {COMMON_PARTS_SHORTCUTS.map((item) => {
                const active = categories.includes(item.id);
                return (
                  <Button variant="unstyled"
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setCategories([item.id]);
                      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                    className={`group overflow-hidden rounded-[18px] bg-apple-tile-2 text-left transition ${
                      active
                        ? "border-2 border-ring"
                        : "border border-primary-foreground/12 hover:border-primary-foreground/30"
                    }`}
                  >
                    <div className="aspect-[16/10] overflow-hidden bg-apple-tile-3">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-4">
                      <p className="text-[14px] font-semibold text-primary-foreground">{item.title}</p>
                      <p className="mt-0.5 text-[12px] text-apple-body-muted">{item.subtitle}</p>
                      <p className="mt-1.5 text-[12px] text-apple-primary-dark">{item.savingsCue}</p>
                    </div>
                  </Button>
                );
              })}
            </div>
          )}


        </div>
      </section>

      {/* 4. PRODUCT TILE LIGHT: RESULTADOS DE RECAMBIOS (#ffffff) */}
      <section
        id="resultados"
        ref={resultsRef}
        className="w-full scroll-mt-14 bg-background px-[22px] py-[48px] lg:py-[80px]"
      >
        <div className="mx-auto max-w-[980px]">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="apple-display-lg text-[28px] text-foreground sm:text-[34px]">
                {displayedParts.length}{" "}
                {displayedParts.length === 1 ? "recambio compatible" : "recambios compatibles"}
              </h2>
              <span className="rounded-full bg-secondary px-3.5 py-1 text-[12px] font-semibold text-primary">
                OEM y Aftermarket
              </span>
              {isLoadingApi && (
                <span className="rounded-full bg-secondary px-3 py-1 text-[12px] text-muted-foreground">
                  Buscando ofertas...
                </span>
              )}
            </div>

            <div className="flex w-full min-w-0 items-center gap-2 text-[14px] sm:w-auto">
              <label htmlFor="sort-parts-select" className="text-muted-foreground">
                Ordenar:
              </label>
              <select
                id="sort-parts-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="min-h-11 min-w-0 flex-1 rounded-full border border-border bg-background px-4 py-1.5 text-[14px] text-foreground outline-none focus:border-ring"
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
                  onCompare={p.pairGroupId ? () => { if (p.pairGroupId) openComparatorFor(p.pairGroupId); } : undefined}
                  onCreateAlert={() => handleCreateAlert(p)}
                />
              );
            })}
            {displayedParts.length === 0 && (
              <div className="col-span-full rounded-[18px] border border-border bg-secondary p-12 text-center">
                <p className="apple-lead text-foreground">
                  No hemos encontrado piezas con esos filtros.
                </p>
                <p className="apple-caption mt-2 text-muted-foreground">
                  Prueba a limpiar los filtros o buscar otro modelo o calibre.
                </p>
                <Button variant="unstyled"
                  type="button"
                  onClick={clearAllFilters}
                  className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-[22px] py-[11px] text-[14px] text-primary-foreground hover:bg-ring"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Mostrar todas las piezas
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* PANEL DE FILTROS AVANZADOS */}
      {showFiltersSheet && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-apple-black/50 backdrop-blur-xs sm:items-center sm:justify-center sm:p-4">
          <div className="max-h-[86vh] w-full overflow-y-auto rounded-t-[18px] border border-border bg-background p-6 sm:max-w-lg sm:rounded-[18px]">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h3 className="apple-lead text-foreground">Filtros</h3>
                <p className="text-[12px] text-muted-foreground">
                  {displayedParts.length} resultados disponibles
                </p>
              </div>
              <Button variant="unstyled"
                type="button"
                onClick={() => setShowFiltersSheet(false)}
                aria-label="Cerrar filtros"
                className="rounded-full bg-secondary p-2 text-foreground hover:bg-border"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-5 space-y-5">
              {/* Origin */}
              <div>
                <p className="text-[12px] font-semibold text-muted-foreground">
                  Tipo de recambio
                </p>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {ORIGINS.map((o) => (
                    <Button variant="unstyled"
                      key={o.id}
                      type="button"
                      onClick={() => setOrigin(o.id)}
                      className={`min-h-[42px] rounded-[12px] px-3 py-2 text-[14px] transition ${
                        origin === o.id
                          ? "border-2 border-ring bg-secondary font-semibold text-foreground"
                          : "border border-border bg-background text-foreground"
                      }`}
                    >
                      {o.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div>
                <p className="text-[12px] font-semibold text-muted-foreground">
                  Categoría de pieza
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => {
                    const active = categories.includes(c.id);
                    return (
                      <Button variant="unstyled"
                        key={c.id}
                        type="button"
                        onClick={() => toggleCat(c.id)}
                        className={`min-h-[40px] rounded-[12px] px-3.5 py-1.5 text-[14px] transition ${
                          active
                            ? "border-2 border-ring bg-secondary font-semibold text-foreground"
                            : "border border-border bg-background text-foreground"
                        }`}
                      >
                        {c.labelEs}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Store */}
              <div>
                <p className="text-[12px] font-semibold text-muted-foreground">
                  Tienda
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button variant="unstyled"
                    type="button"
                    onClick={() => setStoreFilter("all")}
                    className={`min-h-[38px] rounded-[12px] px-3.5 py-1.5 text-[14px] ${
                      storeFilter === "all"
                        ? "border-2 border-ring bg-secondary font-semibold text-foreground"
                        : "border border-border bg-background text-foreground"
                    }`}
                  >
                    Todas
                  </Button>
                  {(["eBay", "AliExpress", "Chrono24", ...NICHE_PRO_STORES] as const).map((st) => (
                    <Button variant="unstyled"
                      key={st}
                      type="button"
                      onClick={() => setStoreFilter(storeFilter === st ? "all" : st)}
                      className={`min-h-[38px] rounded-[12px] px-3.5 py-1.5 text-[14px] ${
                        storeFilter === st
                          ? "border-2 border-ring bg-secondary font-semibold text-foreground"
                          : "border border-border bg-background text-foreground"
                      }`}
                    >
                      {st}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Max Price & Currency */}
              <div>
                <div className="flex items-center justify-between text-[12px] font-semibold">
                  <span className="text-muted-foreground">Precio máximo</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-semibold text-foreground">{fmt(maxPrice, currency)}</span>
                    <div className="flex rounded-full border border-border bg-secondary p-0.5 text-[11px]">
                      {(["EUR", "USD"] as const).map((c) => (
                        <Button variant="unstyled"
                          key={c}
                          type="button"
                          onClick={() => setCurrency(c)}
                          className={`rounded-full px-2.5 py-0.5 ${
                            currency === c ? "bg-primary text-primary-foreground" : "text-foreground"
                          }`}
                        >
                          {c}
                        </Button>
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
                  className="mt-2 w-full accent-primary"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3 border-t border-border pt-4">
              <Button variant="unstyled"
                type="button"
                onClick={clearAllFilters}
                className="min-h-[44px] flex-1 rounded-full border border-primary bg-transparent py-2.5 text-[14px] text-primary"
              >
                Limpiar
              </Button>
              <Button variant="unstyled"
                type="button"
                onClick={() => setShowFiltersSheet(false)}
                className="min-h-[44px] flex-1 rounded-full bg-primary py-2.5 text-[14px] text-primary-foreground"
              >
                Ver {displayedParts.length} resultados
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 5. PRODUCT TILE PARCHMENT: COMPARATIVA 1:1 OEM VS AFTERMARKET (#f5f5f7) */}
      <section
        id="comparator"
        ref={comparatorRef}
        className="w-full scroll-mt-14 bg-secondary px-[22px] py-[48px] lg:py-[80px]"
      >
        <div className="mx-auto max-w-[980px]">
          <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 lg:flex-row lg:items-end">
            <div>
              <p className="apple-caption font-semibold text-primary">
                Comparativa Equivalente · OEM vs Aftermarket
              </p>
              <h2 className="apple-display-lg mt-1 text-[32px] text-foreground sm:text-[40px]">
                Compara OEM y Aftermarket con los mismos criterios.
              </h2>
              <p className="apple-caption mt-1 text-muted-foreground">
                Especificaciones técnicas, tolerancia de encaje e impacto en el valor del reloj cara a cara.
              </p>
            </div>

            {/* Component Group Selector */}
            <div className="flex flex-wrap gap-2">
              {PAIR_GROUPS.map((pg) => (
                <Button variant="unstyled"
                  key={pg.id}
                  type="button"
                  onClick={() => setCompareGroup(pg.id)}
                  className={`rounded-full px-4 py-1.5 text-[14px] transition ${
                    compareGroup === pg.id
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-background text-foreground hover:border-ring"
                  }`}
                >
                  {pg.label}
                </Button>
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
                  className="flex flex-col justify-between rounded-[18px] border border-border bg-background p-[24px]"
                >
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold ${
                            isOem
                              ? "bg-foreground text-primary-foreground"
                              : "bg-secondary text-primary"
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
                        <span className="text-[12px] text-muted-foreground">
                          {isOem ? "Recambio original de marca" : "Alternativa compatible 1:1"}
                        </span>
                      </div>

                      {savingsPct !== null && savingsEur !== null && (
                        <span className="rounded-full bg-primary/10 px-3 py-1 text-[12px] font-semibold text-primary">
                          Ahorro del {savingsPct}% (-{fmt(savingsEur, currency)})
                        </span>
                      )}
                    </div>

                    <div className="mt-5 flex items-center gap-4">
                      <img
                        src={cp.image.startsWith("/parts/") ? ({ crystals: crystalImage, movements: movementImage, straps: strapImage }[cp.category as "crystals" | "movements" | "straps"] ?? braceletImage) : cp.image}
                        alt={cp.title}
                        className="h-20 w-20 shrink-0 rounded-[8px] border border-border object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="apple-body-strong text-foreground">
                          {cp.title}
                        </h3>
                        <p className="mt-1 text-[24px] font-semibold text-foreground">
                          {fmt(cp.priceEur, currency)}
                        </p>
                      </div>
                    </div>

                    <dl className="mt-5 divide-y divide-border rounded-[12px] border border-border bg-apple-pearl p-4 text-[14px]">
                      <div className="flex justify-between gap-4 pb-2.5">
                        <dt className="text-muted-foreground">Tienda y entrega</dt>
                        <dd className="text-right font-semibold text-foreground">
                          {cp.store} · {cp.delivery}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-4 py-2.5">
                        <dt className="text-muted-foreground">Compatibilidad</dt>
                        <dd className="text-right font-semibold text-foreground">
                          {cp.compatibleWith.slice(0, 2).join(", ")}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-4 py-2.5">
                        <dt className="text-muted-foreground">Material y acabado</dt>
                        <dd className="text-right text-foreground">
                          {cp.materialSpec ?? cp.spec}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-4 py-2.5">
                        <dt className="text-muted-foreground">Tolerancia y encaje</dt>
                        <dd className="text-right text-foreground">
                          {cp.toleranceSpec ?? "Ajuste estándar verificado"}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-4 pt-2.5">
                        <dt className="text-muted-foreground">Impacto en el reloj</dt>
                        <dd className="text-right font-semibold text-foreground">
                          {cp.resaleImpact ?? (isOem ? "Conserva originalidad de fábrica" : "Uso diario / Modificación")}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-2 pt-2">
                    <Button variant="unstyled"
                      type="button"
                      onClick={() => toggleSavePart(cp)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-primary bg-transparent px-[18px] py-[9px] text-[14px] text-primary transition hover:bg-primary/5"
                    >
                      <Heart
                        className={`h-3.5 w-3.5 ${
                          savedIds.includes(cp.id) ? "fill-primary text-primary" : ""
                        }`}
                      />
                      <span>{savedIds.includes(cp.id) ? "Guardada" : "Guardar pieza"}</span>
                    </Button>

                    <a
                      href={cp.customUrl ?? getStoreSearchUrl(cp.store, `${cp.brand} ${cp.title}`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full bg-primary px-[22px] py-[9px] text-[14px] text-primary-foreground transition hover:bg-ring"
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
        <div className="apple-frosted fixed bottom-4 left-1/2 z-40 flex w-[94vw] max-w-xl -translate-x-1/2 items-center justify-between gap-3 rounded-full border border-border bg-secondary/90 px-5 py-2.5">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-primary">
              Comparativa OEM vs Aftermarket
            </p>
            <p className="truncate text-[14px] font-semibold text-foreground">
              {PAIR_GROUPS.find((pg) => pg.id === compareGroup)?.label} ({comparedParts.slice(0, 2).length} piezas)
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <a
              href="#comparator"
              onClick={() => setShowStickyCompareBar(false)}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-[14px] text-primary-foreground"
            >
              <Scale className="h-3.5 w-3.5" />
              <span>Comparar</span>
            </a>
            <Button variant="unstyled"
              type="button"
              onClick={() => setShowStickyCompareBar(false)}
              aria-label="Cerrar barra de comparación"
              className="rounded-full bg-border/70 p-1.5 text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* 6. PRODUCT TILE DARK: CHOLLOS DE HOY (#272729) */}
      <section
        id="chollos"
        ref={chollosRef}
        className="w-full scroll-mt-14 bg-apple-tile-1 px-[22px] py-[48px] text-primary-foreground lg:py-[80px]"
      >
        <div className="mx-auto max-w-[980px]">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="apple-caption font-semibold text-apple-primary-dark">
                Chollos de hoy
              </p>
              <h2 className="apple-display-lg mt-1 text-[32px] text-primary-foreground sm:text-[40px]">
                Oportunidades verificadas del día.
              </h2>
              <p className="apple-caption mt-1 max-w-xl text-apple-body-muted">
                Selección de piezas, lotes de relojero y relojes por debajo de su precio habitual en Wallapop, eBay, Chrono24 y Todocolección.
              </p>
            </div>

            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
              <div className="relative w-full min-w-0 sm:w-64 sm:flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-apple-body-muted" />
                <input
                  value={cholloQuery}
                  onChange={(e) => setCholloQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void runLiveCholloScan();
                  }}
                  placeholder="Filtrar chollos (ej. Seiko, Omega...)"
                  className="h-[40px] w-full rounded-full border border-primary-foreground/15 bg-apple-tile-2 pl-10 pr-4 text-[14px] text-primary-foreground outline-none placeholder:text-apple-body-muted/70 focus:border-ring"
                />
              </div>
              <Button variant="unstyled"
                type="button"
                onClick={() => void runLiveCholloScan()}
                disabled={isScanningChollos}
                className="inline-flex h-[40px] items-center gap-1.5 rounded-full bg-primary px-5 text-[14px] text-primary-foreground transition hover:bg-ring disabled:opacity-50"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>{isScanningChollos ? "Actualizando..." : "Actualizar chollos"}</span>
              </Button>
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
                <Button variant="unstyled"
                  key={plat.id}
                  type="button"
                  onClick={() => setCholloPlatform(plat.id)}
                  className={`rounded-full px-4 py-1.5 text-[14px] transition ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "border border-primary-foreground/15 bg-apple-tile-2 text-apple-body-muted hover:text-primary-foreground"
                  }`}
                >
                  {plat.label}
                </Button>
              );
            })}
          </div>

          {/* Selección de Chollos de hoy */}
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {displayedChollos.slice(0, 4).map((deal, idx) => (
              <article
                key={deal.id}
                className="group flex flex-col justify-between rounded-[18px] border border-primary-foreground/12 bg-apple-tile-2 p-[20px] transition hover:border-primary-foreground/25"
              >
                <div>
                  <div className="relative aspect-[16/10] overflow-hidden rounded-[8px] bg-apple-tile-3">
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
                      <span className="rounded-full bg-apple-black/75 px-2.5 py-0.5 text-[11px] font-semibold text-primary-foreground">
                        {deal.platform}
                      </span>
                    </div>
                    <div className="absolute right-2.5 top-2.5">
                      <span className="rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-semibold text-primary-foreground">
                        -{deal.savingsPct}%
                      </span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-[12px] text-apple-body-muted">
                      {deal.brand} · {deal.condition}
                    </p>
                    <h3 className="mt-1 line-clamp-2 text-[15px] font-semibold leading-snug text-primary-foreground">
                      {deal.title}
                    </h3>

                    <div className="mt-3 flex items-baseline justify-between border-t border-primary-foreground/10 pt-2.5">
                      <div>
                        <span className="text-[19px] font-semibold text-primary-foreground">{fmt(deal.priceEur, currency)}</span>
                        <span className="ml-1.5 text-[12px] text-apple-body-muted line-through">
                          {fmt(deal.marketValueEur, currency)}
                        </span>
                      </div>
                      <span className="text-[12px] font-semibold text-apple-primary-dark">
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
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[14px] text-primary-foreground transition hover:bg-ring"
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
        className="w-full scroll-mt-14 bg-background px-[22px] py-[48px] lg:py-[80px]"
      >
        <div className="mx-auto max-w-[980px]">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="apple-caption font-semibold text-primary">
                Guías de taller
              </p>
              <h2 className="apple-display-lg mt-1 text-[32px] text-foreground sm:text-[40px]">
                Guías breves de compatibilidad y relojería.
              </h2>
            </div>
            <Link
              to="/blog"
              className="inline-flex items-center gap-1.5 rounded-full border border-primary px-5 py-2 text-[14px] text-primary transition hover:bg-primary/5"
            >
              <span>Ver todas las guías</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {SEO_BLOG_ARTICLES.slice(0, 4).map((art, idx) => (
              <article
                key={art.slug}
                className="group flex flex-col justify-between rounded-[18px] border border-border bg-background p-[20px]"
              >
                <div>
                  <div className="relative aspect-[16/10] overflow-hidden rounded-[8px] bg-secondary">
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
                      <span className="rounded-full bg-background/90 px-2.5 py-0.5 text-[11px] font-semibold text-foreground">
                        {art.category}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h3 className="apple-body-strong text-foreground">
                      {art.title}
                    </h3>
                    <p className="mt-1.5 line-clamp-2 text-[14px] leading-[1.42] text-muted-foreground">
                      {art.summary}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                  <Button variant="unstyled"
                    type="button"
                    onClick={() => setActiveBlogArticle(art)}
                    className="inline-flex items-center gap-1 text-[14px] text-primary hover:underline"
                  >
                    Leer guía <ArrowUpRight className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="unstyled"
                    type="button"
                    onClick={() => applyQuickSuggestion(art.relatedSearchQuery)}
                    className="rounded-full bg-secondary px-3 py-1 text-[12px] text-foreground transition hover:text-primary"
                  >
                    Ver piezas
                  </Button>
                </div>
              </article>
            ))}
          </div>

          {/* Bloque de regreso: Mi Caja */}
          <div className="mt-10 flex flex-col justify-between gap-4 rounded-[18px] border border-border bg-secondary p-[24px] sm:flex-row sm:items-center">
            <div>
              <h3 className="apple-lead text-foreground">
                Continúa donde lo dejaste.
              </h3>
              <p className="apple-caption mt-1 text-muted-foreground">
                Tus piezas guardadas en Mi Caja y tus búsquedas recientes se conservan en este navegador sin necesidad de registro.
              </p>
              {recentSearches.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span className="text-[12px] text-muted-foreground">Retomar búsqueda:</span>
                  {recentSearches.map((term) => (
                    <Button variant="unstyled"
                      key={term}
                      type="button"
                      onClick={() => applyQuickSuggestion(term)}
                      className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1 text-[12px] text-foreground hover:border-ring hover:text-primary"
                    >
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span>{term}</span>
                    </Button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2.5">
              <Button variant="unstyled"
                type="button"
                onClick={() => setShowWatchbox(true)}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-[22px] py-[11px] text-[14px] text-primary-foreground transition hover:bg-ring"
              >
                <Heart className="h-3.5 w-3.5" />
                <span>Abrir Mi Caja ({savedParts.length})</span>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* SEO BLOG ARTICLE READER MODAL */}
      {activeBlogArticle && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-apple-black/50 p-4 backdrop-blur-xs">
          <div className="relative max-h-[88dvh] w-full max-w-2xl overflow-y-auto rounded-[18px] border border-border bg-background p-5 sm:p-8">
            <Button variant="unstyled"
              type="button"
              onClick={() => setActiveBlogArticle(null)}
              className="sticky right-0 top-0 float-right rounded-full bg-secondary p-2 text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
            <span className="rounded-full bg-secondary px-3 py-1 text-[12px] font-semibold text-primary">
              {activeBlogArticle.category} · {activeBlogArticle.readTime}
            </span>
            <h3 className="apple-display-lg mt-3 text-[28px] text-foreground">{activeBlogArticle.title}</h3>
            <p className="apple-body mt-2 text-muted-foreground">{activeBlogArticle.summary}</p>

            <div className="mt-6 space-y-5 border-t border-border pt-5">
              {activeBlogArticle.sections.map((sec) => (
                <div key={sec.heading}>
                  <h4 className="apple-lead text-foreground">{sec.heading}</h4>
                  <p className="apple-body mt-1.5 text-apple-ink-80">{sec.body}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-[18px] border border-border bg-secondary p-5">
              <p className="text-[12px] font-semibold text-foreground">
                Preguntas frecuentes de taller
              </p>
              <div className="mt-3 space-y-3">
                {(activeBlogArticle.faqs ?? []).map((item) => (
                  <div key={item.q} className="text-[14px]">
                    <p className="font-semibold text-foreground">¿{item.q.replace(/^¿/, "")}</p>
                    <p className="mt-0.5 text-muted-foreground">{item.a}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <Button variant="unstyled"
                type="button"
                onClick={() => {
                  const q = activeBlogArticle.relatedSearchQuery;
                  setActiveBlogArticle(null);
                  applyQuickSuggestion(q);
                }}
                className="rounded-full bg-primary px-[22px] py-[11px] text-[14px] text-primary-foreground"
              >
                Buscar "{activeBlogArticle.relatedSearchQuery}" en el buscador
              </Button>
              <Link
                to="/blog"
                onClick={() => setActiveBlogArticle(null)}
                className="text-[14px] text-primary hover:underline"
              >
                Ver todas las guías en /blog →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* MI CAJA / GUARDADOS DRAWER MODAL */}
      {showWatchbox && (
        <div className="fixed inset-0 z-50 flex justify-end bg-apple-black/50 backdrop-blur-xs">
          <div className="flex h-full w-full max-w-lg flex-col border-l border-border bg-background p-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2.5">
                <Heart className="h-5 w-5 fill-primary text-primary" />
                <div>
                  <h3 className="apple-lead text-foreground">Mi Caja</h3>
                  <p className="text-[12px] text-muted-foreground">
                    {savedParts.length}{" "}
                    {savedParts.length === 1 ? "pieza guardada" : "piezas guardadas"}
                  </p>
                </div>
              </div>
              <Button variant="unstyled"
                type="button"
                onClick={() => setShowWatchbox(false)}
                aria-label="Cerrar Mi Caja"
                className="rounded-full bg-secondary p-2 text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1">
              {savedParts.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground">
                  <p className="apple-lead text-foreground">Tu caja está vacía</p>
                  <p className="mt-2 text-[14px]">
                    Pulsa el icono del corazón en cualquier pieza para guardarla aquí y calcular el presupuesto de tu reloj.
                  </p>
                </div>
              ) : (
                savedParts.map((sp) => (
                  <div key={sp.id} className="flex items-center justify-between gap-3 rounded-[18px] border border-border p-3.5">
                    <img src={sp.image} alt={sp.title} className="h-14 w-14 rounded-[8px] object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold text-muted-foreground">
                        {sp.store} · {sp.origin === "oem" ? "OEM" : "Aftermarket"}
                      </p>
                      <h4 className="truncate text-[14px] font-semibold text-foreground">{sp.title}</h4>
                      <p className="text-[15px] font-semibold text-foreground">{fmt(sp.priceEur, currency)}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <a
                        href={sp.customUrl ?? getStoreSearchUrl(sp.store, `${sp.brand} ${sp.title}`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full bg-primary px-3.5 py-1.5 text-[12px] text-primary-foreground"
                      >
                        Ver oferta
                      </a>
                      <Button variant="unstyled"
                        type="button"
                        onClick={() => toggleSavePart(sp)}
                        aria-label="Quitar de Mi Caja"
                        className="rounded-full bg-secondary p-2 text-muted-foreground hover:text-foreground"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))
              )}

              {alerts.length > 0 && (
                <div className="mt-6 rounded-[18px] border border-border bg-secondary p-4">
                  <p className="flex items-center gap-1.5 text-[12px] font-semibold text-foreground">
                    <Bell className="h-3.5 w-3.5 text-primary" /> Alertas de precio ({alerts.length})
                  </p>
                  <ul className="mt-2 space-y-1.5 text-[12px]">
                    {alerts.map((al) => (
                      <li key={al.partId} className="flex justify-between">
                        <span className="truncate pr-2 text-foreground">{al.title}</span>
                        <span className="font-semibold text-primary">Aviso &lt; {fmt(al.targetEur, currency)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {savedParts.length > 0 && (
              <div className="mt-4 border-t border-border pt-4">
                <div className="flex items-center justify-between text-[14px]">
                  <span className="text-muted-foreground">Presupuesto total:</span>
                  <span className="text-[24px] font-semibold text-foreground">{fmt(totalSavedEur, currency)}</span>
                </div>
                {totalSavedOemEquivEur > totalSavedEur && (
                  <p className="mt-1 text-[12px] font-semibold text-primary">
                    Ahorras {fmt(totalSavedOemEquivEur - totalSavedEur, currency)} frente a comprar todo en OEM ({fmt(totalSavedOemEquivEur, currency)})
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* APPLE FOOTER (#f5f5f7, py-[64px], 12px fine print & dense links) */}
      <footer className="w-full border-t border-border bg-secondary px-[22px] py-[64px] text-apple-ink-80">
        <div className="mx-auto max-w-[980px]">
          <p className="apple-fine-print border-b border-border pb-4 text-muted-foreground">
            1. Los precios y plazos de envío se consultan en tiempo real o mediante catálogos verificados de eBay, AliExpress, Chrono24, Cousins UK, NamokiMods y B&R Bands. Las marcas citadas pertenecen a sus respectivos propietarios.
          </p>
          <div className="mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <p className="apple-fine-print text-muted-foreground">
              Copyright © 2026 ChronoParts España. Todos los derechos reservados.
            </p>
            <div className="flex flex-wrap items-center gap-6">
              <a href="#search" className="apple-dense-link text-apple-ink-80 hover:text-primary">Buscador</a>
              <a href="#explorar" className="apple-dense-link text-apple-ink-80 hover:text-primary">Explorar relojes</a>
              <a href="#chollos" className="apple-dense-link text-apple-ink-80 hover:text-primary">Chollos</a>
              <Link to="/blog" className="apple-dense-link text-apple-ink-80 hover:text-primary">Blog</Link>
              <Link to="/marketplace" className="apple-dense-link text-apple-ink-80 hover:text-primary">Marketplace</Link>
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
      className={`group flex flex-col justify-between rounded-[18px] bg-background p-[24px] transition ${
        isSelectedForCompare
          ? "border-2 border-ring"
          : "border border-border hover:border-ring/60"
      }`}
    >
      <div>
        {/* 1. Imagen de la pieza (rounded-[8px] inner radius) + Etiqueta OEM/Aftermarket */}
        <div className="relative aspect-[4/3] overflow-hidden rounded-[8px] bg-secondary">
          <img
            src={p.image.startsWith("/parts/") ? ({ crystals: crystalImage, movements: movementImage, straps: strapImage }[p.category as "crystals" | "movements" | "straps"] ?? braceletImage) : p.image}
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
                  ? "bg-foreground text-primary-foreground"
                  : "border border-border bg-background/95 text-foreground"
              }`}
            >
              {p.origin === "oem" ? "OEM" : "Aftermarket"}
            </span>
            {savingsPct !== null && savingsEur !== null && (
              <span className="rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-semibold text-primary-foreground">
                -{savingsPct}% ({fmt(savingsEur, currency)})
              </span>
            )}
          </div>

          <div className="absolute right-2.5 top-2.5 flex items-center gap-1.5">
            {onCreateAlert && (
              <Button variant="unstyled"
                type="button"
                onClick={onCreateAlert}
                aria-label="Crear alerta de bajada de precio"
                title="Avisarme si baja de precio"
                className="grid h-8 w-8 place-items-center rounded-full bg-background/90 text-foreground transition hover:bg-background"
              >
                <Bell className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button variant="unstyled"
              type="button"
              onClick={onToggleSave}
              aria-label={isSaved ? "Quitar de Mi Caja" : "Guardar pieza en Mi Caja"}
              title={isSaved ? "Quitar de Mi Caja" : "Guardar pieza en Mi Caja"}
              className={`grid h-8 w-8 place-items-center rounded-full transition ${
                isSaved
                  ? "bg-primary text-primary-foreground"
                  : "bg-background/90 text-foreground hover:bg-background"
              }`}
            >
              <Heart className={`h-3.5 w-3.5 ${isSaved ? "fill-current" : ""}`} />
            </Button>
          </div>
        </div>

        {/* 2. Nombre breve y marca */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[12px] text-muted-foreground">
          <span className="font-semibold text-foreground">
            {p.brand === "Generic" ? "Recambio compatible" : p.brand}
          </span>
          <span className="inline-flex items-center gap-1 text-[12px]">
            <span className="font-semibold text-foreground">{p.store}</span>
            <span>·</span>
            <Truck className="h-3 w-3" />
            <span>{p.delivery}</span>
          </span>
        </div>

        <h3 className="apple-body-strong mt-1.5 line-clamp-2 text-foreground">
          {p.title}
        </h3>

        {/* 3. Relojes o calibres compatibles */}
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {p.compatibleWith.slice(0, 2).map((compat) => (
            <span
              key={compat}
              className="rounded-full bg-secondary px-2.5 py-0.5 text-[12px] text-apple-ink-80"
            >
              {compat}
            </span>
          ))}
          {p.compatibleWith.length > 2 && (
            <span className="text-[12px] text-muted-foreground">
              +{p.compatibleWith.length - 2} más
            </span>
          )}
        </div>

        {/* 4. Precio y detalles técnicos */}
        <div className="mt-4 flex items-baseline justify-between gap-2 border-t border-border pt-3">
          <div>
            <p className="text-[24px] font-semibold text-foreground">
              {fmt(p.priceEur, currency)}
            </p>
            {p.origin === "generic" && refOemPrice && refOemPrice > p.priceEur && (
              <p className="text-[12px] text-muted-foreground">
                Ref. OEM: <span className="line-through">{fmt(refOemPrice, currency)}</span>
              </p>
            )}
          </div>

          {hasTechDetails && (
            <Button variant="unstyled"
              type="button"
              onClick={() => setShowTechDetails((v) => !v)}
              className="inline-flex items-center gap-1 text-[12px] text-primary hover:underline"
            >
              <span>Detalles técnicos</span>
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${
                  showTechDetails ? "rotate-180" : ""
                }`}
              />
            </Button>
          )}
        </div>

        {showTechDetails && (
          <dl className="mt-3 space-y-1.5 rounded-[12px] border border-border bg-apple-pearl p-3 text-[12px]">
            {p.spec && (
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Especificación</dt>
                <dd className="text-right text-foreground">{p.spec}</dd>
              </div>
            )}
            {p.materialSpec && (
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Material</dt>
                <dd className="text-right text-foreground">{p.materialSpec}</dd>
              </div>
            )}
            {p.toleranceSpec && (
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Tolerancia / ajuste</dt>
                <dd className="text-right text-foreground">{p.toleranceSpec}</dd>
              </div>
            )}
            {p.oemRef && (
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Referencia técnica</dt>
                <dd className="text-right font-mono font-semibold text-foreground">{p.oemRef}</dd>
              </div>
            )}
            {p.resaleImpact && (
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Nota</dt>
                <dd className="text-right text-foreground">{p.resaleImpact}</dd>
              </div>
            )}
          </dl>
        )}
      </div>

      {/* Acciones Apple Pill: Primaria (#0066cc) y Secundaria (1px solid #0066cc) */}
      <div className="mt-5 grid grid-cols-2 gap-2 pt-2">
        {onCompare && (
          <Button variant="unstyled"
            type="button"
            onClick={onCompare}
            className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border px-[18px] py-[9px] text-[14px] font-normal transition ${
              isSelectedForCompare
                ? "border-2 border-ring bg-primary/10 font-semibold text-primary"
                : "border-primary bg-transparent text-primary hover:bg-primary/5"
            }`}
          >
            <Scale className="h-3.5 w-3.5" />
            <span>Comparar</span>
          </Button>
        )}
        <a
          href={storeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex flex-[1.3] items-center justify-center gap-1.5 rounded-full bg-primary px-[22px] py-[9px] text-[14px] font-normal text-primary-foreground transition hover:bg-ring"
        >
          <span>Ver oferta</span>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
      </div>
    </article>
  );
}

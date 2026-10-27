import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  Ruler,
  Droplets,
  Cog,
  Gem,
  ArrowUpRight,
  Truck,
  Heart,
  Crown,
  Bell,
  Scale,
  Check,
  Sparkles,
  Lock,
  Trash2,
  X,
  ExternalLink,
  ShieldCheck,
  Layers,
  Award,
  Wrench,
  Flame,
  MessageCircle,
  BookOpen,
  TrendingUp,
  Clock,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { AccountControls, useAccount } from "@/components/AccountProvider";
import { Button } from "@/components/ui/button";
import { loadAccount, saveAccount } from "@/lib/account.functions";
import { canUsePersonalAction, canRunExtendedSearch, dailySearches, FREE_SEARCH_LIMIT } from "@/lib/account-rules";
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
  resolveBlogFallbackImage,
  type BlogArticle,
} from "@/lib/seo-blog";
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
    meta: [
      { title: "ChronoParts — Buscador y Comparador de Componentes de Relojería (OEM vs Aftermarket)" },
      {
        name: "description",
        content:
          "Compara recambios originales OEM vintage frente a componentes aftermarket en eBay, AliExpress y Chrono24. Gratis para particulares con herramientas Pro.",
      },
      { property: "og:title", content: "ChronoParts — Luxury watch parts price comparator" },
      {
        property: "og:description",
        content: "Search straps, bezels, crystals and movements. OEM vs generic, side by side.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const ORIGINS: { id: Filters["origin"]; label: string }[] = [
  { id: "all", label: "Todos (OEM + Aftermarket)" },
  { id: "oem", label: "Original / OEM (eBay & Chrono24)" },
  { id: "generic", label: "Generic / Aftermarket (AliExpress)" },
];

const QUICK_SEARCHES = [
  "Tissot 1990",
  "Rolex 124300",
  "Seiko NH35",
  "ETA 2824",
  "Omega Speedmaster",
  "Tissot PRX",
];

const PAIR_GROUPS: { id: string; label: string }[] = [
  { id: "oyster-20mm", label: "Brazalete Oyster 20mm" },
  { id: "crystal-124300", label: "Cristal Zafiro Ø31.5mm" },
  { id: "bezel-op41", label: "Bisel 41mm / Cerámico" },
  { id: "movement-auto", label: "Calibres (3230 / ETA / NH35)" },
  { id: "dial-op41", label: "Esfera & Agujas Luminova" },
  { id: "crown-screw", label: "Corona Roscada Hermética" },
  { id: "strap-tissot", label: "Correas Piel / PRX Caucho" },
];

const FREE_FAV_LIMIT = 3;

interface PriceAlert {
  partId: string;
  title: string;
  targetEur: number;
}

function Index() {
  const { user, openAuth } = useAccount();
  const fetchAccount = useServerFn(loadAccount);
  const persistAccount = useServerFn(saveAccount);
  const [accountLoaded, setAccountLoaded] = useState(false);
  const [savedRecords, setSavedRecords] = useState<Part[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<WatchModelSpec["id"]>("rolex-op41");
  const [query, setQuery] = useState("");
  const [origin, setOrigin] = useState<Filters["origin"]>("all");
  const [categories, setCategories] = useState<Category[]>([]);
  const [maxPrice, setMaxPrice] = useState(MAX_PRICE);
  const [currency, setCurrency] = useState<"EUR" | "USD">("EUR");
  const [storeFilter, setStoreFilter] = useState<"all" | "niche-pro" | Store>("all");

  // Freemium & Pro state
  const [isPro, setIsPro] = useState(false);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [searchesUsed, setSearchesUsed] = useState(0);
  const [showWatchbox, setShowWatchbox] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [compareGroup, setCompareGroup] = useState<string>("oyster-20mm");
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [apiResults, setApiResults] = useState<Part[]>([]);
  const [isLoadingApi, setIsLoadingApi] = useState(false);

  // Daily AI Chollos, VIP WhatsApp & SEO Blog state
  const [cholloPlatform, setCholloPlatform] = useState<"all" | CholloPlatform>("all");
  const [cholloQuery, setCholloQuery] = useState("");
  const [liveChollos, setLiveChollos] = useState<CholloDeal[]>([]);
  const [isScanningChollos, setIsScanningChollos] = useState(false);
  const [showWhatsappModal, setShowWhatsappModal] = useState(false);
  const [whatsappInstantAlerts, setWhatsappInstantAlerts] = useState(true);
  const [activeBlogArticle, setActiveBlogArticle] = useState<BlogArticle | null>(null);

  const resultsRef = useRef<HTMLElement>(null);
  const comparatorRef = useRef<HTMLElement>(null);
  const chollosRef = useRef<HTMLElement>(null);

  const activeModel = useMemo(
    () => WATCH_MODELS.find((m) => m.id === selectedModelId) ?? WATCH_MODELS[0],
    [selectedModelId]
  );

  const dynamicSpecs = useMemo(
    () => [
      { icon: Ruler, k: "Lug width", v: activeModel?.lugWidth ?? "—" },
      { icon: Droplets, k: "Water resistance", v: activeModel?.waterResistance ?? "—" },
      { icon: Cog, k: "Movement", v: activeModel?.movement ?? "—" },
      { icon: Gem, k: "Material", v: activeModel?.material ?? "—" },
    ],
    [activeModel]
  );

  useEffect(() => {
    let active = true;
    setAccountLoaded(false); setSavedIds([]); setSavedRecords([]); setAlerts([]); setIsPro(false); setSearchesUsed(0);
    setShowWatchbox(false); setShowPricingModal(false); setShowWhatsappModal(false);
    if (!user) return;
    void fetchAccount().then(data => {
      if (!active) return;
      const favorites = Array.isArray(data.favorites) ? data.favorites as unknown as Part[] : [];
      setSavedRecords(favorites); setSavedIds(favorites.map(p => p.id));
      setAlerts(Array.isArray(data.alerts) ? data.alerts as unknown as PriceAlert[] : []);
      setIsPro(data.pro_demo); setWhatsappInstantAlerts(data.whatsapp_alerts);
      setSearchesUsed(dailySearches(data.searches_used, data.search_day, new Date().toISOString().slice(0, 10)));
      setAccountLoaded(true);
    }).catch(() => { if (active) triggerToast("No se pudo cargar Mi Caja. Inténtalo de nuevo."); });
    return () => { active = false; };
  }, [user?.id]);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => { setToastMsg(cur => cur === msg ? null : cur); }, 3500);
  };
  const requireAccount = () => {
    if (!canUsePersonalAction(user, "save")) { openAuth(); return false; }
    if (!accountLoaded) { triggerToast("Cargando tus datos personales…"); return false; }
    return true;
  };
  const openPricing = () => { if (requireAccount()) setShowPricingModal(true); };
  const openWhatsapp = () => { if (requireAccount()) setShowWhatsappModal(true); };
  const savePersonal = async (data: Parameters<typeof persistAccount>[0]["data"]) => {
    try { await persistAccount({ data }); return true; }
    catch { triggerToast("No se pudo guardar en la nube. Inténtalo de nuevo."); return false; }
  };
  const togglePlan = async (nextPro: boolean) => {
    if (!requireAccount()) return;
    if (!await savePersonal({ pro_demo: nextPro })) return;
    setIsPro(nextPro);
    triggerToast(nextPro ? "Vista de prueba Atelier PRO activada (demo, sin cobro)." : "Plan Particular Gratis activado.");
  };
  const toggleSavePart = async (part: Part) => {
    if (!requireAccount()) return;
    const removing = savedIds.includes(part.id);
    if (!removing && !isPro && savedIds.length >= FREE_FAV_LIMIT) { openPricing(); triggerToast(`Has alcanzado el límite de ${FREE_FAV_LIMIT} piezas guardadas.`); return; }
    const next = removing ? savedRecords.filter(p => p.id !== part.id) : [...savedRecords, part];
    if (!await savePersonal({ favorites: next })) return;
    setSavedRecords(next); setSavedIds(next.map(p => p.id));
    triggerToast(`${removing ? "Eliminado de" : "Guardado en"} Mi Caja: ${part.title}`);
  };
  const handleCreateAlert = async (part: Part) => {
    if (!requireAccount()) return;
    if (!isPro) { openPricing(); triggerToast("Las alertas de bajada de precio son exclusivas del Plan PRO."); return; }
    const targetEur = Math.round(part.priceEur * 0.85);
    const next = alerts.some(a => a.partId === part.id) ? alerts : [...alerts, { partId: part.id, title: part.title, targetEur }];
    if (!await savePersonal({ alerts: next })) return;
    setAlerts(next); triggerToast(`Alerta guardada para ${fmt(targetEur, currency)}.`);
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

  const displayedParts = useMemo(() => {
    let base = catalogMatches;
    if (query.trim().length >= 3) {
      const ids = new Set(catalogMatches.map((p) => p.id));
      base = [...catalogMatches, ...liveGenerated.filter((p) => !ids.has(p.id))];
    }
    if (storeFilter === "all") return base;
    if (storeFilter === "niche-pro") {
      return base.filter((p) => isNicheProStore(p.store));
    }
    return base.filter((p) => p.store === storeFilter);
  }, [query, catalogMatches, liveGenerated, storeFilter]);

  const allPartsPool = useMemo(() => [...PARTS, ...liveGenerated, ...savedRecords.filter(p => !PARTS.some(x => x.id === p.id) && !liveGenerated.some(x => x.id === p.id))], [liveGenerated, savedRecords]);

  const savedParts = useMemo(
    () => allPartsPool.filter((p) => savedIds.includes(p.id)),
    [allPartsPool, savedIds]
  );

  const comparedParts = useMemo(() => {
    if (!compareGroup) return [];
    return allPartsPool.filter((p) => p.pairGroupId === compareGroup);
  }, [allPartsPool, compareGroup]);

  // Map cheapest OEM & Generic prices per pairGroupId so each card can show its exact counterpart price
  const groupPriceSummary = useMemo(() => {
    const map: Record<string, { oemMin?: number; genericMin?: number }> = {};
    for (const p of allPartsPool) {
      if (!p.pairGroupId) continue;
      if (!map[p.pairGroupId]) map[p.pairGroupId] = {};
      if (p.origin === "oem") {
        map[p.pairGroupId].oemMin = Math.min(map[p.pairGroupId].oemMin ?? Infinity, p.priceEur);
      } else {
        map[p.pairGroupId].genericMin = Math.min(map[p.pairGroupId].genericMin ?? Infinity, p.priceEur);
      }
    }
    return map;
  }, [allPartsPool]);

  const selectFromWatch = (cats: Category[], label?: string) => {
    setCategories(cats);
    if (label) {
      triggerToast(`Filtrando capa 3D: ${label}`);
    }
    resultsRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const toggleCat = (c: Category) =>
    setCategories((cur) => (cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c]));

  const runExtendedSearch = async (term: string) => {
    if (!requireAccount()) return;
    const today = new Date().toISOString().slice(0, 10);
    if (!canRunExtendedSearch(searchesUsed, isPro)) {
      openPricing();
      triggerToast("Agotaste tus 5 búsquedas extensas gratis de hoy. Pásate a PRO para búsquedas ilimitadas.");
      return;
    }
    setQuery(term);
    if (!isPro) {
      const next = Math.min(FREE_SEARCH_LIMIT, searchesUsed + 1);
      if (!await savePersonal({ searches_used: next, search_day: today })) return;
      setSearchesUsed(next);
    }
    setIsLoadingApi(true);
    const liveItems = await fetchLivePartsFromApi(term);
    setApiResults(liveItems);
    setIsLoadingApi(false);
    triggerToast(`Motor Live API (:8765): ${liveItems.length} resultados OEM/Aftermarket para "${term}".`);
    resultsRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const openComparatorFor = (groupId: string) => {
    setCompareGroup(groupId);
    comparatorRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const displayedChollos = useMemo(() => {
    const merged = [...liveChollos, ...DAILY_CHOLLOS];
    const filteredByPlatform =
      cholloPlatform === "all" ? merged : merged.filter((c) => c.platform === cholloPlatform);
    const trimmed = cholloQuery.trim().toLowerCase();
    if (!trimmed) return filteredByPlatform;
    return filteredByPlatform.filter((c) =>
      `${c.title} ${c.brand} ${c.calibreRef ?? ""} ${c.platform} ${c.aiVerdict}`.toLowerCase().includes(trimmed)
    );
  }, [liveChollos, cholloPlatform, cholloQuery]);

  const runLiveCholloScan = async (customTerm?: string) => {
    const q = (customTerm ?? cholloQuery).trim() || "Seiko vintage Omega Tissot";
    setIsScanningChollos(true);
    const scanned = await fetchLiveChollosFromApi(q);
    setIsScanningChollos(false);
    if (scanned.length > 0) {
      setLiveChollos(scanned);
      triggerToast(`Radar IA (:8765): ${scanned.length} chollos detectados para "${q}" bajo valor de mercado.`);
    } else {
      triggerToast(`Mostrando radar curado de chollos diarios para "${q}".`);
    }
    chollosRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const totalSavedEur = savedParts.reduce((acc, p) => acc + p.priceEur, 0);
  const totalSavedOemEquivEur = savedParts.reduce(
    (acc, p) => acc + (p.equivalentOemPriceEur ?? p.priceEur),
    0
  );

  if (!activeModel) return <p className="p-6">No hay un modelo disponible.</p>;

  return (
    <div className="min-h-screen chronoparts-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildBlogJsonLd()) }}
      />
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-5 left-1/2 z-50 flex w-[92vw] max-w-md -translate-x-1/2 items-center justify-between gap-3 rounded-full bg-primary px-5 py-3 text-xs font-bold text-primary-foreground shadow-soft sm:w-auto">
          <Sparkles className="h-4 w-4 shrink-0 text-accent" />
          <span className="truncate">{toastMsg}</span>
          <Button variant="ghost" size="sm" onClick={() => setToastMsg(null)} className="shrink-0 opacity-70 hover:opacity-100">
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      <header className="relative overflow-hidden hero-glow">
        <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:gap-4 sm:px-6 sm:py-6">
          <div className="flex items-center gap-3">
            <span className="font-serif text-2xl">
              Chrono<em>Parts</em>
            </span>
            <span className="rounded-full border border-primary/15 bg-card/70 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              OEM vs Aftermarket
            </span>
          </div>

          <div className="hidden items-center gap-6 text-sm font-medium lg:flex">
            <a href="#search" className="hover:underline">
              Buscador
            </a>
            <a href="#chollos" className="inline-flex items-center gap-1 font-bold text-foreground hover:underline">
              <Flame className="h-3.5 w-3.5 text-amber-600" /> Chollos IA Diarios
            </a>
            <a href="#comparator" className="hover:underline">
              Duelo 1:1
            </a>
            <Link to="/blog" className="inline-flex items-center gap-1 font-bold hover:underline">
              <BookOpen className="h-3.5 w-3.5 text-primary" /> Blog
            </Link>
            <Button variant="ghost" size="sm" onClick={() => setShowPricingModal(true)} className="hover:underline">
              Planes (Gratis / PRO)
            </Button>
          </div>

          <div className="flex w-full snap-x items-center gap-2.5 overflow-x-auto pb-2 lg:w-auto">
            <AccountControls />
            <Button variant="ghost" size="sm"
              onClick={() => openWhatsapp()}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition sm:px-3.5 sm:py-2 ${
                isPro
                  ? "border-emerald-600/40 bg-emerald-600 text-white shadow-soft hover:bg-emerald-700"
                  : "border-primary/20 bg-card/85 text-foreground hover:bg-card"
              }`}
              title={
                isPro
                  ? "Acceder al Grupo VIP de WhatsApp Atelier PRO"
                  : "Exclusivo Miembros Atelier PRO: Alertas de chollos y comunidad privada en WhatsApp"
              }
            >
              {isPro ? <MessageCircle className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5 text-amber-600" />}
              <span>Club WhatsApp PRO</span>
            </Button>

            <Button variant="ghost" size="sm"
              onClick={() => { if (requireAccount()) setShowWatchbox(true); }}
              className="relative inline-flex items-center gap-2 rounded-full border border-primary/15 bg-card/85 px-3.5 py-1.5 text-xs font-bold backdrop-blur transition hover:bg-card sm:px-4 sm:py-2"
            >
              <Heart className={`h-3.5 w-3.5 ${savedIds.length > 0 ? "fill-destructive text-destructive" : ""}`} />
              <span>Mi Caja</span>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-black">
                {savedIds.length}
                {!isPro ? `/${FREE_FAV_LIMIT}` : ""}
              </span>
            </Button>

            <Button variant="ghost" size="sm"
              onClick={() => togglePlan(!isPro)}
              title="Cambiar entre vista Gratis (Particular) y Plan Atelier PRO"
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition sm:px-4 sm:py-2 ${
                isPro
                  ? "bg-accent text-accent-foreground shadow-soft"
                  : "bg-primary text-primary-foreground hover:opacity-90"
              }`}
            >
              <Crown className="h-3.5 w-3.5" />
              <span>{isPro ? "Plan PRO Activo" : "Plan Gratis · Subir a PRO"}</span>
            </Button>
          </div>

          {/* Mobile Quick Navigation Bar */}
          <div className="flex w-full items-center gap-2 overflow-x-auto pb-1 pt-1 text-xs font-bold lg:hidden">
            <a
              href="#search"
              className="shrink-0 rounded-full border border-primary/15 bg-card/80 px-3 py-1.5 hover:bg-card"
            >
              🔍 Buscador
            </a>
            <a
              href="#chollos"
              className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-amber-900"
            >
              <Flame className="h-3.5 w-3.5 text-amber-600" /> Chollos IA
            </a>
            <a
              href="#comparator"
              className="shrink-0 rounded-full border border-primary/15 bg-card/80 px-3 py-1.5 hover:bg-card"
            >
              ⚖️ Duelo 1:1
            </a>
            <Link
              to="/blog"
              className="inline-flex shrink-0 items-center gap-1 rounded-full border border-primary/15 bg-card/80 px-3 py-1.5 hover:bg-card"
            >
              <BookOpen className="h-3.5 w-3.5 text-primary" /> Blog
            </Link>
          </div>
        </nav>

        {/* Interactive Watch Blueprint Model Switcher Bar */}
        <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6">
          <div className="flex snap-x items-center gap-2.5 overflow-x-auto rounded-lg border border-primary/10 bg-card/70 p-2 backdrop-blur">
            <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              <Layers className="mr-1 inline h-3.5 w-3.5" />
              Esquema 3D:
            </span>
            {WATCH_MODELS.map((m) => {
              const active = m.id === activeModel.id;
              return (
                <Button variant="ghost" size="sm"
                  key={m.id}
                  onClick={() => setSelectedModelId(m.id)}
                  className={`min-h-11 shrink-0 snap-start rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                    active
                      ? "bg-primary text-primary-foreground shadow-soft"
                      : "text-muted-foreground hover:bg-card hover:text-foreground"
                  }`}
                >
                  {m.shortName} <span className="opacity-65">({m.ref.replace("REF. ", "")})</span>
                </Button>
              );
            })}
          </div>
        </div>

        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-10 pt-8 sm:px-6 lg:grid-cols-[1fr_1.15fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-card/60 px-3 py-1 text-[11px] font-bold tracking-[0.2em] text-muted-foreground backdrop-blur">
              <span>{activeModel.ref}</span>
              <span>·</span>
              <span>{activeModel.brand.toUpperCase()} ARCHITECTURE</span>
            </div>
            <h1 className="mt-4 text-4xl font-black leading-tight sm:text-5xl md:text-7xl">
              {activeModel.name}
            </h1>
            <p className="mt-6 font-serif text-3xl leading-tight md:text-4xl">
              Every <em>part</em>, every store,
              <br />
              one <em>honest</em> price.
            </p>
            <p className="mt-4 max-w-md text-muted-foreground">
              Pasa el ratón sobre el <strong>{activeModel.brand} {activeModel.name}</strong> (o pulsa{" "}
              <em>"Fijar Despiece 3D"</em>) para separar sus 6 capas isométricas. Pasa por cada pin numerado para
              previsualizar el ahorro OEM vs Aftermarket o haz clic para filtrar la pieza abajo.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button variant="ghost" size="sm"
                onClick={() => {
                  setQuery(activeModel.searchKeyword);
                  setCategories([]);
                  resultsRef.current?.scrollIntoView({ behavior: "smooth" });
                }}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition hover:opacity-95"
              >
                Ver piezas de {activeModel.shortName} <ArrowUpRight className="h-4 w-4" />
              </Button>
              <a
                href="#comparator"
                className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card/75 px-5 py-3 text-sm font-bold backdrop-blur transition hover:bg-card"
              >
                <Scale className="h-4 w-4" /> Comparador 1:1
              </a>
            </div>
          </div>

          <ExplodedWatch model={activeModel} onSelect={selectFromWatch} />
        </div>

        {/* Dynamic Technical Specs Bar */}
        <div className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 sm:pb-12">
          <div className="grid grid-cols-2 gap-5 rounded-lg border border-primary/10 bg-card/60 p-6 backdrop-blur md:grid-cols-4">
            {dynamicSpecs.map(({ icon: Icon, k, v }) => (
              <div key={k} className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-primary/20 bg-card/60">
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.15em]">{k}</p>
                  <p className="text-sm font-medium text-muted-foreground">{v}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* GLOBAL SEARCH & RESULTS GRID SECTION */}
      <section id="search" ref={resultsRef} className="mx-auto max-w-7xl scroll-mt-6 px-4 py-10 sm:px-6 sm:py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-4xl md:text-5xl">
              Find the <em>right</em> part.
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Busca por modelo, calibre o pieza. Cada tarjeta muestra la barra comparativa de ahorro OEM vs Aftermarket.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border bg-card px-4 py-2.5 text-xs shadow-soft">
            {isPro ? (
              <span className="inline-flex items-center gap-1.5 font-bold text-foreground">
                <Crown className="h-4 w-4 text-amber" /> Plan Atelier PRO: Búsquedas Extensas y Referencias OEM Ilimitadas
              </span>
            ) : (
              <>
                <div>
                  <p className="font-bold">
                    {user ? `Plan Particular (Gratis): ${FREE_SEARCH_LIMIT - searchesUsed} de ${FREE_SEARCH_LIMIT} búsquedas extensas hoy` : "Búsqueda gratuita · Sin registro"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Favoritos guardados: {savedIds.length}/{FREE_FAV_LIMIT} piezas
                  </p>
                </div>
                <Button variant="ghost" size="sm"
                  onClick={() => setShowPricingModal(true)}
                  className="rounded-full bg-accent px-3 py-1.5 text-[11px] font-black text-accent-foreground transition hover:opacity-90"
                >
                  Desbloquear PRO
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Search Input Bar */}
        <div className="mt-6 flex flex-wrap items-center gap-3 rounded-lg border-2 border-primary/30 bg-card p-3 shadow-soft sm:p-4 focus-within:ring-2 focus-within:ring-ring">
          <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Busca por modelo, calibre o pieza..."
            aria-label="Busca por modelo, calibre o pieza"
            className="h-14 min-w-0 flex-1 basis-48 bg-transparent text-base outline-none placeholder:text-muted-foreground"
          />
          {query && (
            <Button variant="ghost" size="sm"
              onClick={() => setQuery("")}
              className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-muted-foreground hover:text-foreground"
            >
              Limpiar
            </Button>
          )}
          <Button variant="ghost" size="sm"
            onClick={() => runExtendedSearch(query || activeModel.searchKeyword)}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-xs font-bold text-primary-foreground transition hover:opacity-90"
          >
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            Búsqueda Extensa
          </Button>
        </div>

        {/* Quick Search Chips */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold text-muted-foreground">Búsquedas rápidas:</span>
          {QUICK_SEARCHES.map((item) => (
            <Button variant="ghost" size="sm"
              key={item}
              onClick={() => { setQuery(item); resultsRef.current?.scrollIntoView({ behavior: "smooth" }); }}
              className="rounded-full border bg-card/70 px-3 py-1 font-medium transition hover:border-primary/40 hover:bg-card"
            >
              {item}
            </Button>
          ))}
        </div>

        {/* Direct External Multi-Store Launcher when user types any query */}
        {query.trim().length > 0 && (
          <div className="mt-5 space-y-3 rounded-2xl border border-primary/15 bg-secondary/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-bold">
                <ExternalLink className="h-4 w-4" />
                <span>
                  Tiendas Particulares (Gratis) para <em>"{query}"</em>:
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {(["eBay", "AliExpress", "Chrono24"] as const).map((store) => (
                  <a
                    key={store}
                    href={getStoreSearchUrl(store, query)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-card px-3.5 py-1.5 text-xs font-bold shadow-soft transition hover:bg-accent"
                  >
                    <span>Buscar en {store}</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-primary/10 pt-3">
              <div className="flex items-center gap-2 text-xs font-bold">
                <Crown className="h-4 w-4 text-primary" />
                <span>
                  Tiendas de Nicho &amp; Mayoristas B2B (Plan Atelier PRO) para <em>"{query}"</em>:
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {NICHE_PRO_STORES.map((store) =>
                  isPro ? (
                    <a
                      key={store}
                      href={getStoreSearchUrl(store, query)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground shadow-soft transition hover:bg-accent hover:text-accent-foreground"
                    >
                      <Crown className="h-3 w-3 text-accent" />
                      <span>{store === "Alibaba" ? "Alibaba (Mayorista B2B)" : `${store} (Nicho PRO)`}</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <Button variant="ghost" size="sm"
                      key={store}
                      onClick={() => {
                        openPricing();
                        triggerToast(`Activa Atelier PRO para buscar lotes y fornituras en ${store}.`);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-card/80 px-3.5 py-1.5 text-xs font-bold text-muted-foreground transition hover:border-primary hover:text-foreground"
                    >
                      <Lock className="h-3 w-3" />
                      <span>{store === "Alibaba" ? "Alibaba B2B" : store} · PRO</span>
                    </Button>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {/* Origin Filter */}
        <div className="mt-6 flex flex-wrap gap-2">
          {ORIGINS.map((o) => (
            <Button variant="ghost" size="sm"
              key={o.id}
              onClick={() => setOrigin(o.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                origin === o.id ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-muted"
              }`}
            >
              {o.label}
            </Button>
          ))}
        </div>

        {/* Store / Channel Filter (including PRO Niche & Wholesale Stores) */}
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl border border-primary/10 bg-card/70 p-2.5">
          <span className="px-2 text-[11px] font-black uppercase tracking-wider text-muted-foreground">
            Tiendas y Canales:
          </span>
          <Button variant="ghost" size="sm"
            onClick={() => setStoreFilter("all")}
            className={`rounded-full px-3 py-1 text-xs font-bold transition ${
              storeFilter === "all" ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-muted"
            }`}
          >
            Todas (7 tiendas)
          </Button>
          {(["eBay", "AliExpress", "Chrono24"] as const).map((st) => (
            <Button variant="ghost" size="sm"
              key={st}
              onClick={() => setStoreFilter(storeFilter === st ? "all" : st)}
              className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                storeFilter === st ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-muted"
              }`}
            >
              {st}
            </Button>
          ))}
          <span className="mx-1 h-4 w-px bg-border" />
          <Button variant="ghost" size="sm"
            onClick={() => {
              setStoreFilter(storeFilter === "niche-pro" ? "all" : "niche-pro");
              if (!isPro) {
                triggerToast(
                  "Mostrando vista previa de Tiendas de Nicho PRO (Alibaba, WatchPlaza, NamokiMods, CousinsUK)."
                );
              }
            }}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-black transition ${
              storeFilter === "niche-pro"
                ? "bg-accent text-accent-foreground shadow-soft"
                : "border border-primary/20 bg-secondary/80 hover:border-primary"
            }`}
          >
            <Crown className="h-3.5 w-3.5" />
            <span>Tiendas Nicho &amp; Mayoristas PRO</span>
          </Button>
          {NICHE_PRO_STORES.map((st) => (
            <Button variant="ghost" size="sm"
              key={st}
              onClick={() => {
                setStoreFilter(storeFilter === st ? "all" : st);
                if (!isPro) {
                  triggerToast(`Canal ${st}: Activa el Plan Atelier PRO para acceso directo a mayoristas y fornituras.`);
                }
              }}
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold transition ${
                storeFilter === st
                  ? "bg-accent text-accent-foreground"
                  : "border border-dashed border-primary/25 bg-card hover:border-primary"
              }`}
            >
              {!isPro && <Lock className="h-2.5 w-2.5 opacity-70" />}
              <span>{st === "Alibaba" ? "Alibaba B2B" : st}</span>
            </Button>
          ))}
        </div>

        {/* Category Filter */}
        <div className="mt-3 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Button variant="ghost" size="sm"
              key={c.id}
              onClick={() => toggleCat(c.id)}
              className={`rounded-full border px-4 py-1.5 text-sm transition ${
                categories.includes(c.id)
                  ? "border-accent bg-accent font-bold text-accent-foreground"
                  : "hover:border-primary/40"
              }`}
            >
              {c.label}
            </Button>
          ))}
          {categories.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setCategories([])} className="px-2 text-sm text-muted-foreground underline">
              Clear
            </Button>
          )}
        </div>

        {/* Price Slider + Currency Switcher */}
        <div className="mt-6 flex flex-wrap items-center gap-6">
          <label className="flex w-full min-w-0 items-center gap-3 text-sm font-medium sm:w-auto">
            Max price
            <input
              type="range"
              min={5}
              max={MAX_PRICE}
              value={maxPrice}
              onChange={(e) => setMaxPrice(+e.target.value)}
              className="min-w-0 flex-1 accent-primary"
            />
            <span className="w-20 font-bold">{fmt(maxPrice, currency)}</span>
          </label>
          <div className="flex rounded-full bg-secondary p-1 text-xs font-bold">
            {(["EUR", "USD"] as const).map((c) => (
              <Button variant="ghost" size="sm"
                key={c}
                onClick={() => setCurrency(c)}
                className={`rounded-full px-3 py-1 ${currency === c ? "bg-card shadow-soft" : ""}`}
              >
                {c}
              </Button>
            ))}
          </div>
          <span className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
            {isLoadingApi && (
              <span className="rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-black text-accent-foreground">
                Consultando API Live (:8765)...
              </span>
            )}
            {!isLoadingApi && apiResults.length > 0 && query.trim().length >= 3 && (
              <span className="rounded-full border border-primary/15 bg-card px-2.5 py-0.5 text-[10px] font-bold text-foreground">
                Motor Live API Activo ({apiResults.length} en vivo)
              </span>
            )}
            <span>{displayedParts.length} results</span>
          </span>
        </div>

        {/* Results Grid */}
        <div className="mt-10 grid gap-5 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {displayedParts.map((p) => {
            const pairPrices = p.pairGroupId ? groupPriceSummary[p.pairGroupId] : undefined;
            return (
              <PartCard
                key={p.id}
                p={p}
                currency={currency}
                isSaved={savedIds.includes(p.id)}
                isPro={isPro}
                hasAlert={alerts.some((a) => a.partId === p.id)}
                oemCounterpartEur={pairPrices?.oemMin}
                genericCounterpartEur={pairPrices?.genericMin}
                onToggleSave={() => toggleSavePart(p)}
                onAlert={() => handleCreateAlert(p)}
                onCompare={p.pairGroupId ? () => { if (p.pairGroupId) openComparatorFor(p.pairGroupId); } : undefined}
                onUnlockPro={() => setShowPricingModal(true)}
              />
            );
          })}
          {displayedParts.length === 0 && (
            <p className="col-span-full py-16 text-center font-serif text-2xl text-muted-foreground">
              No parts match — try widening your filters or write a model name above.
            </p>
          )}
        </div>
      </section>

      {/* SIDE-BY-SIDE 1:1 HOROLOGICAL DUEL SECTION */}
      <section id="comparator" ref={comparatorRef} className="mx-auto max-w-7xl scroll-mt-6 px-4 py-10 sm:px-6 sm:py-16">
        <div className="rounded-3xl border border-primary/15 bg-card p-6 shadow-soft md:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b pb-5">
            <div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                <Scale className="h-3.5 w-3.5" /> DUELO TÉCNICO 1:1 · OEM CERTIFICADO VS AFTERMARKET COMPATIBLE
              </span>
              <h2 className="mt-1 font-serif text-3xl md:text-4xl">
                ¿Vale la pena el recambio <em>original</em> o el <em>aftermarket</em>?
              </h2>
            </div>

            {/* Selector of component group to compare */}
            <div className="flex flex-wrap gap-1.5">
              {PAIR_GROUPS.map((pg) => (
                <Button variant="ghost" size="sm"
                  key={pg.id}
                  onClick={() => setCompareGroup(pg.id)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                    compareGroup === pg.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {pg.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Side-by-Side Comparison Cards */}
          <div className="mt-6 grid gap-5 sm:gap-6 lg:grid-cols-2">
            {comparedParts.slice(0, 2).map((cp) => {
              const isOem = cp.origin === "oem";
              const otherPart = comparedParts.find((x) => x.id !== cp.id);
              const priceDiffPct =
                !isOem && otherPart && otherPart.priceEur > cp.priceEur
                  ? Math.round(((otherPart.priceEur - cp.priceEur) / otherPart.priceEur) * 100)
                  : null;

              return (
                <div
                  key={cp.id}
                  className={`flex flex-col justify-between rounded-2xl border-2 p-5 transition ${
                    isOem ? "border-champagne bg-background/70" : "border-accent bg-background/70"
                  }`}
                >
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black ${
                          isOem ? "bg-champagne text-foreground" : "bg-accent text-accent-foreground"
                        }`}
                      >
                        {isOem ? (
                          <>
                            <Award className="h-3.5 w-3.5" /> OPCIÓN A · ORIGINAL OEM ({cp.store})
                          </>
                        ) : (
                          <>
                            <Wrench className="h-3.5 w-3.5" /> OPCIÓN B · AFTERMARKET 1:1 ({cp.store})
                          </>
                        )}
                      </span>

                      {priceDiffPct && (
                        <span className="rounded-full bg-primary px-3 py-1 text-xs font-black text-primary-foreground">
                          Ahorras {priceDiffPct}% ({fmt((otherPart?.priceEur ?? 0) - cp.priceEur, currency)})
                        </span>
                      )}
                    </div>

                    <div className="mt-4 flex items-center gap-4">
                      <img src={cp.image} alt={cp.title} className="h-20 w-20 shrink-0 rounded-2xl object-cover" />
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                          {cp.brand} · {cp.spec}
                        </p>
                        <h3 className="mt-0.5 text-lg font-bold leading-snug">{cp.title}</h3>
                        <p className="mt-1 text-2xl font-black">{fmt(cp.priceEur, currency)}</p>
                      </div>
                    </div>

                    {/* Technical Specs Breakdown */}
                    <div className="mt-4 space-y-2 rounded-xl border bg-card p-3.5 text-xs">
                      <div className="flex justify-between gap-4">
                        <span className="font-bold text-muted-foreground">Material y Acabado:</span>
                        <span className="text-right font-medium">
                          {cp.materialSpec ?? cp.spec}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4 border-t pt-2">
                        <span className="font-bold text-muted-foreground">Tolerancia y Encaje:</span>
                        <span className="text-right font-medium">
                          {cp.toleranceSpec ?? "Ajuste verificado"}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4 border-t pt-2">
                        <span className="font-bold text-muted-foreground">Impacto Valor Reloj:</span>
                        <span className="text-right font-bold">
                          {cp.resaleImpact ?? (isOem ? "Mantiene 100% valor" : "Uso diario / Mod")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 pt-2">
                    <Button variant="ghost" size="sm"
                      onClick={() => toggleSavePart(cp)}
                      className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-bold hover:bg-secondary"
                    >
                      <Heart
                        className={`h-3.5 w-3.5 ${
                          savedIds.includes(cp.id) ? "fill-destructive text-destructive" : ""
                        }`}
                      />
                      {savedIds.includes(cp.id) ? "Guardado en Mi Caja" : "Guardar en Mi Caja"}
                    </Button>

                    <a
                      href={cp.customUrl ?? getStoreSearchUrl(cp.store, `${cp.brand} ${cp.title}`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-xs font-bold text-primary-foreground transition hover:bg-accent hover:text-accent-foreground"
                    >
                      Comprar en {cp.store} <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* AI DAILY DEALS / CHOLLOS DIARIOS SECTION (eBay, Wallapop, Chrono24, Todocolección) */}
      <section id="chollos" ref={chollosRef} className="border-t bg-secondary/20 py-10 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-amber-800">
                <Flame className="h-3.5 w-3.5 text-amber-600" /> Radar IA de Oportunidades · Actualizado Hoy
              </span>
              <h2 className="mt-2 font-serif text-4xl">
                Buscador IA de <em>"Chollos Diarios"</em>
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Nuestro motor IA cruza precios históricos de liquidación frente a anuncios recién publicados en{" "}
                <strong>Wallapop</strong>, <strong>eBay Subastas</strong>, <strong>Chrono24</strong> y{" "}
                <strong>Todocolección</strong>: relojes completos con descuento, lotes de relojero jubilado y piezas
                para restaurar o hacer <em>flip</em>.
              </p>
            </div>

            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
              <div className="relative flex-1 sm:w-72">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={cholloQuery}
                  onChange={(e) => setCholloQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") runLiveCholloScan();
                  }}
                  placeholder="Ej. Omega Seamaster, Seiko, lote..."
                  className="w-full rounded-full border bg-card py-2.5 pl-10 pr-4 text-xs outline-none focus:border-primary"
                />
              </div>
              <Button variant="ghost" size="sm"
                onClick={() => runLiveCholloScan()}
                disabled={isScanningChollos}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground transition hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
              >
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                <span>{isScanningChollos ? "Escaneando con IA..." : "Escanear Chollos en Vivo"}</span>
              </Button>
            </div>
          </div>

          {/* Platform filter pills */}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            {(
              [
                { id: "all" as const, label: "Todas las Plataformas", badge: "Top IA" },
                ...CHOLLO_PLATFORMS.map((p) => ({
                  id: p,
                  label: p,
                  badge: p === "Wallapop" ? "Trato directo" : p === "eBay" ? "Subastas" : p === "Todocolección" ? "Lotes" : "Verificado",
                })),
              ]
            ).map((plat) => {
              const active = cholloPlatform === plat.id;
              return (
                <Button variant="ghost" size="sm"
                  key={plat.id}
                  onClick={() => setCholloPlatform(plat.id)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition ${
                    active
                      ? "bg-primary text-primary-foreground shadow-soft"
                      : "border border-primary/15 bg-card text-foreground hover:bg-secondary"
                  }`}
                >
                  <span>{plat.label}</span>
                  <span className="rounded-full bg-secondary/80 px-2 py-0.5 text-[10px] font-black text-foreground">
                    {plat.badge}
                  </span>
                </Button>
              );
            })}
          </div>

          {/* Chollos Grid */}
          <div className="mt-8 grid gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
            {displayedChollos.map((deal, idx) => {
              const isLockedProDeal = Boolean(deal.proEarlyAccess && !isPro);
              const platformColor =
                deal.platform === "Wallapop"
                  ? "bg-teal-600 text-white"
                  : deal.platform === "Todocolección"
                  ? "bg-purple-700 text-white"
                  : deal.platform === "eBay"
                  ? "bg-store-ebay text-primary-foreground"
                  : "bg-store-chrono text-primary-foreground";

              return (
                <article
                  key={deal.id}
                  className={`group flex flex-col overflow-hidden rounded-3xl border bg-card transition hover:-translate-y-1 hover:shadow-soft ${
                    deal.proEarlyAccess ? "border-amber-500/40 ring-1 ring-amber-500/25" : ""
                  }`}
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-muted">
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
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                    <div className="absolute left-3 top-3 flex flex-wrap gap-1.5 pr-12">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${platformColor}`}>
                        {deal.platform}
                      </span>
                      <span className="rounded-full bg-card/90 px-2.5 py-1 text-[10px] font-bold text-foreground backdrop-blur-xs">
                        {deal.dealType}
                      </span>
                      {deal.proEarlyAccess && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[10px] font-black text-accent">
                          <Crown className="h-2.5 w-2.5" /> VIP PRO
                        </span>
                      )}
                    </div>

                    <div className="absolute right-3 top-3 flex flex-col items-end gap-1">
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-[11px] font-black text-slate-950 shadow">
                        <Flame className="h-3 w-3 fill-current" /> {(deal.cholloScore ?? 9.0).toFixed(1)}/10
                      </span>
                      <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-black text-white shadow">
                        -{deal.savingsPct}% bajo mercado
                      </span>
                    </div>

                    <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between rounded-full bg-foreground/80 px-3 py-1 text-[10px] font-bold text-background backdrop-blur-xs">
                      <span className="truncate">{deal.location}</span>
                      <span className="inline-flex shrink-0 items-center gap-1 text-accent">
                        <Clock className="h-2.5 w-2.5" /> {deal.timeLeft}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-5 sm:p-6">
                    <div className="flex items-center justify-between gap-2 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                      <span>
                        {deal.brand} · {deal.calibreRef ?? "Calibre Mecánico"}
                      </span>
                      <span className="rounded bg-secondary px-1.5 py-0.5 text-foreground">{deal.condition}</span>
                    </div>

                    <h3 className="mt-1.5 font-medium leading-snug">{deal.title}</h3>

                    {/* Market comparison box */}
                    <div className="mt-3 rounded-2xl border border-emerald-600/20 bg-emerald-500/5 p-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Precio anuncio:</span>
                        <span className="text-base font-black text-foreground">{fmt(deal.priceEur, currency)}</span>
                      </div>
                      <div className="mt-0.5 flex items-center justify-between">
                        <span className="text-muted-foreground">Valor mercado IA:</span>
                        <span className="font-bold text-muted-foreground line-through">
                          {fmt(deal.marketValueEur, currency)}
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-center justify-between border-t border-emerald-600/15 pt-1.5 font-black text-emerald-700">
                        <span className="inline-flex items-center gap-1">
                          <TrendingUp className="h-3.5 w-3.5" /> Margen / Ahorro IA:
                        </span>
                        <span>+{fmt(deal.profitMarginEur, currency)}</span>
                      </div>
                    </div>

                    <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
                      <strong className="text-foreground">Veredicto IA:</strong> {deal.aiVerdict}
                    </p>

                    <div className="mt-auto pt-4">
                      {isLockedProDeal ? (
                        <Button variant="ghost" size="sm"
                          onClick={() => {
                            openPricing();
                            triggerToast("Los chollos con Score > 9.3/10 están reservados para miembros Atelier PRO.");
                          }}
                          className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-accent px-4 py-2.5 text-xs font-black text-accent-foreground transition hover:bg-primary hover:text-primary-foreground"
                        >
                          <Lock className="h-3.5 w-3.5" /> Desbloquear Chollo VIP ({deal.platform})
                        </Button>
                      ) : (
                        <a
                          href={deal.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground transition group-hover:bg-accent group-hover:text-accent-foreground"
                        >
                          <span>Cazar Chollo en {deal.platform}</span>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* VIP WHATSAPP COMMUNITY BANNER (LOCKED FOR FREE / UNLOCKED FOR PRO) */}
          <div
            id="comunidad-whatsapp"
            className="mt-12 overflow-hidden rounded-3xl border-2 border-emerald-600/30 bg-gradient-to-r from-card via-emerald-950/5 to-card p-8 shadow-soft"
          >
            <div className="grid items-center gap-8 lg:grid-cols-[1.35fr_1fr]">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-3.5 py-1 text-[11px] font-black uppercase tracking-wider text-white">
                  <MessageCircle className="h-3.5 w-3.5" /> Comunidad Privada · Exclusivo Atelier PRO
                </div>
                <h3 className="mt-3 font-serif text-3xl md:text-4xl">
                  Grupo VIP de WhatsApp: Alertas de Chollos en Tiempo Real
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Los mejores chollos de <strong>Wallapop</strong>, <strong>Todocolección</strong> y{" "}
                  <strong>eBay</strong> duran menos de 15 minutos publicados. Los miembros de{" "}
                  <strong>Atelier PRO</strong> reciben el enlace directo en su móvil nada más detectarlo el bot, además
                  de acceso al canal de compraventa de fornituras sin comisiones entre relojeros y coleccionistas.
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border bg-card/80 p-3.5 text-xs">
                    <p className="font-black text-foreground">⚡ Avisos &lt; 60 seg</p>
                    <p className="mt-1 text-muted-foreground">
                      Notificación instantánea cuando entra un reloj con descuento &gt;35% bajo mercado.
                    </p>
                  </div>
                  <div className="rounded-2xl border bg-card/80 p-3.5 text-xs">
                    <p className="font-black text-foreground">🤝 Trueque &amp; Fornitura</p>
                    <p className="mt-1 text-muted-foreground">
                      Intercambio directo de esferas, calibres ETA/Seiko y eslabones OEM entre miembros verificados.
                    </p>
                  </div>
                  <div className="rounded-2xl border bg-card/80 p-3.5 text-xs">
                    <p className="font-black text-foreground">🔍 Legit Check Exprés</p>
                    <p className="mt-1 text-muted-foreground">
                      Sube fotos de una esfera o calibre antes de pujar y recibe validación de maestros relojeros.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border bg-card p-6 shadow-soft">
                {isPro ? (
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600/15 px-3 py-1 text-xs font-black text-emerald-700">
                        <Check className="h-3.5 w-3.5" /> ACCESO VIP DESBLOQUEADO
                      </span>
                      <span className="text-xs font-bold text-muted-foreground">248 miembros activos</span>
                    </div>
                    <h4 className="mt-3 font-serif text-2xl">Bienvenido al Club Atelier PRO</h4>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Tu suscripción PRO incluye acceso directo a los 3 canales oficiales de WhatsApp:
                    </p>
                    <div className="mt-4 space-y-2 text-xs">
                      <label className="flex cursor-pointer items-center justify-between rounded-xl border bg-secondary/40 px-3.5 py-2.5">
                        <span className="font-bold">🔔 Recibir alertas push de Chollos (&gt;8.5/10)</span>
                        <input
                          type="checkbox"
                          checked={whatsappInstantAlerts}
                          onChange={(e) => {
                            if (!requireAccount()) return;
                            const enabled = e.target.checked;
                            void savePersonal({ whatsapp_alerts: enabled }).then(ok => { if (ok) setWhatsappInstantAlerts(enabled); });
                            triggerToast(
                              e.target.checked
                                ? "Alertas instantáneas de WhatsApp activadas."
                                : "Alertas de WhatsApp silenciadas temporalmente."
                            );
                          }}
                          className="h-4 w-4 accent-emerald-600"
                        />
                      </label>
                    </div>
                    <div className="mt-5 flex flex-col gap-2.5">
                      <a
                        href="https://chat.whatsapp.com/ChronoPartsAtelierVIP"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-xs font-black text-white transition hover:bg-emerald-700"
                      >
                        <MessageCircle className="h-4 w-4" /> Entrar al Grupo VIP de WhatsApp Ahora
                        <ArrowUpRight className="h-4 w-4" />
                      </a>
                      <Button variant="ghost" size="sm"
                        onClick={() => openWhatsapp()}
                        className="rounded-full border py-2 text-xs font-bold hover:bg-secondary"
                      >
                        Ver normas del club y canales por marca
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-amber-500/15 text-amber-700">
                      <Lock className="h-5 w-5" />
                    </div>
                    <span className="mt-2 inline-block rounded-full bg-secondary px-3 py-0.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Exclusivo Plan de Pago · Atelier PRO
                    </span>
                    <h4 className="mt-2 font-serif text-2xl">Acceso Bloqueado en Plan Gratis</h4>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      Para evitar spam y proteger los chollos frente a revendedores masivos, el enlace de invitación al
                      Grupo de WhatsApp solo está disponible para suscriptores de <strong>Atelier PRO</strong>.
                    </p>
                    <Button variant="ghost" size="sm"
                      onClick={() => {
                        openWhatsapp();
                      }}
                      className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-xs font-black text-primary-foreground transition hover:bg-accent hover:text-accent-foreground"
                    >
                      <Crown className="h-4 w-4 text-accent" /> Desbloquear Club WhatsApp con Atelier PRO
                    </Button>
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      Incluido sin coste extra dentro de tu suscripción Atelier PRO (9,90 €/mes).
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FREEMIUM VS PRO PRICING SECTION */}
      <section className="border-t bg-card/50 py-10 sm:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
              PLANES PARA PARTICULARES Y COLECCIONISTAS
            </span>
            <h2 className="mt-2 font-serif text-4xl md:text-5xl">
              Empieza <em>gratis</em>, escala tu taller con <em>Atelier PRO</em>.
            </h2>
          </div>

          <div className="mt-10 grid gap-8 md:grid-cols-2">
            <div className="flex flex-col rounded-3xl border bg-card p-5 sm:p-6 shadow-soft">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold">Particular / Aficionado</span>
                <span className="text-2xl font-black">0 € / siempre</span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Ideal para encontrar una correa, cristal o recambio puntual para tu reloj personal.
              </p>
              <ul className="mt-6 space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" /> Hasta <strong>5 búsquedas extensas</strong> al día en eBay, AliExpress y Chrono24
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" /> Guarda hasta <strong>3 componentes favoritos</strong> en Mi Caja
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" /> Despiece interactivo 3D de los 4 relojes y comparador 1:1
                </li>
              </ul>
              <Button variant="ghost" size="sm"
                onClick={() => togglePlan(false)}
                className={`mt-8 w-full rounded-full py-3 text-xs font-bold transition ${
                  !isPro ? "bg-secondary text-foreground" : "border border-primary/20 hover:bg-secondary"
                }`}
              >
                {!isPro ? "Tu Plan Actual" : "Volver al Plan Gratis"}
              </Button>
            </div>

            <div className="relative flex flex-col rounded-3xl border-2 border-primary bg-card p-5 sm:p-6 shadow-soft">
              <span className="absolute -top-3 right-6 rounded-full bg-accent px-3 py-1 text-[10px] font-black uppercase tracking-wider text-accent-foreground">
                Más Popular · Modders & Coleccionistas
              </span>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
                  <Crown className="h-3.5 w-3.5 text-accent" /> Atelier PRO
                </span>
                <div className="text-right">
                  <span className="text-2xl font-black">{currency === "EUR" ? "9,90 €" : "$10.90"}</span>
                  <span className="text-xs text-muted-foreground"> / mes</span>
                </div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Para apasionados de la relojería, restauradores vintage y creadores de mods que buscan el mejor precio.
              </p>
              <ul className="mt-6 space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" /> <strong>Tiendas de Nicho y Mayoristas B2B:</strong> Alibaba, WatchPlaza, NamokiMods y CousinsUK
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" /> <strong>Búsquedas ilimitadas</strong> multi-tienda + códigos de referencia OEM exactos
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" /> <strong>Mi Caja Ilimitada</strong>: guarda todos los componentes que te gustan y calcula presupuestos
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" /> <strong>Radar y Alertas de Precio NOS</strong> + <strong>Matriz de Compatibilidad Cruzada</strong>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600" /> <strong>Acceso al Club VIP de WhatsApp PRO:</strong> Alertas móviles instantáneas de chollos y compraventa privada
                </li>
              </ul>
              <Button variant="ghost" size="sm"
                onClick={() => togglePlan(true)}
                className="mt-8 w-full rounded-full bg-primary py-3 text-xs font-bold text-primary-foreground transition hover:bg-accent hover:text-accent-foreground"
              >
                {isPro ? "Plan Atelier PRO Activo ✓" : "Activar Prueba Atelier PRO Gratis"}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* BLOG & HOROLOGICAL GUIDES SECTION */}
      <section id="blog" className="border-t py-10 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-primary">
                <BookOpen className="h-3.5 w-3.5" /> Blog · Guías de Taller &amp; Compatibilidad
              </span>
              <h2 className="mt-2 font-serif text-3xl sm:text-4xl">
                Blog de Relojería &amp; <em>Guías Técnicas</em>
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Artículos técnicos de taller para coleccionistas, relojeros y modders: tablas de equivalencia de
                calibres, referencias OEM certificadas y medidas exactas de recambios.
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <Link
                to="/blog"
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground transition hover:bg-accent hover:text-accent-foreground"
              >
                <span>Ir al Blog</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
            {SEO_BLOG_ARTICLES.map((art, idx) => (
              <article
                key={art.slug}
                className="group flex flex-col justify-between overflow-hidden rounded-3xl border bg-card transition hover:-translate-y-1 hover:shadow-soft"
              >
                <div>
                  <div className="relative aspect-[16/10] overflow-hidden bg-muted">
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
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                    <div className="absolute left-3 top-3">
                      <span className="rounded-full bg-card/90 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-foreground backdrop-blur-xs">
                        {art.category}
                      </span>
                    </div>
                    <div className="absolute bottom-2.5 right-3 rounded-full bg-foreground/80 px-2.5 py-0.5 text-[10px] font-bold text-background backdrop-blur-xs">
                      {art.readTime}
                    </div>
                  </div>

                  <div className="p-5 pb-0">
                    <h3 className="font-serif text-lg leading-snug">{art.title}</h3>
                    <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground">{art.summary}</p>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {(art.targetKeywords ?? []).slice(0, 2).map((kw) => (
                        <span
                          key={kw}
                          className="rounded-md bg-secondary/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                        >
                          #{kw}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="m-5 mb-5 mt-4 flex items-center justify-between border-t pt-4">
                  <Button variant="ghost" size="sm"
                    onClick={() => setActiveBlogArticle(art)}
                    className="inline-flex items-center gap-1 text-xs font-black text-primary hover:underline"
                  >
                    Leer Artículo <ArrowUpRight className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm"
                    onClick={() => {
                      setQuery(art.relatedSearchQuery);
                      resultsRef.current?.scrollIntoView({ behavior: "smooth" });
                      triggerToast(`Cargando piezas del artículo: ${art.relatedSearchQuery}`);
                    }}
                    className="rounded-full bg-secondary px-3 py-1 text-[10px] font-bold hover:bg-primary hover:text-primary-foreground"
                  >
                    Ver piezas
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* VIP WHATSAPP CLUB MODAL */}
      {showWhatsappModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/50 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-xl rounded-3xl border bg-card p-5 sm:p-6 shadow-2xl">
            <Button variant="ghost" size="sm"
              onClick={() => setShowWhatsappModal(false)}
              className="absolute right-5 top-5 rounded-full bg-secondary p-2"
            >
              <X className="h-4 w-4" />
            </Button>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-3 py-1 text-xs font-black text-white">
              <MessageCircle className="h-3.5 w-3.5" /> CLUB WHATSAPP ATELIER PRO
            </div>
            {isPro ? (
              <>
                <h3 className="mt-3 font-serif text-3xl">Canales VIP Desbloqueados</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Como miembro <strong>Atelier PRO</strong>, tienes acceso inmediato a nuestros grupos moderados de
                  WhatsApp:
                </p>
                <div className="mt-5 space-y-3">
                  <a
                    href="https://chat.whatsapp.com/ChronoPartsChollosFlash"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-2xl border p-4 transition hover:border-emerald-600 hover:bg-emerald-500/5"
                  >
                    <div>
                      <p className="text-sm font-black">🔥 Canal #1 · Alertas Flash Wallapop &amp; eBay (&lt;60s)</p>
                      <p className="text-xs text-muted-foreground">
                        Bot automatizado IA de chollos por debajo del 35% de valor de mercado.
                      </p>
                    </div>
                    <ExternalLink className="h-4 w-4 shrink-0 text-emerald-600" />
                  </a>
                  <a
                    href="https://chat.whatsapp.com/ChronoPartsFornituraP2P"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-2xl border p-4 transition hover:border-emerald-600 hover:bg-emerald-500/5"
                  >
                    <div>
                      <p className="text-sm font-black">🛠️ Canal #2 · Bolsa Privada de Fornituras &amp; Calibres</p>
                      <p className="text-xs text-muted-foreground">
                        Compraventa sin comisiones de recambios NOS entre relojeros y modders.
                      </p>
                    </div>
                    <ExternalLink className="h-4 w-4 shrink-0 text-emerald-600" />
                  </a>
                </div>
              </>
            ) : (
              <>
                <h3 className="mt-3 font-serif text-3xl">Comunidad Privada para Suscriptores PRO</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  El <strong>Club WhatsApp PRO</strong> está restringido a miembros con plan de pago para garantizar que
                  los chollos diarios de Wallapop, eBay y Todocolección lleguen primero a la comunidad:
                </p>
                <div className="mt-5 space-y-2.5 rounded-2xl bg-secondary/60 p-4 text-sm">
                  <div className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span>Alertas instantáneas en tu móvil cuando el radar IA detecta un Chollo Score &gt; 8.5/10.</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span>Mercado privado P2P de piezas OEM, calibres suizos y relojes completos sin comisiones.</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span>Verificación de autenticidad (Legit Check) por relojeros expertos en menos de 10 minutos.</span>
                  </div>
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button variant="ghost" size="sm"
                    onClick={() => {
                      togglePlan(true);
                    }}
                    className="flex-1 rounded-full bg-emerald-600 py-3 text-xs font-black text-white transition hover:bg-emerald-700"
                  >
                    Activar Atelier PRO y Desbloquear WhatsApp (9,90 €/mes)
                  </Button>
                  <Button variant="ghost" size="sm"
                    onClick={() => setShowWhatsappModal(false)}
                    className="rounded-full border px-5 py-3 text-xs font-bold"
                  >
                    Cerrar
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* SEO BLOG ARTICLE READER MODAL */}
      {activeBlogArticle && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/50 p-4 backdrop-blur-xs">
          <div className="relative max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-3xl border bg-card p-5 sm:p-6 shadow-2xl">
            <Button variant="ghost" size="sm"
              onClick={() => setActiveBlogArticle(null)}
              className="sticky right-0 top-0 float-right rounded-full bg-secondary p-2"
            >
              <X className="h-4 w-4" />
            </Button>
            <span className="rounded-full bg-secondary px-3 py-1 text-[10px] font-black uppercase tracking-wider">
              {activeBlogArticle.category} · {activeBlogArticle.readTime}
            </span>
            <h3 className="mt-3 font-serif text-3xl leading-tight">{activeBlogArticle.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{activeBlogArticle.summary}</p>

            <div className="mt-6 space-y-5 border-t pt-5">
              {activeBlogArticle.sections.map((sec) => (
                <div key={sec.heading}>
                  <h4 className="font-serif text-xl font-bold">{sec.heading}</h4>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{sec.body}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border bg-secondary/40 p-4">
              <p className="text-xs font-black uppercase tracking-wider text-foreground">
                Preguntas Frecuentes de Taller
              </p>
              <div className="mt-3 space-y-3">
                {(activeBlogArticle.faqs ?? []).map((item) => (
                  <div key={item.q} className="text-xs">
                    <p className="font-bold text-foreground">¿{item.q.replace(/^¿/, "")}</p>
                    <p className="mt-0.5 text-muted-foreground">{item.a}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <Button variant="ghost" size="sm"
                onClick={() => {
                  const q = activeBlogArticle.relatedSearchQuery;
                  setActiveBlogArticle(null);
                  setQuery(q);
                  resultsRef.current?.scrollIntoView({ behavior: "smooth" });
                }}
                className="rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground"
              >
                Buscar "{activeBlogArticle.relatedSearchQuery}" en el Comparador
              </Button>
              <Link
                to="/blog"
                onClick={() => setActiveBlogArticle(null)}
                className="text-xs font-bold text-primary hover:underline"
              >
                Ver todas las guías en /blog →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* WATCHBOX / SAVED PARTS DRAWER MODAL */}
      {showWatchbox && (
        <div className="fixed inset-0 z-50 flex justify-end bg-foreground/40 backdrop-blur-xs">
          <div className="flex h-full w-full max-w-lg flex-col bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 fill-destructive text-destructive" />
                <div>
                  <h3 className="font-serif text-2xl">Mi Caja de Componentes</h3>
                  <p className="text-xs text-muted-foreground">
                    {isPro
                      ? `${savedParts.length} piezas guardadas (Ilimitado PRO)`
                      : `${savedParts.length} de ${FREE_FAV_LIMIT} piezas guardadas (Plan Gratis)`}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowWatchbox(false)} className="rounded-full bg-secondary p-2">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1">
              {savedParts.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground">
                  <p className="font-serif text-2xl">Tu caja está vacía</p>
                  <p className="mt-2 text-xs">
                    Pulsa el icono del corazón en cualquier correa, cristal, bisel o calibre para guardarlo aquí y
                    comparar el presupuesto de tu reloj.
                  </p>
                </div>
              ) : (
                savedParts.map((sp) => (
                  <div key={sp.id} className="flex items-center justify-between gap-3 rounded-2xl border p-3">
                    <img src={sp.image} alt={sp.title} className="h-14 w-14 rounded-xl object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-black uppercase text-muted-foreground">
                        {sp.store} · {sp.origin === "oem" ? "OEM Original" : "Aftermarket"}
                      </p>
                      <h4 className="truncate text-sm font-bold">{sp.title}</h4>
                      <p className="text-sm font-black">{fmt(sp.priceEur, currency)}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <a
                        href={sp.customUrl ?? getStoreSearchUrl(sp.store, `${sp.brand} ${sp.title}`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full bg-primary px-3 py-1.5 text-[11px] font-bold text-primary-foreground"
                      >
                        Tienda
                      </a>
                      <Button variant="ghost" size="sm"
                        onClick={() => toggleSavePart(sp)}
                        className="rounded-full bg-secondary p-2 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))
              )}

              {alerts.length > 0 && (
                <div className="mt-6 rounded-2xl border border-amber/40 bg-secondary/50 p-4">
                  <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider">
                    <Bell className="h-3.5 w-3.5" /> Alertas de Precio Activas ({alerts.length})
                  </p>
                  <ul className="mt-2 space-y-1.5 text-xs">
                    {alerts.map((al) => (
                      <li key={al.partId} className="flex justify-between">
                        <span className="truncate pr-2">{al.title}</span>
                        <span className="font-bold">Aviso &lt; {fmt(al.targetEur, currency)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {savedParts.length > 0 && (
              <div className="mt-4 border-t pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Presupuesto total selección:</span>
                  <span className="text-2xl font-black">{fmt(totalSavedEur, currency)}</span>
                </div>
                {totalSavedOemEquivEur > totalSavedEur && (
                  <p className="mt-1 text-xs font-bold text-foreground">
                    ✨ Ahorras {fmt(totalSavedOemEquivEur - totalSavedEur, currency)} frente a comprar todo en OEM oficial (
                    {fmt(totalSavedOemEquivEur, currency)})
                  </p>
                )}
                {!isPro && savedParts.length >= FREE_FAV_LIMIT && (
                  <Button variant="ghost" size="sm"
                    onClick={() => {
                      setShowWatchbox(false);
                      openPricing();
                    }}
                    className="mt-3 w-full rounded-full bg-accent py-2.5 text-xs font-black text-accent-foreground"
                  >
                    Desbloquear Favoritos Ilimitados con Atelier PRO
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* UPGRADE / PRICING MODAL */}
      {showPricingModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/50 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-xl rounded-3xl border bg-card p-5 sm:p-6 shadow-2xl">
            <Button variant="ghost" size="sm"
              onClick={() => setShowPricingModal(false)}
              className="absolute right-5 top-5 rounded-full bg-secondary p-2"
            >
              <X className="h-4 w-4" />
            </Button>
            <div className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-black text-accent-foreground">
              <Crown className="h-3.5 w-3.5" /> CHRONOPARTS ATELIER PRO
            </div>
            <h3 className="mt-3 font-serif text-3xl">Búsquedas más extensas y caja ilimitada</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              El plan gratuito está pensado para búsquedas puntuales de particulares. Con <strong>Atelier PRO</strong>{" "}
              desbloqueas todo el motor de búsqueda horológica:
            </p>
            <div className="mt-5 space-y-3 rounded-2xl bg-secondary/60 p-4 text-sm">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
                <span>
                  <strong>Tiendas de Nicho y Mayoristas B2B:</strong> Acceso directo a <strong>Alibaba B2B</strong>, <strong>WatchPlaza</strong> (OEM NOS), <strong>NamokiMods</strong> y <strong>CousinsUK</strong>.
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
                <span>
                  <strong>Favoritos ilimitados:</strong> Guarda decenas de correas, esferas y calibres por proyecto.
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
                <span>
                  <strong>Referencias OEM desbloqueadas:</strong> Códigos exactos de pieza Rolex, Omega, Tissot y ETA.
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
                <span>
                  <strong>Radar de bajada de precio:</strong> Recibe avisos cuando aparezca un recambio NOS en eBay.
                </span>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button variant="ghost" size="sm"
                onClick={() => {
                  togglePlan(true);
                  setShowPricingModal(false);
                }}
                className="flex-1 rounded-full bg-primary py-3 text-xs font-bold text-primary-foreground transition hover:bg-accent hover:text-accent-foreground"
              >
                Activar Atelier PRO Ahora (Demo Interactiva)
              </Button>
              <Button variant="ghost" size="sm"
                onClick={() => setShowPricingModal(false)}
                className="rounded-full border px-5 py-3 text-xs font-bold"
              >
                Seguir en Plan Gratis
              </Button>
            </div>
          </div>
        </div>
      )}

      <footer className="border-t py-8 text-center text-xs text-muted-foreground">
        ChronoParts · Buscador de componentes OEM, Aftermarket y Mayoristas B2B con fotos 1:1 verificadas · eBay, AliExpress, Chrono24, Alibaba, WatchPlaza, NamokiMods y CousinsUK
      </footer>
    </div>
  );
}

function fmt(eur: number, c: "EUR" | "USD") {
  const v = c === "EUR" ? eur : eur * 1.08;
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: c,
    maximumFractionDigits: v < 100 ? 2 : 0,
  }).format(v);
}

const STORE_BADGE: Record<Part["store"], string> = {
  AliExpress: "bg-store-ali text-primary-foreground",
  eBay: "bg-store-ebay text-primary-foreground",
  Chrono24: "bg-store-chrono text-primary-foreground",
  Alibaba: "bg-amber-600 text-white",
  WatchPlaza: "bg-emerald-800 text-white",
  NamokiMods: "bg-indigo-700 text-white",
  CousinsUK: "bg-slate-800 text-white",
};

const QUALITY: Record<Part["store"], string> = {
  AliExpress: "Generic / Aftermarket",
  eBay: "Vintage / Original OEM",
  Chrono24: "Certified OEM",
  Alibaba: "Mayorista B2B / Factory",
  WatchPlaza: "Nicho OEM NOS Certificado",
  NamokiMods: "Nicho Seiko Mod Premium",
  CousinsUK: "Fornitura Técnica UK",
};

function PartCard({
  p,
  currency,
  isSaved,
  isPro,
  hasAlert,
  oemCounterpartEur,
  genericCounterpartEur,
  onToggleSave,
  onAlert,
  onCompare,
  onUnlockPro,
}: {
  p: Part;
  currency: "EUR" | "USD";
  isSaved: boolean;
  isPro: boolean;
  hasAlert: boolean;
  oemCounterpartEur?: number | undefined;
  genericCounterpartEur?: number | undefined;
  onToggleSave: () => void;
  onAlert: () => void;
  onCompare?: (() => void) | undefined;
  onUnlockPro: () => void;
}) {
  const refOemPrice = p.equivalentOemPriceEur ?? oemCounterpartEur;
  const savingsPct =
    p.origin === "generic" && refOemPrice && refOemPrice > p.priceEur
      ? Math.round(((refOemPrice - p.priceEur) / refOemPrice) * 100)
      : null;

  const storeUrl = p.customUrl ?? getStoreSearchUrl(p.store, `${p.brand === "Generic" ? "" : p.brand} ${p.title}`);
  const isNicheStore = isNicheProStore(p.store) || Boolean(p.proOnly);
  const isDirect1to1Listing = Boolean(
    p.customUrl &&
      (p.customUrl.includes("/itm/") ||
        p.customUrl.includes("/item/") ||
        p.customUrl.includes("/products/") ||
        p.customUrl.includes("alibaba.com/trade/search"))
  );

  // Visual bar width ratio
  const genericRatio =
    refOemPrice && genericCounterpartEur
      ? Math.max(8, Math.min(92, Math.round((genericCounterpartEur / refOemPrice) * 100)))
      : 12;

  return (
    <article
      className={`group flex flex-col overflow-hidden rounded-2xl border bg-card transition hover:-translate-y-1 hover:shadow-soft ${
        isNicheStore ? "border-primary/30 ring-1 ring-accent/30" : ""
      }`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={p.image}
          alt={p.title}
          loading="lazy"
          width={816}
          height={816}
          onError={(e) => {
            const target = e.currentTarget;
            const fallback = resolveCategoryImage(p.category, p.origin);
            if (target.src !== fallback) {
              target.src = fallback;
            }
          }}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5 pr-12">
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${STORE_BADGE[p.store]}`}>{p.store}</span>
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
              p.origin === "oem" ? "bg-champagne text-foreground" : "bg-card text-foreground"
            }`}
          >
            {QUALITY[p.store]}
          </span>
          {isNicheStore && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[10px] font-black text-accent">
              <Crown className="h-2.5 w-2.5" /> PRO NICHO
            </span>
          )}
          {savingsPct && (
            <span className="rounded-full bg-accent px-2.5 py-1 text-[10px] font-black text-accent-foreground">
              -{savingsPct}% vs OEM
            </span>
          )}
        </div>

        {isDirect1to1Listing && (
          <div className="absolute bottom-2.5 left-3 rounded-full bg-foreground/80 px-2.5 py-0.5 text-[10px] font-bold text-background backdrop-blur-xs">
            ✓ Foto 1:1 del Anuncio Real
          </div>
        )}

        <Button variant="ghost" size="sm"
          onClick={onToggleSave}
          title={isSaved ? "Quitar de Mi Caja" : "Guardar componente en Mi Caja"}
          className={`absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full backdrop-blur transition ${
            isSaved ? "bg-destructive text-destructive-foreground" : "bg-card/85 text-foreground hover:bg-card"
          }`}
        >
          <Heart className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
        </Button>
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">
            {p.brand} · {p.spec}
          </p>
          {p.oemRef && (
            <Button variant="ghost" size="sm"
              onClick={!isPro ? onUnlockPro : undefined}
              className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-[10px] font-bold text-muted-foreground"
              title={isPro ? "Referencia técnica verificada" : "Desbloquea referencias OEM exactas con Plan PRO"}
            >
              {isPro ? (
                <span>{p.oemRef}</span>
              ) : (
                <>
                  <Lock className="h-2.5 w-2.5" />
                  <span>Ref. PRO</span>
                </>
              )}
            </Button>
          )}
        </div>

        <h3 className="mt-1.5 font-medium leading-snug">{p.title}</h3>

        {/* Compatibility tags */}
        <div className="mt-2.5 flex flex-wrap gap-1">
          {p.compatibleWith.slice(0, 2).map((compat) => (
            <span
              key={compat}
              className="rounded-md border border-primary/10 bg-secondary/40 px-2 py-0.5 text-[10px] text-muted-foreground"
            >
              {compat}
            </span>
          ))}
        </div>

        {/* Visual OEM vs Aftermarket Mini-Comparison Bar */}
        {(refOemPrice || genericCounterpartEur) && (
          <div className="mt-3.5 rounded-xl border border-primary/10 bg-secondary/40 p-2.5 text-[11px]">
            <div className="flex items-center justify-between font-bold">
              {p.origin === "generic" && refOemPrice ? (
                <>
                  <span className="text-foreground">Aftermarket: {fmt(p.priceEur, currency)}</span>
                  <span className="text-muted-foreground line-through">OEM: {fmt(refOemPrice, currency)}</span>
                </>
              ) : genericCounterpartEur ? (
                <>
                  <span className="text-foreground">OEM Oficial: {fmt(p.priceEur, currency)}</span>
                  <span className="text-muted-foreground">Genérico desde {fmt(genericCounterpartEur, currency)}</span>
                </>
              ) : null}
            </div>
            <div className="mt-1.5 flex h-1.5 w-full overflow-hidden rounded-full bg-border">
              <div
                className="bg-accent transition-all"
                style={{ width: `${p.origin === "generic" ? genericRatio : 100 - genericRatio}%` }}
              />
              <div className="flex-1 bg-primary/40" />
            </div>
          </div>
        )}

        {/* Action row: Compare 1:1 & Price Alert */}
        <div className="mt-3 flex items-center gap-3 border-t border-border/60 pt-2.5 text-[11px] font-bold text-muted-foreground">
          {onCompare && (
            <Button variant="ghost" size="sm" onClick={onCompare} className="inline-flex items-center gap-1 text-foreground hover:underline">
              <Scale className="h-3 w-3" /> Ver Duelo 1:1
            </Button>
          )}
          <Button variant="ghost" size="sm"
            onClick={onAlert}
            className={`ml-auto inline-flex items-center gap-1 hover:text-foreground ${
              hasAlert ? "text-foreground" : ""
            }`}
          >
            <Bell className="h-3 w-3" /> {hasAlert ? "Alerta activa" : "Avisar si baja"}
          </Button>
        </div>

        <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-5">
          <div>
            <p className="text-2xl font-black">{fmt(p.priceEur, currency)}</p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Truck className="h-3 w-3" />
              {p.delivery}
            </p>
          </div>
          {isNicheStore && !isPro ? (
            <Button variant="ghost" size="sm"
              onClick={onUnlockPro}
              className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-xs font-black text-accent-foreground transition hover:bg-primary hover:text-primary-foreground"
            >
              <Lock className="h-3 w-3" /> Desbloquear {p.store} PRO
            </Button>
          ) : (
            <a
              href={storeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition group-hover:bg-accent group-hover:text-accent-foreground"
            >
              Ver en {p.store} <ArrowUpRight className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

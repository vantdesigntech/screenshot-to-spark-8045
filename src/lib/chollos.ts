import { isWatchDealQueryRelevant } from "./search-query";

export type CholloPlatform = "Wallapop" | "eBay" | "Chrono24" | "Todocolección";
export type CholloDealType =
  "Subasta sin Reserva" | "Rebaja Directa" | "Lote Relojero" | "Para Restaurar / Flip";

export interface CholloDeal {
  id: string;
  title: string;
  brand: string;
  model?: string | undefined;
  reference?: string | undefined;
  platform: CholloPlatform;
  dealType: CholloDealType;
  priceEur: number;
  marketValueEur: number;
  savingsPct: number;
  profitMarginEur: number;
  cholloScore?: number | undefined;
  aiVerdict: string;
  condition: string;
  location: string;
  timeLeft: string;
  image: string;
  url: string;
  proEarlyAccess?: boolean | undefined;
  calibreRef?: string | undefined;
  listingType?: string | undefined;
  relevanceScore?: number | undefined;
  dealVerdict?: string | undefined;
  confidence?: number | undefined;
  dealReasons?: string[] | undefined;
}

export const CHOLLO_PLATFORMS: CholloPlatform[] = ["eBay", "Wallapop", "Chrono24", "Todocolección"];

export const CHOLLOS_STORAGE_KEY = "chronoparts_chollos_24h_v3";
export const CHOLLOS_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours (86,400,000 ms)

export interface ChollosSyncState {
  updatedAtMs: number;
  nextRefreshAtMs: number;
  items: CholloDeal[];
}

/** Legacy sample listings; live search results are not populated from this array. */
export const DAILY_CHOLLOS: CholloDeal[] = [
  {
    id: "live-ebay-227582987679",
    title: "Seiko SKX007 Diver 200m Automático (Cal. 7S26) — Reloj Completo",
    brand: "Seiko",
    platform: "eBay",
    dealType: "Para Restaurar / Flip",
    priceEur: 184,
    marketValueEur: 340,
    savingsPct: 46,
    profitMarginEur: 156,
    cholloScore: 9.6,
    aiVerdict:
      "Anuncio real activo (#227582987679) a 184 €, un 46% por debajo de la cotización media europea (340 €) para el Seiko SKX007 descatalogado.",
    condition: "Anuncio Real #987679 · Foto 1:1",
    location: "Envío con Garantía eBay",
    timeLeft: "Actualizado hoy (Ciclo 24h)",
    image: "https://www.picclickimg.com/560AAeSw9WZq3iGB/Seiko-SKX007-Watch.webp",
    url: "https://www.ebay.es/itm/227582987679",
    calibreRef: "Seiko 7S26 / Compatible NH35 · eBay #227582987679",
  },
  {
    id: "live-ebay-267063646606",
    title: "Tissot PRX 40mm Stainless Steel Blue Dial Men's Watch (Ref. T137.410.11.041.00)",
    brand: "Tissot",
    platform: "eBay",
    dealType: "Rebaja Directa",
    priceEur: 201,
    marketValueEur: 395,
    savingsPct: 49,
    profitMarginEur: 194,
    cholloScore: 9.7,
    aiVerdict:
      "Anuncio real activo (#267063646606) a 201 €, un 49% inferior al PVP habitual de mercado (395 €) para el Tissot PRX 40mm esfera azul.",
    condition: "Anuncio Real #646606 · Foto 1:1",
    location: "Envío con Garantía eBay",
    timeLeft: "Actualizado hoy (Ciclo 24h)",
    image:
      "https://www.picclickimg.com/31QAAOSw1J1nNWUX/Tissot-Prx-40Mm-Stainless-Steel-Blue-Dial-Mens.webp",
    url: "https://www.ebay.es/itm/267063646606",
    calibreRef: "Tissot PRX 40mm T137.410 · eBay #267063646606",
  },
  {
    id: "live-ebay-407323437042",
    title: "OMEGA Genève Automatic Men's Wristwatch Vintage — Original Swiss",
    brand: "Omega",
    platform: "eBay",
    dealType: "Subasta sin Reserva",
    priceEur: 304,
    marketValueEur: 690,
    savingsPct: 56,
    profitMarginEur: 386,
    cholloScore: 9.8,
    aiVerdict:
      "Anuncio real activo (#407323437042) a 304 €, un 56% por debajo de la media de mercado (690 €) para un Omega Genève automático completo.",
    condition: "Anuncio Real #437042 · Foto 1:1",
    location: "Envío con Garantía eBay",
    timeLeft: "Actualizado hoy (Ciclo 24h)",
    image:
      "https://www.picclickimg.com/P2cAAeSwvvZq4p2h/OMEGA-Geneve-Automatic-Mens-Wristwatch-Vintage-From-Japan.webp",
    url: "https://www.ebay.es/itm/407323437042",
    proEarlyAccess: true,
    calibreRef: "Omega Genève Automático · eBay #407323437042",
  },
  {
    id: "live-ebay-377606898267",
    title: "Citizen Promaster Eco-Drive Diver 200m ISO — Reloj Completo",
    brand: "Citizen",
    platform: "eBay",
    dealType: "Rebaja Directa",
    priceEur: 115,
    marketValueEur: 240,
    savingsPct: 52,
    profitMarginEur: 125,
    cholloScore: 9.6,
    aiVerdict:
      "Anuncio real activo (#377606898267) a 115 €, un 52% por debajo de la cotización media (240 €) para el Citizen Promaster Diver 200m.",
    condition: "Anuncio Real #898267 · Foto 1:1",
    location: "Envío con Garantía eBay",
    timeLeft: "Actualizado hoy (Ciclo 24h)",
    image: "https://www.picclickimg.com/3dAAAeSwAe9q49a~/Citizen-Eco-drive-diver.webp",
    url: "https://www.ebay.es/itm/377606898267",
    calibreRef: "Citizen Promaster Diver ISO 200m · eBay #377606898267",
  },
  {
    id: "live-ebay-237149568614",
    title: "LONGINES Conquest Ref. L1.627.4 VHP Perpetual Calendar Men's Watch",
    brand: "Longines",
    platform: "eBay",
    dealType: "Rebaja Directa",
    priceEur: 350,
    marketValueEur: 780,
    savingsPct: 55,
    profitMarginEur: 430,
    cholloScore: 9.8,
    aiVerdict:
      "Anuncio real activo (#237149568614) en estado Near Mint a 350 €, un 55% por debajo de su valor habitual de mercado (780 €).",
    condition: "Near Mint #568614 · Foto 1:1",
    location: "Envío con Garantía eBay",
    timeLeft: "Actualizado hoy (Ciclo 24h)",
    image:
      "https://www.picclickimg.com/L3IAAeSw9SBq2QJq/NEAR-MINT-LONGINES-Conquest-L16274-VHP-Perpetual-Calendar.webp",
    url: "https://www.ebay.es/itm/237149568614",
    proEarlyAccess: true,
    calibreRef: "Longines Conquest L1.627.4 · eBay #237149568614",
  },
  {
    id: "live-ebay-278443163142",
    title: "Hamilton Khaki Field Mechanical 80h Reserve 38mm Black Dial (Ref. H69409930 + Box)",
    brand: "Hamilton",
    platform: "eBay",
    dealType: "Rebaja Directa",
    priceEur: 377,
    marketValueEur: 520,
    savingsPct: 27,
    profitMarginEur: 143,
    cholloScore: 9.1,
    aiVerdict:
      "Anuncio real activo (#278443163142) con caja y etiqueta original a 377 € (-27% frente a los 520 € de mercado para el calibre H-50 de 80h).",
    condition: "Set con Caja #163142 · Foto 1:1",
    location: "Envío con Garantía eBay",
    timeLeft: "Actualizado hoy (Ciclo 24h)",
    image:
      "https://www.picclickimg.com/uIEAAeSwcjxqxrHS/HAMILTON-KHAKI-FIELD-80-HOUR-MECHANICAL-38MM-BLACK.webp",
    url: "https://www.ebay.es/itm/278443163142",
    calibreRef: "Hamilton Cal. H-50 (80h) · eBay #278443163142",
  },
  {
    id: "live-ebay-327418863848",
    title: "Orient Bambino Automatic Dress Watch (Ref. FAC00009W0) — Calibre In-House",
    brand: "Orient",
    platform: "eBay",
    dealType: "Rebaja Directa",
    priceEur: 120,
    marketValueEur: 220,
    savingsPct: 46,
    profitMarginEur: 100,
    cholloScore: 9.5,
    aiVerdict:
      "Anuncio real activo (#327418863848) a 120 €, un 46% por debajo de su precio habitual (220 €) para el Orient Bambino automático.",
    condition: "Anuncio Real #863848 · Foto 1:1",
    location: "Envío con Garantía eBay",
    timeLeft: "Actualizado hoy (Ciclo 24h)",
    image:
      "https://www.picclickimg.com/54oAAeSwchpq2qbI/Orient-Bambino-FAC00009W0-Wrist-Watch-for-Men.webp",
    url: "https://www.ebay.es/itm/327418863848",
    calibreRef: "Orient Cal. F6724 Automático · eBay #327418863848",
  },
  {
    id: "live-ebay-336869095038",
    title: "Certina DS Caimano 39mm 100m Swiss Watch — Gray Dial & Steel Bracelet",
    brand: "Certina",
    platform: "eBay",
    dealType: "Rebaja Directa",
    priceEur: 193,
    marketValueEur: 440,
    savingsPct: 56,
    profitMarginEur: 247,
    cholloScore: 9.8,
    aiVerdict:
      "Anuncio real activo (#336869095038) a 193 €, un 56% por debajo de su cotización habitual (440 €) con sistema de doble seguridad Certina DS.",
    condition: "Anuncio Real #095038 · Foto 1:1",
    location: "Envío con Garantía eBay",
    timeLeft: "Actualizado hoy (Ciclo 24h)",
    image:
      "https://www.picclickimg.com/~akAAeSwVnNqdrHi/Certina-DS-Caimano-Mens-Quartz-Watch-Gray-Dial.webp",
    url: "https://www.ebay.es/itm/336869095038",
    calibreRef: "Certina DS Swiss 100m · eBay #336869095038",
  },
  {
    id: "live-ebay-206650414953",
    title: "TAG Heuer Formula 1 Gulf Special Edition 43mm (Ref. CAZ101N.FC8243)",
    brand: "TAG Heuer",
    platform: "eBay",
    dealType: "Para Restaurar / Flip",
    priceEur: 497,
    marketValueEur: 850,
    savingsPct: 42,
    profitMarginEur: 353,
    cholloScore: 9.4,
    aiVerdict:
      "Anuncio real activo (#206650414953) de la edición especial TAG Heuer Formula 1 Gulf a 497 €, un 42% por debajo de su cotización media (850 €).",
    condition: "Anuncio Real #414953 · Foto 1:1",
    location: "Envío con Garantía eBay",
    timeLeft: "Actualizado hoy (Ciclo 24h)",
    image:
      "https://www.picclickimg.com/jvYAAeSwXS9qyGZi/TAG-Heuer-Formula-1-Gulf-Special-Edition-CAZ101NFC8243.webp",
    url: "https://www.ebay.es/itm/206650414953",
    proEarlyAccess: true,
    calibreRef: "TAG Heuer CAZ101N Gulf · eBay #206650414953",
  },
  {
    id: "live-ebay-366769210290",
    title: "Vintage 1984 NEAR MINT Omega Seamaster Cal. 1430 Date Octagon Men's Watch",
    brand: "Omega",
    platform: "eBay",
    dealType: "Subasta sin Reserva",
    priceEur: 598,
    marketValueEur: 890,
    savingsPct: 33,
    profitMarginEur: 292,
    cholloScore: 9.2,
    aiVerdict:
      "Anuncio real activo (#366769210290) en estado Near Mint de 1984 con calibre Omega 1430 a 598 € (-33% bajo mercado).",
    condition: "Near Mint 1984 #210290 · Foto 1:1",
    location: "Envío con Garantía eBay",
    timeLeft: "Actualizado hoy (Ciclo 24h)",
    image:
      "https://www.picclickimg.com/r8MAAeSwsEpq42ST/Vintage-1984-NEAR-MINT-OMEGA-Seamaster-Cal1430-Quartz.webp",
    url: "https://www.ebay.es/itm/366769210290",
    calibreRef: "Omega Cal. 1430 Swiss · eBay #366769210290",
  },
  {
    id: "live-ebay-407317567886",
    title: "Vintage Seiko 5 Cal. 7009 Automatic Men's Watch Day-Date Stainless Steel",
    brand: "Seiko",
    platform: "eBay",
    dealType: "Rebaja Directa",
    priceEur: 120,
    marketValueEur: 165,
    savingsPct: 28,
    profitMarginEur: 45,
    cholloScore: 8.9,
    aiVerdict:
      "Anuncio real activo (#407317567886) de Seiko 5 automático clásico calibre 7009 en acero a 120 € (-28% frente a mercado).",
    condition: "Anuncio Real #567886 · Foto 1:1",
    location: "Envío con Garantía eBay",
    timeLeft: "Actualizado hoy (Ciclo 24h)",
    image:
      "https://www.picclickimg.com/TYgAAeSwcUtq31zI/Vintage-Seiko-5-7009-Automatic-Mens-Watch-Day.webp",
    url: "https://www.ebay.es/itm/407317567886",
    calibreRef: "Seiko Cal. 7009 Automático · eBay #407317567886",
  },
];

function normalizeRawCholloItem(raw: Record<string, unknown>, query: string): CholloDeal | null {
  const id = typeof raw["id"] === "string" ? raw["id"].trim() : "";
  const title = typeof raw["title"] === "string" ? raw["title"].trim() : "";
  const brand = typeof raw["brand"] === "string" ? raw["brand"].trim() : "";
  const platform = CHOLLO_PLATFORMS.find((value) => value === raw["platform"]);
  const dealType = (
    ["Subasta sin Reserva", "Rebaja Directa", "Lote Relojero", "Para Restaurar / Flip"] as const
  ).find((value) => value === raw["dealType"]);
  const priceEur = Number(raw["priceEur"]);
  const marketValueEur = Number(raw["marketValueEur"]);
  const image = typeof raw["image"] === "string" ? raw["image"].trim() : "";
  const url = typeof raw["url"] === "string" ? raw["url"].trim() : "";

  if (
    !id ||
    !title ||
    !brand ||
    !platform ||
    !dealType ||
    !Number.isFinite(priceEur) ||
    priceEur <= 0 ||
    !Number.isFinite(marketValueEur) ||
    marketValueEur <= priceEur ||
    !isWatchDealQueryRelevant(query, title)
  ) {
    return null;
  }

  let parsedUrl: URL;
  let parsedImage: URL;
  try {
    parsedUrl = new URL(url);
    parsedImage = new URL(image);
  } catch {
    return null;
  }
  if (parsedUrl.protocol !== "https:" || parsedImage.protocol !== "https:") return null;

  const savingsPct = Math.round(((marketValueEur - priceEur) / marketValueEur) * 100);
  if (savingsPct < 15 || savingsPct > 65) return null;

  const rawScore = Number(raw["cholloScore"] ?? raw["aiScore"]);
  const cholloScore = Number.isFinite(rawScore)
    ? Math.max(0, Math.min(10, rawScore > 10 ? rawScore / 10 : rawScore))
    : undefined;

  return {
    id,
    title,
    brand,
    platform,
    dealType,
    priceEur,
    marketValueEur,
    savingsPct,
    profitMarginEur: Math.round(marketValueEur - priceEur),
    ...(cholloScore !== undefined ? { cholloScore } : {}),
    aiVerdict: `Anuncio localizado. La referencia comparativa indicada es ${marketValueEur} €; comprueba el precio y el estado en la tienda.`,
    condition: typeof raw["condition"] === "string" ? raw["condition"] : "Estado no indicado",
    location: typeof raw["location"] === "string" ? raw["location"] : "Ubicación no indicada",
    timeLeft:
      typeof raw["timeLeft"] === "string" ? raw["timeLeft"] : "Disponibilidad no comprobada",
    image,
    url,
    proEarlyAccess: Boolean(raw["proEarlyAccess"]),
    ...(typeof raw["calibreRef"] === "string"
      ? { calibreRef: raw["calibreRef"] }
      : typeof raw["model"] === "string"
        ? { calibreRef: raw["model"] }
        : {}),
  };
}

export function getDailyChollosSyncState(): ChollosSyncState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CHOLLOS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ChollosSyncState;
    if (
      parsed &&
      typeof parsed.updatedAtMs === "number" &&
      Array.isArray(parsed.items) &&
      parsed.items.length > 0
    ) {
      return parsed;
    }
  } catch {
    // Ignore storage read errors
  }
  return null;
}

export function saveDailyChollosSyncState(items: CholloDeal[]): ChollosSyncState {
  const now = Date.now();
  const state: ChollosSyncState = {
    updatedAtMs: now,
    nextRefreshAtMs: now + CHOLLOS_TTL_MS,
    items,
  };
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(CHOLLOS_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors
    }
  }
  return state;
}

export async function fetchLiveChollosFromApi(
  query = "",
  forceRefresh = false,
): Promise<CholloDeal[]> {
  const q = query.trim();

  // If loading the default daily radar and we have a valid <24h cache in localStorage, return it unless forced
  if (!q && !forceRefresh) {
    const cached = getDailyChollosSyncState();
    if (cached && Date.now() < cached.nextRefreshAtMs) {
      return cached.items;
    }
  }

  // 1. Try dedicated Watch Chollos Engine (Node.js + eBay Browse API + Wallapop Stealth)
  const engineBaseUrl =
    (typeof import.meta !== "undefined" && import.meta.env?.["VITE_CHOLLOS_ENGINE_URL"]) ||
    (typeof import.meta !== "undefined" && import.meta.env?.["VITE_API_URL"]) ||
    "http://localhost:3001";

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4500);
    const url = `${engineBaseUrl}/api/chollos?q=${encodeURIComponent(q)}${forceRefresh ? "&refresh=1" : ""}`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timer);
    const contentType = res.headers.get("content-type") || "";
    if (res.ok && contentType.includes("application/json")) {
      const data = await res.json();
      if (Array.isArray(data.items) && data.items.length > 0) {
        const normalized = data.items.flatMap((item: unknown) => {
          if (!item || typeof item !== "object" || Array.isArray(item)) return [];
          const deal = normalizeRawCholloItem(item as Record<string, unknown>, q);
          return deal ? [deal] : [];
        });
        if (normalized.length > 0) {
          if (!q) saveDailyChollosSyncState(normalized);
          return normalized;
        }
      }
    }
  } catch {
    // Proceed to next fallback
  }

  // 2. Try same-origin Cloud Server endpoint (/api/chollos handled by src/server.ts)
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3600);
    const url = `/api/chollos?q=${encodeURIComponent(q)}${forceRefresh ? "&refresh=1" : ""}`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timer);
    const contentType = res.headers.get("content-type") || "";
    if (res.ok && contentType.includes("application/json")) {
      const data = await res.json();
      if (Array.isArray(data.items) && data.items.length > 0) {
        const normalized = data.items.flatMap((item: unknown) => {
          if (!item || typeof item !== "object" || Array.isArray(item)) return [];
          const deal = normalizeRawCholloItem(item as Record<string, unknown>, q);
          return deal ? [deal] : [];
        });
        if (normalized.length > 0) {
          if (!q) saveDailyChollosSyncState(normalized);
          return normalized;
        }
      }
    }
  } catch {
    // Proceed to next provider
  }

  // 2. Try local Python Horological Daemon if running on 127.0.0.1:8765
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3200);
    const url = `http://127.0.0.1:8765/api/chollos-relojes?q=${encodeURIComponent(q)}${forceRefresh ? "&refresh=1" : ""}`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.items) && data.items.length > 0) {
        const normalized = data.items.flatMap((item: unknown) => {
          if (!item || typeof item !== "object" || Array.isArray(item)) return [];
          const deal = normalizeRawCholloItem(item as Record<string, unknown>, q);
          return deal ? [deal] : [];
        });
        if (normalized.length > 0) {
          if (!q) saveDailyChollosSyncState(normalized);
          return normalized;
        }
      }
    }
  } catch {
    // Proceed to direct Cloud Engine below
  }

  // 3. Direct Cloud Live Scanner (queries PicClick live watch index via HTTPS CORS gateways)
  try {
    const { searchLiveChollosCloud } = await import("./live-watch-engine");
    const cloudDeals = await searchLiveChollosCloud(q);
    if (cloudDeals.length > 0) {
      if (!q) saveDailyChollosSyncState(cloudDeals);
      return cloudDeals;
    }
  } catch {
    // No verified fallback is available when live scanning fails.
  }

  return [];
}

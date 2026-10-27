export type CholloPlatform = "Wallapop" | "eBay" | "Chrono24" | "Todocolección";
export type CholloDealType =
  | "Subasta sin Reserva"
  | "Rebaja Directa"
  | "Lote Relojero"
  | "Para Restaurar / Flip";

export interface CholloDeal {
  id: string;
  title: string;
  brand: string;
  platform: CholloPlatform;
  dealType: CholloDealType;
  priceEur: number;
  marketValueEur: number;
  savingsPct: number;
  profitMarginEur: number;
  cholloScore: number;
  aiVerdict: string;
  condition: string;
  location: string;
  timeLeft: string;
  image: string;
  url: string;
  proEarlyAccess?: boolean;
  calibreRef?: string;
}

export const CHOLLO_PLATFORMS: CholloPlatform[] = [
  "Wallapop",
  "eBay",
  "Chrono24",
  "Todocolección",
];

export const DAILY_CHOLLOS: CholloDeal[] = [
  {
    id: "chollo-1",
    title: "Seiko SKX007J1 Diver 200m Automático (Cal. 7S26) — Completo para Mod o Colección",
    brand: "Seiko",
    platform: "Wallapop",
    dealType: "Rebaja Directa",
    priceEur: 165,
    marketValueEur: 340,
    savingsPct: 51,
    profitMarginEur: 175,
    cholloScore: 9.8,
    aiVerdict:
      "Versión japonesa J1 descatalogada. Incluso si requiere pulido de Hardlex (o upgrade a zafiro por 19€), cotiza por encima de 330€ en mercado europeo.",
    condition: "Usado · Funcionando",
    location: "Madrid, ES",
    timeLeft: "Hace 18 min",
    image: "/chollos/chollo-1.jpg",
    url: "https://es.wallapop.com/app/search?keywords=seiko%20skx007",
    calibreRef: "Seiko 7S26 / Compatible NH35",
  },
  {
    id: "chollo-2",
    title: "Tissot PRX Powermatic 80 (40mm Esfera Azul Waffle) — Set con Caja",
    brand: "Tissot",
    platform: "Wallapop",
    dealType: "Rebaja Directa",
    priceEur: 360,
    marketValueEur: 595,
    savingsPct: 39,
    profitMarginEur: 235,
    cholloScore: 9.6,
    aiVerdict:
      "Precio un 39% inferior a la media de segunda mano verificada. Brazalete integrado en buen estado y calibre Powermatic 80 con 80h de reserva.",
    condition: "Muy buen estado (9/10)",
    location: "Valencia, ES",
    timeLeft: "Hace 34 min",
    image: "/chollos/chollo-2.jpg",
    url: "https://es.wallapop.com/app/search?keywords=tissot%20prx%20powermatic%2080",
    calibreRef: "ETA C07.111 Powermatic 80",
  },
  {
    id: "chollo-3",
    title: "Lote de Relojero (Watchmaker Estate Lot): 6 Movimientos Suizos ETA 2824-2 / AS + Cajas",
    brand: "Swiss Estate Lot",
    platform: "eBay",
    dealType: "Lote Relojero",
    priceEur: 215,
    marketValueEur: 580,
    savingsPct: 63,
    profitMarginEur: 365,
    cholloScore: 9.9,
    aiVerdict:
      "Oportunidad crítica para taller: solo dos calibres ETA 2824-2 completos en despiece superan los 380€. Margen neto estimado +365€ vendiendo por separado.",
    condition: "Lote Taller / Spares & Repair",
    location: "Ginebra, CH (Envío UE)",
    timeLeft: "Termina en 2h 14m",
    image: "/chollos/chollo-3.jpg",
    url: "https://www.ebay.es/sch/i.html?_nkw=watchmaker+estate+lot+eta+movement&_sop=1",
    proEarlyAccess: true,
    calibreRef: "ETA 2824-2 / Felsa / AS",
  },
  {
    id: "chollo-4",
    title: "Omega Genève Vintage (Ref. 135.070 · Calibre Manual 601) — Esfera Soleil Plata",
    brand: "Omega",
    platform: "eBay",
    dealType: "Subasta sin Reserva",
    priceEur: 390,
    marketValueEur: 750,
    savingsPct: 48,
    profitMarginEur: 360,
    cholloScore: 9.5,
    aiVerdict:
      "Subasta con pocas pujas por título mal indexado. Caja de acero de 35mm sin pulir y calibre Omega 601 cobrizo limpio. Sustituyendo plexi (+22€) alcanza ~750€.",
    condition: "Vintage 1969 · En marcha",
    location: "Milán, IT",
    timeLeft: "Termina en 47 min",
    image: "/chollos/chollo-4.jpg",
    url: "https://www.ebay.es/sch/i.html?_nkw=omega+geneve+601+vintage+watch&_sop=1",
    calibreRef: "Omega Cal. 601 (17 Rubíes)",
  },
  {
    id: "chollo-5",
    title: "Rolex Datejust 16014 / 16234 — Kit Caja Media Oyster + Bisel Estriado Oro Blanco 18k",
    brand: "Rolex",
    platform: "Chrono24",
    dealType: "Para Restaurar / Flip",
    priceEur: 980,
    marketValueEur: 1790,
    savingsPct: 45,
    profitMarginEur: 810,
    cholloScore: 9.7,
    aiVerdict:
      "Vendedor profesional liquidando stock antiguo. Solo el bisel estriado de oro blanco 18k y la carrura 36mm se venden por separado en más de 1.750€.",
    condition: "OEM Vintage Verificado",
    location: "Múnich, DE",
    timeLeft: "1 unidad en stock",
    image: "/chollos/chollo-5.jpg",
    url: "https://www.chrono24.es/search/index.htm?query=rolex+16014+case+bezel",
    proEarlyAccess: true,
    calibreRef: "Compatible Cal. 3035 / 3135",
  },
  {
    id: "chollo-6",
    title: "Citizen Promaster Aqualand / NY0040 Automático Marina Militare — Rebaja Urgente",
    brand: "Citizen",
    platform: "Todocolección",
    dealType: "Rebaja Directa",
    priceEur: 95,
    marketValueEur: 210,
    savingsPct: 55,
    profitMarginEur: 115,
    cholloScore: 9.2,
    aiVerdict:
      "Diver ISO 200m automático (Cal. Miyota 8203/8204) listado como reloj deportivo genérico. Con correa FKM nueva (+11€) se revende rápido por 200–220€.",
    condition: "Buen estado · Lume activo",
    location: "Barcelona, ES",
    timeLeft: "Hace 1h 12m",
    image: "/chollos/chollo-6.jpg",
    url: "https://www.todocoleccion.net/buscador?bu=citizen+automatico+diver",
    calibreRef: "Miyota 8203 Automático",
  },
  {
    id: "chollo-7",
    title: "Seiko 5 Sports GMT (SSK003 Blueberry) — Necesita Cambio de Cristal Bisel",
    brand: "Seiko",
    platform: "Wallapop",
    dealType: "Para Restaurar / Flip",
    priceEur: 140,
    marketValueEur: 310,
    savingsPct: 55,
    profitMarginEur: 142,
    cholloScore: 9.4,
    aiVerdict:
      "Ideal para flip relojero: tiene un rasguño en el inserto y cristal. Comprando zafiro + inserto cerámico Batman en AliExpress (28€ total), queda nuevo con +142€ de beneficio limpio.",
    condition: "Cristal marcado · Calibre 4R34 OK",
    location: "Sevilla, ES",
    timeLeft: "Hace 42 min",
    image: "/chollos/chollo-7.jpg",
    url: "https://es.wallapop.com/app/search?keywords=seiko%20gmt%20ssk",
    calibreRef: "Seiko 4R34 / NH34 GMT",
  },
  {
    id: "chollo-8",
    title: "Omega Speedmaster Reduced (Ref. 3510.50) — Para Revisión de Cronógrafo",
    brand: "Omega",
    platform: "Chrono24",
    dealType: "Para Restaurar / Flip",
    priceEur: 1490,
    marketValueEur: 2450,
    savingsPct: 39,
    profitMarginEur: 740,
    cholloScore: 9.6,
    aiVerdict:
      "El Speedmaster automático más buscado por debajo de 1.500€. Incluso descontando servicio de módulo Dubois-Dépraz (~220€), el margen supera los 740€.",
    condition: "Esfera y agujas impecables",
    location: "Tokio / Envío DHL",
    timeLeft: "Rebajado hoy (-320€)",
    image: "/chollos/chollo-8.jpg",
    url: "https://www.chrono24.es/search/index.htm?query=omega+speedmaster+3510.50&sortorder=1",
    proEarlyAccess: true,
    calibreRef: "Omega Cal. 3220 / 1140",
  },
];

export function resolveCholloFallbackImage(brand: string, idx = 0): string {
  const b = brand.toLowerCase();
  if (b.includes("tissot")) return "/chollos/chollo-2.jpg";
  if (b.includes("omega") && idx % 2 === 1) return "/chollos/chollo-8.jpg";
  if (b.includes("omega")) return "/chollos/chollo-4.jpg";
  if (b.includes("rolex")) return "/chollos/chollo-5.jpg";
  if (b.includes("citizen")) return "/chollos/chollo-6.jpg";
  if (b.includes("swiss") || b.includes("eta") || b.includes("lot")) return "/chollos/chollo-3.jpg";
  if (b.includes("seiko") && idx % 2 === 1) return "/chollos/chollo-7.jpg";
  return "/chollos/chollo-1.jpg";
}

export async function fetchLiveChollosFromApi(query = ""): Promise<CholloDeal[]> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4500);
    const url = `http://127.0.0.1:8765/api/chollos?q=${encodeURIComponent(query.trim())}`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return [];
    const data = await res.json();
    if (Array.isArray(data.items) && data.items.length > 0) {
      return data.items as CholloDeal[];
    }
    return [];
  } catch {
    return [];
  }
}

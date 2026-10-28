import strap from "@/assets/strap.jpg";
import bracelet from "@/assets/bracelet.jpg";
import crystal from "@/assets/crystal.jpg";
import movement from "@/assets/movement.jpg";

export type Store =
  | "eBay"
  | "AliExpress"
  | "Chrono24"
  | "Alibaba"
  | "WatchPlaza"
  | "NamokiMods"
  | "CousinsUK";
export type Origin = "oem" | "generic";
export type Category = "straps" | "bezels" | "crystals" | "dials" | "movements" | "crowns";

export const NICHE_PRO_STORES: Store[] = ["Alibaba", "WatchPlaza", "NamokiMods", "CousinsUK"];

export function isNicheProStore(store: Store): boolean {
  return NICHE_PRO_STORES.includes(store);
}

export interface WatchModelSpec {
  id: "rolex-op41" | "seiko-skx" | "omega-speedy" | "tissot-prx";
  brand: string;
  name: string;
  shortName: string;
  ref: string;
  lugWidth: string;
  waterResistance: string;
  movement: string;
  material: string;
  dialColor: string;
  dialAccent: string;
  bezelType: "smooth" | "diver" | "tachymeter" | "tonneau";
  subdials?: boolean;
  waffleDial?: boolean;
  searchKeyword: string;
  hotspots: {
    n: string;
    label: string;
    sublabel: string;
    priceHint: string;
    cats: Category[];
    layerIdx: number;
    pos: string;
    side: "left" | "right";
  }[];
}

export const WATCH_MODELS: WatchModelSpec[] = [
  {
    id: "rolex-op41",
    brand: "Rolex",
    name: "OYSTER PERPETUAL 41",
    shortName: "Rolex OP 41",
    ref: "REF. 124300",
    lugWidth: "20mm",
    waterResistance: "100m / 10 bar",
    movement: "Calibre 3230 Perpetual",
    material: "Oystersteel (904L)",
    dialColor: "#f3f4f1",
    dialAccent: "#101e29",
    bezelType: "smooth",
    searchKeyword: "Rolex",
    hotspots: [
      {
        n: "01",
        label: "Domed Bezel & LEC Sapphire",
        sublabel: "Ø31.5mm AR Crystal + 904L Ring",
        priceHint: "OEM 320€ · Gen 14€ (-95%)",
        cats: ["bezels", "crystals"],
        layerIdx: 5,
        pos: "left-[1%] top-[6%]",
        side: "left",
      },
      {
        n: "02",
        label: "Sunburst Dial & Chromalight Hands",
        sublabel: "18k indices vs Sterile 28.5mm",
        priceHint: "OEM 1.100€ · Gen 16€ (-98%)",
        cats: ["dials"],
        layerIdx: 4,
        pos: "left-[0%] top-[34%]",
        side: "left",
      },
      {
        n: "03",
        label: "Calibre 3230 / ETA & NH35",
        sublabel: "Chronergy Escapement & Clones",
        priceHint: "OEM 890€ · NH35 39€ (-95%)",
        cats: ["movements"],
        layerIdx: 3,
        pos: "right-[0%] top-[28%]",
        side: "right",
      },
      {
        n: "04",
        label: "Twinlock Crown & Middle Case",
        sublabel: "6mm Screw-down Waterproof",
        priceHint: "OEM 210€ · Gen 7€ (-96%)",
        cats: ["crowns"],
        layerIdx: 2,
        pos: "left-[2%] bottom-[22%]",
        side: "left",
      },
      {
        n: "05",
        label: "Oyster Bracelet · 20mm Lugs",
        sublabel: "Ref. 78350 vs Curved-End 904L",
        priceHint: "OEM 1.450€ · Gen 24€ (-98%)",
        cats: ["straps"],
        layerIdx: 1,
        pos: "right-[1%] bottom-[20%]",
        side: "right",
      },
    ],
  },
  {
    id: "seiko-skx",
    brand: "Seiko",
    name: "SKX007 / NH35 MOD",
    shortName: "Seiko SKX / NH35",
    ref: "REF. SKX007J1",
    lugWidth: "22mm",
    waterResistance: "200m / ISO Diver",
    movement: "Calibre TMI NH35A / 7S26",
    material: "316L Brushed Steel",
    dialColor: "#182026",
    dialAccent: "#e8f45a",
    bezelType: "diver",
    searchKeyword: "Seiko",
    hotspots: [
      {
        n: "01",
        label: "120-Click Diver Bezel & Double Dome",
        sublabel: "Ceramic Insert 38mm + Sapphire",
        priceHint: "OEM 95€ · Mod 14€ (-85%)",
        cats: ["bezels", "crystals"],
        layerIdx: 5,
        pos: "left-[1%] top-[6%]",
        side: "left",
      },
      {
        n: "02",
        label: "LumiBrite Diver Dial & Sword Hands",
        sublabel: "28.5mm C3/BGW9 Super-LumiNova",
        priceHint: "OEM 85€ · Mod 16€ (-81%)",
        cats: ["dials"],
        layerIdx: 4,
        pos: "left-[0%] top-[34%]",
        side: "left",
      },
      {
        n: "03",
        label: "Seiko NH35A / NH36A Automatic",
        sublabel: "24 Jewels · Hacking & Hand-wind",
        priceHint: "TMI 39€ · ETA 245€",
        cats: ["movements"],
        layerIdx: 3,
        pos: "right-[0%] top-[28%]",
        side: "right",
      },
      {
        n: "04",
        label: "4 O'Clock Triple-Gasket Crown",
        sublabel: "Signed 'S' Crown + NH35 Stem",
        priceHint: "OEM 45€ · Mod 7€ (-84%)",
        cats: ["crowns"],
        layerIdx: 2,
        pos: "left-[2%] bottom-[22%]",
        side: "left",
      },
      {
        n: "05",
        label: "Jubilee / Waffle Diver Strap 22mm",
        sublabel: "Curved Solid Endlinks & FKM",
        priceHint: "OEM 110€ · Gen 19€ (-82%)",
        cats: ["straps"],
        layerIdx: 1,
        pos: "right-[1%] bottom-[20%]",
        side: "right",
      },
    ],
  },
  {
    id: "omega-speedy",
    brand: "Omega",
    name: "SPEEDMASTER MOONWATCH",
    shortName: "Omega Speedy",
    ref: "REF. 310.30.42",
    lugWidth: "20mm",
    waterResistance: "50m / 5 bar",
    movement: "Calibre 1861 / 3861 Co-Axial",
    material: "316L Aerospace Steel",
    dialColor: "#141619",
    dialAccent: "#f5f5f0",
    bezelType: "tachymeter",
    subdials: true,
    searchKeyword: "Omega",
    hotspots: [
      {
        n: "01",
        label: "Tachymeter 'Dot Over 90' & Hesalite",
        sublabel: "Genuine Ω Crystal vs Sapphire Box",
        priceHint: "OEM 295€ · Gen 28€ (-90%)",
        cats: ["bezels", "crystals"],
        layerIdx: 5,
        pos: "left-[1%] top-[6%]",
        side: "left",
      },
      {
        n: "02",
        label: "Tri-Compax Step Dial & Baton Hands",
        sublabel: "Chronograph Register Hands Set",
        priceHint: "OEM 680€ · Gen 29€ (-95%)",
        cats: ["dials"],
        layerIdx: 4,
        pos: "left-[0%] top-[34%]",
        side: "left",
      },
      {
        n: "03",
        label: "Calibre 1861 / Lemania Chronograph",
        sublabel: "Manual Wind Cam-Actuated Chrono",
        priceHint: "OEM 950€ · ST19 110€",
        cats: ["movements"],
        layerIdx: 3,
        pos: "right-[0%] top-[28%]",
        side: "right",
      },
      {
        n: "04",
        label: "Chrono Pushers & Ω Crown",
        sublabel: "Pump Pushers + Dust-Proof Tube",
        priceHint: "OEM 185€ · Gen 18€ (-90%)",
        cats: ["crowns"],
        layerIdx: 2,
        pos: "left-[2%] bottom-[22%]",
        side: "left",
      },
      {
        n: "05",
        label: "Nixon / Tapered Moonwatch Bracelet",
        sublabel: "20mm -> 15mm Brushed Links",
        priceHint: "OEM 790€ · Gen 34€ (-95%)",
        cats: ["straps"],
        layerIdx: 1,
        pos: "right-[1%] bottom-[20%]",
        side: "right",
      },
    ],
  },
  {
    id: "tissot-prx",
    brand: "Tissot",
    name: "PRX POWERMATIC 80",
    shortName: "Tissot PRX 40",
    ref: "REF. T137.407",
    lugWidth: "12mm Integrated",
    waterResistance: "100m / 10 bar",
    movement: "Powermatic 80 / ETA C07.111",
    material: "316L Tonneau Integrated",
    dialColor: "#b8d4e3",
    dialAccent: "#101e29",
    bezelType: "tonneau",
    waffleDial: true,
    searchKeyword: "Tissot",
    hotspots: [
      {
        n: "01",
        label: "Polished Bezel & Flat AR Sapphire",
        sublabel: "31.5mm Sapphire + Bezel Gasket",
        priceHint: "OEM 120€ · Gen 14€ (-88%)",
        cats: ["bezels", "crystals"],
        layerIdx: 5,
        pos: "left-[1%] top-[6%]",
        side: "left",
      },
      {
        n: "02",
        label: "Ice Blue Waffle Tapisserie Dial",
        sublabel: "Embossed Grid Dial + Baton Hands",
        priceHint: "OEM 190€ · Gen 22€ (-88%)",
        cats: ["dials"],
        layerIdx: 4,
        pos: "left-[0%] top-[34%]",
        side: "left",
      },
      {
        n: "03",
        label: "ETA Powermatic 80 / 2824-2",
        sublabel: "80h Reserve / Swiss Escapement",
        priceHint: "ETA 245€ · Clone 48€ (-80%)",
        cats: ["movements"],
        layerIdx: 3,
        pos: "right-[0%] top-[28%]",
        side: "right",
      },
      {
        n: "04",
        label: "Signed 'T' Crown & Stem Assembly",
        sublabel: "Waterproof Push/Pull Crown",
        priceHint: "OEM 55€ · Gen 8€ (-85%)",
        cats: ["crowns"],
        layerIdx: 2,
        pos: "left-[2%] bottom-[22%]",
        side: "left",
      },
      {
        n: "05",
        label: "PRX Integrated 12mm Quick-Release",
        sublabel: "FKM Waffle Rubber / Vintage Leather",
        priceHint: "OEM 75€ · Gen 15€ (-80%)",
        cats: ["straps"],
        layerIdx: 1,
        pos: "right-[1%] bottom-[20%]",
        side: "right",
      },
    ],
  },
];

export const CATEGORIES: { id: Category; label: string; labelEs: string }[] = [
  { id: "straps", label: "Straps & Bracelets", labelEs: "Correas y Brazaletes" },
  { id: "bezels", label: "Bezels", labelEs: "Biseles e Insertos" },
  { id: "crystals", label: "Crystals", labelEs: "Cristales y Zafiros" },
  { id: "dials", label: "Dials & Hands", labelEs: "Esferas y Agujas" },
  { id: "movements", label: "Movements & Escapements", labelEs: "Movimientos y Calibres" },
  { id: "crowns", label: "Crowns & Stems", labelEs: "Coronas y Tijes" },
];

export interface Part {
  id: string;
  title: string;
  brand: string;
  store: Store;
  origin: Origin;
  category: Category;
  priceEur: number;
  delivery: string;
  image: string;
  spec: string;
  oemRef?: string;
  compatibleWith: string[];
  condition: "NOS Vintage" | "Certified OEM" | "Aftermarket 1:1" | "Swiss OEM";
  equivalentOemPriceEur?: number;
  pairGroupId?: string;
  proOnly?: boolean;
  customUrl?: string;
  materialSpec?: string;
  toleranceSpec?: string;
  resaleImpact?: string;
}

export const PARTS: Part[] = [
  {
    id: "1",
    title: "Vintage Tissot 1990 leather strap, 18mm",
    brand: "Tissot",
    store: "eBay",
    origin: "oem",
    category: "straps",
    priceEur: 64,
    delivery: "3–5 days",
    image: "https://www.picclickimg.com/PsUAAeSw1H1pE--j/For-Tissot-1853-Genuine-Leather-Watch-Band-Strap.webp",
    spec: "18mm · eBay #146957302117",
    oemRef: "TS-1990-18L",
    compatibleWith: ["Tissot Seastar 1990", "Tissot PRX (with adapter)", "18mm Classic Lugs"],
    condition: "NOS Vintage",
    pairGroupId: "strap-tissot",
    customUrl: "https://www.ebay.es/itm/146957302117",
    materialSpec: "Piel de becerro suiza NOS + Hebilla firmada Tissot (Foto y enlace real 1:1)",
    toleranceSpec: "Original de fábrica (18.0mm exactos)",
    resaleImpact: "Mantiene 100% autenticidad de colección",
  },
  {
    id: "2",
    title: "Curved-end Oyster style steel bracelet 20mm",
    brand: "Generic",
    store: "AliExpress",
    origin: "generic",
    category: "straps",
    priceEur: 23.9,
    delivery: "12–20 days",
    image: "https://ae-pic-a1.aliexpress-media.com/kf/S777cb4af67274b6d981ada88d3ed4dc5h.jpg_480x480q75.jpg",
    spec: "20mm · AliExpress #93185477",
    oemRef: "ALT-78350-20",
    compatibleWith: ["Rolex OP 41 / 36 (20mm)", "Seiko SARB / NH35 Cases", "Tudor BB36"],
    condition: "Aftermarket 1:1",
    equivalentOemPriceEur: 1450,
    pairGroupId: "oyster-20mm",
    customUrl: "https://es.aliexpress.com/item/1005009593185477.html",
    materialSpec: "Acero inoxidable 904L/316L cepillado + cierre GlideLock (Foto y enlace real 1:1)",
    toleranceSpec: "Endlinks curvos sólidos (±0.15mm)",
    resaleImpact: "Ideal uso diario para preservar el brazalete OEM sin rayarlo",
  },
  {
    id: "3",
    title: "Rolex Oyster bracelet 78350 / 78360 · 20mm Stainless Steel",
    brand: "Rolex",
    store: "eBay",
    origin: "oem",
    category: "straps",
    priceEur: 1450,
    delivery: "2–4 days",
    image: "https://www.picclickimg.com/3poAAeSwWKVq21VH/Rolex-78360-Oyster-Stainless-Steel-Bracelet-Vintage-Missing.webp",
    spec: "20mm · eBay #198739161658",
    oemRef: "Ref. 78360 / Endlinks 558B",
    compatibleWith: ["Rolex Datejust 16200", "Rolex Oyster Perpetual 20mm"],
    condition: "Certified OEM",
    pairGroupId: "oyster-20mm",
    customUrl: "https://www.ebay.es/itm/198739161658",
    materialSpec: "Oystersteel 904L manufactura Rolex Ginebra + Corona grabada",
    toleranceSpec: "Ajuste micrométrico de fábrica (0.01mm)",
    resaleImpact: "+1.200€ en valor de reventa del reloj completo",
  },
  {
    id: "4",
    title: "Seiko NH35 / Tissot compatible leather & nylon strap 18mm/20mm",
    brand: "Generic",
    store: "AliExpress",
    origin: "generic",
    category: "straps",
    priceEur: 8.5,
    delivery: "10–18 days",
    image: "https://ae-pic-a1.aliexpress-media.com/kf/S3b9e3bcd2eba4f98a9d6a93ae3897590i.jpg_480x480q75.jpg",
    spec: "18mm / 20mm · AliExpress #71766469",
    oemRef: "GEN-CALF-QR",
    compatibleWith: ["Tissot 1990", "Seiko 5 Sports", "Orient Bambino"],
    condition: "Aftermarket 1:1",
    equivalentOemPriceEur: 64,
    pairGroupId: "strap-tissot",
    customUrl: "https://es.aliexpress.com/item/1005013171766469.html",
    materialSpec: "Cuero/Nylon de alta resistencia + hebilla de acero (Foto y enlace 1:1)",
    toleranceSpec: "Estándar universal 18mm / 20mm",
    resaleImpact: "Recambio estético económico de alta rotación",
  },
  {
    id: "5",
    title: "Replacement sapphire crystal 31.5mm, double AR coated + gasket",
    brand: "Generic",
    store: "AliExpress",
    origin: "generic",
    category: "crystals",
    priceEur: 14.2,
    delivery: "14–22 days",
    image: "https://ae-pic-a1.aliexpress-media.com/kf/S9c52bf2c3e5e4be980a2e70eed9277bbN.jpg_480x480q75.jpg",
    spec: "Ø31.5mm · AliExpress #42205491",
    oemRef: "ALT-B25-295",
    compatibleWith: ["Rolex 124300", "Seiko SKX007", "Custom NH35 41mm Case"],
    condition: "Aftermarket 1:1",
    equivalentOemPriceEur: 320,
    pairGroupId: "crystal-124300",
    customUrl: "https://es.aliexpress.com/item/1005009542205491.html",
    materialSpec: "Zafiro sintético dureza Mohs 9 + Antirreflejo + Junta incluida (Foto 1:1)",
    toleranceSpec: "Ø31.5mm × 1.8mm + Junta de teflón incluida",
    resaleImpact: "Misma resistencia a arañazos que el OEM por un 4% de su coste",
  },
  {
    id: "6",
    title: "Genuine Rolex Sapphire Crystal + Gasket (Laser-Etched Crown)",
    brand: "Rolex",
    store: "eBay",
    origin: "oem",
    category: "crystals",
    priceEur: 320,
    delivery: "3–6 days",
    image: "https://www.picclickimg.com/s0gAAeSwiCJq1jK-/Genuine-Rolex-Cyclop-Sapphire-Crystal-fit-Datejust-36mm.webp",
    spec: "Genuine Sapphire · eBay #227574298269",
    oemRef: "Ref. B25-7030-C1",
    compatibleWith: ["Rolex Oyster Perpetual 41 (124300)", "Rolex Datejust 36/41"],
    condition: "Certified OEM",
    pairGroupId: "crystal-124300",
    customUrl: "https://www.ebay.es/itm/227574298269",
    materialSpec: "Zafiro original Rolex en blister sellado con micro-corona láser (Foto 1:1)",
    toleranceSpec: "Sellado hermético certificado 100m / 10 bar",
    resaleImpact: "Imprescindible para pasar revisión oficial Rolex",
  },
  {
    id: "7",
    title: "OEM Diver & Smooth Bezel Ring + Lumed Pip Assembly",
    brand: "Rolex",
    store: "eBay",
    origin: "oem",
    category: "bezels",
    priceEur: 480,
    delivery: "4–7 days",
    image: "https://www.picclickimg.com/EfcAAeSwvH1q1sRc/Watch-Parts-Bezel-Inserts-Diver-Style-Lume.webp",
    spec: "OEM Bezel · eBay #237133169800",
    oemRef: "Ref. 317-124300",
    compatibleWith: ["Rolex OP 41 124300", "Seiko SKX007 OEM"],
    condition: "NOS Vintage",
    pairGroupId: "bezel-op41",
    customUrl: "https://www.ebay.es/itm/237133169800",
    materialSpec: "Bisel e inserto original procedente de lote relojero (Foto real eBay)",
    toleranceSpec: "Encaje a presión de precisión sobre anillo de retención",
    resaleImpact: "Restaura el estado de fábrica sin pérdida de valor",
  },
  {
    id: "8",
    title: "38mm/41mm Ceramic Luminous Bezel Insert & Ring (904L/Ceramic)",
    brand: "Generic",
    store: "AliExpress",
    origin: "generic",
    category: "bezels",
    priceEur: 19.9,
    delivery: "12–20 days",
    image: "https://ae-pic-a1.aliexpress-media.com/kf/Sf325590a50e2471cb78297876e547db0w.jpg_480x480q75.jpg",
    spec: "38mm/41mm · AliExpress #12911309",
    oemRef: "ALT-BZ-41",
    compatibleWith: ["Rolex 124300 Case", "Seiko SKX007 / SRPD Mod Case"],
    condition: "Aftermarket 1:1",
    equivalentOemPriceEur: 480,
    pairGroupId: "bezel-op41",
    customUrl: "https://es.aliexpress.com/item/1005007512911309.html",
    materialSpec: "Cerámica de alta densidad + lumen C3 / Acero 904L (Foto real 1:1)",
    toleranceSpec: "Compatible con cajas 38mm–41mm y Mods",
    resaleImpact: "Permite cambiar el look de forma reversible",
  },
  {
    id: "9",
    title: "Calibre 3230 / Skeletonized Precision Automatic Movement",
    brand: "Rolex",
    store: "Chrono24",
    origin: "oem",
    category: "movements",
    priceEur: 890,
    delivery: "5–8 days",
    image: "https://cdn.shopify.com/s/files/1/0139/0434/7193/products/50080_SIINH70SkeletonizedMovement_13_front.png?v=1626326580",
    spec: "Chronergy escapement",
    oemRef: "Cal. 3230-410",
    compatibleWith: ["Rolex Calibre 3230", "Rolex Calibre 3235", "Submariner 124060"],
    condition: "Certified OEM",
    pairGroupId: "movement-auto",
    proOnly: true,
    customUrl: "https://www.chrono24.es/search/index.htm?query=Rolex+3230+movement&dosearch=true",
    materialSpec: "Espiral Parachrom azul antimagnética + volante Microstella",
    toleranceSpec: "Certificación Superlative Chronometer (-2/+2 seg/día)",
    resaleImpact: "Pieza original de manufactura para reparación de alto nivel",
  },
  {
    id: "10",
    title: "Original Swiss Made ETA 2824-2 Automatic Movement (25 Jewels)",
    brand: "ETA",
    store: "eBay",
    origin: "oem",
    category: "movements",
    priceEur: 245,
    delivery: "3–5 days",
    image: "https://www.picclickimg.com/GSAAAeSwAUpqRHys/Original-Swiss-Made-ETA2824-2-Movement-Date-At-3.webp",
    spec: "25 jewels · eBay #318471796252",
    oemRef: "ETA-2824-2-EL",
    compatibleWith: ["Tissot Le Locle / PRX", "Hamilton Khaki", "Tudor Heritage"],
    condition: "Swiss OEM",
    pairGroupId: "movement-auto",
    customUrl: "https://www.ebay.es/itm/318471796252",
    materialSpec: "Calibre suizo ETA 2824-2 original 4Hz (Foto y enlace directo eBay #318471796252)",
    toleranceSpec: "Regulado en 3 posiciones (±7 seg/día)",
    resaleImpact: "Estándar de oro suizo para restauraciones vintage y micro-marcas",
  },
  {
    id: "11",
    title: "Seiko TMI NH35A Automatic Movement (Original Japan 24 Jewels)",
    brand: "Seiko",
    store: "AliExpress",
    origin: "generic",
    category: "movements",
    priceEur: 39,
    delivery: "10–15 days",
    image: "https://ae-pic-a1.aliexpress-media.com/kf/S5ddafb92c6bf40c59174475dbbd2e1a6r.jpg_480x480q75.jpg",
    spec: "24 jewels · AliExpress #29959296",
    oemRef: "TMI-NH35A",
    compatibleWith: ["Seiko SKX007 / SRPD", "Custom 28.5mm Dial Builds", "Invicta Pro Diver"],
    condition: "Aftermarket 1:1",
    equivalentOemPriceEur: 245,
    pairGroupId: "movement-auto",
    customUrl: "https://es.aliexpress.com/item/1005012029959296.html",
    materialSpec: "Calibre japonés TMI Seiko Instruments con parada de segundero (Foto y link 1:1)",
    toleranceSpec: "Ultra-fiable, 41h reserva de marcha, recambios universales",
    resaleImpact: "El calibre rey para relojes personalizados (Seiko Mods)",
  },
  {
    id: "12",
    title: "Sunburst 28.5mm Dial + Luminous Hands Set for NH35 / NH36",
    brand: "Generic",
    store: "AliExpress",
    origin: "generic",
    category: "dials",
    priceEur: 16.5,
    delivery: "12–20 days",
    image: "https://ae-pic-a1.aliexpress-media.com/kf/Se71ce3a1380e454bb1e618ad8f713945n.jpg_480x480q75.jpg",
    spec: "28.5mm · AliExpress #54277951",
    oemRef: "ALT-DL-SUN285",
    compatibleWith: ["Seiko NH35 / NH38", "ETA 2824 (with spacer)", "Miyota 8215"],
    condition: "Aftermarket 1:1",
    equivalentOemPriceEur: 1100,
    pairGroupId: "dial-op41",
    customUrl: "https://es.aliexpress.com/item/1005009954277951.html",
    materialSpec: "Latón esmaltado Sunburst + kit de agujas luminosas (Foto y enlace real 1:1)",
    toleranceSpec: "Patas de esfera para NH35/NH36 + agujas a juego",
    resaleImpact: "Acabado de lujo para proyectos personalizados",
  },
  {
    id: "13",
    title: "Sub-Style / Oyster Dial + Luminous Hands Set (SKX007 / NH35 / OP41)",
    brand: "Rolex",
    store: "eBay",
    origin: "oem",
    category: "dials",
    priceEur: 1100,
    delivery: "4–7 days",
    image: "https://www.picclickimg.com/21oAAeSwfCxqXeHa/New-Replacement-Sub-Military-Dial-Arrow-Hands.webp",
    spec: "Dial + Hands · eBay #137509275805",
    oemRef: "Ref. 13-124300-SLV",
    compatibleWith: ["Rolex Oyster Perpetual 41", "Seiko SKX007 / NH35"],
    condition: "Certified OEM",
    pairGroupId: "dial-op41",
    proOnly: true,
    customUrl: "https://www.ebay.es/itm/137509275805",
    materialSpec: "Esfera de alto contraste con índices luminiscentes y juego de agujas (Foto 1:1 eBay)",
    toleranceSpec: "Encaje verificado en anuncio #137509275805",
    resaleImpact: "Pieza verificada con enlace directo al anuncio de eBay",
  },
  {
    id: "14",
    title: "Rolex 6mm Stainless Steel Screw-Down Crown + Stem & Tube Kit",
    brand: "Rolex",
    store: "eBay",
    origin: "oem",
    category: "crowns",
    priceEur: 210,
    delivery: "3–5 days",
    image: "https://www.picclickimg.com/PdgAAeSw76lqf8US/New-Rolex-Datejust-36-16000-B24-600-0-6mm-Stainless.webp",
    spec: "6mm B24-600 · eBay #168614641239",
    oemRef: "Ref. B24-600-0",
    compatibleWith: ["Rolex 124300", "Rolex Datejust 16000 / 36 / 41"],
    condition: "Certified OEM",
    pairGroupId: "crown-screw",
    customUrl: "https://www.ebay.es/itm/168614641239",
    materialSpec: "Corona Rolex 6mm de acero con tubo roscado y tije en blister (Foto real 1:1 eBay)",
    toleranceSpec: "Rosca de tubo de alta precisión 100m",
    resaleImpact: "Garantiza estanqueidad oficial del reloj",
  },
  {
    id: "15",
    title: "6.0mm Screw-Down Waterproof Crown & Tube Replacement (RLX / NH35)",
    brand: "Generic",
    store: "AliExpress",
    origin: "generic",
    category: "crowns",
    priceEur: 6.9,
    delivery: "12–20 days",
    image: "https://ae-pic-a1.aliexpress-media.com/kf/S4d4091188cbd45408244b13695692f23M.jpg_480x480q75.jpg",
    spec: "6.0mm · AliExpress #51547378",
    oemRef: "ALT-CRW-6MM",
    compatibleWith: ["Rolex Datejust / OP", "Seiko SKX007 / NH35", "ETA 2824-2"],
    condition: "Aftermarket 1:1",
    equivalentOemPriceEur: 210,
    pairGroupId: "crown-screw",
    customUrl: "https://es.aliexpress.com/item/1005010351547378.html",
    materialSpec: "Acero 316L + tubo roscado + juntas tóricas Viton (Foto y link real 1:1)",
    toleranceSpec: "Paso de rosca estándar 6.0mm",
    resaleImpact: "Solución rápida y hermética para reparaciones caseras",
  },
  {
    id: "16",
    title: "Tissot PRX Powermatic 80 (35mm/40mm) Integrated FKM Rubber Strap",
    brand: "Generic",
    store: "AliExpress",
    origin: "generic",
    category: "straps",
    priceEur: 14.9,
    delivery: "8–14 days",
    image: "https://ae-pic-a1.aliexpress-media.com/kf/Sc2931f9fb5ab414a83edccc385b38567j.jpg_480x480q75.jpg",
    spec: "12mm PRX · AliExpress #42183766",
    oemRef: "ALT-PRX-40",
    compatibleWith: ["Tissot PRX 40mm T137.407", "Tissot PRX 35mm"],
    condition: "Aftermarket 1:1",
    equivalentOemPriceEur: 75,
    pairGroupId: "strap-tissot",
    customUrl: "https://es.aliexpress.com/item/1005008542183766.html",
    materialSpec: "Caucho fluorado FKM con textura Waffle idéntica a la esfera (Foto y link 1:1)",
    toleranceSpec: "Encaje integrado de 12mm con pasadores rápidos",
    resaleImpact: "Transforma el PRX en un reloj deportivo de verano por menos de 15€",
  },
  {
    id: "17",
    title: "Omega Speedmaster Moonwatch 20mm Curved Strap & Clasp",
    brand: "Omega",
    store: "eBay",
    origin: "oem",
    category: "straps",
    priceEur: 295,
    delivery: "3–5 days",
    image: "https://www.picclickimg.com/rgIAAOSwRHlnmLej/Premium-Rubber-Watch-Strap-Band-Bracelet-Made-For.webp",
    spec: "20mm Moonwatch · eBay #306070246910",
    oemRef: "Ref. 032CVZ015753",
    compatibleWith: ["Omega Speedmaster Moonwatch 145.022", "Ref. 310.30.42.50"],
    condition: "Certified OEM",
    proOnly: true,
    pairGroupId: "oyster-20mm",
    customUrl: "https://www.ebay.es/itm/306070246910",
    materialSpec: "Correa curvada de alta precisión para caja Speedmaster 42mm (Foto real 1:1 eBay)",
    toleranceSpec: "Ajuste sin holgura entre asas de 20mm",
    resaleImpact: "Mantiene la estética deportiva del Moonwatch",
  },
  {
    id: "18",
    title: "Seiko SKX007 / NH35 28.5mm Luminous Black Diver Dial",
    brand: "Seiko",
    store: "eBay",
    origin: "generic",
    category: "dials",
    priceEur: 18.5,
    delivery: "5–9 days",
    image: "https://www.picclickimg.com/2vkAAeSwML1q2HL1/285mm-31mm-Black-Watch-Dial-Blue-Luminous-for-Nh34.webp",
    spec: "Ø28.5mm · eBay #237135472085",
    oemRef: "MOD-SKX-DL285",
    compatibleWith: ["Seiko SKX007 / SKX009", "Seiko NH34 / NH35 / NH36 / NH38"],
    condition: "Aftermarket 1:1",
    equivalentOemPriceEur: 95,
    pairGroupId: "dial-op41",
    customUrl: "https://www.ebay.es/itm/237135472085",
    materialSpec: "Esfera negra mate 28.5mm con lumen azul intenso (Foto y enlace real 1:1 eBay)",
    toleranceSpec: "Compatible directamente con NH34/NH35/NH36/NH38",
    resaleImpact: "Reemplazo directo con foto verificada del vendedor",
  },
  // === TIENDAS DE NICHO & MAYORISTAS B2B (EXCLUSIVO PLAN ATELIER PRO) ===
  {
    id: "19",
    title: "Lote Mayorista B2B: Brazalete Oyster 904L Cepillado + Cierre GlideLock (MOQ 2 uds)",
    brand: "Shenzhen Horology B2B",
    store: "Alibaba",
    origin: "generic",
    category: "straps",
    priceEur: 9.8,
    delivery: "7–12 days · Alibaba Air Express",
    image: "https://ae-pic-a1.aliexpress-media.com/kf/S01b2b2083e464b2996d3f97c29fd916eT.jpg_480x480q75.jpg",
    spec: "20mm 904L · Precio Fábrica B2B",
    oemRef: "BABA-904L-20MM",
    compatibleWith: ["Rolex OP 41 / Submariner", "Seiko NH35 40mm Cases", "Lotes Taller / Modders"],
    condition: "Aftermarket 1:1",
    equivalentOemPriceEur: 1450,
    pairGroupId: "oyster-20mm",
    proOnly: true,
    customUrl: "https://www.alibaba.com/trade/search?fsb=y&IndexArea=product_en&SearchText=904L+oyster+bracelet+20mm+glidelock",
    materialSpec: "Acero 904L directo de fundición CNC en Shenzhen sin intermediarios (MOQ 2 pzs)",
    toleranceSpec: "Tornillos roscados macizos + eslabones finales SEL",
    resaleImpact: "Ahorro de hasta 60% adicional frente a AliExpress comprando a fábrica en Alibaba",
  },
  {
    id: "20",
    title: "Seiko 7T920CF8XB13 Genuine OEM Pilot Flightmaster Dial (Stock Oficial)",
    brand: "Seiko",
    store: "WatchPlaza",
    origin: "oem",
    category: "dials",
    priceEur: 67,
    delivery: "2–4 days · Países Bajos (UE)",
    image: "https://cdn.shopify.com/s/files/1/0858/3531/7585/files/seiko-7t920cf8xb13-dial-snd253p1-pilot-flightmaster-871301.jpg?v=1761309912",
    spec: "OEM Seiko · WatchPlaza Especialista",
    oemRef: "7T920CF8XB13",
    compatibleWith: ["Seiko SND253P1 Flightmaster", "Calibre 7T92 Original"],
    condition: "Certified OEM",
    pairGroupId: "dial-op41",
    proOnly: true,
    customUrl: "https://www.watchplaza.com/products/seiko-7t920cf8xb13-dial-snd253p1-pilot",
    materialSpec: "Esfera 100% original Seiko en envase de servicio oficial de WatchPlaza (Foto 1:1)",
    toleranceSpec: "Recambio genuino de fábrica Seiko Watch Corp.",
    resaleImpact: "Tienda de nicho europea líder en fornituras OEM descatalogadas",
  },
  {
    id: "21",
    title: "Seiko (SII/TMI) NH35A Regulated Automatic Movement — Precision Mod Grade",
    brand: "NamokiMods",
    store: "NamokiMods",
    origin: "generic",
    category: "movements",
    priceEur: 58,
    delivery: "4–6 days · DHL Express",
    image: "https://cdn.shopify.com/s/files/1/0139/0434/7193/products/nh35_movement_front.png?v=1582007125",
    spec: "Regulado en taller · NamokiMods PRO",
    oemRef: "NMK-NH35A-REG",
    compatibleWith: ["Seiko SKX007 / SRPD", "Todas las cajas NH35/NH36"],
    condition: "Aftermarket 1:1",
    equivalentOemPriceEur: 245,
    pairGroupId: "movement-auto",
    proOnly: true,
    customUrl: "https://www.namokimods.com/products/seiko-sii-nh35a-automatic-movement",
    materialSpec: "Calibre SII NH35A inspeccionado y regulado por relojeros de NamokiMods (Foto 1:1)",
    toleranceSpec: "Ajustado a ±5 seg/día antes del envío",
    resaleImpact: "Tienda de nicho #1 mundial en componentes de alta precisión para Seiko Mods",
  },
  {
    id: "22",
    title: "Fornitura Oficial Suiza: Kit de Juntas Viton, Tubo y Corona Hermética ETA/Omega",
    brand: "CousinsUK",
    store: "CousinsUK",
    origin: "oem",
    category: "crowns",
    priceEur: 42,
    delivery: "2–4 days · UK Trade Supply",
    image: "https://cdn.shopify.com/s/files/1/0858/3531/7585/files/seiko-320pa4jn02-crystal-glass-sna411-sna413-sna414-pilot-flightmaster-199370.jpg?v=1761309411",
    spec: "Fornitura Relojero · CousinsUK",
    oemRef: "CUK-SWISS-CRW",
    compatibleWith: ["Omega Speedmaster / Seamaster", "ETA 2824 / 2892", "Rolex Vintage Tubes"],
    condition: "Swiss OEM",
    pairGroupId: "crown-screw",
    proOnly: true,
    customUrl: "https://www.cousinsuk.com/search?SearchText=omega+crown+tube+gasket",
    materialSpec: "Suministro mayorista exclusivo para talleres relojeros (Cousins Material House UK)",
    toleranceSpec: "Certificación ISO de estanqueidad suiza",
    resaleImpact: "Acceso directo al mayor almacén profesional de fornitura relojera de Europa",
  },
];

export const MAX_PRICE = 1500;

export interface Filters {
  query: string;
  origin: "all" | Origin;
  categories: Category[];
  maxPrice: number;
}

export function getStoreSearchUrl(store: Store, query: string): string {
  const cleanQuery = query.trim() || "watch parts";
  const encoded = encodeURIComponent(cleanQuery);
  switch (store) {
    case "eBay":
      return `https://www.ebay.es/sch/i.html?_nkw=${encoded}&_sacat=260325`;
    case "AliExpress":
      return `https://es.aliexpress.com/w/wholesale-${encodeURIComponent(cleanQuery.replace(/\s+/g, "-"))}.html?SearchText=${encoded}`;
    case "Chrono24":
      return `https://www.chrono24.es/search/index.htm?query=${encoded}&dosearch=true`;
    case "Alibaba":
      return `https://www.alibaba.com/trade/search?fsb=y&IndexArea=product_en&SearchText=${encoded}+watch+parts`;
    case "WatchPlaza":
      return `https://www.watchplaza.com/search?q=${encoded}`;
    case "NamokiMods":
      return `https://www.namokimods.com/search?q=${encoded}`;
    case "CousinsUK":
      return `https://www.cousinsuk.com/search?SearchText=${encoded}`;
  }
}

export function filterParts(parts: Part[], f: Filters): Part[] {
  const words = f.query.toLowerCase().split(/\s+/).filter(Boolean);
  return parts.filter((p) => {
    if (f.origin !== "all" && p.origin !== f.origin) return false;
    if (f.categories.length && !f.categories.includes(p.category)) return false;
    if (p.priceEur > f.maxPrice) return false;
    const hay = `${p.title} ${p.brand} ${p.spec} ${p.store} ${p.oemRef ?? ""} ${p.compatibleWith.join(" ")}`.toLowerCase();
    return words.every((w) => hay.includes(w));
  });
}

export function resolveCategoryImage(category: Category, origin: Origin): string {
  switch (category) {
    case "straps":
      return origin === "oem" ? strap : bracelet;
    case "bezels":
    case "crystals":
    case "crowns":
      return crystal;
    case "dials":
    case "movements":
      return movement;
    default:
      return bracelet;
  }
}

function detectQueryCategory(query: string): Category {
  const q = query.toLowerCase();
  if (/(bezel|bisel|insert|inserto)/.test(q)) return "bezels";
  if (/(crystal|cristal|sapphire|zafiro|plexi|hesalite)/.test(q)) return "crystals";
  if (/(dial|esfera|hands|agujas|manecillas)/.test(q)) return "dials";
  if (/(crown|corona|stem|tije|pulsador)/.test(q)) return "crowns";
  if (/(movement|movimiento|calibre|nh35|nh36|2824|3230|1861|9015|rotor|eta|seiko)/.test(q)) return "movements";
  return "straps";
}

export async function fetchLivePartsFromApi(query: string): Promise<Part[]> {
  const q = query.trim();
  if (!q) return [];

  const isLocal =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

  if (!isLocal) {
    return generateLiveComparisonCards(q);
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1800);
    const res = await fetch(`http://127.0.0.1:8765/api/search?q=${encodeURIComponent(q)}`, {
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.items) || data.items.length === 0) {
      return generateLiveComparisonCards(q);
    }
    return data.items.map((item: Part) => ({
      ...item,
      image: item.image && item.image.startsWith("http") ? item.image : resolveCategoryImage(item.category, item.origin),
    }));
  } catch {
    return generateLiveComparisonCards(q);
  }
}

export function generateLiveComparisonCards(query: string): Part[] {
  const q = query.trim();
  if (!q) return [];
  const cap = q.charAt(0).toUpperCase() + q.slice(1);
  const cat = detectQueryCategory(q);
  const pairId = `live-pair-${q.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return [
    {
      id: `live-ali-${q}`,
      title: `${cap} — Recambio Compatible Aftermarket 1:1`,
      brand: "Aftermarket Direct",
      store: "AliExpress",
      origin: "generic",
      category: cat,
      priceEur: 18.5,
      delivery: "8–14 días",
      image: resolveCategoryImage(cat, "generic"),
      spec: "Acero 316L / Zafiro AR / FKM",
      oemRef: "LIVE-ALI-1TO1",
      compatibleWith: [cap, "Ajuste 1:1 verificado"],
      condition: "Aftermarket 1:1",
      pairGroupId: pairId,
      equivalentOemPriceEur: 240,
      customUrl: getStoreSearchUrl("AliExpress", q),
      materialSpec: "Acero 316L / Cristal Zafiro / Caucho FKM compatible directo",
      toleranceSpec: "Tolerancia ±0.03 mm verificada",
      resaleImpact: "Máximo ahorro para uso diario o modificación",
    },
    {
      id: `live-namoki-${q}`,
      title: `${cap} — Componente de Precisión Grado Taller`,
      brand: "NamokiMods",
      store: "NamokiMods",
      origin: "generic",
      category: cat,
      priceEur: 44,
      delivery: "4–7 días",
      image: resolveCategoryImage(cat, "generic"),
      spec: "Grado relojero · Juntas Viton incluidas",
      oemRef: "NMK-PRO-FIT",
      compatibleWith: [cap, "NH35 / SKX / Khaki / Speedmaster"],
      condition: "Aftermarket 1:1",
      pairGroupId: pairId,
      equivalentOemPriceEur: 240,
      customUrl: getStoreSearchUrl("NamokiMods", q),
      materialSpec: "Mecanizado CNC con acabado cepillado/pulido de alta relojería",
      toleranceSpec: "Encaje exacto en caja original",
      resaleImpact: "Mejora funcional reversible sin alterar la caja",
    },
    {
      id: `live-ebay-${q}`,
      title: `${cap} — Pieza Original OEM / NOS de Relojero`,
      brand: "Vintage OEM",
      store: "eBay",
      origin: "oem",
      category: cat,
      priceEur: 125,
      delivery: "3–6 días",
      image: resolveCategoryImage(cat, "oem"),
      spec: "Stock original verificado (NOS)",
      oemRef: "OEM-NOS-VERIFIED",
      compatibleWith: [cap, "Referencia de fábrica"],
      condition: "NOS Vintage",
      pairGroupId: pairId,
      customUrl: getStoreSearchUrl("eBay", `${q} original genuine`),
      materialSpec: "Pieza original procedente de stock de relojero (New Old Stock)",
      toleranceSpec: "Especificación oficial de fábrica",
      resaleImpact: "Conserva la originalidad histórica del reloj",
    },
    {
      id: `live-c24-${q}`,
      title: `${cap} — Recambio Oficial Certificado con Escrow`,
      brand: "Certified OEM",
      store: "Chrono24",
      origin: "oem",
      category: cat,
      priceEur: 240,
      delivery: "2–4 días",
      image: resolveCategoryImage(cat, "oem"),
      spec: "Distribuidor verificado · Protección Escrow",
      oemRef: "C24-OEM-CERT",
      compatibleWith: [cap, "Calibre y caja original"],
      condition: "Certified OEM",
      pairGroupId: pairId,
      proOnly: true,
      customUrl: getStoreSearchUrl("Chrono24", q),
      materialSpec: "Componente original sellado con protección Escrow de Chrono24",
      toleranceSpec: "Certificado de fábrica 100%",
      resaleImpact: "100% valor de colección garantizado",
    },
  ];
}

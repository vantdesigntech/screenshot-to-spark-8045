import type { Category } from "@/lib/parts";

export interface BlogArticle {
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  readTime: string;
  publishedAt: string;
  targetKeywords: string[];
  heroImage: string;
  relatedSearchQuery: string;
  relatedCategory: Category;
  oemSavingsHighlight: string;
  summary: string;
  sections: {
    heading: string;
    body: string;
    specsTable?: { param: string; oemValue: string; aftermarketValue: string }[];
  }[];
  faqs: { q: string; a: string }[];
}

export const SEO_BLOG_ARTICLES: BlogArticle[] = [
  {
    slug: "compatibilidad-seiko-nh35-eta-2824-miyota-9015",
    title:
      "Guía Definitiva de Compatibilidad: Seiko NH35 vs ETA 2824-2 vs Miyota 9015 (Medidas de Agujas, Esferas y Tijas)",
    subtitle:
      "Tabla maestra de taller para relojeros y modders: diámetros de cañón de agujas, altura de eje, patas de esfera y conversión de cajas.",
    category: "Calibres & Equivalencias",
    readTime: "7 min lectura",
    publishedAt: "2026-10-27",
    targetKeywords: [
      "compatibilidad seiko nh35 eta 2824",
      "medidas agujas nh35",
      "esfera 28.5mm nh35",
      "calibre nh35 vs miyota 9015",
    ],
    heroImage: "/blog/blog-1.jpg",
    relatedSearchQuery: "Seiko NH35",
    relatedCategory: "movements",
    oemSavingsHighlight: "Ahorra hasta un 84% usando TMI NH35A (39€) frente a calibres suizos OEM.",
    summary:
      "Antes de comprar una esfera de 28.5mm o un juego de agujas en eBay, WatchPlaza o AliExpress, es crítico verificar el diámetro de los cañones (horas/minutos/segundos) y la altura del eje (stem height).",
    sections: [
      {
        heading: "1. Diámetros de Agujas (Hand Hole Sizes) y Altura de Eje",
        body: "El error más frecuente en un proyecto de restauración o Seiko Mod es intentar montar agujas de ETA 2824-2 (1.50 / 0.90 / 0.25 mm) en un Seiko NH35A/NH36A (1.50 / 0.89 / 0.21 mm). Mientras que la aguja horaria encaja, el segundero de ETA queda holgado en NH35 salvo que se ajuste la virola.",
        specsTable: [
          {
            param: "Diámetro Agujas (H / M / S)",
            oemValue: "ETA 2824-2: 1.50 / 0.90 / 0.25 mm",
            aftermarketValue: "Seiko NH35A: 1.50 / 0.89 / 0.21 mm (Miyota 9015: 1.52 / 1.00 / 0.17 mm)",
          },
          {
            param: "Diámetro del Calibre / Grosor",
            oemValue: "ETA 2824-2: Ø25.60 mm × 4.60 mm",
            aftermarketValue: "Seiko NH35A: Ø27.40 mm × 5.32 mm (con bata plástica)",
          },
          {
            param: "Frecuencia y Reserva de Marcha",
            oemValue: "28.800 vph (4 Hz) · 38–42 horas",
            aftermarketValue: "21.600 vph (3 Hz) · 41 horas (Bidireccional Magic Lever)",
          },
          {
            param: "Coste Medio Recambio",
            oemValue: "245 € (Suizo OEM / Sellita SW200)",
            aftermarketValue: "39 € (TMI NH35A Nuevo Japón/Malasia)",
          },
        ],
      },
      {
        heading: "2. Posición de Patas de Esfera (Dial Feet) según Posición de Corona",
        body: "En el calibre Seiko NH35/4R35, la misma esfera de 28.5mm puede montarse en cajas con corona a las 3:00 (estilo Submariner/Datejust), a las 3.8 (SKX007 clásico) o a las 4.1 (Willard). Los discos de calendario para corona a las 3h y a las 3.8h coinciden en alineación si usas el calibre NH35 estándar.",
      },
    ],
    faqs: [
      {
        q: "¿Sirve una esfera de Seiko SKX007 (7S26) en un movimiento NH35?",
        a: "Sí, es 100% compatible de forma directa (plug & play) siempre que la posición de la corona coincida (3h o 3.8h).",
      },
      {
        q: "¿Qué tija (stem) necesito para un Seiko NH35?",
        a: "Necesitas la tija referencia TMI 351177 (o Seiko 351578). No es compatible con la tija del antiguo 7S26.",
      },
    ],
  },
  {
    slug: "restaurar-seiko-skx007-cristal-zafiro-bisel-ceramico",
    title:
      "Cómo Restaurar y Mejorar un Seiko SKX007 / SKX009: Cristal de Zafiro Double Dome, Bisel Cerámico y Calibre NH36",
    subtitle:
      "Guía paso a paso con referencias exactas OEM de WatchPlaza frente a kits de NamokiMods y AliExpress.",
    category: "Restauración & Modding",
    readTime: "6 min lectura",
    publishedAt: "2026-10-27",
    targetKeywords: [
      "cristal zafiro seiko skx007 medidas",
      "bisel ceramico skx007 38mm",
      "actualizar 7s26 a nh36",
      "junta cristal skx007 OEM",
    ],
    heroImage: "/blog/blog-2.jpg",
    relatedSearchQuery: "Seiko SKX007",
    relatedCategory: "bezels",
    oemSavingsHighlight: "Restauración completa por 68€ en piezas Aftermarket vs 295€ en recambio OEM NOS.",
    summary:
      "El Seiko SKX007 (Ref. 7S26-0020) dejó de fabricarse en 2019 y su cotización no deja de subir. Te mostramos las medidas exactas de juntas, cristal e inserto para restaurarlo o convertirlo en un diver de altas prestaciones.",
    sections: [
      {
        heading: "1. Medidas Exactas del Cristal y del Inserto de Bisel del SKX007",
        body: "El cristal original Hardlex (Ref. 310W17LN00) mide exactamente 31.50 mm de diámetro por 2.80 mm de espesor. Si instalas un cristal de zafiro Double Dome con biselado para insertos inclinados (sloped), recuerda revisar la junta de teflón/nylon en L.",
        specsTable: [
          {
            param: "Cristal SKX007 / SKX009",
            oemValue: "Ø31.50 mm × 2.8 mm Hardlex (Ref. 310W17LN00)",
            aftermarketValue: "Ø31.50 mm Zafiro Double Dome AR Azul (18–42 €)",
          },
          {
            param: "Inserto de Bisel (Bezel Insert)",
            oemValue: "Ø38.00 mm ext × Ø31.50 mm int (Aluminio Plano)",
            aftermarketValue: "Ø38.00 mm × Ø30.60 mm (Cerámico Sloped con Lume C3)",
          },
          {
            param: "Ancho de Asas (Lug Width)",
            oemValue: "22 mm · Brazalete Jubilee Ref. 44G1ZZ",
            aftermarketValue: "22 mm · Oyster / Jubilee Macizo 316L Tornillos (26 €)",
          },
        ],
      },
    ],
    faqs: [
      {
        q: "¿Qué diferencia hay entre inserto plano (Flat) e inclinado (Sloped) en el SKX007?",
        a: "El inserto plano mide 31.5mm de diámetro interior y encaja con el cristal original plano. El inserto inclinado (30.6mm interior) requiere un cristal de zafiro abombado (domed) de 30.5mm en el escalón superior.",
      },
    ],
  },
  {
    slug: "guia-referencias-oem-rolex-oyster-perpetual-124300-datejust",
    title:
      "Rolex Oyster Perpetual 41 (Ref. 124300) y Datejust: Guía de Referencias OEM, Cristales LEC y Brazaletes 904L",
    subtitle:
      "Cómo identificar un cristal de zafiro original con corona grabada a láser (LEC), eslabones de acero 904L y calibres 3230/3235.",
    category: "Alta Relojería & OEM",
    readTime: "8 min lectura",
    publishedAt: "2026-10-27",
    targetKeywords: [
      "rolex 124300 cristal zafiro",
      "brazalete oyster 20mm 904l",
      "calibre 3230 recambios",
      "corona grabada laser rolex lec",
    ],
    heroImage: "/blog/blog-3.jpg",
    relatedSearchQuery: "Rolex 124300",
    relatedCategory: "crystals",
    oemSavingsHighlight: "Compara fornitura certificada en Chrono24/CousinsUK vs acero 904L aftermarket.",
    summary:
      "Tanto si buscas un eslabón adicional original en acero Oystersteel 904L como un cristal de recambio con junta Hytrel, esta guía reúne las tolerancias y pruebas de autenticidad esenciales.",
    sections: [
      {
        heading: "1. Acero 904L vs 316L y Corona Grabada a Láser (LEC)",
        body: "Desde principios de los 2000, los cristales de zafiro Rolex incorporan una micro-corona grabada con láser a las 6 en punto compuesta por 5 círculos en la base y puntos a distintas profundidades del cristal para no debilitar su resistencia estructural.",
        specsTable: [
          {
            param: "Cristal y Junta Hermética",
            oemValue: "Zafiro Sintético LEC + Junta Hytrel Ref. 25-295",
            aftermarketValue: "Zafiro AR Ø31.5mm con junta de teflón compatible (14–29 €)",
          },
          {
            param: "Brazalete Oyster 20mm",
            oemValue: "Oystersteel 904L · Cierre Easylink 5mm",
            aftermarketValue: "Acero 904L Cepillado con terminales curvos (24–48 €)",
          },
        ],
      },
    ],
    faqs: [
      {
        q: "¿Cómo distinguir una esfera original de Rolex OP 41 de una réplica o aftermarket?",
        a: "Los índices aplicados y la corona a las 12 en punto están fabricados en oro blanco de 18 quilates con luminiscencia Chromalight azul de larga duración y tipografía serigrafiada de alta densidad sin sangrado bajo lupa 10x.",
      },
    ],
  },
  {
    slug: "tissot-prx-powermatic-80-cambio-correa-integrada-cristal",
    title:
      "Tissot PRX 40mm (Powermatic 80 y Cuarzo): Guía de Correas Integradas, Eslabones OEM y Calibre C07.111",
    subtitle:
      "Todo sobre el sistema de pasador rápido de 12mm en caja tonneau de 40mm y comparativa entre brazalete original y caucho FKM waffle.",
    category: "Guías de Modelo",
    readTime: "5 min lectura",
    publishedAt: "2026-10-27",
    targetKeywords: [
      "correa caucho tissot prx 40mm",
      "brazalete original tissot prx",
      "calibre powermatic 80 c07.111 recambios",
    ],
    heroImage: "/blog/blog-4.jpg",
    relatedSearchQuery: "Tissot PRX",
    relatedCategory: "straps",
    oemSavingsHighlight: "Correas integradas FKM Waffle con cambio rápido desde 18,90€ vs 195€ del armis OEM.",
    summary:
      "El Tissot PRX utiliza una geometría de asa integrada muy específica: 12mm en el encaje central que se ensancha a 26.5mm en los hombros de la caja de 40mm.",
    sections: [
      {
        heading: "1. Geometría del Asa Integrada del Tissot PRX 40mm (T137.407 / T137.410)",
        body: "Tanto la versión automática Powermatic 80 (T137.407) como la versión de cuarzo ETA F06.115 (T137.410) de 40mm comparten exactamente la misma geometría de caja y admiten los mismos brazaletes y correas de caucho/piel con pasadores quick-release.",
        specsTable: [
          {
            param: "Encaje de Correa (Lug Notch)",
            oemValue: "12.0 mm central / 26.5 mm hombro de caja (Ref. T605046447)",
            aftermarketValue: "Caucho FKM Textura Waffle con inserto metálico 12mm (18,90 €)",
          },
          {
            param: "Calibre Automático",
            oemValue: "ETA C07.111 Powermatic 80 (21.600 vph · 80h reserva)",
            aftermarketValue: "Compatible en anclaje de bata con familia ETA 2824-2",
          },
        ],
      },
    ],
    faqs: [
      {
        q: "¿Valen las correas del Tissot PRX de 40mm para el PRX de 35mm?",
        a: "No. El PRX de 35mm utiliza un encaje central de 11mm (frente a los 12mm del modelo de 40mm).",
      },
    ],
  },
];

const LOCAL_BLOG_IMAGES = [
  "/blog/blog-1.jpg",
  "/blog/blog-2.jpg",
  "/blog/blog-3.jpg",
  "/blog/blog-4.jpg",
];

export function resolveBlogFallbackImage(index = 0): string {
  return LOCAL_BLOG_IMAGES[Math.abs(index) % LOCAL_BLOG_IMAGES.length] ?? "/blog/blog-1.jpg";
}

/**
 * Primary Spanish SEO positioning keywords for ChronoParts (Marketplace & Parts Search Engine)
 */
export const CHRONOPARTS_SEO_KEYWORDS = [
  "marketplace de relojes España",
  "buscador de componentes de relojería",
  "componentes reloj",
  "recambios de relojes OEM y aftermarket",
  "fornituras de relojería España",
  "cristal de zafiro reloj",
  "calibres automáticos Seiko NH35 ETA 2824 Miyota 9015",
  "bisel cerámico SKX007",
  "comparador de piezas de relojes",
  "compra venta relojes España",
] as const;

/**
 * Generates HTML `<head>` metadata array following `seo-repos/html-head-seo` (joshbuchea/HEAD)
 * for positioning in Spain (`es-ES`) as a Watch Marketplace & Watch Parts Search Engine.
 */
export function buildChronoPartsHeadMeta() {
  const title =
    "Cronora España | Buscador de Componentes de Reloj, Recambios OEM/Aftermarket y Marketplace";
  const description =
    "Buscador de componentes de reloj y comparador de recambios OEM y aftermarket en España. Encuentra cristales de zafiro, calibres (NH35, ETA 2824, Miyota), biseles, agujas, correas y marketplace de relojes.";

  return [
    { charSet: "utf-8" },
    { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
    { title },
    { name: "description", content: description },
    { name: "keywords", content: CHRONOPARTS_SEO_KEYWORDS.join(", ") },
    { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1" },
    { name: "author", content: "Cronora España" },
    { name: "geo.region", content: "ES" },
    { name: "geo.country", content: "ES" },
    { name: "language", content: "Spanish" },
    { name: "theme-color", content: "#ffffff" },
    // Open Graph (`seo-repos/html-head-seo`)
    { property: "og:type", content: "website" },
    { property: "og:locale", content: "es_ES" },
    { property: "og:site_name", content: "Cronora España" },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: "https://cronora.watch/" },
    { property: "og:image", content: "https://cronora.watch/images/hero-rolex-op-pistachio.jpg" },
    // Twitter Card (`seo-repos/html-head-seo`)
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: "https://cronora.watch/images/hero-rolex-op-pistachio.jpg" },
  ];
}

/**
 * Generates Schema.org JSON-LD Graph based on `seo-repos/schema-dts` (google/schema-dts)
 * and head metadata conventions from `seo-repos/html-head-seo` (joshbuchea/HEAD).
 */
export function buildBlogJsonLd(articles: BlogArticle[] = SEO_BLOG_ARTICLES) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://cronora.watch/#website",
        name: "Cronora España — Buscador de Componentes de Reloj y Marketplace de Relojes",
        alternateName: ["Cronora", "Buscador de Componentes Reloj España"],
        url: "https://cronora.watch/",
        inLanguage: "es-ES",
        description:
          "Buscador de componentes de relojería, comparador técnico OEM vs Aftermarket y marketplace de relojes en España.",
        keywords: CHRONOPARTS_SEO_KEYWORDS.join(", "),
        potentialAction: {
          "@type": "SearchAction",
          target: "https://cronora.watch/?q={search_term_string}",
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": ["Organization", "OnlineStore"],
        "@id": "https://cronora.watch/#organization",
        name: "Cronora España",
        url: "https://cronora.watch/",
        logo: "https://cronora.watch/favicon.ico",
        areaServed: {
          "@type": "Country",
          name: "ES",
        },
        knowsAbout: [
          "Componentes de reloj",
          "Recambios de relojes OEM y aftermarket",
          "Marketplace de relojes en España",
          "Calibres automáticos Seiko NH35, ETA 2824-2 y Miyota 9015",
          "Cristales de zafiro y biseles cerámicos",
        ],
      },
      {
        "@type": "ItemList",
        "@id": "https://cronora.watch/#catalog-categories",
        name: "Categorías del Buscador de Componentes de Reloj",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Cristales de Zafiro y Plexiglás para Reloj",
            url: "https://cronora.watch/#search",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Calibres y Movimientos Automáticos (NH35, ETA 2824, Miyota 9015)",
            url: "https://cronora.watch/#search",
          },
          {
            "@type": "ListItem",
            position: 3,
            name: "Biseles Cerámicos e Insertos OEM / Aftermarket",
            url: "https://cronora.watch/#search",
          },
          {
            "@type": "ListItem",
            position: 4,
            name: "Correas, Brazaletes de Acero y Agujas de Reloj",
            url: "https://cronora.watch/#search",
          },
          {
            "@type": "ListItem",
            position: 5,
            name: "Marketplace de Relojes en España",
            url: "https://cronora.watch/marketplace",
          },
        ],
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://cronora.watch/blog#breadcrumb",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Cronora España",
            item: "https://cronora.watch/",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Marketplace de Relojes",
            item: "https://cronora.watch/marketplace",
          },
          {
            "@type": "ListItem",
            position: 3,
            name: "Guías de Componentes y Relojería",
            item: "https://cronora.watch/blog",
          },
        ],
      },
      ...articles.map((art) => ({
        "@type": "TechArticle",
        headline: art.title,
        description: art.summary,
        image: art.heroImage,
        datePublished: art.publishedAt,
        inLanguage: "es-ES",
        author: {
          "@type": "Organization",
          name: "Cronora Horological Lab",
        },
        keywords: art.targetKeywords.join(", "),
        mainEntityOfPage: `https://cronora.watch/blog#${art.slug}`,
      })),
      {
        "@type": "FAQPage",
        mainEntity: articles.flatMap((a) =>
          a.faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: {
              "@type": "Answer",
              text: f.a,
            },
          }))
        ),
      },
    ],
  };
}

export type ListingKind = "watch" | "part" | "accessory" | "unknown";
export type SearchModeKind = "watches" | "parts" | "all";

export interface ClassifiableListing {
  title: string;
  description?: string | undefined;
  categoryName?: string | undefined;
  listingType?: ListingKind | undefined;
  relevanceScore?: number | undefined;
}

export interface ClassifierQuery {
  keywords: string;
  mode?: SearchModeKind | undefined;
  exact?: boolean | undefined;
}

const WATCH_TERMS = [
  "reloj",
  "watch",
  "wristwatch",
  "automatic",
  "automatico",
  "automático",
  "quartz",
  "cronografo",
  "cronógrafo",
  "diver",
  "gmt",
  "mechanical",
  "mecanico",
  "mecánico",
];

const PART_TERMS = [
  "movement",
  "movimiento",
  "calibre",
  "dial",
  "esfera",
  "hands",
  "agujas",
  "bezel",
  "bisel",
  "insert",
  "inserto",
  "crystal",
  "cristal",
  "glass",
  "zafiro",
  "sapphire",
  "crown",
  "corona",
  "stem",
  "tija",
  "pusher",
  "pulsador",
  "caseback",
  "tapa trasera",
  "junta",
  "gasket",
  "rotor",
  "nh35",
  "nh36",
  "nh34",
  "nh38",
  "7s26",
  "4r35",
  "4r36",
  "6r15",
  "2824",
  "2836",
  "7750",
  "sw200",
];

const ACCESSORY_TERMS = [
  "correa",
  "strap",
  "bracelet",
  "brazalete",
  "armis",
  "eslabon",
  "eslabón",
  "hebilla",
  "buckle",
  "box only",
  "solo caja",
  "caja vacia",
  "caja vacía",
  "manual",
  "manual de instrucciones",
  "watch box",
];

const NON_PRODUCT_TERMS = [
  "catalogo",
  "catálogo",
  "poster",
  "publicidad",
  "anuncio revista",
  "display",
  "soporte",
  "stand",
  "herramienta",
  "tool",
  "libro",
];

const TOKEN_SPLIT = /[\s,.;:()/"'[\]{}+_-]+/;

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function hasTerm(haystack: string, terms: string[]): boolean {
  return terms.some((term) => haystack.includes(normalizeText(term)));
}

function queryTokens(query: ClassifierQuery): string[] {
  return normalizeText(query.keywords)
    .split(TOKEN_SPLIT)
    .filter((token) => token.length >= 3)
    .filter((token) => !["reloj", "watch", "para", "con", "the", "and"].includes(token));
}

export function classifyListing(
  input: Pick<ClassifiableListing, "title" | "description" | "categoryName">,
): ListingKind {
  const text = normalizeText(
    `${input.title} ${input.description ?? ""} ${input.categoryName ?? ""}`,
  );

  if (hasTerm(text, NON_PRODUCT_TERMS)) {
    return "unknown";
  }

  const hasPart = hasTerm(text, PART_TERMS);
  const hasAccessory = hasTerm(text, ACCESSORY_TERMS);
  const hasWatch = hasTerm(text, WATCH_TERMS);

  if (hasPart) return "part";
  if (hasAccessory) return "accessory";
  if (
    hasWatch ||
    /\b(seiko|omega|rolex|tissot|citizen|casio|orient|hamilton|tudor)\b/i.test(text)
  ) {
    return "watch";
  }

  return "unknown";
}

export function scoreListingRelevance(
  listing: ClassifiableListing,
  query: ClassifierQuery,
): number {
  const text = normalizeText(
    `${listing.title} ${listing.description ?? ""} ${listing.categoryName ?? ""}`,
  );
  const tokens = queryTokens(query);
  const tokenMatches = tokens.filter((token) => text.includes(token)).length;
  const tokenScore = tokens.length === 0 ? 30 : Math.round((tokenMatches / tokens.length) * 55);

  let score = 20 + tokenScore;
  const type = listing.listingType ?? classifyListing(listing);

  if (query.mode === "parts") {
    if (type === "part") score += 30;
    if (type === "accessory") score += 12;
    if (type === "watch") score -= 35;
  } else if (query.mode === "watches" || !query.mode) {
    if (type === "watch") score += 30;
    if (type === "part" || type === "accessory") score -= 45;
  } else if (type !== "unknown") {
    score += 15;
  }

  if (hasTerm(text, NON_PRODUCT_TERMS)) score -= 35;

  return Math.max(0, Math.min(100, score));
}

export function isListingRelevant(listing: ClassifiableListing, query: ClassifierQuery): boolean {
  const type = listing.listingType ?? classifyListing(listing);
  const score =
    listing.relevanceScore ?? scoreListingRelevance({ ...listing, listingType: type }, query);
  const minScore = query.exact === false ? 35 : 50;

  if (query.mode === "parts") {
    return (type === "part" || type === "accessory") && score >= minScore;
  }

  if (query.mode === "watches" || !query.mode) {
    return type === "watch" && score >= minScore;
  }

  return type !== "unknown" && score >= 35;
}

const SPANISH_TO_ENGLISH_PARTS: Array<[RegExp, string]> = [
  [/\bbisel\b/gi, "bezel"],
  [/\binserto\b/gi, "bezel insert"],
  [/\besfera\b/gi, "dial"],
  [/\bagujas\b/gi, "hands"],
  [/\bmanecillas\b/gi, "hands"],
  [/\bcristal\b/gi, "crystal"],
  [/\bzafiro\b/gi, "sapphire crystal"],
  [/\bcorrea\b/gi, "strap"],
  [/\bbrazalete\b/gi, "bracelet"],
  [/\barmis\b/gi, "steel bracelet"],
  [/\bcaucho\b/gi, "rubber strap"],
  [/\bcuero\b/gi, "leather strap"],
  [/\bpiel\b/gi, "leather strap"],
  [/\bcorona\b/gi, "crown"],
  [/\btija\b/gi, "stem"],
  [/\btije\b/gi, "stem"],
  [/\bmovimiento\b/gi, "movement"],
  [/\bcalibre\b/gi, "movement"],
  [/\bjunta\b/gi, "gasket"],
  [/\bcierre\b/gi, "clasp"],
  [/\bhebilla\b/gi, "buckle"],
  [/\bpulsador\b/gi, "pusher"],
  [/\beslab[oó]n\b/gi, "link"],
];

const NON_WATCH_JEWELRY = /\b(?:earrings?|necklaces?|pendants?|jewelry|jewellery)\b/i;
const WATCH_NOUN = /\b(?:watch|wristwatch|reloj|relojes|smartwatch)\b/i;
const PART_SALE_CUE =
  /\b(?:replacement|spare|parts?|recambio|repuesto|aftermarket|compatible|fitting|holder|bracket|repair|kit|assembly)\b/i;
const WATCH_COMPONENT_PHRASE =
  /\b(?:watch|wristwatch|reloj|relojes)\s+(?:movement|movimiento|dial|esfera|hands|agujas|bezel|bisel|insert|inserto|crystal|cristal|crown|corona|stem|tija|gasket|junta|rotor|strap|correa|bracelet|brazalete|armis|pusher|pulsador|parts?|piezas)\b/i;
const COMPATIBILITY_PHRASE =
  /\b(?:for|fits|compatible with|suitable for)\s+(?:the\s+)?(?:watch|wristwatch|reloj|rolex|seiko|omega|tissot|citizen|casio|orient|tudor|cartier)\b/i;

export function translateHorologicalQuery(query: string): string {
  let translated = query.trim();
  for (const [pattern, replacement] of SPANISH_TO_ENGLISH_PARTS) {
    translated = translated.replace(pattern, replacement);
  }
  return translated.replace(/\s+/g, " ").trim();
}

export function isLikelyWatchPartListing(title: string): boolean {
  const text = normalizeHorologicalSearchText(title);
  if (NON_WATCH_JEWELRY.test(text)) return false;
  if (!WATCH_NOUN.test(text)) return true;
  return PART_SALE_CUE.test(text) ||
    WATCH_COMPONENT_PHRASE.test(text) ||
    COMPATIBILITY_PHRASE.test(text);
}

export function normalizeHorologicalSearchText(text: string): string {
  return translateHorologicalQuery(text)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

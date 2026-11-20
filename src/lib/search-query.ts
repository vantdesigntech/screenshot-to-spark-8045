const SPANISH_TO_ENGLISH_PARTS: Array<[RegExp, string]> = [
  [/\bbisel\b/gi, "bezel"],
  [/\bluneta\b/gi, "bezel"],
  [/\binserto\b/gi, "bezel insert"],
  [/\besfera\b/gi, "dial"],
  [/\bagujas\b/gi, "hands"],
  [/\bmanecillas\b/gi, "hands"],
  [/\bcristal\b/gi, "crystal"],
  [/\bvidrio\b/gi, "crystal"],
  [/\bzafiro\b/gi, "sapphire crystal"],
  [/\bplexi(?:glass)?\b/gi, "acrylic crystal"],
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
  [/\bmaquinaria\b/gi, "movement"],
  [/\bcalibre\b/gi, "movement"],
  [/\bjunta\b/gi, "gasket"],
  [/\bcierre\b/gi, "clasp"],
  [/\bhebilla\b/gi, "buckle"],
  [/\bpulsador\b/gi, "pusher"],
  [/\beslab[oó]n\b/gi, "link"],
  [/\bpasador(?:es)?\b/gi, "spring bar"],
];

const NON_WATCH_JEWELRY = /\b(?:earrings?|necklaces?|pendants?|jewelry|jewellery)\b/i;
const WATCH_NOUN = /\b(?:watch|wristwatch|reloj|relojes|smartwatch)\b/i;
const PART_SALE_CUE =
  /\b(?:replacement|spare|parts?|recambio|repuesto|aftermarket|compatible|fitting|holder|bracket|repair|kit|assembly)\b/i;
const WATCH_COMPONENT_PHRASE =
  /\b(?:watch|wristwatch|reloj|relojes)\s+(?:movement|movimiento|dial|esfera|hands|agujas|bezel|bisel|insert|inserto|crystal|cristal|crown|corona|stem|tija|gasket|junta|rotor|strap|correa|bracelet|brazalete|armis|pusher|pulsador|parts?|piezas)\b/i;
const COMPATIBILITY_PHRASE =
  /\b(?:for|fits|compatible with|suitable for)\s+(?:the\s+)?(?:watch|wristwatch|reloj|rolex|seiko|omega|tissot|citizen|casio|orient|tudor|cartier)\b/i;
const WATCH_DEAL_QUERY_STOP_WORDS = new Set([
  "watch",
  "watches",
  "wristwatch",
  "reloj",
  "relojes",
  "automatic",
  "automatico",
  "quartz",
  "men",
  "mens",
  "women",
  "womens",
  "complete",
  "completo",
]);

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
  return (
    PART_SALE_CUE.test(text) || WATCH_COMPONENT_PHRASE.test(text) || COMPATIBILITY_PHRASE.test(text)
  );
}

export function normalizeHorologicalSearchText(text: string): string {
  return translateHorologicalQuery(text)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function isOneEditAway(left: string, right: string): boolean {
  if (Math.abs(left.length - right.length) > 1) return false;
  if (left.length === right.length) {
    const mismatches: number[] = [];
    for (let index = 0; index < left.length; index += 1) {
      if (left[index] !== right[index]) mismatches.push(index);
      if (mismatches.length > 2) return false;
    }
    if (mismatches.length <= 1) return true;
    const [first, second] = mismatches;
    return (
      first !== undefined &&
      second === first + 1 &&
      left[first] === right[second] &&
      left[second] === right[first]
    );
  }

  let leftIndex = 0;
  let rightIndex = 0;
  let edits = 0;
  while (leftIndex < left.length && rightIndex < right.length) {
    if (left[leftIndex] === right[rightIndex]) {
      leftIndex += 1;
      rightIndex += 1;
      continue;
    }
    edits += 1;
    if (edits > 1) return false;
    if (left.length > right.length) leftIndex += 1;
    else rightIndex += 1;
  }
  return edits + Number(leftIndex < left.length || rightIndex < right.length) <= 1;
}

function matchesSearchToken(token: string, titleTokens: Set<string>, allowTypos: boolean): boolean {
  if (titleTokens.has(token)) return true;
  if (/\d/.test(token)) {
    const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return [...titleTokens].some((candidate) => new RegExp(`^${escaped}[a-z]?$`).test(candidate));
  }
  if (!allowTypos || token.length < 5) return false;
  return [...titleTokens].some(
    (candidate) => candidate.length >= 5 && isOneEditAway(token, candidate),
  );
}

export function matchesHorologicalSearchTokens(
  query: string,
  text: string,
  allowTypos = false,
): boolean {
  const tokens = normalizeHorologicalSearchText(query)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 2 || /^\d+$/.test(token));
  if (tokens.length === 0) return true;

  const titleTokens = new Set(normalizeHorologicalSearchText(text).split(/[^a-z0-9]+/));
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (!token) continue;
    if (matchesSearchToken(token, titleTokens, allowTypos)) continue;
    const nextToken = tokens[index + 1];
    if (nextToken && matchesSearchToken(`${token}${nextToken}`, titleTokens, allowTypos)) {
      index += 1;
      continue;
    }
    return false;
  }
  return true;
}

export function isWatchDealQueryRelevant(query: string, title: string): boolean {
  const tokens = normalizeHorologicalSearchText(query)
    .split(/[^a-z0-9]+/)
    .filter(
      (token) =>
        (token.length >= 2 || /^\d+$/.test(token)) && !WATCH_DEAL_QUERY_STOP_WORDS.has(token),
    );
  if (tokens.length === 0) return true;
  return matchesHorologicalSearchTokens(tokens.join(" "), title);
}

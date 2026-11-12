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

export function translateHorologicalQuery(query: string): string {
  let translated = query.trim();
  for (const [pattern, replacement] of SPANISH_TO_ENGLISH_PARTS) {
    translated = translated.replace(pattern, replacement);
  }
  return translated.replace(/\s+/g, " ").trim();
}

export function normalizeHorologicalSearchText(text: string): string {
  return translateHorologicalQuery(text)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

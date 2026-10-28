import type { Category } from "./parts";

export interface InterpretedFilters {
  category: Category | null;
  brand: string | null;
  model: string | null;
  calibre: string | null;
  lugWidthMm: number | null;
  material: string | null;
  maxPrice: number | null;
  origin: "OEM" | "Generic" | null;
}

const CAT_WORDS: [Category, RegExp][] = [
  ["crystals", /cristal|zafiro|sapphire|crystal|mineral|vidrio/i],
  ["straps", /correa|brazalete|strap|bracelet|armis|pulsera/i],
  ["bezels", /bisel|bezel|inserto|insert/i],
  ["dials", /esfera|dial|aguja|hands/i],
  ["movements", /calibre|movimiento|movement|caliber|maquinaria/i],
  ["crowns", /corona|crown|tija|stem/i],
];
const BRANDS = ["Rolex", "Omega", "Seiko", "Tissot", "Casio", "Tudor", "Longines", "Hamilton", "Citizen", "Orient"];

export function interpretByKeywords(phrase: string): InterpretedFilters {
  const category = CAT_WORDS.find(([, r]) => r.test(phrase))?.[0] ?? null;
  const brand = BRANDS.find((b) => new RegExp(`\\b${b}\\b`, "i").test(phrase)) ?? null;
  const model = phrase.match(/\b[A-Z]{2,}[- ]?\d{2,}[A-Z0-9]*\b/i)?.[0] ?? null;
  const mm = phrase.match(/(\d{2})\s?mm/i);
  const price = phrase.match(/(?:menos de|max(?:imo)?|hasta|under)\s*(\d{2,5})/i);
  const origin = /original|oem|genuin/i.test(phrase) ? "OEM" : /aftermarket|gen[eé]ric|compatible/i.test(phrase) ? "Generic" : null;
  const material = phrase.match(/acero|cuero|caucho|titanio|oro|steel|leather|rubber|titanium|zafiro|sapphire/i)?.[0] ?? null;
  return {
    category, brand, model, calibre: null,
    lugWidthMm: mm ? Number(mm[1]) : null,
    material, maxPrice: price ? Number(price[1]) : null, origin,
  };
}

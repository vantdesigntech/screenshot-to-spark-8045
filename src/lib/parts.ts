import strap from "@/assets/strap.jpg";
import bracelet from "@/assets/bracelet.jpg";
import crystal from "@/assets/crystal.jpg";
import movement from "@/assets/movement.jpg";

export type Store = "eBay" | "AliExpress" | "Chrono24";
export type Origin = "oem" | "generic";
export type Category = "straps" | "bezels" | "crystals" | "dials" | "movements" | "crowns";

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: "straps", label: "Straps & Bracelets" },
  { id: "bezels", label: "Bezels" },
  { id: "crystals", label: "Crystals" },
  { id: "dials", label: "Dials & Hands" },
  { id: "movements", label: "Movements & Escapements" },
  { id: "crowns", label: "Crowns & Stems" },
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
}

export const PARTS: Part[] = [
  { id: "1", title: "Vintage Tissot 1990 leather strap, 18mm", brand: "Tissot", store: "eBay", origin: "oem", category: "straps", priceEur: 64, delivery: "3–5 days", image: strap, spec: "18mm · Original buckle" },
  { id: "2", title: "Curved-end Oyster style steel bracelet 20mm", brand: "Generic", store: "AliExpress", origin: "generic", category: "straps", priceEur: 23.9, delivery: "12–20 days", image: bracelet, spec: "20mm · 316L steel" },
  { id: "3", title: "Rolex Oyster bracelet 78350 / 20mm, 1990s", brand: "Rolex", store: "Chrono24", origin: "oem", category: "straps", priceEur: 1450, delivery: "2–4 days", image: bracelet, spec: "20mm · Oystersteel" },
  { id: "4", title: "Seiko NH35 compatible brown calf strap", brand: "Generic", store: "AliExpress", origin: "generic", category: "straps", priceEur: 8.5, delivery: "10–18 days", image: strap, spec: "20mm · Quick release" },
  { id: "5", title: "Replacement sapphire crystal 31.5mm, AR coated", brand: "Generic", store: "AliExpress", origin: "generic", category: "crystals", priceEur: 14.2, delivery: "14–22 days", image: crystal, spec: "Ø31.5mm · Flat" },
  { id: "6", title: "Rolex 124300 sapphire crystal, genuine", brand: "Rolex", store: "Chrono24", origin: "oem", category: "crystals", priceEur: 320, delivery: "3–6 days", image: crystal, spec: "Ref. 124300 · Sapphire" },
  { id: "7", title: "Smooth domed bezel Oyster Perpetual 41", brand: "Rolex", store: "eBay", origin: "oem", category: "bezels", priceEur: 480, delivery: "4–7 days", image: crystal, spec: "41mm · Polished" },
  { id: "8", title: "Fluted coin-edge bezel insert 40mm", brand: "Generic", store: "AliExpress", origin: "generic", category: "bezels", priceEur: 19.9, delivery: "12–20 days", image: crystal, spec: "40mm · 904L style" },
  { id: "9", title: "Calibre 3230 balance wheel assembly", brand: "Rolex", store: "Chrono24", origin: "oem", category: "movements", priceEur: 890, delivery: "5–8 days", image: movement, spec: "Chronergy escapement" },
  { id: "10", title: "ETA 2824-2 automatic movement, Swiss", brand: "ETA", store: "eBay", origin: "oem", category: "movements", priceEur: 245, delivery: "3–5 days", image: movement, spec: "26 jewels · 28,800 vph" },
  { id: "11", title: "Seiko NH35A automatic movement", brand: "Seiko", store: "AliExpress", origin: "generic", category: "movements", priceEur: 39, delivery: "10–15 days", image: movement, spec: "24 jewels · Hacking" },
  { id: "12", title: "Seiko NH35 sterile white dial + hands set", brand: "Generic", store: "AliExpress", origin: "generic", category: "dials", priceEur: 16.5, delivery: "12–20 days", image: movement, spec: "28.5mm dial" },
  { id: "13", title: "Oyster Perpetual 41 silver dial, genuine", brand: "Rolex", store: "eBay", origin: "oem", category: "dials", priceEur: 1100, delivery: "4–7 days", image: crystal, spec: "Ref. 124300 · Silver" },
  { id: "14", title: "Twinlock crown 7mm, Oystersteel", brand: "Rolex", store: "Chrono24", origin: "oem", category: "crowns", priceEur: 210, delivery: "3–5 days", image: movement, spec: "7mm · Screw-down" },
  { id: "15", title: "Screw-down crown & stem kit for NH35", brand: "Generic", store: "AliExpress", origin: "generic", category: "crowns", priceEur: 6.9, delivery: "12–20 days", image: movement, spec: "Universal · Steel" },
];

export const MAX_PRICE = 1500;

export interface Filters {
  query: string;
  origin: "all" | Origin;
  categories: Category[];
  maxPrice: number;
}

export function filterParts(parts: Part[], f: Filters): Part[] {
  const words = f.query.toLowerCase().split(/\s+/).filter(Boolean);
  return parts.filter((p) => {
    if (f.origin !== "all" && p.origin !== f.origin) return false;
    if (f.categories.length && !f.categories.includes(p.category)) return false;
    if (p.priceEur > f.maxPrice) return false;
    const hay = `${p.title} ${p.brand} ${p.spec} ${p.store}`.toLowerCase();
    return words.every((w) => hay.includes(w));
  });
}

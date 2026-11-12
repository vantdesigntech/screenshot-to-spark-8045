import { RawListing } from '../types/index.js';
import { upgradeToHighResImageUrl } from '../utils/imageUpscaler.js';
import { analyzeListing, scoreDeal } from '../utils/watchIntelligence.js';

export type Store =
  | 'eBay'
  | 'Wallapop'
  | 'AliExpress'
  | 'Chrono24'
  | 'Alibaba'
  | 'WatchPlaza'
  | 'NamokiMods'
  | 'CousinsUK';

export type Origin = 'oem' | 'generic';
export type Category = 'straps' | 'bezels' | 'crystals' | 'dials' | 'movements' | 'crowns';

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
  listingType?: string;
  relevanceScore?: number;
  model?: string;
  reference?: string;
  calibre?: string;
  dealScore?: number;
  dealVerdict?: string;
  compatibleWith: string[];
  condition: 'NOS Vintage' | 'Certified OEM' | 'Aftermarket 1:1' | 'Swiss OEM' | 'Sin verificar';
  listedPrice?: number;
  listedCurrency?: 'EUR' | 'USD' | 'GBP';
  equivalentOemPriceEur?: number;
  pairGroupId?: string;
  proOnly?: boolean;
  customUrl?: string;
}

const KNOWN_PART_BRANDS = [
  'Rolex', 'Seiko', 'Omega', 'Tissot', 'Citizen', 'Casio', 'Tudor', 'Cartier',
  'Breitling', 'Hamilton', 'Longines', 'Orient', 'TAG Heuer', 'Oris', 'Panerai',
  'IWC', 'Patek Philippe', 'Audemars Piguet', 'Miyota', 'ETA', 'Sellita', 'Vostok'
];

export function detectPartCategory(title: string): Category {
  const t = title.toLowerCase();
  if (/\b(crystal|cristal|cristales|glass|zafiro|sapphire|hesalite|plexiglass|mineral)\b/i.test(t)) {
    return 'crystals';
  }
  if (/\b(bezel|bisel|biseles|insert|inserto|tachymetre|taquimetro|taquimetro)\b/i.test(t)) {
    return 'bezels';
  }
  if (/\b(crown|corona|coronas|stem|tije|tija|pusher|pulsador|tubo|gasket|junta)\b/i.test(t)) {
    return 'crowns';
  }
  if (/\b(dial|esfera|esferas|hands|agujas|manecillas|saetas)\b/i.test(t)) {
    return 'dials';
  }
  if (/\b(movement|movimiento|calibre|nh35|nh36|nh34|nh38|2824|3230|1861|9015|rotor|miyota|7s26|4r35|4r36|6r15|valjoux|7750|eta|sellita|sw200)\b/i.test(t)) {
    return 'movements';
  }
  return 'straps';
}

export function detectPartOrigin(title: string): Origin {
  const t = title.toLowerCase();
  if (/\b(genuine|original|oem|autentico|autentico|swiss oem|factory|oficial)\b/i.test(t)) {
    return 'oem';
  }
  return 'generic';
}

export function detectPartBrand(title: string): string {
  for (const b of KNOWN_PART_BRANDS) {
    if (new RegExp(`\\b${b}\\b`, 'i').test(title)) {
      return b;
    }
  }
  return 'Horologia';
}

export function detectPartCondition(title: string, rawCondition?: string): Part['condition'] {
  const t = `${title} ${rawCondition || ''}`.toLowerCase();
  if (/\b(nos|new old stock|vintage)\b/i.test(t)) return 'NOS Vintage';
  if (/\b(certified|certificado|garantia)\b/i.test(t)) return 'Certified OEM';
  if (/\b(swiss oem|swiss made)\b/i.test(t)) return 'Swiss OEM';
  if (/\b(aftermarket|1:1|mod|custom|compatible)\b/i.test(t)) return 'Aftermarket 1:1';
  return 'Sin verificar';
}

export function mapListingToPart(listing: RawListing): Part {
  const intelligence = listing.intelligence || analyzeListing(listing);
  const dealScore = listing.dealScore || scoreDeal({ ...listing, intelligence });
  const category = detectPartCategory(listing.title);
  const origin = detectPartOrigin(listing.title);
  const brand = intelligence.brand !== 'Horologia' ? intelligence.brand : detectPartBrand(listing.title);
  const condition = detectPartCondition(listing.title, listing.condition);
  const store: Store = listing.platform === 'ebay' ? 'eBay' : 'Wallapop';
  const highResImage = upgradeToHighResImageUrl(listing.imageUrl);

  const priceEur = Math.round(listing.price * 100) / 100;
  const delivery = listing.platform === 'ebay'
    ? 'Envio con Garantia eBay'
    : (listing.location ? `Wallapop (${listing.location})` : 'Envio Wallapop');

  return {
    id: `${listing.platform}-part-${listing.id}`,
    title: listing.title,
    brand,
    store,
    origin,
    category,
    priceEur,
    delivery,
    image: highResImage,
    spec: `${brand} - ${category.toUpperCase()} - Confianza ${dealScore.confidence}%`,
    compatibleWith: [intelligence.model, brand].filter(Boolean) as string[],
    condition,
    listedPrice: priceEur,
    listedCurrency: (listing.currency?.toUpperCase() === 'EUR' ? 'EUR' : 'USD') as 'EUR' | 'USD',
    listingType: listing.listingType,
    relevanceScore: listing.relevanceScore,
    model: intelligence.model,
    reference: intelligence.reference,
    calibre: intelligence.calibre,
    dealScore: dealScore.score,
    dealVerdict: dealScore.verdict,
    customUrl: listing.url
  };
}

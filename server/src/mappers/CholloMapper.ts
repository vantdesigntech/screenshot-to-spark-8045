import { RawListing } from '../types/index.js';
import { upgradeToHighResImageUrl } from '../utils/imageUpscaler.js';
import { analyzeListing, scoreDeal } from '../utils/watchIntelligence.js';

export interface ChronoPartsCholloDeal {
  id: string;
  title: string;
  brand: string;
  model?: string;
  reference?: string;
  platform: 'Wallapop' | 'eBay' | 'Chrono24' | 'Todocoleccion';
  dealType: 'Subasta sin Reserva' | 'Rebaja Directa' | 'Lote Relojero' | 'Para Restaurar / Flip';
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
  listingType?: string;
  relevanceScore?: number;
  dealVerdict?: string;
  confidence?: number;
  dealReasons?: string[];
}

export function extractBrand(title: string): string {
  return analyzeListing({ title }).brand;
}

export function rawListingToCholloDeal(listing: RawListing, index: number = 0): ChronoPartsCholloDeal {
  const intelligence = listing.intelligence || analyzeListing(listing);
  const dealScore = listing.dealScore || scoreDeal({ ...listing, intelligence });
  const priceEur = Math.round(listing.price);

  const isAuction = listing.platform === 'ebay' && /subasta|auction|bid|puja/i.test(listing.title);
  const isRepair = /restaurar|reparar|averiado|para piezas|defecto|not working/i.test(listing.title);
  const dealType = isAuction
    ? 'Subasta sin Reserva'
    : isRepair
      ? 'Para Restaurar / Flip'
      : 'Rebaja Directa';

  const platformName = listing.platform === 'wallapop' ? 'Wallapop' : 'eBay';
  const benchmarkText = dealScore.marketValueEur > 0
    ? `${dealScore.marketValueEur} EUR`
    : 'sin benchmark suficiente';
  const verdictText = dealScore.verdict === 'strong_deal'
    ? 'chollo fuerte'
    : dealScore.verdict === 'fair_deal'
      ? 'precio interesante'
      : dealScore.verdict === 'overpriced'
        ? 'por encima de mercado'
        : 'precio de mercado';

  const aiVerdict = [
    `${verdictText} en ${platformName}`,
    `${intelligence.brand}${intelligence.model ? ` ${intelligence.model}` : ''}`,
    `a ${priceEur} EUR`,
    `benchmark: ${benchmarkText}`,
    `confianza: ${dealScore.confidence}%`
  ].join(' - ');

  const condition = listing.platform === 'wallapop'
    ? 'Vendedor particular - Verificado en Wallapop'
    : 'Garantia al comprador eBay - Anuncio activo';

  return {
    id: `${listing.platform}-${listing.id}`,
    title: listing.title,
    brand: intelligence.brand,
    model: intelligence.model,
    reference: intelligence.reference,
    platform: platformName,
    dealType,
    priceEur,
    marketValueEur: Math.round(dealScore.marketValueEur),
    savingsPct: dealScore.savingsPct,
    profitMarginEur: Math.round(dealScore.profitMarginEur),
    cholloScore: Math.round((dealScore.score / 10) * 10) / 10,
    aiVerdict,
    condition,
    location: listing.location || (listing.platform === 'wallapop' ? 'Espana' : 'Envio con Garantia eBay'),
    timeLeft: 'Actualizado hoy',
    image: upgradeToHighResImageUrl(listing.imageUrl),
    url: listing.url,
    proEarlyAccess: index === 0 && dealScore.verdict === 'strong_deal',
    calibreRef: intelligence.calibre || intelligence.reference || `${intelligence.brand} - ${listing.id}`,
    listingType: listing.listingType,
    relevanceScore: listing.relevanceScore,
    dealVerdict: dealScore.verdict,
    confidence: dealScore.confidence,
    dealReasons: dealScore.reasons
  };
}

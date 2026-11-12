import { DealScore, MarketBenchmark, RawListing, WatchIntelligence } from '../types/index.js';

type BenchmarkRecord = {
  brand: string;
  model?: string;
  aliases: string[];
  average: number;
  min: number;
  max: number;
  sampleSize: number;
};

const BRANDS = [
  'Rolex', 'Omega', 'Tudor', 'Seiko', 'Tissot', 'Hamilton', 'Citizen', 'Casio',
  'Longines', 'Certina', 'TAG Heuer', 'Breitling', 'Zenith', 'Cartier', 'Orient',
  'Patek Philippe', 'Audemars Piguet', 'IWC', 'Panerai', 'Sinn', 'Oris', 'Yema',
  'Vostok', 'Bulova', 'Miyota', 'ETA', 'Sellita'
];

const BENCHMARKS: BenchmarkRecord[] = [
  { brand: 'Seiko', model: 'SKX007', aliases: ['skx007', 'skx 007'], average: 420, min: 280, max: 650, sampleSize: 45 },
  { brand: 'Seiko', model: 'SKX009', aliases: ['skx009', 'skx 009'], average: 430, min: 290, max: 680, sampleSize: 32 },
  { brand: 'Seiko', model: 'Turtle', aliases: ['turtle', 'srp777', 'srp775', 'srpe93'], average: 340, min: 220, max: 520, sampleSize: 58 },
  { brand: 'Seiko', model: 'Alpinist', aliases: ['alpinist', 'sarb017', 'spb121'], average: 620, min: 420, max: 920, sampleSize: 40 },
  { brand: 'Seiko', model: '5 Sports', aliases: ['5 sports', 'srpd', 'snxs', 'snk'], average: 150, min: 80, max: 260, sampleSize: 90 },
  { brand: 'Tissot', model: 'PRX', aliases: ['prx', 'powermatic 80'], average: 520, min: 340, max: 780, sampleSize: 60 },
  { brand: 'Omega', model: 'Speedmaster', aliases: ['speedmaster', 'speedy', 'reduced', 'moonwatch'], average: 3600, min: 1900, max: 6900, sampleSize: 70 },
  { brand: 'Omega', model: 'Seamaster', aliases: ['seamaster', 'planet ocean', 'aqua terra'], average: 2800, min: 1100, max: 6200, sampleSize: 85 },
  { brand: 'Hamilton', model: 'Khaki Field', aliases: ['khaki field', 'khaki automatic', 'khaki mechanical'], average: 430, min: 260, max: 700, sampleSize: 46 },
  { brand: 'Citizen', model: 'Promaster', aliases: ['promaster', 'ny0040', 'fugu'], average: 210, min: 120, max: 360, sampleSize: 44 },
  { brand: 'Casio', model: 'G-Shock', aliases: ['g-shock', 'g shock', 'ga-', 'gw-', 'dw-'], average: 95, min: 45, max: 220, sampleSize: 100 },
  { brand: 'Orient', model: 'Mako', aliases: ['mako', 'ray', 'kamasu'], average: 210, min: 120, max: 360, sampleSize: 52 },
  { brand: 'Rolex', model: 'Datejust', aliases: ['datejust', '1601', '1603', '16233', '116234'], average: 6500, min: 3900, max: 11000, sampleSize: 75 },
  { brand: 'Tudor', model: 'Black Bay', aliases: ['black bay', 'bb58', '79230', '79030'], average: 2800, min: 1900, max: 4300, sampleSize: 62 },
  { brand: 'Miyota', model: '9015', aliases: ['9015'], average: 95, min: 55, max: 150, sampleSize: 35 },
  { brand: 'Seiko', model: 'NH35', aliases: ['nh35', 'nh35a'], average: 42, min: 25, max: 70, sampleSize: 80 },
  { brand: 'Seiko', model: 'NH36', aliases: ['nh36', 'nh36a'], average: 48, min: 30, max: 80, sampleSize: 62 },
  { brand: 'ETA', model: '2824', aliases: ['2824', 'eta 2824'], average: 190, min: 110, max: 320, sampleSize: 40 },
  { brand: 'Sellita', model: 'SW200', aliases: ['sw200', 'sellita sw200'], average: 210, min: 130, max: 360, sampleSize: 32 }
];

const CALIBRE_PATTERN = /\b(nh3[4568]a?|7s26|4r3[56]|6r15|9015|8215|2824|2836|7750|1861|3861|3135|3235|sw200|sw300|powermatic\s?80)\b/i;
const REFERENCE_PATTERN = /\b([a-z]{2,5}\d{3,5}[a-z]?|\d{3,6}(?:\.\d{2})?|[a-z]\d{5})\b/i;

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

function detectBrand(text: string): string {
  const normalized = normalize(text);
  return BRANDS.find((brand) => normalized.includes(normalize(brand))) || 'Horologia';
}

function findBenchmark(text: string, brand: string): BenchmarkRecord | undefined {
  const normalized = normalize(text);
  return BENCHMARKS.find((record) => {
    const brandMatches = record.brand === brand || brand === 'Horologia';
    return brandMatches && record.aliases.some((alias) => normalized.includes(normalize(alias)));
  });
}

function confidenceFor(intelligence: WatchIntelligence, benchmark?: BenchmarkRecord): number {
  let confidence = 35;
  if (intelligence.brand !== 'Horologia') confidence += 20;
  if (intelligence.model) confidence += 20;
  if (intelligence.reference) confidence += 10;
  if (intelligence.calibre) confidence += 10;
  if (benchmark) confidence += Math.min(15, Math.round(benchmark.sampleSize / 8));
  return Math.min(100, confidence);
}

export function analyzeListing(listing: Pick<RawListing, 'title' | 'description' | 'listingType'>): WatchIntelligence {
  const text = `${listing.title} ${listing.description || ''}`;
  const brand = detectBrand(text);
  const benchmark = findBenchmark(text, brand);
  const calibre = text.match(CALIBRE_PATTERN)?.[0]?.toUpperCase().replace(/\s+/g, ' ');
  const reference = text.match(REFERENCE_PATTERN)?.[0]?.toUpperCase();
  const signals: string[] = [];

  if (brand !== 'Horologia') signals.push(`brand:${brand}`);
  if (benchmark?.model) signals.push(`model:${benchmark.model}`);
  if (reference) signals.push(`ref:${reference}`);
  if (calibre) signals.push(`calibre:${calibre}`);
  if (listing.listingType) signals.push(`type:${listing.listingType}`);

  const intelligence: WatchIntelligence = {
    brand,
    model: benchmark?.model,
    reference,
    calibre,
    partFamily: listing.listingType === 'part' ? benchmark?.model || calibre : undefined,
    searchKey: Array.from(new Set([brand, benchmark?.model, reference || calibre].filter(Boolean))).join(' ').trim(),
    confidence: 0,
    signals
  };

  intelligence.confidence = confidenceFor(intelligence, benchmark);
  return intelligence;
}

export function benchmarkFor(intelligence: WatchIntelligence): MarketBenchmark | undefined {
  const record = BENCHMARKS.find((entry) => (
    entry.brand === intelligence.brand &&
    (!intelligence.model || entry.model === intelligence.model)
  ));

  if (!record) return undefined;

  return {
    brand: record.brand,
    model: record.model,
    averageMarketPrice: record.average,
    minMarketPrice: record.min,
    maxMarketPrice: record.max,
    sampleSize: record.sampleSize,
    confidence: intelligence.confidence
  };
}

export function scoreDeal(listing: RawListing): DealScore {
  const intelligence = listing.intelligence || analyzeListing(listing);
  const benchmark = benchmarkFor(intelligence);
  const price = Math.max(0, listing.price || 0);

  if (!benchmark || price <= 0) {
    return {
      marketValueEur: 0,
      minMarketPriceEur: 0,
      maxMarketPriceEur: 0,
      savingsPct: 0,
      profitMarginEur: 0,
      score: Math.max(15, Math.round((listing.relevanceScore || 0) * 0.35)),
      confidence: intelligence.confidence,
      verdict: 'unknown',
      reasons: ['Sin benchmark interno suficiente']
    };
  }

  const marketValueEur = benchmark.averageMarketPrice;
  const profitMarginEur = Math.round((marketValueEur - price) * 100) / 100;
  const savingsPct = Math.round(((marketValueEur - price) / marketValueEur) * 100);
  const reasons: string[] = [];

  let score = Math.round((listing.relevanceScore || 50) * 0.25 + intelligence.confidence * 0.25);

  if (price <= benchmark.minMarketPrice) {
    score += 35;
    reasons.push('Precio por debajo del minimo historico interno');
  } else if (savingsPct >= 25) {
    score += 25;
    reasons.push('Descuento relevante frente al benchmark');
  } else if (savingsPct >= 10) {
    score += 12;
    reasons.push('Precio algo inferior al mercado');
  } else if (savingsPct < -10) {
    score -= 20;
    reasons.push('Precio por encima del benchmark');
  }

  if (intelligence.reference) reasons.push('Referencia detectada');
  if (intelligence.calibre) reasons.push('Calibre detectado');
  if (listing.platform === 'wallapop') reasons.push('Marketplace con margen de negociacion');

  const normalizedScore = Math.max(0, Math.min(100, score));
  const verdict: DealScore['verdict'] =
    normalizedScore >= 82 && savingsPct >= 20 ? 'strong_deal' :
      normalizedScore >= 65 && savingsPct >= 10 ? 'fair_deal' :
        savingsPct < -10 ? 'overpriced' :
          'market_price';

  return {
    marketValueEur,
    minMarketPriceEur: benchmark.minMarketPrice,
    maxMarketPriceEur: benchmark.maxMarketPrice || marketValueEur,
    savingsPct,
    profitMarginEur,
    score: normalizedScore,
    confidence: Math.min(100, Math.round((intelligence.confidence + (benchmark.confidence || 0)) / 2)),
    verdict,
    reasons
  };
}

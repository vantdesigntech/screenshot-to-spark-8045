export interface RawListing {
  id: string;
  title: string;
  description?: string;
  price: number;
  currency: string;
  url: string;
  imageUrl: string;
  platform: 'wallapop' | 'ebay';
  publishedAt: Date;
  location?: string;
  sellerRating?: number;
  condition?: string;
  listingType?: 'watch' | 'part' | 'accessory' | 'unknown';
  relevanceScore?: number;
  categoryName?: string;
  intelligence?: WatchIntelligence;
  dealScore?: DealScore;
}

export interface WatchSearchQuery {
  keywords: string;
  minPrice?: number;
  maxPrice?: number;
  platforms?: ('wallapop' | 'ebay')[];
  mode?: 'watches' | 'parts' | 'all';
  category?: string;
  exact?: boolean;
}

export interface MarketBenchmark {
  brand: string;
  model?: string;
  averageMarketPrice: number;
  minMarketPrice: number;
  maxMarketPrice?: number;
  sampleSize?: number;
  confidence?: number;
}

export interface DealAlert {
  listing: RawListing;
  benchmark?: MarketBenchmark;
  discountPercentage?: number;
  isDeal: boolean;
  timestamp: Date;
}

export interface WatchIntelligence {
  brand: string;
  model?: string;
  reference?: string;
  calibre?: string;
  partFamily?: string;
  searchKey: string;
  confidence: number;
  signals: string[];
}

export interface DealScore {
  marketValueEur: number;
  minMarketPriceEur: number;
  maxMarketPriceEur: number;
  savingsPct: number;
  profitMarginEur: number;
  score: number;
  confidence: number;
  verdict: 'strong_deal' | 'fair_deal' | 'market_price' | 'overpriced' | 'unknown';
  reasons: string[];
}

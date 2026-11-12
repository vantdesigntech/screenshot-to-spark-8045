import { gotScraping } from 'got-scraping';
import { BaseProvider } from './BaseProvider.js';
import { RawListing, WatchSearchQuery } from '../types/index.js';
import { upgradeToHighResImageUrl } from '../utils/imageUpscaler.js';
import { buildProviderKeywords, classifyListing, scoreListingRelevance } from '../utils/listingClassifier.js';

interface WallapopImage {
  id?: string;
  urls?: {
    small?: string;
    medium?: string;
    big?: string;
  };
  original?: string;
}

interface WallapopSearchItem {
  id: string;
  title: string;
  description?: string;
  category_id?: number;
  price?: {
    amount: number;
    currency: string;
  };
  web_slug?: string;
  images?: WallapopImage[];
  created_at?: number;
  location?: {
    city?: string;
    postal_code?: string;
  };
}

interface WallapopSearchResponse {
  data?: {
    section?: {
      items?: WallapopSearchItem[];
    };
  };
  search_objects?: WallapopSearchItem[];
}

export class WallapopProvider implements BaseProvider {
  name: 'wallapop' = 'wallapop';
  private baseUrl = 'https://api.wallapop.com/api/v3/search/section';

  async search(query: WatchSearchQuery): Promise<RawListing[]> {
    try {
      const listings: RawListing[] = [];
      const seen = new Set<string>();

      for (const keywords of buildProviderKeywords(query)) {
        const params = new URLSearchParams({
          keywords,
          source: 'deep_link',
          order_by: 'most_relevance',
          search_country: 'ES',
          search_section: 'organic_search_results',
          section_type: 'keyword_search'
        });

        if (query.minPrice !== undefined) {
          params.append('min_sale_price', query.minPrice.toString());
        }
        if (query.maxPrice !== undefined) {
          params.append('max_sale_price', query.maxPrice.toString());
        }

        const response = await gotScraping({
          url: `${this.baseUrl}?${params.toString()}`,
          headers: {
            'x-deviceos': '0',
            'x-appversion': '831570',
            'accept': 'application/json, text/plain, */*',
            'accept-language': 'es-ES,es;q=0.9',
            'referer': 'https://es.wallapop.com/',
            'origin': 'https://es.wallapop.com',
            'x-deviceid': 'ec259c63-bb41-4810-af26-2581fa704eca'
          },
          responseType: 'json',
          timeout: { request: 8000 }
        });

        const data = response.body as WallapopSearchResponse;
        const items = data.data?.section?.items || data.search_objects || [];

        for (const item of items) {
          if (seen.has(item.id)) continue;
          seen.add(item.id);

          const rawImg =
            item.images?.[0]?.urls?.big ||
            item.images?.[0]?.urls?.medium ||
            item.images?.[0]?.urls?.small ||
            item.images?.[0]?.original ||
            '';

          const listingType = classifyListing({ title: item.title, description: item.description });
          const listing: RawListing = {
            id: `wallapop_${item.id}`,
            title: item.title,
            description: item.description,
            price: item.price?.amount || 0,
            currency: item.price?.currency || 'EUR',
            url: item.web_slug
              ? `https://es.wallapop.com/item/${item.web_slug}`
              : `https://es.wallapop.com/item/${item.id}`,
            imageUrl: upgradeToHighResImageUrl(rawImg),
            platform: 'wallapop',
            publishedAt: item.created_at ? new Date(item.created_at) : new Date(),
            location: item.location?.city || undefined,
            condition: 'Segunda Mano',
            listingType
          };

          listing.relevanceScore = scoreListingRelevance(listing, query);
          listings.push(listing);
        }
      }

      return listings.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
    } catch (error) {
      console.error('[WallapopProvider] Error en la extraccion de Wallapop:', error);
      return [];
    }
  }
}

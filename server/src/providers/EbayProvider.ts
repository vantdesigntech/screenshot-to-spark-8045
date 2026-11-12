import { BaseProvider } from './BaseProvider.js';
import { RawListing, WatchSearchQuery } from '../types/index.js';
import { upgradeToHighResImageUrl } from '../utils/imageUpscaler.js';
import { buildProviderKeywords, classifyListing, scoreListingRelevance } from '../utils/listingClassifier.js';

interface EbayOAuthTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface EbayItemSummary {
  itemId: string;
  title: string;
  price?: {
    value: string;
    currency: string;
  };
  itemWebUrl?: string;
  image?: {
    imageUrl?: string;
  };
  itemCreationDate?: string;
  condition?: string;
  categories?: Array<{ categoryId: string; categoryName: string }>;
  itemLocation?: {
    country?: string;
    postalCode?: string;
  };
}

interface EbaySearchResponse {
  total?: number;
  itemSummaries?: EbayItemSummary[];
}

export class EbayProvider implements BaseProvider {
  name: 'ebay' = 'ebay';
  private appId: string;
  private certId: string;
  private environment: 'PRODUCTION' | 'SANDBOX';
  private globalId: string;

  private cachedToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor() {
    this.appId = process.env.EBAY_APP_ID || '';
    this.certId = process.env.EBAY_CERT_ID || '';
    this.environment = (process.env.EBAY_ENVIRONMENT as 'PRODUCTION' | 'SANDBOX') || 'PRODUCTION';
    this.globalId = process.env.EBAY_GLOBAL_ID || 'EBAY-ES';
  }

  private get authUrl(): string {
    return this.environment === 'PRODUCTION'
      ? 'https://api.ebay.com/identity/v1/oauth2/token'
      : 'https://api.sandbox.ebay.com/identity/v1/oauth2/token';
  }

  private get apiBaseUrl(): string {
    return this.environment === 'PRODUCTION'
      ? 'https://api.ebay.com/buy/browse/v1'
      : 'https://api.sandbox.ebay.com/buy/browse/v1';
  }

  private async getAccessToken(): Promise<string> {
    if (this.cachedToken && Date.now() < this.tokenExpiresAt - 60000) {
      return this.cachedToken;
    }

    if (!this.appId || !this.certId) {
      throw new Error(
        'Faltan credenciales de eBay. Configura EBAY_APP_ID y EBAY_CERT_ID en tu archivo .env'
      );
    }

    const credentials = Buffer.from(`${this.appId}:${this.certId}`).toString('base64');
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'https://api.ebay.com/oauth/api_scope'
    });

    const response = await fetch(this.authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`
      },
      body: body.toString()
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`[EbayProvider] Error al obtener OAuth token: ${response.status} - ${errText}`);
    }

    const data = (await response.json()) as EbayOAuthTokenResponse;
    this.cachedToken = data.access_token;
    this.tokenExpiresAt = Date.now() + (data.expires_in * 1000);

    return this.cachedToken;
  }

  async search(query: WatchSearchQuery): Promise<RawListing[]> {
    try {
      const token = await this.getAccessToken();

      let categoryFilter = 'categoryIds:{260324}';
      if (query.mode === 'parts') {
        categoryFilter = 'categoryIds:{260325|260328}';
      } else if (query.mode === 'all') {
        categoryFilter = 'categoryIds:{260324|260325|260328}';
      }

      const filterParts: string[] = [categoryFilter];

      if (query.minPrice !== undefined) {
        filterParts.push(`price:[${query.minPrice}..]`);
      }
      if (query.maxPrice !== undefined) {
        if (query.minPrice !== undefined) {
          filterParts.pop();
          filterParts.push(`price:[${query.minPrice}..${query.maxPrice}]`);
        } else {
          filterParts.push(`price:[..${query.maxPrice}]`);
        }
      }

      const listings: RawListing[] = [];
      const seen = new Set<string>();

      for (const keywords of buildProviderKeywords(query)) {
        const params = new URLSearchParams({
          q: keywords,
          limit: '50',
          sort: 'newlyListed',
          filter: filterParts.join(',')
        });

        const url = `${this.apiBaseUrl}/item_summary/search?${params.toString()}`;
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-EBAY-C-MARKETPLACE-ID': this.globalId,
            'X-EBAY-C-ENDUSERCTX': 'contextualLocation=country=ES',
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[EbayProvider] Error en busqueda de eBay: ${response.status}`, errorText);
          continue;
        }

        const data = (await response.json()) as EbaySearchResponse;
        const summaries = data.itemSummaries || [];

        for (const item of summaries) {
          if (seen.has(item.itemId)) continue;
          seen.add(item.itemId);

          const categoryName = item.categories?.map((category) => category.categoryName).join(' > ');
          const listingType = classifyListing({ title: item.title, categoryName });
          const listing: RawListing = {
            id: `ebay_${item.itemId}`,
            title: item.title,
            price: item.price ? parseFloat(item.price.value) : 0,
            currency: item.price?.currency || 'EUR',
            url: item.itemWebUrl || `https://www.ebay.es/itm/${item.itemId}`,
            imageUrl: upgradeToHighResImageUrl(item.image?.imageUrl || ''),
            platform: 'ebay',
            publishedAt: item.itemCreationDate ? new Date(item.itemCreationDate) : new Date(),
            condition: item.condition,
            listingType,
            categoryName,
            location: item.itemLocation?.country
          };

          listing.relevanceScore = scoreListingRelevance(listing, query);
          listings.push(listing);
        }
      }

      return listings.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
    } catch (error) {
      console.error('[EbayProvider] Error consultando eBay API:', error);
      return [];
    }
  }
}

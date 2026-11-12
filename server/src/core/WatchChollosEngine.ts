import { WallapopProvider } from '../providers/WallapopProvider.js';
import { EbayProvider } from '../providers/EbayProvider.js';
import { DeduplicationEngine } from './DeduplicationEngine.js';
import { WatchSearchQuery, RawListing } from '../types/index.js';
import { classifyListing, isListingRelevant, scoreListingRelevance } from '../utils/listingClassifier.js';
import { analyzeListing, scoreDeal } from '../utils/watchIntelligence.js';

export class WatchChollosEngine {
  private wallapop = new WallapopProvider();
  private ebay = new EbayProvider();
  private dedup: DeduplicationEngine;

  constructor(redisUrl?: string) {
    this.dedup = new DeduplicationEngine(redisUrl);
  }

  async searchDeals(query: WatchSearchQuery): Promise<RawListing[]> {
    const platforms = query.platforms || ['wallapop', 'ebay'];
    const tasks: Promise<RawListing[]>[] = [];

    if (platforms.includes('wallapop')) {
      tasks.push(this.wallapop.search(query));
    }
    if (platforms.includes('ebay')) {
      tasks.push(this.ebay.search(query));
    }

    const results = await Promise.all(tasks);
    const flattened = results.flat();

    const newDeals: RawListing[] = [];

    for (const item of flattened) {
      item.listingType = item.listingType || classifyListing(item);
      item.relevanceScore = item.relevanceScore ?? scoreListingRelevance(item, query);
      item.intelligence = item.intelligence || analyzeListing(item);
      item.dealScore = item.dealScore || scoreDeal(item);

      if (!isListingRelevant(item, query)) {
        continue;
      }

      const isNew = await this.dedup.isNewListing(item);
      if (isNew) {
        newDeals.push(item);
      }
    }

    return newDeals.sort((a, b) => (
      (b.dealScore?.score || 0) - (a.dealScore?.score || 0) ||
      (b.relevanceScore || 0) - (a.relevanceScore || 0)
    ));
  }
}

import { BaseProvider } from '../providers/BaseProvider.js';
import { WallapopProvider } from '../providers/WallapopProvider.js';
import { EbayProvider } from '../providers/EbayProvider.js';
import { DeduplicationEngine } from '../core/DeduplicationEngine.js';
import { RawListing, WatchSearchQuery, DealAlert } from '../types/index.js';
import { classifyListing, isListingRelevant, scoreListingRelevance } from '../utils/listingClassifier.js';
import { analyzeListing, benchmarkFor, scoreDeal } from '../utils/watchIntelligence.js';

export interface PipelineExecuteOptions {
  skipDedup?: boolean;
}

export class WatchDealsPipeline {
  private providers: Map<string, BaseProvider> = new Map();
  private dedup: DeduplicationEngine;

  constructor(redisUrl?: string) {
    this.dedup = new DeduplicationEngine(redisUrl);
    this.registerProvider(new EbayProvider());
    this.registerProvider(new WallapopProvider());
  }

  registerProvider(provider: BaseProvider) {
    this.providers.set(provider.name, provider);
  }

  async execute(query: WatchSearchQuery, options?: PipelineExecuteOptions): Promise<DealAlert[]> {
    const activePlatforms = query.platforms || Array.from(this.providers.keys());
    const tasks: Promise<RawListing[]>[] = [];

    for (const name of activePlatforms) {
      const provider = this.providers.get(name);
      if (provider) {
        tasks.push(provider.search(query));
      }
    }

    const results = await Promise.all(tasks);
    const rawListings = results.flat();

    const alerts: DealAlert[] = [];
    const seenInBatch = new Set<string>();

    for (const item of rawListings) {
      item.listingType = item.listingType || classifyListing(item);
      item.relevanceScore = item.relevanceScore ?? scoreListingRelevance(item, query);
      item.intelligence = item.intelligence || analyzeListing(item);
      item.dealScore = item.dealScore || scoreDeal(item);

      if (!isListingRelevant(item, query)) {
        continue;
      }

      if (seenInBatch.has(item.id)) {
        continue;
      }
      seenInBatch.add(item.id);

      if (options?.skipDedup) {
        alerts.push({
          listing: item,
          benchmark: benchmarkFor(item.intelligence),
          discountPercentage: item.dealScore.savingsPct,
          isDeal: item.dealScore.verdict === 'strong_deal' || item.dealScore.verdict === 'fair_deal',
          timestamp: new Date()
        });
      } else {
        const isNew = await this.dedup.isNewListing(item);
        if (isNew) {
          alerts.push({
            listing: item,
            benchmark: benchmarkFor(item.intelligence),
            discountPercentage: item.dealScore.savingsPct,
            isDeal: item.dealScore.verdict === 'strong_deal' || item.dealScore.verdict === 'fair_deal',
            timestamp: new Date()
          });
        }
      }
    }

    return alerts.sort((a, b) => (
      (b.listing.dealScore?.score || 0) - (a.listing.dealScore?.score || 0) ||
      (b.listing.relevanceScore || 0) - (a.listing.relevanceScore || 0)
    ));
  }
}

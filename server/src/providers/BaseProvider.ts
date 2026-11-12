import { RawListing, WatchSearchQuery } from '../types/index.js';

export interface BaseProvider {
  name: 'wallapop' | 'ebay';
  search(query: WatchSearchQuery): Promise<RawListing[]>;
}

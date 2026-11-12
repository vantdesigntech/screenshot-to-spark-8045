import { Redis } from 'ioredis';
import { RawListing } from '../types/index.js';

export class DeduplicationEngine {
  private redis: Redis | null = null;
  private memoryCache: Set<string> = new Set();
  private readonly REDIS_SET_KEY = 'watch_saas:seen_listings';

  constructor(redisUrl?: string) {
    if (redisUrl && redisUrl.trim() !== '') {
      try {
        this.redis = new Redis(redisUrl, {
          lazyConnect: true,
          maxRetriesPerRequest: 1,
          retryStrategy: () => null // no reintentar indefinidamente si no hay redis local
        });
        this.redis.on('error', () => {
          this.redis = null;
        });
        this.redis.connect().catch(() => {
          this.redis = null;
        });
      } catch {
        this.redis = null;
      }
    }
  }

  async isNewListing(listing: RawListing): Promise<boolean> {
    const key = listing.id;

    if (this.redis) {
      try {
        const added = await this.redis.sadd(this.REDIS_SET_KEY, key);
        return added === 1;
      } catch (err) {
        console.warn('[DeduplicationEngine] Fallo al consultar Redis, fallback a memoria:', err);
      }
    }

    if (this.memoryCache.has(key)) {
      return false;
    }
    this.memoryCache.add(key);
    // Limitar tamaño de la caché en memoria para evitar saturación
    if (this.memoryCache.size > 20000) {
      const iterator = this.memoryCache.values();
      for (let i = 0; i < 5000; i++) {
        const nextVal = iterator.next().value;
        if (nextVal) this.memoryCache.delete(nextVal);
      }
    }
    return true;
  }
}

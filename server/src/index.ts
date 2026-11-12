import 'dotenv/config';
import { WatchDealsPipeline } from './pipeline/WatchDealsPipeline.js';

async function main() {
  console.log('🏁 Arrancando Watch Chollos SaaS Pipeline (Estilo Fredy + Anti-Bot Stealth)...');

  const pipeline = new WatchDealsPipeline(process.env.REDIS_URL);

  const query = {
    keywords: 'Seiko Turtle',
    minPrice: 150,
    maxPrice: 450,
    platforms: ['ebay', 'wallapop'] as ('ebay' | 'wallapop')[]
  };

  console.log(`📡 Disparando pipeline para "${query.keywords}" en: ${query.platforms.join(', ')}...`);

  const alerts = await pipeline.execute(query);

  console.log(`🎯 Chollos detectados en este ciclo: ${alerts.length}`);
  alerts.slice(0, 5).forEach((deal, idx) => {
    const it = deal.listing;
    console.log(`[${idx + 1}] [${it.platform.toUpperCase()}] ${it.title} - ${it.price} ${it.currency}`);
    console.log(`    🔗 ${it.url}`);
  });
}

main().catch(console.error);

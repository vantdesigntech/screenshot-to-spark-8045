import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import express from 'express';
import cors from 'cors';
import { WatchDealsPipeline } from './pipeline/WatchDealsPipeline.js';
import { WatchSearchQuery } from './types/index.js';
import { rawListingToCholloDeal } from './mappers/CholloMapper.js';
import { mapListingToPart } from './mappers/PartMapper.js';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const pipeline = new WatchDealsPipeline(process.env.REDIS_URL);

// Endpoint de búsqueda en tiempo real (POST para el cliente SaaS)
app.post('/api/search', async (req, res) => {
  try {
    const { keywords, minPrice, maxPrice, platforms, mode, exact } = req.body;

    if (!keywords || typeof keywords !== 'string') {
      return res.status(400).json({ error: 'Keywords requeridas' });
    }

    const query: WatchSearchQuery = {
      keywords: keywords.trim(),
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      platforms: platforms && platforms.length > 0 ? platforms : ['ebay', 'wallapop'],
      mode: mode || 'watches',
      exact: exact !== undefined ? Boolean(exact) : undefined
    };

    console.log(`[API /api/search] Buscando "${query.keywords}" (modo: ${query.mode})...`);
    const alerts = await pipeline.execute(query, { skipDedup: true });

    res.json({
      success: true,
      query,
      count: alerts.length,
      deals: alerts.map(a => a.listing)
    });
  } catch (error: any) {
    console.error('[API Error /api/search]:', error);
    res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
});

// Endpoint GET /api/chollos compatible 1:1 con ChronoParts (Lovable)
app.get('/api/chollos', async (req, res) => {
  try {
    const qParam = (req.query.q as string) || '';
    const q = qParam.trim() || 'reloj automatico';

    console.log(`[API /api/chollos] Extrayendo chollos verificados para "${q}" (eBay Browse + Wallapop)...`);

    const query: WatchSearchQuery = {
      keywords: q,
      mode: 'watches',
      platforms: ['ebay', 'wallapop'],
      exact: false
    };

    const alerts = await pipeline.execute(query, { skipDedup: true });
    const chronoPartsDeals = alerts.map((a, idx) => rawListingToCholloDeal(a.listing, idx));

    console.log(`[API /api/chollos] ✅ ${chronoPartsDeals.length} chollos normalizados listos para ChronoParts.`);

    res.json({
      query: qParam,
      count: chronoPartsDeals.length,
      items: chronoPartsDeals
    });
  } catch (error: any) {
    console.error('[API Error /api/chollos]:', error);
    res.status(500).json({ error: error.message || 'Error al obtener chollos' });
  }
});

// Endpoint GET /api/parts compatible 1:1 con ChronoParts (Live Watch Parts Engine)
app.get('/api/parts', async (req, res) => {
  try {
    const qParam = (req.query.q as string) || '';
    const q = qParam.trim() || 'seiko nh35';

    console.log(`[API /api/parts] Extrayendo recambios para "${q}" (eBay Browse Cat 260325/260328 + Wallapop)...`);

    const query: WatchSearchQuery = {
      keywords: q,
      mode: 'parts',
      platforms: ['ebay', 'wallapop'],
      exact: false
    };

    const alerts = await pipeline.execute(query, { skipDedup: true });
    const parts = alerts.map(a => mapListingToPart(a.listing));

    const ebayCount = parts.filter(p => p.store === 'eBay').length;
    const wallapopCount = parts.filter(p => p.store === 'Wallapop').length;

    console.log(`[API /api/parts] ✅ ${parts.length} recambios encontrados (eBay: ${ebayCount}, Wallapop: ${wallapopCount}).`);

    res.json({
      query: qParam,
      count: parts.length,
      items: parts,
      sources: [
        { name: 'eBay', status: 'ok', count: ebayCount },
        { name: 'Wallapop', status: 'ok', count: wallapopCount }
      ]
    });
  } catch (error: any) {
    console.error('[API Error /api/parts]:', error);
    res.status(500).json({ error: error.message || 'Error al obtener recambios' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    mode: 'production',
    service: 'Watch Chollos SaaS & ChronoParts Engine',
    endpoints: [
      'GET /api/chollos?q=seiko',
      'GET /api/parts?q=seiko+nh35',
      'POST /api/search',
      'GET /api/health'
    ],
    timestamp: new Date().toISOString()
  });
});

app.listen(port, () => {
  console.log(`🚀 Watch Chollos Backend corriendo en http://localhost:${port}`);
  console.log(`📡 Endpoints activos:`);
  console.log(`   - GET  http://localhost:${port}/api/chollos?q=seiko`);
  console.log(`   - GET  http://localhost:${port}/api/parts?q=seiko+nh35`);
  console.log(`   - POST http://localhost:${port}/api/search`);
  console.log(`   - GET  http://localhost:${port}/api/health`);
});

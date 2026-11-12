import React, { useMemo, useState } from 'react';
import {
  Activity,
  BadgeEuro,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Filter,
  Gauge,
  Loader2,
  PackageSearch,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Watch,
} from 'lucide-react';

type SearchMode = 'watches' | 'parts';
type DealVerdict = 'strong_deal' | 'fair_deal' | 'market_price' | 'overpriced' | 'unknown';

interface DealScore {
  marketValueEur: number;
  minMarketPriceEur: number;
  maxMarketPriceEur: number;
  savingsPct: number;
  profitMarginEur: number;
  score: number;
  confidence: number;
  verdict: DealVerdict;
  reasons: string[];
}

interface WatchIntelligence {
  brand: string;
  model?: string;
  reference?: string;
  calibre?: string;
  searchKey: string;
  confidence: number;
  signals: string[];
}

interface Deal {
  id: string;
  title: string;
  price: number;
  currency: string;
  url: string;
  imageUrl: string;
  platform: 'wallapop' | 'ebay';
  publishedAt: string;
  location?: string;
  condition?: string;
  listingType?: 'watch' | 'part' | 'accessory' | 'unknown';
  relevanceScore?: number;
  intelligence?: WatchIntelligence;
  dealScore?: DealScore;
}

const PART_FILTERS = [
  { id: 'all', label: 'Todo', query: '' },
  { id: 'movements', label: 'Movimiento', query: 'movimiento movement calibre' },
  { id: 'dials', label: 'Dial', query: 'dial esfera agujas' },
  { id: 'bezels', label: 'Bisel', query: 'bisel bezel insert' },
  { id: 'crystals', label: 'Cristal', query: 'cristal zafiro sapphire' },
  { id: 'crowns', label: 'Corona', query: 'corona tija crown stem' },
  { id: 'straps', label: 'Correa/armis', query: 'correa armis bracelet strap' },
] as const;

const WATCH_INTENTS = [
  { id: 'all', label: 'Todos' },
  { id: 'strong_deal', label: 'Chollo fuerte' },
  { id: 'fair_deal', label: 'Interesante' },
  { id: 'market_price', label: 'Mercado' },
  { id: 'overpriced', label: 'Sobreprecio' },
] as const;

const BUDGETS = [
  { id: 'custom', label: 'Manual', min: '', max: '' },
  { id: 'under100', label: '<100', min: '', max: '100' },
  { id: '100-300', label: '100-300', min: '100', max: '300' },
  { id: '300-1000', label: '300-1000', min: '300', max: '1000' },
  { id: 'over1000', label: '+1000', min: '1000', max: '' },
] as const;

function verdictLabel(verdict?: DealVerdict) {
  switch (verdict) {
    case 'strong_deal':
      return 'Chollo fuerte';
    case 'fair_deal':
      return 'Interesante';
    case 'market_price':
      return 'Mercado';
    case 'overpriced':
      return 'Sobreprecio';
    default:
      return 'Sin benchmark';
  }
}

function verdictTone(verdict?: DealVerdict) {
  switch (verdict) {
    case 'strong_deal':
      return 'text-[#5fc39c] bg-[#1b2828]';
    case 'fair_deal':
      return 'text-[#d9a441] bg-[#2a2416]';
    case 'overpriced':
      return 'text-[#e5566f] bg-[#2c1a20]';
    default:
      return 'text-[#bdbdc0] bg-[#212023]';
  }
}

function formatEur(value?: number) {
  if (!value || value <= 0) return '-';
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}

function metricCount(deals: Deal[], predicate: (deal: Deal) => boolean) {
  return deals.filter(predicate).length;
}

export default function App() {
  const [mode, setMode] = useState<SearchMode>('watches');
  const [keywords, setKeywords] = useState('Seiko Turtle');
  const [minPrice, setMinPrice] = useState('150');
  const [maxPrice, setMaxPrice] = useState('450');
  const [platforms, setPlatforms] = useState<string[]>(['ebay', 'wallapop']);
  const [partFilter, setPartFilter] = useState<(typeof PART_FILTERS)[number]['id']>('all');
  const [watchIntent, setWatchIntent] = useState<(typeof WATCH_INTENTS)[number]['id']>('all');
  const [exact, setExact] = useState(false);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredDeals = useMemo(() => {
    if (mode === 'parts') return deals;
    if (watchIntent === 'all') return deals;
    return deals.filter((deal) => deal.dealScore?.verdict === watchIntent);
  }, [deals, mode, watchIntent]);

  const stats = useMemo(() => {
    const strong = metricCount(deals, (deal) => deal.dealScore?.verdict === 'strong_deal');
    const fair = metricCount(deals, (deal) => deal.dealScore?.verdict === 'fair_deal');
    const parts = metricCount(deals, (deal) => deal.listingType === 'part' || deal.listingType === 'accessory');
    const refs = metricCount(deals, (deal) => Boolean(deal.intelligence?.reference || deal.intelligence?.calibre));
    const avgScore = deals.length
      ? Math.round(deals.reduce((sum, deal) => sum + (deal.dealScore?.score || 0), 0) / deals.length)
      : 0;

    return { strong, fair, parts, refs, avgScore };
  }, [deals]);

  const togglePlatform = (platform: string) => {
    if (platforms.includes(platform)) {
      if (platforms.length > 1) setPlatforms(platforms.filter((item) => item !== platform));
    } else {
      setPlatforms([...platforms, platform]);
    }
  };

  const setBudget = (budget: (typeof BUDGETS)[number]) => {
    if (budget.id === 'custom') return;
    setMinPrice(budget.min);
    setMaxPrice(budget.max);
  };

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!keywords.trim()) return;

    setLoading(true);
    setError(null);
    setSearched(true);

    const selectedPart = PART_FILTERS.find((filter) => filter.id === partFilter);
    const queryText = mode === 'parts' && selectedPart?.query
      ? `${keywords.trim()} ${selectedPart.query}`
      : keywords.trim();

    try {
      const response = await fetch('http://localhost:3001/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords: queryText,
          minPrice: minPrice ? parseFloat(minPrice) : undefined,
          maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
          platforms,
          mode,
          exact,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error en el backend: ${response.status}`);
      }

      const data = await response.json();
      setDeals(data.deals || []);
    } catch (err) {
      console.error(err);
      setError('No se pudo conectar con el motor local en el puerto 3001. Arranca el backend y vuelve a buscar.');
    } finally {
      setLoading(false);
    }
  };

  const modeCopy = mode === 'parts'
    ? 'Recambios con compatibilidad probable, calibre y confianza del motor.'
    : 'Chollos ordenados por oportunidad: benchmark, margen y veredicto.';

  return (
    <div className="min-h-screen bg-[#171719] text-white">
      <div className="flex min-h-screen">
        <aside className="hidden lg:flex w-[56px] flex-col items-center border-r border-[#222224] py-4">
          <div className="mb-8 text-sm font-semibold text-white" title="ChronoSniper">
            CS
          </div>
          <button title="Buscador" aria-label="Buscador" className="mb-3 text-[#4a8ad6]">
            <Search className="h-5 w-5" />
          </button>
          <button title="Recambios" aria-label="Recambios" className="mb-3 text-[#8a8c92] hover:text-white">
            <PackageSearch className="h-5 w-5" />
          </button>
          <button title="Chollos" aria-label="Chollos" className="mb-3 text-[#8a8c92] hover:text-white">
            <Gauge className="h-5 w-5" />
          </button>
          <div className="mt-auto text-[#8a8c92]" title="Motor activo">
            <Activity className="h-5 w-5" />
          </div>
        </aside>

        <main className="w-full px-4 py-4 sm:px-6 lg:px-8">
          <header className="mb-5 flex flex-col gap-4 border-b border-[#222224] pb-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-[24px] font-semibold leading-tight text-white">ChronoSniper</h1>
              <p className="mt-1 text-[13px] text-[#b4b4b4]">{modeCopy}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[12px] text-[#b4b4b4]">
              <span className="inline-flex items-center gap-2">
                <Clock3 className="h-4 w-4" />
                Motor eBay + Wallapop
              </span>
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Scoring auditable
              </span>
            </div>
          </header>

          <form onSubmit={handleSearch} className="mb-5 bg-[#131217] p-4">
            <div className="mb-4 flex flex-wrap items-center gap-5">
              {(['watches', 'parts'] as SearchMode[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setMode(item)}
                  className={`relative pb-2 text-[14px] font-medium ${
                    mode === item ? 'text-white after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:bg-[#4a8ad6]' : 'text-[#8a8c92]'
                  }`}
                >
                  {item === 'watches' ? 'Chollos de relojes' : 'Buscador de piezas'}
                </button>
              ))}
            </div>

            <div className="grid gap-3 lg:grid-cols-[1fr_110px_110px_124px]">
              <label className="relative block">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a8c92]" />
                <input
                  type="text"
                  value={keywords}
                  onChange={(event) => setKeywords(event.target.value)}
                  placeholder={mode === 'parts' ? 'Ej: NH35, SKX007, Omega 3510.50...' : 'Ej: Seiko Turtle, Tissot PRX, Speedmaster...'}
                  className="h-10 w-full border border-[#3a3a3e] bg-[#171719] pl-10 pr-3 text-[14px] text-white outline-none placeholder:text-[#8a8c92] focus:border-[#4a8ad6]"
                />
              </label>

              <input
                type="number"
                value={minPrice}
                onChange={(event) => setMinPrice(event.target.value)}
                placeholder="Min EUR"
                className="h-10 border border-[#3a3a3e] bg-[#171719] px-3 text-[13px] text-white outline-none placeholder:text-[#8a8c92] focus:border-[#4a8ad6]"
              />
              <input
                type="number"
                value={maxPrice}
                onChange={(event) => setMaxPrice(event.target.value)}
                placeholder="Max EUR"
                className="h-10 border border-[#3a3a3e] bg-[#171719] px-3 text-[13px] text-white outline-none placeholder:text-[#8a8c92] focus:border-[#4a8ad6]"
              />
              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-10 items-center justify-center gap-2 bg-white px-4 text-[13px] font-semibold text-black disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Buscar
              </button>
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_auto]">
              <div className="flex flex-wrap items-center gap-2">
                <span className="mr-1 inline-flex items-center gap-2 text-[12px] text-[#b4b4b4]">
                  <Filter className="h-4 w-4" />
                  Fuentes
                </span>
                {['ebay', 'wallapop'].map((platform) => (
                  <button
                    key={platform}
                    type="button"
                    onClick={() => togglePlatform(platform)}
                    className={`relative h-8 px-3 text-[12px] ${
                      platforms.includes(platform)
                        ? 'text-white after:absolute after:bottom-0 after:left-3 after:h-px after:w-[calc(100%-24px)] after:bg-[#4a8ad6]'
                        : 'text-[#8a8c92]'
                    }`}
                  >
                    {platform === 'ebay' ? 'eBay' : 'Wallapop'}
                  </button>
                ))}
                <label className="ml-1 inline-flex h-8 items-center gap-2 text-[12px] text-[#b4b4b4]">
                  <input
                    type="checkbox"
                    checked={exact}
                    onChange={(event) => setExact(event.target.checked)}
                    className="h-4 w-4 accent-[#4a8ad6]"
                  />
                  exacto
                </label>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="mr-1 inline-flex items-center gap-2 text-[12px] text-[#b4b4b4]">
                  <BadgeEuro className="h-4 w-4" />
                  Presupuesto
                </span>
                {BUDGETS.slice(1).map((budget) => (
                  <button
                    type="button"
                    key={budget.id}
                    onClick={() => setBudget(budget)}
                    className="h-8 px-2 text-[12px] text-[#8a8c92] hover:text-white"
                  >
                    {budget.label}
                  </button>
                ))}
              </div>
            </div>

            {mode === 'parts' ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {PART_FILTERS.map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setPartFilter(filter.id)}
                    className={`relative h-8 px-2 text-[12px] ${
                      partFilter === filter.id
                        ? 'text-white after:absolute after:bottom-0 after:left-2 after:h-px after:w-[calc(100%-16px)] after:bg-[#4a8ad6]'
                        : 'text-[#8a8c92]'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-4 flex flex-wrap gap-2">
                {WATCH_INTENTS.map((intent) => (
                  <button
                    key={intent.id}
                    type="button"
                    onClick={() => setWatchIntent(intent.id)}
                    className={`relative h-8 px-2 text-[12px] ${
                      watchIntent === intent.id
                        ? 'text-white after:absolute after:bottom-0 after:left-2 after:h-px after:w-[calc(100%-16px)] after:bg-[#4a8ad6]'
                        : 'text-[#8a8c92]'
                    }`}
                  >
                    {intent.label}
                  </button>
                ))}
              </div>
            )}
          </form>

          {error && (
            <div className="mb-5 border border-[#5a252f] bg-[#2c1a20] px-4 py-3 text-[13px] text-[#e5566f]">
              {error}
            </div>
          )}

          <section className="mb-5 grid gap-3 md:grid-cols-5">
            <Metric label="Resultados" value={deals.length.toString()} />
            <Metric label="Chollos fuertes" value={stats.strong.toString()} />
            <Metric label="Interesantes" value={stats.fair.toString()} />
            <Metric label={mode === 'parts' ? 'Recambios' : 'Refs/calibres'} value={(mode === 'parts' ? stats.parts : stats.refs).toString()} />
            <Metric label="Score medio" value={stats.avgScore ? `${stats.avgScore}/100` : '-'} />
          </section>

          <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[16px] font-semibold">Resultados capturados</h2>
                <span className="text-[12px] text-[#8a8c92]">
                  {filteredDeals.length} visibles
                </span>
              </div>

              {filteredDeals.length === 0 && searched && !loading && (
                <div className="border border-[#222224] bg-[#131217] px-5 py-10 text-center">
                  <Watch className="mx-auto mb-3 h-8 w-8 text-[#8a8c92]" />
                  <p className="text-[14px] font-medium">No hay resultados con estos filtros.</p>
                  <p className="mt-1 text-[12px] text-[#8a8c92]">Amplia precio, cambia modo o desactiva la busqueda exacta.</p>
                </div>
              )}

              <div className="grid gap-3">
                {filteredDeals.map((item) => (
                  <ResultRow key={item.id} item={item} mode={mode} />
                ))}
              </div>
            </div>

            <aside className="space-y-3">
              <Panel title="Por que estos resultados">
                <ul className="space-y-3 text-[12px] leading-5 text-[#b4b4b4]">
                  <li className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5fc39c]" />
                    El motor separa reloj completo, recambio y accesorio antes de mostrar.
                  </li>
                  <li className="flex gap-2">
                    <SlidersHorizontal className="mt-0.5 h-4 w-4 shrink-0 text-[#4a8ad6]" />
                    El ranking combina coincidencia, referencia, calibre, benchmark y precio.
                  </li>
                  <li className="flex gap-2">
                    <Gauge className="mt-0.5 h-4 w-4 shrink-0 text-[#d9a441]" />
                    `strong_deal` exige descuento y confianza; `overpriced` queda visible para descartar.
                  </li>
                </ul>
              </Panel>

              <Panel title={mode === 'parts' ? 'Lectura de recambios' : 'Lectura de chollos'}>
                <div className="space-y-2 text-[12px] text-[#b4b4b4]">
                  {mode === 'parts' ? (
                    <>
                      <p>Prioriza calibre, modelo compatible y origen OEM/aftermarket.</p>
                      <p>Una correa se clasifica como accesorio; un NH35, dial o bisel entra como recambio.</p>
                    </>
                  ) : (
                    <>
                      <p>El precio se compara contra benchmark interno cuando hay marca/modelo suficiente.</p>
                      <p>La confianza sube si detecta modelo, referencia o calibre.</p>
                    </>
                  )}
                </div>
              </Panel>
            </aside>
          </section>
        </main>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[#222224] bg-[#131217] px-4 py-3">
      <div className="text-[12px] text-[#8a8c92]">{label}</div>
      <div className="mt-1 font-mono text-[20px] tabular-nums text-white">{value}</div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-[#222224] bg-[#131217] p-4">
      <h3 className="mb-3 text-[14px] font-semibold text-white">{title}</h3>
      {children}
    </div>
  );
}

function ResultRow({ item, mode }: { item: Deal; mode: SearchMode }) {
  const intelligence = item.intelligence;
  const score = item.dealScore;
  const title = intelligence?.searchKey || item.title;
  const isPart = mode === 'parts';

  return (
    <article className="grid gap-4 border border-[#222224] bg-[#131217] p-3 md:grid-cols-[112px_minmax(0,1fr)_180px]">
      <div className="h-[84px] w-full overflow-hidden bg-[#212023] md:h-[96px]">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-[#8a8c92]">
            {isPart ? <PackageSearch className="h-7 w-7" /> : <Watch className="h-7 w-7" />}
          </div>
        )}
      </div>

      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className={`px-2 py-1 text-[12px] ${verdictTone(score?.verdict)}`}>
            {isPart ? item.listingType || 'part' : verdictLabel(score?.verdict)}
          </span>
          <span className="text-[12px] text-[#8a8c92]">{item.platform}</span>
          {item.relevanceScore !== undefined && (
            <span className="font-mono text-[12px] text-[#8a8c92]">rel {item.relevanceScore}</span>
          )}
        </div>

        <h3 className="truncate text-[15px] font-semibold text-white">{title}</h3>
        <p className="mt-1 line-clamp-2 text-[12px] leading-5 text-[#b4b4b4]">{item.title}</p>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-[#8a8c92]">
          <span>{intelligence?.brand || 'Marca sin detectar'}</span>
          {intelligence?.model && <span>{intelligence.model}</span>}
          {intelligence?.reference && <span>Ref {intelligence.reference}</span>}
          {intelligence?.calibre && <span>Calibre {intelligence.calibre}</span>}
          {item.condition && <span>{item.condition}</span>}
        </div>

        {score?.reasons?.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {score.reasons.slice(0, 3).map((reason) => (
              <span key={reason} className="bg-[#212023] px-2 py-1 text-[12px] text-[#bdbdc0]">
                {reason}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex flex-col justify-between border-t border-[#222224] pt-3 md:border-l md:border-t-0 md:pl-4 md:pt-0">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-1">
          <div>
            <div className="text-[12px] text-[#8a8c92]">Precio</div>
            <div className="font-mono text-[20px] tabular-nums text-white">{formatEur(item.price)}</div>
          </div>
          <div>
            <div className="text-[12px] text-[#8a8c92]">{isPart ? 'Score pieza' : 'Mercado'}</div>
            <div className="font-mono text-[14px] tabular-nums text-white">
              {isPart ? `${score?.score ?? '-'} / 100` : formatEur(score?.marketValueEur)}
            </div>
          </div>
          {!isPart && (
            <>
              <div>
                <div className="text-[12px] text-[#8a8c92]">Ahorro</div>
                <div className="font-mono text-[14px] tabular-nums text-white">
                  {score ? `${score.savingsPct}%` : '-'}
                </div>
              </div>
              <div>
                <div className="text-[12px] text-[#8a8c92]">Margen</div>
                <div className="font-mono text-[14px] tabular-nums text-white">
                  {formatEur(score?.profitMarginEur)}
                </div>
              </div>
            </>
          )}
          <div>
            <div className="text-[12px] text-[#8a8c92]">Confianza</div>
            <div className="font-mono text-[14px] tabular-nums text-white">{score?.confidence ?? intelligence?.confidence ?? '-'}%</div>
          </div>
        </div>

        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex h-9 items-center justify-center gap-2 border border-[#3a3a3e] text-[12px] font-medium text-white hover:border-[#4a8ad6]"
        >
          Ver anuncio
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </article>
  );
}

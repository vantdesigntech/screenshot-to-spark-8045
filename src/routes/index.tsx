import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Search, Ruler, Droplets, Cog, Gem, ArrowUpRight, Truck } from "lucide-react";
import { ExplodedWatch } from "@/components/ExplodedWatch";
import { CATEGORIES, MAX_PRICE, PARTS, ROLEX_OP41, filterParts, type Category, type Filters, type Part } from "@/lib/parts";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ChronoParts — Luxury watch parts price comparator" },
      { name: "description", content: "Compare original OEM vintage watch parts vs aftermarket components across eBay, AliExpress and Chrono24." },
      { property: "og:title", content: "ChronoParts — Luxury watch parts price comparator" },
      { property: "og:description", content: "Search straps, bezels, crystals and movements. OEM vs generic, side by side." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const SPECS = [
  { icon: Ruler, k: "Lug width", v: "20mm" },
  { icon: Droplets, k: "Water resistance", v: "100m / 10 bar" },
  { icon: Cog, k: "Movement", v: "Calibre 3230 Perpetual" },
  { icon: Gem, k: "Material", v: "Oystersteel (904L)" },
];

const ORIGINS: { id: Filters["origin"]; label: string }[] = [
  { id: "all", label: "All" },
  { id: "oem", label: "Original / OEM (eBay & Chrono24)" },
  { id: "generic", label: "Generic / Aftermarket (AliExpress)" },
];

function Index() {
  const [query, setQuery] = useState("");
  const [origin, setOrigin] = useState<Filters["origin"]>("all");
  const [categories, setCategories] = useState<Category[]>([]);
  const [maxPrice, setMaxPrice] = useState(MAX_PRICE);
  const [currency, setCurrency] = useState<"EUR" | "USD">("EUR");
  const resultsRef = useRef<HTMLElement>(null);

  const results = useMemo(() => filterParts(PARTS, { query, origin, categories, maxPrice }), [query, origin, categories, maxPrice]);

  const selectFromWatch = (cats: Category[]) => {
    setCategories(cats);
    resultsRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  const toggleCat = (c: Category) => setCategories((cur) => (cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c]));

  return (
    <div className="min-h-screen">
      <header className="relative overflow-hidden hero-glow">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
          <span className="font-serif text-2xl">Chrono<em>Parts</em></span>
          <div className="hidden gap-8 text-sm font-medium md:flex">
            <a href="#search">Search</a><a href="#search">Compare</a><span className="text-muted-foreground">Stores: eBay · AliExpress · Chrono24</span>
          </div>
        </nav>

        <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 pb-10 pt-6 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <p className="text-xs font-bold tracking-[0.25em] text-muted-foreground">REF. 124300</p>
            <h1 className="mt-3 text-5xl font-black leading-[0.95] tracking-tight md:text-7xl">OYSTER<br />PERPETUAL <span className="text-4xl md:text-5xl">41</span></h1>
            <p className="mt-6 font-serif text-3xl leading-tight md:text-4xl">Every <em>part</em>, every store,<br />one <em>honest</em> price.</p>
            <p className="mt-4 max-w-md text-muted-foreground">Compare original vintage components against aftermarket alternatives. Hover the watch to take it apart — click a part to find it.</p>
            <a href="#search" className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground">Start searching <ArrowUpRight className="h-4 w-4" /></a>
          </div>
          <ExplodedWatch model={ROLEX_OP41} onSelect={selectFromWatch} />
        </div>

        <div className="mx-auto max-w-7xl px-6 pb-12">
          <div className="grid grid-cols-2 gap-6 rounded-2xl border border-primary/10 bg-card/60 p-6 backdrop-blur md:grid-cols-4">
            {SPECS.map(({ icon: Icon, k, v }) => (
              <div key={k} className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-primary/20"><Icon className="h-4 w-4" /></span>
                <div><p className="text-[10px] font-black uppercase tracking-[0.15em]">{k}</p><p className="text-sm font-medium text-muted-foreground">{v}</p></div>
              </div>
            ))}
          </div>
        </div>
      </header>

      <section id="search" ref={resultsRef} className="mx-auto max-w-7xl scroll-mt-6 px-6 py-16">
        <h2 className="font-serif text-4xl md:text-5xl">Find the <em>right</em> part.</h2>
        <div className="mt-8 flex items-center gap-3 rounded-full border bg-card px-6 py-4 shadow-soft focus-within:ring-2 focus-within:ring-ring">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Tissot 1990 correa, Seiko NH35 dial, Rolex 20mm oyster strap"
            className="w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
          />
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {ORIGINS.map((o) => (
            <button key={o.id} onClick={() => setOrigin(o.id)} className={`rounded-full px-4 py-2 text-sm font-medium transition ${origin === o.id ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-muted"}`}>{o.label}</button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button key={c.id} onClick={() => toggleCat(c.id)} className={`rounded-full border px-4 py-1.5 text-sm transition ${categories.includes(c.id) ? "border-accent bg-accent font-bold text-accent-foreground" : "hover:border-primary/40"}`}>{c.label}</button>
          ))}
          {categories.length > 0 && <button onClick={() => setCategories([])} className="px-2 text-sm text-muted-foreground underline">Clear</button>}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-6">
          <label className="flex items-center gap-3 text-sm font-medium">
            Max price
            <input type="range" min={5} max={MAX_PRICE} value={maxPrice} onChange={(e) => setMaxPrice(+e.target.value)} className="w-56 accent-primary" />
            <span className="w-20 font-bold">{fmt(maxPrice, currency)}</span>
          </label>
          <div className="flex rounded-full bg-secondary p-1 text-xs font-bold">
            {(["EUR", "USD"] as const).map((c) => (
              <button key={c} onClick={() => setCurrency(c)} className={`rounded-full px-3 py-1 ${currency === c ? "bg-card shadow-soft" : ""}`}>{c}</button>
            ))}
          </div>
          <span className="ml-auto text-sm text-muted-foreground">{results.length} results</span>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((p) => <PartCard key={p.id} p={p} currency={currency} />)}
          {results.length === 0 && <p className="col-span-full py-16 text-center font-serif text-2xl text-muted-foreground">No parts match — try widening your filters.</p>}
        </div>
      </section>

      <footer className="border-t py-8 text-center text-xs text-muted-foreground">ChronoParts · Prices are illustrative sample data</footer>
    </div>
  );
}

function fmt(eur: number, c: "EUR" | "USD") {
  const v = c === "EUR" ? eur : eur * 1.08;
  return new Intl.NumberFormat("en", { style: "currency", currency: c, maximumFractionDigits: v < 100 ? 2 : 0 }).format(v);
}

const STORE_BADGE: Record<Part["store"], string> = {
  AliExpress: "bg-store-ali text-primary-foreground",
  eBay: "bg-store-ebay text-primary-foreground",
  Chrono24: "bg-store-chrono text-primary-foreground",
};
const QUALITY: Record<Part["store"], string> = { AliExpress: "Generic / Aftermarket", eBay: "Vintage / Original OEM", Chrono24: "Certified OEM" };

function PartCard({ p, currency }: { p: Part; currency: "EUR" | "USD" }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border bg-card transition hover:-translate-y-1 hover:shadow-soft">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img src={p.image} alt={p.title} loading="lazy" width={816} height={816} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
        <div className="absolute left-3 top-3 flex gap-1.5">
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${STORE_BADGE[p.store]}`}>{p.store}</span>
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${p.origin === "oem" ? "bg-champagne text-foreground" : "bg-card text-foreground"}`}>{QUALITY[p.store]}</span>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">{p.brand} · {p.spec}</p>
        <h3 className="mt-1 font-medium leading-snug">{p.title}</h3>
        <div className="mt-auto flex items-end justify-between pt-5">
          <div>
            <p className="text-2xl font-black">{fmt(p.priceEur, currency)}</p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground"><Truck className="h-3 w-3" />{p.delivery}</p>
          </div>
          <a href="#" onClick={(e) => e.preventDefault()} className="inline-flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition group-hover:bg-accent group-hover:text-accent-foreground">Ver en tienda <ArrowUpRight className="h-3 w-3" /></a>
        </div>
      </div>
    </article>
  );
}

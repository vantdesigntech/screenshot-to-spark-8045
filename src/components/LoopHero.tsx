import { useMemo, useState } from "react";
import { Loader2, Search } from "lucide-react";
import strap from "@/assets/strap.jpg";
import bracelet from "@/assets/bracelet.jpg";
import crystal from "@/assets/crystal.jpg";
import movement from "@/assets/movement.jpg";
import { CATEGORIES, PARTS } from "@/lib/parts";

// Unbranded component photos only (no dials with visible logos).
const IMAGES = [
  strap, bracelet, crystal, movement,
  "/models/seiko-skx/bezel.png", "/models/tissot-prx/movement.png", "/models/omega-speedy/bracelet-top.png",
  "/models/rolex-op41/movement.png", "/models/seiko-skx/caseback.png", "/models/tissot-prx/bracelet-top.png",
  "/models/omega-speedy/bezel.png", "/models/seiko-skx/movement.png", "/models/tissot-prx/midcase.png",
  "/models/rolex-op41/bracelet-top.png", "/models/omega-speedy/movement.png",
];

function buildColumns(n: number) {
  return Array.from({ length: n }, (_, c) => IMAGES.filter((_, i) => i % n === c).concat(IMAGES.filter((_, i) => (i + c) % n === 0)).slice(0, 6));
}

const SUGGESTIONS = Array.from(
  new Set([
    ...CATEGORIES.map((c) => c.labelEs),
    ...PARTS.map((p) => p.brand).filter((b) => b !== "Generic"),
    ...PARTS.flatMap((p) => p.compatibleWith),
  ]),
);

export function LoopHero({ onSearch, loading }: { onSearch: (phrase: string) => void; loading: boolean }) {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const cols = useMemo(() => buildColumns(5), []);
  const matches = useMemo(() => {
    const v = value.trim().toLowerCase();
    if (v.length < 2) return [];
    const last = v.split(/\s+/).pop() ?? v;
    return SUGGESTIONS.filter((s) => s.toLowerCase().includes(last)).slice(0, 5);
  }, [value]);

  const submit = (phrase: string) => {
    if (!phrase.trim()) return;
    setFocused(false);
    onSearch(phrase.trim());
  };

  return (
    <header className="relative isolate flex min-h-[88svh] w-full items-center justify-center overflow-hidden bg-background">
      <div aria-hidden className="absolute inset-0 -z-10 grid grid-cols-3 gap-3 px-3 opacity-70 sm:grid-cols-5">
        {cols.map((col, c) => (
          <div key={c} className={`overflow-hidden ${c >= 3 ? "hidden sm:block" : ""}`}>
            <div
              className={c % 2 === 0 ? "hero-col-up" : "hero-col-down"}
              style={{ ["--hero-speed" as string]: `${70 + c * 9}s` }}
            >
              {[...col, ...col].map((src, i) => (
                <div key={i} className="mb-3 aspect-[3/4] overflow-hidden rounded-md border border-border bg-card">
                  <img
                    src={src}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    width={240}
                    height={320}
                    className="h-full w-full object-contain p-3"
                    style={{ opacity: 0.45 + ((i * 7 + c * 3) % 5) * 0.1 }}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div aria-hidden className="hero-vignette absolute inset-0 -z-10" />

      <div className="mx-auto w-full max-w-2xl px-4 text-center">
        <p className="eyebrow text-muted-foreground">Recambios OEM y aftermarket</p>
        <h1 className="mt-4 font-display text-[44px] uppercase italic leading-[0.95] text-foreground sm:text-[72px]">
          Encuentra mi recambio
        </h1>
        <form
          className="relative mt-8"
          onSubmit={(e) => {
            e.preventDefault();
            submit(value);
          }}
        >
          <label htmlFor="nl-search" className="sr-only">Describe la pieza que buscas</label>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            id="nl-search"
            type="search"
            autoComplete="off"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            placeholder="Ej.: necesito un cristal de zafiro para mi Seiko SKX007"
            className="h-14 w-full rounded-md border border-input bg-card pl-12 pr-28 text-[16px] text-foreground placeholder:text-muted-foreground transition-colors duration-200 focus:border-primary focus:outline-none sm:h-16 sm:text-[17px]"
          />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-2 top-1/2 inline-flex h-11 -translate-y-1/2 items-center gap-2 rounded-md bg-primary px-4 text-[15px] font-semibold text-primary-foreground transition-opacity duration-200 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Buscar
          </button>
          {focused && matches.length > 0 && (
            <ul className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-md border border-border bg-popover text-left">
              {matches.map((m) => (
                <li key={m}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      const words = value.trim().split(/\s+/);
                      words.pop();
                      setValue([...words, m].join(" ") + " ");
                    }}
                    className="flex min-h-11 w-full items-center px-4 text-[15px] text-foreground hover:bg-accent"
                  >
                    {m}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </form>
        <p className="mt-4 text-[14px] text-muted-foreground">Escribe como hablarías. Los resultados salen siempre del catálogo.</p>
      </div>
    </header>
  );
}

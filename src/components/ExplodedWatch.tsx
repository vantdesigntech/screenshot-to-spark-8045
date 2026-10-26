import { useState, type ReactNode } from "react";
import type { Category } from "@/lib/parts";

type Hotspot = { n: string; label: string; cats: Category[]; pos: string; side: "left" | "right" };

const HOTSPOTS: Hotspot[] = [
  { n: "01", label: "Bezel & Sapphire Crystal", cats: ["bezels", "crystals"], pos: "left-[6%] top-[6%]", side: "left" },
  { n: "02", label: "Dial & Hands", cats: ["dials"], pos: "left-[2%] top-[36%]", side: "left" },
  { n: "03", label: "Movement · Calibre 3230 / ETA", cats: ["movements"], pos: "right-[0%] top-[46%]", side: "right" },
  { n: "04", label: "Oyster Bracelet · 20mm lugs", cats: ["straps"], pos: "right-[4%] top-[12%]", side: "right" },
];

function Layer({ open, z, x = 0, y = 0, rest = 0, children }: { open: boolean; z: number; x?: number; y?: number; rest?: number; children: ReactNode }) {
  return (
    <div
      className="absolute inset-0 transition-transform duration-[900ms] ease-spring preserve-3d"
      style={{ transform: open ? `translate3d(${x}px, ${y}px, ${z}px)` : `translate3d(0,0,${rest}px)` }}
    >
      {children}
    </div>
  );
}

const steel = (id: string) => (
  <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stopColor="#f4f5f7" />
    <stop offset="0.45" stopColor="#b9bec5" />
    <stop offset="0.7" stopColor="#e9ebee" />
    <stop offset="1" stopColor="#8d939b" />
  </linearGradient>
);

function Bracelet({ flip }: { flip?: boolean }) {
  return (
    <svg viewBox="0 0 100 140" className="absolute left-1/2 h-[46%] w-[26%] -translate-x-1/2" style={{ [flip ? "top" : "bottom"]: "86%", transform: `translateX(-50%) ${flip ? "scaleY(-1)" : ""}` }}>
      <defs>{steel("br")}</defs>
      {Array.from({ length: 6 }).map((_, i) => (
        <g key={i} transform={`translate(0 ${i * 23})`}>
          <rect x="4" y="2" width="28" height="20" rx="4" fill="url(#br)" stroke="#9aa0a7" strokeWidth="0.6" />
          <rect x="34" y="2" width="32" height="20" rx="4" fill="url(#br)" stroke="#9aa0a7" strokeWidth="0.6" />
          <rect x="68" y="2" width="28" height="20" rx="4" fill="url(#br)" stroke="#9aa0a7" strokeWidth="0.6" />
        </g>
      ))}
    </svg>
  );
}

export function ExplodedWatch({ onSelect }: { onSelect: (cats: Category[]) => void }) {
  const [open, setOpen] = useState(false);
  const ticks = Array.from({ length: 60 });

  return (
    <div
      className="relative mx-auto aspect-square w-full max-w-[560px]"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {/* schematic circles */}
      <svg viewBox="0 0 400 400" className="pointer-events-none absolute inset-0 text-primary/15">
        <circle cx="200" cy="200" r="196" fill="none" stroke="currentColor" strokeDasharray="2 6" />
        <circle cx="200" cy="200" r="160" fill="none" stroke="currentColor" />
        <circle cx="200" cy="200" r="120" fill="none" stroke="currentColor" strokeDasharray="1 4" />
        <line x1="0" y1="200" x2="400" y2="200" stroke="currentColor" strokeDasharray="3 5" />
        <line x1="200" y1="0" x2="200" y2="400" stroke="currentColor" strokeDasharray="3 5" />
        <circle cx="340" cy="70" r="10" fill="none" stroke="currentColor" />
        <circle cx="60" cy="330" r="14" fill="none" stroke="currentColor" />
      </svg>
      <div className="absolute inset-0 m-auto h-1/2 w-1/2 rounded-full bg-lime/40 blur-3xl" />

      <div className="absolute inset-[18%]" style={{ perspective: "1400px" }}>
        <div
          className="relative h-full w-full transition-transform duration-[900ms] ease-spring preserve-3d"
          style={{ transform: open ? "rotateX(58deg) rotateZ(-38deg) scale(0.82)" : "rotateX(0) rotateZ(0) scale(1)" }}
        >
          {/* Caseback */}
          <Layer open={open} z={-200} x={20} y={20}>
            <svg viewBox="0 0 200 200" className="h-full w-full">
              <defs>{steel("cb")}</defs>
              <circle cx="100" cy="100" r="92" fill="url(#cb)" />
              {[78, 64, 50].map((r) => <circle key={r} cx="100" cy="100" r={r} fill="none" stroke="#8d939b" strokeWidth="0.8" />)}
              <text x="100" y="104" textAnchor="middle" fontSize="8" fill="#5c626a" fontFamily="Red Hat Display" fontWeight="700" letterSpacing="2">OYSTERSTEEL</text>
            </svg>
          </Layer>
          {/* Middle case + bracelet */}
          <Layer open={open} z={-100} rest={1}>
            <div className="absolute inset-0 transition-transform duration-[900ms] ease-spring" style={{ transform: open ? "translateY(-40px)" : "none" }}>
              <Bracelet />
            </div>
            <div className="absolute inset-0 transition-transform duration-[900ms] ease-spring" style={{ transform: open ? "translateY(40px)" : "none" }}>
              <Bracelet flip />
            </div>
            <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full overflow-visible">
              <defs>{steel("cs")}</defs>
              <path d="M62 14 L72 -6 L128 -6 L138 14 Z M62 186 L72 206 L128 206 L138 186 Z" fill="url(#cs)" stroke="#9aa0a7" strokeWidth="0.6" />
              <rect x="190" y="90" width="14" height="20" rx="3" fill="url(#cs)" stroke="#9aa0a7" strokeWidth="0.6" />
              <circle cx="100" cy="100" r="96" fill="url(#cs)" stroke="#9aa0a7" />
              <circle cx="100" cy="100" r="82" fill="#2b3036" />
            </svg>
          </Layer>
          {/* Movement */}
          <Layer open={open} z={0} rest={2}>
            <svg viewBox="0 0 200 200" className="h-full w-full">
              <defs>
                <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f3dca0" /><stop offset="1" stopColor="#b8893c" /></linearGradient>
                {steel("mv")}
              </defs>
              <circle cx="100" cy="100" r="80" fill="url(#mv)" />
              <path d="M100 100 L172 70 A80 80 0 0 1 150 160 Z" fill="url(#gold)" opacity="0.9" />
              {[[70, 70, 18], [130, 60, 12], [65, 130, 14]].map(([x, y, r], i) => (
                <g key={i}>
                  <circle cx={x} cy={y} r={r} fill="none" stroke="#b8893c" strokeWidth="2" strokeDasharray="2 2" />
                  <circle cx={x} cy={y} r="3" fill="#b03060" />
                </g>
              ))}
              <circle cx="100" cy="100" r="6" fill="#5c626a" />
            </svg>
          </Layer>
          {/* Dial & hands */}
          <Layer open={open} z={100} x={-10} y={-10} rest={3}>
            <svg viewBox="0 0 200 200" className="h-full w-full">
              <circle cx="100" cy="100" r="80" fill="#f6f6f4" />
              {ticks.map((_, i) => {
                const a = (i * 6 * Math.PI) / 180;
                const big = i % 5 === 0;
                const r1 = big ? 62 : 74;
                return <line key={i} x1={100 + Math.sin(a) * r1} y1={100 - Math.cos(a) * r1} x2={100 + Math.sin(a) * 77} y2={100 - Math.cos(a) * 77} stroke={big ? "#9aa0a7" : "#c9ccd0"} strokeWidth={big ? 3.4 : 0.7} strokeLinecap="round" />;
              })}
              <text x="100" y="66" textAnchor="middle" fontSize="7" fontWeight="900" fill="#101e29" fontFamily="Red Hat Display" letterSpacing="1">CHRONO</text>
              <text x="100" y="140" textAnchor="middle" fontSize="5" fontWeight="500" fill="#5c626a" fontFamily="Red Hat Display" letterSpacing="1">OYSTER PERPETUAL</text>
              <rect x="146" y="95" width="14" height="10" fill="#fff" stroke="#9aa0a7" strokeWidth="0.6" />
              <text x="153" y="103" textAnchor="middle" fontSize="7" fontWeight="700" fill="#101e29">26</text>
              <line x1="100" y1="100" x2="72" y2="74" stroke="#7d838a" strokeWidth="4" strokeLinecap="round" />
              <line x1="100" y1="100" x2="132" y2="44" stroke="#7d838a" strokeWidth="3" strokeLinecap="round" />
              <line x1="100" y1="112" x2="100" y2="30" stroke="#101e29" strokeWidth="1" />
              <circle cx="100" cy="100" r="3.5" fill="#101e29" />
            </svg>
          </Layer>
          {/* Bezel & crystal */}
          <Layer open={open} z={200} x={-30} y={-30} rest={4}>
            <svg viewBox="0 0 200 200" className="h-full w-full">
              <defs>
                {steel("bz")}
                <radialGradient id="glass" cx="0.3" cy="0.25" r="0.9"><stop offset="0" stopColor="#fff" stopOpacity="0.55" /><stop offset="0.5" stopColor="#dbe7f2" stopOpacity="0.08" /><stop offset="1" stopColor="#fff" stopOpacity="0.2" /></radialGradient>
                <mask id="ring"><rect width="200" height="200" fill="#fff" /><circle cx="100" cy="100" r="80" fill="#000" /></mask>
              </defs>
              <circle cx="100" cy="100" r="96" fill="url(#bz)" mask="url(#ring)" />
              <circle cx="100" cy="100" r="80" fill="url(#glass)" stroke="#ffffff" strokeOpacity="0.7" />
            </svg>
          </Layer>
        </div>
      </div>

      {/* hotspots */}
      {HOTSPOTS.map((h, i) => (
        <button
          key={h.n}
          onClick={() => onSelect(h.cats)}
          className={`absolute z-10 flex items-center gap-2 transition-all duration-500 ${h.pos} ${h.side === "right" ? "flex-row-reverse" : ""} ${open ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"}`}
          style={{ transitionDelay: open ? `${300 + i * 90}ms` : "0ms" }}
        >
          <span className="rounded-full bg-card/90 px-3 py-1.5 text-xs font-medium shadow-soft backdrop-blur hover:bg-accent">{h.label}</span>
          <span className="relative grid h-7 w-7 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            <span className="absolute inset-0 rounded-full bg-primary animate-ping-soft" />
            <span className="relative">{h.n}</span>
          </span>
        </button>
      ))}

      <button
        onClick={() => setOpen((o) => !o)}
        className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full border border-primary/20 bg-card/70 px-4 py-1.5 text-[11px] font-bold tracking-[0.2em] uppercase backdrop-blur"
      >
        {open ? "Assemble" : "Hover · Explode"}
      </button>
    </div>
  );
}

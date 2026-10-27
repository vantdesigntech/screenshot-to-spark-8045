import { useState, type ReactNode } from "react";
import { WATCH_MODELS, type Category, type WatchModelSpec } from "@/lib/parts";
import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";

function Layer({
  open,
  z,
  x = 0,
  y = 0,
  rest = 0,
  highlighted = false,
  dimmed = false,
  layerTag,
  children,
}: {
  open: boolean;
  z: number;
  x?: number;
  y?: number;
  rest?: number;
  highlighted?: boolean;
  dimmed?: boolean;
  layerTag?: string;
  children: ReactNode;
}) {
  const scale = highlighted && open ? 1.07 : 1;
  return (
    <div
      className={`absolute inset-0 transition-all duration-[850ms] ease-spring preserve-3d ${
        dimmed && open ? "opacity-45" : "opacity-100"
      }`}
      style={{
        transform: open
          ? `translate3d(${x}px, ${y}px, ${z}px) scale(${scale})`
          : `translate3d(0, 0, ${rest}px) scale(1)`,
        filter:
          highlighted && open
            ? "var(--watch-highlight-shadow)"
            : open
              ? "var(--watch-layer-shadow)"
              : undefined,
      }}
    >
      {children}
      {open && layerTag && (
        <span
          className={`pointer-events-none absolute -right-6 top-1/2 -translate-y-1/2 rounded-full border px-2.5 py-0.5 text-[8px] font-black uppercase tracking-widest transition-opacity duration-500 ${
            highlighted
              ? "border-accent bg-accent text-accent-foreground opacity-100 shadow-soft"
              : "border-primary/20 bg-card/90 text-muted-foreground opacity-85"
          }`}
        >
          {layerTag}
        </span>
      )}
    </div>
  );
}

export function ExplodedWatch({
  model: requestedModel,
  onSelect,
}: {
  model?: WatchModelSpec | undefined;
  onSelect: (cats: Category[], label?: string) => void;
}) {
  const [hoverOpen, setHoverOpen] = useState(false);
  const [pinnedOpen, setPinnedOpen] = useState(false);
  const [activeLayer, setActiveLayer] = useState<number | null>(null);
  const [cameraMode, setCameraMode] = useState<"iso" | "side">("iso");
  const model = requestedModel ?? WATCH_MODELS[0];
  if (!model) return null;

  const open = hoverOpen || pinnedOpen;
  const basePath = `/models/${model.id}`;

  return (
    <div className="mx-auto w-full min-w-0 max-w-[580px]">
    <div
      className="watch-stage relative mx-auto aspect-square w-full select-none"
      onPointerEnter={(event) => { if (event.pointerType === "mouse") setHoverOpen(true); }}
      onMouseLeave={() => {
        setHoverOpen(false);
        setActiveLayer(null);
      }}
    >
      {/* Horological Blueprint Background Circles */}
      <svg viewBox="0 0 400 400" className="pointer-events-none absolute inset-0 text-primary/15">
        <circle cx="200" cy="200" r="196" fill="none" stroke="currentColor" strokeDasharray="2 6" />
        <circle cx="200" cy="200" r="164" fill="none" stroke="currentColor" />
        <circle cx="200" cy="200" r="126" fill="none" stroke="currentColor" strokeDasharray="1 4" />
        <line x1="0" y1="200" x2="400" y2="200" stroke="currentColor" strokeDasharray="3 5" />
        <line x1="200" y1="0" x2="200" y2="400" stroke="currentColor" strokeDasharray="3 5" />
        <circle cx="340" cy="68" r="10" fill="none" stroke="currentColor" />
        <circle cx="58" cy="332" r="14" fill="none" stroke="currentColor" />
        <text x="200" y="16" textAnchor="middle" fontSize="6" fill="currentColor" letterSpacing="2">
          PHOTOREALISTIC HOROLOGICAL EXPLODED CAD · {model.ref}
        </text>
      </svg>

      {/* 3D Photorealistic Stage */}
      <div className="absolute inset-[17%]" style={{ perspective: "1500px" }}>
        <div
          className="watch-camera relative h-full w-full transition-transform duration-[900ms] ease-spring preserve-3d"
          data-open={open}
          data-angle={cameraMode}
        >
          {/* Central Technical Axis Spine when Exploded */}
          {open && (
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 h-[440px] w-[2px] -translate-x-1/2 -translate-y-1/2 border-l-2 border-dashed border-primary/40"
              style={{ transform: "rotateX(90deg) translateZ(0px)" }}
            />
          )}

          {/* LAYER 0: Photorealistic Brushed Steel Caseback */}
          <Layer
            open={open}
            z={-210}
            x={26}
            y={26}
            highlighted={activeLayer === 0}
            dimmed={activeLayer !== null && activeLayer !== 0}
            layerTag="L6 · CASEBACK OEM"
          >
            <img
              src={`${basePath}/caseback.png`}
              alt={`${model.name} Caseback`}
              draggable={false}
              className="h-full w-full object-contain"
            />
          </Layer>

          {/* LAYER 1 & 2: Photorealistic Middle Case, Crown/Pushers & Brushed Steel Bracelets */}
          <Layer
            open={open}
            z={-110}
            x={12}
            y={12}
            rest={1}
            highlighted={activeLayer === 1 || activeLayer === 2}
            dimmed={activeLayer !== null && activeLayer !== 1 && activeLayer !== 2}
            layerTag="L4/L5 · CASE & BRACELET"
          >
            {/* Top Bracelet */}
            <div
              className="pointer-events-none absolute inset-0 transition-transform duration-[900ms] ease-spring"
              style={{ transform: open ? "translateY(-44px)" : "none" }}
            >
              <img
                src={`${basePath}/bracelet-top.png`}
                alt={`${model.name} Top Bracelet`}
                draggable={false}
                className="absolute h-[50%] w-[36%] object-fill"
                style={{ left: "32%", bottom: "83%" }}
              />
            </div>

            {/* Bottom Bracelet */}
            <div
              className="pointer-events-none absolute inset-0 transition-transform duration-[900ms] ease-spring"
              style={{ transform: open ? "translateY(44px)" : "none" }}
            >
              <img
                src={`${basePath}/bracelet-bottom.png`}
                alt={`${model.name} Bottom Bracelet`}
                draggable={false}
                className="absolute h-[50%] w-[36%] object-fill"
                style={{ left: "32%", top: "83%" }}
              />
            </div>

            {/* Monobloc CNC Middle Case & Crown */}
            <img
              src={`${basePath}/midcase.png`}
              alt={`${model.name} Middle Case`}
              draggable={false}
              className="relative h-full w-full object-contain"
            />
          </Layer>

          {/* LAYER 3: Photorealistic Mechanical Movement / Calibre (Macro Studio Photo) */}
          <Layer
            open={open}
            z={0}
            rest={2}
            highlighted={activeLayer === 3}
            dimmed={activeLayer !== null && activeLayer !== 3}
            layerTag="L3 · CALIBRE MECÁNICO"
          >
            <img
              src={`${basePath}/movement.png`}
              alt={`${model.movement} Mechanical Calibre`}
              draggable={false}
              className="h-full w-full object-contain"
            />
          </Layer>

          {/* LAYER 4: Photorealistic Dial & 3D Hands with Drop Shadow */}
          <Layer
            open={open}
            z={105}
            x={-14}
            y={-14}
            rest={3}
            highlighted={activeLayer === 4}
            dimmed={activeLayer !== null && activeLayer !== 4}
            layerTag="L2 · DIAL & HANDS"
          >
            <img
              src={`${basePath}/dial.png`}
              alt={`${model.name} Dial and Hands`}
              draggable={false}
              className="h-full w-full object-contain"
            />
          </Layer>

          {/* LAYER 5: Photorealistic Bezel & Optical AR Sapphire Crystal Dome */}
          <Layer
            open={open}
            z={215}
            x={-32}
            y={-32}
            rest={4}
            highlighted={activeLayer === 5}
            dimmed={activeLayer !== null && activeLayer !== 5}
            layerTag="L1 · BEZEL & SAPPHIRE AR"
          >
            <img
              src={`${basePath}/bezel.png`}
              alt={`${model.name} Bezel and Sapphire Crystal`}
              draggable={false}
              className="h-full w-full object-contain"
            />
          </Layer>
        </div>
      </div>

      {/* Interactive Hotspots (01 - 05) with OEM vs Generic Price Preview */}
      {model.hotspots.map((h, i) => {
        const isActive = activeLayer === h.layerIdx;
        return (
          <Button variant="ghost"
            key={h.n}
            onMouseEnter={() => setActiveLayer(h.layerIdx)}
            onMouseLeave={() => setActiveLayer(null)}
            onClick={() => onSelect(h.cats, h.label)}
            aria-label={`${h.n} · ${h.label}`}
            className={`group/hs absolute z-20 flex h-auto items-center gap-2.5 p-0 text-left transition-all duration-500 ${
              h.pos
            } ${h.side === "right" ? "flex-row-reverse text-right" : ""} ${
              open ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
            }`}
            style={{ transitionDelay: open ? `${180 + i * 70}ms` : "0ms" }}
          >
            <div
              className={`hidden rounded-lg border px-3.5 py-2 shadow-soft backdrop-blur transition md:block ${
                isActive
                  ? "border-accent bg-primary text-primary-foreground scale-105"
                  : "border-primary/15 bg-card/92 text-foreground hover:border-accent"
              }`}
            >
              <p className="text-xs font-bold leading-tight">{h.label}</p>
              <p
                className={`text-[10px] ${
                  isActive ? "text-primary-foreground/80" : "text-muted-foreground"
                }`}
              >
                {h.sublabel}
              </p>
              <span
                className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                  isActive ? "bg-accent text-accent-foreground" : "bg-secondary text-foreground"
                }`}
              >
                {h.priceHint}
              </span>
            </div>

            <span
              className={`relative grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-black transition ${
                isActive ? "bg-accent text-accent-foreground scale-110" : "bg-primary text-primary-foreground"
              }`}
            >
              <span className="absolute inset-0 rounded-full bg-primary animate-ping-soft" />
              <span className="relative">{h.n}</span>
            </span>
          </Button>
        );
      })}

      {/* Bottom Interactive Controls Bar */}
      <div className="absolute bottom-1 left-0 right-0 z-20 flex flex-wrap justify-center gap-2">
        <Button variant="ghost"
          onClick={() => setPinnedOpen((p) => !p)}
          className={`rounded-full border px-4 py-1.5 text-[11px] font-bold tracking-[0.15em] uppercase backdrop-blur transition ${
            pinnedOpen
              ? "border-accent bg-accent text-accent-foreground shadow-soft"
              : "border-primary/20 bg-card/80 hover:bg-card"
          }`}
        >
          {pinnedOpen ? "Ensamblar Reloj" : open ? "Fijar Despiece 3D" : "Despiezar Reloj"}
        </Button>

        {open && (
          <Button variant="ghost"
            onClick={() => setCameraMode((m) => (m === "iso" ? "side" : "iso"))}
            className="rounded-full border border-primary/20 bg-card/85 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur hover:bg-card"
          >
            Ángulo: {cameraMode === "iso" ? "Isométrico" : "Perfil Lateral"}
          </Button>
        )}
      </div>
    </div>
    <div className="grid grid-cols-1 gap-3 pt-5 md:hidden">
      {model.hotspots.map(h => <Button key={h.n} variant="outline"
        aria-pressed={activeLayer === h.layerIdx}
        onClick={() => { setPinnedOpen(true); setActiveLayer(h.layerIdx); onSelect(h.cats, h.label); }}
        className={`h-auto min-h-24 w-full justify-start gap-3 whitespace-normal p-4 text-left ${activeLayer === h.layerIdx ? "border-accent bg-accent/15" : "bg-card"}`}>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-xs font-black text-primary-foreground">{h.n}</span>
        <span className="min-w-0 flex-1 space-y-1">
          <span className="block text-sm font-bold">{h.label}</span>
          <span className="block text-xs text-muted-foreground">{h.sublabel}</span>
          <span className="inline-block rounded bg-secondary px-2 py-1 text-[10px] font-bold">{h.priceHint}</span>
        </span>
        <ArrowUpRight className="h-4 w-4 shrink-0" />
      </Button>)}
    </div>
    </div>
  );
}

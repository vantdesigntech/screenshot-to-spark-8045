import { useState, type ReactNode } from "react";
import { WATCH_MODELS, type Category, type WatchModelSpec } from "@/lib/parts";

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
  const scale = highlighted && open ? 1.06 : 1;
  return (
    <div
      className={`absolute inset-0 transition-all duration-[850ms] ease-spring preserve-3d ${
        dimmed && open ? "opacity-45" : "opacity-100"
      }`}
      style={{
        transform: open
          ? `translate3d(${x}px, ${y}px, ${z}px) scale(${scale})`
          : `translate3d(0, 0, ${rest}px) scale(1)`,
        filter: open
          ? "drop-shadow(3px 5px 30px rgba(0, 0, 0, 0.22))"
          : undefined,
      }}
    >
      {children}
      {open && layerTag && (
        <span
          className={`pointer-events-none absolute right-0 top-1/2 hidden -translate-y-1/2 border px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.1em] transition-opacity duration-500 sm:inline-block ${
            highlighted
              ? "border-[#e03127] bg-[#e03127] text-white opacity-100"
              : "border-[#111111] bg-[#ffffff] text-[#111111] opacity-90"
          }`}
        >
          {layerTag}
        </span>
      )}
    </div>
  );
}

export function ExplodedWatch({
  selected = [],
  activeCategory = null,
  model = WATCH_MODELS[0],
  onSelect,
  onSelectPart,
}: {
  selected?: Category[];
  activeCategory?: Category | null;
  model?: WatchModelSpec;
  onSelect?: (cats: Category[], label?: string) => void;
  onSelectPart?: (category: Category, queryHint: string) => void;
}) {
  const [hoverOpen, setHoverOpen] = useState(false);
  const [pinnedOpen, setPinnedOpen] = useState(true);
  const [activeLayer, setActiveLayer] = useState<number | null>(null);
  const [selectedHotspot, setSelectedHotspot] = useState<string | null>(null);
  const [cameraMode, setCameraMode] = useState<"iso" | "side">("iso");

  const open = hoverOpen || pinnedOpen;
  const basePath = `/models/${model.id}`;

  const effectiveSelected: Category[] =
    activeCategory && !selected.includes(activeCategory)
      ? [...selected, activeCategory]
      : selected;

  const triggerSelect = (cats: Category[], label: string) => {
    onSelect?.(cats, label);
    if (cats[0]) {
      onSelectPart?.(cats[0], label);
    }
  };

  const cameraTransform = !open
    ? "rotateX(0deg) rotateZ(0deg) scale(1)"
    : cameraMode === "iso"
      ? "rotateX(58deg) rotateZ(-36deg) scale(0.82)"
      : "rotateX(74deg) rotateZ(-14deg) scale(0.80)";

  return (
    <div className="w-full">
      <div
        className="relative mx-auto aspect-square w-full max-w-[540px] overflow-hidden select-none"
        onMouseEnter={() => setHoverOpen(true)}
        onMouseLeave={() => {
          setHoverOpen(false);
          setActiveLayer(null);
        }}
      >
        {/* Subtle Technical Grid Lines */}
        <svg
          viewBox="0 0 400 400"
          className="pointer-events-none absolute inset-0 text-[#111111]/15"
        >
          <circle
            cx="200"
            cy="200"
            r="192"
            fill="none"
            stroke="currentColor"
            strokeDasharray="2 6"
          />
          <circle cx="200" cy="200" r="156" fill="none" stroke="currentColor" />
          <circle
            cx="200"
            cy="200"
            r="120"
            fill="none"
            stroke="currentColor"
            strokeDasharray="1 4"
          />
          <line
            x1="0"
            y1="200"
            x2="400"
            y2="200"
            stroke="currentColor"
            strokeDasharray="3 5"
          />
          <line
            x1="200"
            y1="0"
            x2="200"
            y2="400"
            stroke="currentColor"
            strokeDasharray="3 5"
          />
          <text
            x="200"
            y="18"
            textAnchor="middle"
            fontSize="7"
            fill="currentColor"
            letterSpacing="1.5"
          >
            ESQUEMA DE COMPONENTES · {model.ref}
          </text>
        </svg>

        {/* 3D Photorealistic Stage */}
        <div
          className="absolute inset-[14%] sm:inset-[17%]"
          style={{ perspective: "1500px" }}
        >
          <div
            className="relative h-full w-full transition-transform duration-[900ms] ease-spring preserve-3d"
            style={{ transform: cameraTransform }}
          >
            {open && (
              <div
                className="pointer-events-none absolute left-1/2 top-1/2 h-[440px] w-[1px] -translate-x-1/2 -translate-y-1/2 border-l border-dashed border-[#111111]/30"
                style={{ transform: "rotateX(90deg) translateZ(0px)" }}
              />
            )}

            {/* LAYER 0: Caseback */}
            <Layer
              open={open}
              z={-210}
              x={26}
              y={26}
              highlighted={activeLayer === 0}
              dimmed={activeLayer !== null && activeLayer !== 0}
              layerTag="TAPA TRASERA Y JUNTA"
            >
              <img
                src={`${basePath}/caseback.png`}
                alt={`${model.name} Tapa trasera`}
                draggable={false}
                className="h-full w-full object-contain"
              />
            </Layer>

            {/* LAYER 1 & 2: Middle Case & Bracelets */}
            <Layer
              open={open}
              z={-110}
              x={12}
              y={12}
              rest={1}
              highlighted={activeLayer === 1 || activeLayer === 2}
              dimmed={
                activeLayer !== null && activeLayer !== 1 && activeLayer !== 2
              }
              layerTag="CAJA, CORONA Y BRAZALETE"
            >
              <div
                className="pointer-events-none absolute inset-0 transition-transform duration-[900ms] ease-spring"
                style={{ transform: open ? "translateY(-44px)" : "none" }}
              >
                <img
                  src={`${basePath}/bracelet-top.png`}
                  alt={`${model.name} Brazalete superior`}
                  draggable={false}
                  className="absolute h-[50%] w-[36%] object-fill"
                  style={{ left: "32%", bottom: "83%" }}
                />
              </div>

              <div
                className="pointer-events-none absolute inset-0 transition-transform duration-[900ms] ease-spring"
                style={{ transform: open ? "translateY(44px)" : "none" }}
              >
                <img
                  src={`${basePath}/bracelet-bottom.png`}
                  alt={`${model.name} Brazalete inferior`}
                  draggable={false}
                  className="absolute h-[50%] w-[36%] object-fill"
                  style={{ left: "32%", top: "83%" }}
                />
              </div>

              <img
                src={`${basePath}/midcase.png`}
                alt={`${model.name} Carrura y corona`}
                draggable={false}
                className="relative h-full w-full object-contain"
              />
            </Layer>

            {/* LAYER 3: Mechanical Movement */}
            <Layer
              open={open}
              z={0}
              rest={2}
              highlighted={activeLayer === 3}
              dimmed={activeLayer !== null && activeLayer !== 3}
              layerTag="CALIBRE MECÁNICO"
            >
              <img
                src={`${basePath}/movement.png`}
                alt={`${model.movement} Calibre mecánico`}
                draggable={false}
                className="h-full w-full object-contain"
              />
            </Layer>

            {/* LAYER 4: Dial & Hands */}
            <Layer
              open={open}
              z={105}
              x={-14}
              y={-14}
              rest={3}
              highlighted={activeLayer === 4}
              dimmed={activeLayer !== null && activeLayer !== 4}
              layerTag="ESFERA Y AGUJAS"
            >
              <img
                src={`${basePath}/dial.png`}
                alt={`${model.name} Esfera y agujas`}
                draggable={false}
                className="h-full w-full object-contain"
              />
            </Layer>

            {/* LAYER 5: Bezel & Sapphire Crystal */}
            <Layer
              open={open}
              z={215}
              x={-32}
              y={-32}
              rest={4}
              highlighted={activeLayer === 5}
              dimmed={activeLayer !== null && activeLayer !== 5}
              layerTag="BISEL Y CRISTAL ZAFIRO"
            >
              <img
                src={`${basePath}/bezel.png`}
                alt={`${model.name} Bisel y cristal de zafiro`}
                draggable={false}
                className="h-full w-full object-contain"
              />
            </Layer>
          </div>
        </div>

        {/* Desktop Interactive Floating Hotspots (01 - 05) */}
        {model.hotspots.map((h, i) => {
          const isCatSelected = h.cats.some((c) =>
            effectiveSelected.includes(c)
          );
          const isActive =
            activeLayer === h.layerIdx ||
            selectedHotspot === h.n ||
            isCatSelected;
          return (
            <button
              key={h.n}
              type="button"
              onMouseEnter={() => setActiveLayer(h.layerIdx)}
              onMouseLeave={() => setActiveLayer(null)}
              onClick={() => {
                setSelectedHotspot(h.n);
                setActiveLayer(h.layerIdx);
                triggerSelect(h.cats, h.label);
              }}
              className={`group/hs absolute z-20 hidden items-center gap-2 text-left transition-transform duration-200 active:scale-95 sm:flex ${
                h.pos
              } ${h.side === "right" ? "flex-row-reverse text-right" : ""} ${
                open ? "translate-y-0 opacity-100" : "translate-y-1 opacity-95"
              }`}
              style={{ transitionDelay: open ? `${80 + i * 40}ms` : "0ms" }}
            >
              <div
                className={`border px-3 py-2 transition-colors ${
                  isActive
                    ? "border-2 border-[#e03127] bg-[#ffffff] text-[#111111]"
                    : "border-[#d4d4d8] bg-[#ffffff]/95 text-[#111111] hover:border-[#111111]"
                }`}
              >
                <p
                  style={{ fontFamily: "var(--font-display)" }}
                  className="text-[11px] font-semibold leading-tight text-[#111111]"
                >
                  {h.label}
                </p>
                <p className="text-[10px] text-[#666666]">{h.sublabel}</p>
                <span
                  className={`mt-1 inline-block px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.08em] ${
                    isActive
                      ? "bg-[#e03127] text-[#ffffff]"
                      : "bg-[#f4f4f5] text-[#111111]"
                  }`}
                >
                  {h.priceHint}
                </span>
              </div>

              <span
                className={`relative grid h-8 w-8 shrink-0 place-items-center rounded-full font-mono text-[11px] font-semibold transition-transform ${
                  isActive
                    ? "scale-105 bg-[#e03127] text-white"
                    : "bg-[#111111] text-white"
                }`}
              >
                <span className="relative">{h.n}</span>
              </span>
            </button>
          );
        })}

        {/* Bottom Interactive Controls Bar */}
        <div className="absolute bottom-2 left-1/2 z-20 flex w-max max-w-full -translate-x-1/2 items-center gap-2 px-2 font-mono">
          <button
            type="button"
            onClick={() => setPinnedOpen((p) => !p)}
            className={`px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.08em] transition-colors sm:px-4 sm:py-2 sm:text-[11px] ${
              pinnedOpen
                ? "bg-[#e03127] text-[#ffffff]"
                : "border border-[#111111] bg-[#ffffff] text-[#111111]"
            }`}
          >
            {pinnedOpen ? "CAPAS ACTIVAS ✓" : "SEPARAR CAPAS >"}
          </button>

          {open && (
            <button
              type="button"
              onClick={() =>
                setCameraMode((m) => (m === "iso" ? "side" : "iso"))
              }
              className="border border-[#111111] bg-[#ffffff] px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.08em] text-[#111111] transition-colors hover:bg-[#f4f4f5] sm:px-4 sm:py-2 sm:text-[11px]"
            >
              VISTA : {cameraMode === "iso" ? "ISOMÉTRICA" : "LATERAL"}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Squared Layer Selector Grid (< 640px) so nothing overflows on phones */}
      <div className="mt-4 grid grid-cols-1 gap-2 sm:hidden">
        {model.hotspots.map((h) => {
          const isCatSelected = h.cats.some((c) =>
            effectiveSelected.includes(c)
          );
          const isActive =
            activeLayer === h.layerIdx ||
            selectedHotspot === h.n ||
            isCatSelected;
          return (
            <button
              key={h.n}
              type="button"
              onClick={() => {
                setSelectedHotspot(h.n);
                setActiveLayer(h.layerIdx);
                triggerSelect(h.cats, h.label);
              }}
              className={`flex w-full items-center justify-between gap-3 border p-3 text-left transition-colors ${
                isActive
                  ? "border-2 border-[#e03127] bg-[#f4f4f5]"
                  : "border-[#e5e5e5] bg-white"
              }`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={`grid h-7 w-7 shrink-0 place-items-center font-mono text-[11px] font-semibold ${
                    isActive
                      ? "bg-[#e03127] text-white"
                      : "bg-[#111111] text-white"
                  }`}
                >
                  {h.n}
                </span>
                <div className="min-w-0">
                  <p
                    style={{ fontFamily: "var(--font-display)" }}
                    className="truncate text-xs font-semibold text-[#111111]"
                  >
                    {h.label}
                  </p>
                  <p className="truncate text-[11px] text-[#666666]">
                    {h.sublabel}
                  </p>
                </div>
              </div>
              <span className="shrink-0 bg-[#f4f4f5] px-2 py-1 font-mono text-[10px] font-semibold text-[#e03127]">
                {h.priceHint}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

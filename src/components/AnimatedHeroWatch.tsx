import { useEffect, useState } from "react";

interface AnimatedHeroWatchProps {
  onSelectPart?: (searchTerm: string) => void;
}

/**
 * Generates an SVG path for an involute-style mechanical watch gear wheel
 */
function buildGearPath(
  cx: number,
  cy: number,
  teeth: number,
  outerR: number,
  innerR: number
): string {
  const step = (Math.PI * 2) / teeth;
  const points: string[] = [];
  for (let i = 0; i < teeth; i++) {
    const a0 = i * step;
    const a1 = a0 + step * 0.18;
    const a2 = a0 + step * 0.45;
    const a3 = a0 + step * 0.63;

    const p0x = cx + Math.cos(a0) * innerR;
    const p0y = cy + Math.sin(a0) * innerR;
    const p1x = cx + Math.cos(a1) * outerR;
    const p1y = cy + Math.sin(a1) * outerR;
    const p2x = cx + Math.cos(a2) * outerR;
    const p2y = cy + Math.sin(a2) * outerR;
    const p3x = cx + Math.cos(a3) * innerR;
    const p3y = cy + Math.sin(a3) * innerR;

    if (i === 0) {
      points.push(`M ${p0x.toFixed(2)} ${p0y.toFixed(2)}`);
    } else {
      points.push(`L ${p0x.toFixed(2)} ${p0y.toFixed(2)}`);
    }
    points.push(`L ${p1x.toFixed(2)} ${p1y.toFixed(2)}`);
    points.push(`L ${p2x.toFixed(2)} ${p2y.toFixed(2)}`);
    points.push(`L ${p3x.toFixed(2)} ${p3y.toFixed(2)}`);
  }
  points.push("Z");
  return points.join(" ");
}

const PART_CALLOUTS = [
  {
    id: "crystal",
    label: "Cristal de Zafiro AR",
    spec: "Doble Domo · Antirreflejos",
    query: "Cristal Zafiro",
    side: "left" as const,
    lineStart: { x: 240, y: 120 },
    lineElbow: { x: 325, y: 120 },
    target: { x: 420, y: 185 },
  },
  {
    id: "caliber",
    label: "Calibre Mecánico",
    spec: "NH35 / ETA 2824 · 28.800 vph",
    query: "Seiko NH35",
    side: "left" as const,
    lineStart: { x: 240, y: 230 },
    lineElbow: { x: 310, y: 230 },
    target: { x: 438, y: 255 },
  },
  {
    id: "bracelet",
    label: "Brazalete & Asas 904L",
    spec: "Acero Macizo · 20 / 22 mm",
    query: "Brazalete Oyster 20mm",
    side: "left" as const,
    lineStart: { x: 240, y: 340 },
    lineElbow: { x: 295, y: 340 },
    target: { x: 325, y: 390 },
  },
  {
    id: "bezel",
    label: "Bisel Cerámico",
    spec: "Inserto Taquimétrico / Diver",
    query: "Bisel",
    side: "right" as const,
    lineStart: { x: 760, y: 120 },
    lineElbow: { x: 675, y: 120 },
    target: { x: 625, y: 155 },
  },
  {
    id: "hands",
    label: "Agujas & Esfera",
    spec: "Super-LumiNova BGW9 / C3",
    query: "Agujas",
    side: "right" as const,
    lineStart: { x: 760, y: 230 },
    lineElbow: { x: 690, y: 230 },
    target: { x: 535, y: 245 },
  },
  {
    id: "crown",
    label: "Corona & Juntas Viton",
    spec: "Rosca Triple · 200m WR",
    query: "Corona",
    side: "right" as const,
    lineStart: { x: 760, y: 340 },
    lineElbow: { x: 725, y: 340 },
    target: { x: 735, y: 305 },
  },
];

export function AnimatedHeroWatch({ onSelectPart }: AnimatedHeroWatchProps) {
  const [angles, setAngles] = useState({
    hour: 305,
    minute: 60,
    second: 180,
  });
  const [activeCallout, setActiveCallout] = useState<string | null>(null);
  const [ipTimeZone, setIpTimeZone] = useState<string>(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Madrid";
    } catch {
      return "Europe/Madrid";
    }
  });
  const [ipLocationLabel, setIpLocationLabel] = useState<string>("");
  const [ipUtcOffset, setIpUtcOffset] = useState<string>("");
  const [digitalClock, setDigitalClock] = useState<string>("");
  const [tzSource, setTzSource] = useState<"IP" | "LOCAL">("LOCAL");

  // Detect user's timezone via IP geolocation (with multi-provider fallback)
  useEffect(() => {
    let cancelled = false;

    async function detectTimeZoneFromIp() {
      // Provider 1: ipwho.is (fast, CORS-enabled, no key required)
      try {
        const res = await fetch("https://ipwho.is/", {
          signal: AbortSignal.timeout(4500),
        });
        if (res.ok) {
          const data = await res.json();
          const tz = data?.timezone?.id;
          if (tz && typeof tz === "string" && !cancelled) {
            setIpTimeZone(tz);
            const city = [data.city, data.country_code].filter(Boolean).join(", ");
            setIpLocationLabel(city || tz);
            if (data?.timezone?.utc) {
              setIpUtcOffset(`UTC${data.timezone.utc}`);
            }
            setTzSource("IP");
            return;
          }
        }
      } catch {
        // Fallback to Provider 2
      }

      // Provider 2: ipapi.co/json/
      try {
        const res = await fetch("https://ipapi.co/json/", {
          signal: AbortSignal.timeout(4500),
        });
        if (res.ok) {
          const data = await res.json();
          const tz = data?.timezone;
          if (tz && typeof tz === "string" && !cancelled) {
            setIpTimeZone(tz);
            const city = [data.city, data.country_code].filter(Boolean).join(", ");
            setIpLocationLabel(city || tz);
            if (data?.utc_offset) {
              setIpUtcOffset(`UTC${data.utc_offset}`);
            }
            setTzSource("IP");
            return;
          }
        }
      } catch {
        // Fallback to Provider 3
      }

      // Provider 3: worldtimeapi.org/api/ip
      try {
        const res = await fetch("https://worldtimeapi.org/api/ip", {
          signal: AbortSignal.timeout(4500),
        });
        if (res.ok) {
          const data = await res.json();
          const tz = data?.timezone;
          if (tz && typeof tz === "string" && !cancelled) {
            setIpTimeZone(tz);
            setIpLocationLabel(tz.replace(/_/g, " "));
            if (data?.utc_offset) {
              setIpUtcOffset(`UTC${data.utc_offset}`);
            }
            setTzSource("IP");
          }
        }
      } catch {
        // Keep browser Intl timezone fallback
      }
    }

    detectTimeZoneFromIp();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let rafId: number;
    let formatter: Intl.DateTimeFormat | null = null;
    try {
      formatter = new Intl.DateTimeFormat("en-GB", {
        timeZone: ipTimeZone,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
    } catch {
      formatter = null;
    }

    let lastDigitalSecond = -1;

    const updateClock = () => {
      const now = new Date();
      const ms = now.getMilliseconds();
      let hours24 = now.getHours();
      let minutes = now.getMinutes();
      let seconds = now.getSeconds();

      if (formatter) {
        try {
          const parts = formatter.formatToParts(now);
          for (const p of parts) {
            if (p.type === "hour") {
              const parsedH = parseInt(p.value, 10);
              if (!Number.isNaN(parsedH)) hours24 = parsedH === 24 ? 0 : parsedH;
            } else if (p.type === "minute") {
              const parsedM = parseInt(p.value, 10);
              if (!Number.isNaN(parsedM)) minutes = parsedM;
            } else if (p.type === "second") {
              const parsedS = parseInt(p.value, 10);
              if (!Number.isNaN(parsedS)) seconds = parsedS;
            }
          }
        } catch {
          // Use local fallback
        }
      }

      const s = seconds + ms / 1000;
      const m = minutes + s / 60;
      const h = (hours24 % 12) + m / 60;

      setAngles({
        hour: h * 30,
        minute: m * 6,
        second: s * 6,
      });

      if (seconds !== lastDigitalSecond) {
        lastDigitalSecond = seconds;
        const hh = String(hours24).padStart(2, "0");
        const mm = String(minutes).padStart(2, "0");
        const ss = String(seconds).padStart(2, "0");
        setDigitalClock(`${hh}:${mm}:${ss}`);
      }

      rafId = requestAnimationFrame(updateClock);
    };
    rafId = requestAnimationFrame(updateClock);
    return () => cancelAnimationFrame(rafId);
  }, [ipTimeZone]);

  // Watch center is anchored low at (500, 315) so the lower case & sculpted curved lugs
  // bleed seamlessly into the bottom architectural frame (like 2.webp & 4.webp right screen),
  // eliminating any floating "cut-out PNG" appearance.
  const cx = 500;
  const cy = 315;

  const barrelGearPath = buildGearPath(cx - 58, cy - 62, 30, 68, 60);
  const thirdWheelPath = buildGearPath(cx + 66, cy - 58, 22, 46, 40);
  const fourthWheelPath = buildGearPath(cx + 58, cy + 56, 24, 50, 44);
  const escapeWheelPath = buildGearPath(cx - 54, cy + 64, 15, 30, 24);
  const minuteWorkGearPath = buildGearPath(cx - 84, cy - 4, 18, 36, 30);
  const centerHourWheelPath = buildGearPath(cx, cy, 26, 56, 49);
  const centerMinuteWheelPath = buildGearPath(cx, cy, 20, 38, 32);

  return (
    <div className="relative mx-auto w-full select-none">
      {/* Integrated Architectural Horological Stage (Flush bottom crop, zero floating PNG look) */}
      <div className="relative overflow-hidden border border-[#e5e5e5] bg-gradient-to-b from-white via-[#fafafa] to-[#f2f2f5]">
        {/* Top Technical Telemetry Bar inside the stage */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e5e5e5] bg-white/90 px-4 py-2.5 text-[11px] text-[#71717a] sm:px-6">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-[#e03127]" />
            <span className="font-semibold text-[#111111]">
              ESQUEMA INTERACTIVO DE COMPONENTES
            </span>
            <span className="hidden sm:inline text-[#a1a1aa]">
              · Haz clic en cualquier pieza del reloj para buscar su recambio
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] font-medium text-[#52525b]">
            {digitalClock && (
              <span
                title={`Hora sincronizada por ${tzSource === "IP" ? "Geolocalización IP" : "Zona Horaria Local"}: ${ipTimeZone}`}
                className="inline-flex items-center gap-1.5 border border-[#e5e5e5] bg-[#f4f4f5] px-2 py-0.5 text-[#111111]"
              >
                <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-600" />
                <span className="font-bold">{digitalClock}</span>
                <span className="text-[#71717a]">
                  · {ipLocationLabel || ipTimeZone}
                  {ipUtcOffset ? ` (${ipUtcOffset})` : ""}
                </span>
                <span className="bg-[#111111] px-1 py-0.2 text-[9px] text-white">
                  {tzSource === "IP" ? "SYNC IP" : "ZONA LOCAL"}
                </span>
              </span>
            )}
            <span className="hidden md:inline">
              CALIBRE CR-01 · 28.800 A/H
            </span>
          </div>
        </div>

        {/* Desktop Interactive 1-Click Callout Buttons Overlaid on Left & Right */}
        <div className="relative mx-auto max-w-[1140px]">
          {/* Left Callout Column (Desktop) */}
          <div className="pointer-events-none absolute inset-y-0 left-4 z-20 hidden w-[230px] flex-col justify-around py-8 lg:flex">
            {PART_CALLOUTS.filter((c) => c.side === "left").map((item) => {
              const isActive = activeCallout === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onMouseEnter={() => setActiveCallout(item.id)}
                  onMouseLeave={() => setActiveCallout(null)}
                  onClick={() => onSelectPart?.(item.query)}
                  className={`pointer-events-auto group flex flex-col border bg-white/95 p-3 text-left transition-all ${
                    isActive
                      ? "border-[#e03127] shadow-md -translate-y-0.5"
                      : "border-[#e5e5e5] hover:border-[#111111]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#111111] group-hover:text-[#e03127]">
                      {item.label}
                    </span>
                    <span className="bg-[#f4f4f5] px-1.5 py-0.5 text-[10px] font-semibold text-[#e03127]">
                      1 CLIC &gt;
                    </span>
                  </div>
                  <span className="mt-0.5 text-[11px] text-[#71717a]">
                    {item.spec}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Callout Column (Desktop) */}
          <div className="pointer-events-none absolute inset-y-0 right-4 z-20 hidden w-[230px] flex-col justify-around py-8 lg:flex">
            {PART_CALLOUTS.filter((c) => c.side === "right").map((item) => {
              const isActive = activeCallout === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onMouseEnter={() => setActiveCallout(item.id)}
                  onMouseLeave={() => setActiveCallout(null)}
                  onClick={() => onSelectPart?.(item.query)}
                  className={`pointer-events-auto group flex flex-col border bg-white/95 p-3 text-left transition-all ${
                    isActive
                      ? "border-[#e03127] shadow-md -translate-y-0.5"
                      : "border-[#e5e5e5] hover:border-[#111111]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#111111] group-hover:text-[#e03127]">
                      {item.label}
                    </span>
                    <span className="bg-[#f4f4f5] px-1.5 py-0.5 text-[10px] font-semibold text-[#e03127]">
                      1 CLIC &gt;
                    </span>
                  </div>
                  <span className="mt-0.5 text-[11px] text-[#71717a]">
                    {item.spec}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Main Architectural Macro Watch SVG (Bleeds flush into the bottom border) */}
          <svg
            viewBox="0 0 1000 440"
            className="block h-auto w-full"
            role="img"
            aria-label="Macro arquitectura horológica Cronora con calibre mecánico en movimiento y selección de recambios en un clic"
          >
            <defs>
              {/* Studio ambient vignette */}
              <radialGradient id="cr-studio-glow" cx="50%" cy="68%" r="55%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="60%" stopColor="#f8f8fa" />
                <stop offset="100%" stopColor="#ededf2" />
              </radialGradient>

              {/* Ambient Ground Shadow at the bottom edge */}
              <radialGradient id="cr-case-ambient" cx="50%" cy="72%" r="36%">
                <stop offset="0%" stopColor="rgba(17,17,17,0.22)" />
                <stop offset="70%" stopColor="rgba(17,17,17,0.06)" />
                <stop offset="100%" stopColor="rgba(17,17,17,0)" />
              </radialGradient>

              {/* Multi-stop 3D Brushed 904L Steel Case */}
              <linearGradient
                id="cr-steel-case"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="85%"
              >
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="18%" stopColor="#e4e4e7" />
                <stop offset="40%" stopColor="#71717a" />
                <stop offset="58%" stopColor="#f4f4f6" />
                <stop offset="82%" stopColor="#3f3f46" />
                <stop offset="100%" stopColor="#18181b" />
              </linearGradient>

              {/* Sculpted Curved Lug Metallic Shading */}
              <linearGradient
                id="cr-lug-left"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#27272a" />
                <stop offset="45%" stopColor="#a1a1aa" />
                <stop offset="80%" stopColor="#f4f4f5" />
                <stop offset="100%" stopColor="#52525b" />
              </linearGradient>

              <linearGradient
                id="cr-lug-right"
                x1="100%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#f4f4f5" />
                <stop offset="45%" stopColor="#a1a1aa" />
                <stop offset="85%" stopColor="#27272a" />
                <stop offset="100%" stopColor="#18181b" />
              </linearGradient>

              {/* Ceramic Brushed Tachymeter Bezel */}
              <linearGradient
                id="cr-bezel-dark"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#3f3f46" />
                <stop offset="30%" stopColor="#18181b" />
                <stop offset="65%" stopColor="#27272a" />
                <stop offset="100%" stopColor="#09090b" />
              </linearGradient>

              <linearGradient
                id="cr-steel-wheel"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="45%" stopColor="#d4d4d8" />
                <stop offset="80%" stopColor="#71717a" />
                <stop offset="100%" stopColor="#f4f4f5" />
              </linearGradient>

              <linearGradient
                id="cr-rhodium-wheel"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#d4d4d8" />
                <stop offset="50%" stopColor="#52525b" />
                <stop offset="100%" stopColor="#18181b" />
              </linearGradient>

              <linearGradient
                id="cr-bridge-metal"
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#f4f4f5" />
                <stop offset="48%" stopColor="#71717a" />
                <stop offset="100%" stopColor="#18181b" />
              </linearGradient>

              <radialGradient id="cr-dial-cavity" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#27272a" />
                <stop offset="65%" stopColor="#121215" />
                <stop offset="100%" stopColor="#050507" />
              </radialGradient>

              <radialGradient id="cr-sapphire-glare" cx="32%" cy="22%" r="65%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.28)" />
                <stop offset="38%" stopColor="rgba(186,230,253,0.08)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
              </radialGradient>
            </defs>

            {/* 0. STUDIO ARCHITECTURAL CANVAS & SWISS CAD TELEMETRY RINGS */}
            <rect width="1000" height="440" fill="url(#cr-studio-glow)" />

            {/* Subtle Architectural Blueprint Grid */}
            <g stroke="#e4e4e7" strokeWidth="1" opacity="0.7">
              <line x1="0" y1="110" x2="1000" y2="110" strokeDasharray="3 6" />
              <line x1="0" y1="220" x2="1000" y2="220" strokeDasharray="3 6" />
              <line x1="0" y1="330" x2="1000" y2="330" strokeDasharray="3 6" />
              <line x1="500" y1="0" x2="500" y2="440" strokeDasharray="3 6" />
              <circle
                cx={cx}
                cy={cy}
                r="292"
                fill="none"
                stroke="#d4d4d8"
                strokeDasharray="4 6"
              />
              <circle cx={cx} cy={cy} r="265" fill="none" stroke="#e4e4e7" />
            </g>

            {/* Soft Studio Contact Shadow behind the macro watch case */}
            <ellipse cx={cx} cy={cy + 15} rx="310" ry="250" fill="url(#cr-case-ambient)" />

            {/* ============================================================
                1. SCULPTED CURVED CASE SHOULDERS & INTEGRATED LUGS
                   (Sweeping down into the bottom frame edge like 2.webp / 4.webp)
               ============================================================ */}
            {/* Left sweeping sculpted lug shoulder bleeding past y=440 */}
            <path
              d="M 272 280 C 268 350, 232 405, 195 455 L 340 455 L 340 360 Z"
              fill="url(#cr-lug-left)"
              stroke="#27272a"
              strokeWidth="1.5"
            />
            {/* Right sweeping sculpted lug shoulder bleeding past y=440 */}
            <path
              d="M 728 280 C 732 350, 768 405, 805 455 L 660 455 L 660 360 Z"
              fill="url(#cr-lug-right)"
              stroke="#27272a"
              strokeWidth="1.5"
            />

            {/* Top sculpted case hood / integrated bezel shoulder */}
            <path
              d="M 335 150 C 375 68, 625 68, 665 150 Z"
              fill="url(#cr-steel-case)"
              stroke="#3f3f46"
              strokeWidth="1.5"
            />

            {/* ============================================================
                2. RIGHT-SIDE SCREW-DOWN PUSHERS & FLUTED CROWN
               ============================================================ */}
            {/* Upper Chronograph Pusher (2 o'clock) */}
            <g transform={`rotate(-25 ${cx} ${cy})`}>
              <rect
                x={cx + 220}
                y={cy - 20}
                width="30"
                height="40"
                fill="url(#cr-steel-case)"
                stroke="#27272a"
                strokeWidth="1.4"
              />
              <rect
                x={cx + 245}
                y={cy - 25}
                width="15"
                height="50"
                fill="url(#cr-bezel-dark)"
                stroke="#18181b"
                strokeWidth="1.2"
              />
            </g>

            {/* Central Crown Guards + Screw-Down Fluted Crown */}
            <path
              d={`M ${cx + 214} ${cy - 52} L ${cx + 244} ${cy - 34} L ${cx + 244} ${cy + 34} L ${cx + 214} ${cy + 52} Z`}
              fill="url(#cr-steel-case)"
              stroke="#27272a"
              strokeWidth="1.4"
            />
            <rect
              x={cx + 238}
              y={cy - 32}
              width="28"
              height="64"
              fill="url(#cr-steel-wheel)"
              stroke="#18181b"
              strokeWidth="1.5"
            />
            {[-24, -16, -8, 0, 8, 16, 24].map((dy) => (
              <line
                key={dy}
                x1={cx + 240}
                y1={cy + dy}
                x2={cx + 264}
                y2={cy + dy}
                stroke="#27272a"
                strokeWidth="2"
              />
            ))}
            {/* Red anodized crown gasket ring */}
            <line
              x1={cx + 238}
              y1={cy - 31}
              x2={cx + 238}
              y2={cy + 31}
              stroke="#e03127"
              strokeWidth="2.5"
            />

            {/* ============================================================
                3. MACRO 904L STEEL CASE & CERAMIC TACHYMETER BEZEL
               ============================================================ */}
            {/* Outer 3D Brushed Steel Case */}
            <circle
              cx={cx}
              cy={cy}
              r="236"
              fill="url(#cr-steel-case)"
              stroke="#18181b"
              strokeWidth="2.2"
            />
            {/* Specular chamfer highlight */}
            <circle
              cx={cx}
              cy={cy}
              r="224"
              fill="none"
              stroke="#ffffff"
              strokeWidth="1.4"
              opacity="0.75"
            />

            {/* Ceramic Tachymeter Bezel */}
            <circle
              cx={cx}
              cy={cy}
              r="216"
              fill="url(#cr-bezel-dark)"
              stroke="#09090b"
              strokeWidth="2.5"
            />

            {/* Tachymeter Bezel Engravings */}
            {[
              { angle: -62, text: "TACHYMETER" },
              { angle: -24, text: "400" },
              { angle: 0, text: "350" },
              { angle: 26, text: "300" },
              { angle: 54, text: "240" },
              { angle: 82, text: "200" },
              { angle: -86, text: "70" },
            ].map((mark) => {
              const rad = ((mark.angle - 90) * Math.PI) / 180;
              const tx = cx + Math.cos(rad) * 197;
              const ty = cy + Math.sin(rad) * 197;
              return (
                <text
                  key={mark.text}
                  x={tx}
                  y={ty}
                  textAnchor="middle"
                  dominantBaseline="central"
                  transform={`rotate(${mark.angle} ${tx} ${ty})`}
                  fill="#e4e4e7"
                  fontSize="10"
                  fontFamily="Plus Jakarta Sans, Inter, sans-serif"
                  fontWeight="700"
                  letterSpacing="1.6"
                >
                  {mark.text}
                </text>
              );
            })}

            {/* Inner Rehaut / Dial Cavity */}
            <circle
              cx={cx}
              cy={cy}
              r="178"
              fill="url(#cr-dial-cavity)"
              stroke="#71717a"
              strokeWidth="2.2"
            />

            {/* 60 Minute/Second Precision Chapter Ring */}
            {Array.from({ length: 60 }).map((_, idx) => {
              const angle = (idx * 6 * Math.PI) / 180;
              const isMajor = idx % 5 === 0;
              const r1 = isMajor ? 160 : 168;
              const r2 = 175;
              const x1 = cx + Math.cos(angle) * r1;
              const y1 = cy + Math.sin(angle) * r1;
              const x2 = cx + Math.cos(angle) * r2;
              const y2 = cy + Math.sin(angle) * r2;
              return (
                <line
                  key={idx}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={isMajor ? "#ffffff" : "#71717a"}
                  strokeWidth={isMajor ? "2.5" : "1.1"}
                />
              );
            })}

            {/* ============================================================
                4. ANIMATED SKELETON GEAR TRAIN (ALL WHEELS ROTATING)
               ============================================================ */}
            <circle
              cx={cx}
              cy={cy}
              r="142"
              fill="none"
              stroke="#3f3f46"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
            <circle
              cx={cx}
              cy={cy}
              r="96"
              fill="none"
              stroke="#3f3f46"
              strokeWidth="1"
            />

            {/* GEAR 1: Mainspring Barrel Wheel (Upper-Left, Slow CW) */}
            <g className="animate-gear-slow-cw">
              <path
                d={barrelGearPath}
                fill="url(#cr-steel-wheel)"
                stroke="#27272a"
                strokeWidth="1"
              />
              <circle cx={cx - 58} cy={cy - 62} r="45" fill="#18181b" />
              {[0, 60, 120, 180, 240, 300].map((deg) => (
                <line
                  key={deg}
                  x1={cx - 58}
                  y1={cy - 62}
                  x2={cx - 58 + Math.cos((deg * Math.PI) / 180) * 45}
                  y2={cy - 62 + Math.sin((deg * Math.PI) / 180) * 45}
                  stroke="#d4d4d8"
                  strokeWidth="5"
                />
              ))}
              <circle
                cx={cx - 58}
                cy={cy - 62}
                r="26"
                fill="none"
                stroke="#71717a"
                strokeWidth="2.2"
                strokeDasharray="10 4"
              />
              <circle cx={cx - 58} cy={cy - 62} r="12" fill="#e4e4e7" />
              <circle cx={cx - 58} cy={cy - 62} r="5.5" fill="#e03127" />
            </g>

            {/* GEAR 2: Third Wheel (Upper-Right, Medium CCW) */}
            <g className="animate-gear-med-ccw">
              <path
                d={thirdWheelPath}
                fill="url(#cr-rhodium-wheel)"
                stroke="#e4e4e7"
                strokeWidth="1"
              />
              <circle cx={cx + 66} cy={cy - 58} r="28" fill="#18181b" />
              {[0, 72, 144, 216, 288].map((deg) => (
                <line
                  key={deg}
                  x1={cx + 66}
                  y1={cy - 58}
                  x2={cx + 66 + Math.cos((deg * Math.PI) / 180) * 28}
                  y2={cy - 58 + Math.sin((deg * Math.PI) / 180) * 28}
                  stroke="#a1a1aa"
                  strokeWidth="4"
                />
              ))}
              <circle cx={cx + 66} cy={cy - 58} r="9" fill="#d4d4d8" />
              <circle cx={cx + 66} cy={cy - 58} r="4" fill="#e03127" />
            </g>

            {/* GEAR 3: Fourth Wheel (Lower-Right, Fast CW) */}
            <g className="animate-gear-fast-cw">
              <path
                d={fourthWheelPath}
                fill="url(#cr-steel-wheel)"
                stroke="#27272a"
                strokeWidth="1"
              />
              <circle cx={cx + 58} cy={cy + 56} r="32" fill="#18181b" />
              {[0, 60, 120, 180, 240, 300].map((deg) => (
                <line
                  key={deg}
                  x1={cx + 58}
                  y1={cy + 56}
                  x2={cx + 58 + Math.cos((deg * Math.PI) / 180) * 32}
                  y2={cy + 56 + Math.sin((deg * Math.PI) / 180) * 32}
                  stroke="#e4e4e7"
                  strokeWidth="3.8"
                />
              ))}
              <circle cx={cx + 58} cy={cy + 56} r="9" fill="#71717a" />
              <circle cx={cx + 58} cy={cy + 56} r="4" fill="#e03127" />
            </g>

            {/* GEAR 4: Escape Wheel (Lower-Left, Stepping CCW) */}
            <g className="animate-gear-escape-ccw">
              <path
                d={escapeWheelPath}
                fill="url(#cr-steel-wheel)"
                stroke="#52525b"
                strokeWidth="1"
              />
              <circle cx={cx - 54} cy={cy + 64} r="15" fill="#18181b" />
              <circle cx={cx - 54} cy={cy + 64} r="5" fill="#e03127" />
            </g>

            {/* GEAR 5: Oscillating Balance Wheel (28,800 vph) */}
            <g className="animate-balance-wheel">
              <circle
                cx={cx}
                cy={cy + 98}
                r="34"
                fill="none"
                stroke="url(#cr-steel-wheel)"
                strokeWidth="5"
              />
              <line
                x1={cx - 34}
                y1={cy + 98}
                x2={cx + 34}
                y2={cy + 98}
                stroke="#e4e4e7"
                strokeWidth="3.2"
              />
              <line
                x1={cx}
                y1={cy + 64}
                x2={cx}
                y2={cy + 132}
                stroke="#e4e4e7"
                strokeWidth="3.2"
              />
              <circle
                cx={cx}
                cy={cy + 98}
                r="17"
                fill="none"
                stroke="#a1a1aa"
                strokeWidth="1.4"
                strokeDasharray="6 3"
              />
              <circle cx={cx} cy={cy + 98} r="5.5" fill="#e03127" />
            </g>

            {/* GEAR 6: Motion-Works Minute Wheel */}
            <g className="animate-gear-med-ccw">
              <path
                d={minuteWorkGearPath}
                fill="url(#cr-rhodium-wheel)"
                stroke="#d4d4d8"
                strokeWidth="1"
              />
              <circle cx={cx - 84} cy={cy - 4} r="18" fill="#18181b" />
              <circle cx={cx - 84} cy={cy - 4} r="5" fill="#e03127" />
            </g>

            {/* Coaxial Center Wheels */}
            <g className="animate-gear-slow-cw">
              <path
                d={centerHourWheelPath}
                fill="url(#cr-steel-wheel)"
                stroke="#27272a"
                strokeWidth="1"
              />
              <circle cx={cx} cy={cy} r="35" fill="#18181b" />
            </g>

            <g className="animate-gear-fast-cw">
              <path
                d={centerMinuteWheelPath}
                fill="url(#cr-rhodium-wheel)"
                stroke="#f4f4f5"
                strokeWidth="1"
              />
              <circle cx={cx} cy={cy} r="18" fill="#18181b" />
            </g>

            {/* ============================================================
                5. ARCHITECTURAL SKELETON BRIDGES & SUBDIALS
               ============================================================ */}
            <path
              d={`M ${cx - 126} ${cy - 116} L ${cx - 96} ${cy - 130} L ${cx} ${cy - 20} L ${cx + 96} ${cy - 130} L ${cx + 126} ${cy - 116} L ${cx + 20} ${cy} L ${cx + 126} ${cy + 116} L ${cx + 96} ${cy + 130} L ${cx} ${cy + 20} L ${cx - 96} ${cy + 130} L ${cx - 126} ${cy + 116} L ${cx - 20} ${cy} Z`}
              fill="url(#cr-bridge-metal)"
              fillOpacity="0.84"
              stroke="#e4e4e7"
              strokeWidth="1.1"
            />

            {/* Subdial Rings (9 & 3 o'clock) */}
            <circle
              cx={cx - 102}
              cy={cy}
              r="40"
              fill="rgba(24,24,27,0.58)"
              stroke="#d4d4d8"
              strokeWidth="1.6"
            />
            <circle
              cx={cx + 102}
              cy={cy}
              r="40"
              fill="rgba(24,24,27,0.58)"
              stroke="#d4d4d8"
              strokeWidth="1.6"
            />

            {/* Top Brand Plate at 12 o'clock */}
            <rect
              x={cx - 64}
              y={cy - 136}
              width="128"
              height="25"
              fill="#18181b"
              stroke="#a1a1aa"
              strokeWidth="1"
            />
            <text
              x={cx}
              y={cy - 120}
              textAnchor="middle"
              fill="#ffffff"
              fontSize="11"
              fontFamily="Orbitron, Share Tech Mono, sans-serif"
              fontWeight="700"
              letterSpacing="3.5"
            >
              CRONORA
            </text>

            {/* Applied Luminous Hour Indices */}
            {Array.from({ length: 12 }).map((_, idx) => {
              const angle = ((idx * 30 - 90) * Math.PI) / 180;
              const x1 = cx + Math.cos(angle) * 144;
              const y1 = cy + Math.sin(angle) * 144;
              const x2 = cx + Math.cos(angle) * 160;
              const y2 = cy + Math.sin(angle) * 160;
              return (
                <line
                  key={idx}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#ffffff"
                  strokeWidth="5"
                  strokeLinecap="butt"
                />
              );
            })}

            {/* ============================================================
                6. MOVING SKELETON HANDS
               ============================================================ */}
            {/* Hour Hand */}
            <g transform={`rotate(${angles.hour} ${cx} ${cy})`}>
              <path
                d={`M ${cx - 8} ${cy + 22} L ${cx - 5.5} ${cy - 102} L ${cx} ${cy - 118} L ${cx + 5.5} ${cy - 102} L ${cx + 8} ${cy + 22} Z`}
                fill="#f4f4f5"
                stroke="#18181b"
                strokeWidth="1.5"
              />
              <rect
                x={cx - 2}
                y={cy - 92}
                width="4"
                height="50"
                fill="#18181b"
              />
              <rect
                x={cx - 1.5}
                y={cy - 110}
                width="3"
                height="14"
                fill="#e03127"
              />
            </g>

            {/* Minute Hand */}
            <g transform={`rotate(${angles.minute} ${cx} ${cy})`}>
              <path
                d={`M ${cx - 6} ${cy + 30} L ${cx - 4} ${cy - 144} L ${cx} ${cy - 160} L ${cx + 4} ${cy - 144} L ${cx + 6} ${cy + 30} Z`}
                fill="#ffffff"
                stroke="#18181b"
                strokeWidth="1.5"
              />
              <rect
                x={cx - 1.5}
                y={cy - 132}
                width="3"
                height="74"
                fill="#18181b"
              />
              <rect
                x={cx - 1.5}
                y={cy - 152}
                width="3"
                height="16"
                fill="#e03127"
              />
            </g>

            {/* Sweeping Red Second Hand */}
            <g transform={`rotate(${angles.second} ${cx} ${cy})`}>
              <line
                x1={cx}
                y1={cy + 42}
                x2={cx}
                y2={cy - 164}
                stroke="#e03127"
                strokeWidth="2.4"
              />
              <circle
                cx={cx}
                cy={cy + 28}
                r="5"
                fill="#18181b"
                stroke="#e03127"
                strokeWidth="2"
              />
              <circle cx={cx} cy={cy - 148} r="3.5" fill="#e03127" />
            </g>

            {/* Center Cap */}
            <circle
              cx={cx}
              cy={cy}
              r="10"
              fill="#d4d4d8"
              stroke="#18181b"
              strokeWidth="2"
            />
            <circle cx={cx} cy={cy} r="4" fill="#e03127" />

            {/* Sapphire Crystal Anti-Reflective Glare */}
            <circle
              cx={cx}
              cy={cy}
              r="177"
              fill="url(#cr-sapphire-glare)"
              pointerEvents="none"
            />

            {/* ============================================================
                7. ARCHITECTURAL LEADER LINES TO WATCH PARTS (Desktop)
               ============================================================ */}
            <g className="hidden lg:block" pointerEvents="none">
              {PART_CALLOUTS.map((item) => {
                const isActive = activeCallout === item.id;
                return (
                  <g key={item.id}>
                    <polyline
                      points={`${item.lineStart.x},${item.lineStart.y} ${item.lineElbow.x},${item.lineElbow.y} ${item.target.x},${item.target.y}`}
                      fill="none"
                      stroke={isActive ? "#e03127" : "#71717a"}
                      strokeWidth={isActive ? "2" : "1.2"}
                      strokeDasharray={isActive ? "none" : "3 3"}
                    />
                    <circle
                      cx={item.target.x}
                      cy={item.target.y}
                      r={isActive ? "6" : "4.5"}
                      fill="#e03127"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        {/* Mobile / Tablet Quick 1-Click Component Selector Strip */}
        <div className="grid grid-cols-2 gap-1.5 border-t border-[#e5e5e5] bg-white p-3 sm:grid-cols-3 lg:hidden">
          {PART_CALLOUTS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectPart?.(item.query)}
              className="flex items-center justify-between border border-[#e5e5e5] bg-[#f4f4f5] px-2.5 py-2 text-left text-[11px] font-semibold text-[#111111] active:bg-[#e03127] active:text-white"
            >
              <span className="truncate">{item.label}</span>
              <span className="ml-1 shrink-0 text-[#e03127]">&gt;</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

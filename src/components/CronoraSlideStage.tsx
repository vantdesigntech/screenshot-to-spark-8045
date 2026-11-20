import { Link } from "@tanstack/react-router";
import gsap from "gsap";
import { Observer } from "gsap/Observer";
import { ArrowDown, ArrowUp, Search, SlidersHorizontal, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type FormEvent, type RefObject } from "react";
import braceletImg from "@/assets/bracelet.jpg";
import crystalImg from "@/assets/crystal.jpg";
import movementImg from "@/assets/movement.jpg";
import strapImg from "@/assets/strap.jpg";
import heroVideo from "@/assets/videos/cronora_watch_hero.mp4.asset.json";
import heroVideo2 from "@/assets/videos/cronora_skeleton_hero.mp4.asset.json";
import heroWatch from "@/assets/watch_movement_hero.jpg.asset.json";
import { HeroVideoLoop } from "@/components/HeroVideoLoop";
import type { Category } from "@/lib/parts";
import { RippleButton } from "@/registry/magicui/ripple-button";

interface AutocompleteSuggestion {
  label: string;
  type: string;
  queryValue: string;
}

interface CronoraSlideStageProps {
  query: string;
  onQueryChange: (next: string) => void;
  onExecuteSearch: (term?: string) => void;
  onFilterSearch: (cats: Category[]) => void;
  onOpenFilters: () => void;
  activeFilterCount: number;
  quickSearches: string[];
  autocompleteSuggestions: AutocompleteSuggestion[];
  searchInputRef: RefObject<HTMLInputElement | null>;
  disabled: boolean;
  focusTrigger: number;
}

const SLIDE_META = [
  { id: "search", shortLabel: "01. Buscador", bg: "#0f1d20" },
  { id: "movements", shortLabel: "02. Calibres", bg: "#16292c" },
  { id: "crystals", shortLabel: "03. Zafiro", bg: "#1b2629" },
  { id: "bracelets", shortLabel: "04. Brazaletes", bg: "#101b1e" },
] as const;

const OVERLAY_IMAGES = [
  { src: movementImg, alt: "Detalle macro de calibre mecánico" },
  { src: crystalImg, alt: "Cristal de zafiro y bisel de precisión" },
  { src: braceletImg, alt: "Brazalete de acero cepillado" },
  { src: strapImg, alt: "Correa artesanal para reloj" },
] as const;

export function CronoraSlideStage({
  query,
  onQueryChange,
  onExecuteSearch,
  onFilterSearch,
  onOpenFilters,
  activeFilterCount,
  quickSearches,
  autocompleteSuggestions,
  searchInputRef,
  disabled,
  focusTrigger,
}: CronoraSlideStageProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<Observer | null>(null);
  const currentIndexRef = useRef(0);
  const animatingRef = useRef(false);
  const gotoSectionRef = useRef<((index: number, direction: number) => void) | null>(null);
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;

  const [activeSlide, setActiveSlide] = useState(0);
  const [searchFocused, setSearchFocused] = useState(false);

  const navigateSlide = useCallback((targetIndex: number, explicitDirection?: number) => {
    const goto = gotoSectionRef.current;
    if (!goto || animatingRef.current) return;
    const total = SLIDE_META.length;
    const wrapped = ((targetIndex % total) + total) % total;
    if (wrapped === currentIndexRef.current) return;
    const direction = explicitDirection ?? (targetIndex > currentIndexRef.current ? 1 : -1);
    goto(wrapped, direction);
  }, []);

  useEffect(() => {
    if (focusTrigger > 0) {
      if (currentIndexRef.current !== 0) {
        navigateSlide(0, -1);
      }
      const id = window.setTimeout(() => searchInputRef.current?.focus(), 220);
      return () => window.clearTimeout(id);
    }
    return undefined;
  }, [focusTrigger, navigateSlide, searchInputRef]);

  useEffect(() => {
    const obs = observerRef.current;
    if (!obs) return;
    if (disabled) obs.disable();
    else obs.enable();
  }, [disabled]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    gsap.registerPlugin(Observer);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      const sections = gsap.utils.toArray<HTMLElement>(".cronora-slide", stage);
      const images = gsap.utils.toArray<HTMLElement>(".cronora-overlay__image", stage);
      const slideImages = gsap.utils.toArray<HTMLElement>(".cronora-slide__img", stage);
      const outerWrappers = gsap.utils.toArray<HTMLElement>(".cronora-slide__outer", stage);
      const innerWrappers = gsap.utils.toArray<HTMLElement>(".cronora-slide__inner", stage);
      const wrap = gsap.utils.wrap(0, sections.length);

      gsap.set(sections, { zIndex: 0, autoAlpha: 0 });
      gsap.set(sections[0] ?? null, { zIndex: 2, autoAlpha: 1 });
      gsap.set(outerWrappers, { xPercent: 100 });
      gsap.set(innerWrappers, { xPercent: -100 });
      gsap.set(outerWrappers[0] ?? null, { xPercent: 0 });
      gsap.set(innerWrappers[0] ?? null, { xPercent: 0 });
      gsap.set(images, { zIndex: 0, autoAlpha: 0 });
      gsap.set(images[0] ?? null, { zIndex: 2, autoAlpha: 1 });

      const gotoSection = (index: number, direction: number) => {
        if (animatingRef.current || disabledRef.current) return;
        const nextIdx = wrap(index);
        const prevIdx = currentIndexRef.current;
        if (nextIdx === prevIdx) return;

        animatingRef.current = true;

        const currentSection = sections[prevIdx];
        const nextSection = sections[nextIdx];
        const heading = currentSection?.querySelector<HTMLElement>(".cronora-slide__heading") ?? null;
        const nextHeading =
          nextSection?.querySelector<HTMLElement>(".cronora-slide__heading") ?? null;

        gsap.set([...sections, ...images], { zIndex: 0, autoAlpha: 0 });
        gsap.set([sections[prevIdx] ?? null, images[nextIdx] ?? null], {
          zIndex: 1,
          autoAlpha: 1,
        });
        gsap.set([sections[nextIdx] ?? null, images[prevIdx] ?? null], {
          zIndex: 2,
          autoAlpha: 1,
        });

        const dur = reducedMotion ? 0.01 : 1;
        const tl = gsap.timeline({
          defaults: { duration: dur, ease: "expo.inOut" },
          onComplete: () => {
            animatingRef.current = false;
          },
        });

        tl.call(() => setActiveSlide(nextIdx), [], reducedMotion ? 0 : 0.32)
          .fromTo(
            outerWrappers[nextIdx] ?? null,
            { xPercent: 100 * direction },
            { xPercent: 0 },
            0,
          )
          .fromTo(
            innerWrappers[nextIdx] ?? null,
            { xPercent: -100 * direction },
            { xPercent: 0 },
            0,
          )
          .to(
            heading,
            {
              scaleX: reducedMotion ? 1 : 1.18,
              xPercent: reducedMotion ? 0 : 30 * direction,
            },
            0,
          )
          .fromTo(
            nextHeading,
            {
              scaleX: reducedMotion ? 1 : 1.18,
              xPercent: reducedMotion ? 0 : -30 * direction,
            },
            { scaleX: 1, xPercent: 0 },
            0,
          )
          .fromTo(
            images[nextIdx] ?? null,
            {
              xPercent: reducedMotion ? 0 : 125 * direction,
              scaleX: reducedMotion ? 1 : 1.5,
              scaleY: reducedMotion ? 1 : 1.3,
            },
            { xPercent: 0, scaleX: 1, scaleY: 1, duration: dur },
            0,
          )
          .fromTo(
            images[prevIdx] ?? null,
            { xPercent: 0, scaleX: 1, scaleY: 1 },
            {
              xPercent: reducedMotion ? 0 : -125 * direction,
              scaleX: reducedMotion ? 1 : 1.5,
              scaleY: reducedMotion ? 1 : 1.3,
            },
            0,
          )
          .fromTo(
            slideImages[nextIdx] ?? null,
            { scale: reducedMotion ? 1 : 2 },
            { scale: 1 },
            0,
          )
          .timeScale(0.8);

        currentIndexRef.current = nextIdx;
      };

      gotoSectionRef.current = gotoSection;

      observerRef.current = Observer.create({
        target: stage,
        type: "wheel,touch,pointer",
        preventDefault: true,
        wheelSpeed: -1,
        ignore: "input, textarea, select, [data-no-slide-scroll='true']",
        onUp: () => {
          if (animatingRef.current || disabledRef.current) return;
          gotoSection(currentIndexRef.current + 1, 1);
        },
        onDown: () => {
          if (animatingRef.current || disabledRef.current) return;
          gotoSection(currentIndexRef.current - 1, -1);
        },
        tolerance: 10,
      });

      if (disabledRef.current) {
        observerRef.current.disable();
      }
    }, stageRef);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabledRef.current || animatingRef.current) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.code === "ArrowUp" || e.code === "ArrowLeft") {
        e.preventDefault();
        gotoSectionRef.current?.(currentIndexRef.current - 1, -1);
        return;
      }

      if (e.code === "ArrowDown" || e.code === "ArrowRight") {
        e.preventDefault();
        gotoSectionRef.current?.(currentIndexRef.current + 1, 1);
        return;
      }

      if (
        (e.code === "Space" || e.code === "Enter") &&
        (!target || target === document.body || target === stageRef.current)
      ) {
        e.preventDefault();
        gotoSectionRef.current?.(currentIndexRef.current + 1, 1);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      observerRef.current?.kill();
      observerRef.current = null;
      gotoSectionRef.current = null;
      ctx.revert();
    };
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSearchFocused(false);
    onExecuteSearch(query);
  };

  return (
    <div
      ref={stageRef}
      className="cronora-stage"
      aria-label="Escaparate interactivo de recambios y calibres Cronora"
    >
      {/* SLIDE 01: HERO VÍDEOS + BUSCADOR */}
      <section className="cronora-slide" aria-hidden={activeSlide !== 0}>
        <div className="cronora-slide__outer">
          <div className="cronora-slide__inner">
            <div
              className="cronora-slide__content"
              style={{ backgroundColor: SLIDE_META[0].bg }}
            >
              <div className="cronora-slide__container">
                <h1 className="cronora-slide__heading">Recambios para tu reloj</h1>

                <figure className="cronora-slide__img-cont">
                  <div className="cronora-slide__img relative h-full w-full">
                    <HeroVideoLoop
                      sources={[heroVideo.url, heroVideo2.url]}
                      poster={heroWatch.url}
                      className="h-full w-full object-cover"
                    />
                    <div aria-hidden className="hero-photo-shade absolute inset-0" />
                  </div>
                </figure>

                <div className="cronora-slide__panel space-y-3 border border-[#f6f2e7]/20 bg-[#0a1315]/88 p-3.5 text-[#f6f2e7] backdrop-blur-md sm:p-5">
                  <p className="text-xs leading-relaxed text-[#f6f2e7]/85 sm:text-sm">
                    Busca cristales de zafiro, calibres automáticos, biseles, agujas, coronas y
                    brazaletes OEM o Aftermarket compatibles con tu referencia exacta.
                  </p>

                  <form onSubmit={handleSubmit} className="relative">
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <div className="relative flex-1">
                        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#f6f2e7]/60" />
                        <input
                          ref={searchInputRef}
                          type="text"
                          value={query}
                          onFocus={() => setSearchFocused(true)}
                          onBlur={() => setTimeout(() => setSearchFocused(false), 180)}
                          onChange={(e) => onQueryChange(e.target.value)}
                          placeholder="Ej: Seiko NH35, Rolex 124300, Tissot PRX, ETA 2824..."
                          className="h-11 w-full border border-[#f6f2e7]/35 bg-[#111d20] pl-10 pr-9 text-sm text-[#f6f2e7] placeholder:text-[#f6f2e7]/50 focus:border-[#f6f2e7] focus:outline-none"
                        />
                        {query && (
                          <button
                            type="button"
                            onClick={() => onQueryChange("")}
                            aria-label="Borrar texto"
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#f6f2e7]/65 hover:text-[#f6f2e7]"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
                        <button
                          type="button"
                          onClick={onOpenFilters}
                          className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap border border-[#f6f2e7]/35 bg-[#18262a] px-4 font-sans text-[11px] font-semibold uppercase tracking-[0.04em] text-[#f6f2e7] transition-colors hover:border-[#f6f2e7]"
                        >
                          <SlidersHorizontal className="h-3.5 w-3.5" />
                          <span>
                            FILTROS{activeFilterCount > 0 ? ` [${activeFilterCount}]` : ""}
                          </span>
                        </button>

                        <RippleButton
                          type="submit"
                          rippleColor="#0a1315"
                          className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-none border border-[#f6f2e7] bg-[#f6f2e7] px-5 font-sans text-[11px] font-semibold uppercase tracking-[0.04em] text-[#0a1315] transition-colors hover:bg-[#efe9da]"
                        >
                          <span>BUSCAR</span>
                          <span aria-hidden>&gt;</span>
                        </RippleButton>
                      </div>
                    </div>

                    {searchFocused && autocompleteSuggestions.length > 0 && (
                      <div
                        data-no-slide-scroll="true"
                        className="absolute left-0 right-0 bottom-full z-50 mb-1 max-h-56 overflow-y-auto border border-[#f6f2e7]/40 bg-[#0a1315] shadow-xl"
                      >
                        {autocompleteSuggestions.map((sug) => (
                          <button
                            key={`${sug.type}-${sug.label}`}
                            type="button"
                            onMouseDown={() => {
                              setSearchFocused(false);
                              onExecuteSearch(sug.queryValue);
                            }}
                            className="flex w-full items-center justify-between gap-2 border-b border-[#f6f2e7]/15 px-3.5 py-2.5 text-left text-xs text-[#f6f2e7] hover:bg-[#16292c] last:border-b-0"
                          >
                            <span className="truncate font-medium">{sug.label}</span>
                            <span className="shrink-0 font-mono text-[10px] uppercase text-[#e9e3d3]">
                              {sug.type} &gt;
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </form>

                  <div className="hidden flex-wrap gap-1.5 sm:flex">
                    {quickSearches.map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => onExecuteSearch(term)}
                        className="inline-flex min-h-8 items-center whitespace-nowrap border border-[#f6f2e7]/25 bg-[#111d20] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.04em] text-[#f6f2e7]/90 transition-colors hover:border-[#f6f2e7] hover:bg-[#18262a]"
                      >
                        {term} &gt;
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SLIDE 02: CALIBRES Y MOVIMIENTOS */}
      <section className="cronora-slide" aria-hidden={activeSlide !== 1}>
        <div className="cronora-slide__outer">
          <div className="cronora-slide__inner">
            <div
              className="cronora-slide__content"
              style={{ backgroundColor: SLIDE_META[1].bg }}
            >
              <div className="cronora-slide__container">
                <h2 className="cronora-slide__heading">Calibres mecánicos</h2>

                <figure className="cronora-slide__img-cont">
                  <img
                    src={movementImg}
                    alt="Movimiento mecánico automático de relojería"
                    className="cronora-slide__img"
                  />
                  <div aria-hidden className="hero-photo-shade absolute inset-0" />
                </figure>

                <div className="cronora-slide__panel space-y-3 border border-[#f6f2e7]/20 bg-[#0a1315]/88 p-4 text-[#f6f2e7] backdrop-blur-md sm:p-5">
                  <p className="text-xs leading-relaxed text-[#f6f2e7]/85 sm:text-sm">
                    Movimientos Seiko NH35A / NH36A, ETA 2824-2, Miyota 9015 y calibres cronógrafo
                    compatibles con tijas y rotores originales.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onExecuteSearch("Seiko NH35")}
                      className="inline-flex min-h-10 items-center gap-2 whitespace-nowrap border border-[#f6f2e7] bg-[#f6f2e7] px-4 font-sans text-[11px] font-semibold uppercase tracking-[0.04em] text-[#0a1315] transition-colors hover:bg-[#efe9da]"
                    >
                      <span>Buscar Seiko NH35</span>
                      <span aria-hidden>&gt;</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onFilterSearch(["movements"])}
                      className="inline-flex min-h-10 items-center gap-2 whitespace-nowrap border border-[#f6f2e7]/35 bg-[#18262a] px-4 font-sans text-[11px] font-semibold uppercase tracking-[0.04em] text-[#f6f2e7] transition-colors hover:border-[#f6f2e7]"
                    >
                      <span>Ver todos los calibres</span>
                      <span aria-hidden>&gt;</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SLIDE 03: CRISTALES DE ZAFIRO Y BISELES */}
      <section className="cronora-slide" aria-hidden={activeSlide !== 2}>
        <div className="cronora-slide__outer">
          <div className="cronora-slide__inner">
            <div
              className="cronora-slide__content"
              style={{ backgroundColor: SLIDE_META[2].bg }}
            >
              <div className="cronora-slide__container">
                <h2 className="cronora-slide__heading">Zafiro y biseles</h2>

                <figure className="cronora-slide__img-cont">
                  <img
                    src={crystalImg}
                    alt="Cristal de zafiro y bisel cerámico de reloj"
                    className="cronora-slide__img"
                  />
                  <div aria-hidden className="hero-photo-shade absolute inset-0" />
                </figure>

                <div className="cronora-slide__panel space-y-3 border border-[#f6f2e7]/20 bg-[#0a1315]/88 p-4 text-[#f6f2e7] backdrop-blur-md sm:p-5">
                  <p className="text-xs leading-relaxed text-[#f6f2e7]/85 sm:text-sm">
                    Cristales de zafiro planos y abombados con tratamiento AR, hesalite y biseles
                    cerámicos de 120 clics con tolerancia exacta.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onExecuteSearch("Cristal Zafiro")}
                      className="inline-flex min-h-10 items-center gap-2 whitespace-nowrap border border-[#f6f2e7] bg-[#f6f2e7] px-4 font-sans text-[11px] font-semibold uppercase tracking-[0.04em] text-[#0a1315] transition-colors hover:bg-[#efe9da]"
                    >
                      <span>Buscar cristal zafiro</span>
                      <span aria-hidden>&gt;</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onFilterSearch(["crystals", "bezels"])}
                      className="inline-flex min-h-10 items-center gap-2 whitespace-nowrap border border-[#f6f2e7]/35 bg-[#18262a] px-4 font-sans text-[11px] font-semibold uppercase tracking-[0.04em] text-[#f6f2e7] transition-colors hover:border-[#f6f2e7]"
                    >
                      <span>Filtrar cristales y biseles</span>
                      <span aria-hidden>&gt;</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SLIDE 04: BRAZALETES Y CORREAS */}
      <section className="cronora-slide" aria-hidden={activeSlide !== 3}>
        <div className="cronora-slide__outer">
          <div className="cronora-slide__inner">
            <div
              className="cronora-slide__content"
              style={{ backgroundColor: SLIDE_META[3].bg }}
            >
              <div className="cronora-slide__container">
                <h2 className="cronora-slide__heading">Brazaletes 20 &amp; 22mm</h2>

                <figure className="cronora-slide__img-cont">
                  <img
                    src={braceletImg}
                    alt="Brazalete Oyster de acero inoxidable 316L y 904L"
                    className="cronora-slide__img"
                  />
                  <div aria-hidden className="hero-photo-shade absolute inset-0" />
                </figure>

                <div className="cronora-slide__panel space-y-3 border border-[#f6f2e7]/20 bg-[#0a1315]/88 p-4 text-[#f6f2e7] backdrop-blur-md sm:p-5">
                  <p className="text-xs leading-relaxed text-[#f6f2e7]/85 sm:text-sm">
                    Armis macizos Oyster y Jubilee con eslabones atornillados, cierres desplegables,
                    caucho FKM y correas de piel para asas de 20mm y 22mm.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onExecuteSearch("Brazalete Oyster 20mm")}
                      className="inline-flex min-h-10 items-center gap-2 whitespace-nowrap border border-[#f6f2e7] bg-[#f6f2e7] px-4 font-sans text-[11px] font-semibold uppercase tracking-[0.04em] text-[#0a1315] transition-colors hover:bg-[#efe9da]"
                    >
                      <span>Buscar brazalete 20mm</span>
                      <span aria-hidden>&gt;</span>
                    </button>
                    <Link
                      to="/chollos"
                      className="inline-flex min-h-10 items-center gap-2 whitespace-nowrap border border-[#f6f2e7]/35 bg-[#18262a] px-4 font-sans text-[11px] font-semibold uppercase tracking-[0.04em] text-[#f6f2e7] transition-colors hover:border-[#f6f2e7]"
                    >
                      <span>Ver radar de chollos</span>
                      <span aria-hidden>&gt;</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PERSISTENT PARALLAX OVERLAY (COUNTER + FLOATING SECONDARY PHOTO) */}
      <div className="cronora-overlay" aria-hidden="true">
        <div className="cronora-overlay__content">
          <p className="cronora-overlay__count">0{activeSlide + 1}</p>
          <figure className="cronora-overlay__img-cont">
            {OVERLAY_IMAGES.map((img) => (
              <img
                key={img.alt}
                src={img.src}
                alt={img.alt}
                className="cronora-overlay__image"
              />
            ))}
          </figure>
        </div>
      </div>

      {/* BOTTOM SLIDE NAVIGATION BAR */}
      <nav
        aria-label="Navegación de diapositivas"
        className="absolute inset-x-0 bottom-0 z-50 border-t border-[#f6f2e7]/15 bg-[#0a1315]/85 backdrop-blur-md"
      >
        <div className="mx-auto flex h-13 max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-8">
          <div className="flex items-center gap-1.5 overflow-x-auto sm:gap-2">
            {SLIDE_META.map((slide, idx) => {
              const isCurrent = activeSlide === idx;
              return (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => navigateSlide(idx)}
                  aria-current={isCurrent ? "step" : undefined}
                  className={`min-h-9 shrink-0 whitespace-nowrap border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.06em] transition-colors sm:px-3 ${
                    isCurrent
                      ? "border-[#f6f2e7] bg-[#f6f2e7] font-semibold text-[#0a1315]"
                      : "border-[#f6f2e7]/20 bg-transparent text-[#f6f2e7]/75 hover:border-[#f6f2e7]/50 hover:text-[#f6f2e7]"
                  }`}
                >
                  {slide.shortLabel}
                </button>
              );
            })}
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => navigateSlide(activeSlide - 1, -1)}
              aria-label="Diapositiva anterior"
              className="flex h-9 w-9 items-center justify-center border border-[#f6f2e7]/25 text-[#f6f2e7] transition-colors hover:border-[#f6f2e7] hover:bg-[#16292c]"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => navigateSlide(activeSlide + 1, 1)}
              aria-label="Siguiente diapositiva"
              className="flex h-9 w-9 items-center justify-center border border-[#f6f2e7]/25 text-[#f6f2e7] transition-colors hover:border-[#f6f2e7] hover:bg-[#16292c]"
            >
              <ArrowDown className="h-4 w-4" />
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}

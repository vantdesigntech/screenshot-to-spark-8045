import { useCallback, useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export interface UseScrollNavigationOptions {
  disabled?: boolean;
}

function getNavbarHeight(): number {
  if (typeof window === "undefined") return 76;
  const header = document.querySelector("header");
  if (header instanceof HTMLElement && header.offsetHeight > 0) {
    return header.offsetHeight;
  }
  return window.innerWidth >= 640 ? 76 : 68;
}

export function useScrollNavigation({ disabled = false }: UseScrollNavigationOptions = {}) {
  const containerRef = useRef<HTMLElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const curtainRef = useRef<HTMLDivElement>(null);
  const disabledRef = useRef(disabled);

  useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

  const goToSearch = useCallback((onArrive?: () => void) => {
    if (typeof window === "undefined") return;
    const curtainEl = curtainRef.current;
    if (!curtainEl) return;

    gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
    const offsetY = getNavbarHeight();

    gsap.to(window, {
      scrollTo: { y: curtainEl, offsetY },
      duration: 0.85,
      ease: "power3.inOut",
      overwrite: "auto",
      ...(onArrive ? { onComplete: onArrive } : {}),
    });
  }, []);

  const goToHero = useCallback(() => {
    if (typeof window === "undefined") return;
    gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
    gsap.to(window, {
      scrollTo: { y: 0 },
      duration: 0.85,
      ease: "power3.inOut",
      overwrite: "auto",
    });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const curtainEl = curtainRef.current;
    if (!container || !curtainEl || typeof window === "undefined") return;

    gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: curtainEl,
        start: "top bottom",
        end: () => `top ${getNavbarHeight()}px`,
        invalidateOnRefresh: true,
        snap: {
          snapTo: (value) => (disabledRef.current ? value : value >= 0.35 ? 1 : 0),
          duration: { min: 0.25, max: 0.6 },
          delay: 0.05,
          ease: "power2.inOut",
        },
      });
    }, containerRef);

    return () => {
      ctx.revert();
    };
  }, []);

  return {
    containerRef,
    heroRef,
    curtainRef,
    goToSearch,
    goToHero,
  };
}

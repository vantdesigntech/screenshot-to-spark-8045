import { useEffect, useRef, useState } from "react";

const FADE_SECONDS = 1.2;

/** Plays the hero clips one after another, cross-fading between them (last → first too). */
export function HeroVideoLoop({ sources, poster, className = "" }: { sources: string[]; poster: string; className?: string }) {
  const refs = useRef<(HTMLVideoElement | null)[]>([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const current = refs.current[active];
    if (!current) return;
    current.currentTime = 0;
    void current.play().catch(() => {});
    let switched = false;
    const onTime = () => {
      if (switched || !current.duration) return;
      if (current.duration - current.currentTime <= FADE_SECONDS) {
        switched = true;
        setActive((i) => (i + 1) % sources.length);
      }
    };
    current.addEventListener("timeupdate", onTime);
    return () => current.removeEventListener("timeupdate", onTime);
  }, [active, sources.length]);

  return (
    <>
      {sources.map((src, i) => (
        <video
          key={src}
          ref={(el) => { refs.current[i] = el; }}
          src={src}
          poster={i === 0 ? poster : undefined}
          muted
          playsInline
          autoPlay={i === 0}
          preload="auto"
          aria-hidden
          className={`${className} transition-opacity ease-in-out motion-reduce:transition-none`}
          style={{ opacity: i === active ? 1 : 0, transitionDuration: `${FADE_SECONDS}s` }}
        />
      ))}
    </>
  );
}

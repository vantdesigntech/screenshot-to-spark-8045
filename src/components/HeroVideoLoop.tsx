import { useEffect, useRef, useState } from "react";

const CROSSFADE_SECONDS = 1.2;
/** Longer fade to black when the last clip hands back to the first. */
const BLACK_FADE_OUT_SECONDS = 2.5;
const BLACK_FADE_IN_SECONDS = 1.5;

/** Plays the hero clips in order: cross-fade between clips, slow fade through black from the last back to the first. */
export function HeroVideoLoop({ sources, poster, className = "" }: { sources: string[]; poster: string; className?: string }) {
  const refs = useRef<(HTMLVideoElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const [toBlack, setToBlack] = useState(false);
  const [fadeSeconds, setFadeSeconds] = useState(CROSSFADE_SECONDS);

  useEffect(() => {
    const current = refs.current[active];
    if (!current) return;
    current.currentTime = 0;
    void current.play().catch(() => {});
    const isLast = active === sources.length - 1;
    let switched = false;
    const onTime = () => {
      if (switched || !current.duration) return;
      const left = current.duration - current.currentTime;
      if (isLast && left <= BLACK_FADE_OUT_SECONDS) {
        switched = true;
        setFadeSeconds(BLACK_FADE_OUT_SECONDS);
        setToBlack(true);
      } else if (!isLast && left <= CROSSFADE_SECONDS) {
        switched = true;
        setFadeSeconds(CROSSFADE_SECONDS);
        setActive((i) => i + 1);
      }
    };
    const onEnded = () => {
      if (!isLast) return;
      setFadeSeconds(BLACK_FADE_IN_SECONDS);
      setToBlack(false);
      setActive(0);
    };
    current.addEventListener("timeupdate", onTime);
    current.addEventListener("ended", onEnded);
    return () => {
      current.removeEventListener("timeupdate", onTime);
      current.removeEventListener("ended", onEnded);
    };
  }, [active, sources.length]);

  return (
    <>
      <div aria-hidden className={className} style={{ backgroundColor: "black" }} />
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
          style={{ opacity: i === active && !toBlack ? 1 : 0, transitionDuration: `${fadeSeconds}s` }}
        />
      ))}
    </>
  );
}

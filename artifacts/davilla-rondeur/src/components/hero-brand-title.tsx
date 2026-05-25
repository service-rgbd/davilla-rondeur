import { useEffect, useState } from "react";

const FULL_TITLE = "Davilla Rondeur";
const DAVILLA_LENGTH = "Davilla".length;
const LETTER_DELAY_MS = 90;
const PAUSE_AFTER_COMPLETE_MS = 3000;

export function HeroBrandTitle() {
  const [visibleCount, setVisibleCount] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(media.matches);
    updatePreference();
    media.addEventListener("change", updatePreference);
    return () => media.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) {
      setVisibleCount(FULL_TITLE.length);
      return;
    }

    let count = 0;
    let timeoutId: ReturnType<typeof setTimeout>;

    const typeNext = () => {
      if (count < FULL_TITLE.length) {
        count += 1;
        setVisibleCount(count);
        timeoutId = setTimeout(typeNext, LETTER_DELAY_MS);
        return;
      }

      timeoutId = setTimeout(() => {
        count = 0;
        setVisibleCount(0);
        typeNext();
      }, PAUSE_AFTER_COMPLETE_MS);
    };

    typeNext();
    return () => clearTimeout(timeoutId);
  }, [prefersReducedMotion]);

  const visible = FULL_TITLE.slice(0, visibleCount);
  const davillaText = visible.slice(0, Math.min(visible.length, DAVILLA_LENGTH));
  const rondeurText = visible.length > DAVILLA_LENGTH ? visible.slice(DAVILLA_LENGTH) : "";
  const showCursor = !prefersReducedMotion && visibleCount < FULL_TITLE.length;

  return (
    <div className="w-full mb-10 md:mb-12 text-center px-2">
      <h1 className="leading-none inline-flex flex-wrap items-baseline justify-center gap-x-[0.2em]">
        <span className="font-black uppercase tracking-[0.28em] md:tracking-[0.42em] text-[clamp(2.75rem,11vw,7rem)] drop-shadow-[0_8px_32px_rgba(0,0,0,0.45)]">
          {davillaText}
        </span>
        {rondeurText && (
          <span className="font-light italic tracking-[0.2em] md:tracking-[0.35em] text-[clamp(1.75rem,6vw,4rem)] text-white/90">
            {rondeurText}
          </span>
        )}
        {showCursor && (
          <span
            className="inline-block w-[2px] md:w-[3px] h-[0.75em] bg-white/80 ml-1 animate-pulse align-middle"
            aria-hidden
          />
        )}
      </h1>
      <span className="sr-only">{FULL_TITLE}</span>
    </div>
  );
}

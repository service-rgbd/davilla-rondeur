import { cn } from "@/lib/utils";

function LotusIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path
        d="M20 34C20 34 6 26 6 15C6 15 10 17 12 20C12 20 12 10 20 4C28 10 28 20 28 20C30 17 34 15 34 15C34 26 20 34 20 34Z"
        fill="currentColor"
        fillOpacity="0.9"
      />
      <path
        d="M20 34C20 34 14 28 14 22C14 22 16.5 23.5 18 26C18 26 18 18 20 14C22 18 22 26 22 26C23.5 23.5 26 22 26 22C26 28 20 34 20 34Z"
        fill="currentColor"
        fillOpacity="0.5"
      />
      <circle cx="20" cy="35" r="1.2" fill="currentColor" fillOpacity="0.6" />
      <circle cx="16" cy="35.5" r="0.8" fill="currentColor" fillOpacity="0.4" />
      <circle cx="24" cy="35.5" r="0.8" fill="currentColor" fillOpacity="0.4" />
    </svg>
  );
}

interface BrandLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  inverted?: boolean;
  className?: string;
  showIcon?: boolean;
}

export function BrandLogo({ size = "md", inverted = false, className, showIcon = true }: BrandLogoProps) {
  const textColor = inverted ? "text-white" : "text-foreground";
  const accentColor = inverted ? "text-green-300" : "text-primary";
  const subColor = inverted ? "text-white/60" : "text-muted-foreground";

  if (size === "sm") {
    return (
      <span className={cn("inline-flex items-center gap-1.5 select-none", className)}>
        {showIcon && <LotusIcon className={cn("w-4 h-4", accentColor)} />}
        <span className={cn("font-sans font-bold uppercase tracking-[0.12em] text-lg leading-none", textColor)}>
          Davilla
        </span>
        <span className={cn("font-sans font-light italic text-sm tracking-widest leading-none", accentColor)}>
          Rondeur
        </span>
      </span>
    );
  }

  if (size === "md") {
    return (
      <span className={cn("inline-flex items-center gap-2 select-none", className)}>
        {showIcon && <LotusIcon className={cn("w-5 h-5 flex-shrink-0", accentColor)} />}
        <span className="flex flex-col leading-none">
          <span className={cn("font-sans font-black uppercase tracking-[0.18em] text-xl", textColor)}>
            DAVILLA
          </span>
          <span className={cn("font-sans font-light italic tracking-[0.3em] text-[10px] uppercase", subColor)}>
            Rondeur
          </span>
        </span>
      </span>
    );
  }

  if (size === "lg") {
    return (
      <span className={cn("inline-flex items-center gap-3 select-none", className)}>
        {showIcon && <LotusIcon className={cn("w-8 h-8 flex-shrink-0", accentColor)} />}
        <span className="flex flex-col leading-none gap-0.5">
          <span className={cn("font-sans font-black uppercase tracking-[0.2em] text-3xl", textColor)}>
            DAVILLA
          </span>
          <span className={cn("font-sans font-light italic tracking-[0.35em] text-xs uppercase", subColor)}>
            Rondeur · La Santé au Naturel
          </span>
        </span>
      </span>
    );
  }

  // xl — hero usage
  return (
    <span className={cn("inline-flex flex-col items-center select-none gap-3", className)}>
      {showIcon && (
        <span className="flex items-center gap-3">
          <span className={cn("h-px w-16 md:w-24 inline-block", inverted ? "bg-white/30" : "bg-border")} />
          <LotusIcon className={cn("w-10 h-10 md:w-14 md:h-14", accentColor)} />
          <span className={cn("h-px w-16 md:w-24 inline-block", inverted ? "bg-white/30" : "bg-border")} />
        </span>
      )}
      <span className="flex flex-col items-center gap-1">
        <span className={cn(
          "font-sans font-black uppercase tracking-[0.25em] md:tracking-[0.35em] text-5xl md:text-7xl lg:text-8xl leading-none drop-shadow-lg",
          textColor
        )}>
          DAVILLA
        </span>
        <span className={cn(
          "font-sans font-light italic tracking-[0.5em] md:tracking-[0.7em] text-xl md:text-2xl lg:text-3xl uppercase leading-none",
          inverted ? "text-white/80" : accentColor
        )}>
          Rondeur
        </span>
      </span>
    </span>
  );
}

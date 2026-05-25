import { cn } from "@/lib/utils";

const LOGO_SRC = "/images/logo.png";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  inverted?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "h-8",
  md: "h-11 md:h-12",
  lg: "h-14 md:h-16",
  xl: "h-36 md:h-48 lg:h-56 max-w-[min(90vw,42rem)]",
} as const;

export function BrandLogo({
  size = "md",
  inverted = false,
  className,
}: BrandLogoProps) {
  return (
    <img
      src={LOGO_SRC}
      alt="Davilla Rondeur"
      className={cn(
        "w-auto object-contain select-none block",
        sizeClasses[size],
        inverted && "brightness-0 invert drop-shadow-md",
        className,
      )}
    />
  );
}

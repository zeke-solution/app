import Image from "next/image";
import logoMark from "@/public/images/zeke-logo-mark.png";
import logoWhite from "@/public/images/zeke-logo-white.png";

type BrandLogoProps = {
  alt?: string;
  className?: string;
  markOnly?: boolean;
  preload?: boolean;
  sizes?: string;
};

export function BrandLogo({
  alt = "Zeke",
  className = "",
  markOnly = false,
  preload = false,
  sizes,
}: BrandLogoProps) {
  return (
    <Image
      src={markOnly ? logoMark : logoWhite}
      alt={alt}
      sizes={sizes ?? (markOnly ? "64px" : "112px")}
      className={`h-auto object-contain ${className}`}
      preload={preload}
    />
  );
}

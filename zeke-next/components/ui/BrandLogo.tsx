import Image from "next/image";

type BrandLogoProps = {
  alt?: string;
  className?: string;
  markOnly?: boolean;
  preload?: boolean;
};

export function BrandLogo({
  alt = "Zeke",
  className = "",
  markOnly = false,
  preload = false,
}: BrandLogoProps) {
  return (
    <Image
      src={markOnly ? "/images/zeke-logo-mark.png" : "/images/zeke-logo-white.png"}
      alt={alt}
      width={markOnly ? 639 : 2853}
      height={markOnly ? 547 : 687}
      className={`h-auto object-contain ${className}`}
      preload={preload}
    />
  );
}

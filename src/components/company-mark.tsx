import Image from "next/image";
import type { CompanySlug } from "@/lib/types";

const MARKS: Record<
  CompanySlug,
  { src: string; alt: string; sizes: string; imageClass: string }
> = {
  "aeris-beaute": {
    src: "/logo/aerisbeaute/Aeris new logo-01.png",
    alt: "Aeris Beaute",
    sizes: "220px",
    imageClass: "object-cover object-left",
  },
  "from-this-island": {
    src: "/logo/fti/FTI_Logogram_Charcoal.png",
    alt: "From This Island",
    sizes: "56px",
    imageClass: "object-contain object-left",
  },
};

export function CompanyMark({
  slug,
  className,
}: {
  slug: CompanySlug;
  className?: string;
}) {
  const mark = MARKS[slug];
  const sizeClass =
    className ??
    (slug === "aeris-beaute" ? "h-6 w-28" : "h-10 w-10");

  return (
    <span className={`relative block shrink-0 overflow-hidden ${sizeClass}`}>
      <Image
        src={mark.src}
        alt={mark.alt}
        fill
        sizes={mark.sizes}
        className={mark.imageClass}
      />
    </span>
  );
}

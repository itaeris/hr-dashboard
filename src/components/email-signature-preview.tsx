import { COMPANIES } from "@/lib/companies";
import { COMPANY_EMAIL_LOGOS } from "@/lib/email/signature";
import type { CompanySlug } from "@/lib/types";

export function EmailSignaturePreview({ slug }: { slug: CompanySlug }) {
  const logo = COMPANY_EMAIL_LOGOS[slug];
  const brand = COMPANIES[slug];

  return (
    <div className="border-t border-line pt-4">
      <p className="mb-3 text-xs uppercase tracking-[0.14em] text-muted">Signature</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logo.publicPath}
        alt={brand.name}
        width={logo.width}
        className="block h-auto max-w-full"
        style={{ width: logo.width }}
      />
      <p className="mt-2 text-xs text-muted">
        Added automatically when you send from this workspace.
      </p>
    </div>
  );
}

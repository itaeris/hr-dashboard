import { COMPANIES } from "@/lib/companies";
import type { CompanySlug } from "@/lib/types";

export const EMAIL_LOGO_CID = "company-logo@hr-dashboard";

export const COMPANY_EMAIL_LOGOS: Record<
  CompanySlug,
  { publicPath: string; fileName: string; width: number }
> = {
  "aeris-beaute": {
    publicPath: "/logo/aerisbeaute/Aeris new logo-01.png",
    fileName: "Aeris new logo-01.png",
    width: 112,
  },
  "from-this-island": {
    publicPath: "/logo/fti/FA_FromThisIsland_Charcoal.png",
    fileName: "FA_FromThisIsland_Charcoal.png",
    width: 160,
  },
};

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function emailBodyHtml(
  text: string,
  slug: CompanySlug,
  logoSrc = `cid:${EMAIL_LOGO_CID}`,
) {
  const logo = COMPANY_EMAIL_LOGOS[slug];
  const brand = COMPANIES[slug];
  const paragraphs = escapeHtml(text).replaceAll("\r\n", "\n").replaceAll("\n", "<br>");

  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#ffffff;">
  <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#1C1412;">
    ${paragraphs}
    <div style="margin-top:28px;padding-top:20px;border-top:1px solid #E8DDD4;">
      <img src="${logoSrc}" alt="${escapeHtml(brand.name)}" width="${logo.width}" style="display:block;width:${logo.width}px;max-width:100%;height:auto;border:0;" />
    </div>
  </div>
</body>
</html>`;
}

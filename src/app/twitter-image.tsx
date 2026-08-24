import { alt, contentType, generateOgImage, size } from "@/lib/og-image";

export const runtime = "nodejs";
export { alt, contentType, size };

export default async function TwitterImage() {
  return generateOgImage();
}

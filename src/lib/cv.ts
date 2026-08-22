import { getSupabaseBrowserClient } from "./supabase/client";

export const CV_ACCEPT = ".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp";
export const CV_MAX_BYTES = 8 * 1024 * 1024;

export type CvKind = "pdf" | "image" | "office" | "other";

export type CvMeta = {
  name: string;
  kind: CvKind;
};

function mimeFromDataUrl(url: string) {
  const comma = url.indexOf(",");
  const header = comma === -1 ? url.slice(5) : url.slice(5, comma);
  return header.split(";")[0]?.toLowerCase() ?? "";
}

export function withCvName(url: string, name: string) {
  if (url.startsWith("data:")) {
    const comma = url.indexOf(",");
    if (comma === -1) return url;
    const header = url.slice(0, comma);
    const body = url.slice(comma);
    if (/[;,]name=/.test(header)) return url;
    return `${header.replace(/;base64$/i, `;name=${encodeURIComponent(name)};base64`)}${body}`;
  }

  const hashIndex = url.indexOf("#");
  const base = hashIndex === -1 ? url : url.slice(0, hashIndex);
  return `${base}#${encodeURIComponent(name)}`;
}

export function cvName(url: string | null) {
  if (!url) return "CV";

  if (url.startsWith("data:")) {
    const match = url.match(/[;,]name=([^;,]+)/);
    if (match) return decodeURIComponent(match[1]);
    return "CV";
  }

  try {
    const parsed = new URL(url, "https://local.invalid");
    if (parsed.hash.length > 1) return decodeURIComponent(parsed.hash.slice(1));
    const leaf = parsed.pathname.split("/").pop();
    if (leaf) return decodeURIComponent(leaf.replace(/^[0-9a-f-]{36}-/i, ""));
  } catch {
    /* ignore */
  }

  return "CV";
}

export function cvKind(url: string | null): CvKind {
  if (!url) return "other";
  const name = cvName(url).toLowerCase();
  const mime = url.startsWith("data:") ? mimeFromDataUrl(url) : "";

  if (mime.includes("pdf") || name.endsWith(".pdf")) return "pdf";
  if (mime.startsWith("image/") || /\.(png|jpe?g|webp|gif)$/.test(name)) return "image";
  if (mime.includes("word") || /\.(docx?|rtf)$/.test(name)) return "office";
  return "other";
}

export function cvMeta(url: string | null): CvMeta {
  return { name: cvName(url), kind: cvKind(url) };
}

export function previewable(kind: CvKind) {
  return kind === "pdf" || kind === "image";
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(withCvName(String(reader.result), file.name));
    reader.onerror = () => reject(reader.error ?? new Error("Could not read CV"));
    reader.readAsDataURL(file);
  });
}

function safeFileName(name: string) {
  return name.replace(/[^\w.\- ()]+/g, "_");
}

export async function persistCvFile(file: File, companyId: string) {
  if (file.size > CV_MAX_BYTES) {
    throw new Error("CV must be under 8 MB");
  }

  const supabase = getSupabaseBrowserClient();
  if (supabase) {
    const path = `${companyId}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
    const { error } = await supabase.storage.from("cvs").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined,
    });

    if (!error) {
      const { data } = supabase.storage.from("cvs").getPublicUrl(path);
      return withCvName(data.publicUrl, file.name);
    }
  }

  return readFileAsDataUrl(file);
}

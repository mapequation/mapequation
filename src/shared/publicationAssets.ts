import { readdirSync } from "node:fs";
import { join } from "node:path";

const ASSETS_ROOT = "public/publications";
const IMAGE_EXTS = [".svg", ".png", ".jpg", ".jpeg", ".webp"];

function listFolder(slug: string): string[] {
  try {
    return readdirSync(join(ASSETS_ROOT, slug)).sort((a, b) =>
      a.localeCompare(b, "en", { sensitivity: "base" }),
    );
  } catch {
    return [];
  }
}

function isExternal(value: string): boolean {
  return (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("/")
  );
}

function publicPath(slug: string, filename: string): string {
  return `/publications/${slug}/${filename}`;
}

export function resolvePdf(
  slug: string,
  value: string | undefined,
): string | undefined {
  if (value) return isExternal(value) ? value : publicPath(slug, value);
  const match = listFolder(slug).find((f) => f.toLowerCase().endsWith(".pdf"));
  return match ? publicPath(slug, match) : undefined;
}

export function resolveFigure(
  slug: string,
  value: string | undefined,
): string | undefined {
  if (value) return isExternal(value) ? value : publicPath(slug, value);
  const match = listFolder(slug).find((f) => {
    const lower = f.toLowerCase();
    return IMAGE_EXTS.some((ext) => lower.endsWith(ext));
  });
  return match ? publicPath(slug, match) : undefined;
}

export function normalizeDoi(doi: string): string {
  // Strip http(s) and any host, keep the 10.xxxx/yyyy id, then build https://doi.org/...
  const m = doi.match(/10\.\d{4,9}\/[^\s]+/);
  return m ? `https://doi.org/${m[0]}` : doi;
}

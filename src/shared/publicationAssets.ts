import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ASSETS_ROOT = "public/publications";
const IMAGE_EXTS = [".svg", ".png", ".jpg", ".jpeg", ".webp"];

export type ImageDimensions = {
  width: number;
  height: number;
};

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

function parsePngDimensions(buffer: Buffer): ImageDimensions | undefined {
  if (buffer.length < 24 || buffer.toString("ascii", 1, 4) !== "PNG") {
    return undefined;
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function parseJpegDimensions(buffer: Buffer): ImageDimensions | undefined {
  let offset = 2;
  while (offset + 4 < buffer.length) {
    if (buffer[offset] !== 0xff) return undefined;
    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);
    if (offset + 2 + length > buffer.length) return undefined;
    if (marker >= 0xc0 && marker <= 0xc3) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
      };
    }
    offset += 2 + length;
  }
  return undefined;
}

export function getPublicationImageDimensions(
  src: string | undefined,
): ImageDimensions | undefined {
  if (!src?.startsWith("/publications/")) return undefined;
  const buffer = readFileSync(join("public", src));
  const lower = src.toLowerCase();
  if (lower.endsWith(".png")) return parsePngDimensions(buffer);
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
    return parseJpegDimensions(buffer);
  }
  return undefined;
}

export function normalizeDoi(doi: string): string {
  // Strip http(s) and any host, keep the 10.xxxx/yyyy id, then build https://doi.org/...
  const m = doi.match(/10\.\d{4,9}\/[^\s]+/);
  return m ? `https://doi.org/${m[0]}` : doi;
}

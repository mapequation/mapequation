import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";
import { z } from "zod";
import { loadPublications, type Publication } from "./loadPublications";

const isoDate = z.preprocess(
  (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
);

const newsSchema = z.object({
  date: isoDate,
  type: z.string(),
  title: z.string(),
  href: z.string(),
  featured: z.boolean().optional(),
});

export interface NewsItem {
  date: string;
  displayDate: string;
  type: string;
  title: string;
  href: string;
  descriptionHtml: string;
  featured: boolean;
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

function pubToNews(p: Publication): NewsItem {
  const date = p.date ?? `${p.year}-01-01`;
  const isPreprint = (p.journal ?? "").toLowerCase().includes("arxiv");
  return {
    date,
    displayDate: p.date ? formatDate(p.date) : String(p.year),
    type: isPreprint ? "Preprint" : "Publication",
    title: p.title,
    href: `/publications#${p.slug}`,
    descriptionHtml: p.journal ?? p.authors,
    featured: false,
  };
}

const NEWS_DIR = path.join(process.cwd(), "content", "news");

export function loadNews(): NewsItem[] {
  const manual: NewsItem[] = readdirSync(NEWS_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((file) => {
      const raw = readFileSync(path.join(NEWS_DIR, file), "utf8");
      const { data, content } = matter(raw);
      const meta = newsSchema.parse(data);
      return {
        date: meta.date,
        displayDate: formatDate(meta.date),
        type: meta.type,
        title: meta.title,
        href: meta.href,
        featured: meta.featured ?? false,
        descriptionHtml: marked.parse(content.trim(), {
          async: false,
        }) as string,
      };
    });

  const auto = loadPublications().map(pubToNews);

  return [...manual, ...auto].sort(
    (a, b) => Date.parse(b.date) - Date.parse(a.date),
  );
}

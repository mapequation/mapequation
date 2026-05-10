import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";
import { z } from "zod";
import {
  normalizeDoi,
  resolveFigure,
  resolvePdf,
} from "./publicationAssets";

const publicationSchema = z.object({
  title: z.string(),
  authors: z.string(),
  year: z.number().int(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  journal: z.string().optional(),
  doi: z.string().url().optional(),
  arxiv: z.string().optional(),
  pdf: z.string().optional(),
  links: z
    .array(z.object({ label: z.string(), href: z.string().url() }))
    .optional(),
  figure: z
    .object({
      src: z.string().optional(),
      caption: z.string().optional(),
    })
    .optional(),
  category: z
    .enum(["research", "presentation", "tutorial"])
    .default("research"),
  featured: z.boolean().optional(),
});

export type Publication = z.infer<typeof publicationSchema> & {
  slug: string;
  body: string;
  bodyHtml: string;
  figureSrc?: string;
  pdfHref?: string;
  doiHref?: string;
  scholarHref: string;
  isPreprint: boolean;
};

const CONTENT_DIR = path.join(process.cwd(), "content", "publications");

export function loadPublications(): Publication[] {
  const files = readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".md"));
  const pubs: Publication[] = files.map((file) => {
    const raw = readFileSync(path.join(CONTENT_DIR, file), "utf8");
    const { data, content } = matter(raw);
    const parsed = publicationSchema.parse(data);
    const slug = file.replace(/\.md$/, "");
    const body = content.trim();
    const isPreprint =
      (parsed.journal ?? "").toLowerCase().includes("arxiv") && !parsed.doi;
    return {
      ...parsed,
      slug,
      body,
      bodyHtml: body
        ? (marked.parse(body, { async: false }) as string)
        : "",
      figureSrc: resolveFigure(slug, parsed.figure?.src),
      pdfHref: resolvePdf(slug, parsed.pdf),
      doiHref: parsed.doi ? normalizeDoi(parsed.doi) : undefined,
      scholarHref: `https://scholar.google.com/scholar?q=${encodeURIComponent(parsed.title)}`,
      isPreprint,
    };
  });
  pubs.sort((a, b) => {
    const ad = a.date ?? `${a.year}-12-31`;
    const bd = b.date ?? `${b.year}-12-31`;
    return bd.localeCompare(ad);
  });
  // Strip undefined so Next getStaticProps can serialize.
  return JSON.parse(JSON.stringify(pubs)) as Publication[];
}

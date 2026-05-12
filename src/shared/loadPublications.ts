import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";
import { z } from "zod";
import { normalizeDoi, resolveFigure, resolvePdf } from "./publicationAssets";

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
  cites: z.array(z.string()).optional(),
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
    .enum(["Publication", "Tutorial", "Preprint", "Book chapter"])
    .default("Publication"),
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
};

const PUBLICATIONS_DIR = path.join(process.cwd(), "public", "publications");

export function loadPublications(): Publication[] {
  const entries = readdirSync(PUBLICATIONS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name));
  const pubs: Publication[] = entries.map((entry) => {
    const slug = entry.name;
    const raw = readFileSync(
      path.join(PUBLICATIONS_DIR, slug, "index.md"),
      "utf8",
    );
    const { data, content } = matter(raw);
    let parsed: z.infer<typeof publicationSchema>;
    try {
      parsed = publicationSchema.parse(data);
    } catch (err) {
      console.error(`Error parsing publication ${slug}:`, err);
      return {} as Publication;
    }
    
    const body = content.trim();
    if (!parsed.doi) {
      parsed.category = "Preprint"
    }
    return {
      ...parsed,
      slug,
      body,
      bodyHtml: body ? (marked.parse(body, { async: false }) as string) : "",
      figureSrc: resolveFigure(slug, parsed.figure?.src),
      pdfHref: resolvePdf(slug, parsed.pdf),
      doiHref: parsed.doi ? normalizeDoi(parsed.doi) : undefined,
      scholarHref: `https://scholar.google.com/scholar?q=${encodeURIComponent(parsed.title)}`,
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

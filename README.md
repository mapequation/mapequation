# mapequation.org

Source for the [Map Equation research group](https://www.mapequation.org/) website.
Built with [Next.js](https://nextjs.org/), React, and [Chakra UI](https://chakra-ui.com/),
statically exported via `next build` (see [next.config.js](next.config.js)).

The most common change is **adding a new publication**. The rest of this README
walks through that workflow. Other content (about page, news, code/apps) lives
in [src/pages/](src/pages/) and [content/news/](content/news/).

## Quick reference

A publication is one folder:

- **`public/publications/<slug>/index.md`** — title, authors, journal, abstract.
- **the same folder** — optional PDF and figure assets.

The folder name is the publication `<slug>`. Drop `index.md`, the PDF, and the
figure in that folder and everything else is automatic: the build picks up the
first PDF and first image in the folder, links them from the publications page,
and renders the figure next to the abstract.

```
public/publications/
  Lindstrom-Etal-2026-MemoryBiased/        ← slug = folder name
    index.md
    paper.pdf
    figure.svg
```

## Adding a new publication on GitHub (fastest)

1. **Create the publication folder and manifest.** Open
   [public/publications/](public/publications/) on GitHub →
   *Add file → Create new file*. Name it
   `FirstAuthor-Year-ShortTitle/index.md` (see
   [Slug convention](#slug-convention) below). Paste the
   [typical research paper template](#templates) and fill it in.
2. **Upload the PDF and figure.** Go to the same folder under
   [public/publications/](public/publications/) → *Add file → Upload files*.
   Drop the PDF and figure there.
3. **Commit.** Either commit straight to `master`, or use *Create a new branch
   and start a pull request* if you'd like a colleague to review first.

Pushing to `master` triggers the deploy automatically.

## Adding a new publication locally (recommended for figures)

Useful when you want to preview the rendered card, check the figure size, or
batch several edits.

```bash
git clone git@github.com:mapequation/mapequation.github.io.git
cd mapequation.github.io
npm install                    # requires Node 20.x (see package.json engines)
npm run dev                    # http://localhost:3000
```

Then:

1. Create `public/publications/<slug>/index.md`.
2. Drop the PDF + figure into `public/publications/<slug>/`.
3. Refresh `/publications` in the browser to verify it renders.
4. `npm run check` (Biome lint + format check + `tsc`).
5. `git add public/publications/<slug> && git commit -m "Add <slug>" && git push`.

## Slug convention

`FirstAuthor-Year-ShortTitle`

- One or two surnames separated by `-`. For three or more authors, use `Etal`:
  `Aslak-Etal-2017-...`, `Rosvall-Bergstrom-2008-...`,
  `Rosvall-Axelsson-Bergstrom-2009-...`.
- 4-digit year.
- Title in CamelCase or hyphen-separated words. Keep it short, ASCII only.
- The folder under `public/publications/` is the **slug** (case-sensitive —
  the deploy host treats `Foo-2024-...` and
  `foo-2024-...` as different folders).

Look at any existing entry in
[public/publications/](public/publications/) for examples.

## Frontmatter reference

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `title` | string | yes | Publication title. |
| `authors` | string | yes | Comma-separated, e.g. `"Jane Doe, John Smith, and …"`. |
| `year` | number | yes | 4-digit year. Used for grouping on the publications page. |
| `date` | `YYYY-MM-DD` | no | Overrides `year` for sort order; useful when several papers share a year. |
| `journal` | string | no | Journal/venue line, e.g. `"Phys. Rev. E 100, 052308 (2019)"`. |
| `doi` | URL | no | Full DOI URL, e.g. `"https://doi.org/10.1103/PhysRevE.100.052308"`. |
| `arxiv` | string | no | arXiv ID only (e.g. `"1905.11230"`). The link is generated automatically. |
| `pdf` | string | no | Filename inside the publication folder (`"paper.pdf"`), or a full external URL. **Omit to auto-pick the first PDF in the folder.** |
| `figure.src` | string | no | Filename inside the publication folder (`"figure.svg"`), or a full external URL. **Omit to auto-pick the first image in the folder.** |
| `figure.caption` | string | no | Caption shown under the figure; also used as alt text. Convention: start with `FIG. N`. |
| `links` | array | no | Custom external links; each `{ label, href }`. |
| `category` | enum | no | `research` (default), `tutorial`, or `presentation`. Each gets its own section in the table of contents. |
| `featured` | boolean | no | Pin to the "Featured" strip at the top of the publications page (max 6 are shown). |

The body of the markdown file (everything after the closing `---`) renders as
the abstract, beside the figure. Plain prose, 50–500 words, no headings.

## Templates

Copy the relevant block, paste it into your new `<slug>/index.md`, fill in the
fields, and write the abstract under the closing `---`.

### Minimal — only the required fields

```markdown
---
title: "Your paper title here"
authors: "Jane Doe, John Smith"
year: 2026
---

Short abstract goes here.
```

### Typical research paper

Assumes you've dropped a PDF and a figure into
`public/publications/<slug>/` — the build auto-picks them.

```markdown
---
title: "Your paper title here"
authors: "Jane Doe, John Smith, and Martin Rosvall"
year: 2026
date: "2026-05-07"
journal: "Phys. Rev. E 109, 042310 (2026)"
doi: "https://doi.org/10.1103/PhysRevE.109.042310"
arxiv: "2602.01234"
figure:
  caption: "FIG. 1 Short description of the figure for screen readers and captions."
---

Abstract goes here.
```

### External-only — paper hosted elsewhere, no local PDF/figure

```markdown
---
title: "Your paper title here"
authors: "Jane Doe and Martin Rosvall"
year: 2026
journal: "Some Journal Vol. X"
doi: "https://doi.org/10.xxxx/yyyy"
pdf: "https://example.com/paper.pdf"
links:
  - { label: "Supplementary material", href: "https://example.com/supp" }
---

Abstract goes here.
```

## Figures

- Drop the figure into `public/publications/<slug>/`.
- **Format:** SVG > PNG > JPG. The auto-pick is alphabetical, so if you have
  both `figure.svg` and `figure.png` in the folder, the SVG wins. To force a
  specific file, set `figure.src: "<filename>"` in frontmatter.
- **Size:** displayed at roughly 400–600 px wide on desktop. For raster
  figures, aim for **800–1200 px wide** (retina-friendly without bloat).
  Compress before committing — keep figures under ~500 KB when possible.
- **Caption:** always include `figure.caption` when adding a figure. It's the
  alt text screen readers see. Convention: start with `FIG. N`.

## PDFs

- Drop the PDF into `public/publications/<slug>/`. Filename can be
  anything (`paper.pdf`, `arxiv-XXXX.XXXXX.pdf`, the journal-supplied name) —
  the first PDF in the folder wins.
- If you can't host the PDF (publisher restrictions), set
  `pdf: "https://…"` in frontmatter to point to the external copy. The
  publications page will link to that URL instead.
- If a paper has multiple PDFs in the folder (e.g. main + supplement), pin the
  main one with `pdf: "main.pdf"` so the auto-pick doesn't surprise you.

## Sorting and categories

- Default sort is by `year` descending. Add `date: YYYY-MM-DD` when you want a
  precise within-year order.
- `category` defaults to `research`. Use `tutorial` for surveys/teaching
  papers and `presentation` for talks. Each category gets its own section in
  the page's table of contents.

## Pre-flight checklist

- [ ] Folder is `public/publications/FirstAuthor-Year-ShortTitle/`.
- [ ] Manifest is `public/publications/FirstAuthor-Year-ShortTitle/index.md`.
- [ ] Required fields (`title`, `authors`, `year`) are filled in.
- [ ] PDF and figure are inside the publication folder, or appropriate URL field is set.
- [ ] If multiple PDFs / images live in the folder, the right one is pinned with `pdf:` / `figure.src:`.
- [ ] (Local) `npm run dev` shows the new entry rendering correctly.
- [ ] (Local) `npm run check` is clean (Biome + `tsc`).

## Project layout

| Path | Purpose |
| --- | --- |
| [src/shared/loadPublications.ts](src/shared/loadPublications.ts) | Frontmatter schema (Zod) + loader. |
| [public/publications/](public/publications/) | Per-slug publication folders (`index.md`, PDFs, figures). |
| [src/shared/publicationAssets.ts](src/shared/publicationAssets.ts) | PDF / figure auto-discovery helper. |
| [src/pages/publications.tsx](src/pages/publications.tsx) | The publications page. |
| [src/pages/index.tsx](src/pages/index.tsx) | Home page (pulls recent items from [content/news/](content/news/) via [src/shared/loadNews.ts](src/shared/loadNews.ts)). |

## Available scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Next.js dev server at http://localhost:3000. |
| `npm run build` | Build the static export into `out/` (Next.js `output: "export"`). |
| `npm run serve:export` | Serve the built `out/` directory locally. |
| `npm run check` | Biome lint + format check + `tsc --noEmit`. |
| `npm run lint` / `npm run lint:fix` | Biome lint (check / autofix). |
| `npm run format` | Apply Biome formatting. |
| `npm run typecheck` | `tsc --noEmit`. |
| `npm run verify` | `check` + `build` + `test:smoke` (matches CI). |

# AGENTS.md

## Project Overview

This is the source for `mapequation.org`, built with Next.js 15, React 19,
TypeScript, Chakra UI, and npm. It uses Node 20 from `.nvmrc` and statically
exports the site with `next build` into `out/` as configured in
`next.config.js`.

## Recommended Skills

- Use `vercel-react-best-practices` for Next.js, React, page, component,
  data-loading, and performance work.
- Use `typescript-expert` for TypeScript, type errors, module resolution, build
  issues, and JavaScript/TypeScript refactors.
- Use Chakra UI guidance when changing Chakra components, layout primitives,
  styling patterns, or theme behavior.

## Commands

- `npm run dev`: Start the local Next.js dev server.
- `npm run check`: Run Biome lint, Biome format check, and `tsc --noEmit`.
  Prefer this for routine verification.
- `npm run typecheck`: Run TypeScript only.
- `npm run lint`: Run Biome lint.
- `npm run lint:fix`: Run Biome lint with autofixes.
- `npm run format`: Apply Biome formatting.
- `npm run format:check`: Check Biome formatting.
- `npm run build`: Build the static export into `out/`. Do not run this after
  every edit unless explicitly requested.
- `npm run serve:export`: Serve the built `out/` directory locally.
- `npm run verify`: Run the CI-like full check: `check`, `build`, and smoke
  tests.

## Dev Server Notes

- Do not run `npm run build` after every step unless asked. It can interfere
  with an active development server.
- If the dev server behaves strangely, especially after a larger refactor,
  suspect a corrupt `.next` directory. Stop the dev server, remove `.next`, and
  restart `npm run dev`.

## Validation Guidance

- Prefer `npm run check` for regular validation.
- Use `npm run typecheck` when only TypeScript behavior changed.
- Use `npm run test:smoke` when page rendering, navigation, or workbench
  behavior changed.
- Use `npm run verify` before PRs or when explicitly requested, since it runs
  `npm run build`.

## Work Conventions

- Do use conventional commits.
- Do create PRs using conventional-commit-style titles and English
  descriptions.
- Do use repo-local paths in documentation and PR body texts.
- Do NOT set yourself as co-author on commits.
- Do NOT include yourself, `codex`, or agent branding anywhere in PR titles or
  PR body texts.

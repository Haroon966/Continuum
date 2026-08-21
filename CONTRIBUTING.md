# Contributing to Continuum

Thanks for helping.

## Setup

```bash
npm install
npm run electron:dev
```

## Before a PR

```bash
npm test
npm run build
```

## Guidelines

- Prefer small, focused PRs
- Match existing code style; no drive-by refactors
- Do not commit secrets, `.env`, or `~/.config/continuum` data
- Update `docs/prd.md` only when product behavior changes intentionally
- Keep UI light-theme (see `design-system/continuum/`)

## Commit messages

Short imperative subjects, e.g. `fix: map legacy kanban statuses to Hermes columns`.

### No AI / Cursor credit

Do **not** add `Co-authored-by:` (or any credit) for Cursor, Copilot, or other AI agents. Commits must use your normal git name/email only.

`npm install` sets `core.hooksPath` to `.githooks/`. The `commit-msg` hook strips Cursor/AI trailers if a tool injects them. Verify with `npm run test:git-hooks`.

In Cursor settings, disable any option that attributes commits to Cursor / adds a Co-authored-by trailer.

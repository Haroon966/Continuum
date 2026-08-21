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

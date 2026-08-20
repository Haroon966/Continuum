# Continuum

**One project. Any agent. No lost context.**

Local desktop workspace for AI-assisted development. Continuum keeps project brain, Hermes-style kanban, and a Bonscape-style chat canvas in sync via a single root file: `CONTINUUM.md`.

![License](https://img.shields.io/badge/license-MIT-teal.svg)
![Platform](https://img.shields.io/badge/platform-Linux%20%7C%20macOS%20%7C%20Windows-lightgrey.svg)
![Stack](https://img.shields.io/badge/stack-Electron%20%2B%20React%20%2B%20TypeScript-blue.svg)

## Features

| Surface | Inspired by | What it does |
|--------|-------------|--------------|
| **Board** | [Hermes Agent Kanban](https://hermes-agent.nousresearch.com/docs/user-guide/features/kanban) | `triage → todo → ready → running → blocked → done`, drag-drop, task drawer |
| **Canvas** | [Bonscape](https://bonscape.com/) | Spatial chat boxes, branch with edges, Claude CLI dock |
| **Brain** | Continuum | Goal, handoff, decisions, architecture in `CONTINUUM.md` DSL |
| **Agents** | Local-first | Claude CLI in-app; Cursor via open folder + localhost `curl` API |

No cloud account. No Continuum-owned provider API keys. Project folder owns the context.

## Requirements

- Node.js 20+ (22 recommended)
- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) on `PATH` (optional, for canvas chat)
- [Cursor](https://cursor.com/) on `PATH` (optional, for Continue with Cursor)

## Quick start

```bash
git clone https://github.com/Haroon966/Continuum.git continuum
cd continuum
npm install
npm run electron:dev
```

1. **Open folder** — Continuum creates `CONTINUUM.md` at the project root  
2. Use **Board** / **Canvas** / **Brain**  
3. **Settings** — Claude/Cursor paths, API port/token  

### Scripts

| Command | Description |
|---------|-------------|
| `npm run electron:dev` | Dev app (Vite + Electron, GPU disabled for stability) |
| `npm run build` | Production renderer + electron bundles |
| `npm test` | Unit tests (DSL + local API) |

## Cursor curl API

With Continuum running and a project open:

```bash
export CONTINUUM_TOKEN="<token from Settings>"
export CONTINUUM_API=http://127.0.0.1:3927

curl -s "$CONTINUUM_API/api/context" \
  -H "Authorization: Bearer $CONTINUUM_TOKEN"

curl -s -X PATCH "$CONTINUUM_API/api/context" \
  -H "Authorization: Bearer $CONTINUUM_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"handoff":"Next: …"}'
```

Full agent guide is embedded at the top of every `CONTINUUM.md`.

## Project layout

```text
electron/     # Main process, file watch, localhost API, terminal
src/          # React UI (Board / Canvas / Brain)
shared/       # CONTINUUM.md DSL parse/serialize + types
prd.md        # Product requirements
design-system/  # UI design notes
```

## Docs

- Product: [`prd.md`](./prd.md)
- Design: [`design-system/continuum/`](./design-system/continuum/)

## Security notes

- API binds to `127.0.0.1` only; protect the bearer token in Settings  
- Do not commit `.env` or machine-local settings under `~/.config/continuum/`  
- Tokens are generated locally per install  

## Contributing

Issues and PRs welcome. Keep diffs small; match existing style. Run `npm test` before opening a PR.

## License

MIT — see [LICENSE](./LICENSE).

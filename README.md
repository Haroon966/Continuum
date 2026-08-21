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

## Quick start (one-shot)

Requires **Node.js 20+** and **git** on `PATH`.

### Linux / macOS

```bash
curl -fsSL https://raw.githubusercontent.com/Haroon966/Continuum/main/install.sh | bash
```

### Windows (PowerShell)

```powershell
irm https://raw.githubusercontent.com/Haroon966/Continuum/main/install.ps1 | iex
```

If scripts are blocked, run once: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`

What the installer does:

- Clones or updates Continuum into `~/continuum` (`%USERPROFILE%\continuum` on Windows)
- Runs `npm install`
- Adds a `continuum` launcher (`~/.local/bin/continuum` or `continuum.cmd`; Windows also adds that folder to your **user PATH**)
- On Linux: installs Apps-menu `.desktop` + icons that run the launcher (Vite + Electron — not raw Electron)
- Prints start instructions, then asks **Start Continuum now? [y/N]** (skipped when piped / non-interactive)

Safe to re-run: updates app code only. Does **not** touch Electron user data (settings, API token, transcripts) or any project `CONTINUUM.md`.

Then start with either:

```bash
continuum
```

or open **Continuum** from your app menu / dock. Manual fallback: `cd ~/continuum && npm run electron:dev`.

1. **Open folder** — Continuum creates `CONTINUUM.md` at the project root  
2. Use **Board** / **Canvas** / **Brain**  
3. **Settings** — Claude/Cursor paths, API port/token  

### Manual install

```bash
git clone https://github.com/Haroon966/Continuum.git continuum
cd continuum
npm install
npm run electron:dev
```

### Scripts

| Command | Description |
|---------|-------------|
| `npm run electron:dev` | Dev app (Vite + Electron, GPU disabled for stability) |
| `npm run build` | Production renderer + electron bundles |
| `npm test` | Unit tests (DSL + local API) |
| `bash install.sh` | One-shot install / update (Linux / macOS) |
| `powershell -File install.ps1` | One-shot install / update (Windows) |

## Cursor curl API

With Continuum running and a project open:

```bash
export CONTINUUM_TOKEN="<token from Settings>"
export CONTINUUM_API=http://127.0.0.1:3927

# Read brain (tasks, handoff, canvas map)
curl -s "$CONTINUUM_API/api/context" \
  -H "Authorization: Bearer $CONTINUUM_TOKEN"

# Patch handoff / currentState
curl -s -X PATCH "$CONTINUUM_API/api/context" \
  -H "Authorization: Bearer $CONTINUUM_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"handoff":"Next: …"}'
```

### Agent loop (board → canvas chat → done)

```bash
# Create a ready task
curl -s -X POST "$CONTINUUM_API/api/tasks" \
  -H "Authorization: Bearer $CONTINUUM_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Fix login","status":"ready","priority":"high"}'

# Start work: status=running + linked chat node (use nodeId in Continuum Canvas)
curl -s -X POST "$CONTINUUM_API/api/tasks/t1/start" \
  -H "Authorization: Bearer $CONTINUUM_TOKEN"

# Finish work
curl -s -X POST "$CONTINUUM_API/api/tasks/t1/complete" \
  -H "Authorization: Bearer $CONTINUUM_TOKEN"
```

In the UI: open a task drawer → **Start agent** (creates chat + jumps to Canvas) → **Mark done**.

Full agent guide is also embedded at the top of every `CONTINUUM.md`.

## Ship checklist

Before calling a release “good enough”:

- [ ] `npm test` passes
- [ ] Open folder → `CONTINUUM.md` created / loaded
- [ ] Board: create card, drag across columns, drawer edits persist
- [ ] Board: **Start agent** → Canvas chat + Running; **Mark done** → Done
- [ ] Canvas: right-click add Chat/Image/Link; connect wires; drag nodes; reload still there
- [ ] Settings: API token + `curl` context works on `127.0.0.1`
- [ ] Continue with Cursor opens project folder

## Project layout

```text
electron/                 # Main process, file watch, localhost API, terminal
src/                      # React UI (Board / Canvas / Brain / Agents)
shared/                   # CONTINUUM.md DSL parse/serialize + types
public/                   # Static brand assets (favicon, logos) served by Vite
design-system/continuum/  # UI design notes + unused brand variants
docs/                     # Product requirements (prd.md)
CONTINUUM.md              # Project brain (repo root — required)
```

## Docs

- Product: [`docs/prd.md`](./docs/prd.md)
- Design: [`design-system/continuum/`](./design-system/continuum/)

## Security notes

- API binds to `127.0.0.1` only; protect the bearer token in Settings  
- Do not commit `.env` or machine-local settings under `~/.config/continuum/`  
- Tokens are generated locally per install  

## Contributing

Issues and PRs welcome. Keep diffs small; match existing style. Run `npm test` before opening a PR.

## License

MIT — see [LICENSE](./LICENSE).

# Continuum — Product Requirements Document (PRD)

**Version:** 2.0  
**Status:** MVP Definition (post-discovery)  
**Product:** Continuum  
**Tagline:** One project. Any agent. No lost context.

---

## 1. Product Overview

Continuum is a **local desktop app** that keeps software-project context alive across humans and AI agents (Claude CLI, Cursor, and later others).

Core principle:

> **The project owns the context — not the AI agent.**

Continuum is **not** another cloud chat product and **not** a replacement for Cursor or Claude. It is the persistent project layer around them: brain, board, canvas, and handoff.

Inspiration for the conversation surface: visual branching canvases such as [Bonscape](https://bonscape.com/) (chat nodes, branches, spatial layout). Continuum adds a **project layer** Bonscape-style tools usually lack: a single source-of-truth file, live Kanban, and agent-updatable project state.

---

## 2. Problem Statement

AI-assisted development is fragmented:

- Context dies when a session or tool hits limits
- Switching Claude ↔ Cursor means manual paste and re-explain
- Decisions stay buried in chat scrolls
- Tasks (Kanban) lose the reasoning that created them
- Every new agent rediscovers the same project from zero

The developer becomes the sync layer. Continuum should be that layer instead.

---

## 3. Product Shape (decided)

| Decision | Choice |
|----------|--------|
| Delivery | **Desktop app** (local machine) |
| Multi-user / cloud backend | **Out of MVP** (no Django multi-user cloud) |
| Accounts / login | **None** — solo, local, offline |
| Provider APIs inside Continuum | **None** — Continuum does not call Claude/OpenAI APIs itself |
| Project binding | One Continuum project ↔ **one local folder** |
| Source of truth | Root file **`CONTINUUM.md`** only (no `.continuum/` folder) |
| Agent chat on canvas | **Claude CLI** via in-app terminal |
| Cursor | Open Cursor on folder + **local `curl` API** to Continuum |
| UI ↔ file | **Live two-way** sync; **last write wins** on conflict |
| Chat transcripts | **Local app storage**; `CONTINUUM.md` holds summaries / structured state |
| Snapshots as separate objects | **Out of MVP** |

---

## 4. Vision

```text
                 CONTINUUM (desktop)
                        │
              CONTINUUM.md (DSL truth)
                        │
       ┌────────────────┼────────────────┐
       ↓                ↓                ↓
   Project Brain     Kanban/UI        Canvas
   (goal, arch,      (live sync)     (Bonscape-like
    decisions,                        chat nodes +
    handoff)                          branches)
       │                                  │
       └────────────┬─────────────────────┘
                    ↓
            Agent sessions
       ┌────────────┼────────────┐
       ↓                         ↓
  Claude CLI              Cursor (open app)
  (in-app terminal)       + curl → Continuum
```

Promise:

> **One project. Any agent. No lost context.**

---

## 5. Product Principles

1. **Project is source of truth** — agents are interchangeable; `CONTINUUM.md` stays.
2. **Context is portable** — open the folder elsewhere; the brain file travels with the repo.
3. **File-first** — UI and `curl` both converge on writing `CONTINUUM.md`.
4. **Progressive complexity** — simple board + brain first; canvas branching for power use.
5. **No paste handoffs** — continue = update state + open the right tool.
6. **Agents update when needed** — not spam; human can always edit.

---

## 6. Target Users

### Primary — Solo AI developer

Uses Claude CLI and/or Cursor on a local machine. Hits context limits, switches tools, loses decisions.

### Not primary for MVP

Teams, permissions, shared cloud projects (later).

---

## 7. Core Artifacts

### 7.1 Project (folder-bound)

User installs Continuum (desktop). Opens/picks the folder they want to work in. Continuum **locks** that folder as the project. User can pick/change folder again from Continuum.

On bind, Continuum creates **`CONTINUUM.md`** at the **repo root** if missing.

### 7.2 `CONTINUUM.md` — single root file

- Only Continuum project file at root (**no extra Continuum folders**)
- Contains:
  - Short **agent rules / DSL grammar** (how and when to update)
  - Full **project brain** in a **simple Mermaid-like DSL**
- DSL covers **full brain**, including at least:
  - Goal
  - Requirements
  - Architecture
  - Constraints
  - Current state / handoff
  - Tasks (Kanban columns)
  - Decisions
  - Activity (high level)
  - Canvas map metadata (node ids, titles, links — not full transcripts)

Agents (and humans) edit this file when project state meaningfully changes.

### 7.3 DSL runtime

Continuum parses the DSL blocks in `CONTINUUM.md` (clear start/end fences) and renders:

- Dashboard counts
- Kanban board
- Decision lists
- Canvas skeleton / links to chat nodes

Invalid or partial DSL: show parse errors; do not silently destroy user content (preserve raw file; last write wins on successful writes).

### 7.4 Live two-way sync

- Agent/user saves `CONTINUUM.md` → Continuum **file-watches** → UI updates live
- User edits Kanban/UI → Continuum **rewrites** the DSL in `CONTINUUM.md`
- Concurrent edit: **last write wins**; optional light “file changed” notice

### 7.5 Local app storage (not the portable brain)

Stores:

- Full **Claude CLI chat transcripts** per canvas node
- App settings (paths to `claude` / Cursor binaries, window state)
- Cache needed for canvas UX

Portable truth for “what we decided / what’s left” remains `CONTINUUM.md`.

---

## 8. Canvas (Bonscape-style + project layer)

Continuum canvas is a **visual AI workspace**:

- Nodes can be chats, decisions, tasks, or notes
- Edges = branches / relationships
- Spatial layout for exploring alternatives (not one endless scroll)

### Chat nodes (MVP)

- Each chat node runs **Claude CLI** through an **in-app terminal**
- No Continuum-owned provider API keys for chat
- Branching = new nodes / edges on the canvas, backed by CLI sessions where applicable

### Cursor on canvas / project

- Continuum can **open the Cursor app** on the project folder (one click)
- Cursor agent updates Continuum via **local HTTP `curl` commands**
- `CONTINUUM.md` includes a **guide**: how and when to `curl` (read context, update canvas/brain)

Cursor is not required to embed its full chat UI inside Continuum for MVP.

---

## 9. Local Continuum API (`curl`)

Continuum desktop exposes a **localhost** HTTP API for agents (especially Cursor).

### Capabilities

| Action | Purpose |
|--------|---------|
| **GET** | Pull current project context: decisions so far, tasks, handoff, canvas summary, etc. |
| **POST/PATCH** | Update canvas and/or project state |

### Write path (mandatory)

```text
curl → Continuum app → update in-memory/UI → write CONTINUUM.md
```

Agents should not be the only writer fighting the parser; the app owns serialization to the file.

### Auth (MVP)

Localhost-only. Simple shared local token or equivalent later if needed; MVP may start with localhost bind only.

---

## 10. Agent continue / handoff

### Goal

User does **not** paste context between tools.

### Claude

- One click / node action → Continuum ensures `CONTINUUM.md` is current → runs/focuses **Claude CLI** in project folder (in-app terminal)

### Cursor

- One click → Continuum ensures state is written → **opens Cursor** on that folder
- Cursor reads `CONTINUUM.md` and/or **`curl` GET** for latest decisions/handoff
- Cursor updates Continuum via **`curl`** when canvas/brain must change

### Who updates context

- **Primary:** agent updates when needed during/after work
- **Secondary:** human can always edit file or UI
- Agent should **not** write when nothing meaningful changed

---

## 11. Kanban

Default columns (adjustable later via DSL):

```text
BACKLOG | READY | IN PROGRESS | REVIEW | DONE
```

- Rendered from DSL in `CONTINUUM.md`
- Editable in UI (writes file back)
- Editable by agents (via file or via Continuum API → file)

Tasks may link to canvas nodes / decisions by id in the DSL.

---

## 12. Main navigation (MVP)

```text
CONTINUUM
├── Projects (open / switch folder)
├── Overview / Dashboard
├── Board (Kanban)
├── Brain (CONTINUUM.md view/edit)
├── Canvas
├── Agents (Claude terminal / Cursor launch + curl help)
└── Settings (CLI paths, Cursor path, local API)
```

---

## 13. Main user flows

### Flow A — New local project

```text
Install Continuum
  → Open / pick folder
  → Create CONTINUUM.md (template + grammar + empty brain)
  → Board + dashboard ready
  → Optional: open Canvas / Claude / Cursor
```

### Flow B — Work with Claude

```text
Open task or canvas chat node
  → In-app terminal runs Claude CLI in folder
  → Agent reads CONTINUUM.md
  → Agent updates CONTINUUM.md when needed
  → UI board/dashboard live-updates
```

### Flow C — Continue with Cursor

```text
Click Continue with Cursor
  → Continuum flushes state to CONTINUUM.md
  → Opens Cursor on folder
  → Cursor follows guide: curl GET context / edit as needed
  → curl updates → Continuum writes CONTINUUM.md → UI updates
```

### Flow D — Explore alternative (branch)

```text
On canvas, branch from a node
  → New chat node (Claude CLI) and/or forked decision path
  → Useful outcomes merged into CONTINUUM.md decisions/tasks
```

### Flow E — Human edits board

```text
Drag card on Kanban
  → Continuum rewrites DSL in CONTINUUM.md
  → Agents see new state on next read / curl GET
```

---

## 14. MVP scope

### In scope

- Desktop app (solo, local, no login)
- Bind project to one folder; create/maintain root `CONTINUUM.md`
- Full-brain **DSL** parse + render
- Live file watch + two-way Kanban/dashboard
- Bonscape-like **Canvas** (nodes, edges, branches)
- **Claude CLI** via in-app terminal for canvas chat nodes
- **Open Cursor** on project folder
- **Localhost `curl` API** (GET context, update canvas/state → write file)
- Agent guide embedded in `CONTINUUM.md`
- Basic search over structured brain fields (local)

### Out of scope (MVP)

- Cloud / Django multi-user backend
- Provider APIs inside Continuum (no Continuum-billed multi-model API chat)
- Snapshots as separate first-class product objects
- Team permissions / shared projects
- GitHub/PR/CI/CD/IDE replacement
- Full embed of Cursor’s own chat UI
- Semantic/AI search over all transcripts (optional later)

---

## 15. Post-MVP roadmap (indicative)

| Phase | Focus |
|-------|--------|
| Next | More launchers (e.g. Codex CLI), richer canvas UX, better conflict notices |
| Later | Optional API-backed multi-model canvas chats; optional account/sync |
| Later | Team collaboration, permissions |
| Later | Snapshots / time-travel if still needed beyond DSL history |

---

## 16. Explicit non-goals (near term)

- Replacing Cursor, Claude, or a full IDE
- Becoming generic Jira/Trello with weak AI
- Requiring cloud to work offline on one machine
- Forcing users to paste handoffs between agents

---

## 17. Recommended technology direction

PRD v1 assumed React + Django cloud. **That backend model is dropped for MVP.**

Suggested direction (implementation may refine):

| Layer | Direction |
|-------|-----------|
| Shell | Desktop (Tauri or Electron) |
| UI | React + TypeScript |
| Canvas | React Flow (or equivalent) |
| Local data | SQLite / app data for transcripts + settings |
| Truth file | `CONTINUUM.md` on disk |
| Local API | Localhost HTTP server inside the desktop app |
| Agents | System Claude CLI + Cursor install; no Continuum provider proxy |

Exact stack choices can be fixed at implementation time; product constraints above are binding.

---

## 18. Success metrics

- **Activation:** open folder → `CONTINUUM.md` created → board used
- **Continuity:** sessions continued via Claude terminal or Cursor without manual paste
- **Agent write-back:** meaningful updates to `CONTINUUM.md` or via `curl` after work
- **Handoff success:** next tool proceeds using file/`curl` GET without user re-explaining
- **North star:** cross-agent task progress with **no manual context reconstruction**

---

## 19. North star example

```text
Claude CLI (canvas node) works on auth
  → updates CONTINUUM.md (decisions + tasks)
  → board updates live
  → user clicks Continue with Cursor
  → Cursor opens on folder
  → curl GET → sees decisions so far
  → continues work → curl PATCH canvas/brain
  → Continuum writes CONTINUUM.md
  → nothing pasted, nothing lost
```

---

## 20. Differentiation

| Not this | Continuum is |
|----------|----------------|
| Trello + AI | Project brain + agents |
| Bonscape-only chat whiteboard | Bonscape-like canvas **plus** `CONTINUUM.md` + Kanban + tool launch |
| Another coding agent | Workspace **around** agents |
| Cloud context store | **Local file** as portable truth |

Fundamental abstraction:

```text
                 PROJECT FOLDER
                        │
                  CONTINUUM.md
                        │
              ┌─────────┴─────────┐
              ↓                   ↓
           HUMANS              AGENTS
         (UI / edit)     (Claude CLI / Cursor+curl)
              │                   │
              └─────────┬─────────┘
                        ↓
                 SHARED CONTEXT
```

---

## 21. Product promise

> **One project. Any agent. No lost context.**

Start in Claude CLI on the canvas, branch ideas visually, keep decisions in `CONTINUUM.md`, move a card on the board, open Cursor with one click, let Cursor `curl` the latest truth — without rebuilding the story by hand.

**Agents are replaceable. The project file is not.**

<!-- CONTINUUM AGENT GUIDE
Rules for Claude CLI / Cursor (and humans):

1. CONTINUUM.md is the project brain at repo root. Canvas media may live under .continuum/assets/ only.
2. Update the fenced continuum block when something meaningful changes (goal, tasks, decisions, handoff, canvas map).
3. Do NOT dump full chat transcripts into this file. Keep summaries short.
4. Prefer updating tasks/decisions/currentState/handoff after real progress.
5. If nothing meaningful changed, do not rewrite this file.
6. Canvas nodes: chat | note | image | link | decision | task.
   - image/link nodes use url= (project-relative path or https URL).
   - Agents may POST /api/canvas/nodes or /api/canvas/assets — same as the UI.

## Cursor local API (curl)

Continuum desktop exposes localhost HTTP. Default port 3927.

GET context (decisions, tasks, handoff, canvas):
  curl -s http://127.0.0.1:3927/api/context \
    -H "Authorization: Bearer $CONTINUUM_TOKEN"

Update brain / canvas (JSON body merges into brain):
  curl -s -X PATCH http://127.0.0.1:3927/api/context \
    -H "Authorization: Bearer $CONTINUUM_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"handoff":"Next: fix tests","currentState":"..."}'

Add link or note on canvas:
  curl -s -X POST http://127.0.0.1:3927/api/canvas/nodes \
    -H "Authorization: Bearer $CONTINUUM_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"type":"link","title":"Docs","url":"https://example.com","x":200,"y":120}'

Upload image to canvas (base64, lands in .continuum/assets/):
  curl -s -X POST http://127.0.0.1:3927/api/canvas/assets \
    -H "Authorization: Bearer $CONTINUUM_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"filename":"shot.png","dataBase64":"...","title":"Screenshot","x":240,"y":160}'

Create / move task:
  curl -s -X POST http://127.0.0.1:3927/api/tasks \
    -H "Authorization: Bearer $CONTINUUM_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"title":"Add login","status":"ready","priority":"high"}'

  curl -s -X PATCH http://127.0.0.1:3927/api/tasks/t1 \
    -H "Authorization: Bearer $CONTINUUM_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"status":"done"}'

Agent loop (ready → running+chat → done):
  curl -s -X POST http://127.0.0.1:3927/api/tasks/t1/start \
    -H "Authorization: Bearer $CONTINUUM_TOKEN"
  # → creates/links chat node, status=running; open that node in Continuum UI

  curl -s -X POST http://127.0.0.1:3927/api/tasks/t1/complete \
    -H "Authorization: Bearer $CONTINUUM_TOKEN"
  # → status=done; handoff points at next ready task

Token and port: Continuum Settings. Prefer curl GET before big Cursor work.
-->

# Continuum

Project brain lives in the fenced `continuum` block below.
Edit via Continuum UI, agents, or curl — Continuum keeps the board in sync.

```continuum
goal:
  Local desktop Continuum: one project folder, CONTINUUM.md brain, Hermes board + Bonscape canvas, agents (Claude CLI / Cursor curl) never lose context.

requirements:
  - CONTINUUM.md is sole structured source of truth at project root
  - Board: triage→done kanban; agents own work (no assignee UI)
  - Canvas: chat / image / link nodes; right-click tools; animated labeled edges
  - Agent loop: ready task → start (chat+running) → complete (done)
  - Localhost curl API on 127.0.0.1 for Cursor and scripts
  - No Continuum-owned cloud LLM keys; Claude via CLI, Cursor via open folder

architecture:
  - Electron main: project watch, localhost Express API, terminal, assets
  - React renderer: BoardPanel / CanvasPanel (React Flow) / BrainPanel
  - shared/: DSL parse-serialize, agentLoop, canvasPersist, types
  - UI ↔ file live sync; last write wins

constraints:
  - API binds 127.0.0.1 only; bearer token from Settings
  - Do not dump full chat transcripts into CONTINUUM.md
  - Canvas media only under .continuum/assets/
  - GPU disabled in Electron for stability on some hosts

currentState:
  MVP surfaces working while dogfooding Continuum on itself. Chrome, Hermes board, Bonscape canvas (menus, animated icon labels, image/link), agent loop helpers + tests, README ship checklist. All v0 board tasks done.

handoff:
  Dogfood: pick a ready task → Start agent → canvas chat → Mark done. Optional next: packaging (electron build) and polish empty states.

tasks:
  - [id=t1 status=done priority=high] Workspace chrome (tabs, status bar, branding)
  - [id=t2 status=done priority=high] Hermes board Jira-style cards (no assignee)
  - [id=t3 status=done priority=high] Bonscape: image/link nodes + assets API
  - [id=t4 status=done priority=high] Canvas right-click menus (add + node actions)
  - [id=t5 status=done priority=medium] Animated wires + icon edge labels
  - [id=t6 status=done priority=high notes=shared/agentLoop] Agent loop start/complete API + Start agent UI
  - [id=t7 status=done priority=high notes=shared/canvasPersist] Canvas persist merge guard + tests
  - [id=t8 status=done priority=medium] Ship checklist + README agent curl
  - [id=t9 status=ready priority=high link=n-main] Dogfood Start agent end-to-end on Continuum itself
  - [id=t10 status=todo priority=medium] Electron production package smoke
  - [id=t11 status=todo priority=low] Empty-state polish Board/Canvas/Brain
  - [id=t12 status=triage priority=low] Future: more agent adapters

decisions:
  - [id=d1] Agents own all work — no assignee field in UI
    reason: Board tracks agent workflow, not humans
  - [id=d2] Canvas tools via right-click, not toolbar
    reason: Cleaner Figma-like surface
  - [id=d3] CONTINUUM.md DSL fence is the brain; UI and curl merge into it
    reason: Project owns context across agents
  - [id=d4] Agent loop is start (chat+running) then complete (done)
    reason: One path for UI and Cursor curl

activity:
  - [2026-08-21T07:35:49.754Z] Continuum project initialized
  - [2026-08-21T07:40:47.900Z] MVP board slice completed (chrome→agent loop)
  - [2026-08-21T07:43:12.969Z] Brain + canvas map refreshed for dogfood Continuum repo
  - [2026-08-21T07:43:21.717Z] Updated from Continuum UI
  - [2026-08-21T07:43:32.144Z] Updated from Continuum UI
  - [2026-08-21T07:43:35.309Z] Updated from Continuum UI
  - [2026-08-21T07:43:43.026Z] Updated from Continuum UI
  - [2026-08-21T07:43:45.638Z] Updated from Continuum UI
  - [2026-08-21T07:43:50.169Z] Updated from Continuum UI
  - [2026-08-21T07:44:02.036Z] Updated from Continuum UI
  - [2026-08-21T07:44:20.689Z] Updated from Continuum UI
  - [2026-08-21T07:44:40.185Z] Updated from Continuum UI
  - [2026-08-21T07:44:51.692Z] Updated from Continuum UI
  - [2026-08-21T07:53:25.690Z] Updated from Continuum UI
  - [2026-08-21T07:54:04.572Z] Updated from Continuum UI
  - [2026-08-21T07:54:25.533Z] Updated from Continuum UI
  - [2026-08-21T07:57:05.234Z] Updated from Continuum UI
  - [2026-08-21T07:57:08.631Z] Updated from Continuum UI
  - [2026-08-21T07:57:11.443Z] Updated from Continuum UI
  - [2026-08-21T07:57:14.871Z] Updated from Continuum UI
  - [2026-08-21T07:57:21.885Z] Updated from Continuum UI
  - [2026-08-21T07:57:23.952Z] Updated from Continuum UI
  - [2026-08-21T07:57:28.243Z] Updated from Continuum UI
  - [2026-08-21T07:57:33.595Z] Updated from Continuum UI
  - [2026-08-21T07:57:42.733Z] Updated from Continuum UI
  - [2026-08-21T07:57:47.682Z] Updated from Continuum UI
  - [2026-08-21T07:57:56.015Z] Updated from Continuum UI
  - [2026-08-21T07:58:00.069Z] Updated from Continuum UI
  - [2026-08-21T07:58:04.602Z] Updated from Continuum UI
  - [2026-08-21T07:58:11.269Z] Updated from Continuum UI
  - [2026-08-21T07:58:16.316Z] Updated from Continuum UI
  - [2026-08-21T07:58:19.598Z] Updated from Continuum UI

canvas:
  nodes:
    - [id=n-brain type=note x=256 y=88] Brain
      summary: CONTINUUM.md goal / decisions / handoff
    - [id=n-board type=note x=520 y=480] Hermes Board
      summary: Kanban triage→done · Start agent
    - [id=n-main type=chat x=208 y=304] Main agent thread
      summary: Claude CLI dock for Continuum dogfood
    - [id=n-canvas type=note x=632 y=72] Bonscape Canvas
      summary: Right-click add · animated edges
    - [id=n-readme type=link x=760 y=384] README
      url: https://github.com/Haroon966/Continuum
      summary: Ship checklist + curl
    - [id=n-hermes type=link x=176 y=472] Hermes Kanban
      url: https://hermes-agent.nousresearch.com/docs/user-guide/features/kanban
    - [id=n-bonscape type=link x=960 y=72] Bonscape
      url: https://bonscape.com/
  edges:
    - [id=e1] n-brain -> n-main label=seeded
    - [id=e2] n-main -> n-board label=code
    - [id=e3] n-main -> n-canvas label=agent
    - [id=e4] n-board -> n-hermes label=link
    - [id=e5] n-canvas -> n-bonscape label=link
    - [id=e6] n-brain -> n-readme label=docs
    - [id=e1787298280070] n-board -> n-board label=link
```

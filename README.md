# Continuum

Local desktop app: **one project, any agent, no lost context.**

Source of truth per project folder: root `CONTINUUM.md` (Mermaid-like continuum DSL).

## Run

```bash
npm install
npm run electron:dev
```

Build:

```bash
npm run build
```

Tests:

```bash
npm test
```

## MVP features (PRD v2)

- Open / lock one local folder
- Auto-create `CONTINUUM.md` with agent guide + DSL
- Live two-way Kanban ↔ file (last write wins)
- Brain editor (goal, requirements, architecture, constraints, handoff, decisions)
- Bonscape-style canvas (nodes, edges, branch)
- Claude CLI in-app terminal (chat nodes / Agents)
- Continue with Cursor (opens Cursor on folder)
- Localhost API for Cursor agents (`curl` GET/PATCH)
- Local transcript logs (app data; not dumped into `CONTINUUM.md`)
- Search over structured brain fields

## Cursor curl

With Continuum running and a project open (token in **Settings** / `CONTINUUM_TOKEN` in Continuum terminals):

```bash
curl -s http://127.0.0.1:3927/api/context \
  -H "Authorization: Bearer $CONTINUUM_TOKEN"

curl -s -X PATCH http://127.0.0.1:3927/api/context \
  -H "Authorization: Bearer $CONTINUUM_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"handoff":"Next: …"}'
```

Full guide is also embedded at the top of every `CONTINUUM.md`.

## Product spec

See `prd.md`.
# Continuum

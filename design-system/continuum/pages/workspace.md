# Continuum — Workspace (Hermes + Bonscape)

## Board mode (Hermes Agent kanban)
- Columns: `triage → todo → ready → running → blocked → done`
- Per-column `+` create; drag-and-drop
- Drawer: title, status, priority, notes · **Start agent** / **Mark done** (no assignee)
- Links task ↔ canvas chat via agent loop

## Canvas mode (Bonscape)
- Right-click empty → Add Chat/Image/Link + tools; right-click node → Branch/Duplicate/Delete
- Animated wires with icon labels (`seeded` / `code` / `agent` / `link`)
- Smart routing: floating side attach + smooth-step A* around node boxes (simple connect preview)
- Keys: V/H, Space pan, scroll pan, Shift marquee, ⌘D, Del, Fit
- Images in `.continuum/assets/`; agents: `POST /api/canvas/nodes` · `/assets` · `/tasks/:id/start|complete`

## Brain
- CONTINUUM.md DSL: goal, requirements, architecture, decisions, handoff, canvas map

## References
- https://hermes-agent.nousresearch.com/docs/user-guide/features/kanban
- https://bonscape.com/

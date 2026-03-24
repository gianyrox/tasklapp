# TaskLapp -- Nucleus-Managed Project

Productivity and task management application. Tier 1 active product with revenue potential.

Part of AGFarms venture studio. Org dashboard: https://nucleus.agfarms.dev/admin

## Nucleus Connection

- **Instance ID**: tasklapp
- **Dashboard**: https://tasklapp.nucleus.agfarms.dev/admin
- **API**: https://tasklapp.nucleus.agfarms.dev
- **Auth**: username=nucleus password=REDACTED_ROTATED_2026_04_14
- **Bead Prefix**: tsk-
- **Org**: AGFarms (parent: https://nucleus.agfarms.dev)

## Repos

| Repo | Purpose |
|------|---------|
| tasklapp | Main application (gianyrox GitHub org) |

GitHub: gianyrox (personal). Clone with: `gh repo clone gianyrox/tasklapp`

## Bead Tracking

All task tracking uses the hosted Nucleus API. **Always include `-u "nucleus:REDACTED_ROTATED_2026_04_14"` for auth.**

```bash
# List all beads
curl -s -u "nucleus:REDACTED_ROTATED_2026_04_14" https://tasklapp.nucleus.agfarms.dev/issues | python3 -m json.tool

# Show one bead
curl -s -u "nucleus:REDACTED_ROTATED_2026_04_14" https://tasklapp.nucleus.agfarms.dev/issues/BEAD_ID

# Create a bead
curl -s -u "nucleus:REDACTED_ROTATED_2026_04_14" -X POST https://tasklapp.nucleus.agfarms.dev/issues \
  -H "Content-Type: application/json" \
  -d '{"title":"My task","description":"Details","issue_type":"task","priority":2,"parent":"EPIC_ID"}'

# Claim work (set in_progress)
curl -s -u "nucleus:REDACTED_ROTATED_2026_04_14" -X PATCH "https://tasklapp.nucleus.agfarms.dev/issues/BEAD_ID" \
  -H "Content-Type: application/json" -d '{"status":"in_progress"}'

# Close a bead
curl -s -u "nucleus:REDACTED_ROTATED_2026_04_14" -X PATCH "https://tasklapp.nucleus.agfarms.dev/issues/BEAD_ID?force=true" \
  -H "Content-Type: application/json" -d '{"status":"closed"}'

# Search brain
curl -s -u "nucleus:REDACTED_ROTATED_2026_04_14" "https://tasklapp.nucleus.agfarms.dev/api/brain/search?q=QUERY"

# Ingest content
curl -s -u "nucleus:REDACTED_ROTATED_2026_04_14" -X POST https://tasklapp.nucleus.agfarms.dev/api/intake/submit \
  -H "Content-Type: application/json" -d '{"url":"...","title":"...","content":"..."}'
```
## Quality Gates

Before committing, ensure:
1. Tests pass (if test suite exists)
2. Linting passes (if linter configured)
3. Pre-commit hooks pass (if configured)

## Commit Convention

Use [Conventional Commits](https://www.conventionalcommits.org/):
```
type(scope): description
```
Types: feat, fix, refactor, test, docs, chore, perf

## Workflow

1. `curl -s -u "nucleus:REDACTED_ROTATED_2026_04_14" https://tasklapp.nucleus.agfarms.dev/issues` -- list beads
2. Claim: `curl -s -u "nucleus:REDACTED_ROTATED_2026_04_14" -X PATCH URL/issues/ID -H "Content-Type: application/json" -d '{"status":"in_progress"}' ` 
3. Do the work, commit, push
4. Close: `curl ... -X PATCH URL/issues/ID?force=true -d '{"status":"closed"}' `

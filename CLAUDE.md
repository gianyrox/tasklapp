# TaskLapp -- Nucleus-Managed Project

Productivity and task management application. Tier 1 active product with revenue potential.

Part of AGFarms venture studio. Org dashboard: https://nucleus.agfarms.dev/admin

## Nucleus Connection

- **Instance ID**: tasklapp
- **Dashboard**: https://tasklapp.nucleus.agfarms.dev/admin
- **API**: https://tasklapp.nucleus.agfarms.dev
- **Auth**: set `NUCLEUS_ADMIN_USER` and `NUCLEUS_ADMIN_PASSWORD` env vars (never commit credentials)
- **Bead Prefix**: tsk-
- **Org**: AGFarms (parent: https://nucleus.agfarms.dev)

## Repos

| Repo | Purpose |
|------|---------|
| tasklapp | Main application (gianyrox GitHub org) |

GitHub: gianyrox (personal). Clone with: `gh repo clone gianyrox/tasklapp`

## Bead Tracking

All task tracking uses the hosted Nucleus API. Set `NUCLEUS_ADMIN_USER` and `NUCLEUS_ADMIN_PASSWORD` env vars before running these commands, then reference them as `-u "$NUCLEUS_ADMIN_USER:$NUCLEUS_ADMIN_PASSWORD"`.

```bash
# List all beads
curl -s -u "$NUCLEUS_ADMIN_USER:$NUCLEUS_ADMIN_PASSWORD" https://tasklapp.nucleus.agfarms.dev/issues | python3 -m json.tool

# Show one bead
curl -s -u "$NUCLEUS_ADMIN_USER:$NUCLEUS_ADMIN_PASSWORD" https://tasklapp.nucleus.agfarms.dev/issues/BEAD_ID

# Create a bead
curl -s -u "$NUCLEUS_ADMIN_USER:$NUCLEUS_ADMIN_PASSWORD" -X POST https://tasklapp.nucleus.agfarms.dev/issues \
  -H "Content-Type: application/json" \
  -d '{"title":"My task","description":"Details","issue_type":"task","priority":2,"parent":"EPIC_ID"}'

# Claim work (set in_progress)
curl -s -u "$NUCLEUS_ADMIN_USER:$NUCLEUS_ADMIN_PASSWORD" -X PATCH "https://tasklapp.nucleus.agfarms.dev/issues/BEAD_ID" \
  -H "Content-Type: application/json" -d '{"status":"in_progress"}'

# Close a bead
curl -s -u "$NUCLEUS_ADMIN_USER:$NUCLEUS_ADMIN_PASSWORD" -X PATCH "https://tasklapp.nucleus.agfarms.dev/issues/BEAD_ID?force=true" \
  -H "Content-Type: application/json" -d '{"status":"closed"}'

# Search brain
curl -s -u "$NUCLEUS_ADMIN_USER:$NUCLEUS_ADMIN_PASSWORD" "https://tasklapp.nucleus.agfarms.dev/api/brain/search?q=QUERY"

# Ingest content
curl -s -u "$NUCLEUS_ADMIN_USER:$NUCLEUS_ADMIN_PASSWORD" -X POST https://tasklapp.nucleus.agfarms.dev/api/intake/submit \
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

1. `curl -s -u "$NUCLEUS_ADMIN_USER:$NUCLEUS_ADMIN_PASSWORD" https://tasklapp.nucleus.agfarms.dev/issues` -- list beads
2. Claim: `curl -s -u "$NUCLEUS_ADMIN_USER:$NUCLEUS_ADMIN_PASSWORD" -X PATCH URL/issues/ID -H "Content-Type: application/json" -d '{"status":"in_progress"}' `
3. Do the work, commit, push
4. Close: `curl ... -X PATCH URL/issues/ID?force=true -d '{"status":"closed"}' `

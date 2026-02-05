# OpenSpec - Spec-Driven Development

This project uses OpenSpec for structured, spec-driven development with AI coding assistants.

## Naming Convention

Changes use prefix-based naming to indicate scope:

| Prefix | Scope | Example |
|--------|-------|---------|
| (none) | Cross-app (frontend + backend) | `add-payment-gateway` |
| `fe-`  | Frontend only | `fe-add-book-filters` |
| `be-`  | Backend only | `be-optimize-book-query` |

### When to Use Each Prefix

**No prefix** - Use when the change requires both frontend and backend work:
- Adding a new feature with API endpoints and UI
- Implementing authentication flows
- Adding new data models that need UI components

**`fe-` prefix** - Use when the change only touches frontend code:
- UI component improvements
- Frontend state management changes
- Styling and layout updates
- Client-side validation

**`be-` prefix** - Use when the change only touches backend code:
- API endpoint optimizations
- Database query improvements
- New backend services
- Migration scripts

## Quick Start

```bash
# Cross-app feature (no prefix)
/opsx:new add-payment-gateway

# Frontend only
/opsx:new fe-add-book-filters

# Backend only
/opsx:new be-optimize-book-query

# Continue working on a change
/opsx:continue <change-name>

# Fast-forward: create all artifacts at once
/opsx:ff <change-name>

# Implement tasks
/opsx:apply <change-name>

# Verify implementation
/opsx:verify <change-name>

# Archive completed change
/opsx:archive <change-name>
```

## Commands Reference

| Command | Description |
|---------|-------------|
| `/opsx:explore` | Think through problems before committing to a change |
| `/opsx:new` | Start a new change, step-by-step artifact creation |
| `/opsx:ff` | Fast-forward: create all artifacts in one go |
| `/opsx:continue` | Continue an existing change (next artifact) |
| `/opsx:apply` | Implement tasks from a change |
| `/opsx:verify` | Verify implementation matches specs |
| `/opsx:archive` | Archive completed change |
| `/opsx:bulk-archive` | Archive multiple changes at once |

## Change Artifacts

Each change folder contains:

```
openspec/changes/<change-name>/
├── proposal.md    # Why we're doing this, what's changing
├── specs/         # Detailed requirements (WHEN/THEN scenarios)
├── design.md      # Technical approach, decisions
└── tasks.md       # Implementation checklist
```

### Artifact Workflow

1. **Proposal** - Define the problem and scope
2. **Specs** - Write detailed requirements with WHEN/THEN scenarios
3. **Design** - Plan the technical implementation
4. **Tasks** - Break down into actionable items

## Directory Structure

```
openspec/
├── config.yaml        # Project configuration and context
├── README.md          # This file
├── changes/           # Active changes
│   ├── add-payment-gateway/      # Cross-app (no prefix)
│   ├── fe-add-book-filters/      # Frontend only
│   ├── be-optimize-book-query/   # Backend only
│   └── archive/                  # Completed changes
└── specs/             # Main specs (synced from changes)
```

## Tips

- Use `/opsx:explore` first if you're unsure about the approach
- Keep change names descriptive but concise
- One change = one logical unit of work
- Archive changes after verification to keep the workspace clean

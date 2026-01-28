---
description: Run code quality checks (Typecheck)
---

1. Run the type checker for the entire workspace
   - Command: `pnpm typecheck`
   - If there are errors:
     - Fix the TypeScript errors.
     - Re-run the check until it passes.
2. (Optional) Run linting if enabled
   - Note: Linting is currently disabled/commented out in the source rule, but check if `pnpm lint` is available and relevant.

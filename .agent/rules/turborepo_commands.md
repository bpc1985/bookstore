---
description: Run a package-scoped command in the monorepo
---

1. Identify the target package
   - Determine if the command is for `apps/backend`, `apps/frontend`, `packages/types`, etc.
2. Determine the package name
   - Check `package.json` in the target directory (e.g., `@bookstore/backend`).
3. Construct the command
   - Format: `pnpm --filter=<package_name> <command>`
   - Example: `pnpm --filter=@bookstore/backend add express`
4. Run from Root
   - Execute the constructed command from the repository root.
   - **DO NOT** `cd` into the directory.

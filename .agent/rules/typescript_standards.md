---
description: write High-Quality TypeScript Code
---

1. Type Definitions
   - **Strict Mode**: Ensure no implicit `any`.
   - **Imports**: Prefer types from `@bookstore/types`.
   - **Location**: Define composite types in `types/` or co-located files.

2. Implementation
   - **Safety**: Use discriminated unions for state.
   - **Validation**: Use Zod or `class-validator` at boundaries (API/Forms).
   - **Generics**: Use constraints/defaults properly.

3. Build & Check
   - Command: `pnpm typecheck`.
   - Goal: Zero typescript errors before commit.

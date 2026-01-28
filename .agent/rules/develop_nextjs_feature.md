---
trigger: model_decision
description: Develop with Next.js App Router and Server Actions
---

1. data Fetching Strategy
   - **Server Components**: Fetch data directly in `page.tsx`.
   - **Client Interaction**: Pass data as props or use Server Actions.
   - **Forbidden**: DO NOT create internal API routes (`app/api/...`) for frontend usage.
   - **Allowed**: API routes only for external webhooks/public APIs.

2. Server Actions Implementation
   - Pattern: Create action in `actions/` folder.
   - Security: Validate inputs (Zod), check Authentication (`getServerSession`).
   - usage: Import directly in Client Components.

3. Components
   - Default to Server Components.
   - Add `'use client'` only when hook/event needed.

4. Performance
   - optimization: Use `next/image`, `next/font`.
   - Metadata: Define `generateMetadata` for SEO.

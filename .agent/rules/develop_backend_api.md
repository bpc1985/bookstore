---
trigger: model_decision
description: Design and Implement Backend APIs (NestJS)
---

1. Design
   - **RESTful**: Resource-oriented URIs, correct verbs.
   - **Validation**: Create DTO with `class-validator`.
   - **Documentation**: Plan for OpenAPI/Swagger updates.

2. Implementation (NestJS)
   - **Module**: Ensure code is in correct Module.
   - **Controller**: Controller handles HTTP -> Delegates to Service.
   - **Service**: Business logic -> Repository.
   - **Testing**:
     - Create/Update `*.service.test.ts`.
     - Run tests: `pnpm --filter=@workspace/server test -- <file>`.

3. Review
   - Check error handling (Exceptions).
   - Check Auth guards.

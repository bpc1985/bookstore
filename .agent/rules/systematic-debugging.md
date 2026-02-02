---
trigger: model_decision
description: Four-phase debugging methodology with root cause analysis. Use when investigating bugs, fixing test failures, or troubleshooting unexpected behavior.
---

# Systematic Debugging

## Core Principle

**NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST.**

Never apply symptom-focused patches that mask underlying problems. Understand WHY something fails before attempting to fix it.

## The Four-Phase Framework

### Phase 1: Root Cause Investigation

Before touching any code:

1. **Read error messages thoroughly** - Every word matters
2. **Reproduce the issue consistently** - If you can't reproduce it, you can't verify a fix
3. **Examine recent changes** - What changed before this started failing?
4. **Gather diagnostic evidence** - Logs, stack traces, network requests
5. **Trace data flow** - Follow the call chain to find where bad values originate

**Root Cause Tracing Technique:**

```
1. Observe the symptom     → Where does the error manifest?
2. Find immediate cause    → Which code directly produces the error?
3. Ask "What called this?" → Map the call chain upward
4. Keep tracing up         → Follow invalid data backward through the stack
5. Find original trigger   → Where did the problem actually start?
```

**Key principle:** Never fix problems solely where errors appear—always trace to the original trigger.

### Phase 2: Pattern Analysis

1. **Locate working examples** - Find similar code that works correctly
2. **Compare implementations completely** - Don't just skim
3. **Identify differences** - What's different between working and broken?
4. **Understand dependencies** - What does this code depend on?

### Phase 3: Hypothesis and Testing

Apply the scientific method:

1. **Formulate ONE clear hypothesis** - "The error occurs because X"
2. **Design minimal test** - Change ONE variable at a time
3. **Predict the outcome** - What should happen if hypothesis is correct?
4. **Run the test** - Execute and observe
5. **Verify results** - Did it behave as predicted?
6. **Iterate or proceed** - Refine hypothesis if wrong, implement if right

### Phase 4: Implementation

1. **Create failing test case** - Captures the bug behavior
2. **Implement single fix** - Address root cause, not symptoms
3. **Verify test passes** - Confirms fix works
4. **Run full test suite** - Ensure no regressions
5. **If fix fails, STOP** - Re-evaluate hypothesis

**Critical rule:** If THREE or more fixes fail consecutively, STOP. This signals architectural problems requiring discussion, not more patches.

## Project-Specific Debugging

### Frontend Issues

```bash
# Check for TypeScript errors
pnpm typecheck

# Check browser console for:
# - Network errors (API calls failing)
# - React errors (component crashes)
# - Auth issues (token problems)

# Check Zustand store state
# In browser console:
useAuthStore.getState()
useCartStore.getState()
```

### Backend Issues

```bash
# Check FastAPI logs (runs with --reload)
pnpm backend:dev

# Check database state
sqlite3 apps/backend/bookstore.db ".tables"
sqlite3 apps/backend/bookstore.db "SELECT * FROM users LIMIT 5;"

# Reset database if needed
rm apps/backend/bookstore.db
pnpm backend:migrate
pnpm backend:seed
```

### API Integration Issues

```bash
# Test API endpoint directly
curl http://localhost:8000/health
curl http://localhost:8000/books

# Check CORS (browser console Network tab)
# Check Authorization header is being sent
# Check token expiration (15 min access, 7 day refresh)
```

## Common Debugging Scenarios

### Test Failures

```
1. Read the FULL error message and stack trace
2. Identify which assertion failed and why
3. Check test setup - is the test environment correct?
4. Check test data - are mocks/fixtures correct?
5. Trace to the source of unexpected value
```

### Runtime Errors

```
1. Capture the full stack trace
2. Identify the line that throws
3. Check what values are undefined/null
4. Trace backward to find where bad value originated
5. Add validation at the source
```

### "It worked before"

```
1. Use git bisect to find the breaking commit
   git bisect start
   git bisect bad HEAD
   git bisect good <last-known-good-commit>
2. Compare the change with previous working version
3. Identify what assumption changed
4. Fix at the source of the assumption violation
```

### Intermittent Failures

```
1. Look for race conditions
2. Check for shared mutable state
3. Examine async operation ordering
4. Look for timing dependencies
5. Add deterministic waits or proper synchronization
```

### Auth Issues

```
1. Check if tokens exist in localStorage
2. Verify token is being sent in Authorization header
3. Check token expiration (jwt.io to decode)
4. Verify backend is validating correctly
5. Check CORS preflight for auth endpoints
```

## Red Flags - Stop Immediately

Stop if you catch yourself:

- "Quick fix for now, investigate later"
- "One more fix attempt" (after multiple failures)
- "This should work" (without understanding why)
- "Let me just try..." (without hypothesis)

## Warning Signs of Deeper Problems

**Consecutive fixes revealing new problems in different areas** indicates architectural issues:

- Stop patching
- Document what you've found
- Consider if the design needs rethinking
- May need to refactor rather than patch

## Debugging Checklist

Before claiming a bug is fixed:

- [ ] Root cause identified and documented
- [ ] Hypothesis formed and tested
- [ ] Fix addresses root cause, not symptoms
- [ ] Failing test created that reproduces bug
- [ ] Test now passes with fix
- [ ] `pnpm typecheck` passes
- [ ] No "quick fix" rationalization used
- [ ] Fix is minimal and focused

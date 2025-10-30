---
description: Implement a task from the implementation plan with full context and workflow
---

I need your help implementing a task from the DubbingLabs implementation plan.

**Task Number:** $1

## Context Strategy

This workflow implements a task with **CLEAN CONTEXT** using only task documentation.

**IMPORTANT:** You should have already run `/pre-implement $1` to generate task documentation. If not, stop and run `/pre-implement $1` first.

**Why:** Task documentation is self-sufficient and contains all necessary context. Loading PRD, Architecture, and UI Design documents would waste context window space.

## Phase 0: Context Setup

### Step 0.1: Discover Task Folder Name

**FIRST: Find the full task folder name:**
1. Use Glob tool with pattern: `docs/05-implementation/tasks/$1-*/specs.md`
2. This will return a file path like `docs/05-implementation/tasks/0.6-initial-frontend-shell/specs.md`
3. Extract the folder name from the path (e.g., `0.6-initial-frontend-shell`)
4. Store this folder path for use in subsequent steps
5. If no file found, stop and inform user to run `/pre-implement $1` first

**Important:** All subsequent file operations should use this discovered folder path.

### Step 0.2: Check Implementation Progress

**CRITICAL: Determine if this is a continuation or fresh start:**

1. Read `tasks.md` from the discovered task folder
2. Count completed tasks (marked with `[x]`)
3. Count pending tasks (marked with `[ ]`)
4. Identify the next pending phase/step

**If partially complete:**
- Inform user: "Found X completed tasks, Y pending tasks"
- Show the next pending phase/step to be implemented
- Ask user: "Should I continue from [next phase], or start over?"
- Skip loading documentation for already-completed phases

**If starting fresh:**
- Proceed with full implementation from the beginning

**Resume Strategy:**
- Load only the documentation needed for remaining phases
- Preserve all completed work
- Continue marking tasks as complete in real-time

### Step 0.3: Load Task Documentation

**Documents to Load (Read tool) from the discovered task folder:**
1. `specs.md`
2. `design.md`
3. `tasks.md`
4. `troubleshooting.md`

**Conditional Documents (Load if they exist):**
- `api.md` - If task involves API endpoints
- `database.md` - If task involves database changes
- `ui-specs.md` - If task involves UI components

**DO NOT Load:**
- ❌ `docs/01-product/prd.md`
- ❌ `docs/03-architecture/architecture.md`
- ❌ `docs/02-design/ui-design.md`

**Why:** These documents are large and all relevant information has been embedded in task docs' Task Context Summary sections.

**Note:** If resuming partially completed work, you may already be familiar with these documents from previous sessions.

### Step 0.4: Load Project Standards

**Documents to Load (Read tool):**
1. `CLAUDE.md` - Project instructions and workflows (if not already loaded)
2. `docs/10-processes/coding-standards.md` - Coding standards (if not already loaded)

### Step 0.5: Load Related Schemas (If Applicable)

**Load ONLY if referenced in task documentation:**
- Database schemas from `packages/supabase/migrations/`
- API contract schemas from `packages/api-contract/src/`

## Phase 1: Pre-Implementation

**Note:** If resuming partially completed work and already past this phase, skip to Phase 2.

### Step 1.1: Review Task Context

1. **Read Task Context Summary** from specs.md:
   - Architectural context
   - Technology constraints
   - Non-functional requirements
   - Integration points

2. **Review Implementation Checkpoints** from tasks.md:
   - Understand validation points at critical phases
   - Note what needs to be verified after each phase
   - Focus on checkpoints for remaining phases

3. **Identify missing/unclear information:**
   - If anything is unclear, request clarification
   - Flag for review if documentation is incomplete

### Step 1.2: Verify Development Environment

**Check Prerequisites:**
- [ ] All prerequisite tasks are completed
- [ ] Development environment is ready (dependencies installed)
- [ ] Required services are running (Supabase, Redis, etc.)
- [ ] Environment variables are configured

**If resuming:** Verify environment is still properly configured since last session.

## Phase 2: Implementation

**Note:** If resuming, start from the next pending task in tasks.md. Skip already completed components.

### Step 2.1: Implement Following Coding Standards

**Mandatory Requirements:**
- Error handling for all functions (never happy-path-only code)
- JSDoc (TypeScript) or Google-style docstrings (Python) for all functions
- Input validation at function entry
- Try-catch blocks for all async operations

**Implementation Order:**
- Follow tasks.md checklist sequentially, starting from next pending task
- Implement one component at a time
- Self-review against technical design after each component

### Step 2.2: Mark Completed Tasks in tasks.md

**CRITICAL: Real-Time Progress Tracking**

After each task is successfully completed:
1. Open `tasks.md` in the discovered task folder
2. Find the corresponding checkbox for the completed task
3. Change `- [ ]` to `- [x]`
4. Save the file

**Why:**
- Provides real-time progress visibility
- Prevents forgetting completed tasks
- Helps resume work if interrupted

**Example:**
```markdown
# Before:
- [ ] Create migration file: `YYYYMMDDHHMMSS_description.sql`

# After completing successfully:
- [x] Create migration file: `YYYYMMDDHHMMSS_description.sql`
```

### Step 2.3: Self-Review Code

After implementation, verify:
- [ ] Matches technical design from design.md
- [ ] Follows coding standards (error handling + documentation)
- [ ] Consistent with patterns from previous tasks
- [ ] All ADRs are followed

## Phase 3: Error Resolution

**Note:** Always run this phase after implementing new code, even when resuming.

### Step 3.1: Fix Type Errors

1. Run type-check: `npm run type-check`
2. Fix errors one at a time
3. Re-run type-check after each fix
4. **Maximum 5 attempts** → Then flag for review

### Step 3.2: Fix Lint Errors

1. Run lint: `npm run lint`
2. Fix errors one at a time
3. Re-run lint after each fix
4. **Maximum 3 attempts** → Then flag for review

### Step 3.3: Code Formatting

Run: `npm run format`

## Phase 4: Testing

**Note:** Run tests for newly implemented code. If resuming and tests already pass, verify no regressions.

### Step 4.1: Unit Tests

1. Run unit tests: `npm run test`
2. For each failure:
   - Analyze root cause
   - Fix the issue
   - Re-run type-check
   - Re-run lint
   - Re-run tests
   - **Maximum 5 attempts per test** → Then flag for review

3. Verify coverage >80%

### Step 4.2: Integration Tests

1. Run integration tests
2. For each failure:
   - Analyze root cause
   - Fix the issue
   - Re-run type-check
   - Re-run lint
   - Re-run tests
   - **Maximum 5 attempts per test** → Then flag for review

### Step 4.3: Manual Verification (If UI/UX Feature)

- Test user flows manually
- Verify UI matches design specifications
- Test error states and edge cases

### Step 4.4: Document Test Results

Create test execution report in the `test-results/` subfolder of the discovered task folder:
`test-results/YYYY-MM-DD-test-execution.md`

**Include:**
- Test summary (total, passed, failed)
- Coverage report
- Any issues encountered and resolutions
- Manual verification results (if applicable)

### Step 4.5: Mark Completed Test Tasks

**Update tasks.md:**
- Mark all test-related tasks as complete
- Verify test checkpoints are satisfied

## Phase 5: Quality Assurance

### Step 5.1: Technical Design Compliance

**Verify against design.md:**
- [ ] All components implemented as designed
- [ ] All ADRs followed
- [ ] No deviations without documentation

**If deviations exist:**
- Document why deviation was necessary
- Update design.md or create new ADR

### Step 5.2: Code Compliance Agent

Run code-compliance agent:
1. Fix all critical issues
2. Document any false positives
3. Re-run until approved

### Step 5.3: Documentation Compliance Agent

Run documentation-compliance agent:
1. Fix all issues
2. Verify all cross-references are valid
3. Re-run until approved

### Step 5.4: Check for Side Effects/Regressions

**Run full test suite:**
- Backend: `cd apps/backend && pytest`
- Frontend: `cd apps/web && npm run test`
- API Contract: `cd packages/api-contract && npm run test`

**If regressions found:**
- Fix or document why acceptable
- Update tests if necessary

## Phase 6: Completion

### Step 6.1: Verify All Tasks Complete

**Check tasks.md:**
- [ ] All implementation tasks marked complete
- [ ] All test tasks marked complete
- [ ] All validation checkpoints satisfied

### Step 6.2: Generate Implementation Summary

Create summary report in the discovered task folder:
`implementation-summary.md`

**Include:**
- What was implemented
- Any deviations from design
- Test results summary
- Known issues or limitations
- Next steps (if any)

### Step 6.3: Update Implementation Plan

1. Open `docs/04-planning/implementation-plan.md`
2. Mark Task $1 checkbox as complete: `- [x]`
3. Add completion date

### Step 6.4: Create ADR (If Applicable)

**If significant architectural decision was made during implementation:**
- Create ADR in `docs/03-architecture/decisions/`
- Follow ADR template
- Document WHY the decision was made

### Step 6.5: Final Review

**Flag for review if:**
- [ ] Any iteration limits were reached
- [ ] Breaking changes were required
- [ ] Security concerns discovered
- [ ] Performance issues cannot be resolved
- [ ] Unclear requirements encountered

**Otherwise:**
- Confirm task is complete and ready for review

## Critical Rules

- **Never skip steps** - Each builds confidence in quality
- **Mark tasks complete immediately** - Update tasks.md checkboxes as soon as each task is done
- **Always re-run type-check and lint after code changes**
- **Never load PRD/Architecture/UI Design** - Use task docs only
- **Flag for review at iteration limits** - Don't get stuck in error loops
- **Use Implementation Checkpoints** - Validate at critical phases

## Success Criteria

Task $1 is complete when:
- [ ] All tasks in tasks.md marked complete
- [ ] All validation criteria from specs.md satisfied
- [ ] Unit test coverage >80%
- [ ] All integration tests pass
- [ ] Code-compliance agent approves
- [ ] Documentation-compliance agent approves
- [ ] No regressions in existing tests
- [ ] Implementation summary generated
- [ ] Implementation plan checkbox marked complete

## Ready to Start

Confirm you have:
1. Loaded all task documentation (specs.md, design.md, tasks.md, troubleshooting.md)
2. Loaded CLAUDE.md and coding-standards.md
3. Verified development environment is ready
4. Ready to begin implementation following tasks.md checklist

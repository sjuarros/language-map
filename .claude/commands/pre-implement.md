---
description: Generate comprehensive task documentation for a task from the implementation plan
---

I need your help generating comprehensive task documentation for a task from the DubbingLabs implementation plan.

**Task Number:** $1

## Context Strategy

This workflow generates task documentation with **FULL CONTEXT** loaded. After completion, you will clear context before starting implementation with the `/implement` command.

**Why:** PRD, Architecture, and UI Design documents are large but essential for planning. This workflow creates self-sufficient task documentation that eliminates the need to load these documents during implementation.

## Step 1: Check for Existing Documentation

**FIRST: Determine if documentation already exists:**

1. Use Glob to check: `docs/05-implementation/tasks/$1-*/specs.md`
2. If found, extract the folder name (e.g., `0.6-initial-frontend-shell`)
3. Check which documents already exist in the folder:
   - specs.md
   - design.md
   - tasks.md
   - troubleshooting.md
   - Conditional: api.md, database.md, ui-specs.md, security.md, performance.md

**If documentation exists:**
- Inform user: "Found existing documentation for Task $1"
- List which documents already exist
- Ask user: "Should I update/regenerate specific documents, or skip to implementation?"
- If user wants updates, ask which documents need regeneration

**If no documentation exists:**
- Proceed with full documentation generation (Steps 2-6)

## Step 2: Understand the Task

1. **Read the implementation plan:**
   - Use the docs MCP server to read `docs/04-planning/implementation-plan.md`
   - Locate Task $1 and extract:
     - Full task name
     - Objective
     - All subtasks/requirements
     - Phase (0, 1, or 2)

2. **Identify prerequisites:**
   - Determine which tasks come before $1
   - List all prerequisite tasks that must be completed first
   - Confirm prerequisites are marked as complete in the plan

## Step 3: Gather Full Context

**Note:** Only needed if generating new documentation (Step 1 determined no docs exist).

**Core Documentation (use docs MCP server):**
1. Search and read: Product Requirements (PRD)
2. Search and read: System Architecture
3. Search and read: UI/UX Design specifications
4. Search and read: Visual Style Guide
5. Search and read: Coding Standards
6. Search and read: Development Workflow
7. Search and read: Pre-implementation Workflow

**Learn from Previous Implementations:**
1. Search for ADRs (Architecture Decision Records) in `docs/03-architecture/decisions/`
2. Read technical designs from prerequisite tasks in `docs/05-implementation/tasks/`
3. Understand patterns, conventions, and architectural decisions already established
4. Note any relevant technology choices, error handling patterns, or design patterns

**Task-Specific Context:**
1. Search docs for content related to this task's domain
2. Review related API specifications if they exist
3. Review database schemas if applicable
4. Check for any existing technical debt or known issues

## Step 4: Generate Task Documentation

Following the **Pre-Implementation Workflow** (`docs/10-processes/pre-implementation-workflow.md`), create comprehensive documentation in:

`docs/05-implementation/tasks/$1-[task-name-slug]/`

**Folder Naming Convention:**
- Extract the task name from the implementation plan
- Convert to lowercase kebab-case (e.g., "Initial Frontend Shell" → "initial-frontend-shell")
- Full folder name format: `$1-task-name-slug` (e.g., `0.6-initial-frontend-shell`)

### Required Documents

**1. specs.md** (Functional Specifications)
- **Task Context Summary** (CRITICAL for self-sufficiency):
  - Architectural context (where this fits in the system)
  - Technology constraints (Next.js App Router, Supabase RLS, etc.)
  - Non-functional requirements (performance, security, scalability)
  - Integration points with other components
  - Database schema context
- Requirements traceability to PRD (with specific section numbers)
- Functional specifications for all features
- API endpoint specifications (if applicable)
- User interface specifications (if applicable)
- Non-functional requirements
- Validation criteria

**2. design.md** (Technical Design)
- Problem statement and current state
- High-level architecture
- Detailed component design with implementation details
- **Architecture Decision Records (ADRs)** - Document WHY, not just WHAT
- Database design (if applicable)
- API design (if applicable)
- Security considerations
- Performance considerations
- Testing strategy

**3. tasks.md** (Implementation Checklist)
- **Implementation Checkpoints** (CRITICAL for validation):
  - Checkpoint 1: After Database & Models
  - Checkpoint 2: After Core Logic
  - Checkpoint 3: After API/UI Implementation
  - Checkpoint 4: After Testing
  - Checkpoint 5: Before Completion
- Phase-by-phase task breakdown with checkboxes
- Dependencies between tasks
- Verification steps for each phase
- Test environment setup
- Unit test scenarios (>80% coverage)
- Integration test scenarios
- Expected coverage targets

**4. troubleshooting.md** (Proactive Troubleshooting)
- Common issues by category (environment, configuration, runtime, testing, deployment)
- Solutions with step-by-step instructions
- Debugging techniques
- Getting help (escalation criteria)

**5. Conditional Documents** (Create if applicable):
- `api.md` - If task involves API endpoints
- `database.md` - If task involves database changes
- `ui-specs.md` - If task involves complex UI
- `security.md` - If task has significant security considerations
- `performance.md` - If task has significant performance requirements

### Create Test Results Folder

Create subfolder for test execution reports:
`test-results/` (inside the task folder)

**Note:** Skip creating documents that already exist (unless user requested regeneration in Step 1).

## Step 5: Validate Documentation

1. **Run documentation-compliance agent** → Fix all issues
2. **Verify all cross-references use specific section numbers** (not just filenames)
3. **Ensure alignment with PRD, Architecture, UI Design**
4. **Check self-sufficiency:**
   - [ ] specs.md has complete Task Context Summary
   - [ ] specs.md has all NFRs specified (no references to PRD needed)
   - [ ] tasks.md has Implementation Checkpoints for all phases
   - [ ] design.md has complete ADRs with WHY explanations
   - [ ] No "See PRD section X" or "Refer to Architecture doc" references

**Goal:** Developer should NEVER need to open PRD, Architecture, or UI Design documents during implementation.

## Step 6: Generate Implementation Summary

Create `implementation-summary.md` with:
1. Executive summary of what will be built
2. Scope (in-scope vs out-of-scope)
3. Technical design highlights (ADR summary)
4. Testing approach
5. Implementation plan overview
6. Validation criteria summary
7. Risk mitigation strategies
8. Next steps (approval checklist)

**Note:** Skip if implementation-summary.md already exists and doesn't need updates.

## Step 7: Present for Review

After creating all documentation:
1. Summarize the technical approach
2. Highlight all Architecture Decision Records (ADRs)
3. Note any dependencies or risks
4. Confirm documentation is self-sufficient
5. Wait for approval before proceeding to implementation

**If documentation already existed:**
- Summarize what was regenerated/updated
- Confirm whether to proceed with `/implement $1` or if more updates are needed

**After Approval:**
- Inform user to run `/implement $1` to begin/continue implementation

## Critical Rules

- **Use docs MCP server** for all documentation retrieval
- **Learn from previous tasks** - maintain consistency with established patterns
- **Document WHY in ADRs** - not just WHAT
- **Make task docs self-sufficient** - embed all necessary context
- **Implementation Checkpoints are mandatory** - provide validation points
- **Flag for review** if unclear requirements or conflicting documentation

## Success Criteria

Documentation is complete when:
- [ ] All required documents created
- [ ] Task Context Summary is comprehensive
- [ ] Implementation Checkpoints defined for all phases
- [ ] ADRs document all significant decisions with WHY
- [ ] Documentation-compliance agent approves
- [ ] Self-sufficiency verified (no PRD/Architecture references needed)
- [ ] Implementation summary generated

## Ready to Start

Confirm you have:
1. Checked for existing documentation in `docs/05-implementation/tasks/$1-*/`
2. Read and understood Task $1 from implementation plan
3. Identified all prerequisites
4. Loaded all necessary context (PRD, Architecture, UI Design, previous tasks) if generating new docs
5. Ready to generate or update task documentation as needed

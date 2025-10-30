---
title: "GitHub CI/CD Setup"
description: Comprehensive GitHub Actions CI/CD setup for continuous integration, code quality checks, and automated dependency management
category: implementation
tags: [ci-cd, github-actions, automation, phase-1]
---

# GitHub CI/CD Setup

**Created:** October 30, 2025
**Part of:** Day 1 - Foundation Setup

## Overview

Comprehensive GitHub Actions CI/CD setup for continuous integration, code quality checks, and automated dependency management.

---

## 📋 Files Created

### 1. CI Workflow (`.github/workflows/ci.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

**Jobs:**

#### Job 1: Lint and Type Check
- Runs ESLint on codebase
- Runs TypeScript type checking
- Uses Node.js 20.x
- Caches npm dependencies for speed

#### Job 2: Build Application
- Builds Next.js application
- Runs after lint and type check passes
- Uploads build artifacts (.next folder)
- Artifacts retained for 7 days

**Future Jobs (Commented Out):**
- Unit tests (Vitest) - Will be added in Phase 9
- E2E tests (Playwright) - Will be added in Phase 9

---

### 2. Code Quality Workflow (`.github/workflows/code-quality.yml`)

**Triggers:**
- Pull requests only

**Checks:**

#### Console.log Detection
- Scans for `console.log` statements in code
- Fails PR if found (prevents debug code in production)
- Searches: `app/`, `lib/` directories
- File types: `.ts`, `.tsx`

#### TODO/FIXME/HACK Comments
- Counts TODO/FIXME/HACK comments
- Warns but doesn't fail (informational)
- Lists all found comments for visibility

#### File Naming Conventions
- Checks component files use PascalCase
- Warns on non-compliant files
- Example: `Button.tsx` ✅, `button.tsx` ❌

#### Large File Detection
- Identifies files >500 lines
- Warns to encourage modular code
- Doesn't fail (advisory only)

---

### 3. Dependabot Configuration (`.github/dependabot.yml`)

**Features:**
- Automatic dependency updates
- Weekly schedule (Mondays at 9:00 AM CET)
- Grouped updates for efficiency

**Update Groups:**

#### Development Dependencies
- Groups: `@types/*`, `eslint*`, `typescript`
- Updates: minor and patch versions together

#### Production Dependencies
- Groups: `next`, `react`, `react-dom`
- Updates: minor and patch versions together

#### GitHub Actions
- Updates workflow actions weekly
- Keeps CI/CD dependencies current

**PR Limits:**
- Maximum 5 open PRs at a time
- Prevents overwhelming maintainers

**Labels:**
- Auto-labels PRs: `dependencies`, `automated`
- Easy filtering in GitHub

---

### 4. Pull Request Template (`.github/PULL_REQUEST_TEMPLATE.md`)

**Sections:**

1. **Description** - What changes were made
2. **Type of Change** - Bug fix, feature, breaking change, etc.
3. **Related Issue** - Links to issues
4. **Implementation Phase** - Which phase (1-9)
5. **Changes Made** - Bullet point list
6. **Testing** - Testing checklist
7. **Screenshots** - Visual changes
8. **Checklist** - Comprehensive quality checklist:
   - Code quality standards
   - Documentation updates
   - i18n compliance
   - Security & performance
   - Build & deploy validation

**Benefits:**
- Ensures consistent PR structure
- Reminds contributors of requirements
- Facilitates code reviews
- Tracks implementation progress

---

### 5. Issue Templates

#### Bug Report Template (`.github/ISSUE_TEMPLATE/bug_report.md`)

**Sections:**
- Bug description
- Steps to reproduce
- Expected vs actual behavior
- Environment details (browser, device, OS, locale, city)
- Console errors
- Implementation phase

**Benefits:**
- Standardized bug reports
- Easier to reproduce issues
- Complete context provided

#### Feature Request Template (`.github/ISSUE_TEMPLATE/feature_request.md`)

**Sections:**
- Feature description
- Problem statement
- Proposed solution
- Alternative solutions
- Implementation phase
- Use cases
- Acceptance criteria
- Priority level

**Benefits:**
- Structured feature proposals
- Clear requirements
- Helps prioritize work

---

## 🚀 CI/CD Pipeline Flow

```
┌─────────────────┐
│  Push/PR        │
│  to main/dev    │
└────────┬────────┘
         │
         ├──────────────────────────────┐
         │                              │
         ▼                              ▼
┌─────────────────┐          ┌──────────────────┐
│ Lint & Type     │          │ Code Quality     │
│ Check           │          │ (PR only)        │
│                 │          │                  │
│ • ESLint        │          │ • console.log    │
│ • TypeScript    │          │ • TODO comments  │
└────────┬────────┘          │ • File naming    │
         │                    │ • Large files    │
         │ (passes)           └──────────────────┘
         │
         ▼
┌─────────────────┐
│ Build App       │
│                 │
│ • npm run build │
│ • Upload .next  │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ Tests (Future)  │
│                 │
│ • Unit tests    │
│ • E2E tests     │
└─────────────────┘
```

---

## ⚙️ Configuration Details

### Node.js Version

- **Version:** 20.x
- **Rationale:** LTS version, stable, good Next.js 16 support
- **Cache:** npm cache enabled for faster runs

### Environment Variables

Currently no secrets required. Will add in future phases:
- `SUPABASE_URL` (Phase 1, Week 2)
- `SUPABASE_ANON_KEY` (Phase 1, Week 2)
- `MAPBOX_TOKEN` (Phase 4)
- AI API keys (Phase 3)

### Artifact Storage

- **What:** Build output (.next folder)
- **Retention:** 7 days
- **Why:** Debugging failed builds, comparison between runs

---

## 📊 Benefits

### For Development

✅ **Catch Errors Early**
- TypeScript errors caught before merge
- Linting issues identified automatically
- Build failures prevented in main branch

✅ **Code Quality Standards**
- Enforces no console.log in production
- Encourages modular code (<500 lines)
- Consistent naming conventions

✅ **Fast Feedback**
- Runs in ~2-3 minutes
- Parallel job execution
- npm cache speeds up installs

### For Collaboration

✅ **Clear PR Process**
- Template guides contributors
- Comprehensive checklist
- Phase tracking built-in

✅ **Easy Issue Reporting**
- Structured bug reports
- Complete context captured
- Easier to triage and fix

✅ **Automated Maintenance**
- Dependabot keeps dependencies updated
- Security updates automatically proposed
- Reduces manual dependency management

---

## 🔧 Usage

### Running CI Locally

Before pushing, test locally:

```bash
# Lint
npm run lint

# Type check
npm run type-check

# Build
npm run build

# All at once
npm run lint && npm run type-check && npm run build
```

### Fixing CI Failures

#### ESLint Errors
```bash
npm run lint          # See errors
npm run lint -- --fix # Auto-fix some issues
```

#### TypeScript Errors
```bash
npm run type-check
# Fix type errors in reported files
```

#### Build Errors
```bash
npm run build
# Check error output for details
```

---

## 🔮 Future Enhancements

### Phase 9: Testing & Launch

Will add:
- Unit test job (Vitest)
- E2E test job (Playwright)
- Test coverage reporting
- Visual regression tests

### Phase 9: Performance

Will add:
- Lighthouse CI
- Bundle size tracking
- Performance budgets

### Phase 9: Security

Will add:
- SAST scanning (CodeQL)
- Dependency vulnerability scanning
- Secret scanning

---

## 📝 Maintenance

### Weekly Tasks

- Review Dependabot PRs
- Merge safe dependency updates
- Test major version updates locally

### Monthly Tasks

- Review TODO comments
- Refactor large files
- Update workflow actions

### As Needed

- Add new test jobs (Phase 9)
- Add environment secrets (Phase 2+)
- Adjust cache strategy if needed

---

## 🎯 Success Metrics

### Current Status

✅ **Workflows:**
- 2 workflow files created
- 1 dependabot config created
- 2 issue templates created
- 1 PR template created

✅ **Checks:**
- Linting ✓
- Type checking ✓
- Build ✓
- Code quality ✓

### Future Goals (Phase 9)

- [ ] 80%+ test coverage
- [ ] E2E tests for critical flows
- [ ] <5 second average CI runtime per job
- [ ] Zero console.log in main branch
- [ ] All files <500 lines

---

**Status:** ✅ Complete
**Next:** CI will run automatically on next push/PR

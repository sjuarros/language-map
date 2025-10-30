---
title: "Local CI Script"
description: Local CI script for running all GitHub Actions checks locally before pushing code
category: implementation
tags: [ci, scripts, automation, local-development, phase-1]
---

# Local CI Script

**Created:** October 30, 2025
**Location:** `scripts/local-ci.sh`
**Purpose:** Run all CI checks locally before pushing code

---

## Overview

The `local-ci.sh` script allows developers to run all GitHub Actions CI checks locally. This catches issues before pushing code, saving time and preventing CI failures.

## Features

### ✅ Current Checks

1. **TypeScript Type Checking**
   - Runs `npm run type-check`
   - Catches type errors before pushing

2. **ESLint (when configured)**
   - Runs `npm run lint`
   - Checks code quality and style

3. **Code Quality Checks**
   - Detects `console.log` statements (fails check)
   - Counts TODO/FIXME/HACK comments (warning only)
   - Finds large files >500 lines (warning only)
   - Validates PascalCase component naming (warning only)

4. **Next.js Build**
   - Runs `npm run build`
   - Ensures application builds successfully

### ⏳ Future Checks (Phase 9)

5. **Unit Tests**
   - Will run `npm run test`
   - Vitest test suite

6. **E2E Tests**
   - Will run `npm run test:e2e`
   - Playwright test suite

---

## Usage

### Basic Usage

```bash
# Run all checks
./scripts/local-ci.sh
```

### Command-Line Options

```bash
# Quick mode - skip build (faster)
./scripts/local-ci.sh --quick

# Skip tests (useful when not implemented yet)
./scripts/local-ci.sh --skip-tests

# Show help
./scripts/local-ci.sh --help
```

### Example Output

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 Local CI - Language Map Platform
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Running checks locally to catch issues before pushing...

Mode: Full
Tests: Enabled

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1️⃣  TypeScript Type Checking
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

▶ Running: TypeScript
✓ TypeScript passed

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2️⃣  ESLint
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠ ESLint not configured yet, skipping...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3️⃣  Code Quality Checks
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

▶ Checking for console.log statements...
✓ No console.log statements found

▶ Checking for TODO/FIXME/HACK comments...
✓ No TODO/FIXME/HACK comments found

▶ Checking for large files (>500 lines)...
✓ No large files found

▶ Checking component naming conventions...
✓ All components follow PascalCase naming

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4️⃣  Next.js Build
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

▶ Running: Build
✓ Build passed

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5️⃣  Unit Tests
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠ Unit tests not configured yet (will be added in Phase 9)
ℹ Expected script: npm run test

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
6️⃣  E2E Tests
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠ E2E tests not configured yet (will be added in Phase 9)
ℹ Expected script: npm run test:e2e

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total checks: 2
Passed: 2
Failed: 0

✓ All checks passed! ✨

Your code is ready to push! 🚀
```

---

## Integration with Workflow

### Pre-Commit Hook (Optional)

Add to `.git/hooks/pre-commit`:

```bash
#!/bin/bash

echo "Running local CI checks..."
./scripts/local-ci.sh --quick

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Pre-commit checks failed!"
    echo "Fix the issues above or use 'git commit --no-verify' to skip."
    exit 1
fi
```

### VS Code Task (Optional)

Add to `.vscode/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Run Local CI",
      "type": "shell",
      "command": "./scripts/local-ci.sh",
      "group": {
        "kind": "test",
        "isDefault": true
      },
      "presentation": {
        "reveal": "always",
        "panel": "dedicated"
      }
    }
  ]
}
```

### npm Script (Optional)

Add to `package.json`:

```json
{
  "scripts": {
    "ci:local": "./scripts/local-ci.sh",
    "ci:quick": "./scripts/local-ci.sh --quick"
  }
}
```

Then run:
```bash
npm run ci:local
npm run ci:quick
```

---

## Exit Codes

- **0** - All checks passed ✅
- **1** - One or more checks failed ❌

This allows integration with other scripts:

```bash
./scripts/local-ci.sh && git push
```

---

## Benefits

### 1. Faster Feedback
- Catch errors in seconds vs minutes (GitHub Actions)
- No waiting for CI to run

### 2. Save CI Minutes
- Reduce failed CI runs
- GitHub Actions has monthly limits

### 3. Better Development Experience
- Fix issues immediately
- Test changes before committing

### 4. Consistent Environment
- Same checks locally and in CI
- Reduces "works on my machine" issues

---

## Troubleshooting

### Permission Denied

```bash
chmod +x scripts/local-ci.sh
```

### Script Not Found

Make sure you're in the project root:

```bash
pwd  # Should show: /path/to/language-map
./scripts/local-ci.sh
```

### Checks Failing

Follow the fix suggestions in the script output:

```bash
# TypeScript errors
# → Review and fix type issues

# ESLint errors
npm run lint -- --fix

# console.log found
# → Remove console.log statements

# Build errors
# → Check the error output
```

---

## Future Enhancements

### Phase 9: Testing & Launch

Will add:
- Unit test execution
- E2E test execution
- Coverage reporting
- Performance benchmarks

### Potential Additions

- Parallel check execution for speed
- Watch mode for continuous checking
- Integration with CI/CD dashboard
- Automatic fix suggestions
- Pre-push hook template

---

## Maintenance

### When Adding New Checks

1. Add check to GitHub Actions workflow
2. Add corresponding check to `local-ci.sh`
3. Update this documentation
4. Test locally

### Keeping in Sync

Ensure `local-ci.sh` matches `.github/workflows/ci.yml`:
- Same checks
- Same order
- Same exit codes
- Same error messages

---

**Status:** ✅ Complete and ready to use
**Next:** Start using before every push!

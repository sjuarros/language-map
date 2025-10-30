#!/bin/bash

###############################################################################
# Local CI Script
#
# Runs all CI checks locally before pushing code.
# This helps catch issues early and ensures CI will pass.
#
# Usage:
#   ./scripts/local-ci.sh           # Run all checks
#   ./scripts/local-ci.sh --quick   # Skip build (faster)
#   ./scripts/local-ci.sh --help    # Show help
#
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_TOTAL=0

# Flags
QUICK_MODE=false
SKIP_TESTS=false

###############################################################################
# Helper Functions
###############################################################################

print_header() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${BLUE}$1${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

print_step() {
    echo ""
    echo -e "${BLUE}▶${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
    ((CHECKS_PASSED++))
}

print_error() {
    echo -e "${RED}✗${NC} $1"
    ((CHECKS_FAILED++))
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

run_check() {
    local check_name=$1
    shift
    local command="$@"

    ((CHECKS_TOTAL++))
    print_step "Running: $check_name"

    if eval "$command" > /tmp/ci-check.log 2>&1; then
        print_success "$check_name passed"
        return 0
    else
        print_error "$check_name failed"
        echo ""
        echo "Error output:"
        cat /tmp/ci-check.log
        return 1
    fi
}

show_help() {
    cat << EOF
Local CI Script - Run CI checks locally

Usage:
  ./scripts/local-ci.sh [OPTIONS]

Options:
  --quick       Skip the build step (faster, but less complete)
  --skip-tests  Skip test execution (useful when tests aren't ready)
  --help        Show this help message

Examples:
  ./scripts/local-ci.sh              # Run all checks
  ./scripts/local-ci.sh --quick      # Skip build for faster feedback
  ./scripts/local-ci.sh --skip-tests # Skip tests

Checks performed:
  1. TypeScript type checking
  2. ESLint (if configured)
  3. Code quality checks (console.log, TODOs, file size)
  4. Next.js build
  5. Unit tests (when implemented)
  6. E2E tests (when implemented)

Exit codes:
  0 - All checks passed
  1 - One or more checks failed

EOF
    exit 0
}

###############################################################################
# Parse Arguments
###############################################################################

while [[ $# -gt 0 ]]; do
    case $1 in
        --quick)
            QUICK_MODE=true
            shift
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --help)
            show_help
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

###############################################################################
# Main Script
###############################################################################

print_header "🚀 Local CI - Language Map Platform"

echo "Running checks locally to catch issues before pushing..."
echo ""
echo "Mode: $([ "$QUICK_MODE" = true ] && echo "Quick (skipping build)" || echo "Full")"
echo "Tests: $([ "$SKIP_TESTS" = true ] && echo "Skipped" || echo "Enabled")"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

###############################################################################
# 1. TypeScript Type Checking
###############################################################################

print_header "1️⃣  TypeScript Type Checking"

if run_check "TypeScript" "npm run type-check"; then
    true
else
    print_info "Fix: Review TypeScript errors above and fix type issues"
fi

###############################################################################
# 2. ESLint
###############################################################################

print_header "2️⃣  ESLint"

# Check if ESLint is configured
if [ -f "eslint.config.js" ] || [ -f "eslint.config.mjs" ] || [ -f ".eslintrc.json" ]; then
    if run_check "ESLint" "npm run lint"; then
        true
    else
        print_info "Fix: Run 'npm run lint -- --fix' to auto-fix some issues"
    fi
else
    print_warning "ESLint not configured yet, skipping..."
fi

###############################################################################
# 3. Code Quality Checks
###############################################################################

print_header "3️⃣  Code Quality Checks"

# Check for console.log statements
print_step "Checking for console.log statements..."
CONSOLE_LOGS=$(grep -r "console\.log" app/ lib/ --include="*.ts" --include="*.tsx" 2>/dev/null || true)
if [ -z "$CONSOLE_LOGS" ]; then
    print_success "No console.log statements found"
else
    print_error "Found console.log statements (should be removed):"
    echo "$CONSOLE_LOGS"
    print_info "Fix: Remove console.log statements or use proper logging"
fi

# Check for TODO/FIXME/HACK comments
print_step "Checking for TODO/FIXME/HACK comments..."
TODO_COUNT=$(grep -r "TODO\|FIXME\|HACK" app/ lib/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l || echo "0")
if [ "$TODO_COUNT" -eq 0 ]; then
    print_success "No TODO/FIXME/HACK comments found"
else
    print_warning "Found $TODO_COUNT TODO/FIXME/HACK comments"
    grep -r "TODO\|FIXME\|HACK" app/ lib/ --include="*.ts" --include="*.tsx" 2>/dev/null | head -10 || true
    if [ "$TODO_COUNT" -gt 10 ]; then
        echo "... and $((TODO_COUNT - 10)) more"
    fi
    print_info "Note: TODOs are tracked but don't fail CI"
fi

# Check for large files
print_step "Checking for large files (>500 lines)..."
LARGE_FILES=$(find app/ lib/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec wc -l {} + 2>/dev/null | awk '$1 > 500 {print $2, "(" $1, "lines)"}' || true)
if [ -z "$LARGE_FILES" ]; then
    print_success "No large files found"
else
    print_warning "Found large files (>500 lines):"
    echo "$LARGE_FILES"
    print_info "Consider breaking large files into smaller modules"
fi

# Check component naming (PascalCase)
# Note: Excludes Next.js special files (layout.tsx, page.tsx, loading.tsx, error.tsx, etc.)
print_step "Checking component naming conventions..."
INVALID_COMPONENTS=$(find app/ lib/components -name "*.tsx" ! -name "[A-Z]*" -type f 2>/dev/null | grep -v -E "(layout|page|loading|error|not-found|template|default)\.tsx$" || true)
if [ -z "$INVALID_COMPONENTS" ]; then
    print_success "All components follow PascalCase naming"
else
    print_warning "Found components not using PascalCase:"
    echo "$INVALID_COMPONENTS"
    print_info "Component files should start with uppercase (e.g., Button.tsx)"
    print_info "Note: Next.js special files (layout.tsx, page.tsx, etc.) are excluded"
fi

###############################################################################
# 4. Build
###############################################################################

if [ "$QUICK_MODE" = false ]; then
    print_header "4️⃣  Next.js Build"

    if run_check "Build" "npm run build"; then
        true
    else
        print_info "Fix: Check build errors above and resolve them"
    fi
else
    print_header "4️⃣  Next.js Build (SKIPPED - Quick Mode)"
    print_info "Run without --quick to include build check"
fi

###############################################################################
# 5. Unit Tests
###############################################################################

print_header "5️⃣  Unit Tests"

if [ "$SKIP_TESTS" = true ]; then
    print_info "Tests skipped (--skip-tests flag)"
elif grep -q '"test"' package.json; then
    if run_check "Unit Tests" "npm run test"; then
        true
    else
        print_info "Fix: Review test failures above"
    fi
else
    print_warning "Unit tests not configured yet (will be added in Phase 9)"
    print_info "Expected script: npm run test"
fi

###############################################################################
# 6. E2E Tests
###############################################################################

print_header "6️⃣  E2E Tests"

if [ "$SKIP_TESTS" = true ]; then
    print_info "Tests skipped (--skip-tests flag)"
elif grep -q '"test:e2e"' package.json; then
    if run_check "E2E Tests" "npm run test:e2e"; then
        true
    else
        print_info "Fix: Review E2E test failures above"
    fi
else
    print_warning "E2E tests not configured yet (will be added in Phase 9)"
    print_info "Expected script: npm run test:e2e"
fi

###############################################################################
# Summary
###############################################################################

print_header "📊 Summary"

echo ""
echo "Total checks: $CHECKS_TOTAL"
echo -e "Passed: ${GREEN}$CHECKS_PASSED${NC}"
echo -e "Failed: ${RED}$CHECKS_FAILED${NC}"
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
    print_success "All checks passed! ✨"
    echo ""
    echo "Your code is ready to push! 🚀"
    echo ""
    exit 0
else
    print_error "Some checks failed!"
    echo ""
    echo "Please fix the issues above before pushing."
    echo ""
    echo "Quick fixes:"
    echo "  • TypeScript errors: Review and fix type issues"
    echo "  • ESLint errors: Run 'npm run lint -- --fix'"
    echo "  • console.log: Remove or replace with proper logging"
    echo "  • Build errors: Check the error output above"
    echo ""
    exit 1
fi

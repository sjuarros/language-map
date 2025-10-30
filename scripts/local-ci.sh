#!/bin/bash

################################################################################
# Local CI Script
#
# This script replicates the GitHub CI workflow checks locally, allowing you
# to verify your code before pushing changes.
#
# Workflow:
#   1. TypeScript type check
#   2. ESLint code quality checks
#   3. Code quality checks (console.log, TODOs, naming conventions, file size)
#   4. Build application
#   5. Run all tests (if all checks pass)
#
# Exit Codes:
#   0 - All checks passed
#   1 - One or more checks failed
################################################################################

set -e  # Exit on first error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Track overall success and build eligibility
ALL_CHECKS_PASSED=true
CAN_BUILD=false

################################################################################
# Step 1: TypeScript Type Check
################################################################################
print_header "Step 1: Running TypeScript Type Check"

if npm run type-check; then
    print_success "TypeScript type check passed"
    TYPE_CHECK_PASSED=true
else
    print_error "TypeScript type check failed"
    ALL_CHECKS_PASSED=false
    TYPE_CHECK_PASSED=false
fi

################################################################################
# Step 2: ESLint
################################################################################
print_header "Step 2: Running ESLint"

if npm run lint; then
    print_success "ESLint checks passed"
    LINT_PASSED=true
else
    print_error "ESLint checks failed"
    ALL_CHECKS_PASSED=false
    LINT_PASSED=false
fi

################################################################################
# Step 3: Code Quality Checks (warnings only, don't fail)
################################################################################
print_header "Step 3: Running Code Quality Checks"

print_info "Checking for console.log statements..."
if grep -r "console\.log" app/ lib/ --include="*.ts" --include="*.tsx" --exclude-dir=node_modules 2>/dev/null; then
    print_warning "Found console.log statements. Please remove them before pushing."
else
    print_success "No console.log statements found."
fi

print_info "Checking for TODO/FIXME/HACK comments..."
TODO_COUNT=$(grep -r "TODO\|FIXME\|HACK" app/ lib/ --include="*.ts" --include="*.tsx" --exclude-dir=node_modules 2>/dev/null | wc -l || echo "0")
if [ "$TODO_COUNT" -gt 0 ]; then
    print_warning "Found $TODO_COUNT TODO/FIXME/HACK comments:"
    grep -r "TODO\|FIXME\|HACK" app/ lib/ --include="*.ts" --include="*.tsx" --exclude-dir=node_modules 2>/dev/null || true
else
    print_success "No TODO/FIXME/HACK comments found."
fi

print_info "Checking file naming conventions..."
INVALID_FILES=$(find app/ lib/components -name "*.tsx" ! -name "[A-Z]*" -type f 2>/dev/null || echo "")
if [ -n "$INVALID_FILES" ]; then
    print_warning "Component files not using PascalCase:"
    echo "$INVALID_FILES"
else
    print_success "All component files follow PascalCase naming."
fi

print_info "Checking for large files (>500 lines)..."
LARGE_FILES=$(find app/ lib/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec wc -l {} + 2>/dev/null | awk '$1 > 500 {print $2, "has", $1, "lines"}' || echo "")
if [ -n "$LARGE_FILES" ]; then
    print_warning "Found large files (>500 lines):"
    echo "$LARGE_FILES"
    echo "Consider breaking them into smaller modules."
else
    print_success "No large files found."
fi

################################################################################
# Step 4: Build Application (only if TypeScript and ESLint passed)
################################################################################
if [ "$TYPE_CHECK_PASSED" = true ] && [ "$LINT_PASSED" = true ]; then
    print_header "Step 4: Building Application"

    # Set CI=false to prevent build from failing on warnings
    CI=false
    if npm run build; then
        print_success "Build completed successfully"
        CAN_BUILD=true
    else
        print_error "Build failed"
        ALL_CHECKS_PASSED=false
    fi
else
    print_header "Step 4: Skipping Build"
    print_warning "Skipping build because TypeScript or ESLint checks failed"
    print_info "Fix type errors and linting issues before attempting build"
fi

################################################################################
# Step 5: Run Tests (only if build was successful)
################################################################################
if [ "$CAN_BUILD" = true ]; then
    print_header "Step 5: Running All Tests"

    print_info "Running unit tests with coverage..."
    if npm run test:coverage; then
        print_success "All tests passed"
    else
        print_error "Tests failed"
        ALL_CHECKS_PASSED=false
    fi
else
    print_header "Step 5: Skipping Tests"
    if [ "$TYPE_CHECK_PASSED" = false ] || [ "$LINT_PASSED" = false ]; then
        print_warning "Skipping tests because TypeScript or ESLint checks failed"
    else
        print_warning "Skipping tests because build failed"
    fi
    print_info "Fix the above issues before tests can run"
fi

################################################################################
# Final Summary
################################################################################
print_header "CI Check Summary"

if [ "$ALL_CHECKS_PASSED" = true ]; then
    print_success "All checks passed! Your code is ready to push."
    echo ""
    exit 0
else
    if [ "$TYPE_CHECK_PASSED" = false ]; then
        print_error "❌ TypeScript type checking failed"
    fi
    if [ "$LINT_PASSED" = false ]; then
        print_error "❌ ESLint checks failed"
    fi
    if [ "$CAN_BUILD" = false ] && [ "$TYPE_CHECK_PASSED" = true ] && [ "$LINT_PASSED" = true ]; then
        print_error "❌ Build failed"
    fi
    if [ "$CAN_BUILD" = true ] && [ "$ALL_CHECKS_PASSED" = false ]; then
        print_error "❌ Tests failed"
    fi

    echo ""
    print_error "Please fix the errors above before pushing."
    echo ""
    exit 1
fi

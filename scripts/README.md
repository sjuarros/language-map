# Scripts

This directory contains utility scripts for development, testing, and deployment.

## Available Scripts

### `local-ci.sh` - Local CI Checks

Runs all CI checks locally before pushing code. Catches issues early and ensures GitHub Actions CI will pass.

**Usage:**

```bash
# Run all checks
./scripts/local-ci.sh

# Quick mode (skip build for faster feedback)
./scripts/local-ci.sh --quick

# Skip tests (useful during early development)
./scripts/local-ci.sh --skip-tests

# Show help
./scripts/local-ci.sh --help
```

**What it checks:**

1. ✅ **TypeScript type checking** - Catches type errors
2. ✅ **ESLint** - Code quality and style issues
3. ✅ **Code quality checks:**
   - No `console.log` statements in production code
   - Tracks TODO/FIXME/HACK comments
   - Detects large files (>500 lines)
   - Validates component naming (PascalCase)
4. ✅ **Next.js build** - Ensures app builds successfully
5. ⏳ **Unit tests** - Will be added in Phase 9
6. ⏳ **E2E tests** - Will be added in Phase 9

**Exit codes:**
- `0` - All checks passed ✅
- `1` - One or more checks failed ❌

**Examples:**

```bash
# Before committing
./scripts/local-ci.sh

# Quick feedback during development
./scripts/local-ci.sh --quick

# When tests aren't ready yet
./scripts/local-ci.sh --skip-tests
```

**Tip:** Add to your pre-commit workflow for automatic checking!

---

## Future Scripts (To Be Added)

### Phase 8: Data Import
- `import-amsterdam.sh` - Import Amsterdam data from Airtable
- `validate-data.sh` - Validate imported data integrity

### Phase 9: Testing & Deployment
- `run-tests.sh` - Run all test suites with coverage
- `deploy-preview.sh` - Deploy preview environment
- `lighthouse-check.sh` - Performance auditing

### Database Management
- `db-migrate.sh` - Run database migrations
- `db-seed.sh` - Seed reference data
- `db-backup.sh` - Backup database

---

## Best Practices

### Running Scripts

Always run scripts from the project root:

```bash
# ✅ Correct
./scripts/local-ci.sh

# ❌ Wrong
cd scripts && ./local-ci.sh
```

### Making Scripts Executable

If a script isn't executable:

```bash
chmod +x scripts/script-name.sh
```

### Script Naming

- Use kebab-case: `my-script.sh`
- Use `.sh` extension for shell scripts
- Use descriptive names that indicate purpose

### Error Handling

Scripts should:
- Exit with code 0 on success
- Exit with code 1 on failure
- Use `set -e` to exit on any error
- Print clear error messages

---

## Contributing

When adding new scripts:

1. Add documentation to this README
2. Make the script executable (`chmod +x`)
3. Include usage instructions in script comments
4. Use consistent formatting and style
5. Test thoroughly before committing

---

**Last Updated:** October 30, 2025

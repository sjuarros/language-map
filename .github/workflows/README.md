# GitHub Actions Workflows

This directory contains CI/CD workflows for the Language Map platform.

## Workflows

### 1. CI Workflow (`ci.yml`)

Runs on every push and pull request to `main` and `develop` branches.

**Jobs:**
- **lint-and-typecheck** - Runs ESLint and TypeScript checks
- **build** - Builds the Next.js application

### 2. Code Quality Workflow (`code-quality.yml`)

Runs on pull requests only.

**Checks:**
- No console.log statements in production code
- Tracks TODO/FIXME/HACK comments
- Validates file naming conventions (PascalCase for components)
- Detects large files (>500 lines)

## Local Testing

Before pushing, test locally:

```bash
# Type check (recommended)
npm run type-check

# Build
npm run build

# Lint (if you have Next.js ESLint configured)
npm run lint
```

## Notes

- The CI uses Node.js 20.x (LTS)
- npm dependencies are cached for faster builds
- Build artifacts (.next folder) are stored for 7 days
- Future: Unit and E2E tests will be added in Phase 9

## Troubleshooting

If CI fails:

1. **TypeScript errors**: Run `npm run type-check` locally and fix reported errors
2. **Build errors**: Run `npm run build` locally and check the error output
3. **ESLint errors**: Run `npm run lint` and fix linting issues

## Environment Variables

Currently no secrets are required. Will be added in future phases:

- `SUPABASE_URL` - Supabase project URL (Phase 1, Week 2)
- `SUPABASE_ANON_KEY` - Supabase anonymous key (Phase 1, Week 2)
- `MAPBOX_TOKEN` - Mapbox access token (Phase 4)
- AI API keys (Phase 3)

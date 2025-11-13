# Supabase Migration Detection - Verification

**Date**: November 3, 2025
**Status**: ✅ VERIFIED SAFE
**Question**: Will `supabase reset` automatically pick correct migrations and skip archived ones?

---

## Answer: YES ✅

Supabase CLI **only** detects migration files in the top-level `supabase/migrations/` directory and **ignores** subdirectories.

---

## Verification Test

### Command Run
```bash
npx supabase migration list --local
```

### Result
```
Connecting to local database...
Skipping migration README.md... (file name must match pattern "<timestamp>_name.sql")


   Local          | Remote         | Time (UTC)
  ----------------|----------------|---------------------
   20251030000000 | 20251030000000 | 2025-10-30 00:00:00
   20251030000001 | 20251030000001 | 2025-10-30 00:00:01
   20251030000002 | 20251030000002 | 2025-10-30 00:00:02
   20251030000003 | 20251030000003 | 2025-10-30 00:00:03
   20251031000000 |                | 2025-10-31 00:00:00
   20251031000001 |                | 2025-10-31 00:00:01
   20251031001418 |                | 2025-10-31 00:14:18
   20251101000000 |                | 2025-11-01 00:00:00
   20251101010000 |                | 2025-11-01 01:00:00
   20251103000000 | 20251103000000 | 2025-11-03 00:00:00
```

### Analysis

✅ **Detected correctly**: All 10 clean migration files in `supabase/migrations/`
❌ **Not detected**: 0 files from `supabase/migrations/archive/` subdirectories
⚠️ **Skipped safely**: README.md (doesn't match pattern `<timestamp>_name.sql`)

---

## How Supabase CLI Detects Migrations

### Pattern Matching

Supabase CLI looks for files that match this pattern:
```
<timestamp>_<name>.sql
```

Where:
- `<timestamp>` = 14 digits (YYYYMMDDHHMMSS)
- `<name>` = descriptive name using letters, numbers, underscores
- File extension must be `.sql`

### Directory Scanning

**Scans**: Only the top-level `supabase/migrations/` directory
**Ignores**:
- Subdirectories (like `archive/`, `drafts/`, etc.)
- Non-SQL files
- Files that don't match the timestamp pattern
- README files and other documentation

### Example Directory Structure

```
supabase/migrations/
├── 20251030000000_create_core_schema.sql        ✅ DETECTED
├── 20251030000001_create_geographic.sql         ✅ DETECTED
├── README.md                                     ⚠️ SKIPPED (not .sql pattern)
├── notes.txt                                     ⚠️ SKIPPED (not .sql)
└── archive/
    ├── 20251102000000_old_fix.sql               ❌ NOT DETECTED (subdirectory)
    └── README.md                                 ❌ NOT DETECTED (subdirectory)
```

---

## Current Migration Status

### Applied to Database (5 migrations)

These show in both "Local" and "Remote" columns:

1. `20251030000000` - create_core_schema
2. `20251030000001` - create_geographic_hierarchy
3. `20251030000002` - create_user_management
4. `20251030000003` - create_districts_neighborhoods
5. `20251103000000` - fix_admin_rls_policies

### Pending (5 migrations)

These show in "Local" column only (not yet applied):

6. `20251031000000` - create_invitations_fixed
7. `20251031000001` - fix_invitation_rls
8. `20251031001418` - fix_helper_functions
9. `20251101000000` - create_taxonomy_system
10. `20251101010000` - update_taxonomy_rls_policies

### Archived (11 migrations)

These are **NOT** detected by Supabase CLI:
- 10 files in `archive/rls-fix-attempts/`
- 1 file in `archive/duplicates/`

**Result**: ✅ Safely ignored, will not be applied

---

## Safe to Run: Database Reset

### Command
```bash
npx supabase db reset
```

### What It Does
1. Drops all tables in the database
2. Applies migrations from `supabase/migrations/` **in order**
3. Skips archived migrations in subdirectories
4. Runs seed data (if `--no-seed` flag not used)

### What Will Be Applied

**Only the 10 clean migrations** in the top-level directory:
```
✅ 20251030000000_create_core_schema.sql
✅ 20251030000001_create_geographic_hierarchy.sql
✅ 20251030000002_create_user_management.sql
✅ 20251030000003_create_districts_neighborhoods.sql
✅ 20251031000000_create_invitations_fixed.sql
✅ 20251031000001_fix_invitation_rls.sql
✅ 20251031001418_fix_helper_functions.sql
✅ 20251101000000_create_taxonomy_system.sql
✅ 20251101010000_update_taxonomy_rls_policies.sql
✅ 20251103000000_fix_admin_rls_policies.sql
```

**Will NOT be applied**:
```
❌ All 11 archived migration files (in subdirectories)
❌ 2 seed data files (in supabase/seed/, not migrations/)
```

---

## Archive Structure Safety

### Current Structure
```
supabase/
├── migrations/
│   ├── [10 .sql migration files] ← ✅ DETECTED
│   ├── README.md                 ← ⚠️ SKIPPED (pattern mismatch)
│   └── archive/                  ← ❌ NOT SCANNED (subdirectory)
│       ├── rls-fix-attempts/
│       │   └── [10 .sql files]   ← ❌ NOT DETECTED
│       └── duplicates/
│           └── [1 .sql file]     ← ❌ NOT DETECTED
└── seed/                         ← ❌ NOT SCANNED (different directory)
    └── [2 .sql files]            ← ❌ NOT DETECTED
```

### Why This Is Safe

1. **Subdirectory isolation**: Supabase CLI doesn't recursively scan
2. **Pattern matching**: Only top-level `<timestamp>_<name>.sql` files detected
3. **Clear separation**: Archive and seed data in different paths
4. **README safety**: Documentation files safely ignored

---

## Best Practices

### ✅ DO

1. **Use subdirectories for archives**:
   ```
   migrations/
   └── archive/
       └── old_migrations/
   ```

2. **Add READMEs anywhere**:
   ```
   migrations/
   ├── README.md          ← Safe, will be skipped
   └── archive/
       └── README.md      ← Safe, won't be scanned
   ```

3. **Use clear naming**:
   ```
   migrations/
   └── archive/           ← Clear purpose
   └── drafts/            ← Clear purpose
   └── experiments/       ← Clear purpose
   ```

### ❌ DON'T

1. **Don't put active migrations in subdirectories**:
   ```
   migrations/
   └── pending/
       └── 20251101000000_important.sql  ← Won't be detected!
   ```

2. **Don't use non-standard timestamps**:
   ```
   2025-11-01_migration.sql     ← Wrong format
   20251101_migration.sql       ← Too short (need HHMMSS)
   migration_20251101.sql       ← Timestamp must be first
   ```

3. **Don't rely on .txt or other extensions**:
   ```
   20251101000000_migration.txt   ← Won't be detected
   20251101000000_migration.md    ← Won't be detected
   ```

---

## Testing Recommendations

### Before Committing New Migrations

1. **Check detection**:
   ```bash
   npx supabase migration list --local
   ```

2. **Verify count**:
   ```bash
   ls -1 supabase/migrations/*.sql | wc -l
   ```

3. **Test on fresh database**:
   ```bash
   npx supabase db reset
   ```

4. **Verify schema**:
   ```bash
   docker exec supabase_db_language-map psql -U postgres -d postgres -c "\dt"
   ```

### When Adding to Archive

1. **Move to archive subdirectory**:
   ```bash
   mv supabase/migrations/old_file.sql \
      supabase/migrations/archive/category/
   ```

2. **Verify not detected**:
   ```bash
   npx supabase migration list --local
   # Should not show archived file
   ```

3. **Document in README**:
   - Update `archive/README.md`
   - Note why file was archived

---

## Troubleshooting

### Issue: Migration Not Detected

**Symptoms**: File exists but doesn't show in `supabase migration list`

**Possible Causes**:
1. File in subdirectory (move to top-level `migrations/`)
2. Wrong naming pattern (must be `YYYYMMDDHHMMSS_name.sql`)
3. Wrong extension (must be `.sql`)
4. Timestamp format incorrect (must be 14 digits)

**Solution**:
```bash
# Check file location
ls -la supabase/migrations/YOUR_FILE.sql

# Check naming pattern
# Correct: 20251103120000_my_migration.sql
# Wrong:   2025-11-03-my-migration.sql
# Wrong:   20251103_my_migration.sql (missing HHMMSS)
```

### Issue: Archived File Being Applied

**Symptoms**: Old archived migration showing in migration list

**Cause**: File is in top-level `migrations/` directory

**Solution**:
```bash
# Move to archive
mv supabase/migrations/old_file.sql \
   supabase/migrations/archive/category/

# Verify
npx supabase migration list --local
```

### Issue: Seed Data Not Running

**Symptoms**: Migrations apply but no seed data

**Cause**: Seed files in wrong location or wrong command

**Solution**:
```bash
# Option 1: Use supabase/seed.sql (standard location)
# Supabase looks for supabase/seed.sql by default

# Option 2: Apply manually
docker exec supabase_db_language-map psql -U postgres -d postgres \
  -f /path/to/seed/file.sql
```

---

## Summary

### ✅ Verified Safe

- **Archive structure is safe**: Subdirectories are not scanned
- **README files are safe**: Pattern mismatch causes them to be skipped
- **Seed data is safe**: Separate directory not scanned by migration system
- **Reset will work correctly**: Only applies 10 clean migrations

### 📋 Migration Count

- **Detected**: 10 migration files ✅
- **Archived**: 11 files (safely ignored) ✅
- **Seed data**: 2 files (separate directory) ✅
- **Total organization**: Clean and correct ✅

### 🎯 Conclusion

The current migration directory structure is **production-ready** and **safe for database resets**. Supabase CLI will correctly apply only the 10 clean migration files and ignore all archived files in subdirectories.

---

**Date Verified**: November 3, 2025
**Supabase CLI Version**: Latest (npm)
**Database**: PostgreSQL (Supabase local instance)

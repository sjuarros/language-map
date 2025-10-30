---
title: Documentation Compliance Agent
description: Specification and usage guide for the documentation compliance sub-agent
category: processes
tags: [documentation, automation, agent, compliance]
---

# Documentation Compliance Agent

## Overview

The documentation compliance agent is a specialized sub-agent responsible for ensuring all project documentation adheres to the documentation standards and maintains consistency across the entire docs/ folder.

## Purpose

This agent performs comprehensive documentation review and automated updates that go beyond what pre-commit hooks can accomplish:

- **Standards Compliance**: Validates against [documentation-standards.md](./documentation-standards.md)
- **Cross-Reference Management**: Finds and updates all cross-references when files are moved/renamed
- **README.md Maintenance**: Automatically updates folder README.md files when new docs are added
- **Link Validation**: Comprehensive internal link checking across all documentation
- **Frontmatter Validation**: Ensures proper MCP-compatible frontmatter

## When to Invoke

### Required
- After implementing features that add/modify documentation
- Before creating a pull request
- After moving or renaming documentation files
- After restructuring documentation folders

### Optional
- Periodic documentation audits
- After batch documentation updates
- When documentation standards are updated

## How to Invoke

### Custom Sub-Agent (Recommended)

A custom `documentation-compliance` sub-agent is defined in `.claude/agents/documentation-compliance.md`.

**Automatic Invocation:**
Claude Code can automatically invoke this agent when it detects documentation changes or when appropriate based on context.

**Manual Invocation:**
Simply ask Claude Code:
```
Please run the documentation-compliance agent
```

Or:
```
Check documentation compliance
```

**First Time Setup:**
After creating or modifying the agent file, you may need to restart Claude Code for it to be discovered.

### Alternative: Task Tool (General-Purpose Agent)

If the custom agent isn't available, use the Task tool:

```
Please launch a general-purpose agent to perform documentation compliance review:
1. Scan all modified .md files in docs/
2. Validate against documentation standards
3. Check and update cross-references
4. Update affected README.md files
5. Report all changes and remaining issues
```

### Helper Script

Use the helper script for convenience:

```bash
./scripts/check/doc-compliance.sh
```

This will display modified files and provide instructions for invoking the agent.

## Agent Responsibilities

### 1. Standards Validation

**Checks:**
- File naming conventions (lowercase, hyphens)
- Frontmatter presence and completeness (except README.md)
- Header hierarchy (single H1, logical structure)
- Markdown formatting best practices
- Documentation location (all docs in docs/ folder)

**Actions:**
- Report violations with specific file:line references
- Suggest corrections
- Auto-fix simple issues (with approval)

### 2. Cross-Reference Management

**Checks:**
- All internal markdown links resolve correctly
- Cross-references use relative paths
- Link text is descriptive (not "click here")
- Anchors point to existing headers

**Actions:**
- Find broken links
- When files are renamed/moved, update all references automatically
- Validate anchor links point to actual headers
- Report external links for manual review

**Path Resolution Logic (CRITICAL):**
When validating cross-references in frontmatter `related_docs` or markdown links:

1. **Extract document's directory:**
   ```
   document_dir = dirname(current_document_path)
   ```

2. **Resolve relative paths:**
   ```
   If path starts with './' or '../':
     absolute_path = join(document_dir, relative_path)
   Else if path is absolute:
     absolute_path = path
   Else:
     absolute_path = join(document_dir, path)
   ```

3. **Validate using resolved path:**
   ```
   Use Read tool with absolute_path
   ```

**Common Bug to Avoid:**
❌ **WRONG:** Resolving relative paths from agent's current working directory
✅ **CORRECT:** Resolving relative paths from the document's directory

**Example:**
- Document: `/home/user/docs/09-guides/developer/monorepo-setup.md`
- Reference: `./frontend-setup.md`
- Document dir: `/home/user/docs/09-guides/developer/`
- Resolved path: `/home/user/docs/09-guides/developer/frontend-setup.md` ✅

### 3. README.md Maintenance

**Checks:**
- Every docs/ subfolder has a README.md
- README.md files list all contained files/folders
- Descriptions are brief and accurate
- No frontmatter in README.md files

**Actions:**
- Add missing README.md files
- Update file listings when docs are added/removed
- Ensure consistent formatting across all READMEs
- Maintain proper linking structure

### 4. Frontmatter Validation

**Checks:**
- All non-README .md files have frontmatter
- Required fields present: title, description, category, tags
- Categories use standard values
- Tags are relevant and lowercase

**Actions:**
- Add missing frontmatter
- Suggest appropriate categories and tags
- Validate category names against standard list
- Format tags consistently

### 5. MCP Integration

**Leverage docs MCP server:**
- `mcp__docs__search_docs`: Find related documentation
- `mcp__docs__get_document`: Read full document content
- `mcp__docs__get_related_docs`: Discover relationships
- `mcp__docs__list_categories`: Validate categories
- `mcp__docs__list_tags`: Validate tags

## Agent Workflow

### Phase 1: Discovery
1. Identify all modified/new .md files (via git diff or user specification)
2. Use MCP to search for related documentation
3. Build dependency graph of cross-references

### Phase 2: Validation
1. Validate each file against documentation standards
2. Check frontmatter completeness and accuracy
3. Validate all internal links
4. Check README.md coverage

### Phase 3: Analysis
1. Identify files affected by changes (cross-references)
2. Determine which README.md files need updates
3. Assess scope of required fixes

### Phase 4: Updates
1. Fix frontmatter issues
2. Update broken cross-references
3. Update affected README.md files
4. Fix formatting issues

### Phase 5: Reporting
1. Summarize all changes made
2. List remaining issues requiring manual intervention
3. Provide recommendations for documentation improvements

## Expected Output

The agent should return a structured report:

```markdown
# Documentation Compliance Report

## Summary
- Files reviewed: X
- Issues found: Y
- Issues auto-fixed: Z
- Manual intervention required: N

## Changes Made

### Updated Files
- docs/path/to/file.md
  - Fixed frontmatter (added missing 'category' field)
  - Updated link to renamed file

- docs/path/README.md
  - Added reference to new-file.md

### Cross-Reference Updates
- Updated 3 references to docs/old-name.md → docs/new-name.md
  - docs/05-implementation/guide.md:45
  - docs/08-api/reference.md:12
  - docs/09-guides/developer/setup.md:78

## Remaining Issues

### Critical
- docs/path/file.md: Broken external link (manual verification needed)

### Warnings
- docs/path/another.md: Consider breaking into multiple documents (>500 lines)

## Recommendations
- Add frontmatter to legacy documentation files
- Create missing README.md in docs/08-api/examples/
```

## Best Practices

### For Users
1. **Run before PR creation**: Catch issues early
2. **Review agent changes**: Don't blindly accept all updates
3. **Commit separately**: Keep doc compliance fixes in separate commits
4. **Use git diff**: Review what the agent changed

### For Agent Implementation
1. **Be conservative**: Ask before making destructive changes
2. **Batch edits**: Group related updates together
3. **Explain reasoning**: Document why changes are needed
4. **Preserve intent**: Don't change meaning, only format
5. **Use MCP tools**: Leverage docs server for accuracy

## Limitations

The agent cannot:
- Verify external links (requires network access)
- Assess documentation quality or completeness
- Rewrite poorly written documentation
- Make subjective decisions about organization
- Determine if documentation is accurate vs. code

These require human review.

## Integration with Development Workflow

```
Feature Development
    ↓
Implement feature + write docs
    ↓
Run: /check-docs (quick validation)
    ↓
Fix reported issues
    ↓
Feature complete
    ↓
Invoke: Documentation Compliance Agent
    ↓
Review agent changes
    ↓
Commit documentation updates
    ↓
Create PR
    ↓
Pre-commit hook validates
    ↓
CI/CD pipeline validates
    ↓
Merge
```

## Configuration

### Standard Categories
- architecture
- api
- implementation
- testing
- operations
- guides
- processes

### Common Tags
- setup, configuration, security, deployment
- api, frontend, backend, database
- testing, monitoring, troubleshooting
- onboarding, workflow, standards

## Version History

- 2025-10-04: Fixed critical bug in cross-reference path resolution (relative paths now resolved from document directory, not agent CWD)
- 2025-10-02: Initial specification

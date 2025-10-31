---
title: Documentation Standards
description: Standards and conventions for maintaining project documentation
category: processes
tags: [documentation, standards, guidelines]
---

# Documentation Standards

This document defines the standards and conventions for all documentation in the DubbingLabs project.

## Documentation Location

**All project documentation must live under the `docs/` folder.** This is a strict requirement to maintain centralized, organized documentation.

### Local README.md Files

- **Purpose**: Local README.md files outside of `docs/` serve **only** as navigation aids
- **Content**: They should provide a brief introduction and reference the relevant documentation in `docs/`
- **No detailed documentation**: Do not include detailed guides, tutorials, or specifications in local README.md files
- **Cross-reference to docs/**: Always link to the appropriate documentation in `docs/`

### Example

For `/scripts/README.md`:
```markdown
# Scripts

This directory contains development helper scripts for the DubbingLabs project.

## Directory Structure

[Brief overview of structure]

## Documentation

For detailed documentation of all available scripts, including usage examples
and implementation details, see:

**[docs/05-implementation/scripts.md](../../05-implementation/scripts.md)**
```

### Exceptions

**Configuration files** are excluded from documentation standards:

**`.claude/` directory:**
- Agent definitions use their own frontmatter schema (`name`, `description`, `tools`, `model`)
- These files are configuration for Claude Code, not project documentation
- Pre-commit hooks skip `.claude/` directory validation

**`CLAUDE.md` file:**
- Root-level configuration file for AI agents
- Provides project context and operational guidelines for AI agents
- Contains summary references to detailed documentation in `docs/`
- Pre-commit hooks skip `CLAUDE.md` validation

### Benefits

- **Single source of truth**: All documentation lives in one place
- **Consistency**: Centralized documentation is easier to maintain and keep up-to-date
- **Discoverability**: Users know where to find comprehensive documentation
- **MCP compatibility**: The docs MCP server indexes only the `docs/` folder

## File Naming Conventions

All documentation files must follow these naming rules:

- **Use lowercase only**: `user-guide.md` not `User-Guide.md`
- **Use hyphens as separators**: `api-reference.md` not `api_reference.md` or `api reference.md`
- **Be descriptive**: Filenames should clearly indicate content (e.g., `authentication-setup.md`)
- **Use `.md` extension**: All documentation files must use Markdown format

**Examples:**
- ✅ `getting-started.md`
- ✅ `deployment-guide.md`
- ✅ `api-authentication.md`
- ❌ `Getting_Started.md`
- ❌ `deployment guide.md`
- ❌ `API-Authentication.MD`

## Header Structure Requirements

### Best Practices

- **Use hierarchical headers**: Start with `#` (H1) for the document title, then `##` (H2) for major sections
- **One H1 per document**: The document title should be the only H1
- **Logical hierarchy**: Don't skip levels (e.g., don't jump from `##` to `####`)
- **Descriptive titles**: Headers should clearly describe the content below them
- **Consistent formatting**: Use sentence case for headers (capitalize first word only, unless proper nouns)

**Example structure:**
```markdown
# Document Title

Brief introduction paragraph.

## Major Section

Content for this section.

### Subsection

More detailed content.

### Another Subsection

More content.

## Another Major Section

Content continues.
```

## Cross-Reference Format

### Best Practices

- **Use relative paths**: `[see scripts documentation](../05-implementation/scripts.md)` not absolute paths
- **Link to specific sections**: Use anchor links when referencing specific content: `[Setup Guide](./setup-guide.md#installation)`
- **Descriptive link text**: Use meaningful text, not "click here" or bare URLs
- **Verify links work**: Always test cross-references after creating them
- **Update broken links**: When moving/renaming files, update all references

**Examples:**
- ✅ `[API Reference](../08-api/endpoints/video-api.md)`
- ✅ `[Authentication section](./security-guide.md#authentication)`
- ✅ `See the [deployment checklist](../07-operations/deployment/checklist.md) for details`
- ❌ `Click [here](link) to see more`
- ❌ `../08-api/endpoints/video-api.md` (bare URL)

## README.md Update Rules

Every folder containing documentation **must** have a `README.md` file that serves as the folder's index.

### Requirements

- **Brief introduction**: 1-2 paragraphs explaining the folder's purpose
- **File listing**: List all files/subdirectories with brief descriptions
- **Keep it concise**: READMEs should be scannable and quick to read
- **Update when adding files**: Any new documentation file must be added to the parent folder's README
- **Use relative links**: Link to files using relative paths

### Structure Template

```markdown
# [Folder Name]

Brief introduction explaining what this folder contains and its purpose.

## Contents

### [filename.md](./filename.md)
Brief description of what this file covers.

### [another-file.md](./another-file.md)
Brief description of this file's contents.

### [subdirectory/](./subdirectory/)
Description of what the subdirectory contains.
```

### Example

```markdown
# API Documentation

This folder contains comprehensive API documentation for the DubbingLabs service.

## Contents

### [endpoints/](./endpoints/)
Detailed documentation for all API endpoints, including request/response formats.

### [authentication.md](./authentication.md)
Guide to API authentication mechanisms and token management.

### [examples/](./examples/)
Code examples and use cases for common API operations.
```

## Frontmatter Requirements

All documentation files (except README.md) must include frontmatter metadata for compatibility with the docs MCP server.

### Required Fields

- **title**: The document title (string)
- **description**: Brief description of the document (string)
- **category**: The documentation category (string)
- **tags**: Array of relevant tags (array of strings)

### Format

```markdown
---
title: Document Title
description: Brief description of what this document covers
category: implementation
tags: [tag1, tag2, tag3]
---

# Document Title

Content begins here...
```

### Categories

Use these standard categories to maintain consistency:
- `product` - Product requirements, roadmaps, and specifications
- `architecture` - System design and architecture docs
- `api` - API reference and guides
- `implementation` - Implementation details and developer notes
- `testing` - Testing strategies and documentation
- `operations` - Deployment, monitoring, maintenance
- `guides` - User and developer guides
- `processes` - Workflows and processes

### Tags

- Use lowercase for tags
- Be specific and relevant
- Include 2-5 tags per document
- Common tags: `setup`, `configuration`, `security`, `deployment`, `api`, `frontend`, `backend`, `database`

### README.md Exception

**README.md files should NOT include frontmatter.** They serve as indexes and don't need to be categorized in the same way as content documents.

## Compliance

These standards must be followed for all new documentation and when updating existing documentation. A specialized documentation compliance agent will verify adherence to these standards during the development workflow.

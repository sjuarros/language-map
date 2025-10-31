#!/bin/bash

###
# @file doc-compliance.sh
# @description Helper script to invoke the documentation compliance agent.
#              This script provides a convenient way to run comprehensive documentation
#              validation and automated fixes using Claude Code's Task tool.
###

set -e

# Color codes
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Documentation Compliance Agent${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if we're in a git repository
if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
    echo -e "${YELLOW}Warning: Not in a git repository${NC}"
    echo "The agent works best when it can detect modified files via git."
    echo ""
fi

# Detect modified/new markdown files
MODIFIED_DOCS=""
if git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
    MODIFIED_DOCS=$(git diff --name-only HEAD docs/ | grep '\.md$' || true)
    STAGED_DOCS=$(git diff --cached --name-only docs/ | grep '\.md$' || true)
    UNTRACKED_DOCS=$(git ls-files --others --exclude-standard docs/ | grep '\.md$' || true)

    ALL_CHANGED="$MODIFIED_DOCS"$'\n'"$STAGED_DOCS"$'\n'"$UNTRACKED_DOCS"
    ALL_CHANGED=$(echo "$ALL_CHANGED" | grep -v '^$' | sort -u || true)

    if [ -n "$ALL_CHANGED" ]; then
        echo -e "${GREEN}Modified documentation files detected:${NC}"
        echo "$ALL_CHANGED" | sed 's/^/  - /'
        echo ""
    else
        echo -e "${YELLOW}No modified documentation files detected${NC}"
        echo "The agent will perform a full documentation review."
        echo ""
    fi
fi

echo "The documentation compliance agent will:"
echo "  • Validate all documentation against standards"
echo "  • Check and fix cross-references"
echo "  • Update README.md files"
echo "  • Verify frontmatter compliance"
echo "  • Report issues and recommendations"
echo ""

# Create the agent prompt
cat > /tmp/doc-compliance-prompt.txt << 'EOF'
You are the Documentation Compliance Agent for the DubbingLabs project.

Your mission: Ensure all project documentation adheres to the documentation standards
defined in docs/processes/documentation-standards.md and maintain
consistency across the entire docs/ folder.

IMPORTANT INSTRUCTIONS:

1. READ THE STANDARDS FIRST
   - Read docs/processes/documentation-standards.md
   - Read docs/processes/doc-compliance-agent.md for your full specification
   - Understand all requirements before proceeding

2. DISCOVER MODIFIED FILES
   - Use git diff to find modified .md files in docs/
   - Focus on these files but also check their cross-references

3. USE MCP TOOLS EXTENSIVELY
   - mcp__docs__search_docs: Find related documentation
   - mcp__docs__get_document: Read full document content
   - mcp__docs__get_related_docs: Discover relationships
   - mcp__docs__list_categories: Validate categories
   - mcp__docs__list_tags: Validate tags

4. VALIDATE AGAINST STANDARDS
   For each documentation file:
   - File naming (lowercase, hyphens)
   - Frontmatter (all fields present, except README.md)
   - Header structure (single H1, proper hierarchy)
   - Internal links (relative paths, resolve correctly)
   - Location (all docs in docs/ folder)

5. VERIFY CROSS-REFERENCES (CRITICAL)
   **ALWAYS verify files exist - NEVER make assumptions based on folder patterns**
   For every cross-referenced file path:
   - Use Read tool to verify the file exists at the exact path
   - If Read fails, use Glob to search for the file
   - Report: VALID / INCORRECT PATH (with correct path) / BROKEN
   - Never assume file locations based on folder naming patterns (01-, 02-, etc.)

6. UPDATE CROSS-REFERENCES
   - Find all files that reference modified files
   - Update broken links with correct paths
   - Ensure consistency

7. MAINTAIN README.md FILES
   - Every docs/ subfolder must have README.md
   - README.md must list all files/subdirectories
   - Update when files are added/removed
   - No frontmatter in README.md

8. FIX ISSUES AUTOMATICALLY
   - Add missing frontmatter
   - Fix broken cross-references (use verified paths)
   - Update README.md files
   - Correct formatting issues

9. REPORT COMPREHENSIVELY
   Provide a structured report with:
   - Summary of changes
   - List of files updated with verification method used
   - Cross-reference validation results (VALID/INCORRECT/BROKEN)
   - Remaining issues requiring manual intervention
   - Recommendations

WORKFLOW:
Phase 1: Discovery → Phase 2: Validation → Phase 3: Analysis →
Phase 4: Updates → Phase 5: Reporting

Be thorough, conservative with changes, and explain your reasoning.
Start by reading the documentation standards and your full specification.
EOF

echo -e "${BLUE}Invoking documentation compliance agent...${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "PROMPT FOR CLAUDE CODE:"
echo ""
cat /tmp/doc-compliance-prompt.txt
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${YELLOW}To invoke the agent in Claude Code:${NC}"
echo ""
echo "1. Copy the prompt above (or use the one below)"
echo "2. In Claude Code, send the message:"
echo ""
echo -e "${GREEN}Launch a general-purpose agent with this task:${NC}"
echo ""
cat /tmp/doc-compliance-prompt.txt | head -10
echo "   [... full prompt from above ...]"
echo ""
echo "OR simply say:"
echo ""
echo -e "${GREEN}Please run the documentation compliance agent as specified in"
echo "docs/processes/doc-compliance-agent.md${NC}"
echo ""

rm /tmp/doc-compliance-prompt.txt

exit 0

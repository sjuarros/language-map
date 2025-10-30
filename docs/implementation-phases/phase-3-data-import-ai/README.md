# Phase 3: Data Import & AI Generation

**Timeline:** Week 7 (Days 30-34)
**Status:** Not Started

## Overview

This phase implements CSV import functionality and AI-powered description generation to streamline data entry and content creation.

## Key Deliverables

- ✅ Operators can import language data via CSV
- ✅ CSV import includes validation and preview
- ✅ Taxonomy mapping during import
- ✅ AI description generation with source management
- ✅ AI review workflow for generated content

## Daily Breakdown

### Days 30-31: CSV Import
- Create CSV import page
- Implement CSV parser and validator
- Show preview table with data validation
- Map CSV columns to taxonomy values
- Implement bulk import functionality
- Test with sample data

### Day 32: AI Sources Management
- Create AI sources list page
- Create AI source form (URL, whitelist/blacklist, notes)
- Test whitelist/blacklist management

### Day 33: AI Description Generation
- Implement OpenAI API integration
- Create description generation form
- Build prompt with source filtering
- Log AI generation to `ai_generation_log` table
- Test generation with real data

### Day 34: AI Review Workflow
- Create AI-generated content review page
- Show AI flag on descriptions
- Allow editing of AI-generated content
- Implement approval workflow
- Test review process

## Critical Components

### Database Tables Used
- `ai_sources` (whitelist/blacklist per city)
- `ai_generation_log` (track usage and costs)
- `cities.ai_translation_*` fields (per-city AI config)
- `descriptions` (with `is_ai_generated` flag)

### Key Features Implemented
- CSV parsing and validation
- Bulk data import with preview
- Taxonomy value mapping from CSV
- AI description generation
- Source filtering for AI prompts
- Cost tracking for AI usage
- Review and approval workflow

## Documentation

Keep track of:
- CSV format specifications
- Import validation rules
- Taxonomy mapping strategies
- AI prompt engineering patterns
- Cost optimization strategies
- Error handling patterns
- Sample CSV templates

## Important Considerations

### CSV Import
- Validate all required fields
- Handle duplicate detection
- Preview before committing
- Rollback on errors
- Map external classifications to taxonomies

### AI Generation
- Set hard API spending limits
- Cache generated content
- Rate limit per user/day
- Monitor costs via `ai_generation_log`
- Consider cheaper models for drafts
- Review before publishing

### Security
- Sanitize CSV input
- Validate URLs in source management
- Encrypt API keys at rest
- Never expose API keys to client

## Next Phase

Phase 4 will build the public-facing map interface with multilingual support and dynamic taxonomy-based filtering.

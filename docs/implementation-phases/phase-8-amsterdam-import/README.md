# Phase 8: Amsterdam Data Import

**Timeline:** Week 13 (Days 64-71)
**Status:** Not Started

## Overview

This phase imports the existing Amsterdam language mapping data from Airtable, including setting up custom taxonomies, importing all data, and creating English and Dutch translations.

## Key Deliverables

- ✅ Amsterdam data fully imported with EN/NL translations
- ✅ Custom taxonomies defined (Size, Status)
- ✅ All data migrated from Airtable
- ✅ Taxonomy values assigned to all languages
- ✅ AI-assisted Dutch translations reviewed

## Daily Breakdown

### Days 64-65: Set Up Amsterdam Taxonomies
- Create "Size" taxonomy (Small/Medium/Large)
  - Add EN/NL translations
  - Set colors (#FFA500, #FFD700, #FF4500)
  - Configure as required, enable map styling
- Create "Status" taxonomy (Endangered/Stable)
  - Add EN/NL translations
  - Set colors (traffic light colors)
- Test taxonomy creation and validation

### Days 66-67: Import Amsterdam Data from Airtable
- Write import script (`scripts/import-amsterdam.ts`)
- Connect to Airtable API
- Import districts and neighborhoods
- Import language families
- Import languages
- Import language points
- Import descriptions
- Test import and verify data integrity

### Day 68: Assign Taxonomy Values
- Map Airtable "Size" field to taxonomy values
- Map Airtable "Status" field to taxonomy values
- Bulk assign taxonomies via `language_taxonomies` table
- Verify all assignments
- Test map rendering with taxonomies

### Day 69: Create English Translations
- Generate English translations for all content
- Translate districts and neighborhoods
- Translate language names
- Translate descriptions
- Test English UI

### Day 70: Create Dutch Translations (AI-Assisted)
- Configure Amsterdam AI translation settings
- Bulk translate districts/neighborhoods to Dutch
- Bulk translate language names to Dutch
- Bulk translate descriptions to Dutch
- Test Dutch UI

### Day 71: Manual Review and Corrections
- Review AI-generated Dutch translations
- Correct errors or awkward translations
- Mark translations as reviewed
- Final verification and testing

## Critical Components

### Import Script
```typescript
// scripts/import-amsterdam.ts
- Connect to Airtable API
- Map Airtable fields to database schema
- Handle relationships (language → family, point → neighborhood)
- Batch insert for performance
- Error handling and rollback
- Progress logging
```

### Data Sources
- Airtable Base: Amsterdam Language Map
- Tables to import:
  - Language families
  - Languages
  - Data points (geographic locations)
  - Descriptions
  - Districts and neighborhoods

### Taxonomy Mapping
```typescript
// Airtable → Taxonomy mapping
{
  "Size": {
    "1-100": "small",
    "100-1000": "medium",
    "1000+": "large"
  },
  "Status": {
    "Endangered": "endangered",
    "Stable": "stable"
  }
}
```

## Documentation

Keep track of:
- Import script code
- Airtable field mapping
- Taxonomy value mappings
- Data transformation rules
- Validation errors encountered
- Manual corrections made
- Translation review notes
- Data quality issues

## Important Considerations

### Data Integrity
- Verify all foreign key relationships
- Check for duplicate entries
- Validate coordinates (within Amsterdam bounds)
- Ensure all languages have taxonomies assigned
- Verify translation completeness

### Amsterdam Taxonomies

**Size Taxonomy:**
- Small: Orange (#FFA500) - 1-100 speakers
- Medium: Gold (#FFD700) - 100-1,000 speakers
- Large: Red-Orange (#FF4500) - 1,000+ speakers

**Status Taxonomy:**
- Endangered: Red - Languages at risk
- Stable: Green - Languages with healthy speaker communities

### AI Translation
- Use GPT-4 for quality
- Review all AI translations manually
- Maintain consistent terminology
- Preserve proper nouns
- Flag uncertain translations for native speaker review

### Quality Assurance
- Spot-check random samples
- Verify map rendering
- Test all filters
- Ensure data completeness
- Validate translations

## Success Metrics

- [ ] All Airtable data successfully imported
- [ ] Zero data loss during migration
- [ ] All languages assigned to taxonomies
- [ ] 100% translation coverage (EN/NL)
- [ ] Map renders correctly with all points
- [ ] Filters work with taxonomy data
- [ ] Native speaker approves Dutch translations

## Next Phase

Phase 9 will focus on comprehensive testing, performance optimization, security audit, and production launch.

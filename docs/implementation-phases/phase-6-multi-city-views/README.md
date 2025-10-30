# Phase 6: Multi-City Views & Comparison

**Timeline:** Week 11 (Days 52-57)
**Status:** Not Started

## Overview

This phase implements support for viewing and comparing multiple cities simultaneously on the map, enabling cross-city analysis and insights.

## Key Deliverables

- ✅ Users can view multiple cities on one map
- ✅ City color coding and legend
- ✅ Multi-city filters (combining taxonomies)
- ✅ City comparison mode (side-by-side stats)
- ✅ SEO optimization for public pages

## Daily Breakdown

### Days 52-53: Multi-City Query Params
- Implement query param parsing (`?cities=amsterdam,paris`)
- Validate city slugs
- Load data from multiple cities
- Test multi-city data loading

### Day 54: Combined Map Rendering
- Assign colors to cities
- Render points with city-specific styling
- Add city legend
- Test combined rendering

### Day 55: Multi-City Filters
- Implement multi-city filter UI
- Show taxonomies from all cities
- Combine filters intelligently (handle different taxonomy systems)
- Test filtering across cities

### Day 56: City Comparison Mode
- Create comparison view
- Show stats for each city (language count, families, speakers, etc.)
- Highlight differences
- Test comparison functionality

### Day 57: SEO Optimization
- Add meta tags for all public pages
- Implement Open Graph tags
- Generate sitemap.xml
- Add structured data (JSON-LD)
- Test SEO with Google Search Console

## Critical Components

### URL Structure
```
/[locale]?cities=amsterdam,paris,berlin
/[locale]/compare?cities=amsterdam,paris
```

### Key Features Implemented
- Multi-city query parameter handling
- Merged GeoJSON from multiple cities
- City-specific visual styling
- Dynamic legend generation
- Cross-city filtering
- Comparison statistics
- SEO metadata

## Documentation

Keep track of:
- Multi-city query optimization strategies
- Color assignment algorithm
- Filter combination logic
- Comparison metrics calculations
- SEO best practices
- Performance with multiple cities

## Important Considerations

### Data Loading
- Parallel queries for multiple cities
- Combine GeoJSON efficiently
- Handle different taxonomy systems
- Cache multi-city results

### Filter Combination
- Show union of all taxonomies
- Handle cities with different classification systems
- Filter within city boundaries
- Clear filter state when cities change

### Visual Design
- Assign distinct colors to each city
- Show city boundaries (if available)
- Clear legend with city names
- Handle overlapping points

### Performance
- Limit number of simultaneous cities (e.g., max 5)
- Implement pagination for comparison stats
- Optimize GeoJSON merging
- Cache combined results

## SEO Optimization

### Meta Tags
- Title, description per page
- Open Graph images
- Twitter cards
- Canonical URLs

### Structured Data
```json
{
  "@context": "https://schema.org",
  "@type": "Dataset",
  "name": "Amsterdam Language Map",
  "description": "...",
  "keywords": ["languages", "Amsterdam", "linguistic diversity"]
}
```

## Next Phase

Phase 7 will complete the admin panel with user management, city settings, and advanced branding customization.

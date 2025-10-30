---
title: Product Requirements Document (PRD)
description: Product requirements, features, user stories, and success metrics for the Multi-City Language Mapping Platform
category: product
tags: [product-requirements, user-stories, features, planning]
---

# Product Requirements Document (PRD)

**Version:** 3.1
**Date:** October 29, 2025
**Status:** Planning Phase

---

## Executive Summary

**Vision**: Build an independent, highly customizable multi-city platform that enables cities worldwide to document and visualize their linguistic diversity. Starting with Amsterdam, the platform is designed from day 1 to support multiple cities with deep customization capabilities.

**Approach**: Build completely new application using modern architecture, designed for multi-instance deployment with flexible taxonomies, static content management, and per-city branding.

**Timeline**: 16-19 weeks for MVP (Minimum Viable Product) - includes i18n, AI generation, multi-city support, flexible taxonomies, and content management

**Key Innovation**:
- **Flexible Classification System**: Cities define their own language taxonomies (e.g., Amsterdam: Size/Status; Tokyo: Script Type/Official Status)
- **Static Content Management**: Built-in CMS for About pages, methodology, team sections, and custom content
- **Per-City Branding**: Custom logos, colors, and themes
- **Multi-Database Ready**: Abstraction layer enables future data sovereignty options

**Architecture**: Multi-instance platform where each city can deeply customize their language classification, content, and branding while sharing infrastructure.

---

## 🎯 Key Decisions Made

### Strategic Decisions ✅
- **Branding**: Independent platform (not tied to ELA)
- **Multi-City**: Build for multiple cities from day 1
- **Target Cities**: Flexible - any city can be onboarded
- **Business Model**: To be determined (options left open)
- **Development**: Solo project (timeline adjusted accordingly)

### Technical Decisions ✅
- **Census Overlays**: Skipped for MVP (simplifies scope significantly)
- **User Roles**: Superuser + Admin + Operator (three-tier hierarchy)
- **Launch Deadline**: Flexible, no hard deadline
- **i18n Support**: Built-in from day 1 (database + frontend)
- **Geographic Hierarchy**: Structured cities → districts → neighborhoods
- **World Data**: Structured world regions and countries tables
- **Multi-City Access**: Users can have permissions for multiple cities
- **Multi-City Views**: Single URL can display data from multiple cities
- **AI Descriptions**: Support for AI-generated descriptions with source management
- **Flexible Taxonomies**: Cities define custom language classification systems (replaces hardcoded enums)
- **Static Content CMS**: Built-in page builder for About, Methodology, and custom pages
- **Per-City Branding**: Custom logos, colors, fonts configurable per city
- **Database Abstraction**: Abstraction layer from day 1 for future multi-database support

### Pending Decisions ⏸️
- **URL Structure**: Subdomain vs path-based (recommend deciding before Phase 1)
- **Monetization Strategy**: Can be decided post-launch
- **Default Languages**: Which UI languages to support initially (suggest: English, Dutch, French)
- **Project/Brand Name**: What should the platform be called?
- **Domain Name**: Finalize domain registration

---

## Problem Statement

### Current Limitations

Cities worldwide want to document and visualize their linguistic diversity, but face several challenges:

1. **No Flexible Tools**: Existing solutions have hardcoded data models that don't fit different cities' needs
2. **No Customization**: Cities can't define their own language classification schemes
3. **Data Sovereignty Concerns**:
   - "Our data must stay in our country" (GDPR compliance)
   - "We want full database access for our own analytics"
   - "What if we want to self-host later?"
4. **No Content Control**: Cities can't customize their about pages, methodology, or branding
5. **Multi-Language Complexity**: No built-in internationalization support
6. **Manual Work**: Creating descriptions and translations is time-consuming

### City-Specific Concerns

**Amsterdam**:
- Community Size (Small/Medium/Large)
- Endangerment Status (Safe/Vulnerable/Endangered)

**Tokyo** (hypothetical):
- Script Type (Logographic/Syllabic/Alphabetic)
- Official Status (Official/Recognized/Minority)

**Mexico City** (hypothetical):
- Historical Period (Pre-Hispanic/Colonial/Modern)
- Geographic Origin (Local/Migrant)

---

## Solution Overview

A multi-instance platform that provides:

1. **Flexible Taxonomy System**: Cities define their own language classification schemes
2. **Static Content Management**: Built-in CMS for customizable pages
3. **Per-City Branding**: Custom logos, colors, fonts, themes
4. **Multi-Language Support**: Full internationalization (i18n) from day 1
5. **AI-Powered Features**: AI description generation and translation assistance
6. **Multi-City Capabilities**: Users can work across multiple cities, data can be compared
7. **Data Sovereignty Options**: Database abstraction enables future migration to dedicated databases

---

## User Roles & Personas

### 1. Superuser (Platform Administrator)

**Who**: Platform owner/developer

**Needs**:
- Create and manage all cities on the platform
- Access any city's data and settings
- Manage platform-wide users
- View cross-city analytics
- Override any permissions for troubleshooting

**Key Features**:
- Superuser dashboard with all cities
- Platform-wide analytics
- Global settings management
- City creation and configuration
- User management across all cities

---

### 2. City Admin

**Who**: Project leads, coordinators for specific cities

**Examples**:
- Dr. Jane Smith - Amsterdam Language Map Project Lead
- Marie Dupont - Paris Linguistic Diversity Coordinator

**Needs**:
- Manage operators for their city/cities
- Configure city-specific settings (branding, taxonomies, locales)
- Access analytics for their city
- Customize content (About page, Methodology)
- Manage AI settings and source lists
- Access multiple cities if working across projects

**Key Features**:
- User invitation system
- Role management
- City configuration (map center, colors, logo)
- Analytics dashboard
- Audit logs
- All operator features
- AI source whitelist/blacklist management
- Locale configuration

---

### 3. Operator

**Who**: Researchers, linguists, data entry specialists

**Examples**:
- Ahmed Hassan - Community Coordinator documenting Somali speakers
- Yuki Tanaka - Linguist documenting Japanese dialects

**Needs**:
- Add and edit language data quickly
- Import data from spreadsheets
- Generate AI descriptions for communities
- Translate content with AI assistance
- Preview changes on map before publishing
- Work across multiple cities if granted access

**Key Features**:
- CRUD for languages, data points, descriptions
- Bulk import/export (CSV, GeoJSON)
- AI description generation
- AI-assisted translation with review
- Map preview
- Activity log (personal)
- Data validation & quality checks

---

### 4. Public User

**Who**: Website visitors, researchers, curious citizens

**Examples**:
- Tourist exploring Amsterdam's linguistic diversity
- Student researching migration patterns
- Journalist writing about multilingualism

**Needs**:
- Explore interactive map
- Filter languages by various criteria
- Read community stories
- Switch between languages (UI)
- View multiple cities simultaneously
- Access methodology and project information

**Key Features**:
- Interactive Mapbox map
- Dynamic filtering (based on city's taxonomies)
- Language search
- Community story popups
- Multi-language UI support
- Layer style toggles
- Responsive mobile design
- SEO-optimized pages
- Multi-city comparison views

---

## Core Features & Requirements

### 1. Flexible Taxonomy System

**Description**: Cities define their own language classification schemes instead of using hardcoded categories.

**Requirements**:
- Cities can create custom taxonomy types (e.g., "Size", "Status", "Script Type")
- Each taxonomy type has configurable values with translations
- Values can have visual styling (colors, icons) for map display
- Taxonomies can be marked as:
  - Required or optional
  - Single or multiple selection
  - Used for filtering
  - Used for map styling
- Languages are assigned taxonomy values by operators
- Map filters are dynamically generated from taxonomies
- Map marker colors/sizes are driven by taxonomy values

**User Stories**:
- As an admin, I want to define a "Community Size" taxonomy with Small/Medium/Large values
- As an admin, I want to set colors for each size value to display on the map
- As an operator, I want to assign the "Large" size to a language
- As a public user, I want to filter the map by community size

---

### 2. Static Content Management System

**Description**: Built-in CMS for creating and managing custom pages (About, Methodology, etc.)

**Requirements**:
- Cities can create custom pages with unique slugs
- Page builder with multiple section types:
  - Hero (large image with title overlay)
  - Text (rich text blocks with markdown)
  - Image (single image with caption)
  - Gallery (multiple images)
  - Video (embedded videos)
  - Team (team member cards with photos)
  - Partners (partner logo grid)
  - Stats (statistics cards)
  - CTA (call-to-action buttons)
  - Accordion (FAQ-style expandable items)
  - Divider (visual separators)
- All content is translatable
- Sections can be reordered
- Draft/publish workflow
- SEO metadata (title, description, image)
- Asset management (upload and organize images/files)

**User Stories**:
- As an admin, I want to create an About page with a hero image, text sections, and team member cards
- As an admin, I want to customize the Methodology page to explain our research approach
- As a public user, I want to read about the project in my preferred language

---

### 3. Brand Customization

**Description**: Per-city visual identity configuration

**Requirements**:
- Custom logo upload
- Color scheme configuration:
  - Primary color
  - Secondary color
  - Accent color
- Font selection:
  - Heading font
  - Body font
- Favicon
- Social media preview image
- Custom domain support (future)

**User Stories**:
- As an admin, I want to upload our organization's logo
- As an admin, I want to set our brand colors for the map and UI
- As a public user, I want to see the city's branding reflected throughout the site

---

### 4. Geographic Hierarchy

**Description**: Structured geographic organization for cities

**Requirements**:
- World regions (continents/macro-regions)
- Countries
- Cities
- Districts (within cities)
- Neighborhoods (within districts)
- All levels have translations
- Language points are linked to neighborhoods
- Filtering by geographic location

**User Stories**:
- As an operator, I want to add districts and neighborhoods for my city
- As an operator, I want to assign language points to specific neighborhoods
- As a public user, I want to filter languages by neighborhood

---

### 5. Multi-Language Support (i18n)

**Description**: Full internationalization support for UI and data

**Requirements**:
- Platform UI translated into multiple languages (English, Dutch, French, etc.)
- Each city can enable/disable specific locales
- All user-generated content is translatable:
  - City names and descriptions
  - District and neighborhood names
  - Language names (not endonyms)
  - Language family names
  - Descriptions
  - Taxonomy type and value names
  - Static page content
- Locale routing in URLs (`/en/amsterdam`, `/nl/amsterdam`)
- Automatic fallback to English if translation missing
- AI-assisted translation with review workflow

**User Stories**:
- As an admin, I want to enable Dutch and English for my Amsterdam site
- As an operator, I want to use AI to translate language names into Dutch
- As a public user, I want to switch between English and Dutch UI

---

### 6. AI Description Generation

**Description**: AI-powered generation of community descriptions

**Requirements**:
- Integration with OpenAI and Anthropic APIs
- Per-city AI configuration (provider, model, API key)
- Source whitelist/blacklist management
- Generation log for cost tracking and auditing
- AI-generated content is flagged and reviewable
- Operators can edit AI-generated descriptions
- Descriptions are translatable (manually or with AI)

**User Stories**:
- As an admin, I want to configure OpenAI API access for my city
- As an admin, I want to whitelist Wikipedia and Ethnologue as trusted sources
- As an operator, I want to generate a description for the Somali community
- As an operator, I want to review and edit the AI-generated description before publishing

---

### 7. AI-Assisted Translation

**Description**: AI-powered translation with human review

**Requirements**:
- Per-city AI translation configuration
- Support for OpenAI and Anthropic translation models
- Encrypted API key storage
- Translation of:
  - Language names
  - Descriptions
  - City/district/neighborhood names
  - Taxonomy names
  - Static page content
- All AI translations are flagged
- Operators can review and edit AI translations
- Bulk translation feature
- Translation tracking (model, timestamp, reviewer)

**User Stories**:
- As an admin, I want to enable AI translation for my city
- As an operator, I want to bulk-translate all language names into Dutch
- As an operator, I want to review and correct AI-translated content

---

### 8. Multi-City Access & Views

**Description**: Users can work across multiple cities, and data can be viewed together

**Requirements**:
- Users can be granted access to multiple cities
- User dashboard shows all accessible cities
- Multi-city views via query parameters: `?cities=amsterdam,paris`
- Compare mode: `/amsterdam?compare=paris`
- Combined map rendering with city color coding
- Multi-city filters and legend
- City comparison statistics (side-by-side)

**User Stories**:
- As an operator, I want to work on both Amsterdam and Paris projects
- As a public user, I want to view Amsterdam and Paris languages on the same map
- As a researcher, I want to compare language statistics between cities

---

### 9. Data Import & Export

**Description**: Bulk data operations for efficiency

**Requirements**:
- CSV import with validation and preview
- GeoJSON import for spatial data
- Taxonomy mapping during import
- Data export in multiple formats:
  - CSV
  - GeoJSON
  - JSON
- Import history and audit trail

**User Stories**:
- As an operator, I want to import 100 languages from a CSV file
- As an operator, I want to export all data for backup
- As a researcher, I want to download language data as GeoJSON

---

### 10. Interactive Map

**Description**: Public-facing map interface for exploring language data

**Requirements**:
- Mapbox GL JS integration
- Point clustering for performance
- Dynamic marker styling from taxonomies:
  - Colors
  - Sizes
  - Icons
- Interactive features:
  - Click for details
  - Hover for preview
  - Zoom and pan
  - Search
- Dynamic filtering based on city's taxonomies
- Layer style toggles (streets/satellite/dark)
- Mobile responsive
- Fast loading (<3 seconds)

**User Stories**:
- As a public user, I want to explore the map and see all languages
- As a public user, I want to filter by community size
- As a public user, I want to click on a marker to read the community story

---

### 11. User Management

**Description**: Invitation-based user system with role management

**Requirements**:
- Three-tier role hierarchy (Superuser, Admin, Operator)
- Email-based invitations
- Supabase Auth integration (magic links)
- Multi-city access grants
- Role promotion/demotion
- User deactivation
- Activity tracking
- Audit logs

**User Stories**:
- As an admin, I want to invite a new operator to help with data entry
- As a superuser, I want to grant a user access to both Amsterdam and Paris
- As an admin, I want to promote an operator to admin role

---

### 12. Analytics & Monitoring

**Description**: Insights into usage and data quality

**Requirements**:
- Map view counts
- Language data statistics
- User activity tracking
- Data completeness metrics
- Translation coverage reports
- AI generation cost tracking
- Error monitoring (Sentry)
- Performance monitoring

**User Stories**:
- As an admin, I want to see how many people viewed the map this month
- As an admin, I want to know which languages are missing descriptions
- As a superuser, I want to track AI generation costs across all cities

---

## Success Metrics

### Technical Metrics
- ✅ Sub-2s page load time (Lighthouse score >90)
- ✅ 99.9% uptime (Vercel infrastructure)
- ✅ Zero critical security vulnerabilities
- ✅ <100ms API response time (p95)
- ✅ Mobile usability score >90

### User Experience Metrics
- ✅ Operators can add a language in <2 minutes
- ✅ Public map loads in <3 seconds
- ✅ Clear error messages and helpful UI
- ✅ Intuitive navigation (low bounce rate)
- ✅ Positive user feedback

### Business Metrics (If Monetizing)
- ✅ 3+ cities launched in Year 1
- ✅ 10,000+ monthly map views per city
- ✅ 90% user satisfaction score
- ✅ Revenue targets (based on pricing tier)

---

## Constraints & Assumptions

### Constraints
- Solo development (one developer)
- 16-19 week timeline for MVP
- Budget-conscious (use free tiers where possible)
- No existing codebase to build on (greenfield)

### Assumptions
- Amsterdam will be the first pilot city
- Users have access to modern browsers
- Cities have existing language data to import
- Cities are willing to review AI-generated content
- Users are comfortable with invitation-based auth

---

## Potential Monetization Strategy (Future)

### Pricing Tiers

**Starter** ($50/month):
- Shared database
- Basic customization
- 1 city
- Community support

**Professional** ($150/month):
- Shared database
- Full customization (taxonomies + CMS)
- Up to 3 cities
- AI features (descriptions + translations)
- Email support

**Enterprise** ($500/month):
- Dedicated database or self-hosted option
- Unlimited cities
- White label
- API access
- Priority support
- Custom integrations

### Revenue Opportunity
- Database sovereignty is a selling point
- Charge premium for dedicated databases
- API access for developers
- Custom integrations and consulting

---

## Out of Scope for MVP

The following features are explicitly excluded from MVP to maintain timeline:

### ❌ Census Data Overlays
- Complexity: Very high
- Value: Medium (nice-to-have)
- Decision: Skip entirely for MVP

### ❌ Advanced Analytics Dashboard
- Charts and visualizations
- Heatmaps
- Engagement metrics
- Decision: Basic stats only, full dashboard post-MVP

### ❌ Public API
- REST or GraphQL public endpoints
- Developer documentation
- Rate limiting
- Decision: Post-MVP feature

### ❌ Mobile Apps
- React Native apps for iOS/Android
- Decision: Progressive Web App first

### ❌ Audio Pronunciations
- Recording/uploading audio for endonyms
- Decision: Post-MVP

### ❌ Historical Tracking
- Time-series data for language spread
- Decision: Post-MVP

### ❌ Community Contributions
- Public submissions with moderation
- Decision: Post-MVP (requires moderation system)

### ❌ Advanced Search
- Fuzzy matching
- Complex multi-criteria filters
- Decision: Basic search only for MVP

---

## Remaining Questions

### Technical
1. **URL structure final decision**: Path-based or subdomain?
   - *Recommendation*: Path-based (`language-map.org/amsterdam`) for simplicity

2. **Project/brand name**: What should we call it?
   - Current: "Language Map" (generic)
   - Suggestions: "Linguamap", "PolyglotCity", "WorldLang", "CityTongues"?

3. **Domain**: Do you own `language-map.org` or similar?

### Data
4. **Amsterdam Airtable**: Do I have access to API key already?

5. **Other cities**: Any specific cities you want to target first?
   - Academic contacts in Paris/Toronto/London?
   - Existing datasets available?

### Business
6. **Monetization timeline**: When do we want to start charging (if at all)?

7. **Target cities**: Any specific outreach plans or partnerships?

---

## Appendix: Changes from Previous Versions

### ✅ Added in v3.1:
- Superuser role and panel
- Multi-city user access
- Multi-city views and comparison
- AI description generation with source management
- AI-assisted translation with review workflow
- Per-city AI configuration
- Configurable locales per city
- Flexible taxonomy system
- Static content management system
- Brand customization per city
- Geographic hierarchy (districts, neighborhoods)
- World data structure (regions, countries)
- Database abstraction layer

### ✅ Removed from MVP:
- Census data overlays
- Material-UI (switched to Shadcn/ui)
- Team collaboration features (solo-optimized)
- Advanced analytics dashboard (simplified)

### ✅ Timeline Extended:
- From: 8-10 weeks (50 days)
- To: 16-19 weeks (70 days)
- Reason: Added i18n, AI features, flexible taxonomies, CMS

---

**Document Status**: Ready for approval
**Next Step**: Review and approve this PRD before proceeding to implementation


# Documentation

This directory contains comprehensive documentation for the Multi-City Language Mapping Platform project.

## Core Documentation

The following documents define the project requirements, architecture, design, and implementation strategy:

### [Product Requirements Document (PRD)](./prd.md)
Defines the product vision, features, user stories, and success metrics for the multi-city language mapping platform.

### [Technical Architecture](./architecture.md)
Complete technical architecture documentation including technology stack, database schema, multi-database strategy, security, and performance considerations.

### [Design Specifications](./design.md)
UI/UX design specifications covering user interface architecture, taxonomy system design, content management, branding, internationalization, AI features, and map design.

### [Implementation Plan](./implementation-plan.md)
70-day development roadmap with day-by-day tasks organized into 9 implementation phases.

### [Readiness Assessment](./readiness-assessment.md)
Assessment of implementation readiness including confidence levels, planning completion status, and next steps.

## Development Documentation

### [Local Development Setup](./local-development.md)
Guide for setting up the local development environment including Supabase configuration, environment variables, and development workflows.

## Implementation Phases

Documentation for each development phase is organized in the [implementation-phases](./implementation-phases/) directory:

### Phase 1: Foundation & i18n
- **Timeline:** Weeks 1-3
- **Focus:** Database setup, authentication, internationalization
- **Folder:** [implementation-phases/phase-1-foundation-i18n/](./implementation-phases/phase-1-foundation-i18n/)

### Phase 2: Operator CRUD
- **Timeline:** Weeks 4-6
- **Focus:** Geography, taxonomies, language CRUD operations
- **Folder:** [implementation-phases/phase-2-operator-crud/](./implementation-phases/phase-2-operator-crud/)

### Phase 3: Data Import & AI
- **Timeline:** Week 7
- **Focus:** CSV import, AI generation
- **Folder:** [implementation-phases/phase-3-data-import-ai/](./implementation-phases/phase-3-data-import-ai/)

### Phase 4: Public Map
- **Timeline:** Weeks 8-9
- **Focus:** Map interface, filtering
- **Folder:** [implementation-phases/phase-4-public-map/](./implementation-phases/phase-4-public-map/)

### Phase 5: Static CMS
- **Timeline:** Week 10
- **Focus:** Page builder, content management
- **Folder:** [implementation-phases/phase-5-static-cms/](./implementation-phases/phase-5-static-cms/)

### Phase 6: Multi-City Views
- **Timeline:** Week 11
- **Focus:** Multi-city comparison
- **Folder:** [implementation-phases/phase-6-multi-city-views/](./implementation-phases/phase-6-multi-city-views/)

### Phase 7: Admin & Branding
- **Timeline:** Week 12
- **Focus:** Admin panel, branding
- **Folder:** [implementation-phases/phase-7-admin-branding/](./implementation-phases/phase-7-admin-branding/)

### Phase 8: Amsterdam Import
- **Timeline:** Week 13
- **Focus:** Amsterdam data migration
- **Folder:** [implementation-phases/phase-8-amsterdam-import/](./implementation-phases/phase-8-amsterdam-import/)

### Phase 9: Testing & Launch
- **Timeline:** Weeks 14-15
- **Focus:** Testing, polish, deployment
- **Folder:** [implementation-phases/phase-9-testing-launch/](./implementation-phases/phase-9-testing-launch/)

## Processes & Standards

Development processes and standards are documented in the [processes](./processes/) directory:

### [Coding Standards](./processes/coding-standards.md)
Comprehensive coding standards covering code quality, commenting, error handling, and technology-specific best practices.

### [Frontend Testing Guide](./processes/frontend-testing-guide.md)
Guide for writing and organizing tests including unit tests, component tests, integration tests, and E2E tests.

### [Documentation Standards](./processes/documentation-standards.md)
Standards and conventions for maintaining project documentation including file naming, frontmatter requirements, and cross-reference format.

### [Documentation Compliance Agent](./processes/doc-compliance-agent.md)
Specification for the documentation compliance agent that validates documentation adherence to standards.

## External Documentation

- [CLAUDE.md](../CLAUDE.md) - Project context and operational guidelines for AI agents

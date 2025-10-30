# Phase 7: Admin Features & Branding

**Timeline:** Week 12 (Days 58-63)
**Status:** Not Started

## Overview

This phase completes the admin panel with comprehensive user management, city settings, and advanced branding customization capabilities.

## Key Deliverables

- ✅ Admins can fully configure cities and branding
- ✅ Multi-city user management
- ✅ City settings (name, coordinates, colors, locales)
- ✅ Advanced branding customization
- ✅ Grant/revoke city access for users

## Daily Breakdown

### Days 58-59: Multi-City User Management
- Create user list page
- Create user invitation form
- Implement city access grants (multi-select cities)
- Show user's accessible cities
- Test user management flows

### Day 60: City Settings
- Create city settings page
- General settings (name, country, slug)
- Map settings (center, zoom, style)
- Locale settings (default locale, enabled locales)
- Test settings updates

### Day 61: Advanced Branding Customization
- Create branding settings page
- Logo upload (light & dark variants)
- Color pickers (primary, secondary, accent)
- Font selectors (Google Fonts integration)
- Favicon upload
- Test branding application across site

### Day 62: Grant/Revoke City Access
- Implement grant access functionality
- Implement revoke access functionality
- Update `city_users` junction table
- Send notification emails
- Test access management

### Day 63: Testing All Administrative Functions
- End-to-end admin testing
- Test all CRUD operations
- Test permissions and access control
- Fix bugs and edge cases

## Critical Components

### Database Tables Used
- `cities` (settings, branding config)
- `user_profiles` (role management)
- `city_users` (multi-city access junction)
- `city_locales` (enabled locales per city)
- `city_assets` (logos, favicons)

### Key Features Implemented
- User invitation system
- Multi-city access management
- City configuration UI
- Branding customization
- Logo/favicon upload
- Color theme editor
- Font selection
- Locale management per city

## Documentation

Keep track of:
- User invitation email templates
- Branding configuration schema
- City settings validation rules
- Permission management logic
- Email notification triggers
- Asset upload constraints
- Theme application patterns

## Important Patterns

### Multi-City User Access
```sql
-- Grant access to multiple cities
INSERT INTO city_users (city_id, user_id, role)
VALUES
  ('amsterdam-uuid', 'user-uuid', 'operator'),
  ('paris-uuid', 'user-uuid', 'operator'),
  ('berlin-uuid', 'user-uuid', 'admin');
```

### Branding Configuration
```typescript
interface CityBranding {
  logo_light: string          // URL to logo for light theme
  logo_dark: string           // URL to logo for dark theme
  primary_color: string       // Hex color
  secondary_color: string     // Hex color
  accent_color: string        // Hex color
  font_family: string         // Google Font name
  favicon: string             // URL to favicon
  custom_css?: string         // Optional custom CSS
}
```

### City Settings
- Name and slug (internationalized)
- Country and region
- Map center coordinates
- Default zoom level
- Mapbox style URL
- Default locale
- Enabled locales (multi-select)
- Timezone
- Contact email

## Access Control

### Admin Capabilities
- Manage users for their cities
- Configure city settings
- Customize branding
- Manage locales
- Configure AI settings
- All operator permissions

### Superuser Capabilities
- All admin capabilities
- Create new cities
- Access all cities
- Manage global settings
- Override RLS policies

## Next Phase

Phase 8 will import the existing Amsterdam data from Airtable, including setting up custom taxonomies and creating translations.

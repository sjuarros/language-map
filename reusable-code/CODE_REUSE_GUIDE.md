# Code Reuse Guide for New Next.js Platform

This document identifies code from the current Amsterdam Language Map that can be **reused directly** or used as **reference** for the new Next.js 14 + Supabase platform.

## ✅ Directly Reusable (Copy & Adapt)

### 1. **Mapbox Layer Configuration** ⭐⭐⭐ HIGHLY VALUABLE

**Files**:
- `src/components/map/config.points.ts` - Language point layer styling
- `src/components/map/config.ts` - Map initialization settings

**What to reuse**:
```typescript
// Icon sizing based on zoom levels (works perfectly in new app)
'icon-size': [
  'step',
  ['zoom'],
  0.14, 10,
  0.17, 11,
  0.19, 13,
  0.21, 15,
  0.23, 17,
  0.26,
]

// Text label configuration
'text-field': ['to-string', ['get', 'Language']],
'text-font': ['Noto Sans Regular', 'Arial Unicode MS Regular'],
'text-radial-offset': 0.25,
'text-justify': 'auto',
'text-size': ['step', ['zoom'], 8, 10, 9, 11, 10, 14, 11],
'text-variable-anchor': [
  'bottom-left', 'top-left', 'bottom-right', 'top-right',
  'bottom', 'top', 'left', 'right', 'center',
]

// Initial map settings
export const AMSTERDAM_LAT_LONG = { latitude: 52.3676, longitude: 4.9041 }
export const initialMapState = { ...AMSTERDAM_LAT_LONG, zoom: 11 }
export const POINT_ZOOM_LEVEL = 13 // for clicked points

// Amsterdam metro bounds
export const initialBounds = [
  [4.728, 52.278], // Southwest
  [5.079, 52.431], // Northeast
]
```

**Adaptation needed**:
- Change property names to match new database (`Language` → use translated name from `language_translations`)
- Add multi-city support (color-code points by city)
- Replace tileset with dynamic GeoJSON API endpoint

---

### 2. **Utility Functions** ⭐⭐ USEFUL

**File**: `src/utils.ts`

**What to reuse**:
```typescript
// Window resize hook (for responsive map)
export function useWindowResize(): { width: number; height: number }

// Touch detection (for mobile optimizations)
export const isTouchEnabled = (): boolean

// String manipulation
export const toProperCase = (srcText: string): string
export const isAlpha = (ch: string): boolean
```

**Adaptation needed**:
- Remove Material-UI dependencies
- Convert to Next.js 14 patterns (can stay mostly the same)

---

### 3. **Map Icons & Assets** ⭐⭐⭐ KEEP

**Location**: `src/components/map/icons/`

**Files**:
- `book.svg` - Literary language
- `circle.svg` - Default marker
- `home.svg` - Residential
- `museum.svg` - Heritage language
- `tree.svg` - Language family
- `users.svg` - Community language

**What to do**: Copy entire `/icons` folder to new project's `/public/map-icons/`

---

### 4. **TypeScript Types (as reference)** ⭐⭐ REFERENCE ONLY

**File**: `src/components/context/types.ts`

**What to reference** (DON'T copy directly - database schema changed!):
```typescript
// Size categories
type Size = 'Smallest' | 'Small' | 'Medium' | 'Large' | 'Largest'

// Status types
type Statuses = 'Historical' | 'Community' | 'Liturgical' | 'Residential' | 'Reviving'

// Endangerment status (KEEP THIS!)
endangerment_status: 'safe' | 'vulnerable' | 'definitely_endangered' |
  'severely_endangered' | 'critically_endangered' | 'extinct'
```

**Map this to new schema**:
- `InstanceLevelSchema` → Database `language_points` + joins
- `LangLevelSchema` → Database `languages` + `language_translations`
- Update field names to match new i18n structure

---

## 📚 Use as Reference (Don't Copy - Reimplement)

### 5. **Map Layer Filtering Logic** ⭐⭐⭐ REFERENCE

**File**: `src/components/map/hooks.points.ts`

**Key concept** - Creating dynamic Mapbox filters:
```typescript
const createLayerStyles = (rows, group, baseLayer) =>
  rows.map((settings) => ({
    id: settings.name,
    type: 'symbol',
    group, // e.g., 'Language Family', 'World Region'
    filter: ['match', ['get', group], [settings.name], true, false],
    layout: {
      'icon-image': settings['icon-image'],
      'icon-size': settings['icon-size'],
    },
    paint: {
      'icon-color': settings['icon-color'],
      'text-color': settings['text-color'],
    },
  }))
```

**New implementation**:
- Fetch symbology from Supabase (could be in `language_families`, `world_regions` tables)
- Add translation support for filter names
- Add multi-city filtering

---

### 6. **GeoJSON Generation Pattern** ⭐⭐⭐ REFERENCE

**Concept from**: Data fetching hooks

**Current pattern** (Airtable → GeoJSON):
```javascript
// Fetch from Airtable
const records = await airtable.select().all()

// Transform to GeoJSON
const geojson = {
  type: 'FeatureCollection',
  features: records.map(record => ({
    type: 'Feature',
    id: record.id,
    geometry: {
      type: 'Point',
      coordinates: [record.get('Longitude'), record.get('Latitude')]
    },
    properties: {
      Language: record.get('Language'),
      Size: record.get('Size'),
      ...
    }
  }))
}
```

**New implementation** (already in strategic plan):
```typescript
// app/[locale]/[city]/api/geojson/route.ts
const { data: points } = await supabase
  .from('language_points')
  .select(`
    id, latitude, longitude,
    language:languages (
      id, endonym,
      translations:language_translations!inner (name)
    )
  `)
  .eq('city_id', cityId)
  .eq('translations.locale', locale)

const geojson = {
  type: 'FeatureCollection',
  features: points.map(point => ({
    type: 'Feature',
    id: point.id,
    geometry: {
      type: 'Point',
      coordinates: [point.longitude, point.latitude]
    },
    properties: {
      languageName: point.language.translations[0].name,
      endonym: point.language.endonym,
      ...
    }
  }))
}
```

---

### 7. **Map Interaction Patterns** ⭐⭐ REFERENCE

**Files**:
- `src/components/map/Map.tsx`
- `src/components/map/MapPopup.tsx`

**Patterns to reference**:
```typescript
// Click handling
const onClick = (event) => {
  const feature = event.features[0]
  if (feature) {
    setPopup({
      longitude: feature.geometry.coordinates[0],
      latitude: feature.geometry.coordinates[1],
      language: feature.properties.Language,
      // ... other data
    })
  }
}

// Hover cursor
const onMouseEnter = () => setCursor('pointer')
const onMouseLeave = () => setCursor('auto')

// Clustering
map.on('click', 'clusters', (e) => {
  const clusterId = e.features[0].properties.cluster_id
  map.getSource('languages').getClusterExpansionZoom(
    clusterId,
    (err, zoom) => {
      if (err) return
      map.easeTo({
        center: e.features[0].geometry.coordinates,
        zoom: zoom
      })
    }
  )
})
```

**New implementation**: Use `react-map-gl v7` (similar API, updated syntax)

---

### 8. **State Management Patterns** ⭐ REFERENCE ONLY

**Files**: `src/components/context/*`

**Current approach**: React Context + useReducer

**Patterns to reference**:
- `GlobalContext` - Language filtering state
- `MapToolsContext` - UI state (layer toggles, base layer)
- `PanelContext` - Side panel state

**New implementation**: Use **Zustand** for simpler state management
```typescript
// store/mapStore.ts (NEW)
export const useMapStore = create((set) => ({
  baseLayer: 'light',
  showNeighborhoods: false,
  filteredLanguages: [],
  setBaseLayer: (layer) => set({ baseLayer: layer }),
  toggleNeighborhoods: () => set((state) => ({
    showNeighborhoods: !state.showNeighborhoods
  })),
}))
```

---

## ❌ Do NOT Reuse (Outdated/Incompatible)

### 9. **React Router v5 Code**
- All routing logic is Next.js 14 now
- `useRouteMatch`, `useHistory`, `<Route>` → Next.js App Router

### 10. **Material-UI v4 Components**
- Completely different component library (Shadcn/ui)
- Styling approach changed (JSS → Tailwind CSS)

### 11. **Airtable Hooks**
- `useAirtable` hooks → Supabase queries with TanStack Query
- Different query patterns entirely

### 12. **react-query v2**
- Upgrade to TanStack Query v5 (API changed significantly)

---

## 🎯 Priority Reuse Checklist

Use this checklist when starting the new project:

### Week 1 (Foundation)
- [ ] Copy `/icons` folder to `/public/map-icons/`
- [ ] Copy Amsterdam lat/lng, zoom, and bounds constants
- [ ] Copy `useWindowResize` utility hook
- [ ] Reference TypeScript types for field names

### Week 5-6 (Map Implementation)
- [ ] Copy Mapbox icon sizing configuration
- [ ] Copy text label configuration
- [ ] Copy icon defaults and style overrides
- [ ] Reference layer filtering logic pattern
- [ ] Reference map event handlers (click, hover)

### Week 7 (Map Polish)
- [ ] Reference clustering implementation
- [ ] Reference popup component structure
- [ ] Copy base layer toggle logic pattern

---

## 📦 Extraction Script

Here's a quick script to extract reusable code into a reference folder:

```bash
#!/bin/bash
# Run from project root

mkdir -p ../language-map-reusable-code

# Copy icons
cp -r src/components/map/icons ../language-map-reusable-code/

# Copy key config files for reference
cp src/components/map/config.points.ts ../language-map-reusable-code/
cp src/components/map/config.ts ../language-map-reusable-code/
cp src/utils.ts ../language-map-reusable-code/

# Copy types for reference
cp src/components/context/types.ts ../language-map-reusable-code/types-reference.ts

echo "✅ Reusable code extracted to ../language-map-reusable-code/"
```

---

## 🎨 Design Assets to Keep

In addition to code, keep these design decisions:

1. **Color Palette** - World region colors, size colors (check Airtable)
2. **Icon System** - The 6 status icons work well
3. **Map Style URLs** - Custom Mapbox styles with uploaded fonts
4. **Font Choices** - Noto Sans for multilingual support
5. **Zoom Levels** - The step functions for icon/text sizing are well-tuned

---

## 💡 Recommended Approach

**Phase 1**: Before starting new project
1. Run extraction script above
2. Review `config.points.ts` - this is your most valuable file
3. Keep `icons/` folder handy
4. Screenshot current map at various zoom levels for reference

**Phase 2**: During implementation
1. Start with map config (Week 5)
2. Copy icon sizing exactly (it's well-tested)
3. Reference filtering patterns (don't copy directly due to schema changes)
4. Use interaction patterns as guide (event handlers, cursor changes)

**Phase 3**: Data migration (Week 11)
1. Reference type definitions for field mapping
2. Ensure Amsterdam bounds match exactly
3. Test zoom levels match original app

---

**Bottom Line**: ~15% of code is directly reusable (mostly map config), ~30% is valuable as reference (patterns and logic), ~55% needs complete rewrite (UI components, routing, data layer).

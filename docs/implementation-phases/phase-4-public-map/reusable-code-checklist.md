---
title: "Phase 4: Reusable Code Checklist"
description: Checklist of reusable code from Amsterdam App for Phase 4 implementation including map assets and components
category: implementation
tags: [reusable-code, phase-4, checklist, assets]
---

# Phase 4: Reusable Code from Amsterdam App

**Reference:** `/reusable-code/` folder contains extracted code from original Amsterdam Language Map

---

## 🎯 Priority Reuse Checklist for Phase 4

### Day 35: Copy Map Assets ⭐⭐⭐ CRITICAL

#### Icons (Directly Reusable)
```bash
# Copy icons from reusable-code to public folder
cp -r reusable-code/icons public/map-icons/
```

**Files to copy**:
- `book.svg` - Literary language
- `circle.svg` - Default marker
- `home.svg` - Residential
- `museum.svg` - Heritage language
- `tree.svg` - Language family
- `users.svg` - Community language

#### Amsterdam Map Constants (Directly Reusable)

**File to reference**: `reusable-code/config.ts`

```typescript
// lib/map/constants.ts (NEW FILE)

export const AMSTERDAM_CENTER = {
  latitude: 52.3676,
  longitude: 4.9041
}

export const AMSTERDAM_INITIAL_ZOOM = 11
export const POINT_ZOOM_LEVEL = 13 // for clicked points

// Amsterdam metro area bounds
export const AMSTERDAM_BOUNDS = [
  [4.728, 52.278], // Southwest corner
  [5.079, 52.431], // Northeast corner
]

// Custom Mapbox styles with Noto Sans fonts
export const MAPBOX_CUSTOM_STYLES = {
  dark: 'mapbox://styles/elalliance/ckdqj968x01ot19lf5yg472f2',
  light: 'mapbox://styles/elalliance/ckdovh9us01wz1ipa5fjihv7l',
  none: 'mapbox://styles/elalliance/cki50pk2s00ux19phcg6k2tjc',
}
```

#### Utility Hooks (Directly Reusable)

**File to reference**: `reusable-code/utils.ts`

```typescript
// lib/hooks/useWindowResize.ts (NEW FILE)
// Copy useWindowResize() function from utils.ts

// lib/utils/device.ts (NEW FILE)
// Copy isTouchEnabled() function from utils.ts
```

---

### Day 38: Copy Mapbox Configuration ⭐⭐⭐ HIGHLY VALUABLE

**File to reference**: `reusable-code/config.points.ts`

#### Icon Sizing Configuration (Directly Reusable)

```typescript
// lib/map/iconConfig.ts (NEW FILE)

// Copy this EXACT configuration - it's well-tuned!
export const iconSizeConfig = [
  'step',
  ['zoom'],
  0.14, // zoom < 10
  10, 0.17,
  11, 0.19,
  13, 0.21,
  15, 0.23,
  17, 0.26, // zoom >= 17
]

// For non-circle icons (slightly bigger)
export const iconStyleOverride = [
  'step',
  ['zoom'],
  0.25, // zoom < 10
  10, 0.28,
  11, 0.31,
  13, 0.33,
  15, 0.36,
  17, 0.39, // zoom >= 17
]
```

#### Text Label Configuration (Directly Reusable)

```typescript
// lib/map/textConfig.ts (NEW FILE)

export const textLabelConfig = {
  'text-field': ['to-string', ['get', 'languageName']], // Adapt property name
  'text-font': ['Noto Sans Regular', 'Arial Unicode MS Regular'],
  'text-radial-offset': 0.25,
  'text-justify': 'auto',
  'text-size': [
    'step',
    ['zoom'],
    8,  // zoom < 10
    10, 9,
    11, 10,
    14, 11, // zoom >= 14
  ],
  'text-variable-anchor': [
    'bottom-left', 'top-left', 'bottom-right', 'top-right',
    'bottom', 'top', 'left', 'right', 'center',
  ],
}
```

---

### Day 40: Reference Layer Filtering Pattern 📚 REFERENCE ONLY

**File to reference**: `reusable-code/hooks-reference/hooks.points.ts`

**Key Pattern**: Dynamic Mapbox filter creation

```typescript
// Do NOT copy directly - adapt for new taxonomy system

// OLD pattern (Airtable-based):
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

// NEW implementation (Taxonomy-based):
// Fetch taxonomy values from Supabase
// Generate Mapbox expressions dynamically
// See implementation-plan.md Phase 4 Day 40 for details
```

---

### Day 43: Reference Map Interaction Patterns 📚 REFERENCE ONLY

**Files to reference**:
- `reusable-code/hooks-reference/hooks.tsx` (GeoJSON patterns)
- Map interaction snippets from CODE_REUSE_GUIDE.md

#### Click Handling Pattern

```typescript
// Reference pattern - adapt for Next.js + react-map-gl v7

const onClick = (event) => {
  const feature = event.features?.[0]
  if (feature) {
    setPopup({
      longitude: feature.geometry.coordinates[0],
      latitude: feature.geometry.coordinates[1],
      languageId: feature.properties.languageId,
      languageName: feature.properties.languageName,
      endonym: feature.properties.endonym,
    })
  }
}
```

#### Hover Cursor Pattern

```typescript
const onMouseEnter = () => setCursor('pointer')
const onMouseLeave = () => setCursor('auto')
```

#### Clustering Pattern

```typescript
// Reference: Click on cluster to zoom in
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

---

### Day 44: Reference Base Layer Toggle Pattern 📚 REFERENCE ONLY

```typescript
// Reference pattern - implement with Zustand state management

// Use Amsterdam custom Mapbox styles
const baseLayerStyles = {
  dark: 'mapbox://styles/elalliance/ckdqj968x01ot19lf5yg472f2',
  light: 'mapbox://styles/elalliance/ckdovh9us01wz1ipa5fjihv7l',
  none: 'mapbox://styles/elalliance/cki50pk2s00ux19phcg6k2tjc',
}

// Store in Zustand
export const useMapStore = create((set) => ({
  baseLayer: 'light',
  setBaseLayer: (layer) => set({ baseLayer: layer }),
}))
```

---

## 🎨 Design Assets to Keep

From original Amsterdam app:

1. **Color Palette** - World region colors, size colors
   - Reference Airtable or screenshot current app

2. **Icon System** - The 6 status icons work well
   - ✅ Already extracted to `reusable-code/icons/`

3. **Map Style URLs** - Custom Mapbox styles with Noto Sans
   - ✅ URLs documented above

4. **Font Choices** - Noto Sans for multilingual support
   - ✅ Already in custom Mapbox styles

5. **Zoom Levels** - Step functions are well-tuned
   - ✅ Icon and text sizing configurations above

---

## ⚠️ Important: What NOT to Copy

### ❌ Do NOT Copy Directly

1. **React Router code** → Use Next.js 15+ App Router
2. **Material-UI components** → Use Shadcn/ui
3. **Airtable hooks** → Use Supabase + TanStack Query
4. **Context API state** → Use Zustand
5. **Type definitions** → Database schema changed (i18n structure)

### 📝 Use as Reference Only

- Map interaction event handlers (adapt syntax for react-map-gl v7)
- GeoJSON transformation patterns (Airtable → will be Supabase)
- Layer filtering logic (adapt for taxonomy system)
- Popup component structure (rewrite with Shadcn/ui)

---

## ✅ Phase 4 Reuse Summary

**~15% directly reusable**:
- Map icons (6 SVG files)
- Amsterdam constants (coords, zoom, bounds)
- Mapbox configuration (icon sizing, text labels)
- Utility functions (useWindowResize, isTouchEnabled)

**~30% valuable as reference**:
- Layer filtering patterns
- Map interaction handlers
- GeoJSON generation patterns
- Clustering implementation

**~55% needs complete rewrite**:
- UI components (Material-UI → Shadcn/ui)
- Routing (React Router → Next.js)
- Data layer (Airtable → Supabase)
- State management (Context → Zustand)

---

**Reference Documentation**:
- `reusable-code/README.md` - Quick start guide
- `reusable-code/CODE_REUSE_GUIDE.md` - Detailed reuse instructions
- `reusable-code/config.points.ts` - ⭐ Most valuable file
- `reusable-code/config.ts` - Map constants
- `reusable-code/utils.ts` - Utility functions

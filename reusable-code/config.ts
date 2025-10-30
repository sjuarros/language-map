import { BaseLayer, InitialMapProps, BoundsArray } from './types'
import { censusLayersConfig } from './config.census'
import { nonCensusPolygonConfig } from './config.non-census-poly'

export * from './config.points'

export const MAPBOX_TOKEN = process.env.REACT_APP_MB_TOKEN
export const AMSTERDAM_LAT_LONG = { latitude: 52.3676, longitude: 4.9041 }
export const initialMapState = { ...AMSTERDAM_LAT_LONG, zoom: 11 }
export const POINT_ZOOM_LEVEL = 13 // clicked point or single-result filter
export const mbStyleTileConfig = {
  layerId: 'mb-data', // TODO: a dev/deploy-only instance!
  langSrcID: 'languages-src', // arbitrary, set in code, never changes
  tilesetId: 'elalliance.ckja99koi2iq623pep38azez5-1ea9g',
  // Custom MB Style: the only known way to use the custom fonts
  customStyles: {
    dark: 'mapbox://styles/elalliance/ckdqj968x01ot19lf5yg472f2',
    light: 'mapbox://styles/elalliance/ckdovh9us01wz1ipa5fjihv7l',
    none: 'mapbox://styles/elalliance/cki50pk2s00ux19phcg6k2tjc',
  } as { [key in BaseLayer]: string },
}

export const allPolyLayersConfig = {
  ...censusLayersConfig,
  ...nonCensusPolygonConfig,
}

export const mapProps: InitialMapProps = {
  attributionControl: false,
  className: 'mb-language-map',
  clickRadius: 4, // much comfier for small points on small screens
  height: '100%',
  mapboxApiAccessToken: MAPBOX_TOKEN,
  mapOptions: { logoPosition: 'bottom-left' },
  maxZoom: 18, // 18 is kinda misleading w/the dispersed points, but looks good
  width: '100%',
}

// Amsterdam metro area bounds
export const initialBounds = [
  [4.728, 52.278], // Southwest corner
  [5.079, 52.431], // Northeast corner
] as BoundsArray

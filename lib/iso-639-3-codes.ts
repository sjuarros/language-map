/**
 * ISO 639-3 Language Code Validation
 * ===================================
 * Validates language codes against the ISO 639-3 standard.
 *
 * ISO 639-3 is a comprehensive standard for language codes with 7000+ codes.
 * This file includes commonly used codes for validation. For production with
 * extensive language coverage, consider:
 * 1. Loading the full ISO 639-3 dataset into the database
 * 2. Using a third-party library like 'iso-639-3'
 * 3. Fetching from an API like https://iso639-3.sil.org/
 *
 * @module lib/iso-639-3-codes
 */

/**
 * Set of valid ISO 639-3 language codes
 *
 * This list includes commonly used codes. Expand as needed for your use case.
 * Source: https://iso639-3.sil.org/code_tables/639/data
 */
export const VALID_ISO_639_3_CODES = new Set([
  // Major world languages
  'eng', // English
  'spa', // Spanish
  'fra', // French
  'deu', // German
  'ita', // Italian
  'por', // Portuguese
  'rus', // Russian
  'jpn', // Japanese
  'kor', // Korean
  'cmn', // Mandarin Chinese
  'yue', // Cantonese
  'arb', // Standard Arabic
  'hin', // Hindi
  'ben', // Bengali
  'tam', // Tamil
  'tel', // Telugu
  'tur', // Turkish
  'vie', // Vietnamese
  'pol', // Polish
  'ukr', // Ukrainian
  'nld', // Dutch
  'ell', // Modern Greek
  'heb', // Hebrew
  'tha', // Thai
  'ind', // Indonesian
  'msa', // Malay
  'swe', // Swedish
  'nor', // Norwegian
  'dan', // Danish
  'fin', // Finnish
  'ces', // Czech
  'hun', // Hungarian
  'ron', // Romanian
  'cat', // Catalan
  'hrv', // Croatian
  'srp', // Serbian
  'bul', // Bulgarian
  'slk', // Slovak
  'slv', // Slovenian
  'lit', // Lithuanian
  'lav', // Latvian
  'est', // Estonian
  'mkd', // Macedonian
  'sqi', // Albanian
  'eus', // Basque
  'glg', // Galician
  'isl', // Icelandic
  'gle', // Irish
  'cym', // Welsh
  'bre', // Breton
  'gla', // Scottish Gaelic

  // Regional languages commonly found in European cities
  'afr', // Afrikaans
  'swa', // Swahili
  'som', // Somali
  'amh', // Amharic
  'tir', // Tigrinya
  'urd', // Urdu
  'pan', // Punjabi
  'guj', // Gujarati
  'mar', // Marathi
  'mal', // Malayalam
  'kan', // Kannada
  'ori', // Oriya
  'asm', // Assamese
  'nep', // Nepali
  'sin', // Sinhala
  'pus', // Pashto
  'fas', // Persian
  'kur', // Kurdish
  'aze', // Azerbaijani
  'kaz', // Kazakh
  'uzb', // Uzbek
  'tgk', // Tajik
  'tuk', // Turkmen
  'mon', // Mongolian
  'bod', // Tibetan
  'mya', // Burmese
  'khm', // Khmer
  'lao', // Lao
  'fil', // Filipino
  'tgl', // Tagalog
  'zlm', // Malay (Latin script)
  'jav', // Javanese
  'sun', // Sundanese

  // Indigenous and minority languages
  'que', // Quechua
  'aym', // Aymara
  'grn', // Guarani
  'nah', // Nahuatl
  'mri', // Maori
  'haw', // Hawaiian
  'nav', // Navajo
  'chr', // Cherokee
  'iku', // Inuktitut
  'krl', // Karelian
  'sme', // Northern Sami
  'smj', // Lule Sami
  'sma', // Southern Sami
  'smn', // Inari Sami
  'sms', // Skolt Sami
  'fry', // Western Frisian
  'frr', // Northern Frisian
  'nds', // Low German
  'ltz', // Luxembourgish
  'rom', // Romani
  'yid', // Yiddish
  'lad', // Ladino

  // Sign languages
  'ase', // American Sign Language
  'bfi', // British Sign Language
  'fsl', // French Sign Language
  'gsg', // German Sign Language
  'nsi', // Norwegian Sign Language
  'ssl', // Swedish Sign Language
  'dse', // Dutch Sign Language

  // Additional codes
  'lat', // Latin
  'san', // Sanskrit
  'pli', // Pali
  'chu', // Church Slavonic
  'cop', // Coptic
  'got', // Gothic
  'ang', // Old English
  'non', // Old Norse
  'gmh', // Middle High German
  'enm', // Middle English
  'frm', // Middle French

  // Constructed languages
  'epo', // Esperanto
  'ina', // Interlingua
  'ido', // Ido
  'vol', // Volapük
  'jbo', // Lojban

  // Additional major languages
  'zho', // Chinese (generic)
  'ara', // Arabic (generic)
  'msa', // Malay (generic)
  'swa', // Swahili
  'hau', // Hausa
  'yor', // Yoruba
  'ibo', // Igbo
  'zul', // Zulu
  'xho', // Xhosa
  'sot', // Sotho
  'tsn', // Tswana
  'mlg', // Malagasy
])

/**
 * Validates an ISO 639-3 language code
 *
 * @param code - The 3-letter language code to validate
 * @returns True if the code is valid, false otherwise
 *
 * @example
 * ```typescript
 * isValidISO639_3('eng') // true
 * isValidISO639_3('jpn') // true
 * isValidISO639_3('inv') // false
 * isValidISO639_3('xyz') // false
 * ```
 */
export function isValidISO639_3(code: string | null | undefined): boolean {
  if (!code) return true // Allow empty/null values (optional field)

  // Check format first
  if (!/^[a-z]{3}$/.test(code)) {
    return false
  }

  // Check against known codes
  return VALID_ISO_639_3_CODES.has(code)
}

/**
 * Get a helpful error message for an invalid ISO code
 *
 * @param code - The invalid code
 * @returns Error message with suggestions
 */
export function getISOCodeErrorMessage(code: string): string {
  if (!code || code.length === 0) {
    return 'ISO 639-3 code is optional'
  }

  if (!/^[a-z]{3}$/.test(code)) {
    return 'ISO 639-3 code must be exactly 3 lowercase letters'
  }

  // Suggest similar codes if available
  const suggestions: string[] = []
  const codePrefix = code.substring(0, 2)

  for (const validCode of VALID_ISO_639_3_CODES) {
    if (validCode.startsWith(codePrefix)) {
      suggestions.push(validCode)
      if (suggestions.length >= 3) break
    }
  }

  if (suggestions.length > 0) {
    return `"${code}" is not a valid ISO 639-3 code. Did you mean: ${suggestions.join(', ')}?`
  }

  return `"${code}" is not a valid ISO 639-3 code. Please check https://iso639-3.sil.org/code_tables/639/data`
}

/**
 * CSV Parser for Language Data Import
 *
 * Provides functionality to parse, validate, and preview CSV files
 * for bulk language data import with taxonomy mapping support.
 */

/**
 * Maximum length for language names
 */
const MAX_LANGUAGE_NAME_LENGTH = 200;

/**
 * Represents a parsed CSV row with language data
 */
export interface ParsedLanguageRow {
  /** Row number in the CSV file (1-indexed) */
  rowNumber: number;
  /** Language name (will be translated) */
  name: string;
  /** Universal endonym (not translated) */
  endonym?: string;
  /** ISO 639-3 language code (3 letters) */
  iso_639_3_code?: string;
  /** Language family name */
  language_family?: string;
  /** Country of origin */
  country_of_origin?: string;
  /** Original taxonomy data from CSV (key-value pairs) */
  taxonomies: Record<string, string>;
  /** Any additional custom fields */
  custom_fields: Record<string, string>;
}

/**
 * Validation error for a specific row and field
 */
export interface ValidationError {
  /** Row number where error occurred */
  rowNumber: number;
  /** Field name with the error */
  field: string;
  /** Error message */
  message: string;
  /** Severity level */
  severity: 'error' | 'warning';
}

/**
 * Result of CSV parsing operation
 */
export interface ParseResult {
  /** Successfully parsed rows */
  rows: ParsedLanguageRow[];
  /** Validation errors and warnings */
  errors: ValidationError[];
  /** Total number of rows processed */
  totalRows: number;
  /** Number of valid rows */
  validRows: number;
  /** Detected column headers */
  headers: string[];
}

/**
 * Configuration for CSV parsing
 */
export interface ParseConfig {
  /** Maximum file size in bytes (default: 5MB) */
  maxFileSize?: number;
  /** Maximum number of rows to parse (default: 10000) */
  maxRows?: number;
  /** CSV delimiter character (default: ',') */
  delimiter?: string;
  /** Required column headers */
  requiredColumns?: string[];
}

/**
 * Parses a CSV file and validates the data for language import
 *
 * @param file - The CSV file to parse
 * @param config - Optional parsing configuration
 * @returns Promise resolving to parse result with rows and errors
 * @throws Error if file cannot be read or is invalid format
 */
export async function parseLanguageCSV(
  file: File,
  config: ParseConfig = {}
): Promise<ParseResult> {
  try {
    // Validate input parameters
    if (!file) {
      throw new Error('No file provided for parsing');
    }

    // Apply default configuration
    const {
      maxFileSize = 5 * 1024 * 1024, // 5MB
      maxRows = 10000,
      delimiter = ',',
      requiredColumns = ['name']
    } = config;

    // Validate file size
    if (file.size > maxFileSize) {
      throw new Error(`File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${(maxFileSize / 1024 / 1024).toFixed(2)}MB)`);
    }

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      throw new Error('Invalid file type. Only CSV files are supported.');
    }

    // Read file content
    const content = await readFileContent(file);

    // Parse CSV content
    const { headers, rows: rawRows } = parseCSVContent(content, delimiter);

    // Validate required columns
    const missingColumns = requiredColumns.filter(col => !headers.includes(col));
    if (missingColumns.length > 0) {
      throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
    }

    // Limit number of rows
    const limitedRows = rawRows.slice(0, maxRows);
    if (rawRows.length > maxRows) {
      console.warn(`CSV contains ${rawRows.length} rows, but only ${maxRows} will be processed`);
    }

    // Parse and validate each row
    const rows: ParsedLanguageRow[] = [];
    const errors: ValidationError[] = [];

    limitedRows.forEach((rawRow, index) => {
      const rowNumber = index + 2; // +2 because index is 0-based and row 1 is header

      try {
        const parsedRow = parseRow(rawRow, headers, rowNumber);
        const rowErrors = validateRow(parsedRow, headers);

        rows.push(parsedRow);
        errors.push(...rowErrors);
      } catch (error) {
        // Log error for debugging
        console.error(`Error parsing row ${rowNumber}:`, error);

        errors.push({
          rowNumber,
          field: 'row',
          message: error instanceof Error ? error.message : 'Unknown error parsing row',
          severity: 'error'
        });
      }
    });

    const validRows = rows.filter(row => {
      const rowErrors = errors.filter(e => e.rowNumber === row.rowNumber && e.severity === 'error');
      return rowErrors.length === 0;
    });

    return {
      rows,
      errors,
      totalRows: limitedRows.length,
      validRows: validRows.length,
      headers
    };
  } catch (error) {
    // Log error for debugging
    console.error('CSV parsing error:', error);

    // Re-throw with context
    throw new Error(`Failed to parse CSV file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Reads file content as text
 *
 * @param file - File to read
 * @returns Promise resolving to file content as string
 * @throws Error if file reading fails or reader cannot be initialized
 */
function readFileContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Validate file parameter
      if (!file || !(file instanceof File)) {
        reject(new Error('Invalid file object provided'));
        return;
      }

      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          if (!e.target?.result) {
            reject(new Error('Failed to read file content: No data returned'));
            return;
          }
          resolve(e.target.result as string);
        } catch (error) {
          reject(new Error(`Error processing file data: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
      };

      reader.onerror = () => {
        const errorMsg = reader.error
          ? `File reading failed: ${reader.error.message}`
          : 'File reading failed: Unknown error';
        reject(new Error(errorMsg));
      };

      reader.onabort = () => {
        reject(new Error('File reading was aborted'));
      };

      reader.readAsText(file);
    } catch (error) {
      reject(new Error(`Failed to initialize file reader: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  });
}

/**
 * Parses CSV content into headers and rows
 *
 * @param content - CSV file content as string
 * @param delimiter - CSV delimiter character
 * @returns Object with headers array and rows array
 * @throws Error if content is invalid or delimiter is not a single character
 */
function parseCSVContent(content: string, delimiter: string): {
  headers: string[];
  rows: string[][];
} {
  // Validate input parameters
  if (!content || typeof content !== 'string') {
    throw new Error('CSV content must be a non-empty string');
  }

  if (!delimiter || typeof delimiter !== 'string' || delimiter.length !== 1) {
    throw new Error('Delimiter must be a single character');
  }

  // Split into lines and filter empty lines
  const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);

  if (lines.length === 0) {
    throw new Error('CSV file is empty');
  }

  // Parse header row
  const headers = parseCSVLine(lines[0], delimiter).map(h => h.trim().toLowerCase());

  if (headers.length === 0) {
    throw new Error('CSV file has no columns');
  }

  // Check for duplicate headers
  const uniqueHeaders = new Set(headers);
  if (uniqueHeaders.size !== headers.length) {
    throw new Error('CSV file contains duplicate column headers');
  }

  // Parse data rows
  const rows = lines.slice(1).map(line => parseCSVLine(line, delimiter));

  return { headers, rows };
}

/**
 * Parses a single CSV line, handling quoted values
 *
 * @param line - CSV line to parse
 * @param delimiter - CSV delimiter character
 * @returns Array of cell values
 */
function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      // End of cell
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  // Add last cell
  result.push(current);

  return result;
}

/**
 * Parses a single row into a ParsedLanguageRow object
 *
 * @param row - Raw row data (array of cell values)
 * @param headers - Column headers
 * @param rowNumber - Row number for error reporting
 * @returns Parsed language row
 * @throws Error if row data, headers, or row number are invalid
 */
function parseRow(
  row: string[],
  headers: string[],
  rowNumber: number
): ParsedLanguageRow {
  // Validate inputs
  if (!row || !Array.isArray(row)) {
    throw new Error(`Invalid row data at line ${rowNumber}`);
  }

  if (!headers || !Array.isArray(headers) || headers.length === 0) {
    throw new Error('Headers array is required and must not be empty');
  }

  if (typeof rowNumber !== 'number' || rowNumber < 1) {
    throw new Error('Row number must be a positive number');
  }

  // Create a map of header to value
  const rowData: Record<string, string> = {};
  headers.forEach((header, index) => {
    rowData[header] = row[index]?.trim() || '';
  });

  // Extract standard fields
  const name = rowData.name || '';
  const endonym = rowData.endonym || undefined;
  const iso_639_3_code = rowData.iso_639_3_code || rowData.iso_code || undefined;
  const language_family = rowData.language_family || rowData.family || undefined;
  const country_of_origin = rowData.country_of_origin || rowData.country || undefined;

  // Identify taxonomy columns (any column not matching standard fields)
  const standardFields = new Set([
    'name', 'endonym', 'iso_639_3_code', 'iso_code',
    'language_family', 'family', 'country_of_origin', 'country'
  ]);

  const taxonomies: Record<string, string> = {};
  const custom_fields: Record<string, string> = {};

  headers.forEach(header => {
    if (!standardFields.has(header) && rowData[header]) {
      // Taxonomy columns often have names like "size", "status", "script_type"
      // Custom fields are anything else
      if (header.includes('_') || header.length < 20) {
        taxonomies[header] = rowData[header];
      } else {
        custom_fields[header] = rowData[header];
      }
    }
  });

  return {
    rowNumber,
    name,
    endonym,
    iso_639_3_code,
    language_family,
    country_of_origin,
    taxonomies,
    custom_fields
  };
}

/**
 * Validates a parsed row and returns any errors/warnings
 *
 * @param row - Parsed language row
 * @param _headers - Column headers for context (reserved for future use)
 * @returns Array of validation errors
 */
function validateRow(row: ParsedLanguageRow, _headers: string[]): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validate required field: name
  if (!row.name || row.name.trim().length === 0) {
    errors.push({
      rowNumber: row.rowNumber,
      field: 'name',
      message: 'Language name is required',
      severity: 'error'
    });
  }

  // Validate name length
  if (row.name && row.name.length > MAX_LANGUAGE_NAME_LENGTH) {
    errors.push({
      rowNumber: row.rowNumber,
      field: 'name',
      message: `Language name exceeds maximum length (${MAX_LANGUAGE_NAME_LENGTH} characters)`,
      severity: 'error'
    });
  }

  // Validate ISO code format (should be exactly 3 letters)
  if (row.iso_639_3_code) {
    if (!/^[a-z]{3}$/i.test(row.iso_639_3_code)) {
      errors.push({
        rowNumber: row.rowNumber,
        field: 'iso_639_3_code',
        message: 'ISO 639-3 code must be exactly 3 letters',
        severity: 'warning'
      });
    }
  }

  // Warn if endonym is missing
  if (!row.endonym) {
    errors.push({
      rowNumber: row.rowNumber,
      field: 'endonym',
      message: 'Endonym is recommended but not required',
      severity: 'warning'
    });
  }

  return errors;
}

/**
 * Generates a sample CSV template with headers
 *
 * @param taxonomyTypes - Optional taxonomy type names to include as columns
 * @returns CSV template string
 */
export function generateCSVTemplate(taxonomyTypes: string[] = []): string {
  const standardHeaders = [
    'name',
    'endonym',
    'iso_639_3_code',
    'language_family',
    'country_of_origin'
  ];

  const allHeaders = [...standardHeaders, ...taxonomyTypes];

  // Create header row
  const headerRow = allHeaders.join(',');

  // Create example row
  const exampleRow = [
    'Spanish',
    'Español',
    'spa',
    'Indo-European',
    'Spain',
    ...taxonomyTypes.map(() => '') // Empty taxonomy values
  ].join(',');

  return `${headerRow}\n${exampleRow}`;
}

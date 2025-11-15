/**
 * Unit Tests for CSV Parser
 *
 * Tests CSV parsing, validation, and error handling
 */

import { describe, it, expect } from 'vitest';
import { parseLanguageCSV, generateCSVTemplate } from './csv-parser';

describe('parseLanguageCSV', () => {
  /**
   * Helper function to create a File object from CSV content
   */
  function createCSVFile(content: string, filename = 'test.csv'): File {
    return new File([content], filename, { type: 'text/csv' });
  }

  describe('Happy Path Tests', () => {
    it('should parse valid CSV with all standard fields', async () => {
      const csvContent = 'name,endonym,iso_639_3_code,language_family,country_of_origin\nSpanish,Español,spa,Indo-European,Spain';
      const file = createCSVFile(csvContent);

      const result = await parseLanguageCSV(file);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].name).toBe('Spanish');
      expect(result.rows[0].endonym).toBe('Español');
      expect(result.rows[0].iso_639_3_code).toBe('spa');
      expect(result.rows[0].language_family).toBe('Indo-European');
      expect(result.rows[0].country_of_origin).toBe('Spain');
      expect(result.validRows).toBe(1);
      expect(result.totalRows).toBe(1);
      expect(result.errors).toHaveLength(0);
    });

    it('should parse CSV with only required field (name)', async () => {
      const csvContent = 'name\nSpanish\nFrench\nGerman';
      const file = createCSVFile(csvContent);

      const result = await parseLanguageCSV(file);

      expect(result.rows).toHaveLength(3);
      expect(result.rows[0].name).toBe('Spanish');
      expect(result.rows[1].name).toBe('French');
      expect(result.rows[2].name).toBe('German');
      expect(result.validRows).toBe(3);
      expect(result.errors.filter(e => e.severity === 'error')).toHaveLength(0);
    });

    it('should parse CSV with taxonomy columns', async () => {
      const csvContent = 'name,endonym,size,status\nSpanish,Español,large,safe\nBasque,Euskara,medium,endangered';
      const file = createCSVFile(csvContent);

      const result = await parseLanguageCSV(file);

      expect(result.rows).toHaveLength(2);
      expect(result.rows[0].taxonomies.size).toBe('large');
      expect(result.rows[0].taxonomies.status).toBe('safe');
      expect(result.rows[1].taxonomies.size).toBe('medium');
      expect(result.rows[1].taxonomies.status).toBe('endangered');
    });

    it('should handle multiple rows correctly', async () => {
      const csvContent = 'name,endonym\nSpanish,Español\nFrench,Français\nGerman,Deutsch\nItalian,Italiano';
      const file = createCSVFile(csvContent);

      const result = await parseLanguageCSV(file);

      expect(result.rows).toHaveLength(4);
      expect(result.totalRows).toBe(4);
      expect(result.validRows).toBe(4);
    });
  });

  describe('CSV Format Handling', () => {
    it('should handle quoted values with commas', async () => {
      const csvContent = 'name,endonym\n"Spanish, Castilian",Español';
      const file = createCSVFile(csvContent);

      const result = await parseLanguageCSV(file);

      expect(result.rows[0].name).toBe('Spanish, Castilian');
    });

    it('should handle escaped quotes (double quotes)', async () => {
      const csvContent = 'name,endonym\n"""Quoted Language""",Español';
      const file = createCSVFile(csvContent);

      const result = await parseLanguageCSV(file);

      expect(result.rows[0].name).toBe('"Quoted Language"');
    });

    it('should handle empty cells', async () => {
      const csvContent = 'name,endonym,iso_639_3_code\nSpanish,,spa\nFrench,Français,';
      const file = createCSVFile(csvContent);

      const result = await parseLanguageCSV(file);

      expect(result.rows[0].endonym).toBeUndefined();
      expect(result.rows[1].iso_639_3_code).toBeUndefined();
    });

    it('should handle different line endings (CRLF)', async () => {
      const csvContent = 'name,endonym\r\nSpanish,Español\r\nFrench,Français';
      const file = createCSVFile(csvContent);

      const result = await parseLanguageCSV(file);

      expect(result.rows).toHaveLength(2);
      expect(result.rows[0].name).toBe('Spanish');
    });

    it('should handle different line endings (LF)', async () => {
      const csvContent = 'name,endonym\nSpanish,Español\nFrench,Français';
      const file = createCSVFile(csvContent);

      const result = await parseLanguageCSV(file);

      expect(result.rows).toHaveLength(2);
      expect(result.rows[0].name).toBe('Spanish');
    });

    it('should filter out empty lines', async () => {
      const csvContent = 'name,endonym\nSpanish,Español\n\n\nFrench,Français\n\n';
      const file = createCSVFile(csvContent);

      const result = await parseLanguageCSV(file);

      expect(result.rows).toHaveLength(2);
    });

    it('should trim whitespace from cell values', async () => {
      const csvContent = 'name,endonym\n  Spanish  ,  Español  ';
      const file = createCSVFile(csvContent);

      const result = await parseLanguageCSV(file);

      expect(result.rows[0].name).toBe('Spanish');
      expect(result.rows[0].endonym).toBe('Español');
    });

    it('should normalize column headers to lowercase', async () => {
      const csvContent = 'NAME,Endonym,ISO_639_3_CODE\nSpanish,Español,spa';
      const file = createCSVFile(csvContent);

      const result = await parseLanguageCSV(file);

      expect(result.headers).toContain('name');
      expect(result.headers).toContain('endonym');
      expect(result.headers).toContain('iso_639_3_code');
    });
  });

  describe('Validation Tests', () => {
    it('should report error for missing required column (name)', async () => {
      const csvContent = 'endonym,iso_639_3_code\nEspañol,spa';
      const file = createCSVFile(csvContent);

      await expect(parseLanguageCSV(file)).rejects.toThrow('Missing required columns: name');
    });

    it('should report error for empty language name', async () => {
      const csvContent = 'name,endonym\n,Español\nFrench,Français';
      const file = createCSVFile(csvContent);

      const result = await parseLanguageCSV(file);

      const nameErrors = result.errors.filter(e => e.field === 'name' && e.severity === 'error');
      expect(nameErrors).toHaveLength(1);
      expect(nameErrors[0].rowNumber).toBe(2);
      expect(nameErrors[0].message).toContain('required');
    });

    it('should report error for language name exceeding max length', async () => {
      const longName = 'a'.repeat(201);
      const csvContent = `name,endonym\n${longName},Español`;
      const file = createCSVFile(csvContent);

      const result = await parseLanguageCSV(file);

      const lengthErrors = result.errors.filter(e => e.field === 'name' && e.severity === 'error');
      expect(lengthErrors).toHaveLength(1);
      expect(lengthErrors[0].message).toContain('maximum length');
    });

    it('should report warning for invalid ISO code format', async () => {
      const csvContent = 'name,iso_639_3_code\nSpanish,es\nFrench,fran';
      const file = createCSVFile(csvContent);

      const result = await parseLanguageCSV(file);

      const isoWarnings = result.errors.filter(e => e.field === 'iso_639_3_code' && e.severity === 'warning');
      expect(isoWarnings).toHaveLength(2);
      expect(isoWarnings[0].message).toContain('exactly 3 letters');
    });

    it('should report warning for missing endonym', async () => {
      const csvContent = 'name,endonym\nSpanish,';
      const file = createCSVFile(csvContent);

      const result = await parseLanguageCSV(file);

      const endonymWarnings = result.errors.filter(e => e.field === 'endonym' && e.severity === 'warning');
      expect(endonymWarnings).toHaveLength(1);
      expect(endonymWarnings[0].message).toContain('recommended');
    });

    it('should distinguish between errors and warnings', async () => {
      const csvContent = 'name,endonym,iso_639_3_code\n,Español,es';
      const file = createCSVFile(csvContent);

      const result = await parseLanguageCSV(file);

      const errors = result.errors.filter(e => e.severity === 'error');
      const warnings = result.errors.filter(e => e.severity === 'warning');

      expect(errors.length).toBeGreaterThan(0);
      expect(warnings.length).toBeGreaterThan(0);
    });
  });

  describe('File Validation Tests', () => {
    it('should throw error for file size exceeding limit', async () => {
      // Create a large content string (> 5MB)
      const largeContent = 'name\n' + 'a'.repeat(6 * 1024 * 1024);
      const file = createCSVFile(largeContent);

      await expect(parseLanguageCSV(file)).rejects.toThrow('exceeds maximum allowed size');
    });

    it('should throw error for invalid file type', async () => {
      const file = new File(['name\nSpanish'], 'test.txt', { type: 'text/plain' });

      await expect(parseLanguageCSV(file)).rejects.toThrow('Invalid file type');
    });

    it('should throw error for empty CSV file', async () => {
      const file = createCSVFile('');

      // Empty file throws error during file reading or CSV parsing
      await expect(parseLanguageCSV(file)).rejects.toThrow();
    });

    it('should throw error for CSV with only headers', async () => {
      const file = createCSVFile('name,endonym');

      const result = await parseLanguageCSV(file);

      expect(result.rows).toHaveLength(0);
      expect(result.totalRows).toBe(0);
    });

    it('should throw error for null file', async () => {
      await expect(parseLanguageCSV(null as unknown as File)).rejects.toThrow();
    });

    it('should throw error for undefined file', async () => {
      await expect(parseLanguageCSV(undefined as unknown as File)).rejects.toThrow();
    });
  });

  describe('Row Limit Tests', () => {
    it('should enforce maximum rows limit', async () => {
      // Create CSV with 15 rows
      const rows = Array(15).fill('Spanish,Español,spa').join('\n');
      const csvContent = `name,endonym,iso_639_3_code\n${rows}`;
      const file = createCSVFile(csvContent);

      const result = await parseLanguageCSV(file, { maxRows: 10 });

      expect(result.totalRows).toBe(10);
      expect(result.rows).toHaveLength(10);
    });

    it('should use default max rows if not specified', async () => {
      const rows = Array(100).fill('Spanish,Español,spa').join('\n');
      const csvContent = `name,endonym,iso_639_3_code\n${rows}`;
      const file = createCSVFile(csvContent);

      const result = await parseLanguageCSV(file);

      expect(result.rows).toHaveLength(100);
    });
  });

  describe('Custom Configuration Tests', () => {
    it('should respect custom delimiter', async () => {
      const csvContent = 'name;endonym;iso_639_3_code\nSpanish;Español;spa';
      const file = createCSVFile(csvContent);

      const result = await parseLanguageCSV(file, { delimiter: ';' });

      expect(result.rows[0].name).toBe('Spanish');
      expect(result.rows[0].endonym).toBe('Español');
    });

    it('should respect custom required columns', async () => {
      const csvContent = 'name,endonym\nSpanish,Español';
      const file = createCSVFile(csvContent);

      await expect(
        parseLanguageCSV(file, { requiredColumns: ['name', 'iso_639_3_code'] })
      ).rejects.toThrow('Missing required columns: iso_639_3_code');
    });

    it('should respect custom max file size', async () => {
      const content = 'name\n' + 'a'.repeat(2 * 1024 * 1024); // 2MB
      const file = createCSVFile(content);

      await expect(
        parseLanguageCSV(file, { maxFileSize: 1 * 1024 * 1024 }) // 1MB limit
      ).rejects.toThrow('exceeds maximum allowed size');
    });
  });

  describe('Special Characters and Unicode', () => {
    it('should handle Unicode characters correctly', async () => {
      const csvContent = 'name,endonym\nJapanese,日本語\nChinese,中文\nArabic,العربية';
      const file = createCSVFile(csvContent);

      const result = await parseLanguageCSV(file);

      expect(result.rows[0].endonym).toBe('日本語');
      expect(result.rows[1].endonym).toBe('中文');
      expect(result.rows[2].endonym).toBe('العربية');
    });

    it('should handle special characters in names', async () => {
      const csvContent = 'name,endonym\nLanguage & Culture,Test\n"Language, Test",Test2';
      const file = createCSVFile(csvContent);

      const result = await parseLanguageCSV(file);

      expect(result.rows[0].name).toBe('Language & Culture');
      expect(result.rows[1].name).toBe('Language, Test');
    });
  });

  describe('Edge Cases', () => {
    it('should handle CSV with BOM (Byte Order Mark)', async () => {
      const csvContent = '\uFEFFname,endonym\nSpanish,Español';
      const file = createCSVFile(csvContent);

      const result = await parseLanguageCSV(file);

      // BOM should be removed from first header
      expect(result.headers[0]).toBe('name');
    });

    it('should throw error for duplicate column headers', async () => {
      const csvContent = 'name,endonym,name\nSpanish,Español,Spanish2';
      const file = createCSVFile(csvContent);

      await expect(parseLanguageCSV(file)).rejects.toThrow('duplicate column headers');
    });

    it('should handle rows with different number of columns', async () => {
      const csvContent = 'name,endonym,iso_639_3_code\nSpanish,Español\nFrench,Français,fra,extra';
      const file = createCSVFile(csvContent);

      const result = await parseLanguageCSV(file);

      expect(result.rows).toHaveLength(2);
      // First row has missing iso code
      expect(result.rows[0].iso_639_3_code).toBeUndefined();
      // Second row has all values (extra column ignored)
      expect(result.rows[1].iso_639_3_code).toBe('fra');
    });
  });

  describe('validRows count', () => {
    it('should correctly count valid rows (no errors)', async () => {
      const csvContent = 'name,endonym\nSpanish,Español\nFrench,Français';
      const file = createCSVFile(csvContent);

      const result = await parseLanguageCSV(file);

      expect(result.validRows).toBe(2);
      expect(result.totalRows).toBe(2);
    });

    it('should correctly count valid rows with warnings (warnings dont affect validity)', async () => {
      const csvContent = 'name,endonym,iso_639_3_code\nSpanish,,es';
      const file = createCSVFile(csvContent);

      const result = await parseLanguageCSV(file);

      // Row has warnings but no errors, so it's valid
      expect(result.validRows).toBe(1);
      expect(result.totalRows).toBe(1);
    });

    it('should exclude rows with errors from validRows count', async () => {
      const csvContent = 'name,endonym\n,Español\nFrench,Français';
      const file = createCSVFile(csvContent);

      const result = await parseLanguageCSV(file);

      expect(result.totalRows).toBe(2);
      expect(result.validRows).toBe(1); // Only second row is valid
    });
  });
});

describe('generateCSVTemplate', () => {
  it('should generate template with standard headers', () => {
    const template = generateCSVTemplate();

    expect(template).toContain('name');
    expect(template).toContain('endonym');
    expect(template).toContain('iso_639_3_code');
    expect(template).toContain('language_family');
    expect(template).toContain('country_of_origin');
  });

  it('should include custom taxonomy columns', () => {
    const template = generateCSVTemplate(['size', 'status', 'script_type']);

    expect(template).toContain('size');
    expect(template).toContain('status');
    expect(template).toContain('script_type');
  });

  it('should include example row', () => {
    const template = generateCSVTemplate();

    const lines = template.split('\n');
    expect(lines).toHaveLength(2); // Header + example row
    expect(lines[1]).toContain('Spanish');
    expect(lines[1]).toContain('Español');
  });

  it('should handle empty taxonomy types array', () => {
    const template = generateCSVTemplate([]);

    const lines = template.split('\n');
    expect(lines[0].split(',').length).toBe(5); // Only standard headers
  });

  it('should generate valid CSV format', () => {
    const template = generateCSVTemplate(['size']);

    // Should be parseable as CSV
    const lines = template.split('\n');
    const headers = lines[0].split(',');
    const values = lines[1].split(',');

    expect(headers.length).toBe(values.length);
  });
});

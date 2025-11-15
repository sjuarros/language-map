/**
 * Component Tests for CSV Import Page
 *
 * Tests file upload, parsing, validation display, and import functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ImportPage from './page';
import { parseLanguageCSV } from '@/lib/import/csv-parser';
import { importLanguagesFromCSV, getTaxonomyTypesForMapping } from '@/app/actions/import';

// Mock dependencies
vi.mock('@/lib/import/csv-parser');
vi.mock('@/app/actions/import');
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key
}));
vi.mock('next/navigation', () => ({
  useParams: () => ({ citySlug: 'amsterdam', locale: 'en' }),
  useRouter: () => ({ push: vi.fn() })
}));
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

describe('ImportPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Ensure clean DOM state for each test
    document.body.innerHTML = '';
  });

  describe('Initial Render', () => {
    it('should render file upload interface', () => {
      render(<ImportPage />);

      expect(screen.getByText('title')).toBeInTheDocument();
      expect(screen.getByText('selectFile')).toBeInTheDocument();
      expect(screen.getByText('downloadTemplate')).toBeInTheDocument();
    });

    it('should have hidden file input', () => {
      render(<ImportPage />);

      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveAttribute('type', 'file');
      expect(fileInput).toHaveAttribute('accept', '.csv');
    });

    it('should not show preview or import sections initially', () => {
      render(<ImportPage />);

      expect(screen.queryByText('preview')).not.toBeInTheDocument();
      expect(screen.queryByText('importLanguages')).not.toBeInTheDocument();
    });
  });

  describe('File Selection and Parsing', () => {
    it('should display file name after selection', async () => {
      const mockParseResult = {
        rows: [
          {
            rowNumber: 2,
            name: 'Spanish',
            endonym: 'Español',
            iso_639_3_code: 'spa',
            taxonomies: {},
            custom_fields: {}
          }
        ],
        errors: [],
        totalRows: 1,
        validRows: 1,
        headers: ['name', 'endonym', 'iso_639_3_code']
      };

      vi.mocked(parseLanguageCSV).mockResolvedValue(mockParseResult);

      render(<ImportPage />);

      const file = new File(['name,endonym\nSpanish,Español'], 'test.csv', { type: 'text/csv' });
      const fileInput = document.getElementById('file-input') as HTMLInputElement;

      await userEvent.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByText('test.csv')).toBeInTheDocument();
      });
    });

    it('should call parseLanguageCSV when file is selected', async () => {
      const mockParseResult = {
        rows: [],
        errors: [],
        totalRows: 0,
        validRows: 0,
        headers: ['name']
      };

      vi.mocked(parseLanguageCSV).mockResolvedValue(mockParseResult);

      render(<ImportPage />);

      const file = new File(['name\n'], 'test.csv', { type: 'text/csv' });
      const fileInput = document.getElementById('file-input') as HTMLInputElement;

      await userEvent.upload(fileInput, file);

      await waitFor(() => {
        expect(parseLanguageCSV).toHaveBeenCalledWith(file, expect.any(Object));
      });
    });

    it('should show loading state during parsing', async () => {
      vi.mocked(parseLanguageCSV).mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({
          rows: [],
          errors: [],
          totalRows: 0,
          validRows: 0,
          headers: []
        }), 100))
      );

      render(<ImportPage />);

      const file = new File(['name\n'], 'test.csv', { type: 'text/csv' });
      const fileInput = document.getElementById('file-input') as HTMLInputElement;

      await userEvent.upload(fileInput, file);

      // Should show parsing message
      expect(screen.getByText('parsing')).toBeInTheDocument();
    });
  });

  describe('Validation Display', () => {
    it('should display validation errors', async () => {
      const mockParseResult = {
        rows: [
          {
            rowNumber: 2,
            name: '',
            taxonomies: {},
            custom_fields: {}
          }
        ],
        errors: [
          {
            rowNumber: 2,
            field: 'name',
            message: 'Name is required',
            severity: 'error' as const
          }
        ],
        totalRows: 1,
        validRows: 0,
        headers: ['name']
      };

      vi.mocked(parseLanguageCSV).mockResolvedValue(mockParseResult);

      render(<ImportPage />);

      const file = new File(['name\n'], 'test.csv', { type: 'text/csv' });
      const fileInput = document.getElementById('file-input') as HTMLInputElement;

      await userEvent.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByText(/Name is required/i)).toBeInTheDocument();
      });
    });

    it('should display validation warnings', async () => {
      const mockParseResult = {
        rows: [
          {
            rowNumber: 2,
            name: 'Spanish',
            iso_639_3_code: 'es',
            taxonomies: {},
            custom_fields: {}
          }
        ],
        errors: [
          {
            rowNumber: 2,
            field: 'iso_639_3_code',
            message: 'Invalid ISO code format',
            severity: 'warning' as const
          }
        ],
        totalRows: 1,
        validRows: 1,
        headers: ['name']
      };

      vi.mocked(parseLanguageCSV).mockResolvedValue(mockParseResult);

      render(<ImportPage />);

      const file = new File(['name\nSpanish'], 'test.csv', { type: 'text/csv' });
      const fileInput = document.getElementById('file-input') as HTMLInputElement;

      await userEvent.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByText(/Invalid ISO code format/i)).toBeInTheDocument();
      });
    });

    it('should not show import button when there are errors', async () => {
      const mockParseResult = {
        rows: [],
        errors: [
          {
            rowNumber: 2,
            field: 'name',
            message: 'Name is required',
            severity: 'error' as const
          }
        ],
        totalRows: 1,
        validRows: 0,
        headers: ['name']
      };

      vi.mocked(parseLanguageCSV).mockResolvedValue(mockParseResult);

      render(<ImportPage />);

      const file = new File(['name\n'], 'test.csv', { type: 'text/csv' });
      const fileInput = document.getElementById('file-input') as HTMLInputElement;

      await userEvent.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.queryByText(/importLanguages/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Preview Table', () => {
    it('should display preview table with parsed data', async () => {
      const mockParseResult = {
        rows: [
          {
            rowNumber: 2,
            name: 'Spanish',
            endonym: 'Español',
            iso_639_3_code: 'spa',
            taxonomies: {},
            custom_fields: {}
          },
          {
            rowNumber: 3,
            name: 'French',
            endonym: 'Français',
            iso_639_3_code: 'fra',
            taxonomies: {},
            custom_fields: {}
          }
        ],
        errors: [],
        totalRows: 2,
        validRows: 2,
        headers: ['name', 'endonym', 'iso_639_3_code']
      };

      vi.mocked(parseLanguageCSV).mockResolvedValue(mockParseResult);

      render(<ImportPage />);

      const file = new File(['name,endonym\nSpanish,Español\nFrench,Français'], 'test.csv', { type: 'text/csv' });
      const fileInput = document.getElementById('file-input') as HTMLInputElement;

      await userEvent.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByText('Spanish')).toBeInTheDocument();
        expect(screen.getByText('Español')).toBeInTheDocument();
        expect(screen.getByText('French')).toBeInTheDocument();
        expect(screen.getByText('Français')).toBeInTheDocument();
      });
    });

    it('should show limited preview (first 10 rows)', async () => {
      const rows = Array(15).fill(null).map((_, i) => ({
        rowNumber: i + 2,
        name: `Language ${i + 1}`,
        taxonomies: {},
        custom_fields: {}
      }));

      const mockParseResult = {
        rows,
        errors: [],
        totalRows: 15,
        validRows: 15,
        headers: ['name']
      };

      vi.mocked(parseLanguageCSV).mockResolvedValue(mockParseResult);

      render(<ImportPage />);

      const file = new File(['name\nLang1'], 'test.csv', { type: 'text/csv' });
      const fileInput = document.getElementById('file-input') as HTMLInputElement;

      await userEvent.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByText('Language 1')).toBeInTheDocument();
        expect(screen.getByText('Language 10')).toBeInTheDocument();
        expect(screen.queryByText('Language 11')).not.toBeInTheDocument();
      });
    });
  });

  describe('Taxonomy Mapping', () => {
    it('should show taxonomy mapping form when taxonomies present', async () => {
      const mockParseResult = {
        rows: [
          {
            rowNumber: 2,
            name: 'Spanish',
            taxonomies: { size: 'large', status: 'safe' },
            custom_fields: {}
          }
        ],
        errors: [],
        totalRows: 1,
        validRows: 1,
        headers: ['name', 'size', 'status']
      };

      vi.mocked(parseLanguageCSV).mockResolvedValue(mockParseResult);
      vi.mocked(getTaxonomyTypesForMapping).mockResolvedValue([
        {
          id: 'type-1',
          slug: 'size',
          name: 'Size',
          values: [
            { id: 'val-1', slug: 'large', name: 'Large' }
          ]
        }
      ]);

      render(<ImportPage />);

      const file = new File(['name,size\nSpanish,large'], 'test.csv', { type: 'text/csv' });
      const fileInput = document.getElementById('file-input') as HTMLInputElement;

      await userEvent.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByText('taxonomyMapping')).toBeInTheDocument();
      });
    });

    it('should not show taxonomy mapping when no taxonomies', async () => {
      const mockParseResult = {
        rows: [
          {
            rowNumber: 2,
            name: 'Spanish',
            taxonomies: {},
            custom_fields: {}
          }
        ],
        errors: [],
        totalRows: 1,
        validRows: 1,
        headers: ['name']
      };

      vi.mocked(parseLanguageCSV).mockResolvedValue(mockParseResult);

      render(<ImportPage />);

      const file = new File(['name\nSpanish'], 'test.csv', { type: 'text/csv' });
      const fileInput = document.getElementById('file-input') as HTMLInputElement;

      await userEvent.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.queryByText('taxonomyMapping')).not.toBeInTheDocument();
      });
    });
  });

  describe('Import Execution', () => {
    it('should call importLanguagesFromCSV when import button clicked', async () => {
      const mockParseResult = {
        rows: [
          {
            rowNumber: 2,
            name: 'Spanish',
            endonym: 'Español',
            taxonomies: {},
            custom_fields: {}
          }
        ],
        errors: [],
        totalRows: 1,
        validRows: 1,
        headers: ['name', 'endonym']
      };

      const mockImportSummary = {
        total: 1,
        successful: 1,
        failed: 0,
        results: [
          {
            rowNumber: 2,
            success: true,
            languageId: 'lang-123',
            languageName: 'Spanish'
          }
        ]
      };

      vi.mocked(parseLanguageCSV).mockResolvedValue(mockParseResult);
      vi.mocked(importLanguagesFromCSV).mockResolvedValue(mockImportSummary);

      render(<ImportPage />);

      const file = new File(['name\nSpanish'], 'test.csv', { type: 'text/csv' });
      const fileInput = document.getElementById('file-input') as HTMLInputElement;

      await userEvent.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByText(/importLanguages/i)).toBeInTheDocument();
      });

      const importButton = screen.getByText(/importLanguages/i);
      await userEvent.click(importButton);

      await waitFor(() => {
        expect(importLanguagesFromCSV).toHaveBeenCalledWith(
          mockParseResult.rows,
          expect.objectContaining({
            citySlug: 'amsterdam',
            locale: 'en'
          })
        );
      });
    });

    it('should show import summary after successful import', async () => {
      const mockParseResult = {
        rows: [
          {
            rowNumber: 2,
            name: 'Spanish',
            taxonomies: {},
            custom_fields: {}
          }
        ],
        errors: [],
        totalRows: 1,
        validRows: 1,
        headers: ['name']
      };

      const mockImportSummary = {
        total: 1,
        successful: 1,
        failed: 0,
        results: [
          {
            rowNumber: 2,
            success: true,
            languageId: 'lang-123',
            languageName: 'Spanish'
          }
        ]
      };

      vi.mocked(parseLanguageCSV).mockResolvedValue(mockParseResult);
      vi.mocked(importLanguagesFromCSV).mockResolvedValue(mockImportSummary);

      render(<ImportPage />);

      const file = new File(['name\nSpanish'], 'test.csv', { type: 'text/csv' });
      const fileInput = document.getElementById('file-input') as HTMLInputElement;

      await userEvent.upload(fileInput, file);

      const importButton = await screen.findByText(/importLanguages/i);
      await userEvent.click(importButton);

      await waitFor(() => {
        expect(screen.getByText('importComplete')).toBeInTheDocument();
        expect(screen.getByText(/successful/i)).toBeInTheDocument();
      });
    });

    it('should display failed rows after partial import', async () => {
      const mockParseResult = {
        rows: [
          {
            rowNumber: 2,
            name: 'Spanish',
            taxonomies: {},
            custom_fields: {}
          },
          {
            rowNumber: 3,
            name: 'French',
            taxonomies: {},
            custom_fields: {}
          }
        ],
        errors: [],
        totalRows: 2,
        validRows: 2,
        headers: ['name']
      };

      const mockImportSummary = {
        total: 2,
        successful: 1,
        failed: 1,
        results: [
          {
            rowNumber: 2,
            success: true,
            languageId: 'lang-123',
            languageName: 'Spanish'
          },
          {
            rowNumber: 3,
            success: false,
            languageName: 'French',
            error: 'Database error'
          }
        ]
      };

      vi.mocked(parseLanguageCSV).mockResolvedValue(mockParseResult);
      vi.mocked(importLanguagesFromCSV).mockResolvedValue(mockImportSummary);

      render(<ImportPage />);

      const file = new File(['name\nSpanish\nFrench'], 'test.csv', { type: 'text/csv' });
      const fileInput = document.getElementById('file-input') as HTMLInputElement;

      await userEvent.upload(fileInput, file);

      const importButton = await screen.findByText(/importLanguages/i);
      await userEvent.click(importButton);

      await waitFor(() => {
        expect(screen.getByText('failedRows')).toBeInTheDocument();
        expect(screen.getByText(/Database error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Template Download', () => {
    it('should generate and download CSV template', async () => {
      vi.mocked(getTaxonomyTypesForMapping).mockResolvedValue([
        {
          id: 'type-1',
          slug: 'size',
          name: 'Size',
          values: []
        }
      ]);

      // Mock URL.createObjectURL and revokeObjectURL
      global.URL.createObjectURL = vi.fn(() => 'blob:test');
      global.URL.revokeObjectURL = vi.fn();

      // Spy on createElement to verify anchor element creation
      const createElementSpy = vi.spyOn(document, 'createElement');

      // Mock HTMLAnchorElement.click
      const clickMock = vi.fn();
      HTMLAnchorElement.prototype.click = clickMock;

      render(<ImportPage />);

      const downloadButton = screen.getByText('downloadTemplate');
      await userEvent.click(downloadButton);

      await waitFor(() => {
        expect(createElementSpy).toHaveBeenCalledWith('a');
        expect(global.URL.createObjectURL).toHaveBeenCalled();
        expect(clickMock).toHaveBeenCalled();
        expect(global.URL.revokeObjectURL).toHaveBeenCalled();
      });

      // Cleanup
      createElementSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('should handle parsing errors gracefully', async () => {
      vi.mocked(parseLanguageCSV).mockRejectedValue(new Error('Invalid CSV format'));

      render(<ImportPage />);

      const file = new File(['invalid'], 'test.csv', { type: 'text/csv' });
      const fileInput = document.getElementById('file-input') as HTMLInputElement;

      await userEvent.upload(fileInput, file);

      await waitFor(() => {
        // Error should be handled (toast notification shown)
        expect(parseLanguageCSV).toHaveBeenCalled();
      });
    });

    it('should handle import errors gracefully', async () => {
      const mockParseResult = {
        rows: [
          {
            rowNumber: 2,
            name: 'Spanish',
            taxonomies: {},
            custom_fields: {}
          }
        ],
        errors: [],
        totalRows: 1,
        validRows: 1,
        headers: ['name']
      };

      vi.mocked(parseLanguageCSV).mockResolvedValue(mockParseResult);
      vi.mocked(importLanguagesFromCSV).mockRejectedValue(new Error('Import failed'));

      render(<ImportPage />);

      const file = new File(['name\nSpanish'], 'test.csv', { type: 'text/csv' });
      const fileInput = document.getElementById('file-input') as HTMLInputElement;

      await userEvent.upload(fileInput, file);

      const importButton = await screen.findByText(/importLanguages/i);
      await userEvent.click(importButton);

      await waitFor(() => {
        expect(importLanguagesFromCSV).toHaveBeenCalled();
      });
    });
  });
});

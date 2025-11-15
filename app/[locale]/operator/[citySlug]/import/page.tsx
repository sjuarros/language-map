/**
 * CSV Import Page
 *
 * Allows operators to import language data from CSV files with preview
 * and taxonomy mapping functionality.
 */

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { Upload, FileText, AlertCircle, CheckCircle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { parseLanguageCSV, generateCSVTemplate, type ParseResult } from '@/lib/import/csv-parser';
import { importLanguagesFromCSV, getTaxonomyTypesForMapping, type TaxonomyMapping, type ImportSummary } from '@/app/actions/import';
import { TaxonomyMappingForm } from '@/components/import/taxonomy-mapping-form';
import { useToast } from '@/hooks/use-toast';

/**
 * CSV Import Page Component
 *
 * @returns React component for CSV import interface
 */
export default function ImportPage(): React.JSX.Element {
  const t = useTranslations('import');
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const citySlug = params.citySlug as string;
  const locale = params.locale as string;

  // Component state
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [taxonomyMappings, setTaxonomyMappings] = useState<TaxonomyMapping[]>([]);
  const [showMappingForm, setShowMappingForm] = useState(false);

  /**
   * Handles file selection and parsing
   */
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    try {
      const selectedFile = event.target.files?.[0];
      if (!selectedFile) return;

      setFile(selectedFile);
      setIsLoading(true);
      setParseResult(null);
      setImportSummary(null);
      setTaxonomyMappings([]);
      setShowMappingForm(false);

      // Parse CSV file
      const result = await parseLanguageCSV(selectedFile, {
        maxFileSize: 5 * 1024 * 1024, // 5MB
        maxRows: 10000,
        requiredColumns: ['name']
      });

      setParseResult(result);

      // Check if there are any taxonomy columns to map
      if (result.rows.length > 0) {
        const firstRow = result.rows[0];
        const hasTaxonomyColumns = Object.keys(firstRow.taxonomies).length > 0;
        setShowMappingForm(hasTaxonomyColumns);
      }
    } catch (error) {
      // Log error for debugging
      console.error('Error parsing CSV:', error);

      // Show error to user via toast
      toast({
        variant: 'destructive',
        title: t('error'),
        description: error instanceof Error ? error.message : 'Failed to parse CSV file'
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles import execution
   */
  const handleImport = async (): Promise<void> => {
    try {
      if (!parseResult || parseResult.rows.length === 0) {
        toast({
          variant: 'destructive',
          title: t('error'),
          description: t('noDataToImport')
        });
        return;
      }

      setIsLoading(true);
      setImportSummary(null);

      // Execute import
      const summary = await importLanguagesFromCSV(parseResult.rows, {
        citySlug,
        locale,
        taxonomyMappings,
        skipErrors: true, // Continue on errors
        updateExisting: false // Don't update existing languages
      });

      setImportSummary(summary);

      // Show success message if all imports succeeded
      if (summary.successful > 0 && summary.failed === 0) {
        toast({
          title: t('importComplete'),
          description: t('successful', { count: summary.successful }) + '. Redirecting...'
        });

        setTimeout(() => {
          router.push(`/${locale}/operator/${citySlug}/languages`);
        }, 2000);
      } else if (summary.successful > 0) {
        // Partial success
        toast({
          variant: 'default',
          title: t('importComplete'),
          description: t('successful', { count: summary.successful }) + ', ' + t('failed', { count: summary.failed })
        });
      }
    } catch (error) {
      // Log error for debugging
      console.error('Error importing languages:', error);

      toast({
        variant: 'destructive',
        title: t('error'),
        description: error instanceof Error ? error.message : 'Failed to import languages'
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Downloads CSV template
   */
  const handleDownloadTemplate = async (): Promise<void> => {
    try {
      // Fetch taxonomy types for the city
      const taxonomyTypes = await getTaxonomyTypesForMapping(citySlug);
      const taxonomySlugs = taxonomyTypes.map(t => t.slug);

      // Generate template
      const template = generateCSVTemplate(taxonomySlugs);

      // Create download link
      const blob = new Blob([template], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `language-import-template-${citySlug}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      // Log error for debugging
      console.error('Error downloading template:', error);

      toast({
        variant: 'destructive',
        title: t('error'),
        description: error instanceof Error ? error.message : 'Failed to download template'
      });
    }
  };

  // Group validation errors by severity
  const errors = parseResult?.errors.filter(e => e.severity === 'error') || [];
  const warnings = parseResult?.errors.filter(e => e.severity === 'warning') || [];
  const hasErrors = errors.length > 0;

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
        <Button variant="outline" onClick={handleDownloadTemplate}>
          <Download className="mr-2 h-4 w-4" />
          {t('downloadTemplate')}
        </Button>
      </div>

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle>{t('uploadFile')}</CardTitle>
          <CardDescription>{t('uploadDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => document.getElementById('file-input')?.click()}
              disabled={isLoading}
            >
              <Upload className="mr-2 h-4 w-4" />
              {file ? t('changeFile') : t('selectFile')}
            </Button>
            <input
              id="file-input"
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            {file && (
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{file.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({(file.size / 1024).toFixed(2)} KB)
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Parsing Result */}
      {isLoading && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('parsing')}</AlertTitle>
          <AlertDescription>{t('parsingDescription')}</AlertDescription>
        </Alert>
      )}

      {/* Validation Errors */}
      {parseResult && hasErrors && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('validationErrors', { count: errors.length })}</AlertTitle>
          <AlertDescription>
            <ul className="mt-2 space-y-1">
              {errors.slice(0, 5).map((error, index) => (
                <li key={index} className="text-sm">
                  Row {error.rowNumber}: {error.field} - {error.message}
                </li>
              ))}
              {errors.length > 5 && (
                <li className="text-sm font-semibold">
                  {t('andMoreErrors', { count: errors.length - 5 })}
                </li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Validation Warnings */}
      {parseResult && warnings.length > 0 && !hasErrors && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('validationWarnings', { count: warnings.length })}</AlertTitle>
          <AlertDescription>
            <ul className="mt-2 space-y-1">
              {warnings.slice(0, 3).map((warning, index) => (
                <li key={index} className="text-sm">
                  Row {warning.rowNumber}: {warning.field} - {warning.message}
                </li>
              ))}
              {warnings.length > 3 && (
                <li className="text-sm font-semibold">
                  {t('andMoreWarnings', { count: warnings.length - 3 })}
                </li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Preview Table */}
      {parseResult && !hasErrors && (
        <Card>
          <CardHeader>
            <CardTitle>{t('preview')}</CardTitle>
            <CardDescription>
              {t('previewDescription', {
                valid: parseResult.validRows,
                total: parseResult.totalRows
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('row')}
                    </th>
                    {parseResult.headers.map(header => (
                      <th
                        key={header}
                        className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {parseResult.rows.slice(0, 10).map((row, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 text-sm text-gray-500">{row.rowNumber}</td>
                      <td className="px-4 py-2 text-sm font-medium">{row.name}</td>
                      <td className="px-4 py-2 text-sm">{row.endonym || '-'}</td>
                      <td className="px-4 py-2 text-sm">{row.iso_639_3_code || '-'}</td>
                      <td className="px-4 py-2 text-sm">{row.language_family || '-'}</td>
                      <td className="px-4 py-2 text-sm">{row.country_of_origin || '-'}</td>
                      {Object.keys(row.taxonomies).map(taxKey => (
                        <td key={taxKey} className="px-4 py-2 text-sm">
                          {row.taxonomies[taxKey] || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {parseResult.totalRows > 10 && (
              <p className="mt-4 text-sm text-muted-foreground">
                {t('showingFirst', { count: 10, total: parseResult.totalRows })}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Taxonomy Mapping Form */}
      {showMappingForm && parseResult && !hasErrors && (
        <TaxonomyMappingForm
          citySlug={citySlug}
          csvColumns={Object.keys(parseResult.rows[0].taxonomies)}
          csvRows={parseResult.rows}
          onMappingsChange={setTaxonomyMappings}
        />
      )}

      {/* Import Button */}
      {parseResult && !hasErrors && (
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => setFile(null)}>
            {t('cancel')}
          </Button>
          <Button onClick={handleImport} disabled={isLoading}>
            {isLoading ? t('importing') : t('importLanguages', { count: parseResult.validRows })}
          </Button>
        </div>
      )}

      {/* Import Summary */}
      {importSummary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {importSummary.failed === 0 ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              )}
              {t('importComplete')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Badge variant="default">{t('successful', { count: importSummary.successful })}</Badge>
              {importSummary.failed > 0 && (
                <Badge variant="destructive">{t('failed', { count: importSummary.failed })}</Badge>
              )}
            </div>

            {importSummary.failed > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">{t('failedRows')}</h4>
                <ul className="space-y-1">
                  {importSummary.results
                    .filter(r => !r.success)
                    .slice(0, 10)
                    .map((result, index) => (
                      <li key={index} className="text-sm text-red-600">
                        Row {result.rowNumber}: {result.languageName} - {result.error}
                      </li>
                    ))}
                </ul>
              </div>
            )}

            {importSummary.successful > 0 && (
              <Button onClick={() => router.push(`/${locale}/operator/${citySlug}/languages`)}>
                {t('viewLanguages')}
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

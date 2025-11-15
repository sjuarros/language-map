/**
 * Taxonomy Mapping Form Component
 *
 * Allows users to map CSV columns to database taxonomy types and values
 */

'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { getTaxonomyTypesForMapping, type TaxonomyMapping } from '@/app/actions/import';
import { AlertCircle } from 'lucide-react';

/**
 * CSV row data for extracting unique values
 */
interface CsvRowData {
  taxonomies: Record<string, string>;
}

/**
 * Component props interface
 */
interface TaxonomyMappingFormProps {
  /** City slug for fetching taxonomy types */
  citySlug: string;
  /** CSV column names to map */
  csvColumns: string[];
  /** CSV rows for extracting unique values per column */
  csvRows: CsvRowData[];
  /** Callback when mappings change */
  onMappingsChange: (mappings: TaxonomyMapping[]) => void;
}

/**
 * Taxonomy type with values for mapping
 */
interface TaxonomyType {
  id: string;
  slug: string;
  name: string;
  values: { id: string; slug: string; name: string }[];
}

/**
 * CSV column to taxonomy type mapping state
 */
interface ColumnMapping {
  csvColumn: string;
  taxonomyTypeId: string | null;
  valueMapping: Record<string, string>;
}

/**
 * Taxonomy Mapping Form Component
 *
 * @param props - Component props
 * @returns React component for taxonomy mapping
 */
export function TaxonomyMappingForm({
  citySlug,
  csvColumns,
  csvRows,
  onMappingsChange
}: TaxonomyMappingFormProps): React.JSX.Element {
  const t = useTranslations('import');

  // Component state
  const [taxonomyTypes, setTaxonomyTypes] = useState<TaxonomyType[]>([]);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetches taxonomy types from the server
   */
  useEffect(() => {
    const fetchTaxonomyTypes = async (): Promise<void> => {
      try {
        setIsLoading(true);
        setError(null);

        const types = await getTaxonomyTypesForMapping(citySlug);
        setTaxonomyTypes(types);

        // Initialize column mappings
        const initialMappings = csvColumns.map(csvColumn => ({
          csvColumn,
          taxonomyTypeId: null,
          valueMapping: {}
        }));
        setColumnMappings(initialMappings);
      } catch (err) {
        // Log error for debugging
        console.error('Error fetching taxonomy types:', err);

        setError(err instanceof Error ? err.message : 'Failed to load taxonomy types');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTaxonomyTypes();
  }, [citySlug, csvColumns]);

  /**
   * Updates the mappings and notifies parent component
   */
  useEffect(() => {
    // Convert column mappings to TaxonomyMapping format
    const taxonomyMappings: TaxonomyMapping[] = columnMappings
      .filter(cm => cm.taxonomyTypeId !== null)
      .map(cm => ({
        csvColumn: cm.csvColumn,
        taxonomyTypeId: cm.taxonomyTypeId as string,
        valueMapping: cm.valueMapping
      }));

    onMappingsChange(taxonomyMappings);
  }, [columnMappings, onMappingsChange]);

  /**
   * Handles taxonomy type selection for a column
   */
  const handleTaxonomyTypeSelect = (csvColumn: string, taxonomyTypeId: string): void => {
    setColumnMappings(prev =>
      prev.map(cm =>
        cm.csvColumn === csvColumn
          ? { ...cm, taxonomyTypeId, valueMapping: {} }
          : cm
      )
    );
  };

  /**
   * Handles value mapping for a CSV value
   */
  const handleValueMapping = (
    csvColumn: string,
    csvValue: string,
    taxonomyValueId: string
  ): void => {
    setColumnMappings(prev =>
      prev.map(cm =>
        cm.csvColumn === csvColumn
          ? {
              ...cm,
              valueMapping: {
                ...cm.valueMapping,
                [csvValue]: taxonomyValueId
              }
            }
          : cm
      )
    );
  };

  /**
   * Extracts unique values from CSV data for a specific column
   *
   * @param csvColumn - The column name to extract values from
   * @returns Array of unique values found in that column, sorted alphabetically
   */
  const getCsvValues = (csvColumn: string): string[] => {
    // Validate inputs
    if (!csvColumn || !csvRows || csvRows.length === 0) {
      return [];
    }

    // Extract unique values from taxonomy data in CSV rows
    const uniqueValues = new Set<string>();

    csvRows.forEach(row => {
      if (row.taxonomies && row.taxonomies[csvColumn]) {
        const value = row.taxonomies[csvColumn].trim();
        if (value.length > 0) {
          uniqueValues.add(value);
        }
      }
    });

    // Convert to array and sort alphabetically
    return Array.from(uniqueValues).sort((a, b) => a.localeCompare(b));
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('taxonomyMapping')}</CardTitle>
          <CardDescription>{t('loadingTaxonomies')}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            {t('error')}
          </CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (taxonomyTypes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('taxonomyMapping')}</CardTitle>
          <CardDescription>{t('noTaxonomiesAvailable')}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('taxonomyMapping')}</CardTitle>
        <CardDescription>{t('taxonomyMappingDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {columnMappings.map((columnMapping, index) => {
          const selectedType = taxonomyTypes.find(
            t => t.id === columnMapping.taxonomyTypeId
          );

          return (
            <div key={index} className="space-y-4 pb-6 border-b last:border-b-0">
              {/* CSV Column Header */}
              <div>
                <Label className="text-base font-semibold">
                  {t('csvColumn')}: <Badge variant="secondary">{columnMapping.csvColumn}</Badge>
                </Label>
              </div>

              {/* Taxonomy Type Selection */}
              <div className="space-y-2">
                <Label htmlFor={`taxonomy-type-${index}`}>
                  {t('mapToTaxonomyType')}
                </Label>
                <Select
                  value={columnMapping.taxonomyTypeId || undefined}
                  onValueChange={(value) =>
                    handleTaxonomyTypeSelect(columnMapping.csvColumn, value)
                  }
                >
                  <SelectTrigger id={`taxonomy-type-${index}`}>
                    <SelectValue placeholder={t('selectTaxonomyType')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('skipColumn')}</SelectItem>
                    {taxonomyTypes.map(type => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name} ({type.slug})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Value Mapping (if taxonomy type selected) */}
              {selectedType && (
                <div className="space-y-3 pl-4 border-l-2 border-muted">
                  <Label className="text-sm font-semibold">
                    {t('mapValues')}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {t('mapValuesDescription')}
                  </p>
                  {getCsvValues(columnMapping.csvColumn).map((csvValue, valueIndex) => (
                    <div key={valueIndex} className="flex items-center gap-4">
                      <span className="text-sm font-medium min-w-[120px]">
                        {csvValue}
                      </span>
                      <span className="text-muted-foreground">→</span>
                      <Select
                        value={columnMapping.valueMapping[csvValue] || undefined}
                        onValueChange={(value) =>
                          handleValueMapping(columnMapping.csvColumn, csvValue, value)
                        }
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder={t('selectValue')} />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedType.values.map(value => (
                            <SelectItem key={value.id} value={value.id}>
                              {value.name} ({value.slug})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Summary */}
        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            {t('mappingSummary', {
              mapped: columnMappings.filter(cm => cm.taxonomyTypeId !== null).length,
              total: columnMappings.length
            })}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

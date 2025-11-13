-- Migration: Add unique constraint to descriptions table
-- Date: 2025-11-12
-- Purpose: Prevent duplicate language-neighborhood combinations per city
-- Bug Fix: D27-006

-- Add unique constraint on (city_id, language_id, neighborhood_id)
-- This ensures each language-neighborhood pair is unique within a city
-- NULL neighborhood values are considered distinct, so multiple descriptions
-- for the same language without a neighborhood would still be allowed by PostgreSQL
-- default behavior. We need to handle this with NULLS NOT DISTINCT (PostgreSQL 15+)

ALTER TABLE descriptions
ADD CONSTRAINT descriptions_city_language_neighborhood_unique
UNIQUE NULLS NOT DISTINCT (city_id, language_id, neighborhood_id);

-- Note: NULLS NOT DISTINCT means that two NULL values are considered equal
-- This prevents multiple descriptions for the same language with NULL neighborhood

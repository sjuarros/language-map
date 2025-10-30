---
title: Coding Standards
description: Comprehensive coding standards for the Multi-City Language Mapping Platform covering code quality, commenting, error handling, and technology-specific best practices
category: processes
tags: [coding-standards, best-practices, code-quality, typescript, next.js]
---

# Coding Standards

This document defines the coding standards for all code in the Multi-City Language Mapping Platform. These standards ensure code quality, maintainability, and consistency across the codebase.

## Technology Stack Reference

- **Framework**: Next.js 15+ (App Router) with React 18+, TypeScript 5+
- **Database**: Supabase (PostgreSQL + PostGIS + Auth + RLS)
- **UI Components**: Shadcn/ui + Tailwind CSS + Radix UI
- **Maps**: Mapbox GL JS v3
- **i18n**: next-intl
- **State Management**: Zustand (UI), TanStack Query v5 (server state)
- **Testing**: Vitest (Unit/Component), Playwright (E2E)
- **AI**: OpenAI, Anthropic (optional)

## Core Principles

### 1. Error Handling is Mandatory

**Never write happy-path-only code.** Every function must handle errors appropriately.

#### TypeScript/JavaScript

**Required:**
```typescript
// ✅ CORRECT: Comprehensive error handling
async function fetchUserData(userId: string): Promise<User> {
  try {
    const response = await fetch(`/api/users/${userId}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data || !data.id) {
      throw new Error('Invalid user data received');
    }

    return data as User;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch user data: ${error.message}`);
    }
    throw new Error('Failed to fetch user data: Unknown error');
  }
}
```

**Forbidden:**
```typescript
// ❌ INCORRECT: Happy path only
async function fetchUserData(userId: string): Promise<User> {
  const response = await fetch(`/api/users/${userId}`);
  const data = await response.json();
  return data as User;
}
```

**Error Handling Checklist:**
- [ ] Try-catch blocks for all async operations
- [ ] HTTP status code validation
- [ ] Data validation before use
- [ ] Meaningful error messages with context
- [ ] Type-safe error handling (check `instanceof Error`)
- [ ] Re-throw with additional context when appropriate

### 2. Input Validation

All functions accepting external input must validate it.

**Validation Requirements:**
- Type checking
- Range/bounds checking
- Format validation (email, URL, etc.)
- Null/undefined checks
- Length constraints

**Example:**
```typescript
function createUser(email: string, age: number): User {
  // Validate inputs
  if (!email || typeof email !== 'string') {
    throw new Error('Email is required and must be a string');
  }

  if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    throw new Error('Invalid email format');
  }

  if (typeof age !== 'number' || age < 0 || age > 150) {
    throw new Error('Age must be a number between 0 and 150');
  }

  // Proceed with creation
  // ...
}
```

### 3. Defensive Programming

**Always assume:**
- Network requests will fail
- External APIs will return unexpected data
- User input is malicious
- Dependencies may not be available
- Disk operations will fail

**Implement:**
- Timeouts for all async operations
- Retry logic with exponential backoff
- Graceful degradation
- Circuit breakers for external services
- Null checks before property access

## Code Commenting Standards

All code must include comprehensive comments following these standards.

### File Header Comments

**Every code file must begin with a block comment** explaining the file's purpose.

#### TypeScript/JavaScript (JSDoc style)

```typescript
/**
 * @file video.service.ts
 * @description This file contains the VideoService class, responsible for handling
 * business logic related to video project creation, analysis queuing,
 * and interaction with external video APIs (YouTube, Gemini).
 */
```

**Requirements:**
- `@file` tag with filename
- `@description` tag with purpose and main responsibilities
- Update when file's role changes significantly

#### Python (Module Docstring)

```python
"""
video_analyzer.py

This module contains the Celery task for analyzing video content.
It interacts with YouTube Data API and Google Gemini API to extract
metadata, generate summaries, and identify keywords.
"""
```

**Requirements:**
- Module name on first line
- Blank line
- Description of purpose and main components
- Update when module's role changes significantly

### Function/Method Comments

**All functions, methods, constructors, and exported variables/constants** must have descriptive comments.

#### TypeScript/JavaScript (JSDoc)

```typescript
/**
 * Processes a video from the analysis queue.
 * This involves fetching details from YouTube, sending metadata to Gemini for analysis,
 * and finally saving the context report to the database.
 *
 * @async
 * @param youtubeVideoId - The unique identifier of the YouTube video.
 * @param env - The Cloudflare Worker environment variables.
 * @returns A promise that resolves when processing is complete or rejects on error.
 * @throws {Error} If API keys are missing, API calls fail, or DB operations fail.
 * @example
 * await processVideoFromQueue('dQw4w9WgXcQ', env);
 */
async function processVideoFromQueue(youtubeVideoId: string, env: Env): Promise<void> {
  // ... implementation ...
}
```

**Required tags:**
- Concise summary (first sentence)
- `@async` - If function is asynchronous
- `@param` - For each parameter with description
- `@returns` - Description of return value
- `@throws` - Any errors the function might throw
- `@example` - Optional but recommended

### Inline Comments

Use inline comments to explain **why**, not **what**.

**Good inline comments:**
```typescript
// Retry with exponential backoff to handle transient network issues
await retryWithBackoff(fetchData);

// User preferences override system defaults per requirement #PRD-123
const theme = userPrefs.theme || systemDefaults.theme;

// HACK: Workaround for Safari bug - remove when Safari 17+ is minimum version
if (isSafari && safariVersion < 17) {
  applyPolyfill();
}
```

**Bad inline comments:**
```typescript
// Set x to 5
const x = 5;

// Loop through users
users.forEach(user => { ... });

// Call the API
await api.call();
```

**When to use:**
- Complex algorithms or business logic
- Workarounds for bugs or limitations
- Important business rule implementations
- Non-obvious performance optimizations
- TODO/FIXME/HACK annotations (with ticket references)

### Comment Maintenance

- **Update comments** when changing code
- **Remove comments** that become obsolete
- **Outdated comments are worse than no comments**

## Technology-Specific Standards

### TypeScript/Next.js Frontend

#### File Organization

```typescript
// 1. Imports (grouped and sorted)
import { useState, useEffect } from 'react';
import { NextPage } from 'next';

import { Button } from '@/components/ui/button';
import { VideoService } from '@/services/video.service';

import type { Video } from '@/types';

// 2. Type definitions
interface VideoListProps {
  videos: Video[];
  onSelect: (id: string) => void;
}

// 3. Component or functions
export const VideoList: React.FC<VideoListProps> = ({ videos, onSelect }) => {
  // Component implementation
};
```

#### React Component Standards

**Required:**
- Functional components (no class components)
- TypeScript interfaces for all props
- Proper hook usage (order, dependencies)
- Error boundaries for error handling
- Loading and error states

**Example:**
```typescript
/**
 * @file VideoPlayer.tsx
 * @description Video player component with playback controls and error handling.
 */

import { useState, useEffect } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface VideoPlayerProps {
  videoId: string;
  onError?: (error: Error) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoId,
  onError
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [videoData, setVideoData] = useState<VideoData | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadVideo() {
      try {
        setIsLoading(true);
        const data = await fetchVideo(videoId);

        if (isMounted) {
          setVideoData(data);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        if (isMounted) {
          setError(error);
          onError?.(error);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadVideo();

    return () => {
      isMounted = false;
    };
  }, [videoId, onError]);

  if (error) {
    return <ErrorMessage error={error} />;
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return <div>{/* Video player UI */}</div>;
};
```

**Component Checklist:**
- [ ] File header comment
- [ ] TypeScript interface for props
- [ ] Loading state
- [ ] Error state
- [ ] Error boundary
- [ ] Cleanup in useEffect
- [ ] Dependency arrays correct
- [ ] Accessibility attributes

#### Next.js App Router

**Required:**
- Server components by default
- Client components only when needed (`'use client'`)
- Proper loading.tsx and error.tsx files
- Metadata for SEO

### Next.js Server Actions & API Routes

#### Server Actions

**Use for:**
- Form submissions
- Data mutations
- Server-side operations triggered by client

**Required:**
- 'use server' directive at top
- Input validation with Zod or similar
- Error handling with try-catch
- Return type annotations
- JSDoc comments

**Example:**
```typescript
/**
 * Creates a new language entry in the database.
 *
 * @async
 * @param citySlug - The city identifier
 * @param formData - The form data from the client
 * @returns The created language object or error
 * @throws {Error} If validation fails or database operation fails
 */
'use server'

import { revalidatePath } from 'next/cache'
import { getDatabaseClient } from '@/lib/database/client'
import { languageSchema } from '@/lib/validation/schemas'

export async function createLanguage(citySlug: string, formData: FormData) {
  // Validate inputs
  if (!citySlug || typeof citySlug !== 'string') {
    throw new Error('City slug is required')
  }

  const rawData = {
    endonym: formData.get('endonym'),
    iso_code: formData.get('iso_code'),
  }

  // Validate with Zod
  const validated = languageSchema.safeParse(rawData)
  if (!validated.success) {
    return {
      error: 'Validation failed',
      details: validated.error.flatten()
    }
  }

  try {
    const supabase = getDatabaseClient(citySlug)

    const { data, error } = await supabase
      .from('languages')
      .insert(validated.data)
      .select()
      .single()

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    revalidatePath(`/${citySlug}/languages`)
    return { data }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Unknown error occurred' }
  }
}
```

#### API Routes

**Use for:**
- External API endpoints
- Webhook handlers
- REST API for external consumers

**Required:**
- Proper HTTP method handlers
- Input validation
- Error handling with proper status codes
- Type-safe response

**Example:**
```typescript
/**
 * @file app/[locale]/[citySlug]/api/languages/route.ts
 * @description API endpoint for language management
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDatabaseClient } from '@/lib/database/client'

export async function GET(
  request: NextRequest,
  { params }: { params: { citySlug: string } }
) {
  try {
    const supabase = getDatabaseClient(params.citySlug)

    const { data, error } = await supabase
      .from('languages')
      .select('*, translations:language_translations(*)')

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch languages' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { citySlug: string } }
) {
  try {
    const body = await request.json()

    // Validate input
    if (!body.endonym || typeof body.endonym !== 'string') {
      return NextResponse.json(
        { error: 'Endonym is required' },
        { status: 400 }
      )
    }

    const supabase = getDatabaseClient(params.citySlug)

    const { data, error } = await supabase
      .from('languages')
      .insert(body)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

### Database Operations (Supabase)

**Required for all database operations:**
- Use database abstraction layer (`getDatabaseClient(citySlug)`)
- Proper error handling
- RLS (Row-Level Security) policies
- Type-safe queries
- Proper error messages

**Example:**
```typescript
/**
 * Creates a new language entry with proper error handling.
 *
 * @param citySlug - The city identifier
 * @param languageData - The language data to insert
 * @returns The created language or error
 */
async function createLanguage(
  citySlug: string,
  languageData: LanguageInput
): Promise<Language> {
  // Validate input
  if (!citySlug || typeof citySlug !== 'string') {
    throw new Error('City slug is required')
  }

  if (!languageData.endonym) {
    throw new Error('Endonym is required')
  }

  try {
    // Use database abstraction layer
    const supabase = getDatabaseClient(citySlug)

    const { data, error } = await supabase
      .from('languages')
      .insert({
        city_id: citySlug,
        endonym: languageData.endonym,
        iso_639_3_code: languageData.iso_code
      })
      .select()
      .single()

    if (error) {
      // Handle specific Supabase errors
      if (error.code === '23505') {
        throw new Error('Language already exists')
      }
      throw new Error(`Database error: ${error.message}`)
    }

    if (!data) {
      throw new Error('No data returned from insert')
    }

    return data as Language
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to create language: ${error.message}`)
    }
    throw new Error('Failed to create language: Unknown error')
  }
}

## Testing Standards

### Test Coverage Requirements

- **Unit tests**: Minimum 80% coverage
- **Integration tests**: All API endpoints
- **E2E tests**: Critical user flows

### Test Structure

**Every test must have:**
- Descriptive test name
- Arrange-Act-Assert structure
- Error case testing
- Edge case testing

**TypeScript/Vitest:**
```typescript
describe('VideoService', () => {
  describe('fetchVideo', () => {
    it('should fetch video successfully with valid ID', async () => {
      // Arrange
      const videoId = 'valid_id';
      const mockVideo = { id: videoId, title: 'Test Video' };

      // Act
      const result = await videoService.fetchVideo(videoId);

      // Assert
      expect(result).toEqual(mockVideo);
    });

    it('should throw error when video not found', async () => {
      // Arrange
      const videoId = 'invalid_id';

      // Act & Assert
      await expect(videoService.fetchVideo(videoId))
        .rejects
        .toThrow('Video not found');
    });

    it('should handle network errors gracefully', async () => {
      // Arrange
      const videoId = 'valid_id';
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      // Act & Assert
      await expect(videoService.fetchVideo(videoId))
        .rejects
        .toThrow('Failed to fetch video');
    });
  });
});
```

## Security Standards

### Input Sanitization

**Always sanitize:**
- User input
- URL parameters
- Query strings
- Form data
- File uploads

### Authentication & Authorization

**Required:**
- Supabase Auth integration
- Row-Level Security (RLS) policies
- Multi-city access control (via city_users junction table)
- Role-based permissions (superuser/admin/operator)

**Example RLS Policy:**
```sql
-- City users can only access their own cities' data
CREATE POLICY "City users can view languages" ON languages
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'superuser')
      OR city_id IN (SELECT city_id FROM city_users WHERE user_id = auth.uid())
    )
  );
```

**Example Server Component:**
```typescript
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export default async function ProtectedPage() {
  const supabase = createServerComponentClient({ cookies })

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  // RLS policies automatically enforce access control
  const { data: languages } = await supabase
    .from('languages')
    .select('*')

  return <LanguageList languages={languages} />
}
```

### Data Protection

**Required:**
- Encrypt sensitive data at rest
- Use HTTPS for all communications
- Sanitize logs (no sensitive data)
- Implement CORS properly

## Performance Standards

### Frontend

- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3.5s
- **Lighthouse Score**: > 90

**Required:**
- Code splitting
- Lazy loading
- Image optimization
- Caching strategy

### Backend

- **API Response Time**: < 200ms (p95)
- **Database Query Time**: < 100ms (p95)

**Required:**
- Database indexing
- Query optimization
- Caching (Redis)
- Connection pooling

## Validation Checklist for Code Review

Use this checklist to validate code compliance:

### Error Handling
- [ ] All async operations have try-catch blocks
- [ ] HTTP status codes are validated
- [ ] Data is validated before use
- [ ] Errors have meaningful messages with context
- [ ] Specific exception types are used (not generic)

### Comments
- [ ] File header comment present and accurate
- [ ] All functions have JSDoc/docstring comments
- [ ] All parameters documented
- [ ] Return values documented
- [ ] Exceptions/errors documented
- [ ] Inline comments explain "why", not "what"

### Input Validation
- [ ] All inputs are validated
- [ ] Type checking is performed
- [ ] Range/bounds are checked
- [ ] Null/undefined checks present
- [ ] Format validation for strings

### Testing
- [ ] Unit tests present
- [ ] Happy path tested
- [ ] Error cases tested
- [ ] Edge cases tested
- [ ] Test coverage > 80%

### Security
- [ ] Input is sanitized
- [ ] SQL injection prevention (prepared statements)
- [ ] XSS prevention
- [ ] Authentication checked
- [ ] Authorization verified

### Performance
- [ ] Database queries optimized
- [ ] Proper indexing used
- [ ] Caching implemented where appropriate
- [ ] No N+1 queries
- [ ] Images optimized

## Enforcement

These standards are enforced through:
1. **Pre-commit hooks**: Automated linting and formatting
2. **CI/CD pipeline**: Automated testing and code quality checks
3. **Code reviews**: Manual review against this checklist
4. **Code compliance agent**: Automated validation against standards

Non-compliant code will not be merged into the main branch.

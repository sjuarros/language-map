/**
 * Utility Functions
 *
 * Common utility functions used throughout the application.
 *
 * @module lib/utils
 */

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind CSS classes with proper specificity
 *
 * Combines clsx and tailwind-merge to intelligently merge
 * Tailwind CSS classes, handling conflicts and duplicates.
 *
 * @param inputs - Class names to merge
 * @returns Merged class string
 *
 * @example
 * cn('px-2 py-1', 'px-4') // Returns: 'py-1 px-4'
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

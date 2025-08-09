import { describe, it, expect } from 'vitest'
import { cn } from '../../lib/utils'

describe('Utility Functions', () => {
  describe('cn (classnames)', () => {
    it('combines class names', () => {
      expect(cn('foo', 'bar')).toBe('foo bar')
    })

    it('handles conditional classes', () => {
      expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
      expect(cn('foo', true && 'bar', 'baz')).toBe('foo bar baz')
    })

    it('handles arrays', () => {
      expect(cn(['foo', 'bar'], 'baz')).toBe('foo bar baz')
    })

    it('handles objects', () => {
      expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz')
    })

    it('merges tailwind classes correctly', () => {
      // twMerge will intelligently merge conflicting classes
      expect(cn('p-4', 'p-2')).toBe('p-2') // Later value wins
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
    })

    it('handles undefined and null values', () => {
      expect(cn('foo', undefined, 'bar', null)).toBe('foo bar')
    })

    it('handles empty strings', () => {
      expect(cn('foo', '', 'bar')).toBe('foo bar')
    })
  })
})
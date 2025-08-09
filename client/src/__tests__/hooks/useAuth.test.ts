import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuth } from '../../hooks/useAuth'
import React from 'react'

// Mock the queryClient module
vi.mock('../../lib/queryClient', () => ({
  getQueryFn: vi.fn(() => vi.fn()),
}))

import { getQueryFn } from '../../lib/queryClient'

describe('useAuth Hook', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })
    vi.clearAllMocks()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    React.createElement(QueryClientProvider, { client: queryClient }, children)
  )

  it('returns loading state initially', () => {
    const mockQueryFn = vi.fn(() => new Promise(() => {})) // Never resolves
    vi.mocked(getQueryFn).mockReturnValue(mockQueryFn)
    
    const { result } = renderHook(() => useAuth(), { wrapper })
    
    expect(result.current.isLoading).toBe(true)
    expect(result.current.user).toBeUndefined()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('returns user when authenticated', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      plan: 'starter',
      setupFeePaid: true,
      insuranceCoverage: 2000,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    
    const mockQueryFn = vi.fn().mockResolvedValue(mockUser)
    vi.mocked(getQueryFn).mockReturnValue(mockQueryFn)
    
    const { result } = renderHook(() => useAuth(), { wrapper })
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
    
    expect(result.current.user).toEqual(mockUser)
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('handles unauthenticated state', async () => {
    const mockQueryFn = vi.fn().mockResolvedValue(null)
    vi.mocked(getQueryFn).mockReturnValue(mockQueryFn)
    
    const { result } = renderHook(() => useAuth(), { wrapper })
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
    
    expect(result.current.user).toBe(null)
    expect(result.current.isAuthenticated).toBe(false)
  })
})
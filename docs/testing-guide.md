# Testing Guide

## Overview

This project uses Vitest for unit and integration testing. Vitest is a fast unit test framework powered by Vite with first-class TypeScript support.

## Running Tests

```bash
# Run tests in watch mode (recommended for development)
npm run test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Test Structure

Tests are organized alongside the code they test:

```
client/src/
├── __tests__/
│   ├── components/    # Component tests
│   ├── hooks/         # Custom hook tests
│   └── utils/         # Utility function tests
├── components/
├── hooks/
└── lib/

server/
├── __tests__/
│   ├── routes/        # API route tests
│   └── services/      # Service tests
└── routes/
```

## Writing Tests

### Component Tests

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../../components/ui/button'

describe('Button Component', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('handles click events', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    fireEvent.click(screen.getByText('Click me'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

### Hook Tests

```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { useAuth } from '../../hooks/useAuth'

describe('useAuth Hook', () => {
  it('returns loading state initially', () => {
    const { result } = renderHook(() => useAuth())
    
    expect(result.current.isLoading).toBe(true)
    expect(result.current.user).toBeUndefined()
  })
})
```

### API/Service Tests

```typescript
import { describe, it, expect } from 'vitest'
import { insertUserSchema } from '../../shared/schema'

describe('User Schema', () => {
  it('validates valid user data', () => {
    const validUser = {
      email: 'test@example.com',
      plan: 'starter',
    }

    const result = insertUserSchema.safeParse(validUser)
    expect(result.success).toBe(true)
  })
})
```

## Mocking

### Mocking Modules

```typescript
vi.mock('../../lib/api', () => ({
  fetchUser: vi.fn(),
  logout: vi.fn(),
}))
```

### Mocking Environment Variables

```typescript
beforeEach(() => {
  vi.stubEnv('VITE_API_URL', 'http://localhost:3000')
})

afterEach(() => {
  vi.unstubAllEnvs()
})
```

## Best Practices

1. **Test Behavior, Not Implementation**: Focus on what the component/function does, not how it does it.

2. **Use Descriptive Test Names**: Test names should clearly describe what is being tested.

3. **Keep Tests Simple**: Each test should test one thing. If you need multiple assertions, consider splitting into multiple tests.

4. **Use Test Data Builders**: Create functions to generate test data to keep tests DRY.

5. **Mock External Dependencies**: Mock API calls, timers, and other external dependencies.

6. **Test Error Cases**: Don't just test the happy path - test error conditions too.

## Coverage

Run tests with coverage to see which parts of the code are tested:

```bash
npm run test:coverage
```

Coverage reports are generated in the `coverage/` directory. Open `coverage/index.html` in a browser to view detailed coverage information.

## Debugging Tests

1. **Use VSCode Debugger**: Set breakpoints in your tests and use the VSCode debugger.

2. **Use console.log**: Simple but effective for quick debugging.

3. **Use Vitest UI**: Run `npm run test:ui` for an interactive test runner.

4. **Use screen.debug()**: In component tests, use `screen.debug()` to print the current DOM.

## CI/CD Integration

Tests are automatically run in the CI/CD pipeline. All tests must pass before code can be merged.

## Common Issues

### "Cannot find module" errors
- Ensure all imports use the correct paths
- Check that TypeScript paths are configured correctly

### Tests timing out
- Increase timeout for async tests: `it('test', async () => {}, { timeout: 10000 })`
- Ensure promises are properly resolved

### Flaky tests
- Avoid testing implementation details
- Use `waitFor` for async operations
- Mock timers when testing time-dependent code
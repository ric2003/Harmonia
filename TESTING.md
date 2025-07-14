# Testing Guide for Harmonia

This document explains how to run tests and what types of tests are available in the Harmonia project.

## 🧪 Test Types

### 1. Unit Tests (Jest + React Testing Library)

- **Location**: `src/**/__tests__/` and `src/**/*.test.{ts,tsx}`
- **Purpose**: Test individual components and functions in isolation
- **Framework**: Jest + React Testing Library

### 2. End-to-End Tests (Playwright)

- **Location**: `tests/e2e/`
- **Purpose**: Test complete user workflows and page navigation
- **Framework**: Playwright

### 3. Type Checking

- **Purpose**: Ensure TypeScript types are correct
- **Command**: `npm run type-check`

### 4. Linting

- **Purpose**: Check code quality and style
- **Command**: `npm run lint`

## 🚀 Running Tests

### Install Dependencies

```bash
npm install --legacy-peer-deps
```

### Run All Tests

```bash
# Run unit tests
npm test

# Run unit tests in watch mode
npm run test:watch

# Run unit tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in headed mode (see browser)
npm run test:e2e:headed

# Run type checking
npm run type-check

# Run linting
npm run lint
```

## 📋 Test Commands

| Command                   | Description                         |
| ------------------------- | ----------------------------------- |
| `npm test`                | Run all unit tests once             |
| `npm run test:watch`      | Run unit tests in watch mode        |
| `npm run test:coverage`   | Run unit tests with coverage report |
| `npm run test:e2e`        | Run all E2E tests                   |
| `npm run test:e2e:ui`     | Run E2E tests with Playwright UI    |
| `npm run test:e2e:headed` | Run E2E tests with visible browser  |
| `npm run type-check`      | Check TypeScript types              |
| `npm run lint`            | Run ESLint                          |

## 🏗️ Test Structure

```
src/
├── components/
│   ├── __tests__/
│   │   └── AlertMessage.test.tsx
│   └── ui/
│       └── AlertMessage.tsx
├── utils/
│   ├── __tests__/
│   │   └── utils.test.ts
│   └── utils.ts
└── ...

tests/
└── e2e/
    ├── home.spec.ts
    └── navigation.spec.ts
```

## 🧩 Unit Tests

### Writing Unit Tests

1. **Component Tests**: Test React components in isolation

```typescript
import { render, screen } from '@testing-library/react'
import { AlertMessage } from '../ui/AlertMessage'

describe('AlertMessage', () => {
  it('renders error message correctly', () => {
    render(<AlertMessage type="error" message="Something went wrong" />)
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })
})
```

2. **Utility Tests**: Test pure functions

```typescript
import { formatDate } from "../utils";

describe("Utils", () => {
  it("formats date correctly", () => {
    const date = new Date("2024-01-15");
    const formatted = formatDate(date.toISOString());
    expect(formatted).toBe("15/01/2024");
  });
});
```

### Test Coverage

The project aims for 70% test coverage across:

- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

## 🌐 E2E Tests

### Writing E2E Tests

E2E tests verify complete user workflows:

```typescript
import { test, expect } from "@playwright/test";

test("should navigate to stations page", async ({ page }) => {
  await page.goto("/");
  await page.goto("/stations");
  await expect(page).toHaveTitle(/Stations/);
});
```

### E2E Test Features

- **Multiple Browsers**: Chrome, Firefox, Safari
- **Mobile Testing**: iPhone 12, Pixel 5
- **Auto-start Server**: Automatically starts dev server
- **Screenshots**: Automatic screenshots on failure
- **Video Recording**: Records test execution

## 🔧 Configuration Files

### Jest Configuration (`jest.config.js`)

- Uses Next.js Jest preset
- Configures test environment (jsdom)
- Sets up module mapping for `@/` imports
- Configures coverage thresholds

### Playwright Configuration (`playwright.config.ts`)

- Configures multiple browsers
- Sets up mobile testing
- Configures test retries and timeouts
- Sets up automatic dev server startup

### Test Setup (`jest.setup.js`)

- Imports testing library matchers
- Mocks external dependencies (Next.js router, Leaflet, Clerk, etc.)
- Sets up global test utilities

## 🚨 CI/CD Integration

### GitHub Actions (`/.github/workflows/ci.yml`)

The CI pipeline runs on every push and pull request:

1. **Test Job**:

   - Runs on Node.js 18.x and 20.x
   - Installs dependencies
   - Runs linting
   - Runs type checking
   - Builds the application
   - Runs unit tests
   - Runs E2E tests

2. **Security Job**:

   - Runs security audit
   - Checks for vulnerabilities

3. **Deploy Preview Job** (PR only):
   - Builds for preview
   - Comments on PR with status

### Environment Variables

Make sure these secrets are set in your GitHub repository:

- `NEXT_PUBLIC_CONVEX_URL`
- `IRRISTRAT_TOKEN`

## 🐛 Debugging Tests

### Unit Tests

```bash
# Run specific test file
npm test AlertMessage.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="error"

# Run with verbose output
npm test -- --verbose
```

### E2E Tests

```bash
# Run with headed browser
npm run test:e2e:headed

# Run with Playwright UI
npm run test:e2e:ui

# Run specific test file
npx playwright test home.spec.ts

# Run with debug mode
npx playwright test --debug
```

## 📊 Coverage Reports

After running `npm run test:coverage`, you'll get:

- Console output with coverage summary
- HTML report in `coverage/lcov-report/index.html`
- LCOV report in `coverage/lcov.info`

## 🔍 Common Test Patterns

### Testing Components with Props

```typescript
it('renders with different props', () => {
  const { rerender } = render(<AlertMessage type="error" message="Error" />)
  expect(screen.getByText('Error')).toBeInTheDocument()

  rerender(<AlertMessage type="warning" message="Warning" />)
  expect(screen.getByText('Warning')).toBeInTheDocument()
})
```

### Testing User Interactions

```typescript
import userEvent from '@testing-library/user-event'

it('handles user input', async () => {
  const user = userEvent.setup()
  render(<MyComponent />)

  const input = screen.getByRole('textbox')
  await user.type(input, 'test value')
  expect(input).toHaveValue('test value')
})
```

### Testing API Calls

```typescript
// Mock the API call
jest.mock('@/services/api', () => ({
  fetchData: jest.fn(() => Promise.resolve({ data: 'test' }))
}))

it('fetches data on mount', async () => {
  render(<DataComponent />)
  await waitFor(() => {
    expect(screen.getByText('test')).toBeInTheDocument()
  })
})
```

## 🎯 Best Practices

1. **Test Behavior, Not Implementation**: Focus on what the component does, not how it does it
2. **Use Semantic Queries**: Prefer `getByRole`, `getByLabelText` over `getByTestId`
3. **Write Accessible Tests**: Tests should reflect how users interact with your app
4. **Keep Tests Simple**: Each test should verify one thing
5. **Use Descriptive Names**: Test names should clearly describe what's being tested
6. **Mock External Dependencies**: Don't test third-party libraries
7. **Test Error States**: Don't just test happy paths

## 🚀 Next Steps

1. **Add More Unit Tests**: Focus on critical components and utilities
2. **Expand E2E Coverage**: Add tests for user workflows
3. **Performance Testing**: Add performance benchmarks
4. **Visual Regression Testing**: Add visual testing with Playwright
5. **API Testing**: Add tests for API endpoints

## 📚 Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Next.js Testing](https://nextjs.org/docs/testing)

// Simple test to verify the testing setup is working
import { formatDate } from '../utils/utils'

describe('Basic Setup', () => {
  it('should have working test environment', () => {
    expect(true).toBe(true)
  })

  it('should be able to import utils', () => {
    // This test will pass if the module can be imported
    expect(formatDate).toBeDefined()
  })

  it('should have correct environment variables', () => {
    expect(process.env.NODE_ENV).toBeDefined()
  })
}) 
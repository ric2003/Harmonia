import { formatDate } from '../utils'

describe('Utils', () => {
  describe('formatDate', () => {
    it('formats date correctly', () => {
      const date = new Date('2024-01-15')
      const formatted = formatDate(date.toISOString())
      expect(formatted).toBe('15/01/2024')
    })

    it('formats different dates correctly', () => {
      const date1 = new Date('2024-12-25')
      const date2 = new Date('2024-03-08')
      
      expect(formatDate(date1.toISOString())).toBe('25/12/2024')
      expect(formatDate(date2.toISOString())).toBe('08/03/2024')
    })
  })
}) 
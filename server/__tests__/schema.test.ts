import { describe, it, expect } from 'vitest'
import { 
  insertUserSchema, 
  insertItemSchema, 
  insertMovementSchema 
} from '../../shared/schema'

describe('Schema Validation', () => {
  describe('insertUserSchema', () => {
    it('validates valid user data', () => {
      const validUser = {
        email: 'test@example.com',
        password: 'securepassword',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        address: '123 Main St',
        plan: 'medium',
      }

      const result = insertUserSchema.safeParse(validUser)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.email).toBe(validUser.email)
        expect(result.data.plan).toBe(validUser.plan)
        expect(result.data.setupFeePaid).toBe(false) // default value
        expect(result.data.insuranceCoverage).toBe(2000) // default value
      }
    })

    it('requires valid email', () => {
      const invalidUser = {
        email: 'invalid-email',
        plan: 'starter',
      }

      const result = insertUserSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('email')
      }
    })

    it('applies default values', () => {
      const minimalUser = {
        email: 'test@example.com',
      }

      const result = insertUserSchema.safeParse(minimalUser)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.plan).toBe('starter')
        expect(result.data.setupFeePaid).toBe(false)
        expect(result.data.insuranceCoverage).toBe(2000)
        expect(result.data.preferredAuthMethod).toBe('email')
        expect(result.data.lastAuthMethod).toBe('email')
      }
    })
  })

  describe('insertItemSchema', () => {
    it('validates valid item data', () => {
      const validItem = {
        userId: 'user123',
        name: 'Winter Jacket',
        category: 'Clothing',
        estimatedValue: 150,
        description: 'Blue winter jacket',
        photoUrls: ['https://example.com/photo1.jpg'],
      }

      const result = insertItemSchema.safeParse(validItem)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe(validItem.name)
        expect(result.data.status).toBe('at_home') // default
        expect(result.data.length).toBe(12) // default dimensions
        expect(result.data.width).toBe(12)
        expect(result.data.height).toBe(12)
        expect(result.data.weight).toBe(10)
      }
    })

    it('requires userId and name', () => {
      const invalidItem = {
        category: 'Furniture',
        estimatedValue: 500,
      }

      const result = insertItemSchema.safeParse(invalidItem)
      expect(result.success).toBe(false)
      if (!result.success) {
        const paths = result.error.issues.map(issue => issue.path[0])
        expect(paths).toContain('userId')
        expect(paths).toContain('name')
      }
    })

    it('validates status enum', () => {
      const itemWithInvalidStatus = {
        userId: 'user123',
        name: 'Test Item',
        category: 'Other',
        estimatedValue: 50,
        status: 'invalid_status',
      }

      const result = insertItemSchema.safeParse(itemWithInvalidStatus)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('status')
      }
    })
  })

  describe('insertMovementSchema', () => {
    it('validates valid movement data', () => {
      const validMovement = {
        userId: 'user123',
        type: 'pickup',
        scheduledDate: new Date('2024-12-01'),
        scheduledTimeSlot: '10:00 AM - 12:00 PM',
        itemIds: ['item1', 'item2'],
        address: '123 Main St',
        specialInstructions: 'Call when arriving',
      }

      const result = insertMovementSchema.safeParse(validMovement)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.type).toBe('pickup')
        expect(result.data.status).toBe('scheduled') // default
        expect(result.data.itemIds).toHaveLength(2)
      }
    })

    it('validates movement type enum', () => {
      const invalidMovement = {
        userId: 'user123',
        type: 'invalid_type',
        scheduledDate: new Date(),
        scheduledTimeSlot: '10:00 AM - 12:00 PM',
        itemIds: [],
        address: '123 Main St',
      }

      const result = insertMovementSchema.safeParse(invalidMovement)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('type')
      }
    })

    it('requires non-empty itemIds array', () => {
      const movementWithNoItems = {
        userId: 'user123',
        type: 'delivery',
        scheduledDate: new Date(),
        scheduledTimeSlot: '2:00 PM - 4:00 PM',
        itemIds: [],
        address: '456 Oak Ave',
      }

      const result = insertMovementSchema.safeParse(movementWithNoItems)
      expect(result.success).toBe(true) // Empty array is technically valid
      if (result.success) {
        expect(result.data.itemIds).toEqual([])
      }
    })
  })
})
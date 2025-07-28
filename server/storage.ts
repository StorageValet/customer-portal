import Airtable from 'airtable';
import {
  User,
  Item,
  Movement,
  InsertUser,
  UpsertUser,
  InsertItem,
  InsertMovement,
} from "@shared/schema";

export interface IStorage {
  // User methods - updated for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<User>): Promise<User>;
  
  // Item methods - updated for string IDs
  getUserItems(userId: string): Promise<Item[]>;
  getItem(id: string): Promise<Item | undefined>;
  createItem(item: InsertItem & { userId: string }): Promise<Item>;
  updateItem(id: string, item: Partial<Item>): Promise<Item>;
  deleteItem(id: string): Promise<void>;
  
  // Movement methods - updated for string IDs
  getUserMovements(userId: string): Promise<Movement[]>;
  createMovement(movement: InsertMovement & { userId: string }): Promise<Movement>;
  updateMovement(id: string, movement: Partial<Movement>): Promise<Movement>;
  
  // Password reset methods
  saveResetToken(userId: string, token: string, expires: Date): Promise<void>;
  verifyResetToken(token: string): Promise<string | null>;
  clearResetToken(userId: string): Promise<void>;
  updateUserPassword(userId: string, hashedPassword: string): Promise<void>;
}

// In-memory storage for reset tokens (temporary solution)
const resetTokens = new Map<string, { userId: string; expires: Date }>();

export class AirtableStorage implements IStorage {
  private base: any;
  
  // Table name mappings
  private tables = {
    users: 'Customers',
    items: 'Containers',
    movements: 'Movements',
  };
  
  // Field mappings to convert between app fields and Airtable fields
  private userFieldToAirtable = {
    email: 'Email',
    password: 'Password',
    firstName: 'First Name',
    lastName: 'Last Name',
    phone: 'Phone',
    address: 'Full Address',
    plan: 'Monthly Plan',
    setupFeePaid: 'Setup Fee Paid',
    insuranceCoverage: 'Total Insured Value',
    referralCode: 'Referral Code',
    stripeCustomerId: 'Stripe Customer ID',
    stripeSubscriptionId: 'Stripe Subscription ID',
    firstPickupDate: 'First Pickup Date',
    createdAt: 'Account Created Date',
  };
  
  private itemFieldToAirtable = {
    userId: 'Customer',
    name: 'Item Name/Label',
    description: 'Description',
    category: 'Category Tags',
    status: 'Current Status',
    estimatedValue: 'Estimated Value',
    photoUrls: 'Additional Photos',
    qrCode: 'QR String',
    facility: 'Current Location',
    lastScannedAt: 'Last Movement Date',
    createdAt: 'Created Date',
  };
  
  private movementFieldToAirtable = {
    userId: 'Customers',
    type: 'Movement Type',
    status: 'Status',
    scheduledDate: 'Requested Date',
    scheduledTimeSlot: 'Time Window',
    itemIds: 'Containers',
    address: 'Service Address',
    specialInstructions: 'Special Instructions',
  };
  
  constructor() {
    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;
    
    console.log('Initializing AirtableStorage with:', {
      apiKeyExists: !!apiKey,
      apiKeyPrefix: apiKey ? apiKey.substring(0, 5) + '...' : 'missing',
      baseIdExists: !!baseId,
      baseId: baseId || 'missing'
    });
    
    if (!apiKey || !baseId) {
      throw new Error('AIRTABLE_API_KEY and AIRTABLE_BASE_ID environment variables are required');
    }
    
    // Initialize Airtable with the new Personal Access Token format
    this.base = new Airtable({ 
      apiKey: apiKey 
    }).base(baseId);
  }

  private convertAirtableRecord(record: any, type: 'user' | 'item' | 'movement'): User | Item | Movement {
    const fields = record.fields;
    
    switch (type) {
      case 'user':
        return {
          id: record.id,
          email: fields['Email'] || '',
          password: fields['Password'] || '',
          firstName: fields['First Name'] || null,
          lastName: fields['Last Name'] || null,
          profileImageUrl: null, // Not in their schema
          phone: fields['Phone'] || null,
          address: fields['Full Address'] || null,
          plan: fields['Monthly Plan'] || 'starter',
          setupFeePaid: fields['Setup Fee Paid'] || false,
          stripeCustomerId: fields['Stripe Customer ID'] || null,
          stripeSubscriptionId: fields['Stripe Subscription ID'] || null,
          referralCode: fields['Referral Code'] || null,
          insuranceCoverage: fields['Total Insured Value'] || 2000,
          firstPickupDate: fields['First Pickup Date'] ? new Date(fields['First Pickup Date']) : null,
          preferredAuthMethod: 'email', // Not in their schema, using default
          lastAuthMethod: 'email', // Not in their schema, using default
          createdAt: fields['Account Created Date'] ? new Date(fields['Account Created Date']) : new Date(),
          updatedAt: new Date(), // Not in their schema
        } as User;
        
      case 'item':
        // Extract the Customer ID from linked record (returns array)
        const customerIds = fields['Customer'] || [];
        const userId = Array.isArray(customerIds) && customerIds.length > 0 ? customerIds[0] : '';
        
        // Parse photos array
        const photos = fields['Additional Photos'] || [];
        const photoUrls = photos.map((photo: any) => photo.url || '').filter((url: string) => url);
        
        return {
          id: record.id,
          userId: userId,
          name: fields['Item Name/Label'] || '',
          description: fields['Description'] || null,
          category: fields['Category Tags'] || '',
          estimatedValue: fields['Estimated Value'] || 0,
          photoUrls: photoUrls,
          coverPhotoIndex: 0, // Default to first photo
          qrCode: fields['QR String'] || '',
          status: fields['Current Status'] === 'In Storage' ? 'in_storage' : 'at_home',
          length: 12, // Default values since not in their schema
          width: 12,
          height: 12,
          weight: 10,
          facility: fields['Current Location'] || null,
          zone: null, // Not in their schema
          rack: null, // Not in their schema
          shelf: null, // Not in their schema
          lastScannedAt: fields['Last Movement Date'] ? new Date(fields['Last Movement Date']) : null,
          createdAt: fields['Created Date'] ? new Date(fields['Created Date']) : new Date(),
        } as Item;
        
      case 'movement':
        // Extract the Customer ID from linked record
        const customerArray = fields['Customers'] || [];
        const movementUserId = Array.isArray(customerArray) && customerArray.length > 0 ? customerArray[0] : '';
        
        // Extract Container IDs from linked records
        const containerIds = fields['Containers'] || [];
        
        return {
          id: record.id,
          userId: movementUserId,
          type: fields['Movement Type'] === 'Delivery' ? 'delivery' : 'pickup',
          status: fields['Status'] || 'scheduled',
          scheduledDate: fields['Requested Date'] ? new Date(fields['Requested Date']) : new Date(),
          scheduledTimeSlot: fields['Time Window'] || '',
          itemIds: containerIds,
          address: fields['Service Address'] || '',
          specialInstructions: fields['Special Instructions'] || null,
          totalVolume: null, // Not in their schema
          totalWeight: null, // Not in their schema
          truckSize: null, // Not in their schema
          estimatedDuration: null, // Not in their schema
          createdAt: new Date(), // Not in their schema
        } as Movement;
        
      default:
        throw new Error(`Unknown type: ${type}`);
    }
  }

  // Helper methods to convert between app fields and Airtable fields
  private toAirtableUserFields(userData: any): any {
    const airtableData: any = {};
    
    if (userData.email !== undefined) airtableData['Email'] = userData.email;
    if (userData.password !== undefined) airtableData['Password'] = userData.password;
    if (userData.firstName !== undefined) airtableData['First Name'] = userData.firstName;
    if (userData.lastName !== undefined) airtableData['Last Name'] = userData.lastName;
    if (userData.phone !== undefined) airtableData['Phone'] = userData.phone;
    if (userData.address !== undefined) airtableData['Full Address'] = userData.address;
    if (userData.plan !== undefined) airtableData['Monthly Plan'] = userData.plan;
    if (userData.setupFeePaid !== undefined) airtableData['Setup Fee Paid'] = userData.setupFeePaid;
    if (userData.insuranceCoverage !== undefined) airtableData['Total Insured Value'] = userData.insuranceCoverage;
    if (userData.referralCode !== undefined) airtableData['Referral Code'] = userData.referralCode;
    if (userData.stripeCustomerId !== undefined) airtableData['Stripe Customer ID'] = userData.stripeCustomerId;
    if (userData.stripeSubscriptionId !== undefined) airtableData['Stripe Subscription ID'] = userData.stripeSubscriptionId;
    if (userData.firstPickupDate !== undefined) airtableData['First Pickup Date'] = userData.firstPickupDate;
    if (userData.createdAt !== undefined) airtableData['Account Created Date'] = userData.createdAt;
    
    return airtableData;
  }

  private toAirtableItemFields(itemData: any): any {
    const airtableData: any = {};
    
    if (itemData.userId !== undefined) airtableData['Customer'] = [itemData.userId]; // Linked record
    if (itemData.name !== undefined) airtableData['Item Name/Label'] = itemData.name;
    if (itemData.description !== undefined) airtableData['Description'] = itemData.description;
    if (itemData.category !== undefined) airtableData['Category Tags'] = itemData.category;
    if (itemData.estimatedValue !== undefined) airtableData['Estimated Value'] = itemData.estimatedValue;
    if (itemData.photoUrls !== undefined) airtableData['Additional Photos'] = itemData.photoUrls;
    if (itemData.qrCode !== undefined) airtableData['QR String'] = itemData.qrCode;
    if (itemData.status !== undefined) airtableData['Current Status'] = itemData.status === 'in_storage' ? 'In Storage' : 'At Home';
    if (itemData.facility !== undefined) airtableData['Current Location'] = itemData.facility;
    if (itemData.lastScannedAt !== undefined) airtableData['Last Movement Date'] = itemData.lastScannedAt;
    if (itemData.createdAt !== undefined) airtableData['Created Date'] = itemData.createdAt;
    
    return airtableData;
  }

  private toAirtableMovementFields(movementData: any): any {
    const airtableData: any = {};
    
    if (movementData.userId !== undefined) airtableData['Customers'] = [movementData.userId]; // Linked record
    if (movementData.type !== undefined) airtableData['Movement Type'] = movementData.type === 'delivery' ? 'Delivery' : 'Pickup';
    if (movementData.status !== undefined) airtableData['Status'] = movementData.status;
    if (movementData.scheduledDate !== undefined) airtableData['Requested Date'] = movementData.scheduledDate;
    if (movementData.scheduledTimeSlot !== undefined) airtableData['Time Window'] = movementData.scheduledTimeSlot;
    if (movementData.itemIds !== undefined) airtableData['Containers'] = movementData.itemIds; // Linked records
    if (movementData.address !== undefined) airtableData['Service Address'] = movementData.address;
    if (movementData.specialInstructions !== undefined) airtableData['Special Instructions'] = movementData.specialInstructions;
    
    return airtableData;
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    try {
      const record = await this.base(this.tables.users).find(id);
      return this.convertAirtableRecord(record, 'user') as User;
    } catch (error) {
      if ((error as any).statusCode === 404) {
        return undefined;
      }
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const records = await this.base(this.tables.users).select({
        filterByFormula: `{Email} = '${email}'`,
        maxRecords: 1
      }).firstPage();
      
      if (records.length === 0) return undefined;
      return this.convertAirtableRecord(records[0], 'user') as User;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return undefined;
    }
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    try {
      // Try to find existing user
      const existingUser = await this.getUser(userData.id);
      
      if (existingUser) {
        // Update existing user
        const record = await this.base(this.tables.users).update(userData.id, this.toAirtableUserFields(userData));
        return this.convertAirtableRecord(record, 'user') as User;
      } else {
        // Create new user
        const record = await this.base(this.tables.users).create(this.toAirtableUserFields(userData));
        return this.convertAirtableRecord(record, 'user') as User;
      }
    } catch (error) {
      console.error('Error upserting user:', error);
      throw error;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const record = await this.base(this.tables.users).create(this.toAirtableUserFields(insertUser));
      return this.convertAirtableRecord(record, 'user') as User;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id: string, userUpdate: Partial<User>): Promise<User> {
    try {
      const record = await this.base(this.tables.users).update(id, this.toAirtableUserFields(userUpdate));
      return this.convertAirtableRecord(record, 'user') as User;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // Item operations
  async getUserItems(userId: string): Promise<Item[]> {
    try {
      const records = await this.base(this.tables.items).select({
        filterByFormula: `SEARCH('${userId}', ARRAYJOIN({Customer}))`
      }).all();
      
      return records.map((record: any) => this.convertAirtableRecord(record, 'item') as Item);
    } catch (error) {
      console.error('Error getting user items:', error);
      return [];
    }
  }

  async getItem(id: string): Promise<Item | undefined> {
    try {
      const record = await this.base(this.tables.items).find(id);
      return this.convertAirtableRecord(record, 'item') as Item;
    } catch (error) {
      if ((error as any).statusCode === 404) {
        return undefined;
      }
      throw error;
    }
  }

  async createItem(itemData: InsertItem & { userId: string }): Promise<Item> {
    try {
      // Generate QR code
      const qrCode = `SV${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      
      const itemDataWithQR = { ...itemData, qrCode };
      const record = await this.base(this.tables.items).create(this.toAirtableItemFields(itemDataWithQR));
      
      return this.convertAirtableRecord(record, 'item') as Item;
    } catch (error) {
      console.error('Error creating item:', error);
      throw error;
    }
  }

  async updateItem(id: string, itemUpdate: Partial<Item>): Promise<Item> {
    try {
      const record = await this.base(this.tables.items).update(id, this.toAirtableItemFields(itemUpdate));
      return this.convertAirtableRecord(record, 'item') as Item;
    } catch (error) {
      console.error('Error updating item:', error);
      throw error;
    }
  }

  async deleteItem(id: string): Promise<void> {
    try {
      await this.base(this.tables.items).destroy(id);
    } catch (error) {
      console.error('Error deleting item:', error);
      throw error;
    }
  }

  // Movement operations
  async getUserMovements(userId: string): Promise<Movement[]> {
    try {
      const records = await this.base(this.tables.movements).select({
        filterByFormula: `SEARCH('${userId}', ARRAYJOIN({Customers}))`
      }).all();
      
      return records.map((record: any) => this.convertAirtableRecord(record, 'movement') as Movement);
    } catch (error) {
      console.error('Error getting user movements:', error);
      return [];
    }
  }

  async createMovement(movementData: InsertMovement & { userId: string }): Promise<Movement> {
    try {
      const movementDataFormatted = {
        ...movementData,
        scheduledDate: movementData.scheduledDate.toISOString(),
      };
      const record = await this.base(this.tables.movements).create(this.toAirtableMovementFields(movementDataFormatted));
      
      return this.convertAirtableRecord(record, 'movement') as Movement;
    } catch (error) {
      console.error('Error creating movement:', error);
      throw error;
    }
  }

  async updateMovement(id: string, movementUpdate: Partial<Movement>): Promise<Movement> {
    try {
      const updateData = { ...movementUpdate };
      if (updateData.scheduledDate) {
        updateData.scheduledDate = updateData.scheduledDate.toISOString() as any;
      }
      
      const record = await this.base(this.tables.movements).update(id, this.toAirtableMovementFields(updateData));
      return this.convertAirtableRecord(record, 'movement') as Movement;
    } catch (error) {
      console.error('Error updating movement:', error);
      throw error;
    }
  }

  // Password reset methods (using in-memory storage for now)
  async saveResetToken(userId: string, token: string, expires: Date): Promise<void> {
    resetTokens.set(token, { userId, expires });
  }

  async verifyResetToken(token: string): Promise<string | null> {
    const data = resetTokens.get(token);
    if (!data) return null;
    
    if (new Date() > data.expires) {
      resetTokens.delete(token);
      return null;
    }
    
    return data.userId;
  }

  async clearResetToken(userId: string): Promise<void> {
    for (const [token, data] of Array.from(resetTokens.entries())) {
      if (data.userId === userId) {
        resetTokens.delete(token);
      }
    }
  }

  async updateUserPassword(userId: string, hashedPassword: string): Promise<void> {
    await this.updateUser(userId, { password: hashedPassword });
  }
}

export const storage = new AirtableStorage();
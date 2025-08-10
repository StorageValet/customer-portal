/**
 * Storage Valet - Simplified Storage Layer (v7)
 * Uses new 4-table schema with clean field mappings
 */

import Airtable from "airtable";
import bcrypt from "bcrypt";
import { TABLES, CUSTOMER_FIELDS, ITEM_FIELDS, ACTION_FIELDS } from "./airtable-tables";
import { createEmailFilter, createFieldMatchFilter } from "./lib/airtable-security";

// Types (simplified for new schema)
export interface Customer {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone?: string;
  serviceAddress: string;
  zipCode: string;
  monthlyPlan: 'Starter' | 'Medium' | 'Family';
  planCubicFeet: number;
  planInsurance: number;
  usedCubicFeet: number;
  usedInsurance: number;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  setupFeePaid: boolean;
  setupFeeAmount?: number;
  setupFeeWaivedBy?: string;
  billingStartDate?: Date;
  subscriptionStatus: 'none' | 'active' | 'paused' | 'cancelled';
}

export interface Item {
  id: string;
  customerId: string;
  qrCode: string;
  itemName: string;
  description?: string;
  category?: string; // Free text - customer defined categories
  lengthInches: number;
  widthInches: number;
  heightInches: number;
  cubicFeet: number;
  weightLbs: number;
  estimatedValue: number;
  containerType: 'Bin' | 'Tote' | 'Crate' | 'Customer Container' | 'Specialty Item';
  isSvContainer: boolean;
  photoUrls?: string;
  status: 'At Home' | 'In Transit' | 'In Storage';
  storageLocation?: string;
  pickupDate?: Date;
  returnDeliveryScheduled?: boolean;
  returnDeliveryDate?: Date;
  returnDeliveryActionId?: string;
}

export interface Action {
  id: string;
  customerId: string;
  type: 'Pickup' | 'Delivery' | 'Container Delivery';
  status: 'Scheduled' | 'Confirmed' | 'Completed' | 'Cancelled';
  scheduledDate: Date;
  timeWindow: '8AM-12PM' | '12PM-4PM' | '4PM-8PM';
  itemIds?: string[];
  totalCubicFeet: number;
  totalWeight: number;
  itemCount: number;
  serviceAddress: string;
  specialInstructions?: string;
  completedAt?: Date;
  driverNotes?: string;
  triggersBilling?: boolean;
}

export class StorageV7 {
  private base: any;
  private resetTokens = new Map<string, { userId: string; expires: Date }>();

  constructor() {
    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;

    if (!apiKey || !baseId) {
      throw new Error("Missing Airtable configuration");
    }

    this.base = new Airtable({ apiKey }).base(baseId);
  }

  // ========== CUSTOMER METHODS ==========

  async getCustomerByEmail(email: string): Promise<Customer | null> {
    try {
      const records = await this.base(TABLES.CUSTOMERS)
        .select({
          filterByFormula: createEmailFilter(email),
          maxRecords: 1,
        })
        .firstPage();

      if (records.length === 0) return null;
      return this.recordToCustomer(records[0]);
    } catch (error) {
      console.error("Error getting customer by email:", error);
      return null;
    }
  }

  async getCustomerById(id: string): Promise<Customer | null> {
    try {
      const record = await this.base(TABLES.CUSTOMERS).find(id);
      return this.recordToCustomer(record);
    } catch (error) {
      console.error("Error getting customer by ID:", error);
      return null;
    }
  }

  async createCustomer(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    serviceAddress: string;
    zipCode: string;
    plan: 'Starter' | 'Medium' | 'Family';
    stripeCustomerId?: string;
    setupFeePaid?: boolean;
    setupFeeWaivedBy?: string;
  }): Promise<Customer> {
    try {
      // Hash password
      const passwordHash = await bcrypt.hash(data.password, 10);
      
      // Determine plan limits
      const planLimits = {
        Starter: { cubicFeet: 100, insurance: 2000, setupFee: 99.50 },
        Medium: { cubicFeet: 200, insurance: 3000, setupFee: 149.50 },
        Family: { cubicFeet: 300, insurance: 4000, setupFee: 179.50 },
      };
      
      const limits = planLimits[data.plan];
      
      const record = await this.base(TABLES.CUSTOMERS).create({
        [CUSTOMER_FIELDS.EMAIL]: data.email,
        [CUSTOMER_FIELDS.PASSWORD_HASH]: passwordHash,
        [CUSTOMER_FIELDS.FIRST_NAME]: data.firstName,
        [CUSTOMER_FIELDS.LAST_NAME]: data.lastName,
        [CUSTOMER_FIELDS.PHONE]: data.phone || '',
        [CUSTOMER_FIELDS.SERVICE_ADDRESS]: data.serviceAddress,
        [CUSTOMER_FIELDS.ZIP_CODE]: data.zipCode,
        [CUSTOMER_FIELDS.MONTHLY_PLAN]: data.plan,
        [CUSTOMER_FIELDS.PLAN_CUBIC_FEET]: limits.cubicFeet,
        [CUSTOMER_FIELDS.PLAN_INSURANCE]: limits.insurance,
        [CUSTOMER_FIELDS.USED_CUBIC_FEET]: 0,
        [CUSTOMER_FIELDS.USED_INSURANCE]: 0,
        [CUSTOMER_FIELDS.TOTAL_WEIGHT_LBS]: 0,
        [CUSTOMER_FIELDS.ACTIVE_ITEMS_COUNT]: 0,
        [CUSTOMER_FIELDS.STRIPE_CUSTOMER_ID]: data.stripeCustomerId || '',
        [CUSTOMER_FIELDS.SETUP_FEE_PAID]: data.setupFeePaid || false,
        [CUSTOMER_FIELDS.SETUP_FEE_AMOUNT]: data.setupFeeWaivedBy ? 0 : limits.setupFee,
        [CUSTOMER_FIELDS.SETUP_FEE_WAIVED_BY]: data.setupFeeWaivedBy || '',
        [CUSTOMER_FIELDS.SUBSCRIPTION_STATUS]: 'none',
      });
      
      return this.recordToCustomer(record);
    } catch (error) {
      console.error("Error creating customer:", error);
      throw error;
    }
  }

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
    try {
      const fields: any = {};
      
      // Map updates to Airtable fields
      if (updates.email) fields[CUSTOMER_FIELDS.EMAIL] = updates.email;
      if (updates.firstName) fields[CUSTOMER_FIELDS.FIRST_NAME] = updates.firstName;
      if (updates.lastName) fields[CUSTOMER_FIELDS.LAST_NAME] = updates.lastName;
      if (updates.phone !== undefined) fields[CUSTOMER_FIELDS.PHONE] = updates.phone;
      if (updates.serviceAddress) fields[CUSTOMER_FIELDS.SERVICE_ADDRESS] = updates.serviceAddress;
      if (updates.stripeSubscriptionId) fields[CUSTOMER_FIELDS.STRIPE_SUBSCRIPTION_ID] = updates.stripeSubscriptionId;
      if (updates.billingStartDate) fields[CUSTOMER_FIELDS.BILLING_START_DATE] = updates.billingStartDate;
      if (updates.subscriptionStatus) fields[CUSTOMER_FIELDS.SUBSCRIPTION_STATUS] = updates.subscriptionStatus;
      
      const record = await this.base(TABLES.CUSTOMERS).update(id, fields);
      return this.recordToCustomer(record);
    } catch (error) {
      console.error("Error updating customer:", error);
      throw error;
    }
  }

  async validatePassword(email: string, password: string): Promise<boolean> {
    const customer = await this.getCustomerByEmail(email);
    if (!customer) return false;
    return bcrypt.compare(password, customer.passwordHash);
  }

  // ========== ITEM METHODS ==========

  async getCustomerItems(customerId: string): Promise<Item[]> {
    try {
      const records = await this.base(TABLES.ITEMS)
        .select({
          filterByFormula: createArraySearchFilter(customerId, 'Customer'),
        })
        .all();
      
      return records.map((r: any) => this.recordToItem(r));
    } catch (error) {
      console.error("Error getting customer items:", error);
      return [];
    }
  }

  async getItemById(id: string): Promise<Item | null> {
    try {
      const record = await this.base(TABLES.ITEMS).find(id);
      return this.recordToItem(record);
    } catch (error) {
      console.error("Error getting item:", error);
      return null;
    }
  }

  async createItem(data: {
    customerId: string;
    itemName: string;
    description?: string;
    category?: string;
    lengthInches: number;
    widthInches: number;
    heightInches: number;
    weightLbs: number;
    estimatedValue: number;
    containerType: 'Bin' | 'Tote' | 'Crate' | 'Customer Container' | 'Specialty Item';
    photoUrls?: string;
    returnDeliveryDate?: Date;
    returnDeliveryTimeWindow?: '8AM-12PM' | '12PM-4PM' | '4PM-8PM';
  }): Promise<Item> {
    try {
      // Calculate cubic feet
      const cubicFeet = (data.lengthInches * data.widthInches * data.heightInches) / 1728;
      
      // Generate QR code
      const qrCode = `SV-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
      
      // Check if return delivery is requested
      let returnActionId: string | undefined;
      if (data.returnDeliveryDate && data.returnDeliveryTimeWindow) {
        // Get customer for address
        const customer = await this.getCustomerById(data.customerId);
        if (customer) {
          // Create the future delivery action
          const returnAction = await this.base(TABLES.ACTIONS).create({
            [ACTION_FIELDS.CUSTOMER]: [data.customerId],
            [ACTION_FIELDS.TYPE]: 'Delivery',
            [ACTION_FIELDS.STATUS]: 'Scheduled',
            [ACTION_FIELDS.SCHEDULED_DATE]: data.returnDeliveryDate,
            [ACTION_FIELDS.TIME_WINDOW]: data.returnDeliveryTimeWindow,
            [ACTION_FIELDS.ITEMS]: [], // Will be linked when item is created
            [ACTION_FIELDS.SERVICE_ADDRESS]: customer.serviceAddress,
            [ACTION_FIELDS.SPECIAL_INSTRUCTIONS]: 'Advanced return delivery - auto-scheduled at item creation',
          });
          returnActionId = returnAction.id;
        }
      }

      const record = await this.base(TABLES.ITEMS).create({
        [ITEM_FIELDS.CUSTOMER]: [data.customerId],
        [ITEM_FIELDS.QR_CODE]: qrCode,
        [ITEM_FIELDS.ITEM_NAME]: data.itemName,
        [ITEM_FIELDS.DESCRIPTION]: data.description || '',
        [ITEM_FIELDS.CATEGORY]: data.category || 'Other',
        [ITEM_FIELDS.LENGTH_INCHES]: data.lengthInches,
        [ITEM_FIELDS.WIDTH_INCHES]: data.widthInches,
        [ITEM_FIELDS.HEIGHT_INCHES]: data.heightInches,
        [ITEM_FIELDS.CUBIC_FEET]: cubicFeet,
        [ITEM_FIELDS.WEIGHT_LBS]: data.weightLbs,
        [ITEM_FIELDS.ESTIMATED_VALUE]: data.estimatedValue,
        [ITEM_FIELDS.CONTAINER_TYPE]: data.containerType,
        [ITEM_FIELDS.IS_SV_CONTAINER]: ['Bin', 'Tote', 'Crate'].includes(data.containerType),
        [ITEM_FIELDS.PHOTO_URLS]: data.photoUrls || '',
        [ITEM_FIELDS.STATUS]: 'At Home',
        [ITEM_FIELDS.RETURN_DELIVERY_SCHEDULED]: !!returnActionId,
        [ITEM_FIELDS.RETURN_DELIVERY_DATE]: data.returnDeliveryDate || null,
        [ITEM_FIELDS.RETURN_DELIVERY_ACTION_ID]: returnActionId ? [returnActionId] : [],
      });
      
      // If return action was created, update it to link to this item
      if (returnActionId) {
        await this.base(TABLES.ACTIONS).update(returnActionId, {
          [ACTION_FIELDS.ITEMS]: [record.id],
          [ACTION_FIELDS.TOTAL_CUBIC_FEET]: cubicFeet,
          [ACTION_FIELDS.TOTAL_WEIGHT]: data.weightLbs,
          [ACTION_FIELDS.ITEM_COUNT]: 1,
        });
      }
      
      // Update customer's usage
      await this.updateCustomerUsage(data.customerId);
      
      return this.recordToItem(record);
    } catch (error) {
      console.error("Error creating item:", error);
      throw error;
    }
  }

  async updateItem(id: string, updates: Partial<Item>): Promise<Item> {
    try {
      const fields: any = {};
      
      if (updates.itemName) fields[ITEM_FIELDS.ITEM_NAME] = updates.itemName;
      if (updates.description !== undefined) fields[ITEM_FIELDS.DESCRIPTION] = updates.description;
      if (updates.status) fields[ITEM_FIELDS.STATUS] = updates.status;
      if (updates.storageLocation) fields[ITEM_FIELDS.STORAGE_LOCATION] = updates.storageLocation;
      if (updates.photoUrls) fields[ITEM_FIELDS.PHOTO_URLS] = updates.photoUrls;
      
      const record = await this.base(TABLES.ITEMS).update(id, fields);
      const item = this.recordToItem(record);
      
      // Update customer's usage if value changed
      if (updates.estimatedValue !== undefined) {
        await this.updateCustomerUsage(item.customerId);
      }
      
      return item;
    } catch (error) {
      console.error("Error updating item:", error);
      throw error;
    }
  }

  async deleteItem(id: string): Promise<void> {
    try {
      const item = await this.getItemById(id);
      if (!item) return;
      
      await this.base(TABLES.ITEMS).destroy(id);
      
      // Update customer's usage
      await this.updateCustomerUsage(item.customerId);
    } catch (error) {
      console.error("Error deleting item:", error);
      throw error;
    }
  }

  // ========== ACTION METHODS ==========

  async getCustomerActions(customerId: string): Promise<Action[]> {
    try {
      const records = await this.base(TABLES.ACTIONS)
        .select({
          filterByFormula: createArraySearchFilter(customerId, 'Customer'),
        })
        .all();
      
      return records.map((r: any) => this.recordToAction(r));
    } catch (error) {
      console.error("Error getting customer actions:", error);
      return [];
    }
  }

  async createAction(data: {
    customerId: string;
    type: 'Pickup' | 'Delivery' | 'Container Delivery';
    scheduledDate: Date;
    timeWindow: '8AM-12PM' | '12PM-4PM' | '4PM-8PM';
    itemIds?: string[];
    serviceAddress: string;
    specialInstructions?: string;
  }): Promise<Action> {
    try {
      // Calculate totals from items
      let totalCubicFeet = 0;
      let totalWeight = 0;
      
      if (data.itemIds && data.itemIds.length > 0) {
        for (const itemId of data.itemIds) {
          const item = await this.getItemById(itemId);
          if (item) {
            totalCubicFeet += item.cubicFeet;
            totalWeight += item.weightLbs;
          }
        }
      }
      
      // Check if this is the first action (triggers billing)
      const existingActions = await this.getCustomerActions(data.customerId);
      const completedActions = existingActions.filter(a => a.status === 'Completed');
      const triggersBilling = completedActions.length === 0;
      
      const record = await this.base(TABLES.ACTIONS).create({
        [ACTION_FIELDS.CUSTOMER]: [data.customerId],
        [ACTION_FIELDS.TYPE]: data.type,
        [ACTION_FIELDS.STATUS]: 'Scheduled',
        [ACTION_FIELDS.SCHEDULED_DATE]: data.scheduledDate,
        [ACTION_FIELDS.TIME_WINDOW]: data.timeWindow,
        [ACTION_FIELDS.ITEMS]: data.itemIds || [],
        [ACTION_FIELDS.TOTAL_CUBIC_FEET]: totalCubicFeet,
        [ACTION_FIELDS.TOTAL_WEIGHT]: totalWeight,
        [ACTION_FIELDS.ITEM_COUNT]: data.itemIds?.length || 0,
        [ACTION_FIELDS.SERVICE_ADDRESS]: data.serviceAddress,
        [ACTION_FIELDS.SPECIAL_INSTRUCTIONS]: data.specialInstructions || '',
        [ACTION_FIELDS.TRIGGERS_BILLING]: triggersBilling,
      });
      
      // Create ops task
      await this.createOpsTask({
        type: 'Action Today',
        customerId: data.customerId,
        actionId: record.id,
        priority: 'Normal',
        actionRequired: `${data.type} scheduled for ${data.scheduledDate}`,
        dueDate: data.scheduledDate,
      });
      
      return this.recordToAction(record);
    } catch (error) {
      console.error("Error creating action:", error);
      throw error;
    }
  }

  async updateAction(id: string, updates: {
    status?: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
    completedAt?: Date;
    driverNotes?: string;
  }): Promise<Action> {
    try {
      const fields: any = {};
      
      if (updates.status) fields[ACTION_FIELDS.STATUS] = updates.status;
      if (updates.completedAt) fields[ACTION_FIELDS.COMPLETED_AT] = updates.completedAt;
      if (updates.driverNotes) fields[ACTION_FIELDS.DRIVER_NOTES] = updates.driverNotes;
      
      const record = await this.base(TABLES.ACTIONS).update(id, fields);
      const action = this.recordToAction(record);
      
      // If completed and triggers billing, update customer
      if (updates.status === 'Completed' && action.triggersBilling) {
        await this.updateCustomer(action.customerId, {
          billingStartDate: new Date(),
          subscriptionStatus: 'active',
        });
      }
      
      return action;
    } catch (error) {
      console.error("Error updating action:", error);
      throw error;
    }
  }

  // ========== OPS QUEUE METHODS ==========

  async createOpsTask(data: {
    type: string;
    customerId?: string;
    actionId?: string;
    priority: 'Urgent' | 'High' | 'Normal' | 'Low';
    actionRequired: string;
    dueDate?: Date;
  }): Promise<void> {
    try {
      await this.base(TABLES.OPERATIONS).create({
        'Type': data.type,
        'Customer': data.customerId ? [data.customerId] : [],
        'Action': data.actionId ? [data.actionId] : [],
        'Priority': data.priority,
        'Action Required': data.actionRequired,
        'Due Date': data.dueDate || null,
        'Status': 'Pending',
        'Assigned To': 'Zach',
      });
    } catch (error) {
      console.error("Error creating ops task:", error);
      // Don't throw - ops tasks are not critical
    }
  }

  // ========== HELPER METHODS ==========

  async getCustomerCategories(customerId: string): Promise<string[]> {
    try {
      const items = await this.getCustomerItems(customerId);
      const categories = new Map<string, number>();
      
      // Count category usage
      for (const item of items) {
        if (item.category) {
          const count = categories.get(item.category) || 0;
          categories.set(item.category, count + 1);
        }
      }
      
      // Sort by usage frequency and return top categories
      return Array.from(categories.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([category]) => category)
        .slice(0, 10); // Return top 10 most used
    } catch (error) {
      console.error("Error getting customer categories:", error);
      return [];
    }
  }

  private async updateCustomerUsage(customerId: string): Promise<void> {
    try {
      const items = await this.getCustomerItems(customerId);
      
      let totalCubicFeet = 0;
      let totalValue = 0;
      let totalWeight = 0;
      
      for (const item of items) {
        if (item.status === 'In Storage') {
          totalCubicFeet += item.cubicFeet;
          totalValue += item.estimatedValue;
          totalWeight += item.weightLbs;
        }
      }
      
      await this.base(TABLES.CUSTOMERS).update(customerId, {
        [CUSTOMER_FIELDS.USED_CUBIC_FEET]: totalCubicFeet,
        [CUSTOMER_FIELDS.USED_INSURANCE]: totalValue,
        [CUSTOMER_FIELDS.TOTAL_WEIGHT_LBS]: totalWeight,
        [CUSTOMER_FIELDS.ACTIVE_ITEMS_COUNT]: items.filter(i => i.status === 'In Storage').length,
      });
    } catch (error) {
      console.error("Error updating customer usage:", error);
    }
  }

  private recordToCustomer(record: any): Customer {
    const fields = record.fields;
    return {
      id: record.id,
      email: fields[CUSTOMER_FIELDS.EMAIL] || '',
      passwordHash: fields[CUSTOMER_FIELDS.PASSWORD_HASH] || '',
      firstName: fields[CUSTOMER_FIELDS.FIRST_NAME] || '',
      lastName: fields[CUSTOMER_FIELDS.LAST_NAME] || '',
      phone: fields[CUSTOMER_FIELDS.PHONE],
      serviceAddress: fields[CUSTOMER_FIELDS.SERVICE_ADDRESS] || '',
      zipCode: fields[CUSTOMER_FIELDS.ZIP_CODE] || '',
      monthlyPlan: fields[CUSTOMER_FIELDS.MONTHLY_PLAN] || 'Starter',
      planCubicFeet: fields[CUSTOMER_FIELDS.PLAN_CUBIC_FEET] || 100,
      planInsurance: fields[CUSTOMER_FIELDS.PLAN_INSURANCE] || 2000,
      usedCubicFeet: fields[CUSTOMER_FIELDS.USED_CUBIC_FEET] || 0,
      usedInsurance: fields[CUSTOMER_FIELDS.USED_INSURANCE] || 0,
      stripeCustomerId: fields[CUSTOMER_FIELDS.STRIPE_CUSTOMER_ID],
      stripeSubscriptionId: fields[CUSTOMER_FIELDS.STRIPE_SUBSCRIPTION_ID],
      setupFeePaid: fields[CUSTOMER_FIELDS.SETUP_FEE_PAID] || false,
      setupFeeAmount: fields[CUSTOMER_FIELDS.SETUP_FEE_AMOUNT],
      setupFeeWaivedBy: fields[CUSTOMER_FIELDS.SETUP_FEE_WAIVED_BY],
      billingStartDate: fields[CUSTOMER_FIELDS.BILLING_START_DATE],
      subscriptionStatus: fields[CUSTOMER_FIELDS.SUBSCRIPTION_STATUS] || 'none',
    };
  }

  private recordToItem(record: any): Item {
    const fields = record.fields;
    return {
      id: record.id,
      customerId: fields[ITEM_FIELDS.CUSTOMER]?.[0] || '',
      qrCode: fields[ITEM_FIELDS.QR_CODE] || '',
      itemName: fields[ITEM_FIELDS.ITEM_NAME] || '',
      description: fields[ITEM_FIELDS.DESCRIPTION],
      category: fields[ITEM_FIELDS.CATEGORY],
      lengthInches: fields[ITEM_FIELDS.LENGTH_INCHES] || 0,
      widthInches: fields[ITEM_FIELDS.WIDTH_INCHES] || 0,
      heightInches: fields[ITEM_FIELDS.HEIGHT_INCHES] || 0,
      cubicFeet: fields[ITEM_FIELDS.CUBIC_FEET] || 0,
      weightLbs: fields[ITEM_FIELDS.WEIGHT_LBS] || 0,
      estimatedValue: fields[ITEM_FIELDS.ESTIMATED_VALUE] || 0,
      containerType: fields[ITEM_FIELDS.CONTAINER_TYPE] || 'Customer Container',
      isSvContainer: fields[ITEM_FIELDS.IS_SV_CONTAINER] || false,
      photoUrls: fields[ITEM_FIELDS.PHOTO_URLS],
      status: fields[ITEM_FIELDS.STATUS] || 'At Home',
      storageLocation: fields[ITEM_FIELDS.STORAGE_LOCATION],
      pickupDate: fields[ITEM_FIELDS.PICKUP_DATE],
      returnDeliveryScheduled: fields[ITEM_FIELDS.RETURN_DELIVERY_SCHEDULED] || false,
      returnDeliveryDate: fields[ITEM_FIELDS.RETURN_DELIVERY_DATE],
      returnDeliveryActionId: fields[ITEM_FIELDS.RETURN_DELIVERY_ACTION_ID]?.[0], // Linked record
    };
  }

  private recordToAction(record: any): Action {
    const fields = record.fields;
    return {
      id: record.id,
      customerId: fields[ACTION_FIELDS.CUSTOMER]?.[0] || '',
      type: fields[ACTION_FIELDS.TYPE] || 'Pickup',
      status: fields[ACTION_FIELDS.STATUS] || 'Scheduled',
      scheduledDate: fields[ACTION_FIELDS.SCHEDULED_DATE],
      timeWindow: fields[ACTION_FIELDS.TIME_WINDOW] || '8AM-12PM',
      itemIds: fields[ACTION_FIELDS.ITEMS] || [],
      totalCubicFeet: fields[ACTION_FIELDS.TOTAL_CUBIC_FEET] || 0,
      totalWeight: fields[ACTION_FIELDS.TOTAL_WEIGHT] || 0,
      itemCount: fields[ACTION_FIELDS.ITEM_COUNT] || 0,
      serviceAddress: fields[ACTION_FIELDS.SERVICE_ADDRESS] || '',
      specialInstructions: fields[ACTION_FIELDS.SPECIAL_INSTRUCTIONS],
      completedAt: fields[ACTION_FIELDS.COMPLETED_AT],
      driverNotes: fields[ACTION_FIELDS.DRIVER_NOTES],
      triggersBilling: fields[ACTION_FIELDS.TRIGGERS_BILLING] || false,
    };
  }

  // ========== PASSWORD RESET METHODS ==========

  async saveResetToken(userId: string, token: string, expires: Date): Promise<void> {
    this.resetTokens.set(token, { userId, expires });
  }

  async verifyResetToken(token: string): Promise<string | null> {
    const data = this.resetTokens.get(token);
    if (!data) return null;
    if (data.expires < new Date()) {
      this.resetTokens.delete(token);
      return null;
    }
    return data.userId;
  }

  async clearResetToken(userId: string): Promise<void> {
    for (const [token, data] of this.resetTokens.entries()) {
      if (data.userId === userId) {
        this.resetTokens.delete(token);
      }
    }
  }

  async updateUserPassword(userId: string, password: string): Promise<void> {
    const passwordHash = await bcrypt.hash(password, 10);
    await this.base(TABLES.CUSTOMERS).update(userId, {
      [CUSTOMER_FIELDS.PASSWORD_HASH]: passwordHash,
    });
  }
}

// Export singleton instance
export const storage = new StorageV7();
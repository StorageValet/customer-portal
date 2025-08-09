import Airtable from "airtable";
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
  // User methods
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
  getMovement(id: string): Promise<Movement | undefined>;
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
    users: "Customers",
    items: "Containers",
    movements: "Movements",
  };

  // Field mappings to convert between app fields and Airtable fields
  private userFieldToAirtable = {
    email: "Email",
    password: "Password",
    firstName: "First Name",
    lastName: "Last Name",
    phone: "Phone",
    address: "Full Address",
    plan: "Monthly Plan",
    setupFeePaid: "Setup Fee Paid",
    insuranceCoverage: "Total Insured Value",
    referralCode: "Referral Code",
    stripeCustomerId: "Stripe Customer ID",
    stripeSubscriptionId: "Stripe Subscription ID",
    firstPickupDate: "First Pickup Date",
    createdAt: "Account Created Date",
  };

  private itemFieldToAirtable = {
    userId: "Customer",
    name: "Item Name/Label",
    description: "Description",
    category: "Category Tags",
    status: "Current Status",
    estimatedValue: "Estimated Value",
    photoUrls: "Additional Photos",
    qrCode: "QR String",
    facility: "Current Location",
    lastScannedAt: "Last Movement Date",
    createdAt: "Created Date",
  };

  private movementFieldToAirtable = {
    userId: "Customers",
    type: "Movement Type",
    status: "Status",
    scheduledDate: "Requested Date",
    scheduledTimeSlot: "Time Window",
    itemIds: "Containers",
    address: "Service Address",
    specialInstructions: "Special Instructions",
  };

  constructor() {
    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;

    console.log("Initializing AirtableStorage with:", {
      apiKeyExists: !!apiKey,
      apiKeyPrefix: apiKey ? apiKey.substring(0, 5) + "..." : "missing",
      baseIdExists: !!baseId,
      baseId: baseId || "missing",
    });

    if (!apiKey || !baseId) {
      throw new Error("AIRTABLE_API_KEY and AIRTABLE_BASE_ID environment variables are required");
    }

    // Initialize Airtable with the new Personal Access Token format
    this.base = new Airtable({
      apiKey: apiKey,
    }).base(baseId);
  }

  private convertAirtableRecord(
    record: any,
    type: "user" | "item" | "movement"
  ): User | Item | Movement {
    const fields = record.fields;

    switch (type) {
      case "user":
        // Combine address fields
        const streetAddress = fields["Street Address"] || "";
        const city = fields["City"] || "";
        const state = fields["State"] || "";
        const zip = fields["ZIP Code"] || "";
        const fullAddress =
          fields["Full Address"] ||
          `${streetAddress}${city ? `, ${city}` : ""}${state ? `, ${state}` : ""}${zip ? ` ${zip}` : ""}`.trim();

        return {
          id: record.id,
          email: fields["Email"] || "",
          passwordHash: fields["Password"] || "",
          firstName: fields["First Name"] || null,
          lastName: fields["Last Name"] || null,
          profileImageUrl: null, // Not in their schema
          phone: fields["Phone"] || null,
          address: fullAddress,
          city: city,
          state: state,
          zip: zip,
          plan: fields["Monthly Plan"] || "starter",
          setupFeePaid: fields["Setup Fee Paid"] === "Yes",
          stripeCustomerId: fields["Stripe Customer ID"] || null,
          stripeSubscriptionId: fields["Stripe Subscription ID"] || null,
          referralCode: fields["Referral Code"] || null,
          insuranceCoverage: fields["Total Insured Value"] || 2000,
          firstPickupDate: fields["First Pickup Date"]
            ? new Date(fields["First Pickup Date"])
            : null,
          preferredAuthMethod: "email", // Not in their schema, using default
          lastAuthMethod: "email", // Not in their schema, using default
          createdAt: fields["Account Created Date"]
            ? new Date(fields["Account Created Date"])
            : new Date(),
          updatedAt: new Date(), // Not in their schema
        } as User;

      case "item":
        // Extract the Customer ID - in Containers table it's a single string value
        const customerId = fields["Customer"];
        const userId = customerId || "";

        // Parse photos - now stored as comma-separated URLs in Long text field
        const photosField = fields["Additional Photos"] || "";
        const photoUrls =
          typeof photosField === "string" && photosField
            ? photosField
                .split(",")
                .map((url) => url.trim())
                .filter((url) => url)
            : [];

        return {
          id: record.id,
          userId: userId,
          name: fields["Item Name/Label"] || "",
          description: fields["Description"] || null,
          category: fields["Category Tags"] || "",
          estimatedValue: fields["Estimated Value"] || 0,
          photoUrls: photoUrls,
          coverPhotoIndex: 0, // Default to first photo
          qrCode: fields["QR String"] || "",
          status: fields["Current Status"] === "In Storage" ? "in_storage" : "at_home",
          length: 12, // Default values since not in their schema
          width: 12,
          height: 12,
          weight: 10,
          facility: fields["Current Location"] || null,
          zone: null, // Not in their schema
          rack: null, // Not in their schema
          shelf: null, // Not in their schema
          lastScannedAt: fields["Last Movement Date"]
            ? new Date(fields["Last Movement Date"])
            : null,
          createdAt: fields["Created Date"] ? new Date(fields["Created Date"]) : new Date(),
        } as Item;

      case "movement":
        // Extract the Customer ID from linked record
        const customerArray = fields["Customers"] || [];
        const movementUserId =
          Array.isArray(customerArray) && customerArray.length > 0 ? customerArray[0] : "";

        // Extract Container IDs from linked records
        const containerIds = fields["Containers"] || [];

        return {
          id: record.id,
          userId: movementUserId,
          type: fields["Movement Type"]?.includes("Delivery") ? "delivery" : "pickup",
          status: fields["Status"] || "scheduled",
          scheduledDate: fields["Requested Date"] ? new Date(fields["Requested Date"]) : new Date(),
          scheduledTimeSlot: fields["Time Window"] || "",
          itemIds: containerIds,
          address: fields["Service Address"] || "",
          specialInstructions: fields["Special Instructions"] || null,
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

    if (userData.email !== undefined) airtableData["Email"] = userData.email;
    if (userData.passwordHash !== undefined) airtableData["Password"] = userData.passwordHash;
    if (userData.firstName !== undefined) airtableData["First Name"] = userData.firstName;
    if (userData.lastName !== undefined) airtableData["Last Name"] = userData.lastName;
    if (userData.phone !== undefined) airtableData["Phone"] = userData.phone;
    // Address components
    if (userData.address !== undefined) airtableData["Street Address"] = userData.address;
    if (userData.city !== undefined) airtableData["City"] = userData.city;
    if (userData.state !== undefined) airtableData["State"] = userData.state;
    if (userData.zip !== undefined) airtableData["ZIP Code"] = userData.zip;
    if (userData.plan !== undefined) airtableData["Monthly Plan"] = userData.plan;
    // Setup Fee Paid is now a Single Select field in Airtable
    if (userData.setupFeePaid !== undefined) {
      airtableData["Setup Fee Paid"] = userData.setupFeePaid ? "Yes" : "No";
    }
    if (userData.referralCode !== undefined) airtableData["Referral Code"] = userData.referralCode;
    if (userData.stripeCustomerId !== undefined)
      airtableData["Stripe Customer ID"] = userData.stripeCustomerId;
    if (userData.stripeSubscriptionId !== undefined)
      airtableData["Stripe Subscription ID"] = userData.stripeSubscriptionId;
    if (userData.firstPickupDate !== undefined)
      airtableData["First Pickup Date"] = userData.firstPickupDate;
    if (userData.createdAt !== undefined) airtableData["Account Created Date"] = userData.createdAt;

    return airtableData;
  }

  private toAirtableItemFields(itemData: any): any {
    const airtableData: any = {};

    // Customer field expects a single record ID string (different from Customers field in Movements)
    if (itemData.userId !== undefined) airtableData["Customer"] = itemData.userId;
    if (itemData.name !== undefined) airtableData["Item Name/Label"] = itemData.name;
    if (itemData.description !== undefined) airtableData["Description"] = itemData.description;
    if (itemData.category !== undefined) airtableData["Category Tags"] = itemData.category;
    if (itemData.estimatedValue !== undefined) {
      // Airtable currency fields expect a number value
      airtableData["Estimated Value"] = Number(itemData.estimatedValue);
    }
    if (itemData.photoUrls !== undefined && itemData.photoUrls.length > 0) {
      // Store Dropbox URLs as comma-separated string in Long text field
      airtableData["Additional Photos"] = itemData.photoUrls.join(",");
    }
    // QR String is a computed field in Airtable - don't try to write to it
    if (itemData.status !== undefined)
      airtableData["Current Status"] = itemData.status === "in_storage" ? "In Storage" : "At Home";
    if (itemData.facility !== undefined) airtableData["Current Location"] = itemData.facility;
    if (itemData.lastScannedAt !== undefined)
      airtableData["Last Movement Date"] = itemData.lastScannedAt;
    if (itemData.createdAt !== undefined) airtableData["Created Date"] = itemData.createdAt;

    return airtableData;
  }

  private toAirtableMovementFields(movementData: any): any {
    const airtableData: any = {};

    // Customers field expects an array for linked records
    if (movementData.userId !== undefined) airtableData["Customers"] = [movementData.userId];
    if (movementData.type !== undefined) {
      // Movement Type uses specific values in Airtable
      airtableData["Movement Type"] =
        movementData.type === "delivery" ? "Delivery to Customer" : "Pickup from Customer";
    }
    // Status field - Airtable might have specific values, defaulting to 'Scheduled' for new movements
    if (movementData.status !== undefined) {
      // Map our status values to Airtable's expected values
      const statusMap: Record<string, string> = {
        scheduled: "Scheduled",
        completed: "Completed",
        cancelled: "Cancelled",
        in_progress: "In Progress",
      };
      airtableData["Status"] = statusMap[movementData.status] || "Scheduled";
    }
    // Format date properly for Airtable
    if (movementData.scheduledDate !== undefined) {
      const dateStr =
        typeof movementData.scheduledDate === "string"
          ? movementData.scheduledDate
          : movementData.scheduledDate.toISOString().split("T")[0]; // YYYY-MM-DD format
      airtableData["Requested Date"] = dateStr;
    }
    // Time Window field - Map our time slots to Airtable's expected values
    if (movementData.scheduledTimeSlot !== undefined) {
      // Handle both simple values and full time slot labels
      const timeSlotMap: Record<string, string> = {
        morning: "Morning (8am-12pm)",
        afternoon: "Afternoon (12pm-4pm)",
        evening: "Evening (4pm-8pm)",
        // Map full labels from SmartScheduler
        "8:00 AM - 12:00 PM": "Morning (8am-12pm)",
        "12:00 PM - 4:00 PM": "Afternoon (12pm-4pm)",
        "4:00 PM - 8:00 PM": "Evening (4pm-8pm)",
        "9:00 AM - 1:00 PM (Weekend)": "Morning (8am-12pm)",
      };
      // Use the time slot directly if not in map (for custom slots)
      airtableData["Time Window"] =
        timeSlotMap[movementData.scheduledTimeSlot] || movementData.scheduledTimeSlot;
    }
    // Ensure itemIds is always an array of strings
    if (movementData.itemIds !== undefined) {
      const itemIds = Array.isArray(movementData.itemIds) 
        ? movementData.itemIds 
        : typeof movementData.itemIds === 'string' 
          ? JSON.parse(movementData.itemIds)
          : [];
      airtableData["Containers"] = itemIds; // Linked records
    }
    // Service Address is a computed field in Airtable - do not try to write to it
    // The address comes from the linked Customer record automatically
    if (movementData.specialInstructions !== undefined)
      airtableData["Special Instructions"] = movementData.specialInstructions;

    return airtableData;
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    try {
      const record = await this.base(this.tables.users).find(id);
      return this.convertAirtableRecord(record, "user") as User;
    } catch (error) {
      if ((error as any).statusCode === 404) {
        return undefined;
      }
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const records = await this.base(this.tables.users)
        .select({
          filterByFormula: `{Email} = '${email}'`,
          maxRecords: 1,
        })
        .firstPage();

      if (records.length === 0) return undefined;
      return this.convertAirtableRecord(records[0], "user") as User;
    } catch (error) {
      console.error("Error getting user by email:", error);
      return undefined;
    }
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    try {
      // Try to find existing user
      const existingUser = await this.getUser(userData.id);

      if (existingUser) {
        // Update existing user
        const record = await this.base(this.tables.users).update(
          userData.id,
          this.toAirtableUserFields(userData)
        );
        return this.convertAirtableRecord(record, "user") as User;
      } else {
        // Create new user
        const record = await this.base(this.tables.users).create(
          this.toAirtableUserFields(userData)
        );
        return this.convertAirtableRecord(record, "user") as User;
      }
    } catch (error) {
      console.error("Error upserting user:", error);
      throw error;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const record = await this.base(this.tables.users).create(
        this.toAirtableUserFields(insertUser)
      );
      return this.convertAirtableRecord(record, "user") as User;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  async updateUser(id: string, userUpdate: Partial<User>): Promise<User> {
    try {
      const record = await this.base(this.tables.users).update(
        id,
        this.toAirtableUserFields(userUpdate)
      );
      return this.convertAirtableRecord(record, "user") as User;
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  }

  // Item operations
  async getUserItems(userId: string): Promise<Item[]> {
    try {
      const records = await this.base(this.tables.items)
        .select({
          filterByFormula: `SEARCH('${userId}', ARRAYJOIN({Customer}))`,
        })
        .all();

      return records.map((record: any) => this.convertAirtableRecord(record, "item") as Item);
    } catch (error) {
      console.error("Error getting user items:", error);
      return [];
    }
  }

  async getItem(id: string): Promise<Item | undefined> {
    try {
      const record = await this.base(this.tables.items).find(id);
      return this.convertAirtableRecord(record, "item") as Item;
    } catch (error) {
      if ((error as any).statusCode === 404) {
        return undefined;
      }
      throw error;
    }
  }

  async createItem(itemData: InsertItem & { userId: string }): Promise<Item> {
    try {
      // Generate QR code for our internal use, but don't send to Airtable (it's computed there)
      const qrCode = `SV${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

      // Create item in Airtable without qrCode
      const record = await this.base(this.tables.items).create(this.toAirtableItemFields(itemData));

      // Return the item with our generated qrCode
      const item = this.convertAirtableRecord(record, "item") as Item;
      return { ...item, qrCode };
    } catch (error) {
      console.error("Error creating item:", error);
      throw error;
    }
  }

  async updateItem(id: string, itemUpdate: Partial<Item>): Promise<Item> {
    try {
      const record = await this.base(this.tables.items).update(
        id,
        this.toAirtableItemFields(itemUpdate)
      );
      return this.convertAirtableRecord(record, "item") as Item;
    } catch (error) {
      console.error("Error updating item:", error);
      throw error;
    }
  }

  async deleteItem(id: string): Promise<void> {
    try {
      await this.base(this.tables.items).destroy(id);
    } catch (error) {
      console.error("Error deleting item:", error);
      throw error;
    }
  }

  // Movement operations
  async getUserMovements(userId: string): Promise<Movement[]> {
    try {
      console.log("Getting movements for user:", userId);

      // Get ALL movements for now to debug
      const allRecords = await this.base(this.tables.movements)
        .select({
          maxRecords: 100,
        })
        .all();

      console.log("Total movements in database:", allRecords.length);

      // Filter movements that belong to this user
      const userMovements = allRecords.filter((record: any) => {
        const customers = record.fields["Customers"] || [];
        return customers.includes(userId);
      });

      console.log(`Found ${userMovements.length} movements for user ${userId}`);

      const movements = userMovements.map(
        (record: any) => this.convertAirtableRecord(record, "movement") as Movement
      );
      console.log("Converted movements:", movements.length);

      return movements;
    } catch (error) {
      console.error("Error getting user movements:", error);
      return [];
    }
  }

  async createMovement(movementData: InsertMovement & { userId: string }): Promise<Movement> {
    try {
      console.log("Creating movement with data:", movementData);

      // Ensure scheduledDate is a Date object and format it properly
      const scheduledDate = movementData.scheduledDate instanceof Date 
        ? movementData.scheduledDate 
        : new Date(movementData.scheduledDate);
      
      const movementDataFormatted = {
        ...movementData,
        scheduledDate: scheduledDate.toISOString().split("T")[0], // YYYY-MM-DD format for Airtable
      };

      const airtableFields = this.toAirtableMovementFields(movementDataFormatted);
      console.log("Airtable fields to create:", airtableFields);

      const record = await this.base(this.tables.movements).create(airtableFields);
      console.log("Created record:", record.id, record.fields);

      return this.convertAirtableRecord(record, "movement") as Movement;
    } catch (error) {
      console.error("Error creating movement:", error);
      console.error("Movement data that failed:", movementData);
      throw error;
    }
  }

  async getMovement(id: string): Promise<Movement | undefined> {
    try {
      const record = await this.base(this.tables.movements).find(id);
      return this.convertAirtableRecord(record, "movement") as Movement;
    } catch (error) {
      console.error("Error getting movement:", error);
      return undefined;
    }
  }

  async updateMovement(id: string, movementUpdate: Partial<Movement>): Promise<Movement> {
    try {
      const updateData = { ...movementUpdate };
      if (updateData.scheduledDate) {
        updateData.scheduledDate = updateData.scheduledDate.toISOString() as any;
      }

      const record = await this.base(this.tables.movements).update(
        id,
        this.toAirtableMovementFields(updateData)
      );
      return this.convertAirtableRecord(record, "movement") as Movement;
    } catch (error) {
      console.error("Error updating movement:", error);
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
    await this.updateUser(userId, { passwordHash: hashedPassword });
  }
}

export const storage = new AirtableStorage();

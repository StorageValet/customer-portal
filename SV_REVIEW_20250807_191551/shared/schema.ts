import { z } from "zod";

// Base interfaces for data models
export interface User {
  id: string;
  email: string;
  passwordHash?: string;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  plan: string;
  setupFeePaid: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  referralCode: string | null;
  insuranceCoverage: number;
  firstPickupDate: Date | null;
  preferredAuthMethod: string;
  lastAuthMethod: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Item {
  id: string; // Changed from number to string for Airtable
  userId: string;
  name: string;
  description: string | null;
  category: string;
  estimatedValue: number;
  photoUrls: string[];
  coverPhotoIndex: number;
  qrCode: string;
  status: "at_home" | "in_storage";
  length: number;
  width: number;
  height: number;
  weight: number;
  facility: string | null;
  zone: string | null;
  rack: string | null;
  shelf: string | null;
  lastScannedAt: Date | null;
  createdAt: Date;
}

export interface Movement {
  id: string; // Changed from number to string for Airtable
  userId: string;
  type: "pickup" | "delivery";
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  scheduledDate: Date;
  scheduledTimeSlot: string;
  itemIds: string[]; // Changed from number[] to string[]
  address: string;
  specialInstructions: string | null;
  totalVolume: number | null;
  totalWeight: number | null;
  truckSize: string | null;
  estimatedDuration: number | null;
  createdAt: Date;
}

// Insert types for creating new records (omit auto-generated fields)
export type InsertUser = Omit<User, "id" | "createdAt" | "updatedAt"> & {
  id?: string;
};

export type UpsertUser = Partial<User> & {
  id: string;
  email: string;
};

export type InsertItem = Omit<Item, "id" | "createdAt"> & {
  userId: string;
};

export type InsertMovement = Omit<Movement, "id" | "createdAt"> & {
  userId: string;
};

// Zod validation schemas
export const insertUserSchema = z.object({
  email: z.string().email(),
  password: z.string().optional(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  profileImageUrl: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  plan: z.string().default("starter"),
  setupFeePaid: z.boolean().default(false),
  stripeCustomerId: z.string().nullable().optional(),
  stripeSubscriptionId: z.string().nullable().optional(),
  referralCode: z.string().nullable().optional(),
  insuranceCoverage: z.number().default(2000),
  firstPickupDate: z.date().nullable().optional(),
  preferredAuthMethod: z.string().default("email"),
  lastAuthMethod: z.string().default("email"),
});

export const insertItemSchema = z.object({
  userId: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  category: z.string(),
  estimatedValue: z.number(),
  photoUrls: z.array(z.string()).default([]),
  coverPhotoIndex: z.number().default(0),
  qrCode: z.string().optional(),
  status: z.enum(["at_home", "in_storage"]).default("at_home"),
  length: z.number().default(12),
  width: z.number().default(12),
  height: z.number().default(12),
  weight: z.number().default(10),
  facility: z.string().nullable().optional(),
  zone: z.string().nullable().optional(),
  rack: z.string().nullable().optional(),
  shelf: z.string().nullable().optional(),
  lastScannedAt: z.date().nullable().optional(),
});

export const insertMovementSchema = z.object({
  userId: z.string(),
  type: z.enum(["pickup", "delivery"]),
  status: z.enum(["scheduled", "in_progress", "completed", "cancelled"]).default("scheduled"),
  scheduledDate: z.date(),
  scheduledTimeSlot: z.string(),
  itemIds: z.array(z.string()),
  address: z.string(),
  specialInstructions: z.string().nullable().optional(),
  totalVolume: z.number().nullable().optional(),
  totalWeight: z.number().nullable().optional(),
  truckSize: z.string().nullable().optional(),
  estimatedDuration: z.number().nullable().optional(),
});

// Export insert types using z.infer
export type InsertUserType = z.infer<typeof insertUserSchema>;
export type InsertItemType = z.infer<typeof insertItemSchema>;
export type InsertMovementType = z.infer<typeof insertMovementSchema>;

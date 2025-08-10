import { apiRequest } from "./queryClient";

export interface Item {
  id: string;
  name: string;
  description?: string;
  category: string;
  estimatedValue: number;
  photoUrls: string[];
  coverPhotoIndex: number;
  qrCode: string;
  status: "at_home" | "in_storage";
  // Physical dimensions
  length: number; // inches
  width: number; // inches
  height: number; // inches
  weight: number; // pounds
  // Granular location tracking
  facility?: string;
  zone?: string;
  rack?: string;
  shelf?: string;
  lastScannedAt?: Date;
  createdAt: Date;
}

export interface Movement {
  id: string;
  userId: string;
  type: "pickup" | "delivery";
  scheduledDate: Date;
  scheduledTimeSlot: string;
  itemIds: string[];
  address: string;
  specialInstructions: string | null;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  // Calculated logistics data
  totalVolume: number | null; // cubic inches
  totalWeight: number | null; // pounds
  truckSize: string | null; // 'van', 'box_truck', 'large_truck'
  estimatedDuration: number | null; // minutes
  createdAt: Date;
}

export interface TimeSlot {
  id: string;
  label: string;
  available: boolean;
  truckSize?: string; // Required truck size for this slot
  maxVolume?: number; // Maximum volume capacity for this slot
}

export const api = {
  // Items
  getItems: async (): Promise<Item[]> => {
    const response = await apiRequest("GET", "/api/items");
    return response.json();
  },

  createItem: async (item: Omit<Item, "id" | "createdAt">): Promise<Item> => {
    const response = await apiRequest("POST", "/api/items", item);
    return response.json();
  },

  updateItem: async (id: string, item: Partial<Item>): Promise<Item> => {
    const response = await apiRequest("PUT", `/api/items/${id}`, item);
    return response.json();
  },

  deleteItem: async (id: string): Promise<void> => {
    await apiRequest("DELETE", `/api/items/${id}`);
  },

  bulkDeleteItems: async (
    itemIds: string[]
  ): Promise<{ message: string; deletedCount: number }> => {
    const response = await apiRequest("DELETE", "/api/items/bulk-delete", { itemIds });
    return response.json();
  },

  // Get available time slots based on selected items
  getTimeSlotsForItems: async (date: string, itemIds: string[]): Promise<TimeSlot[]> => {
    const response = await apiRequest("POST", `/api/movements/slots`, { date, itemIds });
    return response.json();
  },

  // Movements
  getMovements: async (): Promise<Movement[]> => {
    const response = await apiRequest("GET", "/api/movements");
    return response.json();
  },

  createMovement: async (movement: Omit<Movement, "id" | "createdAt">): Promise<Movement> => {
    const response = await apiRequest("POST", "/api/movements", movement);
    return response.json();
  },

  updateMovement: async (id: number, movement: Partial<Movement>): Promise<Movement> => {
    const response = await apiRequest("PUT", `/api/movements/${id}`, movement);
    return response.json();
  },

  getTimeSlots: async (date: string): Promise<TimeSlot[]> => {
    const response = await apiRequest("GET", `/api/movements/slots?date=${date}`);
    return response.json();
  },

  // Photo upload
  uploadPhoto: async (imageData: string, filename: string): Promise<{ photoUrl: string }> => {
    const response = await apiRequest("POST", "/api/upload", { imageData, filename });
    return response.json();
  },

  // Profile
  updateProfile: async (data: any): Promise<any> => {
    const response = await apiRequest("PUT", "/api/profile", data);
    return response.json();
  },
};

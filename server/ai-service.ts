import OpenAI from "openai";

export class AIService {
  private static instance: AIService;
  private openai: OpenAI;

  constructor() {
    // Initialize OpenAI with the API key
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  async getChatResponse(
    message: string,
    context: {
      userName?: string;
      userPlan?: string;
      currentPage?: string;
      itemCount?: number;
    }
  ): Promise<string> {
    try {
      if (!process.env.OPENAI_API_KEY) {
        console.warn("OPENAI_API_KEY not configured");
        return "AI assistant is temporarily unavailable. Please contact support at support@mystoragevalet.com";
      }

      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a helpful AI concierge for Storage Valet, a premium storage service. 
            You are speaking with an existing customer who is logged into their portal.
            
            Customer Context:
            - Name: ${context.userName || "Valued Customer"}
            - Plan: ${context.userPlan || "Unknown"} Plan
            - Current Page: ${context.currentPage || "Dashboard"}
            - Items in Storage: ${context.itemCount || 0}
            
            Your role:
            - Provide helpful, friendly support for Storage Valet customers
            - Answer questions about storage, pickup/delivery scheduling, inventory management
            - Guide customers through using the portal features
            - Be concise and professional, like a luxury concierge service
            - Remember they are already customers, so don't try to sell them on the service
            
            Key Information:
            - Plans: Starter ($199/mo), Medium ($299/mo), Family ($349/mo)
            - Setup fees: Starter $99.50, Medium $149.50, Family $174.50
            - Insurance coverage: Starter $2,000, Medium $3,000, Family $4,000
            - Service includes door-to-door pickup and delivery
            - All items are photographed and catalogued
            - Customers can schedule pickups/deliveries through the portal`,
          },
          {
            role: "user",
            content: message,
          },
        ],
        max_tokens: 300,
        temperature: 0.7,
      });

      return (
        response.choices[0].message.content ||
        "I apologize, I couldn't generate a response. Please try again."
      );
    } catch (error) {
      console.error("AI chat error:", error);
      return "I'm having trouble connecting right now. Please try again in a moment.";
    }
  }

  async categorizeItem(itemName: string, description?: string): Promise<string> {
    try {
      if (!process.env.OPENAI_API_KEY) {
        // Fallback to simple categorization
        return this.fallbackCategorization(itemName);
      }

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a categorization assistant. Given an item name and optional description, 
            return ONLY the most appropriate category from this list:
            - Furniture
            - Electronics
            - Clothing
            - Sports Equipment
            - Books & Media
            - Kitchen Items
            - Decorations
            - Documents
            - Toys & Games
            - Tools
            - Other
            
            Respond with only the category name, nothing else.`,
          },
          {
            role: "user",
            content: `Item: ${itemName}${description ? `\nDescription: ${description}` : ""}`,
          },
        ],
        max_tokens: 20,
        temperature: 0.3,
      });

      const category = response.choices[0].message.content?.trim() || "Other";
      return category;
    } catch (error) {
      console.error("AI categorization error:", error);
      return this.fallbackCategorization(itemName);
    }
  }

  private fallbackCategorization(itemName: string): string {
    const name = itemName.toLowerCase();

    if (
      name.includes("chair") ||
      name.includes("table") ||
      name.includes("sofa") ||
      name.includes("bed")
    ) {
      return "Furniture";
    } else if (
      name.includes("tv") ||
      name.includes("computer") ||
      name.includes("phone") ||
      name.includes("laptop")
    ) {
      return "Electronics";
    } else if (
      name.includes("shirt") ||
      name.includes("dress") ||
      name.includes("jacket") ||
      name.includes("clothes")
    ) {
      return "Clothing";
    } else if (
      name.includes("ball") ||
      name.includes("bike") ||
      name.includes("tennis") ||
      name.includes("golf")
    ) {
      return "Sports Equipment";
    } else if (
      name.includes("book") ||
      name.includes("dvd") ||
      name.includes("cd") ||
      name.includes("magazine")
    ) {
      return "Books & Media";
    } else if (
      name.includes("pot") ||
      name.includes("pan") ||
      name.includes("dishes") ||
      name.includes("kitchen")
    ) {
      return "Kitchen Items";
    } else if (
      name.includes("picture") ||
      name.includes("vase") ||
      name.includes("art") ||
      name.includes("decor")
    ) {
      return "Decorations";
    } else if (
      name.includes("file") ||
      name.includes("document") ||
      name.includes("paper") ||
      name.includes("folder")
    ) {
      return "Documents";
    } else if (
      name.includes("toy") ||
      name.includes("game") ||
      name.includes("puzzle") ||
      name.includes("lego")
    ) {
      return "Toys & Games";
    } else if (
      name.includes("drill") ||
      name.includes("hammer") ||
      name.includes("wrench") ||
      name.includes("tool")
    ) {
      return "Tools";
    }

    return "Other";
  }
}

export const aiService = AIService.getInstance();

import { Dropbox } from "dropbox";
import multer from "multer";
import { Request } from "express";

// Initialize Dropbox client
const dropbox = new Dropbox({
  accessToken: process.env.DROPBOX_ACCESS_TOKEN,
});

// Configure multer for memory storage
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit - increased for high-res photos
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

export interface UploadedFile {
  url: string;
  path: string;
  name: string;
  size: number;
}

export class DropboxService {
  private basePath = "/StorageValet";

  /**
   * Upload a file to Dropbox
   * @param file - The file to upload
   * @param customerId - The customer ID
   * @param itemId - The item ID (optional for movement photos)
   * @param movementId - The movement ID (optional for item photos)
   * @param type - Type of photo (item, pickup, delivery)
   */
  async uploadFile(
    file: Express.Multer.File,
    customerId: string,
    itemId?: string,
    movementId?: string,
    type: "item" | "pickup" | "delivery" = "item"
  ): Promise<UploadedFile> {
    try {
      // Construct the path based on the type
      let path: string;
      const timestamp = Date.now();
      const sanitizedFileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
      const fileName = `${timestamp}_${sanitizedFileName}`;

      if (type === "item" && itemId) {
        path = `${this.basePath}/users/${customerId}/items/${itemId}/${fileName}`;
      } else if (movementId) {
        const subFolder = type === "pickup" ? "pickup" : "delivery";
        path = `${this.basePath}/users/${customerId}/movements/${movementId}/${subFolder}/${fileName}`;
      } else {
        throw new Error("Either itemId or movementId must be provided");
      }

      // Upload to Dropbox
      const response = await dropbox.filesUpload({
        path,
        contents: file.buffer,
        mode: { ".tag": "overwrite" },
        autorename: true,
      });

      // Create a shared link for the file
      const sharedLinkResponse = await dropbox
        .sharingCreateSharedLinkWithSettings({
          path: response.result.path_display!,
          settings: {
            requested_visibility: { ".tag": "public" },
          },
        })
        .catch(async (error) => {
          // If link already exists, get existing link
          if (error.status === 409) {
            const links = await dropbox.sharingListSharedLinks({
              path: response.result.path_display!,
            });
            return { result: links.result.links[0] };
          }
          throw error;
        });

      // Convert sharing URL to direct download URL
      const directUrl = sharedLinkResponse.result.url.replace("?dl=0", "?raw=1");

      return {
        url: directUrl,
        path: response.result.path_display!,
        name: response.result.name,
        size: response.result.size,
      };
    } catch (error) {
      console.error("Dropbox upload error:", error);
      throw new Error("Failed to upload file to Dropbox");
    }
  }

  /**
   * Delete a file from Dropbox
   * @param path - The file path to delete
   */
  async deleteFile(path: string): Promise<void> {
    try {
      await dropbox.filesDeleteV2({ path });
    } catch (error) {
      console.error("Dropbox delete error:", error);
      throw new Error("Failed to delete file from Dropbox");
    }
  }

  /**
   * Get a temporary download link for a file
   * @param path - The file path
   */
  async getTemporaryLink(path: string): Promise<string> {
    try {
      const response = await dropbox.filesGetTemporaryLink({ path });
      return response.result.link;
    } catch (error) {
      console.error("Dropbox get link error:", error);
      throw new Error("Failed to get file link from Dropbox");
    }
  }

  /**
   * List files in a folder
   * @param folderPath - The folder path to list
   */
  async listFiles(folderPath: string): Promise<Array<{ name: string; path: string; url: string }>> {
    try {
      const response = await dropbox.filesListFolder({ path: folderPath });
      const files = [];

      for (const entry of response.result.entries) {
        if (entry[".tag"] === "file") {
          try {
            const sharedLink = await dropbox
              .sharingCreateSharedLinkWithSettings({
                path: entry.path_display!,
                settings: {
                  requested_visibility: { ".tag": "public" },
                },
              })
              .catch(async (error) => {
                if (error.status === 409) {
                  const links = await dropbox.sharingListSharedLinks({
                    path: entry.path_display!,
                  });
                  return { result: links.result.links[0] };
                }
                throw error;
              });

            files.push({
              name: entry.name,
              path: entry.path_display!,
              url: sharedLink.result.url.replace("?dl=0", "?raw=1"),
            });
          } catch (error) {
            console.error("Error creating shared link:", error);
          }
        }
      }

      return files;
    } catch (error) {
      console.error("Dropbox list files error:", error);
      return [];
    }
  }

  /**
   * Create folder structure for a new customer
   * @param customerId - The customer ID
   */
  async createCustomerFolders(customerId: string): Promise<void> {
    try {
      const folders = [
        `${this.basePath}/users/${customerId}`,
        `${this.basePath}/users/${customerId}/items`,
        `${this.basePath}/users/${customerId}/movements`,
      ];

      for (const folder of folders) {
        await dropbox.filesCreateFolderV2({ path: folder }).catch((error) => {
          // Ignore if folder already exists (409 is conflict/already exists)
          if (error.status !== 409) {
            console.error(`Failed to create folder ${folder}:`, error);
            throw error;
          }
          // Folder already exists, which is fine
          console.log(`Folder already exists: ${folder}`);
        });
      }
    } catch (error) {
      console.error("Error creating customer folders:", error);
      // Don't throw here - folder creation is not critical for upload
      // The upload will create folders as needed
      console.warn("Continuing despite folder creation error");
    }
  }
}

export const dropboxService = new DropboxService();

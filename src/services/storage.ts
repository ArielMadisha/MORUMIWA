// src/services/storage.ts
import fs from "fs";
import path from "path";

// Local storage directory
const UPLOAD_DIR = path.join(__dirname, "../../uploads");

/**
 * Save file locally
 */
export const saveFile = async (file: Express.Multer.File): Promise<string> => {
  try {
    const filePath = path.join(UPLOAD_DIR, file.filename);
    // File is already saved by multer, so just return path
    return filePath;
  } catch (err) {
    throw new Error("Failed to save file");
  }
};

/**
 * Get file URL (local or cloud)
 */
export const getFileUrl = (filename: string): string => {
  // For local dev, return relative path
  return `/uploads/${filename}`;
  // For cloud storage, replace with signed URL logic
};

/**
 * Delete file
 */
export const deleteFile = async (filename: string): Promise<void> => {
  try {
    const filePath = path.join(UPLOAD_DIR, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    throw new Error("Failed to delete file");
  }
};

import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import zlib from 'zlib';
import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

// Polyfill WebSocket for Node.js environments (required by @supabase/supabase-js on Node < 22)
if (typeof global.WebSocket === 'undefined') {
  (global as any).WebSocket = WebSocket;
}

// Initialize Supabase Client for Storage
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
  },
});

const BUCKET_NAME = 'documents';

/**
 * Compress the temp file and upload it to Supabase Storage.
 * Returns the Supabase path (e.g., `userId/filename.gz`).
 */
export const saveUploadedFile = async (
  tempPath: string,
  originalName: string,
  userId: string
): Promise<string> => {
  const ext = path.extname(originalName).toLowerCase();
  const safeName = `${uuidv4()}${ext}`;
  const supabasePath = `${userId}/${safeName}.gz`;

  try {
    // Read the uncompressed file
    const fileBuffer = fs.readFileSync(tempPath);

    // Compress using gzip
    console.log(`🗜️ Compressing file before upload...`);
    const compressedBuffer = zlib.gzipSync(fileBuffer);

    // Upload to Supabase Storage
    console.log(`☁️ Uploading compressed file to Supabase Storage: ${supabasePath}`);
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(supabasePath, compressedBuffer, {
        contentType: 'application/gzip',
        upsert: true,
      });

    if (error) {
      throw new Error(`Supabase upload failed: ${error.message}`);
    }

    return supabasePath;
  } finally {
    // Delete the local temp file to save disk space
    cleanupTempFile(tempPath);
  }
};

/**
 * Delete a file from Supabase Storage.
 */
export const deleteUploadedFile = async (supabasePath: string): Promise<void> => {
  try {
    console.log(`🗑️ Deleting file from Supabase Storage: ${supabasePath}`);
    const { error } = await supabase.storage.from(BUCKET_NAME).remove([supabasePath]);
    if (error) {
      console.error('Failed to delete file from Supabase:', error.message);
    }
  } catch (err) {
    console.error('Failed to delete file:', err);
  }
};

/**
 * Get a public URL or Signed URL for a stored file.
 * We'll use a short-lived Signed URL for security.
 */
export const getFileUrl = async (supabasePath: string): Promise<string> => {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(supabasePath, 3600); // 1 hour expiry

  if (error || !data) {
    throw new Error('Failed to generate signed URL');
  }
  return data.signedUrl;
};

/**
 * Download the compressed file from Supabase and decompress it.
 * Returns the uncompressed Buffer.
 */
export const downloadAndDecompressFile = async (supabasePath: string): Promise<Buffer> => {
  const { data, error } = await supabase.storage.from(BUCKET_NAME).download(supabasePath);
  
  if (error || !data) {
    throw new Error(`Failed to download file from Supabase: ${error?.message}`);
  }

  const arrayBuffer = await data.arrayBuffer();
  const compressedBuffer = Buffer.from(arrayBuffer);
  
  // Decompress
  const uncompressedBuffer = zlib.gunzipSync(compressedBuffer);
  return uncompressedBuffer;
};

/**
 * Clean up any temp files that might have been left from failed uploads.
 */
export const cleanupTempFile = (filePath: string): void => {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch {
    // Ignore cleanup errors
  }
};

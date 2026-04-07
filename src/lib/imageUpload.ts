import { supabase } from '@/db/supabase';

const MAX_FILE_SIZE = 1024 * 1024; // 1 MB
const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1080;
const COMPRESSION_QUALITY = 0.8;

interface CompressionResult {
  file: File;
  compressed: boolean;
  originalSize: number;
  finalSize: number;
}

/**
 * Compress image to WEBP format and ensure it's under 1MB
 */
export async function compressImage(file: File): Promise<CompressionResult> {
  const originalSize = file.size;

  // If file is already under 1MB, return as is
  if (originalSize <= MAX_FILE_SIZE) {
    return {
      file,
      compressed: false,
      originalSize,
      finalSize: originalSize,
    };
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Resize if dimensions exceed max
        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
          width = width * ratio;
          height = height * ratio;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Try different quality levels until file is under 1MB
        let quality = COMPRESSION_QUALITY;
        const tryCompress = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }

              if (blob.size <= MAX_FILE_SIZE || quality <= 0.1) {
                // Success or reached minimum quality
                const compressedFile = new File(
                  [blob],
                  file.name.replace(/\.[^.]+$/, '.webp'),
                  { type: 'image/webp' }
                );
                resolve({
                  file: compressedFile,
                  compressed: true,
                  originalSize,
                  finalSize: blob.size,
                });
              } else {
                // Try again with lower quality
                quality -= 0.1;
                tryCompress();
              }
            },
            'image/webp',
            quality
          );
        };

        tryCompress();
      };
      img.onerror = () => reject(new Error('Failed to load image'));
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
  });
}

/**
 * Validate file before upload
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload JPEG, PNG, WEBP, or GIF images.',
    };
  }

  // Check filename (only English letters and numbers)
  const filename = file.name.replace(/\.[^.]+$/, ''); // Remove extension
  if (!/^[a-zA-Z0-9_-]+$/.test(filename)) {
    return {
      valid: false,
      error: 'Filename must contain only English letters, numbers, hyphens, and underscores.',
    };
  }

  return { valid: true };
}

/**
 * Upload image to Supabase Storage
 */
export async function uploadImage(
  file: File,
  userId: string,
  folder: 'photos' | 'id_proofs'
): Promise<{ url: string; path: string }> {
  // Validate file
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Compress if needed
  const { file: processedFile, compressed, originalSize, finalSize } = await compressImage(file);

  // Generate unique filename
  const timestamp = Date.now();
  const sanitizedName = processedFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filename = `${timestamp}_${sanitizedName}`;
  const path = `${userId}/${folder}/${filename}`;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('app-83dmv202aiv5_bondhu_documents')
    .upload(path, processedFile, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('app-83dmv202aiv5_bondhu_documents')
    .getPublicUrl(path);

  // Log compression info if compressed
  if (compressed) {
    console.log(
      `Image compressed: ${(originalSize / 1024).toFixed(2)} KB → ${(finalSize / 1024).toFixed(2)} KB`
    );
  }

  return {
    url: urlData.publicUrl,
    path: data.path,
  };
}

/**
 * Delete image from Supabase Storage
 */
export async function deleteImage(path: string): Promise<void> {
  const { error } = await supabase.storage
    .from('app-83dmv202aiv5_bondhu_documents')
    .remove([path]);

  if (error) {
    throw new Error(`Delete failed: ${error.message}`);
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

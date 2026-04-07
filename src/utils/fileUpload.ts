import { supabase } from '@/db/supabase';
import { toast } from 'sonner';

const MAX_FILE_SIZE = 1024 * 1024; // 1MB
const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1080;
const QUALITY = 0.8;

export interface UploadProgress {
  progress: number;
  status: 'uploading' | 'compressing' | 'completed' | 'error';
  message: string;
}

export const validateFileName = (fileName: string): boolean => {
  const validPattern = /^[a-zA-Z0-9._-]+$/;
  return validPattern.test(fileName);
};

export const sanitizeFileName = (fileName: string): string => {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
};

export const compressImage = async (
  file: File,
  maxWidth: number = MAX_WIDTH,
  maxHeight: number = MAX_HEIGHT,
  quality: number = QUALITY
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/webp',
          quality
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
  });
};

export const compressImageIteratively = async (
  file: File,
  targetSize: number = MAX_FILE_SIZE
): Promise<{ blob: Blob; compressed: boolean; originalSize: number; finalSize: number }> => {
  const originalSize = file.size;

  if (originalSize <= targetSize) {
    return {
      blob: file,
      compressed: false,
      originalSize,
      finalSize: originalSize
    };
  }

  let quality = QUALITY;
  let compressed = await compressImage(file, MAX_WIDTH, MAX_HEIGHT, quality);

  while (compressed.size > targetSize && quality > 0.1) {
    quality -= 0.1;
    compressed = await compressImage(file, MAX_WIDTH, MAX_HEIGHT, quality);
  }

  return {
    blob: compressed,
    compressed: true,
    originalSize,
    finalSize: compressed.size
  };
};

export const uploadDocument = async (
  file: File,
  userId: string,
  documentType: 'college_id' | 'photo' | 'aadhaar',
  onProgress?: (progress: UploadProgress) => void
): Promise<string> => {
  try {
    const fileName = file.name;
    if (!validateFileName(fileName)) {
      const sanitized = sanitizeFileName(fileName);
      toast.warning(`Filename contains invalid characters. Using: ${sanitized}`);
    }

    const safeFileName = sanitizeFileName(fileName);
    const fileExtension = safeFileName.split('.').pop();
    const timestamp = Date.now();
    const uniqueFileName = `${documentType}_${timestamp}.${fileExtension}`;

    onProgress?.({
      progress: 10,
      status: 'compressing',
      message: 'Checking file size...'
    });

    let fileToUpload: Blob = file;
    let wasCompressed = false;
    let finalSize = file.size;

    if (file.type.startsWith('image/')) {
      onProgress?.({
        progress: 20,
        status: 'compressing',
        message: 'Compressing image...'
      });

      const result = await compressImageIteratively(file);
      fileToUpload = result.blob;
      wasCompressed = result.compressed;
      finalSize = result.finalSize;

      if (wasCompressed) {
        const sizeMB = (finalSize / (1024 * 1024)).toFixed(2);
        toast.success(`Image compressed to ${sizeMB}MB`);
      }
    }

    onProgress?.({
      progress: 50,
      status: 'uploading',
      message: 'Uploading file...'
    });

    const filePath = `${userId}/${uniqueFileName}`;
    const { data, error } = await supabase.storage
      .from('bondhu_documents')
      .upload(filePath, fileToUpload, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      throw error;
    }

    onProgress?.({
      progress: 90,
      status: 'uploading',
      message: 'Getting file URL...'
    });

    const { data: urlData } = supabase.storage
      .from('bondhu_documents')
      .getPublicUrl(data.path);

    onProgress?.({
      progress: 100,
      status: 'completed',
      message: 'Upload completed!'
    });

    return urlData.publicUrl;
  } catch (error) {
    onProgress?.({
      progress: 0,
      status: 'error',
      message: error instanceof Error ? error.message : 'Upload failed'
    });
    throw error;
  }
};

export const deleteDocument = async (filePath: string): Promise<void> => {
  const { error } = await supabase.storage
    .from('bondhu_documents')
    .remove([filePath]);

  if (error) {
    throw error;
  }
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

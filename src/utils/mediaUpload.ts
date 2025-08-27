import { supabase } from '@/integrations/supabase/client';

export interface MediaUploadResult {
  url: string;
  path: string;
  type: 'image' | 'video' | 'audio' | 'voice' | 'file';
}

export interface MediaUploadProgress {
  progress: number;
  stage: 'compressing' | 'uploading' | 'complete' | 'error';
}

/**
 * Upload media files to Supabase storage with compression and validation
 */
export class MediaUploadService {
  private static readonly MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
  private static readonly MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
  private static readonly MAX_AUDIO_SIZE = 50 * 1024 * 1024; // 50MB
  private static readonly IMAGE_QUALITY = 0.8;
  private static readonly MAX_IMAGE_DIMENSION = 1920;

  /**
   * Upload an image file with automatic compression
   */
  static async uploadImage(
    file: File, 
    onProgress?: (progress: MediaUploadProgress) => void
  ): Promise<MediaUploadResult> {
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    try {
      onProgress?.({ progress: 0, stage: 'compressing' });

      // Compress image if needed
      const compressedFile = await this.compressImage(file);
      
      onProgress?.({ progress: 50, stage: 'uploading' });

      // Upload to Supabase storage
      const fileName = `images/${Date.now()}-${Math.random().toString(36).substring(2)}.${this.getFileExtension(compressedFile)}`;
      
      const { data, error } = await supabase.storage
        .from('media')
        .upload(fileName, compressedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('media')
        .getPublicUrl(fileName);

      onProgress?.({ progress: 100, stage: 'complete' });

      return {
        url: urlData.publicUrl,
        path: fileName,
        type: 'image',
      };
    } catch (error) {
      onProgress?.({ progress: 0, stage: 'error' });
      throw error;
    }
  }

  /**
   * Upload a video file with validation
   */
  static async uploadVideo(
    file: File, 
    onProgress?: (progress: MediaUploadProgress) => void
  ): Promise<MediaUploadResult> {
    if (!file.type.startsWith('video/')) {
      throw new Error('File must be a video');
    }

    if (file.size > this.MAX_VIDEO_SIZE) {
      throw new Error('Video file is too large. Maximum size is 100MB.');
    }

    try {
      onProgress?.({ progress: 0, stage: 'uploading' });

      const fileName = `videos/${Date.now()}-${Math.random().toString(36).substring(2)}.${this.getFileExtension(file)}`;
      
      const { data, error } = await supabase.storage
        .from('media')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('media')
        .getPublicUrl(fileName);

      onProgress?.({ progress: 100, stage: 'complete' });

      return {
        url: urlData.publicUrl,
        path: fileName,
        type: 'video',
      };
    } catch (error) {
      onProgress?.({ progress: 0, stage: 'error' });
      throw error;
    }
  }

  /**
   * Upload an audio/voice file
   */
  static async uploadAudio(
    file: File, 
    isVoiceMessage: boolean = false,
    onProgress?: (progress: MediaUploadProgress) => void
  ): Promise<MediaUploadResult> {
    if (!file.type.startsWith('audio/')) {
      throw new Error('File must be an audio file');
    }

    if (file.size > this.MAX_AUDIO_SIZE) {
      throw new Error('Audio file is too large. Maximum size is 50MB.');
    }

    try {
      onProgress?.({ progress: 0, stage: 'uploading' });

      const folder = isVoiceMessage ? 'voice' : 'audio';
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}.${this.getFileExtension(file)}`;
      
      const { data, error } = await supabase.storage
        .from('media')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('media')
        .getPublicUrl(fileName);

      onProgress?.({ progress: 100, stage: 'complete' });

      return {
        url: urlData.publicUrl,
        path: fileName,
        type: isVoiceMessage ? 'voice' : 'audio',
      };
    } catch (error) {
      onProgress?.({ progress: 0, stage: 'error' });
      throw error;
    }
  }

  /**
   * Upload any file type
   */
  static async uploadFile(
    file: File,
    onProgress?: (progress: MediaUploadProgress) => void
  ): Promise<MediaUploadResult> {
    // Route to specific upload method based on file type
    if (file.type.startsWith('image/')) {
      return this.uploadImage(file, onProgress);
    } else if (file.type.startsWith('video/')) {
      return this.uploadVideo(file, onProgress);
    } else if (file.type.startsWith('audio/')) {
      return this.uploadAudio(file, false, onProgress);
    } else {
      // Generic file upload
      try {
        onProgress?.({ progress: 0, stage: 'uploading' });

        const fileName = `files/${Date.now()}-${Math.random().toString(36).substring(2)}.${this.getFileExtension(file)}`;
        
        const { data, error } = await supabase.storage
          .from('media')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (error) throw error;

        const { data: urlData } = supabase.storage
          .from('media')
          .getPublicUrl(fileName);

        onProgress?.({ progress: 100, stage: 'complete' });

        return {
          url: urlData.publicUrl,
          path: fileName,
          type: 'file',
        };
      } catch (error) {
        onProgress?.({ progress: 0, stage: 'error' });
        throw error;
      }
    }
  }

  /**
   * Compress an image file
   */
  private static async compressImage(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        try {
          // Calculate new dimensions while maintaining aspect ratio
          let { width, height } = this.calculateDimensions(
            img.width, 
            img.height, 
            this.MAX_IMAGE_DIMENSION
          );

          canvas.width = width;
          canvas.height = height;

          // Draw and compress image
          ctx?.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }

              // If compressed file is larger, use original
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });

              resolve(compressedFile.size < file.size ? compressedFile : file);
            },
            file.type,
            this.IMAGE_QUALITY
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Calculate new dimensions while maintaining aspect ratio
   */
  private static calculateDimensions(
    originalWidth: number, 
    originalHeight: number, 
    maxDimension: number
  ): { width: number; height: number } {
    if (originalWidth <= maxDimension && originalHeight <= maxDimension) {
      return { width: originalWidth, height: originalHeight };
    }

    const ratio = originalWidth / originalHeight;
    
    if (originalWidth > originalHeight) {
      return {
        width: maxDimension,
        height: Math.round(maxDimension / ratio),
      };
    } else {
      return {
        width: Math.round(maxDimension * ratio),
        height: maxDimension,
      };
    }
  }

  /**
   * Get file extension from file name or type
   */
  private static getFileExtension(file: File): string {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension) return extension;

    // Fallback to mime type
    const mimeToExt: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'video/mp4': 'mp4',
      'video/webm': 'webm',
      'audio/mp3': 'mp3',
      'audio/wav': 'wav',
      'audio/webm': 'webm',
    };

    return mimeToExt[file.type] || 'bin';
  }

  /**
   * Delete a file from storage
   */
  static async deleteFile(path: string): Promise<void> {
    const { error } = await supabase.storage
      .from('media')
      .remove([path]);

    if (error) throw error;
  }

  /**
   * Validate file type and size
   */
  static validateFile(file: File, allowedTypes: string[] = []): void {
    if (allowedTypes.length > 0) {
      const isAllowed = allowedTypes.some(type => file.type.startsWith(type));
      if (!isAllowed) {
        throw new Error(`File type ${file.type} is not allowed`);
      }
    }

    // Check size limits based on type
    if (file.type.startsWith('image/') && file.size > this.MAX_IMAGE_SIZE) {
      throw new Error('Image file is too large. Maximum size is 5MB.');
    } else if (file.type.startsWith('video/') && file.size > this.MAX_VIDEO_SIZE) {
      throw new Error('Video file is too large. Maximum size is 100MB.');
    } else if (file.type.startsWith('audio/') && file.size > this.MAX_AUDIO_SIZE) {
      throw new Error('Audio file is too large. Maximum size is 50MB.');
    }
  }
}
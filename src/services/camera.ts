import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { PlatformService } from './platform';

export interface CameraOptions {
  quality?: number;
  allowEditing?: boolean;
  resultType?: 'base64' | 'uri' | 'dataUrl';
  source?: 'camera' | 'photos' | 'prompt';
  width?: number;
  height?: number;
  correctOrientation?: boolean;
}

export interface CameraPhoto {
  base64String?: string;
  dataUrl?: string;
  path?: string;
  webPath?: string;
  format: string;
}

export class CameraService {
  static async getPhoto(options?: CameraOptions): Promise<CameraPhoto> {
    try {
      if (PlatformService.isNative()) {
        // Check permissions first
        const permissions = await Camera.checkPermissions();
        if (permissions.camera !== 'granted' || permissions.photos !== 'granted') {
          const requestResult = await Camera.requestPermissions();
          if (requestResult.camera !== 'granted') {
            throw new Error('Camera permission denied');
          }
        }

        const photo = await Camera.getPhoto({
          quality: options?.quality ?? 90,
          allowEditing: options?.allowEditing ?? false,
          resultType: this.mapResultType(options?.resultType ?? 'uri'),
          source: this.mapSource(options?.source ?? 'prompt'),
          width: options?.width,
          height: options?.height,
          correctOrientation: options?.correctOrientation ?? true
        });

        return {
          base64String: photo.base64String,
          dataUrl: photo.dataUrl,
          path: photo.path,
          webPath: photo.webPath,
          format: photo.format
        };
      } else {
        // Fallback for web - create file input
        return new Promise((resolve, reject) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.capture = options?.source === 'camera' ? 'environment' : undefined;
          
          input.onchange = (event) => {
            const file = (event.target as HTMLInputElement).files?.[0];
            if (!file) {
              reject(new Error('No file selected'));
              return;
            }

            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              resolve({
                dataUrl: result,
                webPath: URL.createObjectURL(file),
                format: file.type.split('/')[1] || 'jpeg'
              });
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
          };

          input.click();
        });
      }
    } catch (error) {
      console.error('CameraService error:', error);
      throw error;
    }
  }

  static async pickImages(options?: { multiple?: boolean }): Promise<CameraPhoto[]> {
    try {
      if (PlatformService.isNative()) {
        const photo = await this.getPhoto({
          source: 'photos',
          resultType: 'uri'
        });
        return [photo];
      } else {
        // Web fallback
        return new Promise((resolve, reject) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.multiple = options?.multiple ?? false;
          
          input.onchange = async (event) => {
            const files = Array.from((event.target as HTMLInputElement).files || []);
            if (files.length === 0) {
              reject(new Error('No files selected'));
              return;
            }

            const photos: CameraPhoto[] = [];
            for (const file of files) {
              const dataUrl = await this.fileToDataUrl(file);
              photos.push({
                dataUrl,
                webPath: URL.createObjectURL(file),
                format: file.type.split('/')[1] || 'jpeg'
              });
            }
            resolve(photos);
          };

          input.click();
        });
      }
    } catch (error) {
      console.error('CameraService pickImages error:', error);
      throw error;
    }
  }

  private static mapResultType(type: string): CameraResultType {
    switch (type) {
      case 'base64':
        return CameraResultType.Base64;
      case 'dataUrl':
        return CameraResultType.DataUrl;
      case 'uri':
      default:
        return CameraResultType.Uri;
    }
  }

  private static mapSource(source: string): CameraSource {
    switch (source) {
      case 'camera':
        return CameraSource.Camera;
      case 'photos':
        return CameraSource.Photos;
      case 'prompt':
      default:
        return CameraSource.Prompt;
    }
  }

  private static fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}
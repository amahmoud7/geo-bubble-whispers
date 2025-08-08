import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { PlatformService } from './platform';

export interface FileInfo {
  name: string;
  path: string;
  size?: number;
  mtime?: number;
  ctime?: number;
  type: 'file' | 'directory';
}

export interface WriteFileOptions {
  path: string;
  data: string;
  directory?: 'documents' | 'data' | 'cache' | 'external';
  encoding?: 'utf8' | 'ascii' | 'utf16';
  recursive?: boolean;
}

export interface ReadFileOptions {
  path: string;
  directory?: 'documents' | 'data' | 'cache' | 'external';
  encoding?: 'utf8' | 'ascii' | 'utf16';
}

export class FilesystemService {
  static async writeFile(options: WriteFileOptions): Promise<void> {
    try {
      if (PlatformService.isNative()) {
        await Filesystem.writeFile({
          path: options.path,
          data: options.data,
          directory: this.mapDirectory(options.directory ?? 'documents'),
          encoding: this.mapEncoding(options.encoding ?? 'utf8'),
          recursive: options.recursive ?? true
        });
      } else {
        // Web fallback - use localStorage or IndexedDB
        const key = `${options.directory ?? 'documents'}/${options.path}`;
        localStorage.setItem(key, options.data);
      }
    } catch (error) {
      console.error('FilesystemService writeFile error:', error);
      throw error;
    }
  }

  static async readFile(options: ReadFileOptions): Promise<string> {
    try {
      if (PlatformService.isNative()) {
        const result = await Filesystem.readFile({
          path: options.path,
          directory: this.mapDirectory(options.directory ?? 'documents'),
          encoding: this.mapEncoding(options.encoding ?? 'utf8')
        });
        return result.data as string;
      } else {
        // Web fallback
        const key = `${options.directory ?? 'documents'}/${options.path}`;
        const data = localStorage.getItem(key);
        if (data === null) {
          throw new Error(`File not found: ${key}`);
        }
        return data;
      }
    } catch (error) {
      console.error('FilesystemService readFile error:', error);
      throw error;
    }
  }

  static async deleteFile(path: string, directory?: string): Promise<void> {
    try {
      if (PlatformService.isNative()) {
        await Filesystem.deleteFile({
          path,
          directory: this.mapDirectory(directory ?? 'documents')
        });
      } else {
        const key = `${directory ?? 'documents'}/${path}`;
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.error('FilesystemService deleteFile error:', error);
      throw error;
    }
  }

  static async mkdir(path: string, directory?: string, recursive: boolean = true): Promise<void> {
    try {
      if (PlatformService.isNative()) {
        await Filesystem.mkdir({
          path,
          directory: this.mapDirectory(directory ?? 'documents'),
          recursive
        });
      } else {
        // Web fallback - directories don't exist in localStorage
        console.log(`Web: Creating directory ${path} (no-op)`);
      }
    } catch (error) {
      console.error('FilesystemService mkdir error:', error);
      throw error;
    }
  }

  static async readdir(path: string, directory?: string): Promise<FileInfo[]> {
    try {
      if (PlatformService.isNative()) {
        const result = await Filesystem.readdir({
          path,
          directory: this.mapDirectory(directory ?? 'documents')
        });
        
        return result.files.map(file => ({
          name: file.name,
          path: `${path}/${file.name}`,
          size: file.size,
          mtime: file.mtime,
          ctime: file.ctime,
          type: file.type as 'file' | 'directory'
        }));
      } else {
        // Web fallback - list localStorage keys
        const prefix = `${directory ?? 'documents'}/${path}/`;
        const files: FileInfo[] = [];
        
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(prefix)) {
            const relativePath = key.substring(prefix.length);
            const name = relativePath.split('/')[0];
            if (name && !files.some(f => f.name === name)) {
              files.push({
                name,
                path: `${path}/${name}`,
                type: 'file'
              });
            }
          }
        }
        
        return files;
      }
    } catch (error) {
      console.error('FilesystemService readdir error:', error);
      throw error;
    }
  }

  static async exists(path: string, directory?: string): Promise<boolean> {
    try {
      if (PlatformService.isNative()) {
        const result = await Filesystem.stat({
          path,
          directory: this.mapDirectory(directory ?? 'documents')
        });
        return !!result;
      } else {
        const key = `${directory ?? 'documents'}/${path}`;
        return localStorage.getItem(key) !== null;
      }
    } catch (error) {
      return false;
    }
  }

  static async savePhoto(base64Data: string, filename: string): Promise<string> {
    try {
      const directory = 'documents';
      const path = `photos/${filename}`;
      
      await this.mkdir('photos', directory);
      await this.writeFile({
        path,
        data: base64Data,
        directory,
        encoding: 'utf8'
      });
      
      return path;
    } catch (error) {
      console.error('FilesystemService savePhoto error:', error);
      throw error;
    }
  }

  private static mapDirectory(directory: string): Directory {
    switch (directory) {
      case 'data':
        return Directory.Data;
      case 'cache':
        return Directory.Cache;
      case 'external':
        return Directory.External;
      case 'documents':
      default:
        return Directory.Documents;
    }
  }

  private static mapEncoding(encoding: string): Encoding {
    switch (encoding) {
      case 'ascii':
        return Encoding.ASCII;
      case 'utf16':
        return Encoding.UTF16;
      case 'utf8':
      default:
        return Encoding.UTF8;
    }
  }
}
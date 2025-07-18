import { GLTFFile } from '@/types/audio';

// Supported glTF file formats
export const SUPPORTED_GLTF_FORMATS = [
  'model/gltf+json',
  'model/gltf-binary',
  'application/octet-stream'
];

// File size limit for glTF (100MB)
export const MAX_GLTF_FILE_SIZE = 100 * 1024 * 1024;

export class GLTFUtils {
  /**
   * Validates if the file is a supported glTF format
   */
  static isValidGLTFFile(file: File): boolean {
    return SUPPORTED_GLTF_FORMATS.includes(file.type) || 
           this.isValidGLTFExtension(file.name);
  }

  /**
   * Validates glTF file by extension (fallback for when MIME type is not available)
   */
  static isValidGLTFExtension(filename: string): boolean {
    const extension = filename.toLowerCase().split('.').pop();
    return ['gltf', 'glb'].includes(extension || '');
  }

  /**
   * Validates file size
   */
  static isValidFileSize(file: File): boolean {
    return file.size <= MAX_GLTF_FILE_SIZE;
  }

  /**
   * Creates a GLTFFile object from a File
   */
  static async createGLTFFile(file: File): Promise<GLTFFile> {
    if (!this.isValidGLTFFile(file)) {
      throw new Error('Unsupported glTF format. Please upload a .gltf or .glb file.');
    }

    if (!this.isValidFileSize(file)) {
      throw new Error(`File size exceeds ${MAX_GLTF_FILE_SIZE / (1024 * 1024)}MB limit`);
    }

    try {
      const url = URL.createObjectURL(file);

      return {
        file,
        name: file.name,
        size: file.size,
        format: file.type || this.getFormatFromExtension(file.name),
        url
      };
    } catch (error) {
      throw new Error(`Failed to process glTF file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Gets format from file extension
   */
  static getFormatFromExtension(filename: string): string {
    const extension = filename.toLowerCase().split('.').pop();
    const formatMap: Record<string, string> = {
      'gltf': 'model/gltf+json',
      'glb': 'model/gltf-binary'
    };
    return formatMap[extension || ''] || 'model/unknown';
  }

  /**
   * Formats file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
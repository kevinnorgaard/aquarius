import { AudioFile, MicrophoneConfig } from '@/types/audio';

// Supported audio file formats
export const SUPPORTED_AUDIO_FORMATS = [
  'audio/mp3',
  'audio/mpeg',
  'audio/wav',
  'audio/wave',
  'audio/ogg',
  'audio/m4a',
  'audio/mp4',
  'audio/aac'
];

// File size limit (50MB)
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

export class AudioUtils {
  /**
   * Validates if the file is a supported audio format
   */
  static isValidAudioFile(file: File): boolean {
    return SUPPORTED_AUDIO_FORMATS.includes(file.type) || 
           this.isValidAudioExtension(file.name);
  }

  /**
   * Validates audio file by extension (fallback for when MIME type is not available)
   */
  static isValidAudioExtension(filename: string): boolean {
    const extension = filename.toLowerCase().split('.').pop();
    return ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'mp4'].includes(extension || '');
  }

  /**
   * Validates file size
   */
  static isValidFileSize(file: File): boolean {
    return file.size <= MAX_FILE_SIZE;
  }

  /**
   * Gets the duration of an audio file
   */
  static async getAudioDuration(file: File): Promise<number> {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      const url = URL.createObjectURL(file);
      
      audio.addEventListener('loadedmetadata', () => {
        URL.revokeObjectURL(url);
        resolve(audio.duration);
      });
      
      audio.addEventListener('error', () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load audio metadata'));
      });
      
      audio.src = url;
    });
  }

  /**
   * Creates an AudioFile object from a File
   */
  static async createAudioFile(file: File): Promise<AudioFile> {
    if (!this.isValidAudioFile(file)) {
      throw new Error('Unsupported audio format');
    }

    if (!this.isValidFileSize(file)) {
      throw new Error(`File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`);
    }

    try {
      const duration = await this.getAudioDuration(file);
      const url = URL.createObjectURL(file);

      return {
        file,
        name: file.name,
        size: file.size,
        duration,
        format: file.type || this.getFormatFromExtension(file.name),
        url
      };
    } catch (error) {
      throw new Error(`Failed to process audio file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Gets format from file extension
   */
  static getFormatFromExtension(filename: string): string {
    const extension = filename.toLowerCase().split('.').pop();
    const formatMap: Record<string, string> = {
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'ogg': 'audio/ogg',
      'm4a': 'audio/m4a',
      'aac': 'audio/aac',
      'mp4': 'audio/mp4'
    };
    return formatMap[extension || ''] || 'audio/unknown';
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

  /**
   * Formats duration for display
   */
  static formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Creates an audio context with optimal settings
   */
  static createAudioContext(): AudioContext {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    return new AudioContextClass({
      sampleRate: 44100,
      latencyHint: 'interactive'
    });
  }

  /**
   * Gets default microphone configuration
   */
  static getDefaultMicrophoneConfig(): MicrophoneConfig {
    return {
      sampleRate: 44100,
      channelCount: 1,
      echoCancellation: true,
      noiseSuppression: true
    };
  }

  /**
   * Checks if microphone is available
   */
  static async isMicrophoneAvailable(): Promise<boolean> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.some(device => device.kind === 'audioinput');
    } catch {
      return false;
    }
  }

  /**
   * Requests microphone access
   */
  static async requestMicrophoneAccess(config: MicrophoneConfig): Promise<MediaStream> {
    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: config.sampleRate,
          channelCount: config.channelCount,
          echoCancellation: config.echoCancellation,
          noiseSuppression: config.noiseSuppression
        }
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          throw new Error('Microphone access denied. Please allow microphone access and try again.');
        } else if (error.name === 'NotFoundError') {
          throw new Error('No microphone found. Please connect a microphone and try again.');
        } else if (error.name === 'NotSupportedError') {
          throw new Error('Microphone access is not supported in this browser.');
        }
      }
      throw new Error('Failed to access microphone');
    }
  }

  /**
   * Analyzes audio and returns visualization data
   */
  static analyzeAudio(analyser: AnalyserNode): { frequencyData: Uint8Array; timeData: Uint8Array; volume: number; lowFrequencyAverage: number; highFrequencyAverage: number } {
    const frequencyData = new Uint8Array(analyser.frequencyBinCount);
    const timeData = new Uint8Array(analyser.fftSize);
    
    analyser.getByteFrequencyData(frequencyData);
    analyser.getByteTimeDomainData(timeData);
    
    // Calculate volume (RMS)
    let sum = 0;
    for (let i = 0; i < timeData.length; i++) {
      const normalized = (timeData[i] - 128) / 128;
      sum += normalized * normalized;
    }
    const volume = Math.sqrt(sum / timeData.length);
    
    // Calculate low frequency average (0 - 33% of frequency range)
    const lowFreqEnd = Math.floor(frequencyData.length / 3);
    let lowFreqSum = 0;
    for (let i = 0; i < lowFreqEnd; i++) {
      lowFreqSum += frequencyData[i];
    }
    const lowFrequencyAverage = lowFreqSum / lowFreqEnd / 255; // Normalize to 0-1
    
    // Calculate high frequency average (67% - 100% of frequency range)
    const highFreqStart = Math.floor((frequencyData.length * 2) / 3);
    let highFreqSum = 0;
    for (let i = highFreqStart; i < frequencyData.length; i++) {
      highFreqSum += frequencyData[i];
    }
    const highFrequencyAverage = highFreqSum / (frequencyData.length - highFreqStart) / 255; // Normalize to 0-1
    
    return { frequencyData, timeData, volume, lowFrequencyAverage, highFrequencyAverage };
  }
}
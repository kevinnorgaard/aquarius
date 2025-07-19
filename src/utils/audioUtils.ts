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
  // Enhanced BPM Detection state
  private static bpmDetectionState: {
    onsetHistory: number[];
    lastOnsetTime: number;
    bpmHistory: number[];
    lastBeatTime: number;
    spectralFluxHistory: number[];
    previousSpectrum: Float32Array | null;
    ioiHistogram: Map<number, number>;
    autocorrelationHistory: number[];
    confidenceHistory: number[];
  } = {
    onsetHistory: [],
    lastOnsetTime: 0,
    bpmHistory: [],
    lastBeatTime: 0,
    spectralFluxHistory: [],
    previousSpectrum: null,
    ioiHistogram: new Map(),
    autocorrelationHistory: [],
    confidenceHistory: []
  };

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
  static analyzeAudio(analyser: AnalyserNode): { frequencyData: Uint8Array; timeData: Uint8Array; volume: number; lowFrequencyAverage: number; highFrequencyAverage: number; bpm: number; beatIntensity: number } {
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
    
    // Detect BPM and beat intensity
    const bpmData = this.detectBPM(frequencyData, lowFrequencyAverage);
    
    return { 
      frequencyData, 
      timeData, 
      volume, 
      lowFrequencyAverage, 
      highFrequencyAverage,
      bpm: bpmData.bpm,
      beatIntensity: bpmData.beatIntensity
    };
  }

  /**
   * Detects BPM using onset detection combined with IOI histogram and autocorrelation
   * Enhanced algorithm for improved accuracy and stability
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static detectBPM(frequencyData: Uint8Array, _lowFrequencyAverage: number): { bpm: number; beatIntensity: number } {
    const currentTime = Date.now();
    
    // Convert Uint8Array to Float32Array for better precision in calculations
    const spectrum = new Float32Array(frequencyData.length);
    for (let i = 0; i < frequencyData.length; i++) {
      spectrum[i] = frequencyData[i] / 255.0;
    }
    
    // Step 1: Onset detection using spectral flux
    const onsetData = this.detectOnsets(spectrum, currentTime);
    
    // Step 2: Update IOI histogram when new onset is detected
    if (onsetData.onsetStrength > 0.1) { // Only process significant onsets
      this.updateIOIHistogram(currentTime);
    }
    
    // Step 3: Analyze IOI histogram to extract candidate BPMs
    const candidateBPMs = this.analyzeIOIHistogram();
    
    // Step 4: Apply autocorrelation for enhanced stability
    const finalBPM = this.autocorrelationAnalysis(candidateBPMs);
    
    // Step 5: Calculate beat intensity based on onset strength and BPM alignment
    const beatIntensity = this.calculateBeatIntensity(onsetData.onsetStrength, finalBPM, currentTime);
    
    return { bpm: finalBPM, beatIntensity };
  }

  /**
   * Detects onsets using spectral flux method
   * Calculates the increase in spectral energy between consecutive frames
   */
  private static detectOnsets(spectrum: Float32Array, currentTime: number): { onsetStrength: number } {
    const state = this.bpmDetectionState;
    
    let onsetStrength = 0;
    
    if (state.previousSpectrum) {
      // Calculate spectral flux (sum of positive differences)
      let flux = 0;
      for (let i = 0; i < spectrum.length; i++) {
        const diff = spectrum[i] - state.previousSpectrum[i];
        if (diff > 0) {
          flux += diff;
        }
      }
      
      // Normalize flux
      flux /= spectrum.length;
      
      // Store flux history for adaptive thresholding
      state.spectralFluxHistory.push(flux);
      if (state.spectralFluxHistory.length > 100) {
        state.spectralFluxHistory.shift();
      }
      
      // Calculate adaptive threshold (median + factor)
      const sortedFlux = [...state.spectralFluxHistory].sort((a, b) => a - b);
      const median = sortedFlux[Math.floor(sortedFlux.length / 2)];
      const threshold = median * 1.5; // Adaptive threshold factor
      
      // Detect onset if flux exceeds threshold and enough time has passed
      if (flux > threshold && (currentTime - state.lastOnsetTime) > 100) { // Min 100ms between onsets
        onsetStrength = Math.min((flux - threshold) / threshold, 1.0);
        state.onsetHistory.push(currentTime);
        state.lastOnsetTime = currentTime;
        
        // Keep only recent onsets (last 15 seconds)
        state.onsetHistory = state.onsetHistory.filter(time => currentTime - time < 15000);
      }
    }
    
    // Store current spectrum for next iteration
    state.previousSpectrum = new Float32Array(spectrum);
    
    return { onsetStrength };
  }

  /**
   * Updates the Inter-Onset Interval (IOI) histogram
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private static updateIOIHistogram(_currentTime: number): void {
    const state = this.bpmDetectionState;
    
    if (state.onsetHistory.length >= 2) {
      // Calculate intervals between consecutive onsets
      for (let i = 1; i < state.onsetHistory.length; i++) {
        const interval = state.onsetHistory[i] - state.onsetHistory[i - 1];
        
        // Only consider reasonable intervals (300ms to 2000ms, corresponding to 200-30 BPM)
        if (interval >= 300 && interval <= 2000) {
          // Round interval to nearest 10ms for histogram binning
          const roundedInterval = Math.round(interval / 10) * 10;
          
          const count = state.ioiHistogram.get(roundedInterval) || 0;
          state.ioiHistogram.set(roundedInterval, count + 1);
        }
      }
      
      // Decay old histogram entries
      const decayFactor = 0.95;
      for (const [interval, count] of state.ioiHistogram.entries()) {
        const newCount = count * decayFactor;
        if (newCount < 0.1) {
          state.ioiHistogram.delete(interval);
        } else {
          state.ioiHistogram.set(interval, newCount);
        }
      }
    }
  }

  /**
   * Analyzes IOI histogram to extract candidate BPMs
   */
  private static analyzeIOIHistogram(): number[] {
    const state = this.bpmDetectionState;
    const candidateBPMs: number[] = [];
    
    if (state.ioiHistogram.size === 0) {
      return [120]; // Default BPM
    }
    
    // Find peaks in the histogram
    const entries = Array.from(state.ioiHistogram.entries()).sort((a, b) => b[1] - a[1]);
    const topEntries = entries.slice(0, Math.min(5, entries.length)); // Top 5 intervals
    
    for (const [interval, count] of topEntries) {
      if (count > 1) { // Only consider intervals that occurred multiple times
        const bpm = Math.round(60000 / interval); // Convert interval to BPM
        
        // Consider harmonics and sub-harmonics
        candidateBPMs.push(bpm);
        candidateBPMs.push(Math.round(bpm * 2)); // Double-time
        candidateBPMs.push(Math.round(bpm / 2)); // Half-time
        candidateBPMs.push(Math.round(bpm * 3 / 2)); // 3/2 ratio
        candidateBPMs.push(Math.round(bpm * 4 / 3)); // 4/3 ratio
      }
    }
    
    // Filter to realistic BPM range and remove duplicates
    const uniqueBPMs = [...new Set(candidateBPMs)]
      .filter(bpm => bpm >= 60 && bpm <= 200)
      .sort((a, b) => a - b);
    
    return uniqueBPMs.length > 0 ? uniqueBPMs : [120];
  }

  /**
   * Applies autocorrelation analysis for enhanced stability
   */
  private static autocorrelationAnalysis(candidateBPMs: number[]): number {
    const state = this.bpmDetectionState;
    
    if (candidateBPMs.length === 0) {
      return state.bpmHistory.length > 0 ? 
        state.bpmHistory[state.bpmHistory.length - 1] : 120;
    }
    
    // If we have onset history, perform autocorrelation
    if (state.onsetHistory.length >= 8) {
      const bestBPM = this.performAutocorrelation(candidateBPMs);
      
      // Add to BPM history with confidence weighting
      state.bpmHistory.push(bestBPM);
      if (state.bpmHistory.length > 20) {
        state.bpmHistory.shift();
      }
      
      // Return weighted average of recent BPMs for stability
      return this.calculateWeightedBPM();
    } else {
      // Not enough data for autocorrelation, use the most frequent candidate
      const bpmCounts = new Map<number, number>();
      for (const bpm of candidateBPMs) {
        bpmCounts.set(bpm, (bpmCounts.get(bpm) || 0) + 1);
      }
      
      const mostFrequent = Array.from(bpmCounts.entries())
        .sort((a, b) => b[1] - a[1])[0];
      
      return mostFrequent ? mostFrequent[0] : 120;
    }
  }

  /**
   * Performs autocorrelation on onset times to find the most likely tempo
   */
  private static performAutocorrelation(candidateBPMs: number[]): number {
    const state = this.bpmDetectionState;
    const onsets = state.onsetHistory;
    
    if (onsets.length < 4) {
      return candidateBPMs[0] || 120;
    }
    
    let bestBPM = candidateBPMs[0];
    let bestScore = 0;
    
    for (const bpm of candidateBPMs) {
      const beatInterval = 60000 / bpm; // Beat interval in ms
      let score = 0;
      
      // Check how well this BPM aligns with the onset times
      for (let i = 0; i < onsets.length; i++) {
        for (let j = i + 1; j < onsets.length; j++) {
          const interval = onsets[j] - onsets[i];
          const beatRatio = interval / beatInterval;
          const nearestBeat = Math.round(beatRatio);
          
          // Score based on how close the interval is to a multiple of the beat
          if (nearestBeat > 0) {
            const error = Math.abs(beatRatio - nearestBeat) / nearestBeat;
            if (error < 0.1) { // Allow 10% error
              score += 1 / (1 + error); // Higher score for smaller error
            }
          }
        }
      }
      
      // Normalize score by number of onset pairs
      const numPairs = (onsets.length * (onsets.length - 1)) / 2;
      score /= numPairs;
      
      if (score > bestScore) {
        bestScore = score;
        bestBPM = bpm;
      }
    }
    
    return bestBPM;
  }

  /**
   * Calculates weighted average of recent BPMs for stability
   */
  private static calculateWeightedBPM(): number {
    const state = this.bpmDetectionState;
    
    if (state.bpmHistory.length === 0) {
      return 120;
    }
    
    // Use weighted average with more recent values having higher weight
    let totalWeight = 0;
    let weightedSum = 0;
    
    for (let i = 0; i < state.bpmHistory.length; i++) {
      const weight = (i + 1) / state.bpmHistory.length; // Linear weight increase
      weightedSum += state.bpmHistory[i] * weight;
      totalWeight += weight;
    }
    
    return Math.round(weightedSum / totalWeight);
  }

  /**
   * Calculates beat intensity based on onset strength and BPM alignment
   */
  private static calculateBeatIntensity(onsetStrength: number, bpm: number, currentTime: number): number {
    const state = this.bpmDetectionState;
    
    if (onsetStrength > 0.1) {
      state.lastBeatTime = currentTime;
      return Math.min(onsetStrength * 2, 1.0); // Amplify onset strength
    }
    
    // Fade out beat intensity over time
    const timeSinceLastBeat = currentTime - state.lastBeatTime;
    const beatInterval = 60000 / bpm;
    const fadeTime = Math.min(beatInterval * 0.3, 300); // Fade over 30% of beat interval or 300ms
    
    if (timeSinceLastBeat < fadeTime) {
      return Math.max(0, 1 - (timeSinceLastBeat / fadeTime));
    }
    
    return 0;
  }

  /**
   * Resets BPM detection state (useful when changing audio sources)
   */
  static resetBPMDetection(): void {
    this.bpmDetectionState = {
      onsetHistory: [],
      lastOnsetTime: 0,
      bpmHistory: [],
      lastBeatTime: 0,
      spectralFluxHistory: [],
      previousSpectrum: null,
      ioiHistogram: new Map(),
      autocorrelationHistory: [],
      confidenceHistory: []
    };
  }
}
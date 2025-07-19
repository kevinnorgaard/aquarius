export interface AudioFile {
  file: File;
  name: string;
  size: number;
  duration?: number;
  format: string;
  url: string;
  // Add specified BPM for playlist tracks
  specifiedBpm?: number;
}

export interface GLTFFile {
  file: File;
  name: string;
  size: number;
  format: string;
  url: string;
}

export interface MicrophoneConfig {
  sampleRate: number;
  channelCount: number;
  echoCancellation: boolean;
  noiseSuppression: boolean;
}

export interface AudioInputState {
  type: 'file' | 'microphone' | 'playlist' | null;
  isRecording: boolean;
  isProcessing: boolean;
  error: string | null;
  audioFile: AudioFile | null;
  audioContext: AudioContext | null;
  analyser: AnalyserNode | null;
  source: AudioBufferSourceNode | MediaStreamAudioSourceNode | MediaElementAudioSourceNode | null;
}

export interface GLTFState {
  gltfFile: GLTFFile | null;
  isLoading: boolean;
  error: string | null;
}

export interface AudioVisualizationData {
  frequencyData: Uint8Array;
  timeData: Uint8Array;
  volume: number;
  timestamp: number;
  // Add frequency analysis for low/high ranges
  lowFrequencyAverage: number;
  highFrequencyAverage: number;
  // Add BPM detection
  bpm: number;
  beatIntensity: number; // 0-1, intensity of the current beat
  // Add audio playing state
  isPlaying: boolean;
  // Add specified BPM for playlist tracks
  specifiedBpm?: number;
}

export type AudioInputType = 'file' | 'microphone' | 'playlist';

export interface AudioInputProps {
  onAudioLoad?: (audioData: AudioVisualizationData) => void;
  onError?: (error: string) => void;
  onStateChange?: (state: AudioInputState) => void;
}

export interface PlaylistTrack {
  name: string;
  filename: string;
  description?: string;
  duration?: number;
  bpm?: number;
  genre?: string;
  url: string;
  // Add flag to indicate this is from playlist
  isFromPlaylist?: boolean;
}

export interface PlaylistData {
  tracks: PlaylistTrack[];
  isLoading: boolean;
  error: string | null;
}

export interface BPMDetectionData {
  bpm: number;
  confidence: number;
  lastBeatTime: number;
  beatIntensity: number;
}

export interface OnsetDetectionData {
  onsetTimes: number[];
  spectralFlux: number[];
  adaptiveThreshold: number[];
  onsetStrength: number;
}

export interface IOIHistogramData {
  intervals: number[];
  histogram: Map<number, number>;
  peakIntervals: number[];
  confidence: number;
}
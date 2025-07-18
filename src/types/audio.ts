export interface AudioFile {
  file: File;
  name: string;
  size: number;
  duration?: number;
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
  type: 'file' | 'microphone' | null;
  isRecording: boolean;
  isProcessing: boolean;
  error: string | null;
  audioFile: AudioFile | null;
  audioContext: AudioContext | null;
  analyser: AnalyserNode | null;
  source: AudioBufferSourceNode | MediaStreamAudioSourceNode | null;
}

export interface AudioVisualizationData {
  frequencyData: Uint8Array;
  timeData: Uint8Array;
  volume: number;
  timestamp: number;
}

export type AudioInputType = 'file' | 'microphone';

export interface AudioInputProps {
  onAudioLoad?: (audioData: AudioVisualizationData) => void;
  onError?: (error: string) => void;
  onStateChange?: (state: AudioInputState) => void;
}
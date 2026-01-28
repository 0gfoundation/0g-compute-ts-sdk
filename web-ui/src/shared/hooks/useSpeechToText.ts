import { useState, useCallback, useRef } from 'react';

// Supported audio formats by the Whisper API
const SUPPORTED_FORMATS = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/mp4', 'audio/m4a', 'audio/flac'];

// Convert audio file to WAV format using Web Audio API
async function convertToWav(file: File): Promise<File> {
  const audioContext = new AudioContext();
  const arrayBuffer = await file.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  // Create WAV file
  const wavBuffer = audioBufferToWav(audioBuffer);
  const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' });
  const wavFileName = file.name.replace(/\.[^.]+$/, '.wav');

  await audioContext.close();
  return new File([wavBlob], wavFileName, { type: 'audio/wav' });
}

// Convert AudioBuffer to WAV format
function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const dataLength = buffer.length * blockAlign;
  const bufferLength = 44 + dataLength;

  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);

  // WAV header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  // Write audio data
  const offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      const sample = buffer.getChannelData(channel)[i];
      const intSample = Math.max(-1, Math.min(1, sample)) * 0x7FFF;
      view.setInt16(offset + (i * blockAlign) + (channel * bytesPerSample), intSample, true);
    }
  }

  return arrayBuffer;
}

function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

interface Provider {
  address: string;
  name: string;
}

interface ServiceMetadata {
  endpoint: string;
  model: string;
}

interface TranscriptionResult {
  id: string;
  fileName: string;
  text: string;
  timestamp: number;
  duration?: number; // in seconds
  providerAddress: string;
  providerName: string;
}

interface SpeechToTextConfig {
  broker: any;
  selectedProvider: Provider | null;
  serviceMetadata: ServiceMetadata | null;
  onError?: (error: string) => void;
}

interface TranscriptionOptions {
  file: File;
  language?: string;
  responseFormat?: 'json' | 'text' | 'srt' | 'vtt';
}

export function useSpeechToText(config: SpeechToTextConfig) {
  const { broker, selectedProvider, serviceMetadata, onError } = config;

  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptions, setTranscriptions] = useState<TranscriptionResult[]>([]);
  const [currentTranscription, setCurrentTranscription] = useState<TranscriptionResult | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Stop transcription
  const stopTranscription = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsTranscribing(false);
    }
  }, []);

  // Transcribe audio file
  const transcribeAudio = useCallback(async (options: TranscriptionOptions) => {
    const { file, language, responseFormat = 'json' } = options;

    if (!file || !selectedProvider || !broker) {
      onError?.('Please provide an audio file and select a provider');
      return null;
    }

    setIsTranscribing(true);
    setCurrentTranscription(null);

    // Create AbortController for this request
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      // Get service metadata
      let currentMetadata = serviceMetadata;
      if (!currentMetadata) {
        currentMetadata = await broker.inference.getServiceMetadata(
          selectedProvider.address
        );
        if (!currentMetadata) {
          throw new Error('Failed to get service metadata');
        }
      }

      // Convert unsupported formats (like WebM) to WAV
      let audioFile = file;
      if (!SUPPORTED_FORMATS.includes(file.type)) {
        console.log(`Converting ${file.type} to WAV format...`);
        audioFile = await convertToWav(file);
        console.log(`Converted to WAV: ${audioFile.name}`);
      }

      // Prepare form data
      const formData = new FormData();
      formData.append('file', audioFile, audioFile.name);  // Explicit filename for proper Content-Disposition header
      formData.append('model', currentMetadata.model);
      formData.append('response_format', responseFormat);
      if (language) {
        formData.append('language', language);
      }

      // Get request headers from broker
      // For multipart/form-data, we need to pass a placeholder for content
      const headers = await broker.inference.getRequestHeaders(
        selectedProvider.address,
        JSON.stringify({ model: currentMetadata.model, file: audioFile.name })
      );

      // Remove Content-Type header - let browser set it for multipart/form-data
      const { 'Content-Type': _, ...headersWithoutContentType } = headers;

      // Send request to transcription endpoint
      // The endpoint already includes the base path (e.g., http://host:port/v1/proxy)
      const { endpoint } = currentMetadata;
      const response = await fetch(`${endpoint}/audio/transcriptions`, {
        method: 'POST',
        headers: headersWithoutContentType,
        body: formData,
        signal,
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorBody = await response.text();
          if (errorBody) {
            try {
              const errorJson = JSON.parse(errorBody);
              errorMessage = errorJson.error?.message || JSON.stringify(errorJson, null, 2);
            } catch {
              errorMessage = errorBody;
            }
          }
        } catch {
          // Keep original message
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Handle response
      const transcriptionResult: TranscriptionResult = {
        id: `trans-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        fileName: file.name,
        text: data.text || '',
        timestamp: Date.now(),
        providerAddress: selectedProvider.address,
        providerName: selectedProvider.name,
      };

      setCurrentTranscription(transcriptionResult);
      setTranscriptions(prev => [transcriptionResult, ...prev]);

      // Save to localStorage for history
      saveToHistory(transcriptionResult);

      setIsTranscribing(false);
      abortControllerRef.current = null;
      return transcriptionResult;

    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        setIsTranscribing(false);
        abortControllerRef.current = null;
        return null;
      }

      const errorMessage = err instanceof Error ? err.message : 'Failed to transcribe audio';
      onError?.(errorMessage);
      setIsTranscribing(false);
      abortControllerRef.current = null;
      return null;
    }
  }, [broker, selectedProvider, serviceMetadata, onError]);

  // Clear current transcription
  const clearCurrentTranscription = useCallback(() => {
    setCurrentTranscription(null);
  }, []);

  // Load history from localStorage
  const loadHistory = useCallback(() => {
    try {
      const stored = localStorage.getItem('speechToTextHistory');
      if (stored) {
        const history = JSON.parse(stored) as TranscriptionResult[];
        setTranscriptions(history);
      }
    } catch {
      // Silent fail
    }
  }, []);

  // Clear history
  const clearHistory = useCallback(() => {
    setTranscriptions([]);
    try {
      localStorage.removeItem('speechToTextHistory');
    } catch {
      // Silent fail
    }
  }, []);

  return {
    isTranscribing,
    currentTranscription,
    transcriptions,
    transcribeAudio,
    stopTranscription,
    clearCurrentTranscription,
    loadHistory,
    clearHistory,
  };
}

// Helper function to save to localStorage
function saveToHistory(transcription: TranscriptionResult) {
  try {
    const stored = localStorage.getItem('speechToTextHistory');
    const existing = stored ? JSON.parse(stored) as TranscriptionResult[] : [];
    // Keep only last 50 transcriptions
    const updated = [transcription, ...existing].slice(0, 50);
    localStorage.setItem('speechToTextHistory', JSON.stringify(updated));
  } catch {
    // Silent fail
  }
}

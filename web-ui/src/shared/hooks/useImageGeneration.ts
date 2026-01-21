import { useState, useCallback, useRef } from 'react';

interface Provider {
  address: string;
  name: string;
}

interface ServiceMetadata {
  endpoint: string;
  model: string;
}

interface GeneratedImage {
  id: string;
  prompt: string;
  imageData: string; // base64 or URL
  timestamp: number;
  size: string;
  providerAddress: string;
  providerName: string;
}

interface ImageGenerationConfig {
  broker: any;
  selectedProvider: Provider | null;
  serviceMetadata: ServiceMetadata | null;
  onError?: (error: string) => void;
}

interface GenerationOptions {
  prompt: string;
  size?: string;
  n?: number;
  responseFormat?: 'b64_json' | 'url';
}

export function useImageGeneration(config: ImageGenerationConfig) {
  const { broker, selectedProvider, serviceMetadata, onError } = config;

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [currentImage, setCurrentImage] = useState<GeneratedImage | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Stop generation
  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsGenerating(false);
    }
  }, []);

  // Generate image
  const generateImage = useCallback(async (options: GenerationOptions) => {
    const { prompt, size = '1024x1024', n = 1, responseFormat = 'b64_json' } = options;

    if (!prompt.trim() || !selectedProvider || !broker) {
      onError?.('Please provide a prompt and select a provider');
      return null;
    }

    setIsGenerating(true);
    setCurrentImage(null);

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

      // Prepare request body
      const requestBody = {
        model: currentMetadata.model,
        prompt: prompt.trim(),
        n,
        size,
        response_format: responseFormat,
      };

      // Get request headers from broker
      const headers = await broker.inference.getRequestHeaders(
        selectedProvider.address,
        JSON.stringify(requestBody)
      );

      // Send request to image generation endpoint
      // The endpoint already includes the base path (e.g., http://host:port/v1/proxy)
      const { endpoint } = currentMetadata;
      const response = await fetch(`${endpoint}/images/generations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify(requestBody),
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

      // Handle response - can be b64_json or url format
      const imageResults: GeneratedImage[] = [];

      if (data.data && Array.isArray(data.data)) {
        for (const item of data.data) {
          const generatedImage: GeneratedImage = {
            id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            prompt,
            imageData: item.b64_json
              ? `data:image/png;base64,${item.b64_json}`
              : item.url || '',
            timestamp: Date.now(),
            size,
            providerAddress: selectedProvider.address,
            providerName: selectedProvider.name,
          };
          imageResults.push(generatedImage);
        }
      }

      if (imageResults.length > 0) {
        setCurrentImage(imageResults[0]);
        setGeneratedImages(prev => [...imageResults, ...prev]);

        // Save to localStorage for history
        saveToHistory(imageResults);
      }

      setIsGenerating(false);
      abortControllerRef.current = null;
      return imageResults;

    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        setIsGenerating(false);
        abortControllerRef.current = null;
        return null;
      }

      const errorMessage = err instanceof Error ? err.message : 'Failed to generate image';
      onError?.(errorMessage);
      setIsGenerating(false);
      abortControllerRef.current = null;
      return null;
    }
  }, [broker, selectedProvider, serviceMetadata, onError]);

  // Clear current image
  const clearCurrentImage = useCallback(() => {
    setCurrentImage(null);
  }, []);

  // Load history from localStorage
  const loadHistory = useCallback(() => {
    try {
      const stored = localStorage.getItem('imageGenerationHistory');
      if (stored) {
        const history = JSON.parse(stored) as GeneratedImage[];
        setGeneratedImages(history);
      }
    } catch {
      // Silent fail
    }
  }, []);

  // Clear history
  const clearHistory = useCallback(() => {
    setGeneratedImages([]);
    try {
      localStorage.removeItem('imageGenerationHistory');
    } catch {
      // Silent fail
    }
  }, []);

  return {
    isGenerating,
    currentImage,
    generatedImages,
    generateImage,
    stopGeneration,
    clearCurrentImage,
    loadHistory,
    clearHistory,
  };
}

// Helper function to save to localStorage
function saveToHistory(images: GeneratedImage[]) {
  try {
    const stored = localStorage.getItem('imageGenerationHistory');
    const existing = stored ? JSON.parse(stored) as GeneratedImage[] : [];
    // Keep only last 50 images
    const updated = [...images, ...existing].slice(0, 50);
    localStorage.setItem('imageGenerationHistory', JSON.stringify(updated));
  } catch {
    // Silent fail
  }
}

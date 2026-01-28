import { useState, useCallback, useRef } from 'react';

interface Provider {
  address: string;
  name: string;
  serviceType?: string;
}

interface ServiceMetadata {
  endpoint: string;
  model: string;
}

interface EditedImage {
  id: string;
  prompt: string;
  originalImage: string; // base64 or URL of original
  editedImage: string; // base64 or URL of result
  timestamp: number;
  providerAddress: string;
  providerName: string;
}

interface ImageEditingConfig {
  broker: any;
  selectedProvider: Provider | null;
  serviceMetadata: ServiceMetadata | null;
  onError?: (error: string) => void;
}

interface EditOptions {
  image: File;
  prompt: string;
  size?: string;
  n?: number;
}

export function useImageEditing(config: ImageEditingConfig) {
  const { broker, selectedProvider, serviceMetadata, onError } = config;

  const [isEditing, setIsEditing] = useState(false);
  const [editedImages, setEditedImages] = useState<EditedImage[]>([]);
  const [currentImage, setCurrentImage] = useState<EditedImage | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Stop editing
  const stopEditing = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsEditing(false);
    }
  }, []);

  // Edit image
  const editImage = useCallback(async (options: EditOptions) => {
    const { image, prompt, size = '1024x1024', n = 1 } = options;

    if (!image || !prompt.trim() || !selectedProvider || !broker) {
      onError?.('Please provide an image, prompt, and select a provider');
      return null;
    }

    setIsEditing(true);
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

      // Create FormData for multipart request
      const formData = new FormData();
      formData.append('image', image);
      formData.append('prompt', prompt.trim());
      formData.append('model', currentMetadata.model);
      formData.append('n', n.toString());
      formData.append('size', size);
      formData.append('response_format', 'b64_json');

      // Get request headers from broker
      // For multipart requests, we need to create a placeholder body for signing
      const signatureBody = JSON.stringify({
        model: currentMetadata.model,
        prompt: prompt.trim(),
        n,
        size,
      });
      const headers = await broker.inference.getRequestHeaders(
        selectedProvider.address,
        signatureBody
      );

      // Remove Content-Type header - let browser set it with boundary for multipart
      const { 'Content-Type': _, ...headerWithoutContentType } = headers;

      // Send request to image editing endpoint
      const { endpoint } = currentMetadata;
      const response = await fetch(`${endpoint}/images/edits`, {
        method: 'POST',
        headers: headerWithoutContentType,
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
              errorMessage = errorJson.error?.message || errorJson.detail || JSON.stringify(errorJson, null, 2);
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

      // Convert original image to base64 for display
      const originalImageBase64 = await fileToBase64(image);

      // Handle response
      const imageResults: EditedImage[] = [];

      if (data.data && Array.isArray(data.data)) {
        for (const item of data.data) {
          const editedImage: EditedImage = {
            id: `edit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            prompt,
            originalImage: originalImageBase64,
            editedImage: item.b64_json
              ? `data:image/png;base64,${item.b64_json}`
              : item.url || '',
            timestamp: Date.now(),
            providerAddress: selectedProvider.address,
            providerName: selectedProvider.name,
          };
          imageResults.push(editedImage);
        }
      }

      if (imageResults.length > 0) {
        setCurrentImage(imageResults[0]);
        setEditedImages(prev => [...imageResults, ...prev]);

        // Save to localStorage for history
        saveToHistory(imageResults);
      }

      setIsEditing(false);
      abortControllerRef.current = null;
      return imageResults;

    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        setIsEditing(false);
        abortControllerRef.current = null;
        return null;
      }

      const errorMessage = err instanceof Error ? err.message : 'Failed to edit image';
      onError?.(errorMessage);
      setIsEditing(false);
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
      const stored = localStorage.getItem('imageEditingHistory');
      if (stored) {
        const history = JSON.parse(stored) as EditedImage[];
        setEditedImages(history);
      }
    } catch {
      // Silent fail
    }
  }, []);

  // Clear history
  const clearHistory = useCallback(() => {
    setEditedImages([]);
    try {
      localStorage.removeItem('imageEditingHistory');
    } catch {
      // Silent fail
    }
  }, []);

  return {
    isEditing,
    currentImage,
    editedImages,
    editImage,
    stopEditing,
    clearCurrentImage,
    loadHistory,
    clearHistory,
  };
}

// Helper function to convert File to base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Helper function to save to localStorage
function saveToHistory(images: EditedImage[]) {
  try {
    const stored = localStorage.getItem('imageEditingHistory');
    const existing = stored ? JSON.parse(stored) as EditedImage[] : [];
    // Keep only last 30 images (editing stores more data)
    const updated = [...images, ...existing].slice(0, 30);
    localStorage.setItem('imageEditingHistory', JSON.stringify(updated));
  } catch {
    // Silent fail
  }
}

// Speech-to-text service integrations for Firefox and other browsers
// This file provides examples of how to integrate with external services

export interface SpeechToTextService {
  transcribe(audioBlob: Blob): Promise<string>;
  isAvailable(): boolean;
}

// Example: OpenAI Whisper API integration
export class OpenAIWhisperService implements SpeechToTextService {
  private apiKey: string;
  private baseUrl: string = "https://api.openai.com/v1/audio/transcriptions";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  isAvailable(): boolean {
    return !!this.apiKey && typeof fetch !== "undefined";
  }

  async transcribe(audioBlob: Blob): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error("OpenAI API key not provided or fetch not available");
    }

    const formData = new FormData();
    formData.append("file", audioBlob, "audio.webm");
    formData.append("model", "whisper-1");
    formData.append("language", "en");

    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const result = await response.json();
      return result.text || "";
    } catch (error) {
      console.error("OpenAI Whisper transcription error:", error);
      throw new Error("Failed to transcribe audio with OpenAI Whisper");
    }
  }
}

// Example: Web Speech API (for browsers that support it)
export class WebSpeechAPIService implements SpeechToTextService {
  isAvailable(): boolean {
    return (
      typeof window !== "undefined" &&
      ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async transcribe(_audioBlob: Blob): Promise<string> {
    // This is a placeholder - Web Speech API doesn't work with audio blobs
    // It requires direct microphone access
    throw new Error(
      "Web Speech API requires direct microphone access, not audio blobs"
    );
  }
}

// Example: Browser-based transcription (placeholder for future implementations)
export class BrowserTranscriptionService implements SpeechToTextService {
  isAvailable(): boolean {
    // Check if browser supports Web Audio API for potential offline transcription
    return (
      (typeof window !== "undefined" && "AudioContext" in window) ||
      "webkitAudioContext" in window
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async transcribe(_audioBlob: Blob): Promise<string> {
    // This is a placeholder for potential offline transcription
    // Could be implemented with WebAssembly-based models like:
    // - OpenAI Whisper WASM
    // - Google's on-device speech recognition
    // - Custom trained models

    console.log("Browser-based transcription not yet implemented");
    return "Browser-based transcription not yet implemented. Consider using an external service.";
  }
}

// Example: Server-side transcription (more secure)
export class ServerSideTranscriptionService implements SpeechToTextService {
  private apiEndpoint: string = "/api/transcribe";

  isAvailable(): boolean {
    return typeof fetch !== "undefined";
  }

  async transcribe(audioBlob: Blob): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error("Fetch API not available");
    }

    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.webm");

    try {
      const response = await fetch(this.apiEndpoint, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage =
          errorData?.error || `Server error: ${response.status}`;
        throw new Error(errorMessage);
      }

      const result = await response.json();
      return result.transcript || "";
    } catch (error) {
      console.error("Server-side transcription error:", error);
      throw new Error("Failed to transcribe audio via server");
    }
  }
}

// Service factory to choose the best available service
export class SpeechToTextServiceFactory {
  private services: SpeechToTextService[] = [];

  constructor(openAIApiKey?: string, useServerSide: boolean = false) {
    // Add services in order of preference
    if (useServerSide) {
      // Prefer server-side transcription for security
      this.services.push(new ServerSideTranscriptionService());
    } else if (openAIApiKey) {
      // Use client-side with API key
      this.services.push(new OpenAIWhisperService(openAIApiKey));
    }

    this.services.push(new WebSpeechAPIService());
    this.services.push(new BrowserTranscriptionService());
  }

  getBestAvailableService(): SpeechToTextService | null {
    return this.services.find((service) => service.isAvailable()) || null;
  }

  async transcribe(audioBlob: Blob): Promise<string> {
    const service = this.getBestAvailableService();

    if (!service) {
      throw new Error("No speech-to-text service available");
    }

    return await service.transcribe(audioBlob);
  }
}

// Usage example:
// const factory = new SpeechToTextServiceFactory(process.env.OPENAI_API_KEY);
// const transcript = await factory.transcribe(audioBlob);

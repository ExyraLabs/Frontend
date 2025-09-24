"use client";
import { useState, useRef, useCallback, useEffect } from "react";

interface UseVoiceRecordingOptions {
  onTranscriptionComplete?: (transcript: string, autosend?: boolean) => void;
  onError?: (error: string) => void;
  autoSubmit?: boolean;
  // Optional per-frame audio-level callback and debug logging toggle
  onAudioLevel?: (
    level: number,
    averagedLevel: number,
    effectiveLevel: number
  ) => void;
  debug?: boolean;
  // Optional per-frame waveform callback (normalized -1..1, length ~256)
  onWaveform?: (samples: Float32Array) => void;
}

interface VoiceRecordingState {
  isRecording: boolean;
  isProcessing: boolean;
  transcript: string;
  error: string | null;
  isSupported: boolean;
  isCheckingSupport: boolean;
  isFirefoxMode: boolean;
  audioLevel: number;
  silenceDetected: boolean;
}

// Define SpeechRecognition types
interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((event: Event) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((event: Event) => void) | null;
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    webkitSpeechRecognition: new () => SpeechRecognition;
    SpeechRecognition: new () => SpeechRecognition;
  }
}

// Helper function to detect the best supported audio MIME type for MediaRecorder
const getBestSupportedMimeType = (): {
  mimeType: string;
  extension: string;
} => {
  // Order of preference: prioritize mobile-friendly formats first, then desktop formats
  const mimeTypes = [
    { mimeType: "audio/mp4", extension: "mp4" },
    { mimeType: "audio/mpeg", extension: "mp3" },
    { mimeType: "audio/wav", extension: "wav" },
    { mimeType: "audio/webm;codecs=opus", extension: "webm" },
    { mimeType: "audio/webm", extension: "webm" },
    { mimeType: "audio/ogg;codecs=opus", extension: "ogg" },
    { mimeType: "audio/ogg", extension: "ogg" },
  ];

  for (const type of mimeTypes) {
    if (MediaRecorder.isTypeSupported(type.mimeType)) {
      console.log(`Selected MIME type: ${type.mimeType}`);
      return type;
    }
  }

  // Fallback - this should rarely happen on modern browsers
  console.warn("No supported MIME types found, using default");
  return { mimeType: "", extension: "webm" };
};

// Production speech-to-text for Firefox using external services
const transcribeAudioFirefox = async (audioBlob: Blob): Promise<string> => {
  console.log(
    "Firefox transcription starting - audio blob size:",
    audioBlob.size,
    "bytes"
  );

  // Validate audio blob
  if (!audioBlob || audioBlob.size === 0) {
    throw new Error("Invalid audio data received");
  }

  try {
    // Import the speech-to-text services
    const { SpeechToTextServiceFactory } = await import(
      "@/utils/speechToTextServices"
    );

    // Check if server-side API is available first (more secure)
    let factory: InstanceType<typeof SpeechToTextServiceFactory>;
    try {
      // Try server-side transcription first
      factory = new SpeechToTextServiceFactory(undefined, true);
      console.log("Using server-side transcription for Firefox");
    } catch {
      // Fallback to client-side with API key
      const apiKey =
        process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY;

      if (!apiKey) {
        console.warn(
          "No OpenAI API key found. Add NEXT_PUBLIC_OPENAI_API_KEY to your .env file."
        );
        return "Firefox transcription requires an API key. Please configure NEXT_PUBLIC_OPENAI_API_KEY in your environment variables or set up the /api/transcribe endpoint.";
      }

      factory = new SpeechToTextServiceFactory(apiKey, false);
      console.log("Using client-side transcription for Firefox");
    }

    // Attempt transcription
    const transcript = await factory.transcribe(audioBlob);

    if (!transcript || transcript.trim().length === 0) {
      return "No speech detected in the recording. Please try speaking more clearly.";
    }

    console.log(
      "Firefox transcription successful:",
      transcript.substring(0, 50) + "..."
    );
    return transcript.trim();
  } catch (error) {
    console.error("Firefox transcription failed:", error);

    // Provide helpful error messages
    if (error instanceof Error) {
      if (
        error.message.includes("API key") ||
        error.message.includes("authentication")
      ) {
        return "API authentication failed. Please check your OpenAI API key configuration.";
      } else if (
        error.message.includes("network") ||
        error.message.includes("fetch")
      ) {
        return "Network error during transcription. Please check your internet connection and try again.";
      } else if (
        error.message.includes("rate limit") ||
        error.message.includes("429")
      ) {
        return "API rate limit exceeded. Please wait a moment before trying again.";
      } else if (error.message.includes("Server error")) {
        return "Server transcription service unavailable. Please try again later.";
      }
    }

    return "Transcription failed. Firefox users need an external service for speech recognition. Please try Chrome or Safari for real-time recognition.";
  }
};

export const useVoiceRecording = ({
  onTranscriptionComplete,
  onError,
  onAudioLevel,
  debug = false,
  onWaveform,
}: UseVoiceRecordingOptions = {}) => {
  const [state, setState] = useState<VoiceRecordingState>({
    isRecording: false,
    isProcessing: false,
    transcript: "",
    error: null,
    isSupported: true, // Start with true to prevent flickering
    isCheckingSupport: true,
    isFirefoxMode: false,
    audioLevel: 0,
    silenceDetected: false,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioLevelsRef = useRef<number[]>([]); // Store recent audio levels for averaging
  const stopReasonRef = useRef<"none" | "manual" | "silence" | "cancel">(
    "none"
  );
  const recordingStartTsRef = useRef<number>(0);
  const isRecordingRef = useRef<boolean>(false);
  const rafIdRef = useRef<number | null>(null);
  // Throttle console logging when debug=true
  const lastLogTsRef = useRef<number>(0);
  // Adaptive noise floor calibration (time-domain RMS)
  const baselineRmsRef = useRef<number>(0);
  const baselineCountRef = useRef<number>(0);

  // Audio analysis for real-time level detection and silence detection

  const startAudioAnalysis = useCallback(
    (stream: MediaStream) => {
      try {
        const audioContext = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(stream);

        // Configure analyser for time-domain sampling
        analyser.fftSize = 1024; // higher for smoother waveform
        analyser.smoothingTimeConstant = 0.2;
        microphone.connect(analyser);
        // Keep the graph active: route analyser to a zero-gain node to destination
        const silentGain = audioContext.createGain();
        silentGain.gain.value = 0;
        analyser.connect(silentGain);
        silentGain.connect(audioContext.destination);

        // Ensure the AudioContext is running (some browsers start suspended)
        if (audioContext.state === "suspended") {
          void audioContext.resume().catch(() => {
            /* ignore */
          });
        }

        audioContextRef.current = audioContext;
        analyserRef.current = analyser;

        // Centralized frame handler to avoid duplication
        const handleFrame = (
          level: number,
          downsampled?: Float32Array,
          min?: number,
          max?: number
        ) => {
          if (!isRecordingRef.current) return;
          setState((prev) => ({ ...prev, audioLevel: level }));
          if (downsampled && onWaveform) onWaveform(downsampled);

          const defaultThreshold = 0.015; // fallback
          const baselineDuration = 600; // ms to learn ambient noise
          const silenceThreshold =
            baselineCountRef.current > 10
              ? Math.max(0.01, baselineRmsRef.current * 1.8)
              : defaultThreshold;
          const silenceDuration = 3000; // 3s of continuous silence to stop
          const avgWindowSize = 12; // moving average window
          const minActiveBeforeSilenceMs = 1200; // don't stop in first 1.2s

          audioLevelsRef.current.push(level);
          if (audioLevelsRef.current.length > avgWindowSize) {
            audioLevelsRef.current.shift();
          }

          const now = Date.now();
          const elapsed = now - (recordingStartTsRef.current || now);

          if (elapsed < baselineDuration) {
            baselineRmsRef.current =
              (baselineRmsRef.current * baselineCountRef.current + level) /
              (baselineCountRef.current + 1);
            baselineCountRef.current += 1;
          }
          const avg =
            audioLevelsRef.current.reduce((s, v) => s + v, 0) /
            Math.max(1, audioLevelsRef.current.length);
          const effectiveLevel = Math.max(level, avg * 0.8);

          onAudioLevel?.(level, avg, effectiveLevel);

          if (debug) {
            const t = performance.now();
            if (t - lastLogTsRef.current > 250) {
              lastLogTsRef.current = t;
              console.log(
                `[voice] raw=${level.toFixed(3)} avg=${avg.toFixed(
                  3
                )} eff=${effectiveLevel.toFixed(
                  3
                )} thresh=${silenceThreshold.toFixed(
                  3
                )} baseline=${baselineRmsRef.current.toFixed(3)}${
                  min !== undefined && max !== undefined
                    ? ` minS=${min.toFixed(3)} maxS=${max.toFixed(3)}`
                    : ""
                } elapsed=${Math.round(elapsed)}ms`
              );
            }
          }

          const canEvaluateSilence =
            audioLevelsRef.current.length >= avgWindowSize &&
            elapsed > minActiveBeforeSilenceMs;
          if (canEvaluateSilence && effectiveLevel < silenceThreshold) {
            if (!silenceTimeoutRef.current) {
              if (debug) {
                console.debug(
                  `[voice] silence candidate: eff=${effectiveLevel.toFixed(
                    3
                  )} < ${silenceThreshold}; scheduling stop in ${silenceDuration}ms`
                );
              }
              silenceTimeoutRef.current = setTimeout(() => {
                if (debug) console.debug("[voice] silence auto-stop triggered");
                stopReasonRef.current = "silence";
                setState((prev) => ({
                  ...prev,
                  silenceDetected: true,
                  isRecording: false,
                }));
              }, silenceDuration);
            }
          } else {
            if (silenceTimeoutRef.current) {
              if (debug)
                console.debug("[voice] silence cleared; cancelling timer");
              clearTimeout(silenceTimeoutRef.current);
              silenceTimeoutRef.current = null;
            }
            if (state.silenceDetected) {
              setState((prev) => ({ ...prev, silenceDetected: false }));
            }
          }
        };

        // Analyser fallback function
        const timeDomainLength = analyser.fftSize;
        const timeDomainArray = new Uint8Array(timeDomainLength);
        const detectAudioLevel = () => {
          if (!analyserRef.current || !isRecordingRef.current) return;
          analyserRef.current.getByteTimeDomainData(timeDomainArray);
          let minV = 255,
            maxV = 0;
          let sumSq = 0;
          for (let i = 0; i < timeDomainArray.length; i++) {
            const v = timeDomainArray[i];
            if (v < minV) minV = v;
            if (v > maxV) maxV = v;
            const centered = (v - 128) / 128; // [-1,1]
            sumSq += centered * centered;
          }
          const level = Math.sqrt(sumSq / timeDomainArray.length);
          let down: Float32Array | undefined;
          if (onWaveform) {
            const outLen = 256;
            const stride = Math.max(
              1,
              Math.floor(timeDomainArray.length / outLen)
            );
            down = new Float32Array(outLen);
            for (let i = 0; i < outLen; i++) {
              const idx = Math.min(timeDomainArray.length - 1, i * stride);
              down[i] = (timeDomainArray[idx] - 128) / 128;
            }
          }
          handleFrame(level, down, (minV - 128) / 128, (maxV - 128) / 128);
          if (state.isRecording) {
            rafIdRef.current = requestAnimationFrame(detectAudioLevel);
          }
        };

        // Primary path: AudioWorkletNode for modern browsers
        try {
          audioContext.audioWorklet
            .addModule("/audio/level-processor.js")
            .then(() => {
              const worklet = new AudioWorkletNode(
                audioContext,
                "level-processor"
              );
              workletNodeRef.current = worklet;
              microphone.connect(worklet);
              worklet.connect(silentGain);
              worklet.port.onmessage = (ev: MessageEvent) => {
                const data = ev.data as {
                  rms: number;
                  down: Float32Array;
                  min: number;
                  max: number;
                };
                if (!isRecordingRef.current || !data) return;
                const level = Math.max(0, Math.min(1, data.rms));
                handleFrame(level, data.down, data.min, data.max);
              };
            })
            .catch((err) => {
              if (debug) console.warn("AudioWorklet addModule failed:", err);
            });
        } catch (err) {
          if (debug)
            console.warn("AudioWorklet unavailable, falling back:", err);
        }
        // Run the analyser RAF fallback only if worklet is not available
        if (!workletNodeRef.current) {
          detectAudioLevel();
          isRecordingRef.current = true;
          rafIdRef.current = requestAnimationFrame(detectAudioLevel);
        } else {
          isRecordingRef.current = true;
        }
      } catch (error) {
        console.warn("Audio analysis not supported:", error);
      }
    },
    [state.isRecording, state.silenceDetected, onAudioLevel, onWaveform, debug]
  );

  // Lightweight state transition debug logs
  useEffect(() => {
    if (!debug) return;
    console.debug(
      `[voice] state: isRecording=${state.isRecording}, isProcessing=${state.isProcessing}, firefoxMode=${state.isFirefoxMode}`
    );
  }, [debug, state.isRecording, state.isProcessing, state.isFirefoxMode]);
  useEffect(() => {
    const checkSupport = () => {
      try {
        if (typeof window === "undefined") {
          setState((prev) => ({
            ...prev,
            isSupported: false,
            isCheckingSupport: false,
            error: "Not in browser environment",
          }));
          return;
        }

        const hasWebSpeechAPI =
          "webkitSpeechRecognition" in window || "SpeechRecognition" in window;
        const hasMediaRecorder = "MediaRecorder" in window;
        const hasGetUserMedia = !!(
          navigator?.mediaDevices && navigator.mediaDevices.getUserMedia
        );
        const isSecureContext =
          window.isSecureContext ||
          location.protocol === "https:" ||
          location.hostname === "localhost";
        const isFirefox = navigator.userAgent.toLowerCase().includes("firefox");

        // Firefox doesn't support Web Speech API, but we can use MediaRecorder + external service
        // Most wallet in-app browsers also don't support Web Speech API, so treat them like Firefox
        const isMetaMask = navigator.userAgent.includes("MetaMask");
        const isPhantom = navigator.userAgent.includes("Phantom");
        const isTrustWallet =
          navigator.userAgent.includes("Trust") ||
          navigator.userAgent.includes("TrustWallet");
        const isCoinbaseWallet =
          navigator.userAgent.includes("CoinbaseWallet") ||
          navigator.userAgent.includes("Coinbase");
        const isRainbowWallet = navigator.userAgent.includes("Rainbow");
        const isArgentWallet = navigator.userAgent.includes("Argent");
        const isImTokenWallet = navigator.userAgent.includes("imToken");
        const is1inchWallet = navigator.userAgent.includes("1inch");
        const isTokenPocket = navigator.userAgent.includes("TokenPocket");
        const isMathWallet = navigator.userAgent.includes("MathWallet");
        const isSafepalWallet = navigator.userAgent.includes("SafePal");
        const isWalletConnect = navigator.userAgent.includes("WalletConnect");

        const isWalletBrowser =
          isMetaMask ||
          isPhantom ||
          isTrustWallet ||
          isCoinbaseWallet ||
          isRainbowWallet ||
          isArgentWallet ||
          isImTokenWallet ||
          is1inchWallet ||
          isTokenPocket ||
          isMathWallet ||
          isSafepalWallet ||
          isWalletConnect;

        const shouldUseFirefoxMode =
          (isFirefox && !hasWebSpeechAPI) ||
          (isWalletBrowser && !hasWebSpeechAPI);

        const isSupported =
          (hasWebSpeechAPI ||
            ((isFirefox || isWalletBrowser) && hasMediaRecorder)) &&
          hasGetUserMedia &&
          isSecureContext;

        // Determine which wallet browser was detected
        const detectedWallet = isMetaMask
          ? "MetaMask"
          : isPhantom
          ? "Phantom"
          : isTrustWallet
          ? "Trust Wallet"
          : isCoinbaseWallet
          ? "Coinbase Wallet"
          : isRainbowWallet
          ? "Rainbow"
          : isArgentWallet
          ? "Argent"
          : isImTokenWallet
          ? "imToken"
          : is1inchWallet
          ? "1inch"
          : isTokenPocket
          ? "TokenPocket"
          : isMathWallet
          ? "MathWallet"
          : isSafepalWallet
          ? "SafePal"
          : isWalletConnect
          ? "WalletConnect"
          : null;

        console.log("Voice recording support check:", {
          hasWebSpeechAPI,
          hasMediaRecorder,
          hasGetUserMedia,
          isSecureContext,
          isFirefox,
          isWalletBrowser,
          detectedWallet,
          shouldUseFirefoxMode,
          isSupported,
          userAgent: navigator.userAgent,
        });

        setState((prev) => ({
          ...prev,
          isSupported,
          isCheckingSupport: false,
          isFirefoxMode: shouldUseFirefoxMode,
        }));
      } catch (error) {
        console.error("Error checking voice recording support:", error);
        setState((prev) => ({
          ...prev,
          isSupported: false,
          isCheckingSupport: false,
          error: "Failed to check voice recording support",
        }));
      }
    };

    checkSupport();
  }, []);

  // Handle auto-stop when recording state changes due to silence detection
  useEffect(() => {
    if (!state.isRecording && state.silenceDetected) {
      // Auto-stop was triggered by silence detection
      console.log("Handling auto-stop due to silence");

      // Clear silence timeout
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }

      // Stop audio analysis
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }

      // Stop recognition and media recorder
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }

      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      // Check if we should be in Firefox mode (wallet browser detection)
      const isWalletBrowser =
        navigator.userAgent.includes("MetaMask") ||
        navigator.userAgent.includes("Phantom") ||
        navigator.userAgent.includes("Trust") ||
        navigator.userAgent.includes("CoinbaseWallet") ||
        navigator.userAgent.includes("Rainbow") ||
        navigator.userAgent.includes("Argent") ||
        navigator.userAgent.includes("imToken") ||
        navigator.userAgent.includes("1inch") ||
        navigator.userAgent.includes("TokenPocket") ||
        navigator.userAgent.includes("MathWallet") ||
        navigator.userAgent.includes("SafePal") ||
        navigator.userAgent.includes("WalletConnect");
      const hasWebSpeechAPI =
        "webkitSpeechRecognition" in window || "SpeechRecognition" in window;
      // AGGRESSIVE FIX: Force Firefox mode for any wallet browser, regardless of Web Speech API detection
      const actualFirefoxMode = state.isFirefoxMode || isWalletBrowser;

      // Set processing state only on non-Firefox; Firefox flow handles processing in onstop
      if (!actualFirefoxMode) {
        setState((prev) => ({
          ...prev,
          isProcessing: true,
          silenceDetected: false,
        }));
      } else {
        setState((prev) => ({ ...prev, silenceDetected: false }));
      }

      // For Chrome/Safari, process immediately
      if (!actualFirefoxMode) {
        setTimeout(() => {
          setState((prev) => {
            const currentTranscript = prev.transcript.trim();
            console.log(currentTranscript, "auto-submit:");

            if (
              currentTranscript &&
              !currentTranscript.includes("Recording...")
            ) {
              onTranscriptionComplete?.(currentTranscript, true);
            }
            return { ...prev, isProcessing: false, audioLevel: 0 };
          });
        }, 500);
      }
    }
  }, [
    state.isRecording,
    state.silenceDetected,
    state.isFirefoxMode,
    onTranscriptionComplete,
  ]);

  // Initialize speech recognition (Chrome/Safari)
  const initializeSpeechRecognition = useCallback(() => {
    if (typeof window === "undefined" || state.isFirefoxMode) return null;

    const SpeechRecognition =
      window.webkitSpeechRecognition || window.SpeechRecognition;
    if (!SpeechRecognition) return null;

    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      console.log("Speech recognition started");
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      const fullTranscript = finalTranscript || interimTranscript;
      setState((prev) => ({ ...prev, transcript: fullTranscript }));
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const errorMessage = `Speech recognition error: ${event.error}`;
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        isRecording: false,
      }));
      onError?.(errorMessage);
    };

    recognition.onend = () => {
      setState((prev) => ({ ...prev, isRecording: false }));
    };

    return recognition;
  }, [onError, state.isFirefoxMode]);

  const startRecording = useCallback(async () => {
    if (debug) console.debug("[voice] startRecording requested");

    // Check for wallet browser and force Firefox mode if needed
    const isWalletBrowser =
      navigator.userAgent.includes("MetaMask") ||
      navigator.userAgent.includes("Phantom") ||
      navigator.userAgent.includes("Trust") ||
      navigator.userAgent.includes("CoinbaseWallet") ||
      navigator.userAgent.includes("Rainbow") ||
      navigator.userAgent.includes("Argent") ||
      navigator.userAgent.includes("imToken") ||
      navigator.userAgent.includes("1inch") ||
      navigator.userAgent.includes("TokenPocket") ||
      navigator.userAgent.includes("MathWallet") ||
      navigator.userAgent.includes("SafePal") ||
      navigator.userAgent.includes("WalletConnect");

    // Force Firefox mode for any wallet browser
    const shouldForceFirefoxMode = isWalletBrowser;

    // OVERRIDE: Force Firefox mode for wallet browsers
    const actualFirefoxMode = shouldForceFirefoxMode || state.isFirefoxMode;

    // Prevent multiple simultaneous recordings - clean up existing one first
    if (streamRef.current || state.isRecording) {
      console.log("Cleaning up existing recording before starting new one");

      // Clean up existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      // Clean up existing audio context
      if (audioContextRef.current) {
        try {
          if (workletNodeRef.current) {
            workletNodeRef.current.disconnect();
            workletNodeRef.current.port.onmessage = () => {};
            workletNodeRef.current = null;
          }
          if (analyserRef.current) {
            analyserRef.current.disconnect();
            analyserRef.current = null;
          }
        } catch {}
        audioContextRef.current.close();
        audioContextRef.current = null;
      }

      // Stop recognition if active
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }

      // Stop media recorder if active
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current = null;
      }

      // Clear timeouts
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }

      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    }

    // Reset buffers and flags
    audioLevelsRef.current = [];
    recordingStartTsRef.current = Date.now();
    stopReasonRef.current = "none";
    isRecordingRef.current = true;
    // Reset baseline calibration
    baselineRmsRef.current = 0;
    baselineCountRef.current = 0;
    setState((prev) => {
      if (!prev.isSupported || prev.isCheckingSupport) {
        const errorMsg = prev.isCheckingSupport
          ? "Still checking browser support..."
          : "Voice recording is not supported in this browser. Please use Chrome, Firefox, or Safari on HTTPS.";
        onError?.(errorMsg);
        return { ...prev, error: errorMsg };
      }

      return {
        ...prev,
        isRecording: true,
        isProcessing: false,
        transcript: "",
        error: null,
        silenceDetected: false,
      };
    });

    try {
      // Use more conservative audio constraints for better mobile compatibility
      const isMobile =
        /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );
      const audioConstraints = isMobile
        ? {
            // More conservative settings for mobile devices
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          }
        : {
            // Desktop settings with more options
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 44100,
          };

      console.log(
        `Requesting audio with ${isMobile ? "mobile" : "desktop"} constraints:`,
        audioConstraints
      );

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: audioConstraints,
      });
      streamRef.current = stream;

      if (debug) {
        const track = stream.getAudioTracks()[0];
        const maybeMuted = (track as unknown as { muted?: boolean })?.muted;
        console.debug(
          `[voice] media track: enabled=${track.enabled}, muted=${
            maybeMuted ?? "n/a"
          }, readyState=${track.readyState}`
        );
      }

      // Start audio analysis for real-time visualization and silence detection
      startAudioAnalysis(stream);

      if (actualFirefoxMode) {
        // Firefox mode: Use MediaRecorder only
        console.log("Starting Firefox recording mode with MediaRecorder");

        const supportedType = getBestSupportedMimeType();
        if (supportedType.mimeType) {
          const mediaRecorder = new MediaRecorder(stream, {
            mimeType: supportedType.mimeType,
          });

          mediaRecorderRef.current = mediaRecorder;
          chunksRef.current = [];

          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              chunksRef.current.push(event.data);
            }
          };

          mediaRecorder.onstop = async () => {
            // If user cancelled, skip transcription and sending
            if (stopReasonRef.current === "cancel") {
              chunksRef.current = [];
              setState((prev) => ({ ...prev, isProcessing: false }));
              return;
            }
            const audioBlob = new Blob(chunksRef.current, {
              type: supportedType.mimeType,
            });
            setState((prev) => ({
              ...prev,
              isProcessing: true,
              transcript: "Processing audio...",
            }));

            try {
              const transcript = await transcribeAudioFirefox(audioBlob);

              setState((prev) => ({
                ...prev,
                transcript,
                isProcessing: false,
                error: null,
              }));

              // Auto-complete transcription for Firefox users
              if (
                transcript &&
                !transcript.includes("failed") &&
                !transcript.includes("requires")
              ) {
                setTimeout(() => {
                  if (stopReasonRef.current !== "cancel") {
                    onTranscriptionComplete?.(transcript, true);
                  }
                }, 1000); // Give user time to see the transcript
              }
            } catch (error) {
              const errorMsg =
                error instanceof Error
                  ? error.message
                  : "Failed to transcribe audio in Firefox mode";
              console.error("Firefox transcription error:", error);
              setState((prev) => ({
                ...prev,
                error: errorMsg,
                isProcessing: false,
                transcript: errorMsg,
              }));
              onError?.(errorMsg);
            }
          };

          mediaRecorder.start(100);

          // Show immediate feedback for Firefox users
          setState((prev) => ({
            ...prev,
            transcript:
              "Recording... (Firefox mode: limited speech recognition support)",
          }));
        } else {
          // No supported MIME type found
          const errorMsg =
            "MediaRecorder not supported: no compatible audio format found";
          console.error(errorMsg);
          setState((prev) => ({
            ...prev,
            error: errorMsg,
            isRecording: false,
          }));
          onError?.(errorMsg);

          // Clean up the stream
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
          }
          return;
        }
      } else {
        // Chrome/Safari mode: Use Web Speech API + MediaRecorder backup
        const recognition = initializeSpeechRecognition();
        if (recognition) {
          recognitionRef.current = recognition;
          recognition.start();
        }

        const supportedType = getBestSupportedMimeType();
        if (supportedType.mimeType) {
          const mediaRecorder = new MediaRecorder(stream, {
            mimeType: supportedType.mimeType,
          });

          mediaRecorderRef.current = mediaRecorder;
          chunksRef.current = [];

          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              chunksRef.current.push(event.data);
            }
          };

          mediaRecorder.start(100);
        } else {
          // No supported MIME type found
          console.warn(
            "MediaRecorder not supported: no compatible audio format found"
          );
          // Continue without MediaRecorder backup, rely on Web Speech API only
        }
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to start recording";
      setState((prev) => ({
        ...prev,
        error: errorMsg,
        isRecording: false,
      }));
      onError?.(errorMsg);
    }
  }, [
    initializeSpeechRecognition,
    onError,
    onTranscriptionComplete,
    state.isFirefoxMode,
    state.isRecording,
    startAudioAnalysis,
    debug,
  ]);

  const stopRecording = useCallback(() => {
    if (debug)
      console.debug(`[voice] stopRecording (reason=${stopReasonRef.current})`);

    stopReasonRef.current = "manual";
    // cancel RAF loop
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    isRecordingRef.current = false;
    setState((prev) => ({ ...prev, isProcessing: true }));

    // Clear silence detection timeout
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }

    // Stop audio analysis
    if (audioContextRef.current) {
      try {
        if (workletNodeRef.current) {
          workletNodeRef.current.disconnect();
          workletNodeRef.current.port.onmessage = () => {};
          workletNodeRef.current = null;
        }
        if (analyserRef.current) {
          analyserRef.current.disconnect();
        }
      } catch {}
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Check if we should use Firefox mode (for wallet browsers)
    const isWalletBrowser =
      navigator.userAgent.includes("MetaMask") ||
      navigator.userAgent.includes("Phantom") ||
      navigator.userAgent.includes("Trust") ||
      navigator.userAgent.includes("CoinbaseWallet") ||
      navigator.userAgent.includes("Rainbow") ||
      navigator.userAgent.includes("Argent") ||
      navigator.userAgent.includes("imToken") ||
      navigator.userAgent.includes("1inch") ||
      navigator.userAgent.includes("TokenPocket") ||
      navigator.userAgent.includes("MathWallet") ||
      navigator.userAgent.includes("SafePal") ||
      navigator.userAgent.includes("WalletConnect");
    const hasWebSpeechAPI =
      "webkitSpeechRecognition" in window || "SpeechRecognition" in window;
    // AGGRESSIVE FIX: Force Firefox mode for ANY wallet browser
    const actualFirefoxMode = state.isFirefoxMode || isWalletBrowser;

    if (!actualFirefoxMode) {
      // For Chrome/Safari, process immediately and auto-send
      setTimeout(() => {
        setState((prev) => {
          const currentTranscript = prev.transcript.trim();
          if (
            currentTranscript &&
            !currentTranscript.includes("Recording...") &&
            stopReasonRef.current !== "cancel"
          ) {
            // Auto-send the transcript immediately
            onTranscriptionComplete?.(currentTranscript, true);
          }
          return {
            ...prev,
            isProcessing: false,
            audioLevel: 0,
            silenceDetected: false,
          };
        });
      }, 500);
    }
    // For Firefox/Wallet browsers, processing happens in mediaRecorder.onstop
  }, [onTranscriptionComplete, state.isFirefoxMode, state.transcript, debug]);

  const clearTranscript = useCallback(() => {
    setState((prev) => ({ ...prev, transcript: "", error: null }));
  }, []);

  const cancelRecording = useCallback(() => {
    if (debug) console.debug("[voice] cancelRecording");
    stopReasonRef.current = "cancel";
    // cancel RAF loop
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    isRecordingRef.current = false;
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        if (workletNodeRef.current) {
          workletNodeRef.current.disconnect();
          workletNodeRef.current.port.onmessage = () => {};
          workletNodeRef.current = null;
        }
        if (analyserRef.current) {
          analyserRef.current.disconnect();
        }
      } catch {}
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setState((prev) => ({
      ...prev,
      isRecording: false,
      isProcessing: false,
      transcript: "",
      error: null,
      audioLevel: 0,
      silenceDetected: false,
    }));
  }, [debug]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelRecording();
    };
  }, [cancelRecording]);

  return {
    ...state,
    startRecording,
    stopRecording,
    clearTranscript,
    cancelRecording,
  };
};

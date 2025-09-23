"use client";
import React from "react";
import { motion } from "framer-motion";
import { useVoiceRecording } from "@/hooks/useVoiceRecording";

interface VoiceRecordingButtonProps {
  onTranscriptionComplete: (text: string, autoSend?: boolean) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
}

// Live waveform canvas renderer for mic input
const LiveWaveform: React.FC<
  { samples: Float32Array | null } & { height?: number }
> = ({ samples, height = 24 }) => {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const logicalWidth = canvas.clientWidth;
    const logicalHeight = height;
    canvas.width = Math.max(1, Math.floor(logicalWidth * dpr));
    canvas.height = Math.max(1, Math.floor(logicalHeight * dpr));
    ctx.scale(dpr, dpr);

    // Clear
    ctx.clearRect(0, 0, logicalWidth, logicalHeight);

    // Background bar line
    ctx.fillStyle = "#e5e7eb"; // gray-200
    ctx.fillRect(0, (logicalHeight - 2) / 2, logicalWidth, 2);

    if (!samples || samples.length === 0) {
      return;
    }

    // Draw waveform as polyline
    ctx.strokeStyle = "#ef4444"; // red-500
    ctx.lineWidth = 2;
    ctx.beginPath();
    const N = samples.length;
    for (let i = 0; i < N; i++) {
      const x = (i / (N - 1)) * logicalWidth;
      const y = (0.5 - samples[i] * 0.45) * logicalHeight; // scale 0.45 to keep inside
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }, [samples, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height }}
      className="block"
    />
  );
};

export const VoiceRecordingButton: React.FC<VoiceRecordingButtonProps> = ({
  onTranscriptionComplete,
  size = "md",
  className = "",
}) => {
  const {
    isRecording,
    isProcessing,
    isSupported,
    isCheckingSupport,
    startRecording,
    stopRecording,
    cancelRecording,
    silenceDetected,
  } = useVoiceRecording({
    onTranscriptionComplete: onTranscriptionComplete,
    onError: (error: string) => {
      console.error("Voice recording error:", error);
    },
    autoSubmit: true,

    onWaveform: (samples) => {
      setWaveform(samples);
    },
  });

  const [waveform, setWaveform] = React.useState<Float32Array | null>(null);

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  const iconSizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const handleClick = () => {
    if (!isSupported || isCheckingSupport) return;

    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Recording state: inline waveform
  if (isRecording) {
    return (
      <div
        className={`flex items-center space-x-3 rounded-full px-4 py-2 transition-colors ${
          silenceDetected ? "bg-yellow-100" : "bg-gray-100"
        }`}
      >
        <motion.button
          onClick={stopRecording}
          className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white hover:bg-red-600 transition-colors"
          whileTap={{ scale: 0.95 }}
        >
          <div className="w-3 h-3 bg-white rounded-sm" />
        </motion.button>

        <div className="flex-1 min-w-0">
          <LiveWaveform samples={waveform} height={24} />
        </div>

        {silenceDetected && (
          <span className="text-xs text-yellow-600 font-medium">
            Stopping...
          </span>
        )}

        <button
          onClick={cancelRecording}
          className="text-gray-400 hover:text-gray-600 transition-colors p-1"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    );
  }

  // Processing state
  if (isProcessing) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
          />
        </div>
        <span className="text-sm text-gray-600">Processing...</span>
      </div>
    );
  }

  // Default microphone button
  return (
    <motion.button
      onClick={handleClick}
      disabled={!isSupported || isCheckingSupport}
      className={`
        ${sizeClasses[size]}
        rounded-full flex items-center justify-center
        text-white font-medium transition-all duration-200
        disabled:cursor-not-allowed disabled:opacity-50
        bg-blue-500 hover:bg-blue-600
        ${className}
      `}
      whileHover={isSupported && !isCheckingSupport ? { scale: 1.05 } : {}}
      whileTap={isSupported && !isCheckingSupport ? { scale: 0.95 } : {}}
    >
      {isCheckingSupport ? (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className={`${iconSizeClasses[size]} border-2 border-white border-t-transparent rounded-full`}
        />
      ) : (
        <svg
          className={iconSizeClasses[size]}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      )}
    </motion.button>
  );
};

export default VoiceRecordingButton;

import { NextRequest, NextResponse } from "next/server";

// Server-side transcription API route (more secure)
// This keeps your OpenAI API key on the server side
export async function POST(request: NextRequest) {
  try {
    // Check if API key is available
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI API key not configured on server" },
        { status: 500 }
      );
    }

    // Get the uploaded audio file
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    // Validate file size (max 25MB as per OpenAI limits)
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (audioFile.size > maxSize) {
      return NextResponse.json(
        { error: "Audio file too large. Maximum size is 25MB." },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ["audio/webm", "audio/mp4", "audio/mpeg", "audio/wav"];
    if (!allowedTypes.includes(audioFile.type)) {
      return NextResponse.json(
        {
          error:
            "Invalid audio format. Supported formats: webm, mp4, mpeg, wav",
        },
        { status: 400 }
      );
    }

    // Prepare the request to OpenAI
    const openAIFormData = new FormData();
    openAIFormData.append("file", audioFile);
    openAIFormData.append("model", "whisper-1");
    openAIFormData.append("language", "en"); // Optional: specify language
    openAIFormData.append("response_format", "json");

    // Call OpenAI Whisper API
    const response = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: openAIFormData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error("OpenAI API error:", response.status, errorData);

      if (response.status === 429) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Please try again later." },
          { status: 429 }
        );
      }

      if (response.status === 401) {
        return NextResponse.json(
          { error: "Invalid API key configuration" },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { error: "Transcription service temporarily unavailable" },
        { status: 503 }
      );
    }

    const result = await response.json();

    // Return the transcription
    return NextResponse.json({
      transcript: result.text || "",
      language: result.language || "en",
      duration: result.duration || 0,
    });
  } catch (error) {
    console.error("Transcription API error:", error);

    return NextResponse.json(
      { error: "Internal server error during transcription" },
      { status: 500 }
    );
  }
}

// Optional: Add rate limiting middleware
// export async function middleware() {
//   // Implement rate limiting here if needed
//   // Example: Redis-based rate limiting by IP or user ID
//   return NextResponse.next();
// }

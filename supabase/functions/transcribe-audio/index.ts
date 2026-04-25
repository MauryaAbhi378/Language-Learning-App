import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const transcriptionInstructions = {
  chinese:
    "Transcribe the spoken Mandarin Chinese into Pinyin with tone marks. Return ONLY the Pinyin text. Do not output Hanzi or English.",
  japanese:
    "Transcribe the spoken Japanese into Romaji. Return ONLY the Romaji text. Do not output kana, kanji, or English.",
  german:
    "Transcribe the spoken German into a simple pronunciation spelling using Latin letters. Return ONLY the pronunciation text. Do not translate to English.",
  korean:
    "Transcribe the spoken Korean into romanized Korean. Return ONLY the romanization text. Do not output Hangul or English.",
} as const;

type TranscriptionLanguage = keyof typeof transcriptionInstructions;

const isTranscriptionLanguage = (
  language: unknown,
): language is TranscriptionLanguage =>
  typeof language === "string" && language in transcriptionInstructions;

const buildTranscriptionPrompt = (language: TranscriptionLanguage) =>
  [
    "You are a transcription assistant.",
    transcriptionInstructions[language],
    "If no speech is detected, respond with an empty message.",
    "Never reveal that you are an AI model, say sorry, or say that you do not understand.",
  ].join(" ");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";

    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { inputAudio, language } = await req.json();

    if (!inputAudio || !inputAudio.data || !inputAudio.format) {
      return new Response(JSON.stringify({ error: "Missing audio data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Transcription request:", {
      language,
      format: inputAudio.format,
      size: inputAudio.data.length,
    });

    const openRouterApiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!openRouterApiKey) {
      throw new Error("OPENROUTER_API_KEY is not set");
    }

    const transcriptionLanguage = isTranscriptionLanguage(language)
      ? language
      : "chinese";

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openRouterApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite-preview-09-2025",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: buildTranscriptionPrompt(transcriptionLanguage),
                },
                {
                  type: "input_audio",
                  input_audio: {
                    data: inputAudio.data,
                    format: inputAudio.format,
                  },
                },
              ],
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter API Error:", response.status, errorText);
      return new Response(
        JSON.stringify({
          error: "OpenRouter transcription failed",
          status: response.status,
          details: errorText,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const data = await response.json();
    const transcript = data?.choices?.[0]?.message?.content;

    if (typeof transcript !== "string") {
      console.error("Unexpected OpenRouter response:", JSON.stringify(data));
      return new Response(
        JSON.stringify({
          error: "Unexpected OpenRouter response",
          details: data,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(JSON.stringify({ transcript }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

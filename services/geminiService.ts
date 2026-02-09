import { GoogleGenAI, Type } from "@google/genai";
import { PoemMetadata } from "../types.ts";
import { CONFIG } from "../config.ts";

const CACHE_KEY = 'echo_daily_line_v1';
const CACHE_TS = 'echo_daily_ts_v1';

const FALLBACK_SEEDS = [
  "The stars are just holes in the ceiling of a house we forgot we built.",
  "Silence is a conversation we aren't brave enough to have yet.",
  "We are all just ghosts wearing skin, looking for a place to haunt.",
  "Memory is a mirror that only shows the things we've lost.",
  "The bottom of the sky is closer than the top of the earth."
];

export const geminiService = {
  async getDailyLine(): Promise<string> {
    const cached = localStorage.getItem(CACHE_KEY);
    const ts = localStorage.getItem(CACHE_TS);
    const now = Date.now();

    if (cached && ts && (now - parseInt(ts)) < CONFIG.DAILY_LINE_CACHE_DURATION) {
      return cached;
    }

    try {
      const key = process.env.API_KEY;
      if (!key || key === 'undefined') throw new Error("Key missing");

      const ai = new GoogleGenAI({ apiKey: key });
      const response = await ai.models.generateContent({
        model: CONFIG.DEFAULT_MODEL,
        contents: "Generate one hauntingly beautiful, short, introspective line of poetry. No quotation marks. No explanation.",
      });
      const newLine = response.text?.trim() || FALLBACK_SEEDS[0];
      localStorage.setItem(CACHE_KEY, newLine);
      localStorage.setItem(CACHE_TS, now.toString());
      return newLine;
    } catch (error) {
      console.warn("AI Frequency Interrupted:", error);
      return cached || FALLBACK_SEEDS[Math.floor(Math.random() * FALLBACK_SEEDS.length)];
    }
  },

  async analyzePoem(content: string, providedTitle?: string): Promise<PoemMetadata> {
    try {
      const key = process.env.API_KEY;
      if (!key || key === 'undefined') throw new Error("Frequency Missing");

      const ai = new GoogleGenAI({ apiKey: key });
      const isTitleMissing = !providedTitle || providedTitle.trim() === '' || providedTitle.toLowerCase() === 'untitled';

      // Enhanced prompt with strict safety instructions
      const systemInstruction = `You are the Sanctuary Guardian for "Echo Pages", a minimalist poetry platform. 
      Your task is to analyze poetry for genre, title, and most importantly, SAFETY.
      REJECT (isSafe: false) if the text contains:
      - Explicit violence, hate speech, or dehumanizing language.
      - Explicit sexual content or graphic anatomical descriptions.
      - Self-harm glorification.
      - Profanity used in a toxic, non-poetic manner.
      
      Atmosphere: Introspective, Haunting, Dark-Academic.`;

      const response = await ai.models.generateContent({
        model: CONFIG.DEFAULT_MODEL,
        contents: `Analyze this poetic fragment. Title Provided: "${isTitleMissing ? 'None' : providedTitle}". Fragment: "${content}"`,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              genre: { type: Type.STRING },
              score: { type: Type.INTEGER },
              justification: { type: Type.STRING },
              suggestedTitle: { type: Type.STRING },
              backgroundGradient: { type: Type.STRING },
              isSafe: { type: Type.BOOLEAN },
              rejectionReason: { type: Type.STRING, description: "If isSafe is false, explain why concisely." }
            },
            required: ["genre", "score", "justification", "suggestedTitle", "backgroundGradient", "isSafe"]
          }
        }
      });

      const result = JSON.parse(response.text || "{}");
      return {
        genre: result.genre || "Minimalist",
        score: Math.max(0, Math.min(100, result.score || 70)),
        justification: result.justification || "Atmospheric resonance detected.",
        suggestedTitle: result.suggestedTitle || "A Fragmented Echo",
        backgroundGradient: result.backgroundGradient || "linear-gradient(180deg, #0f172a 0%, #1e1b4b 100%)",
        isSafe: result.isSafe ?? true,
        containsRestricted: !(result.isSafe ?? true),
        errorReason: result.rejectionReason
      };
    } catch (error: any) {
      console.warn("AI Safety Fallback active:", error);
      // If AI service fails, we assume safety for standard cases but fail for known error codes
      const isSafetyError = error?.message?.includes('SAFETY') || error?.status === 400;
      
      return {
        genre: "Minimalist",
        score: 75,
        justification: "Resonance persists despite external silence.",
        suggestedTitle: (providedTitle && providedTitle !== 'Untitled') ? providedTitle : "Silent Fragment",
        backgroundGradient: "linear-gradient(180deg, #0f172a 0%, #1e1b4b 100%)",
        isSafe: !isSafetyError,
        containsRestricted: isSafetyError,
        errorReason: isSafetyError ? "The AI Sanctuary blocked this frequency for safety reasons." : undefined
      };
    }
  }
};
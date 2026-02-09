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

      const response = await ai.models.generateContent({
        model: CONFIG.DEFAULT_MODEL,
        contents: `Act as a literary critic. Analyze: "${content}". Provided Title: "${isTitleMissing ? 'None' : providedTitle}"`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              genre: { type: Type.STRING },
              score: { type: Type.INTEGER },
              justification: { type: Type.STRING },
              suggestedTitle: { type: Type.STRING },
              backgroundGradient: { type: Type.STRING },
              isSafe: { type: Type.BOOLEAN }
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
        containsRestricted: !(result.isSafe ?? true)
      };
    } catch (error: any) {
      console.warn("AI Fallback active:", error);
      return {
        genre: "Minimalist",
        score: 75,
        justification: "Resonance persists despite external silence.",
        suggestedTitle: (providedTitle && providedTitle !== 'Untitled') ? providedTitle : "Silent Fragment",
        backgroundGradient: "linear-gradient(180deg, #0f172a 0%, #1e1b4b 100%)",
        isSafe: true,
        containsRestricted: false
      };
    }
  }
};
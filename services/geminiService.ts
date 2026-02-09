import { GoogleGenAI, Type } from "@google/genai";
import { PoemMetadata } from "../types.ts";

export const runtime = "nodejs";

const CACHE_KEY = 'echo_daily_line_v1';
const CACHE_TS = 'echo_daily_ts_v1';

const FALLBACK_SEEDS = [
  "The stars are just holes in the ceiling of a house we forgot we built.",
  "Silence is a conversation we aren't brave enough to have yet.",
  "We are all just ghosts wearing skin, looking for a place to haunt.",
  "Memory is a mirror that only shows the things we've lost.",
  "The bottom of the sky is closer than the top of the earth."
];

export const GENRE_POOL = [
  "Noir", "Ethereal", "Minimalist", "Free Verse", "Prose", "Haiku", "Lyric", 
  "Narrative", "Elegy", "Ode", "Sonnet", "Ballad", "Spiritual", "Mystical", 
  "Philosophical", "Existential", "Fragmentary", "Gothic", "Dark Poetry", 
  "Macabre", "Psychological", "Confessional", "Personal", "Meta-Poetry", 
  "Ars Poetica", "Surreal", "Absurdist"
];

/**
 * Extracts JSON even if wrapped in conversational text or different markdown block formats.
 */
const cleanJsonResponse = (text: string) => {
  if (!text) return {};
  try {
    const cleaned = text.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    const startIndex = text.indexOf('{');
    const endIndex = text.lastIndexOf('}');
    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
      try {
        const jsonOnly = text.substring(startIndex, endIndex + 1);
        return JSON.parse(jsonOnly);
      } catch (innerE) {
        console.error("AI Response extraction failed:", innerE);
        throw innerE;
      }
    }
    throw e;
  }
};

/**
 * Ensures we have a valid API Key string from the environment.
 */
const getSafeApiKey = (): string | undefined => {
  // Access key directly from process.env.API_KEY as per guidelines.
  const key = process.env.API_KEY;

  if (!key || key === 'undefined' || key === 'null' || key.length < 5) {
    console.warn("Echo Pages: API_KEY is undefined. If running locally, check .env.local. If deployed, check platform environment variables.");
    return undefined;
  }
  
  return key;
};

export const geminiService = {
  async getDailyLine(): Promise<string> {
    const cached = localStorage.getItem(CACHE_KEY);
    const ts = localStorage.getItem(CACHE_TS);
    const now = Date.now();

    if (cached && ts && (now - parseInt(ts)) < 86400000) {
      return cached;
    }

    const apiKey = getSafeApiKey();
    if (!apiKey) {
      return FALLBACK_SEEDS[0];
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: "Generate one hauntingly beautiful, short, introspective line of poetry. No quotation marks. No explanation.",
      });
      const newLine = response.text?.trim() || FALLBACK_SEEDS[0];
      localStorage.setItem(CACHE_KEY, newLine);
      localStorage.setItem(CACHE_TS, now.toString());
      return newLine;
    } catch (error) {
      console.error("Daily Line Generation Error:", error);
      return cached || FALLBACK_SEEDS[0];
    }
  },

  async analyzePoem(content: string, providedTitle?: string): Promise<PoemMetadata> {
    const apiKey = getSafeApiKey();
    if (!apiKey) {
      throw new Error("Resonance Interrupted: The void lacks an access frequency (API Key). Verify your .env.local or Vercel environment configuration.");
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const isTitleMissing = !providedTitle || providedTitle.trim() === '' || providedTitle.toLowerCase() === 'untitled';

      const prompt = `Act as a literary critic for "Echo Pages". Analyze this fragment.
        1. PREDICTED_GENRE: Exactly one from [${GENRE_POOL.join(', ')}].
        2. GENRE_SCORE: Confidence % (0-100).
        3. SUGGESTED_TITLE: Poetic, evocative 2-8 word title.
        4. JUSTIFICATION: Brief literary reason for genre choice.
        5. GRADIENT: CSS linear-gradient dark/atmospheric hex colors.
        6. SAFETY: Boolean flags for isSafe.

        TITLE PROVIDED: "${isTitleMissing ? 'None' : providedTitle}"
        CONTENT: "${content}"`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
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
              isSafe: { type: Type.BOOLEAN },
              containsRestricted: { type: Type.BOOLEAN },
              errorReason: { type: Type.STRING }
            },
            required: ["genre", "score", "justification", "suggestedTitle", "backgroundGradient", "isSafe", "containsRestricted"]
          }
        }
      });

      const result = cleanJsonResponse(response.text || "{}");
      return {
        genre: GENRE_POOL.includes(result.genre) ? result.genre : "Minimalist",
        score: Math.max(0, Math.min(100, result.score || 70)),
        justification: result.justification || "Atmospheric resonance detected.",
        suggestedTitle: result.suggestedTitle || "A Fragmented Echo",
        backgroundGradient: result.backgroundGradient || "linear-gradient(180deg, #0f172a 0%, #1e1b4b 100%)",
        isSafe: result.isSafe ?? true,
        containsRestricted: result.containsRestricted ?? false,
        errorReason: result.errorReason
      };
    } catch (error) {
      console.error("AI Analysis Failed:", error);
      return {
        genre: "Minimalist",
        score: 50,
        justification: "Processed with emergency fallback logic.",
        suggestedTitle: providedTitle || "Silent Fragment",
        backgroundGradient: "linear-gradient(180deg, #0f172a 0%, #1e1b4b 100%)",
        isSafe: true,
        containsRestricted: false
      };
    }
  }
};
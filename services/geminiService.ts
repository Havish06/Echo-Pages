import { GoogleGenAI, Type } from "@google/genai";
import { PoemMetadata } from "../types.ts";

const CACHE_KEY = 'echo_daily_line_v1';
const CACHE_TS = 'echo_daily_ts_v1';

const FALLBACK_SEEDS = [
  "The stars are just holes in the ceiling of a house we forgot we built.",
  "Silence is a conversation we aren't brave enough to have yet.",
  "We are all just ghosts wearing skin, looking for a place to haunt.",
  "Memory is a mirror that only shows the things we've lost.",
  "The wind doesn't blow; it's just the world trying to catch its breath."
];

export const GENRE_POOL = [
  "Noir", "Ethereal", "Minimalist", "Free Verse", "Prose", "Haiku", "Lyric", 
  "Narrative", "Elegy", "Ode", "Sonnet", "Ballad", "Spiritual", "Mystical", 
  "Philosophical", "Existential", "Fragmentary", "Gothic", "Dark Poetry", 
  "Macabre", "Psychological", "Confessional", "Personal", "Meta-Poetry", 
  "Ars Poetica", "Surreal", "Absurdist"
];

export const geminiService = {
  async getDailyLine(): Promise<string> {
    const cached = localStorage.getItem(CACHE_KEY);
    const ts = localStorage.getItem(CACHE_TS);
    const now = Date.now();

    if (cached && ts && (now - parseInt(ts)) < 86400000) {
      return cached;
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: "Generate one hauntingly beautiful, short, introspective line of poetry. No quotation marks. No explanation.",
      });
      const newLine = response.text?.trim() || FALLBACK_SEEDS[Math.floor(Math.random() * FALLBACK_SEEDS.length)];
      
      localStorage.setItem(CACHE_KEY, newLine);
      localStorage.setItem(CACHE_TS, now.toString());
      return newLine;
    } catch (error) {
      return cached || FALLBACK_SEEDS[Math.floor(Math.random() * FALLBACK_SEEDS.length)];
    }
  },

  async analyzePoem(content: string, providedTitle?: string): Promise<PoemMetadata> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const isTitleMissing = !providedTitle || providedTitle.trim() === '' || providedTitle.toLowerCase() === 'untitled';

      const prompt = `Act as a senior literary critic and safety sentinel for a minimalist poetry sanctuary called "Echo Pages". 
        Analyze this poetry fragment.
        
        STRICT SAFETY RULES:
        - If the content contains vulgarity, slurs, explicit sexual references, or hate speech, set isSafe: false and errorReason: "Forbidden Resonance detected."
        - The sanctuary is for introspective art. Crude language is rejected.

        LITERARY ANALYSIS CONSTRAINTS:
        1. PREDICTED_GENRE: You MUST choose exactly one from this list: [${GENRE_POOL.join(', ')}]. Do not create new genres.
        2. GENRE_SCORE: Confidence percentage (0-100) of how well it fits that genre.
        3. SUGGESTED_TITLE: Generate a poetic, evocative 2-8 word title based on the theme. Do not use generic titles like "My Poem" or "Reflections".
        4. EMOTION: One word atmospheric tag.
        5. INTENSITY: 0-100 weight.
        6. GRADIENT: CSS 'linear-gradient(180deg, #hex1 0%, #hex2 100%)' using cinematic, atmospheric dark colors.
        7. SAFETY: Boolean flags for isSafe and containsRestricted.

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
              emotionTag: { type: Type.STRING },
              emotionalWeight: { type: Type.INTEGER },
              suggestedTitle: { type: Type.STRING },
              backgroundGradient: { type: Type.STRING },
              isSafe: { type: Type.BOOLEAN },
              containsRestricted: { type: Type.BOOLEAN },
              errorReason: { type: Type.STRING }
            },
            required: ["genre", "score", "justification", "emotionTag", "emotionalWeight", "suggestedTitle", "backgroundGradient", "isSafe", "containsRestricted"]
          }
        }
      });

      const result = JSON.parse(response.text || "{}");
      return {
        genre: GENRE_POOL.includes(result.genre) ? result.genre : "Minimalist",
        score: Math.max(0, Math.min(100, result.score || 70)),
        justification: result.justification || "Atmospheric resonance detected.",
        emotionTag: result.emotionTag || "Echo",
        emotionalWeight: result.emotionalWeight || 50,
        suggestedTitle: result.suggestedTitle || "A Fragmented Echo",
        backgroundGradient: result.backgroundGradient || "linear-gradient(180deg, #0f172a 0%, #1e1b4b 100%)",
        isSafe: result.isSafe ?? true,
        containsRestricted: result.containsRestricted ?? false,
        errorReason: result.errorReason
      };
    } catch (error) {
      console.error("AI Analysis Error:", error);
      return {
        genre: "Minimalist",
        score: 50,
        justification: "Processed with default parameters.",
        emotionTag: "Residual",
        emotionalWeight: 40,
        suggestedTitle: providedTitle || "Silent Fragment",
        backgroundGradient: "linear-gradient(180deg, #0f172a 0%, #1e1b4b 100%)",
        isSafe: true,
        containsRestricted: false
      };
    }
  }
};
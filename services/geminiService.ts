
import { GoogleGenAI, Type } from "@google/genai";
import { PoemMetadata } from "../types.ts";

const CACHE_KEY = 'echo_daily_line';
const CACHE_TIME_KEY = 'echo_daily_line_timestamp';
const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

export const geminiService = {
  async getDailyLine(): Promise<string> {
    const cachedLine = localStorage.getItem(CACHE_KEY);
    const cachedTimestamp = localStorage.getItem(CACHE_TIME_KEY);
    const now = Date.now();

    if (cachedLine && cachedTimestamp && (now - parseInt(cachedTimestamp)) < TWENTY_FOUR_HOURS) {
      return cachedLine;
    }

    try {
      // Initialize inside the method to avoid module-level crashes during Vercel builds/startup
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: "Generate one hauntingly beautiful, short, introspective line of poetry. No quotation marks. No explanation.",
        config: {
            temperature: 0.9,
            topP: 0.95,
        }
      });
      const newLine = response.text?.trim() || "The echoes are louder than the voices.";
      
      localStorage.setItem(CACHE_KEY, newLine);
      localStorage.setItem(CACHE_TIME_KEY, now.toString());
      
      return newLine;
    } catch (error) {
      console.error("Error generating daily line:", error);
      return cachedLine || "Silence is the only thing we truly own.";
    }
  },

  async analyzePoem(content: string): Promise<PoemMetadata> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze this poem for its emotional characteristics. Provide a short emotion tag (one word), an emotional weight (0-100), a suggested title, and a subtle CSS linear-gradient background (dark colors) that reflects the mood. Poem: "${content}"`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              emotionTag: { type: Type.STRING },
              emotionalWeight: { type: Type.NUMBER },
              suggestedTitle: { type: Type.STRING },
              backgroundGradient: { type: Type.STRING }
            },
            required: ["emotionTag", "emotionalWeight", "suggestedTitle", "backgroundGradient"]
          }
        }
      });
      
      const result = JSON.parse(response.text || '{}');
      return {
        emotionTag: result.emotionTag || 'Echo',
        emotionalWeight: result.emotionalWeight || 50,
        suggestedTitle: result.suggestedTitle || 'Untitled Echo',
        backgroundGradient: result.backgroundGradient || 'linear-gradient(135deg, #1a1a1a 0%, #2d3436 100%)'
      };
    } catch (error) {
      console.error("Error analyzing poem:", error);
      return {
        emotionTag: 'Quiet',
        emotionalWeight: 50,
        suggestedTitle: 'Fragment',
        backgroundGradient: 'linear-gradient(135deg, #1a1a1a 0%, #2d3436 100%)'
      };
    }
  }
};

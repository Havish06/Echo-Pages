
import { GoogleGenAI, Type } from "@google/genai";
import { PoemMetadata } from "../types.ts";

export const geminiService = {
  async getDailyLine(): Promise<string> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: "Generate one hauntingly beautiful, short, introspective line of poetry. No quotation marks. No explanation.",
      });
      return response.text?.trim() || "Silence is the only thing we truly own.";
    } catch (error) {
      console.error("Daily Line Fetch Error:", error);
      return "The void is quiet today, yet full of echoes.";
    }
  },

  async analyzePoem(content: string, title?: string): Promise<PoemMetadata> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Analyze this poem fragment. 
        1. Classify emotion (1 word).
        2. Emotional weight (0-100).
        3. If no title provided, suggest a title based strictly on genre and context.
        4. Dark CSS gradient.
        5. Safety check: Is it profane or explicit? (boolean).
        6. Restricted words: Does it contain profanity or toxic language? (boolean).
        7. Genre Detection: Identify which fits best: Noir, Ethereal, Minimalist, Free Verse, Prose, or Haiku.
        8. Accuracy: How well does it fit that detected genre? (0-100).
        
        Title provided: "${title || 'None'}"
        Poem: "${content}"`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              emotionTag: { type: Type.STRING },
              emotionalWeight: { type: Type.NUMBER },
              suggestedTitle: { type: Type.STRING },
              backgroundGradient: { type: Type.STRING },
              isSafe: { type: Type.BOOLEAN },
              containsRestricted: { type: Type.BOOLEAN },
              detectedGenre: { type: Type.STRING },
              genreScore: { type: Type.NUMBER }
            },
            required: ["emotionTag", "emotionalWeight", "suggestedTitle", "backgroundGradient", "isSafe", "containsRestricted", "detectedGenre", "genreScore"]
          }
        }
      });
      
      const result = JSON.parse(response.text || '{}');
      return {
        emotionTag: result.emotionTag || 'Echo',
        emotionalWeight: result.emotionalWeight || 50,
        suggestedTitle: result.suggestedTitle || 'Untitled Echo',
        backgroundGradient: result.backgroundGradient || 'linear-gradient(135deg, #1a1a1a 0%, #2d3436 100%)',
        isSafe: result.isSafe ?? true,
        containsRestricted: result.containsRestricted ?? false,
        detectedGenre: result.detectedGenre || 'Free Verse',
        genreScore: result.genreScore || 75
      };
    } catch (error) {
      console.error("Analysis Error:", error);
      return {
        emotionTag: 'Static',
        emotionalWeight: 0,
        suggestedTitle: 'Fragment',
        backgroundGradient: 'linear-gradient(135deg, #000 0%, #111 100%)',
        isSafe: true,
        containsRestricted: false,
        detectedGenre: 'Free Verse',
        genreScore: 75
      };
    }
  }
};

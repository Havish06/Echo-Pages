
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { PoemMetadata } from "../types.ts";

export const geminiService = {
  async getDailyLine(): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "Generate one hauntingly beautiful, short, introspective line of poetry. No quotation marks. No explanation.",
    });
    return response.text?.trim() || "Silence is the only thing we truly own.";
  },

  async analyzePoem(content: string): Promise<PoemMetadata> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze this poem. 
        1. Classify emotion (1 word).
        2. Emotional weight (0-100).
        3. Title suggestion.
        4. Dark CSS gradient.
        5. Safety check: Is it profane or toxic? (boolean).
        6. Genre Detection: Identify which genre fits best: Noir, Ethereal, Minimalist, Free Verse, Prose, or Haiku.
        7. Accuracy: How well does it fit that detected genre? (0-100).
        
        Poem: "${content}"`,
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
              detectedGenre: { type: Type.STRING },
              genreScore: { type: Type.NUMBER }
            },
            required: ["emotionTag", "emotionalWeight", "suggestedTitle", "backgroundGradient", "isSafe", "detectedGenre", "genreScore"]
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
        detectedGenre: result.detectedGenre || 'Free Verse',
        genreScore: result.genreScore || 0
      };
    } catch (error) {
      console.error("Analysis Error:", error);
      return {
        emotionTag: 'Static',
        emotionalWeight: 0,
        suggestedTitle: 'Fragment',
        backgroundGradient: 'linear-gradient(135deg, #000 0%, #111 100%)',
        isSafe: true,
        detectedGenre: 'Free Verse',
        genreScore: 0
      };
    }
  },

  async getPoemAudio(title: string, content: string): Promise<string | undefined> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Read this poem titled "${title}" with a slow, introspective, and hauntingly calm pace. Poem content: ${content}`;
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' }, // Haunting, deeper voice
            },
          },
        },
      });

      return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    } catch (error) {
      console.error("TTS Error:", error);
      return undefined;
    }
  }
};

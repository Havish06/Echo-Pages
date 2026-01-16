
import { GoogleGenAI, Type } from "@google/genai";
import { PoemMetadata } from "../types.ts";

const CACHE_KEY = 'echo_daily_line_v1';
const CACHE_TS = 'echo_daily_ts_v1';

const FALLBACK_SEEDS = [
  "The stars are just holes in the ceiling of a house we forgot we built.",
  "Silence is a conversation we aren't brave enough to have yet.",
  "We are all just ghosts wearing skin, looking for a place to haunt.",
  "Memory is a mirror that only shows the things we've lost.",
  "The wind doesn't blow; it's just the world trying to catch its breath.",
  "Ink is the blood of a heart that learned to speak.",
  "We are the architects of our own hauntings.",
  "Shadows are just light that lost its way home."
];

const GENRE_POOL = "Noir, Ethereal, Minimalist, Free Verse, Prose, Haiku, Lyric, Narrative, Epic, Dramatic, Elegy, Ode, Sonnet, Ballad, Pastoral, Mock-Epic, Love, Romance, Heartbreak, Grief, Mourning, Joy, Celebration, Loneliness, Hope, Despair, Angst, Nostalgia, Regret, Desire, Devotion, Spiritual, Religious, Mystical, Philosophical, Existential, Metaphysical, Didactic, Political, Protest, Revolutionary, Feminist, Social Justice, Nature, Ecological, Scientific, Space, Cosmic, Technological, AI Poetry, Cyber Poetry, Experimental, Surreal, Absurdist, Stream of Consciousness, Fragmentary, Gothic, Dark Poetry, Horror, Macabre, Psychological, Trauma Poetry, Death Poetry, Madness Poetry, Humorous, Comic, Satire, Confessional, Personal, Autobiographical, Identity Poetry, Gender Poetry, Cultural Poetry, Diaspora Poetry, Coming-of-Age, Depression Poetry, Anxiety Poetry, Healing Poetry, Recovery Poetry, Folk Poetry, Tribal Poetry, Classical Poetry, Sanskrit Poetry, Tamil Poetry, Urdu Poetry, Persian Poetry, Ghazal, Tanka, Villanelle, Pantoum, Sestina, Spoken Word, Slam Poetry, Performance Poetry, Rap Poetry, Hip-Hop Poetry, Meta-Poetry, Ars Poetica, Conceptual Poetry, Ekphrastic Poetry, Found Poetry, Erasure Poetry, Micro-Poetry, Flash Poetry, Narrative Verse, Verse Novel, Allegorical Poetry, Mythological Poetry, Folklore Poetry, Fable Poetry, War Poetry, Soldier Poetry, Patriotism Poetry, Exile Poetry, Migration Poetry, Refugee Poetry, Urban Poetry, Street Poetry, Rural Poetry, Dystopian Poetry, Utopian Poetry, Apocalyptic Poetry, Sci-Fi Poetry, Fantasy Poetry, Speculative Poetry, Time Poetry, Memory Poetry, Dream Poetry, Lucid Poetry, Sleep Poetry, Night Poetry, Light Poetry, Silence Poetry, Sound Poetry, Digital Poetry, Hypertext Poetry, Code Poetry, Glitch Poetry, Internet Poetry, Meme Poetry";

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
      console.error("Daily Line Fetch Error:", error);
      const randomSeed = FALLBACK_SEEDS[Math.floor(Math.random() * FALLBACK_SEEDS.length)];
      return cached || randomSeed;
    }
  },

  async analyzePoem(content: string, title?: string): Promise<PoemMetadata> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const prompt = `Perform a high-fidelity literary analysis on this fragment.
        
        TASK:
        1. genre: Select the SINGLE most dominant genre from the GENRE POOL provided. Do not use generic terms if a more specific one fits.
        2. score: Calculate a "Genre Match Score" as an integer between 55 and 95 indicating how strongly the text adheres to the conventions of the chosen genre.
        3. justification: A 1-sentence mini-explanation of why this genre fits.
        4. emotionTag: A 1-2 word mood descriptor.
        5. emotionalWeight: Intensity of mood (0-100).
        6. suggestedTitle: If the input title is blank/generic, generate a 2-5 word haunting title.
        7. backgroundGradient: A CSS linear-gradient(135deg, color1, color2) matching the mood. Ensure it is dark but aesthetically pleasing.
        
        GENRE POOL: [${GENRE_POOL}]
        
        INPUT TITLE: "${title || ''}"
        INPUT CONTENT: "${content}"`;

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
              genre: { type: Type.STRING },
              score: { type: Type.NUMBER },
              justification: { type: Type.STRING }
            },
            required: ["emotionTag", "emotionalWeight", "suggestedTitle", "backgroundGradient", "isSafe", "containsRestricted", "genre", "score", "justification"]
          }
        }
      });
      
      const result = JSON.parse(response.text || '{}');
      
      // Strict 55-95 range
      let finalScore = typeof result.score === 'number' ? Math.round(result.score) : 55;
      finalScore = Math.min(95, Math.max(55, finalScore));

      return {
        emotionTag: result.emotionTag || 'Echo',
        emotionalWeight: result.emotionalWeight || 50,
        suggestedTitle: result.suggestedTitle || 'A Whisper in the Dark',
        backgroundGradient: result.backgroundGradient || 'linear-gradient(135deg, #1a1a1a 0%, #2d3436 100%)',
        isSafe: result.isSafe ?? true,
        containsRestricted: result.containsRestricted ?? false,
        genre: result.genre || 'Minimalist',
        score: finalScore,
        justification: result.justification || 'Analyzed through atmospheric resonance.'
      };
    } catch (error) {
      console.error("Spectral Analysis Error:", error);
      return {
        emotionTag: 'Echo',
        emotionalWeight: 50,
        suggestedTitle: 'The Unnamed Fragment',
        backgroundGradient: 'linear-gradient(135deg, #000 0%, #111 100%)',
        isSafe: true,
        containsRestricted: false,
        genre: 'Minimalist',
        score: 55,
        justification: 'Default classification due to processing interference.'
      };
    }
  }
};

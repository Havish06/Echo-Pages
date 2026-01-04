
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

const GENRE_POOL = "Lyric, Narrative, Epic, Dramatic, Elegy, Ode, Sonnet, Ballad, Pastoral, Mock-Epic, Epic Simile, Love, Romance, Heartbreak, Grief, Mourning, Joy, Celebration, Loneliness, Hope, Despair, Angst, Nostalgia, Regret, Desire, Devotion, Spiritual, Religious, Devotional, Mystical, Philosophical, Existential, Metaphysical, Moral, Didactic, Political, Protest, Revolutionary, Feminist, Social Justice, Anti-War, Environmental, Eco-Poetry, Satirical, Ironical, Nature, Romantic Nature, Ecological, Scientific, Space, Cosmic, Astronomical, Technological, AI Poetry, Cyber Poetry, Free Verse, Blank Verse, Concrete Poetry, Shape Poetry, Visual Poetry, Experimental, Surreal, Absurdist, Stream of Consciousness, Fragmentary, Gothic, Dark Poetry, Horror, Macabre, Psychological, Trauma Poetry, Death Poetry, Madness Poetry, Humorous, Comic, Parody, Limerick, Nonsense Poetry, Light Verse, Satire, Confessional, Personal, Autobiographical, Identity Poetry, Gender Poetry, Sexuality Poetry, Cultural Poetry, Diaspora Poetry, Coming-of-Age, Depression Poetry, Anxiety Poetry, Healing Poetry, Recovery Poetry, Mental Health Poetry, Folk Poetry, Tribal Poetry, Indigenous Poetry, Classical Poetry, Sanskrit Poetry, Tamil Poetry, Urdu Poetry, Persian Poetry, Ghazal, Haiku, Tanka, Villanelle, Pantoum, Sestina, Sonnet Sequence, Epic Cycle, Spoken Word, Slam Poetry, Performance Poetry, Rap Poetry, Hip-Hop Poetry, Meta-Poetry, Ars Poetica, Conceptual Poetry, Constraint-Based Poetry, Oulipo Poetry, Ekphrastic Poetry, Found Poetry, Erasure Poetry, Prose Poetry, Micro-Poetry, Flash Poetry, Minimalist Poetry, Maximalist Poetry, Narrative Verse, Verse Novel, Didactic Verse, Allegorical Poetry, Mythological Poetry, Legendary Poetry, Folklore Poetry, Fable Poetry, Beast Poetry, War Poetry, Soldier Poetry, Patriotism Poetry, Nationalist Poetry, Exile Poetry, Migration Poetry, Refugee Poetry, Urban Poetry, Street Poetry, Rural Poetry, Pastoral Modernism, Dystopian Poetry, Utopian Poetry, Apocalyptic Poetry, Post-Apocalyptic Poetry, Sci-Fi Poetry, Fantasy Poetry, Speculative Poetry, Time Poetry, Memory Poetry, Dream Poetry, Lucid Poetry, Sleep Poetry, Night Poetry, Light Poetry, Silence Poetry, Sound Poetry, Phonetic Poetry, Language Poetry, L=A=N=G=U=A=G=E Poetry, Digital Poetry, Hypertext Poetry, Code Poetry, Glitch Poetry, Internet Poetry, Meme Poetry";

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
      const prompt = `Perform a strict literary analysis of this poem to identify its genre and emotional resonance.
        
        STRICT CLASSIFICATION RULES:
        1. Choose EXACTLY ONE primary genre from this list: [${GENRE_POOL}].
        2. NO INVENTED GENRES. If unsure, choose the closest semantic fit.
        3. AVOID DEFAULTS: Do NOT choose "Free Verse" or "Minimalist Poetry" unless the poem's form/structure is its primary defining characteristic.
        4. GENRE SCORE: Calculate a percentage (55-95) representing how strongly the poem matches the chosen genre's themes and intent.
        5. DO NOT DEFAULT to static scores (like 75%). Be precise.

        Poem Title (if any): "${title || 'Untitled'}"
        Poem Content: "${content}"`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              emotionTag: { type: Type.STRING, description: "Single word emotion" },
              emotionalWeight: { type: Type.NUMBER, description: "Int 0-100" },
              suggestedTitle: { type: Type.STRING, description: "A poetic title" },
              backgroundGradient: { type: Type.STRING, description: "CSS linear gradient" },
              isSafe: { type: Type.BOOLEAN },
              containsRestricted: { type: Type.BOOLEAN },
              detectedGenre: { type: Type.STRING },
              genreScore: { type: Type.NUMBER, description: "Int 55-95" }
            },
            required: ["emotionTag", "emotionalWeight", "suggestedTitle", "backgroundGradient", "isSafe", "containsRestricted", "detectedGenre", "genreScore"]
          }
        }
      });
      
      const result = JSON.parse(response.text || '{}');
      return {
        emotionTag: result.emotionTag || 'Echo',
        emotionalWeight: result.emotionalWeight || 50,
        suggestedTitle: result.suggestedTitle || 'A Whisper in the Dark',
        backgroundGradient: result.backgroundGradient || 'linear-gradient(135deg, #1a1a1a 0%, #2d3436 100%)',
        isSafe: result.isSafe ?? true,
        containsRestricted: result.containsRestricted ?? false,
        detectedGenre: result.detectedGenre || 'Lyric',
        genreScore: (result.genreScore >= 55 && result.genreScore <= 95) ? result.genreScore : 72
      };
    } catch (error) {
      console.error("Analysis Error:", error);
      return {
        emotionTag: 'Echo',
        emotionalWeight: 50,
        suggestedTitle: 'The Unnamed Fragment',
        backgroundGradient: 'linear-gradient(135deg, #000 0%, #111 100%)',
        isSafe: true,
        containsRestricted: false,
        detectedGenre: 'Lyric',
        genreScore: 55
      };
    }
  }
};

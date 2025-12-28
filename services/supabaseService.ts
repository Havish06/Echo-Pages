
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { Poem } from '../types.ts';

// Provided Supabase credentials
const supabaseUrl = 'https://wctibhidceonfjmzxbrl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjdGliaGlkY2VvbmZqbXp4YnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2Mzg3NTYsImV4cCI6MjA4MjIxNDc1Nn0.8ZK2qKfAH56Y6rTfBhUidtWbNJhXGTP8IcuSsP9NLsw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const mapFromDb = (data: any): Poem => {
  if (!data) return {} as Poem;
  
  // Robust timestamp parsing: handles BigInt numbers, ISO strings, or nulls
  let ts = Date.now();
  const rawTs = data.timestamp || data.created_at || data.ts;
  
  if (rawTs) {
    if (typeof rawTs === 'number') {
      ts = rawTs;
    } else {
      const parsed = new Date(rawTs).getTime();
      if (!isNaN(parsed)) ts = parsed;
    }
  }

  return {
    id: String(data.id || Math.random().toString(36).substr(2, 9)),
    title: data.title || 'Untitled',
    content: data.content || '',
    author: data.author || 'Observer',
    timestamp: ts,
    emotionTag: data.emotion_tag || 'Fragment',
    emotionalWeight: data.emotional_weight || 50,
    tone: data.tone || 'melancholic',
    genre: data.genre || 'Poetry',
    backgroundColor: data.background_color || 'linear-gradient(135deg, #1a1a1a 0%, #2d3436 100%)'
  };
};

const mapToDb = (poem: Poem) => ({
  title: poem.title || 'Untitled',
  content: poem.content || '',
  author: poem.author || 'Observer',
  emotion_tag: poem.emotionTag || 'Fragment',
  emotional_weight: poem.emotionalWeight || 50,
  tone: poem.tone || 'melancholic',
  genre: poem.genre || 'Poetry',
  background_color: poem.backgroundColor || 'linear-gradient(135deg, #1a1a1a 0%, #2d3436 100%)',
  // Send as a number (bigint) to match your current database schema cache
  timestamp: Math.floor(poem.timestamp || Date.now())
});

export const supabaseService = {
  async getAdminPoems(): Promise<Poem[]> {
    try {
      const { data, error } = await supabase
        .from('admin_poems')
        .select('*');
      
      if (error) {
        console.error("Supabase Admin Fetch Error:", error.message, error.details);
        return [];
      }
      return (data || []).map(mapFromDb).sort((a, b) => b.timestamp - a.timestamp);
    } catch (e: any) {
      console.error("Supabase Exception (Admin):", e);
      return [];
    }
  },

  async getEchoes(): Promise<Poem[]> {
    try {
      const { data, error } = await supabase
        .from('echoes')
        .select('*');
      
      if (error) {
        console.error("Supabase Echoes Fetch Error:", error.message, error.details);
        return [];
      }
      return (data || []).map(mapFromDb).sort((a, b) => b.timestamp - a.timestamp);
    } catch (e: any) {
      console.error("Supabase Exception (Echoes):", e);
      return [];
    }
  },

  async createEcho(poem: Poem): Promise<Poem | null> {
    try {
      const dbEntry = mapToDb(poem);
      const { data, error } = await supabase
        .from('echoes')
        .insert([dbEntry])
        .select();
      
      if (error) {
        console.error("Supabase Insert Error (Echo):", error.message, error.details, "Payload:", JSON.stringify(dbEntry, null, 2));
        return null;
      }
      return (data && data.length > 0) ? mapFromDb(data[0]) : null;
    } catch (e: any) {
      console.error("Supabase Exception (Create Echo):", e);
      return null;
    }
  },

  async createAdminPoem(poem: Poem): Promise<Poem | null> {
    try {
      const dbEntry = mapToDb(poem);
      const { data, error } = await supabase
        .from('admin_poems')
        .insert([dbEntry])
        .select();
      
      if (error) {
        console.error("Supabase Insert Error (Admin):", error.message, error.details, "Payload:", JSON.stringify(dbEntry, null, 2));
        return null;
      }
      return (data && data.length > 0) ? mapFromDb(data[0]) : null;
    } catch (e: any) {
      console.error("Supabase Exception (Create Admin):", e);
      return null;
    }
  }
};

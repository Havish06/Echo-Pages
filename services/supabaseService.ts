
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { Poem } from '../types.ts';

// Provided Supabase credentials
const supabaseUrl = 'https://wctibhidceonfjmzxbrl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjdGliaGlkY2VvbmZqbXp4YnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2Mzg3NTYsImV4cCI6MjA4MjIxNDc1Nn0.8ZK2qKfAH56Y6rTfBhUidtWbNJhXGTP8IcuSsP9NLsw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const mapFromDb = (data: any): Poem => {
  if (!data) return {} as Poem;
  
  // Robust timestamp parsing
  let ts = Date.now();
  if (data.timestamp) {
    ts = typeof data.timestamp === 'string' ? new Date(data.timestamp).getTime() : Number(data.timestamp);
  } else if (data.created_at) {
    ts = new Date(data.created_at).getTime();
  }

  return {
    id: String(data.id || Math.random().toString(36).substr(2, 9)),
    title: data.title || 'Untitled',
    content: data.content || '',
    author: data.author || 'Observer',
    timestamp: isNaN(ts) ? Date.now() : ts,
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
  // Fix: Property 'emotional_weight' does not exist on type 'Poem'. Using 'emotionalWeight' instead.
  emotional_weight: poem.emotionalWeight || 50,
  tone: poem.tone || 'melancholic',
  genre: poem.genre || 'Poetry',
  background_color: poem.backgroundColor || 'linear-gradient(135deg, #1a1a1a 0%, #2d3436 100%)',
  // Ensure we send a valid ISO string to satisfy 'timestamp' NOT NULL constraints
  timestamp: new Date(poem.timestamp || Date.now()).toISOString()
});

export const supabaseService = {
  async getAdminPoems(): Promise<Poem[]> {
    try {
      const { data, error } = await supabase
        .from('admin_poems')
        .select('*');
      
      if (error) {
        console.error("Supabase Admin Fetch Error Details:", error);
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
        console.error("Supabase Echoes Fetch Error Details:", error);
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
      const dbPoem = mapToDb(poem);
      const { data, error } = await supabase
        .from('echoes')
        .insert([dbPoem])
        .select();
      
      if (error) {
        console.error("Supabase Echo Insert Error Details:", error);
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
      const dbPoem = mapToDb(poem);
      const { data, error } = await supabase
        .from('admin_poems')
        .insert([dbPoem])
        .select();
      
      if (error) {
        console.error("Supabase Admin Insert Error Details:", error);
        return null;
      }
      return (data && data.length > 0) ? mapFromDb(data[0]) : null;
    } catch (e: any) {
      console.error("Supabase Exception (Create Admin):", e);
      return null;
    }
  }
};


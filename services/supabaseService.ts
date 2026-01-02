
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { Poem, UserProfile, LeaderboardEntry } from '../types.ts';

const supabaseUrl = 'https://wctibhidceonfjmzxbrl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjdGliaGlkY2VvbmZqbXp4YnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2Mzg3NTYsImV4cCI6MjA4MjIxNDc1Nn0.8ZK2qKfAH56Y6rTfBhUidtWbNJhXGTP8IcuSsP9NLsw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Maps database snake_case columns to the application's Poem interface.
 * Ensures all types are correctly cast from the Supabase response.
 */
const mapFromDb = (data: any): Poem => ({
  id: String(data.id),
  title: data.title || 'Untitled',
  content: data.content || '',
  author: data.author || 'Anonymous',
  userId: data.user_id || '',
  timestamp: data.created_at ? new Date(data.created_at).getTime() : Date.now(),
  emotionTag: data.emotion_tag || 'Echo',
  emotionalWeight: Number(data.emotional_weight) || 50,
  score: Number(data.score) || 0,
  tone: (data.tone as any) || 'melancholic',
  genre: data.genre || 'Free Verse',
  backgroundColor: data.background_color || 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)'
});

export const supabaseService = {
  async getEchoes(): Promise<Poem[]> {
    try {
      const { data, error } = await supabase
        .from('echoes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Supabase Echoes Fetch Error:", error.message);
        return [];
      }
      return (data || []).map(mapFromDb);
    } catch (e) {
      console.error("Unexpected Error in getEchoes:", e);
      return [];
    }
  },

  async getAdminPoems(): Promise<Poem[]> {
    try {
      const { data, error } = await supabase
        .from('admin_poems')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Supabase Admin Poems Fetch Error:", error.message);
        return [];
      }
      return (data || []).map(mapFromDb);
    } catch (e) {
      console.error("Unexpected Error in getAdminPoems:", e);
      return [];
    }
  },

  async createEcho(poem: Partial<Poem>): Promise<Poem | null> {
    const payload = {
      title: poem.title,
      content: poem.content,
      author: poem.author,
      user_id: poem.userId,
      emotion_tag: poem.emotionTag,
      emotional_weight: poem.emotionalWeight,
      score: poem.score,
      genre: poem.genre,
      tone: poem.tone || 'melancholic',
      background_color: poem.backgroundColor,
    };

    const { data, error } = await supabase
      .from('echoes')
      .insert([payload])
      .select();
    
    if (error) {
      console.error("Supabase Echo Creation Error:", error.message);
      return null;
    }
    return data ? mapFromDb(data[0]) : null;
  },

  async createAdminCurate(poem: Partial<Poem>): Promise<Poem | null> {
    const payload = {
      title: poem.title,
      content: poem.content,
      author: 'Admin',
      user_id: 'admin',
      emotion_tag: poem.emotionTag,
      emotional_weight: poem.emotionalWeight,
      score: poem.score,
      genre: poem.genre,
      tone: poem.tone || 'melancholic',
      background_color: poem.backgroundColor,
    };

    const { data, error } = await supabase
      .from('admin_poems')
      .insert([payload])
      .select();

    if (error) {
      console.error("Supabase Admin Creation Error:", error.message);
      return null;
    }
    return data ? mapFromDb(data[0]) : null;
  },

  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    try {
      const { data, error } = await supabase
        .from('echoes')
        .select('user_id, author, score')
        .gt('created_at', oneWeekAgo.toISOString());
        
      if (error) {
        console.error("Leaderboard Fetch Error:", error.message);
        return [];
      }
      
      const userMap: Record<string, { total: number, count: number, name: string }> = {};
      data?.forEach(d => {
        if (!d.user_id) return;
        if (!userMap[d.user_id]) userMap[d.user_id] = { total: 0, count: 0, name: d.author || 'Anonymous' };
        userMap[d.user_id].total += Number(d.score) || 0;
        userMap[d.user_id].count += 1;
      });

      return Object.entries(userMap).map(([id, val]) => ({
        userId: id,
        username: val.name,
        score: Math.round(val.total / (val.count || 1)),
        poemCount: val.count
      })).sort((a, b) => b.score - a.score);
    } catch (e) {
      return [];
    }
  }
};


import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { Poem, LeaderboardEntry } from '../types.ts';

const supabaseUrl = 'https://wctibhidceonfjmzxbrl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjdGliaGlkY2VvbmZqbXp4YnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2Mzg3NTYsImV4cCI6MjA4MjIxNDc1Nn0.8ZK2qKfAH56Y6rTfBhUidtWbNJhXGTP8IcuSsP9NLsw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const authService = {
  async signup(email: string, password: string, displayName: string) {
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: { display_name: displayName || email.split('@')[0] }
      }
    });

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('already registered') || msg.includes('already exists')) {
        throw new Error("Account already exists. Please log in.");
      }
      throw new Error(error.message || "Identity initialization failed.");
    }
    
    return data;
  },

  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('invalid login credentials')) {
        throw new Error("Frequency mismatch. Please check your credentials.");
      }
      throw new Error(error.message || "Verification failed.");
    }
    return data;
  },

  async loginWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
    if (error) throw error;
  },

  async logout() {
    await supabase.auth.signOut();
    window.location.hash = '#/';
  },

  async updateDisplayName(newName: string) {
    const { data, error } = await supabase.auth.updateUser({
      data: { display_name: newName }
    });
    if (error) throw error;
    return data;
  }
};

const mapFromDb = (data: any): Poem => ({
  id: String(data.id),
  title: data.title || 'Untitled',
  content: data.content || '',
  author: data.author || 'Anonymous',
  userId: data.user_id || '',
  timestamp: data.created_at ? new Date(data.created_at).getTime() : Date.now(),
  emotionTag: data.emotion_tag || 'Echo',
  emotionalWeight: Number(data.emotional_weight) || 50,
  score: data.score !== undefined && data.score !== null ? Number(data.score) : 0,
  tone: (data.tone as any) || 'melancholic',
  genre: data.genre || 'Echo',
  backgroundColor: data.background_color || 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)'
});

export const supabaseService = {
  async getEchoes(): Promise<Poem[]> {
    try {
      const { data, error } = await supabase.from('echoes').select('*').order('created_at', { ascending: false });
      if (error) return [];
      return (data || []).map(mapFromDb);
    } catch (e) { return []; }
  },

  async getAdminPoems(): Promise<Poem[]> {
    try {
      const { data, error } = await supabase.from('admin_poems').select('*').order('created_at', { ascending: false });
      if (error) return [];
      return (data || []).map(mapFromDb);
    } catch (e) { return []; }
  },

  async createEcho(poem: Partial<Poem>): Promise<Poem | null> {
    const payload = {
      title: poem.title,
      content: poem.content,
      author: poem.author,
      user_id: poem.userId,
      emotion_tag: poem.emotionTag,
      emotional_weight: poem.emotionalWeight,
      score: poem.score ?? 0,
      genre: poem.genre || 'Echo',
      tone: poem.tone || 'melancholic',
      background_color: poem.backgroundColor,
    };
    const { data, error } = await supabase.from('echoes').insert([payload]).select();
    if (error) return null;
    return data ? mapFromDb(data[0]) : null;
  },

  async createAdminPoem(poem: Partial<Poem>): Promise<Poem | null> {
    const payload = {
      title: poem.title,
      content: poem.content,
      author: 'Admin',
      user_id: 'admin',
      emotion_tag: poem.emotionTag,
      emotional_weight: poem.emotionalWeight,
      score: poem.score ?? 100,
      genre: poem.genre || 'Curated',
      tone: poem.tone || 'melancholic',
      background_color: poem.backgroundColor,
    };
    const { data, error } = await supabase.from('admin_poems').insert([payload]).select();
    if (error) return null;
    return data ? mapFromDb(data[0]) : null;
  },

  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    try {
      // Aggregate real scores from the database
      const { data, error } = await supabase.from('echoes').select('user_id, author, score');
      if (error) return [];
      
      const userMap: Record<string, { totalScore: number, count: number, name: string }> = {};
      data?.forEach(d => {
        if (!d.user_id) return;
        if (!userMap[d.user_id]) {
          userMap[d.user_id] = { totalScore: 0, count: 0, name: d.author || 'Anonymous' };
        }
        userMap[d.user_id].totalScore += (d.score ?? 0);
        userMap[d.user_id].count += 1;
      });

      return Object.entries(userMap)
        .map(([id, val]) => ({
          userId: id,
          username: val.name,
          displayName: val.name,
          score: Math.round(val.totalScore / val.count),
          poemCount: val.count
        }))
        .sort((a, b) => b.poemCount - a.poemCount || b.score - a.score)
        .slice(0, 10);
    } catch (e) { return []; }
  }
};

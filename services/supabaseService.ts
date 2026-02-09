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
        data: { 
          display_name: displayName || email.split('@')[0],
          username: email.split('@')[0],
          avatar_url: `https://api.dicebear.com/7.x/shapes/svg?seed=${email}`
        }
      }
    });
    if (error) throw new Error(error.message);
    return data;
  },

  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
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

  async updateProfile(metadata: { display_name?: string, username?: string, avatar_url?: string }) {
    const { data, error } = await supabase.auth.updateUser({
      data: metadata
    });
    if (error) throw error;
    return data;
  }
};

const mapFromDb = (data: any, forceVisibility?: 'read' | 'echoes'): Poem => ({
  id: String(data.id),
  title: data.title || '...',
  content: data.content || '',
  author: data.author || 'Anonymous',
  userId: data.user_id || '',
  timestamp: data.created_at ? new Date(data.created_at).getTime() : Date.now(),
  score: Number(data.score) || 0,
  tone: 'melancholic', 
  genre: data.genre || 'Echo',
  justification: data.justification || '',
  backgroundColor: data.background_color || '',
  visibility: forceVisibility || 'echoes'
});

export const supabaseService = {
  async getEchoes(): Promise<Poem[]> {
    const { data, error } = await supabase.from('echoes').select('*').order('created_at', { ascending: false });
    return error ? [] : (data || []).map(d => mapFromDb(d, 'echoes'));
  },

  async getAdminPoems(): Promise<Poem[]> {
    const { data, error } = await supabase.from('admin_poems').select('*').order('created_at', { ascending: false });
    return error ? [] : (data || []).map(d => mapFromDb(d, 'read'));
  },

  async createEcho(poem: Partial<Poem>): Promise<Poem | null> {
    const { data, error } = await supabase.from('echoes').insert([{
      title: poem.title,
      content: poem.content,
      author: poem.author,
      user_id: poem.userId,
      score: poem.score,
      genre: poem.genre,
      justification: poem.justification,
      background_color: poem.backgroundColor
    }]).select();
    return (data && data[0]) ? mapFromDb(data[0], 'echoes') : null;
  },

  async createAdminPoem(poem: Partial<Poem>): Promise<Poem | null> {
    const { data, error } = await supabase.from('admin_poems').insert([{
      title: poem.title,
      content: poem.content,
      author: 'Admin',
      user_id: poem.userId || 'admin',
      score: poem.score,
      genre: poem.genre,
      justification: poem.justification,
      background_color: poem.backgroundColor
    }]).select();
    return (data && data[0]) ? mapFromDb(data[0], 'read') : null;
  },

  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    const { data, error } = await supabase.from('echoes').select('user_id, author, score');
    if (error) return [];
    const userMap: Record<string, any> = {};
    data?.forEach(d => {
      if (!userMap[d.user_id]) userMap[d.user_id] = { totalScore: 0, count: 0, name: d.author };
      userMap[d.user_id].totalScore += (d.score ?? 0);
      userMap[d.user_id].count += 1;
    });
    return Object.entries(userMap).map(([id, val]: any) => ({
      userId: id,
      username: val.name,
      displayName: val.name,
      score: Math.round(val.totalScore / val.count),
      poemCount: val.count
    })).sort((a, b) => b.poemCount - a.poemCount).slice(0, 10);
  }
};
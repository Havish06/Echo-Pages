
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { Poem, LeaderboardEntry } from '../types.ts';
import { ADMIN_CREDENTIALS } from '../constants.ts';

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
    const isAdminAttempt = email.toLowerCase() === ADMIN_CREDENTIALS.email.toLowerCase();
    
    if (isAdminAttempt && password !== ADMIN_CREDENTIALS.password) {
      throw new Error("Frequency mismatch for privileged access.");
    }

    let { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error && isAdminAttempt) {
      try {
        await this.signup(email, password, 'Admin');
        const retry = await supabase.auth.signInWithPassword({ email, password });
        if (retry.error) throw retry.error;
        return retry.data;
      } catch (signupError) {}
    }

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

const mapFromDb = (data: any, forceVisibility?: 'read' | 'echoes'): Poem => {
  if (!data || typeof data !== 'object') {
    throw new Error("Spectral data corruption: Object undefined.");
  }
  
  if (data.id === undefined || data.id === null) {
    throw new Error("Spectral data corruption: Identity missing.");
  }

  return {
    id: String(data.id),
    title: data.title || '...',
    content: data.content || '',
    author: data.author || 'Anonymous',
    userId: data.user_id || '',
    timestamp: data.created_at ? new Date(data.created_at).getTime() : Date.now(),
    emotionTag: data.emotion_tag || 'Echo',
    emotionalWeight: Number(data.emotional_weight) || 50,
    score: data.score !== undefined && data.score !== null ? Number(data.score) : 0,
    tone: 'melancholic', 
    genre: data.genre || 'Echo',
    justification: data.justification || '',
    backgroundColor: data.background_color || 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
    visibility: forceVisibility || 'echoes'
  };
};

export const supabaseService = {
  async getEchoes(): Promise<Poem[]> {
    try {
      const { data, error } = await supabase.from('echoes').select('*').order('created_at', { ascending: false });
      if (error) return [];
      return (data || []).filter(d => d && d.id !== undefined).map(d => mapFromDb(d, 'echoes'));
    } catch (e) { return []; }
  },

  async getAdminPoems(): Promise<Poem[]> {
    try {
      const { data, error } = await supabase.from('admin_poems').select('*').order('created_at', { ascending: false });
      if (error) return [];
      return (data || []).filter(d => d && d.id !== undefined).map(d => mapFromDb(d, 'read'));
    } catch (e) { return []; }
  },

  async createEcho(poem: Partial<Poem>): Promise<Poem | null> {
    const payload: any = {
      title: poem.title || 'Untitled',
      content: poem.content,
      author: poem.author,
      user_id: poem.userId,
      emotion_tag: poem.emotionTag || 'Echo',
      emotional_weight: Math.round(poem.emotionalWeight || 50),
      score: Math.round(poem.score ?? 0),
      genre: poem.genre || 'Echo',
      background_color: poem.backgroundColor || 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)'
    };

    // Only add justification if it exists to prevent schema mismatch if column is missing
    if (poem.justification) {
      payload.justification = poem.justification;
    }
    
    const { data, error } = await supabase.from('echoes').insert([payload]).select();
    if (error) {
      console.error("Supabase Echo Creation Error Detail:", JSON.stringify(error, null, 2));
      
      // Fallback: If justification column doesn't exist, try without it
      if (error.message?.includes('column "justification" does not exist')) {
        delete payload.justification;
        const retry = await supabase.from('echoes').insert([payload]).select();
        if (!retry.error && retry.data?.[0]) return mapFromDb(retry.data[0], 'echoes');
      }
      return null;
    }
    return (data && data.length > 0 && data[0]) ? mapFromDb(data[0], 'echoes') : null;
  },

  async createAdminPoem(poem: Partial<Poem>): Promise<Poem | null> {
    const payload: any = {
      title: poem.title || 'Untitled',
      content: poem.content,
      author: 'Admin',
      user_id: poem.userId || 'admin',
      emotion_tag: poem.emotionTag || 'Curated',
      emotional_weight: Math.round(poem.emotionalWeight || 50),
      score: Math.round(poem.score ?? 100),
      genre: poem.genre || 'Curated',
      background_color: poem.backgroundColor || 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)'
    };

    if (poem.justification) {
      payload.justification = poem.justification;
    }
    
    const { data, error } = await supabase.from('admin_poems').insert([payload]).select();
    if (error) {
      console.error("Supabase Admin Poem Creation Error Detail:", JSON.stringify(error, null, 2));
      if (error.message?.includes('column "justification" does not exist')) {
        delete payload.justification;
        const retry = await supabase.from('admin_poems').insert([payload]).select();
        if (!retry.error && retry.data?.[0]) return mapFromDb(retry.data[0], 'read');
      }
      return null;
    }
    return (data && data.length > 0 && data[0]) ? mapFromDb(data[0], 'read') : null;
  },

  async updatePoem(id: string, visibility: 'read' | 'echoes', updates: Partial<Poem>): Promise<Poem | null> {
    if (!id) return null;
    const table = visibility === 'read' ? 'admin_poems' : 'echoes';
    const payload: any = {};
    
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.emotionTag !== undefined) payload.emotion_tag = updates.emotionTag;
    if (updates.emotionalWeight !== undefined) payload.emotional_weight = Math.round(updates.emotionalWeight);
    if (updates.score !== undefined) payload.score = Math.round(updates.score);
    if (updates.genre !== undefined) payload.genre = updates.genre;
    if (updates.justification !== undefined) payload.justification = updates.justification;
    if (updates.backgroundColor !== undefined) payload.background_color = updates.backgroundColor;

    const numericId = Number(id);
    const filterId = isNaN(numericId) ? id : numericId;

    const { data, error } = await supabase.from(table).update(payload).eq('id', filterId).select();
    if (error) {
      console.error(`Supabase Update Error (${table}):`, JSON.stringify(error, null, 2));
      // Fallback for missing justification column
      if (error.message?.includes('column "justification" does not exist')) {
        delete payload.justification;
        const retry = await supabase.from(table).update(payload).eq('id', filterId).select();
        if (!retry.error && retry.data?.[0]) return mapFromDb(retry.data[0], visibility);
      }
      return null;
    }
    return (data && data.length > 0 && data[0]) ? mapFromDb(data[0], visibility) : null;
  },

  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    try {
      const { data, error } = await supabase.from('echoes').select('user_id, author, score');
      if (error) return [];
      
      const userMap: Record<string, { totalScore: number, count: number, name: string }> = {};
      data?.forEach(d => {
        if (!d || !d.user_id) return;
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


import { createClient } from '@supabase/supabase-js';
import { Poem, LeaderboardEntry, UserProfile } from '../types.ts';

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

const mapFromDb = (data: any, prefix: string, currentUserId?: string): Poem => ({
  id: prefix + String(data.id),
  title: data.title || '...',
  content: data.content || '',
  author: data.author || 'Anonymous',
  userId: data.user_id || '',
  timestamp: data.created_at ? new Date(data.created_at).getTime() : Date.now(),
  score: Number(data.score) || 0,
  genre: data.genre || 'Echo',
  tone: data.tone || 'melancholic',
  justification: data.justification || '',
  backgroundColor: data.background_color || '',
  visibility: data.visibility || 'echoes',
  isEdited: data.is_edited || false
});

export const supabaseService = {
  async getEchoes(currentUserId?: string): Promise<Poem[]> {
    // In a real app, we'd use a view or join to get reaction counts and user's reaction
    const { data, error } = await supabase.from('echoes').select('*').order('created_at', { ascending: false });
    if (error) return [];
    
    const echoes = (data || []).map(d => {
      return mapFromDb(d, 'u-', currentUserId);
    });
    return echoes;
  },

  async getAdminPoems(currentUserId?: string): Promise<Poem[]> {
    const { data, error } = await supabase.from('admin_poems').select('*').order('created_at', { ascending: false });
    if (error) return [];
    const poems = (data || []).map(d => {
      return mapFromDb(d, 'a-', currentUserId);
    });
    return poems;
  },

  async createEcho(poem: Partial<Poem>): Promise<Poem | null> {
    const { data, error } = await supabase.from('echoes').insert([{
      title: poem.title,
      content: poem.content,
      author: poem.author,
      user_id: poem.userId,
      score: poem.score,
      genre: poem.genre,
      tone: poem.tone,
      justification: poem.justification,
      background_color: poem.backgroundColor
    }]).select();
    return (data && data[0]) ? mapFromDb(data[0], 'u-') : null;
  },

  async updateEcho(id: string, updates: Partial<Poem>): Promise<boolean> {
    const rawId = id.replace('u-', '');
    const { error } = await supabase.from('echoes').update({
      title: updates.title,
      content: updates.content,
      is_edited: true
    }).eq('id', rawId);
    return !error;
  },

  async deleteEcho(id: string): Promise<boolean> {
    const rawId = id.replace('u-', '');
    const { error } = await supabase.from('echoes').delete().eq('id', rawId);
    return !error;
  },

  async createAdminPoem(poem: Partial<Poem>): Promise<Poem | null> {
    const { data, error } = await supabase.from('admin_poems').insert([{
      title: poem.title,
      content: poem.content,
      author: 'Admin',
      user_id: poem.userId || 'admin',
      score: poem.score,
      genre: poem.genre,
      tone: poem.tone,
      justification: poem.justification,
      background_color: poem.backgroundColor
    }]).select();
    return (data && data[0]) ? mapFromDb(data[0], 'a-') : null;
  },

  // Follow System
  async followUser(followerId: string, followingId: string) {
    const { error } = await supabase.from('follows').insert([{
      follower_id: followerId,
      following_id: followingId
    }]);
    return !error;
  },

  async unfollowUser(followerId: string, followingId: string) {
    const { error } = await supabase.from('follows').delete().match({
      follower_id: followerId,
      following_id: followingId
    });
    return !error;
  },

  async getFollowingIds(userId: string): Promise<string[]> {
    const { data, error } = await supabase.from('follows').select('following_id').eq('follower_id', userId);
    return error ? [] : (data || []).map(d => d.following_id);
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
  },

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const [echoes, followers, following] = await Promise.all([
        supabase.from('echoes').select('score').eq('user_id', userId),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId)
      ]);
      
      const totalPoems = echoes.data?.length || 0;
      const avgScore = totalPoems > 0 ? Math.round(echoes.data!.reduce((acc, c) => acc + (c.score || 0), 0) / totalPoems) : 0;

      return {
        id: userId,
        username: 'observer',
        displayName: 'Observer',
        totalPoems,
        avgScore,
        followersCount: followers.count || 0,
        followingCount: following.count || 0
      };
    } catch (err) {
      console.error("Error fetching user profile:", err);
      return null;
    }
  }
};

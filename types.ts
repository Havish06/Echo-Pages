
export interface UserProfile {
  id: string;
  username: string;
  avatarUrl?: string;
  totalPoems: number;
  avgScore: number;
  topGenre: string;
}

export interface Poem {
  id: string;
  title: string;
  content: string;
  author: string; // The username
  userId: string;
  timestamp: number;
  emotionTag: string;
  emotionalWeight: number; 
  score: number; // Genre match accuracy
  tone: 'melancholic' | 'hopeful' | 'livid' | 'nostalgic';
  genre: string;
  backgroundColor: string;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  score: number;
  poemCount: number;
}

export type View = 'home' | 'feed' | 'user-feed' | 'detail' | 'create' | 'about' | 'admin' | 'contact' | 'privacy' | 'profile' | 'leaderboard' | 'auth';

export interface PoemMetadata {
  emotionTag: string;
  emotionalWeight: number;
  suggestedTitle: string;
  backgroundGradient: string;
  genreScore: number;
  detectedGenre: string;
  isSafe: boolean;
}

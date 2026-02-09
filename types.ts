export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  totalPoems: number;
  avgScore: number;
  topGenre: string;
}

export interface Poem {
  id: string;
  title: string;
  content: string;
  author: string; // The display name
  userId: string;
  timestamp: number;
  score: number; // Genre match accuracy
  tone: 'melancholic' | 'hopeful' | 'livid' | 'nostalgic';
  genre: string;
  justification?: string;
  backgroundColor: string;
  visibility: 'read' | 'echoes';
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  displayName: string;
  score: number;
  poemCount: number;
}

export type View = 'home' | 'feed' | 'user-feed' | 'detail' | 'create' | 'about' | 'admin' | 'contact' | 'privacy' | 'profile' | 'leaderboard' | 'auth';

export interface PoemMetadata {
  suggestedTitle: string;
  backgroundGradient: string;
  score: number;
  genre: string;
  justification: string;
  isSafe: boolean;
  containsRestricted: boolean;
  errorReason?: string;
}
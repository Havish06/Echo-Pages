
export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  totalPoems: number;
  avgScore: number;
  followersCount: number;
  followingCount: number;
}

export interface Poem {
  id: string;
  title: string;
  content: string;
  author: string;
  userId: string;
  timestamp: number;
  score: number;
  genre: string;
  tone: string;
  justification?: string;
  backgroundColor: string;
  visibility: 'read' | 'echoes';
  isEdited?: boolean;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  displayName: string;
  score: number;
  poemCount: number;
}

export type View = 'home' | 'feed' | 'user-feed' | 'detail' | 'create' | 'about' | 'admin' | 'contact' | 'privacy' | 'profile' | 'user-profile' | 'leaderboard' | 'auth';

export interface PoemMetadata {
  suggestedTitle: string;
  backgroundGradient: string;
  score: number;
  genre: string;
  tone: string;
  justification: string;
  isSafe: boolean;
  containsRestricted: boolean;
  errorReason?: string;
}

/**
 * Echo Pages — shared type definitions
 */

export type View =
  | 'home'
  | 'feed'
  | 'user-feed'
  | 'create'
  | 'about'
  | 'contact'
  | 'privacy'
  | 'admin'
  | 'profile'
  | 'leaderboard'
  | 'auth'
  | 'detail'
  | 'user-profile';

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
  justification: string;
  backgroundColor: string;
  visibility: 'read' | 'echoes';
  isEdited: boolean;
  // Optional in some legacy components but present in the DB shape.
  likesCount?: number;
  dislikesCount?: number;
}

export interface PoemMetadata {
  genre: string;
  tone: string;
  score: number;
  justification: string;
  suggestedTitle: string;
  backgroundGradient: string;
  isSafe: boolean;
  containsRestricted: boolean;
  errorReason?: string;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  displayName: string;
  score: number;
  poemCount: number;
}

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  totalPoems: number;
  avgScore: number;
  followersCount: number;
  followingCount: number;
  avatarUrl?: string;
}

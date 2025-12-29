
export interface Poem {
  id: string;
  title: string;
  content: string;
  author: string;
  timestamp: number;
  emotionTag: string;
  emotionalWeight: number; // 0-100
  tone: 'melancholic' | 'hopeful' | 'livid' | 'nostalgic';
  genre: string;
  backgroundColor: string; // CSS gradient string
}

export interface DailyEcho {
  date: string; // YYYY-MM-DD
  line: string;
  timestamp: number;
}

export type View = 'home' | 'feed' | 'user-feed' | 'detail' | 'create' | 'about' | 'admin' | 'contact' | 'privacy';

export interface PoemMetadata {
  emotionTag: string;
  emotionalWeight: number;
  suggestedTitle: string;
  backgroundGradient: string;
}

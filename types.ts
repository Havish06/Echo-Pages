
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

export type View = 'home' | 'feed' | 'user-feed' | 'detail' | 'create' | 'about' | 'admin' | 'contact';

export interface PoemMetadata {
  emotionTag: string;
  emotionalWeight: number;
  suggestedTitle: string;
  backgroundGradient: string;
}

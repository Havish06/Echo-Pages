
import { Poem } from './types';

export const INITIAL_POEMS: Poem[] = [];

export const TONES = [
  { id: 'melancholic', label: 'Melancholic', icon: '🌑', gradient: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' },
  { id: 'hopeful', label: 'Hopeful', icon: '🌅', gradient: 'linear-gradient(135deg, #2c3e50 0%, #4ca1af 100%)' },
  { id: 'livid', label: 'Livid', icon: '🔥', gradient: 'linear-gradient(135deg, #1a1a1a 0%, #434343 100%)' },
  { id: 'nostalgic', label: 'Nostalgic', icon: '📻', gradient: 'linear-gradient(135deg, #200122 0%, #6f0000 100%)' },
] as const;

export const GENRES = [
  'Noir', 'Ethereal', 'Minimalist', 'Free Verse', 'Prose', 'Haiku'
] as const;

export const DEFAULT_GRADIENT = 'linear-gradient(135deg, #1a1a1a 0%, #2d3436 100%)';

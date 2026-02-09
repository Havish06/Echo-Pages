/**
 * Echo Pages Utilities
 * Centralized logic for UI consistency and removing duplication.
 */

const ATMOSPHERIC_PALETTE = [
  ['#0f172a', '#1e1b4b'], ['#1e1b4b', '#450a0a'], ['#020617', '#1e293b'],
  ['#2d0a0a', '#000000'], ['#1e1b0b', '#451a03'], ['#082f49', '#0c4a6e'],
  ['#171717', '#404040'], ['#312e81', '#1e1b4b'], ['#4c1d95', '#1e1b4b']
];

export const getAtmosphericGradient = (id: string) => {
  if (!id) return 'linear-gradient(180deg, #0f172a 0%, #1e1b4b 100%)';
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  const palette = ATMOSPHERIC_PALETTE[Math.abs(hash) % ATMOSPHERIC_PALETTE.length];
  return `linear-gradient(180deg, ${palette[0]} 0%, ${palette[1]} 100%)`;
};

export const getResonanceColor = (score: number) => {
  if (score < 40) return '#ef4444'; // Red
  if (score < 70) return '#f59e0b'; // Amber
  return '#10b981'; // Green
};

export const formatDate = (timestamp: number) => {
  const date = new Date(timestamp);
  return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
};

export const formatLongDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString('en-GB').replace(/\//g, ' . ');
};
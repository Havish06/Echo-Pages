
import React, { useEffect, useState } from 'react';
import { LeaderboardEntry } from '../types.ts';
import { supabaseService } from '../services/supabaseService.ts';

const Leaderboard: React.FC = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Rankings visible every day for MVP, calculation happens on each load
  const isSunday = true; 

  useEffect(() => {
    supabaseService.getLeaderboard().then(setEntries).finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-6 py-20 space-y-16 animate-fade-in">
      <header className="text-center space-y-4">
        <h1 className="instrument-serif italic text-6xl">The Hierarchy</h1>
        <p className="text-[10px] uppercase tracking-[0.4em] opacity-40">Resonant Voices by Contribution</p>
      </header>

      {loading ? (
        <div className="text-center py-20 opacity-20 italic instrument-serif text-2xl">Calculating ranks...</div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry, idx) => (
            <div 
              key={entry.userId}
              className="flex items-center justify-between border border-echo-border p-8 hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center space-x-8">
                <span className="instrument-serif text-4xl opacity-10">#{idx + 1}</span>
                <div className="space-y-1">
                  <h3 className="serif-font text-2xl italic">@{entry.displayName}</h3>
                  <p className="text-[10px] uppercase tracking-widest opacity-30">{entry.poemCount} fragments recorded</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl instrument-serif opacity-70">{entry.score}</div>
                <div className="text-[8px] uppercase tracking-widest opacity-20">Mastery Score</div>
              </div>
            </div>
          ))}
          {entries.length === 0 && (
            <div className="text-center py-40 space-y-6">
              <p className="instrument-serif text-3xl italic opacity-60">"The silence is absolute. No echoes detected."</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Leaderboard;

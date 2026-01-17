
import React, { useEffect, useState } from 'react';
import { LeaderboardEntry } from '../types.ts';
import { supabaseService } from '../services/supabaseService.ts';

const Leaderboard: React.FC = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabaseService.getLeaderboard().then(setEntries).finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-6 py-20 space-y-16 animate-fade-in">
      <header className="text-center space-y-4">
        <h1 className="instrument-serif italic text-6xl text-white">The Hierarchy</h1>
        <p className="text-[10px] uppercase tracking-[0.4em] opacity-90 text-white font-black">Resonant Voices by Contribution</p>
      </header>

      {loading ? (
        <div className="text-center py-20 opacity-80 italic instrument-serif text-2xl text-white">Calculating ranks...</div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry, idx) => (
            <div 
              key={entry.userId}
              className="flex items-center justify-between border border-white/20 p-8 hover:bg-white/[0.08] transition-colors group"
            >
              <div className="flex items-center space-x-10">
                <span className="instrument-serif text-5xl opacity-70 group-hover:opacity-100 transition-opacity text-white">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <div className="space-y-1">
                  <h3 className="instrument-serif text-3xl text-white group-hover:italic">@{entry.username}</h3>
                  <p className="text-[9px] uppercase tracking-widest opacity-80 text-white font-bold">{entry.poemCount} Fragments Committed</p>
                </div>
              </div>
              
              <div className="text-right space-y-1">
                <div className="text-4xl instrument-serif text-white font-bold">{entry.score}%</div>
                <p className="text-[9px] uppercase tracking-widest opacity-80 text-white font-black">Avg. Mastery</p>
              </div>
            </div>
          ))}
          
          {entries.length === 0 && (
            <div className="text-center py-20 border border-white/10 opacity-70 italic instrument-serif text-2xl text-white">
              No one has yet claimed their place in the hierarchy.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Leaderboard;

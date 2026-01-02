
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
        <h1 className="instrument-serif italic text-6xl">The Hierarchy</h1>
        <p className="text-[10px] uppercase tracking-[0.4em] opacity-40">Weekly Genre Accuracy Ranking</p>
      </header>

      {loading ? (
        <div className="text-center py-20 opacity-20 italic instrument-serif">Calculating frequencies...</div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry, idx) => (
            <div 
              key={entry.userId}
              className="group flex items-center justify-between border border-echo-border p-8 hover:border-echo-text/20 transition-all duration-500"
            >
              <div className="flex items-center space-x-8">
                <span className="instrument-serif text-3xl opacity-20 group-hover:opacity-100 transition-opacity">0{idx + 1}</span>
                <div className="space-y-1">
                  <h3 className="serif-font text-2xl italic">@{entry.username || 'Anonymous'}</h3>
                  <p className="text-[10px] uppercase tracking-widest opacity-30">{entry.poemCount} fragments echoed</p>
                </div>
              </div>
              
              <div className="text-right space-y-2">
                <div className="text-3xl instrument-serif font-medium">{entry.score}%</div>
                <div className="w-24 h-1 bg-white/5 relative overflow-hidden">
                   <div className="absolute inset-y-0 left-0 bg-white/40" style={{ width: `${entry.score}%` }} />
                </div>
              </div>
            </div>
          ))}
          {entries.length === 0 && <p className="text-center py-20 opacity-20 italic">No rankings yet this week.</p>}
        </div>
      )}
    </div>
  );
};

export default Leaderboard;

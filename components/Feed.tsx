
import React from 'react';
import { Poem } from '../types.ts';

interface FeedProps {
  poems: Poem[];
  onSelectPoem: (id: string) => void;
  variant?: 'list' | 'grid';
}

const Feed: React.FC<FeedProps> = ({ poems, onSelectPoem, variant = 'grid' }) => {
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}-${m}-${y}`;
  };

  const getDeterministicCharcoal = (id: string) => {
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const charcoals = ['#1a1a1a', '#1e1e1e', '#141414', '#161616', '#1c1c1c'];
    return charcoals[hash % charcoals.length];
  };

  const containerClass = "max-w-7xl mx-auto px-6 py-12";
  const gridClass = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10";

  return (
    <div className={containerClass}>
      <div className={gridClass}>
        {poems.map((poem, index) => (
          <article 
            key={poem.id}
            onClick={() => onSelectPoem(poem.id)}
            className="group cursor-pointer border border-echo-border p-8 md:p-10 flex flex-col justify-between hover:border-white/20 hover:shadow-2xl transition-all duration-500 animate-fade-in relative overflow-hidden rounded-sm"
            style={{ 
              animationDelay: `${index * 50}ms`, 
              animationFillMode: 'both',
              background: getDeterministicCharcoal(poem.id)
            }}
          >
            {/* Aesthetic card structure */}
            <div className="space-y-8 relative z-10">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/90 bg-white/20 px-3 py-1 rounded-full whitespace-nowrap">
                  {poem.genre || 'Echo'}
                  {poem.score > 0 ? ` · ${poem.score}% Match` : ''}
                </span>
                {poem.score > 0 && (
                   <div className="w-1.5 h-1.5 rounded-full bg-white/50 group-hover:bg-white/90 transition-colors" />
                )}
              </div>

              <h2 className="instrument-serif text-3xl md:text-4xl uppercase tracking-tight leading-[1.1] group-hover:italic transition-all duration-300 text-white/95 group-hover:text-white">
                {poem.title || (poem.score === 0 ? 'WHISPERING...' : 'UNTITLED')}
              </h2>
            </div>

            <div className="mt-12 space-y-6 relative z-10">
              <div className="h-[1px] w-full bg-white/20 group-hover:bg-white/40 transition-colors" />

              <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-semibold text-white/80">
                <span className="italic group-hover:text-white">@{poem.author}</span>
                <span className="font-mono text-[9px] opacity-100">{formatDate(poem.timestamp)}</span>
              </div>

              <div className="text-[9px] uppercase tracking-[0.5em] font-bold text-white/70 group-hover:text-white transition-all pt-2 flex items-center gap-2">
                Observe Echo 
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
            
            {/* Background texture/glow effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </article>
        ))}
      </div>
      
      {poems.length === 0 && (
        <div className="text-center py-40 opacity-70 instrument-serif italic text-2xl text-white">
          The void remains empty.
        </div>
      )}
    </div>
  );
};

export default Feed;

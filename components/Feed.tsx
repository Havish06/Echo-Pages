
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

  const containerClass = "max-w-7xl mx-auto px-6 py-12";
  const gridClass = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10";

  return (
    <div className={containerClass}>
      <div className={gridClass}>
        {poems.map((poem, index) => (
          <article 
            key={poem.id}
            onClick={() => onSelectPoem(poem.id)}
            className="group cursor-pointer border border-echo-border p-10 flex flex-col justify-between hover:scale-[1.01] transition-all duration-500 animate-fade-in relative overflow-hidden"
            style={{ 
              animationDelay: `${index * 50}ms`, 
              animationFillMode: 'both',
              background: poem.backgroundColor || 'var(--echo-bg)'
            }}
          >
            {/* Subtle Overlay to ensure text readability */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-20 transition-opacity pointer-events-none" />
            
            <div className="space-y-10 relative z-10">
              <div className="text-[11px] uppercase tracking-[0.3em] font-bold text-white/90 flex items-center gap-2">
                <span>{poem.genre} · {poem.score === 0 ? 'Analyzing...' : `${poem.score}% Match`}</span>
              </div>

              <h2 className="instrument-serif text-3xl md:text-4xl uppercase tracking-tight leading-none group-hover:italic transition-all duration-300 text-white">
                {poem.title || (poem.score === 0 ? 'WHISPERING...' : 'UNTITLED FRAGMENT')}
              </h2>
            </div>

            <div className="space-y-6 mt-16 relative z-10">
              <hr className="border-white/10" />

              <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-medium text-white/60">
                <span className="italic font-normal">Posted by @{poem.author}</span>
                <span className="font-mono">{formatDate(poem.timestamp)}</span>
              </div>

              <div className="text-[10px] uppercase tracking-[0.5em] font-bold text-white/20 group-hover:text-white/80 transition-all pt-2">
                Observe Echo
              </div>
            </div>
          </article>
        ))}
      </div>
      
      {poems.length === 0 && (
        <div className="text-center py-40 opacity-20 instrument-serif italic text-2xl">
          The void remains empty.
        </div>
      )}
    </div>
  );
};

export default Feed;

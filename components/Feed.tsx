
import React from 'react';
import { Poem } from '../types.ts';

interface FeedProps {
  poems: Poem[];
  onSelectPoem: (id: string) => void;
}

const Feed: React.FC<FeedProps> = ({ poems, onSelectPoem }) => {
  return (
    <div className="max-w-7xl mx-auto px-6 py-20">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
        {poems.map((poem, index) => (
          <article 
            key={poem.id}
            onClick={() => onSelectPoem(poem.id)}
            className="group cursor-pointer border border-echo-border p-10 flex flex-col h-full hover:border-echo-text/20 transition-all duration-700 hover:-translate-y-1 animate-fade-in"
            style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
          >
            <div className="flex justify-between items-start mb-8">
              <div className="flex flex-col space-y-1">
                <span className="text-[10px] uppercase tracking-widest opacity-40 font-medium">
                  {poem.genre}
                </span>
                <span className="text-[10px] italic opacity-30">@{poem.author}</span>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold opacity-60">{poem.score}% Match</div>
                <div className="w-12 h-[2px] bg-white/5 mt-1 overflow-hidden">
                  <div className="h-full bg-white/30" style={{ width: `${poem.score}%` }} />
                </div>
              </div>
            </div>

            <h2 className="instrument-serif text-3xl mb-12 group-hover:italic transition-all duration-500">
              {poem.title}
            </h2>

            <div className="mt-auto flex items-center justify-between pt-10 border-t border-echo-border/5 opacity-40 group-hover:opacity-100 transition-opacity duration-700">
              <span className="text-[10px] uppercase tracking-widest font-medium">Observe Echo</span>
              <span className="text-[10px] opacity-20">{new Date(poem.timestamp).toLocaleDateString()}</span>
            </div>
          </article>
        ))}
      </div>
      
      {poems.length === 0 && (
        <div className="text-center py-40 opacity-30 instrument-serif italic text-2xl">
          The void remains empty.
        </div>
      )}
    </div>
  );
};

export default Feed;

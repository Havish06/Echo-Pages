
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
            style={{ 
              animationDelay: `${index * 100}ms`,
              animationFillMode: 'both'
            }}
          >
            <div className="flex justify-between items-start mb-8">
              <span className="text-[10px] uppercase tracking-widest opacity-40 font-medium">
                {poem.emotionTag}
              </span>
              <span className="text-[10px] opacity-20">
                {new Date(poem.timestamp).toLocaleDateString()}
              </span>
            </div>

            <h2 className="instrument-serif text-3xl mb-6 group-hover:italic transition-all duration-500">
              {poem.title}
            </h2>

            <p className="serif-font opacity-60 line-clamp-4 leading-relaxed italic mb-8 flex-grow">
              {poem.content}
            </p>

            <div className="flex items-center justify-between pt-6 border-t border-echo-border opacity-0 group-hover:opacity-100 transition-opacity duration-700">
              <span className="text-[10px] uppercase tracking-widest font-medium">Read more</span>
              <div className="h-[1px] w-12 bg-echo-muted opacity-20" />
            </div>
          </article>
        ))}
      </div>
      
      {poems.length === 0 && (
        <div className="text-center py-40 opacity-30 instrument-serif italic text-2xl animate-fade-in">
          The void is silent. No echos yet.
        </div>
      )}
    </div>
  );
};

export default Feed;

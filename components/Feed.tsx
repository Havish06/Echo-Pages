
import React, { useState, useMemo } from 'react';
import { Poem } from '../types.ts';
import { GENRES, TONES } from '../constants.ts';
import { getAtmosphericGradient, getResonanceColor, formatDate } from '../utils.ts';

interface FeedProps {
  poems: Poem[];
  onSelectPoem: (id: string) => void;
  followingIds?: string[];
  onNavigateUser?: (userId: string) => void;
}

const Feed: React.FC<FeedProps> = ({ poems, onSelectPoem, followingIds = [], onNavigateUser }) => {
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedTone, setSelectedTone] = useState('');

  const filteredPoems = useMemo(() => {
    const filtered = poems.filter(p => {
      const matchesSearch = search === '' || p.title.toLowerCase().includes(search.toLowerCase()) || p.content.toLowerCase().includes(search.toLowerCase());
      const matchesGenre = selectedGenre === '' || p.genre === selectedGenre;
      const matchesTone = selectedTone === '' || p.tone === selectedTone;
      return matchesSearch && matchesGenre && matchesTone;
    });

    // Signal > Noise Prioritization
    return filtered.sort((a, b) => {
      const aFollowed = followingIds.includes(a.userId);
      const bFollowed = followingIds.includes(b.userId);
      
      if (aFollowed && !bFollowed) return -1;
      if (!aFollowed && bFollowed) return 1;
      
      return b.timestamp - a.timestamp;
    });
  }, [poems, search, selectedGenre, selectedTone, followingIds]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white/5 p-6 border border-white/10 rounded-sm backdrop-blur-md">
        <input 
          type="text" placeholder="Search Keywords..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="bg-black/40 border border-white/10 px-4 py-3 text-[10px] uppercase tracking-widest focus:outline-none focus:border-white/40 transition-all text-white"
        />
        <select value={selectedGenre} onChange={(e) => setSelectedGenre(e.target.value)} className="bg-black/40 border border-white/10 px-4 py-3 text-[10px] uppercase tracking-widest focus:outline-none text-white">
          <option value="">All Genres</option>
          {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <select value={selectedTone} onChange={(e) => setSelectedTone(e.target.value)} className="bg-black/40 border border-white/10 px-4 py-3 text-[10px] uppercase tracking-widest focus:outline-none text-white">
          <option value="">All Tones</option>
          {TONES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
        {filteredPoems.map((poem, index) => {
          const isFollowed = followingIds.includes(poem.userId);
          return (
            <article 
              key={poem.id}
              className={`group border p-8 md:p-10 flex flex-col justify-between hover:border-white/40 transition-all duration-700 animate-fade-in relative overflow-hidden rounded-sm shadow-2xl ${isFollowed ? 'border-white/40 ring-1 ring-white/10' : 'border-echo-border'}`}
              style={{ animationDelay: `${index * 50}ms`, background: poem.backgroundColor || getAtmosphericGradient(poem.id) }}
            >
              <div onClick={() => onSelectPoem(poem.id)} className="flex-grow space-y-8 relative z-10 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-[9px] uppercase tracking-[0.2em] font-black text-white/90">{poem.genre}</span>
                    {isFollowed && (
                      <span className="bg-white/20 text-[7px] px-1.5 py-0.5 rounded-full uppercase tracking-tighter text-white font-black">Following</span>
                    )}
                  </div>
                  <span className="text-[9px] font-mono font-bold text-white/60">Match: {Math.round(poem.score)}%</span>
                </div>
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full transition-all duration-1000 ease-out" style={{ width: `${poem.score}%`, backgroundColor: getResonanceColor(poem.score) }} />
                </div>
                <h2 className="instrument-serif text-3xl md:text-4xl uppercase tracking-tight leading-[1.1] text-white/95 group-hover:text-white group-hover:italic transition-all duration-500">
                  {poem.title}
                </h2>
              </div>

              <div className="mt-8 space-y-6 relative z-10">
                <div className="h-[1px] w-full bg-white/10 group-hover:bg-white/30 transition-colors" />
                <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-bold text-white/60">
                  <span 
                    className="italic hover:text-white cursor-pointer transition-colors"
                    onClick={(e) => { e.stopPropagation(); onNavigateUser?.(poem.userId); }}
                  >
                    @{poem.author}
                  </span>
                  <span className="font-mono opacity-40">{formatDate(poem.timestamp)}</span>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      
      {filteredPoems.length === 0 && <div className="text-center py-40 opacity-80 instrument-serif italic text-2xl text-white">The silence persists.</div>}
    </div>
  );
};

export default Feed;

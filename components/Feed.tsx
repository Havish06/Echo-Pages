import React, { useState, useMemo } from 'react';
import { Poem } from '../types.ts';
import { GENRES, TONES } from '../constants.ts';
import { getAtmosphericGradient } from '../App.tsx';

interface FeedProps {
  poems: Poem[];
  onSelectPoem: (id: string) => void;
  currentUser?: any;
}

const Feed: React.FC<FeedProps> = ({ poems, onSelectPoem, currentUser }) => {
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedTone, setSelectedTone] = useState('');

  const filteredPoems = useMemo(() => {
    return poems.filter(p => {
      const matchesSearch = search === '' || 
        p.title.toLowerCase().includes(search.toLowerCase()) || 
        p.content.toLowerCase().includes(search.toLowerCase());
      const matchesGenre = selectedGenre === '' || p.genre === selectedGenre;
      const matchesTone = selectedTone === '' || p.tone === selectedTone;
      return matchesSearch && matchesGenre && matchesTone;
    });
  }, [poems, search, selectedGenre, selectedTone]);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
  };

  const getResonanceColor = (score: number) => {
    if (score < 40) return '#ef4444'; // Red
    if (score < 70) return '#f59e0b'; // Yellow/Amber
    return '#10b981'; // Green
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white/5 p-6 border border-white/10 rounded-sm backdrop-blur-md">
        <div className="relative">
          <label className="text-[8px] uppercase tracking-[0.3em] opacity-40 mb-2 block font-black text-white">Search Fragment</label>
          <input 
            type="text" 
            placeholder="Keywords..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-black/40 border border-white/10 px-4 py-3 text-[10px] uppercase tracking-widest focus:outline-none focus:border-white/40 transition-all text-white placeholder:opacity-20"
          />
        </div>
        <div>
          <label className="text-[8px] uppercase tracking-[0.3em] opacity-40 mb-2 block font-black text-white">Genre Filter</label>
          <select 
            value={selectedGenre} 
            onChange={(e) => setSelectedGenre(e.target.value)}
            className="bg-black/40 border border-white/10 px-4 py-3 text-[10px] uppercase tracking-widest focus:outline-none w-full text-white"
          >
            <option value="">All Genres</option>
            {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[8px] uppercase tracking-[0.3em] opacity-40 mb-2 block font-black text-white">Tone Filter</label>
          <select 
            value={selectedTone} 
            onChange={(e) => setSelectedTone(e.target.value)}
            className="bg-black/40 border border-white/10 px-4 py-3 text-[10px] uppercase tracking-widest focus:outline-none w-full text-white"
          >
            <option value="">All Tones</option>
            {TONES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
        {filteredPoems.map((poem, index) => {
          const backgroundStyle = poem.backgroundColor || getAtmosphericGradient(poem.id);
          const resonanceColor = getResonanceColor(poem.score);

          return (
            <article 
              key={poem.id}
              onClick={() => onSelectPoem(poem.id)}
              className="group cursor-pointer border border-echo-border p-8 md:p-10 flex flex-col justify-between hover:border-white/30 transition-all duration-700 animate-fade-in relative overflow-hidden rounded-sm shadow-2xl"
              style={{ 
                animationDelay: `${index * 50}ms`, 
                animationFillMode: 'both',
                background: backgroundStyle
              }}
            >
              {/* Tight Tiled Watermark for Cards */}
              <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.04] select-none" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='30' viewBox='0 0 80 30' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle' fill='white' font-family='serif' font-size='12' font-weight='900' opacity='0.2'%3EECHO PAGES%3C/text%3E%3C/svg%3E")`,
                backgroundRepeat: 'repeat',
                transform: 'rotate(-10deg) scale(1.1)'
              }}></div>

              <div className="flex-grow space-y-8 relative z-10">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase tracking-[0.2em] font-black text-white/90">
                      {poem.genre}
                    </span>
                    <span className="text-[9px] font-mono font-bold text-white/60">
                      Match: {Math.round(poem.score)}%
                    </span>
                  </div>
                  
                  <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full transition-all duration-1000 ease-out"
                      style={{ 
                        width: `${poem.score}%`, 
                        backgroundColor: resonanceColor,
                        boxShadow: `0 0-8px ${resonanceColor}66`
                      }}
                    />
                  </div>
                </div>

                <h2 className="instrument-serif text-3xl md:text-4xl uppercase tracking-tight leading-[1.1] text-white/95 group-hover:text-white group-hover:italic transition-all duration-500">
                  {poem.title}
                </h2>
              </div>

              <div className="mt-12 space-y-6 relative z-10">
                <div className="h-[1px] w-full bg-white/10 group-hover:bg-white/30 transition-colors" />
                <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-bold text-white/60 group-hover:text-white/95 transition-colors">
                  <span className="italic">@{poem.author}</span>
                  <span className="font-mono opacity-40">{formatDate(poem.timestamp)}</span>
                </div>
              </div>
              
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </article>
          );
        })}
      </div>
      
      {filteredPoems.length === 0 && (
        <div className="text-center py-40 opacity-80 instrument-serif italic text-2xl text-white">
          The silence persists.
        </div>
      )}
    </div>
  );
};

export default Feed;
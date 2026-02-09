import React, { useEffect, useState } from 'react';
import { Poem } from '../types.ts';
import { getAtmosphericGradient, getResonanceColor, formatLongDate } from '../utils.ts';

interface PoemDetailProps {
  poem: Poem;
  onBack: () => void;
}

const PoemDetail: React.FC<PoemDetailProps> = ({ poem, onBack }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');

  useEffect(() => {
    setIsVisible(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return () => setIsVisible(false);
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/#/p/${poem.id}`).then(() => {
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    });
  };

  const isAnalyzing = poem.score === 0 || poem.genre === 'Analyzing';

  return (
    <div 
      className={`min-h-[90vh] relative transition-all duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'} flex flex-col overflow-hidden`}
      style={{ background: poem.backgroundColor || getAtmosphericGradient(poem.id) }}
    >
      <div className="max-w-4xl mx-auto px-6 py-12 md:py-20 bg-black/40 backdrop-blur-[20px] flex-grow flex flex-col justify-center relative z-10 text-white w-full border-x border-white/5 shadow-2xl">
        <button onClick={onBack} className="flex items-center space-x-3 opacity-60 hover:opacity-100 transition-all text-[10px] uppercase tracking-[0.4em] font-black mb-16">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          <span>Back</span>
        </button>

        <article className="space-y-12">
          <header className="space-y-8">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[0.3em] text-white/90 font-black px-4 py-1.5 bg-white/10 border border-white/5">Genre: {poem.genre}</span>
              {!isAnalyzing && <span className="text-[10px] font-mono opacity-60 font-black uppercase tracking-widest">Match: {poem.score}%</span>}
            </div>
            
            {!isAnalyzing && (
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full transition-all duration-[2000ms] ease-out" style={{ width: isVisible ? `${poem.score}%` : '0%', backgroundColor: getResonanceColor(poem.score) }} />
              </div>
            )}
            
            <h1 className="instrument-serif text-5xl md:text-8xl leading-[1] italic tracking-tight text-white/95">{poem.title}</h1>
            {poem.justification && <p className="text-[10px] uppercase tracking-[0.2em] opacity-60 border-l border-white/20 pl-6 py-2 max-w-xl italic">{poem.justification}</p>}
          </header>

          <div className="serif-font text-xl md:text-3xl leading-[1.8] whitespace-pre-line italic text-white/90 py-8 tracking-wide">{poem.content}</div>

          <div className="pt-16 border-t border-white/10 flex justify-between items-center">
             <div className="flex flex-col gap-1">
                <p className="text-[9px] uppercase tracking-[0.5em] opacity-40 font-black">Resonance Origin</p>
                <span className="text-white text-[10px] uppercase tracking-widest">@{poem.author}</span>
              </div>
              <button onClick={handleCopyLink} className="px-8 py-3 border border-white/20 hover:border-white hover:bg-white/10 transition-all text-[9px] uppercase tracking-[0.4em] text-white font-black">
                {copyStatus === 'copied' ? 'Link Captured' : 'Copy Link'}
              </button>
          </div>

          <div className="pt-12 opacity-40 text-[9px] uppercase tracking-[0.5em] font-black border-t border-white/5">
            <span className="text-white">{formatLongDate(poem.timestamp)}</span>
          </div>
        </article>
      </div>
    </div>
  );
};

export default PoemDetail;
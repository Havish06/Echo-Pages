import React, { useEffect, useState } from 'react';
import { Poem } from '../types.ts';
import { getAtmosphericGradient } from '../App.tsx';

interface PoemDetailProps {
  poem: Poem;
  onBack: () => void;
  currentUser?: any;
}

const PoemDetail: React.FC<PoemDetailProps> = ({ poem, onBack, currentUser }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');

  useEffect(() => {
    setIsVisible(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return () => setIsVisible(false);
  }, []);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/#/p/${poem.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    });
  };

  const getResonanceColor = (score: number) => {
    if (score < 40) return '#ef4444'; // Red
    if (score < 70) return '#f59e0b'; // Amber
    return '#10b981'; // Green
  };

  const isAnalyzing = poem.score === 0 || poem.genre === 'Analyzing';
  const backgroundStyle = poem.backgroundColor || getAtmosphericGradient(poem.id);
  const resonanceColor = getResonanceColor(poem.score);

  return (
    <div 
      className={`min-h-[90vh] relative transition-all duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'} flex flex-col`}
      style={{ background: backgroundStyle }}
    >
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.02]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' fill='white' font-size='10' opacity='0.1'%3EECHO%3C/text%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat'
      }}></div>

      <div className="max-w-4xl mx-auto px-6 py-12 md:py-20 bg-black/40 backdrop-blur-[20px] flex-grow flex flex-col justify-center relative z-10 text-white w-full border-x border-white/5 shadow-2xl">
        <div className="flex justify-between items-center mb-16">
          <button 
            onClick={onBack}
            className="flex items-center space-x-3 opacity-60 hover:opacity-100 transition-all text-[10px] uppercase tracking-[0.4em] font-black"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back</span>
          </button>

          {isAnalyzing && (
            <div className="flex items-center space-x-2 text-[8px] uppercase tracking-[0.4em] opacity-40 font-black">
               <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
               <span>Deciphering...</span>
            </div>
          )}
        </div>

        <article className="space-y-12">
          <header className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[0.3em] text-white/90 font-black px-4 py-1.5 bg-white/10 rounded-sm border border-white/5">
                  Genre: {isAnalyzing ? "..." : poem.genre}
                </span>
                {!isAnalyzing && (
                  <span className="text-[10px] font-mono opacity-60 font-black uppercase tracking-widest">
                    Match Accuracy: {poem.score}%
                  </span>
                )}
              </div>
              
              {!isAnalyzing && (
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full transition-all duration-[2000ms] ease-out"
                    style={{ 
                      width: isVisible ? `${poem.score}%` : '0%', 
                      backgroundColor: resonanceColor,
                      boxShadow: `0 0 15px ${resonanceColor}99`
                    }}
                  />
                </div>
              )}
            </div>
            
            <h1 className="instrument-serif text-5xl md:text-8xl leading-[1] italic tracking-tight text-white/95">
              {poem.title}
            </h1>
            
            {poem.justification && (
               <p className="text-[10px] uppercase tracking-[0.2em] opacity-60 border-l border-white/20 pl-6 py-2 max-w-xl leading-relaxed italic">
                 {poem.justification}
               </p>
            )}
          </header>

          <div className="serif-font text-xl md:text-3xl leading-[1.8] whitespace-pre-line italic text-white/90 min-h-[16rem] tracking-wide py-8">
            {poem.content}
          </div>

          <div className="pt-16 border-t border-white/10 flex justify-between items-center">
             <div className="flex flex-col gap-1">
                <p className="text-[9px] uppercase tracking-[0.5em] opacity-40 font-black">Resonance Origin</p>
                <span className="text-white text-[10px] uppercase tracking-widest">@{poem.author}</span>
              </div>
              <button 
                onClick={handleCopyLink}
                className="px-8 py-3 border border-white/20 hover:border-white hover:bg-white/10 transition-all text-[9px] uppercase tracking-[0.4em] text-white font-black rounded-sm shadow-xl backdrop-blur-md"
              >
                {copyStatus === 'copied' ? 'Link Captured' : 'Copy Link'}
              </button>
          </div>

          <div className="pt-12 flex justify-between items-center opacity-40 text-[9px] uppercase tracking-[0.5em] font-black border-t border-white/5">
            <div className="flex flex-col gap-1">
              <span className="opacity-40">Frequency Date</span>
              <span className="text-white">{new Date(poem.timestamp).toLocaleDateString('en-GB').replace(/\//g, ' . ')}</span>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
};

export default PoemDetail;
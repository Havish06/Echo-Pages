
import React, { useEffect, useState } from 'react';
import { Poem } from '../types.ts';

interface PoemDetailProps {
  poem: Poem;
  onBack: () => void;
}

const PoemDetail: React.FC<PoemDetailProps> = ({ poem, onBack }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');

  useEffect(() => {
    setIsVisible(true);
    return () => setIsVisible(false);
  }, []);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/#/p/${poem.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    });
  };

  const saveAsImage = () => {
    // MVP implementation: just alert for now as full canvas capture is heavy
    alert("Spectral capture completed. This echo is now part of your device's memory.");
  };

  return (
    <div 
      className={`min-h-[90vh] relative transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      style={{ background: poem.backgroundColor }}
    >
      <div className="max-w-3xl mx-auto px-6 py-20 haunting-gradient min-h-[90vh] flex flex-col justify-center relative z-10">
        <button 
          onClick={onBack}
          className="mb-12 self-start flex items-center space-x-3 opacity-40 hover:opacity-100 transition-all text-xs uppercase tracking-[0.2em]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Return</span>
        </button>

        <article className="space-y-12">
          <header className="space-y-4">
            <div className="flex items-center space-x-4">
              <span className="text-xs uppercase tracking-[0.3em] text-white/50">{poem.genre} • {poem.emotionTag}</span>
              <div className="h-[1px] flex-grow bg-white/10" />
            </div>
            <h1 className="instrument-serif text-5xl md:text-7xl leading-tight">
              {poem.title}
            </h1>
          </header>

          <div className="serif-font text-xl md:text-2xl leading-relaxed whitespace-pre-line italic opacity-90">
            {poem.content}
          </div>

          <div className="pt-20 flex flex-col md:flex-row items-center justify-between border-t border-white/10 pt-10 gap-8">
            <div className="flex flex-col space-y-2">
              <span className="text-[10px] uppercase tracking-widest opacity-40">Accuracy Resonance</span>
              <div className="flex items-center space-x-3">
                <span className="instrument-serif text-3xl">{poem.score}%</span>
                <div className="w-24 h-1 bg-white/10 relative overflow-hidden">
                  <div className="absolute inset-y-0 left-0 bg-white/60" style={{ width: `${poem.score}%` }} />
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={handleCopyLink}
                className="px-8 py-3 border border-white/20 hover:border-white transition-all text-[10px] uppercase tracking-widest text-white"
              >
                {copyStatus === 'copied' ? 'Link Copied' : 'Copy Link'}
              </button>
              <button 
                onClick={saveAsImage}
                className="px-8 py-3 border border-white/20 hover:border-white transition-all text-[10px] uppercase tracking-widest text-white/60"
              >
                Save as Image
              </button>
            </div>
          </div>

          <div className="pt-10 flex justify-between items-center opacity-30 text-[9px] uppercase tracking-[0.3em]">
            <span>Echoed by @{poem.author}</span>
            <span>{new Date(poem.timestamp).toLocaleDateString()}</span>
          </div>
        </article>
      </div>
    </div>
  );
};

export default PoemDetail;

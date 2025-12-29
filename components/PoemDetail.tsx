
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
    
    // Disable context menu to deter simple copying
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    window.addEventListener('contextmenu', handleContextMenu);
    
    return () => {
      setIsVisible(false);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/#/p/${poem.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    });
  };

  const shareToInstagram = () => {
    const text = `"${poem.title}"\n\n${poem.content}\n\n— Echoed on Echo Pages\n${window.location.origin}/#/p/${poem.id}`;
    navigator.clipboard.writeText(text);
    alert('Poem and Unique Link copied for Instagram stories.');
  };

  return (
    <div 
      className={`min-h-[90vh] relative transition-opacity duration-1000 protected-view ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      style={{ background: poem.backgroundColor }}
    >
      {/* Tiled Watermark Overlay - High density grid */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.035] select-none z-0">
        <div className="flex flex-col space-y-4 rotate-[-20deg] scale-150 origin-center translate-x-[-10%] translate-y-[-10%]">
          {[...Array(60)].map((_, row) => (
            <div key={row} className="flex space-x-6 whitespace-nowrap">
              {[...Array(30)].map((_, colIdx) => (
                <span key={colIdx} className="text-3xl font-black uppercase tracking-tighter watermark-text">
                  ECHO PAGES
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

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
              <span className="text-xs uppercase tracking-[0.3em] text-white/50">{poem.emotionTag} • {poem.genre}</span>
              <div className="h-[1px] flex-grow bg-white/10" />
            </div>
            <h1 className="instrument-serif text-5xl md:text-7xl leading-tight select-none">
              {poem.title}
            </h1>
          </header>

          <div className="poem-content serif-font text-xl md:text-2xl leading-relaxed whitespace-pre-line italic opacity-90 relative select-none">
            {poem.content}
          </div>

          <div className="pt-20 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between border-t border-white/10 pt-10 gap-8">
              <div className="space-y-2">
                <span className="text-[10px] uppercase tracking-widest opacity-40">Emotional Weight</span>
                <div className="w-48 h-1 bg-white/10 overflow-hidden relative">
                  <div 
                    className="absolute top-0 left-0 h-full bg-white/60 transition-all duration-1000 ease-out" 
                    style={{ width: `${poem.emotionalWeight}%` }}
                  />
                </div>
                <div className="text-[10px] opacity-30">{poem.emotionalWeight}% / Introspective</div>
              </div>

              <div className="flex space-x-4">
                <button 
                  onClick={handleCopyLink}
                  className="flex items-center space-x-3 text-[10px] uppercase tracking-widest border border-white/20 px-6 py-3 hover:bg-white hover:text-black transition-all duration-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <span>{copyStatus === 'copied' ? 'Link Copied' : 'Copy Link'}</span>
                </button>
                <button 
                  onClick={shareToInstagram}
                  className="text-[10px] uppercase tracking-widest border border-white/20 px-6 py-3 hover:bg-white hover:text-black transition-all duration-500"
                >
                  Instagram
                </button>
              </div>
            </div>

            <footer className="opacity-20 text-[10px] uppercase tracking-[0.3em] text-center pt-20">
              Echoed by {poem.author} • {new Date(poem.timestamp).toLocaleDateString()}
            </footer>
          </div>
        </article>
      </div>
    </div>
  );
};

export default PoemDetail;

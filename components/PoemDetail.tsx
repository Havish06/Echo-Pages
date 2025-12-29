
import React, { useEffect, useState } from 'react';
import { Poem } from '../types.ts';

interface PoemDetailProps {
  poem: Poem;
  onBack: () => void;
}

const PoemDetail: React.FC<PoemDetailProps> = ({ poem, onBack }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    return () => setIsVisible(false);
  }, []);

  const shareToInstagram = () => {
    const text = `"${poem.title}"\n\n${poem.content}\n\n— Echo Pages`;
    navigator.clipboard.writeText(text);
    alert('Copied poem to clipboard for Instagram sharing.');
  };

  const shareToTwitter = () => {
    const text = `"${poem.title}"\n\n${poem.content.slice(0, 150)}${poem.content.length > 150 ? '...' : ''}\n\nEchoed on @EchoPages`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(twitterUrl, '_blank');
  };

  return (
    <div 
      className={`min-h-[90vh] transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      style={{ background: poem.backgroundColor }}
    >
      <div className="max-w-3xl mx-auto px-6 py-20 haunting-gradient min-h-[90vh] flex flex-col justify-center">
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
            <h1 className="instrument-serif text-5xl md:text-7xl leading-tight">
              {poem.title}
            </h1>
          </header>

          <div className="poem-content serif-font text-xl md:text-2xl leading-relaxed whitespace-pre-line italic opacity-90">
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
                  onClick={shareToTwitter}
                  className="flex items-center space-x-2 text-[10px] uppercase tracking-widest border border-white/20 px-6 py-3 hover:bg-white hover:text-black transition-all duration-500"
                >
                  <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
                  </svg>
                  <span>Share X</span>
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


import React, { useEffect, useState, useRef } from 'react';
import { Poem } from '../types.ts';

interface PoemDetailProps {
  poem: Poem;
  onBack: () => void;
}

const PoemDetail: React.FC<PoemDetailProps> = ({ poem, onBack }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setIsVisible(true);
    // Smooth scroll to top on enter
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return () => setIsVisible(false);
  }, []);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/#/p/${poem.id}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        setCopyStatus('copied');
        setTimeout(() => setCopyStatus('idle'), 2000);
      }).catch(err => {
        console.error("Copy failed", err);
        fallbackCopy(url);
      });
    } else {
      fallbackCopy(url);
    }
  };

  const fallbackCopy = (text: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      setSuccessStatus();
    } catch (err) {
      alert("Please copy manually: " + text);
    }
    document.body.removeChild(textArea);
  };

  const setSuccessStatus = () => {
    setCopyStatus('copied');
    setTimeout(() => setCopyStatus('idle'), 2000);
  };

  const saveAsImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 1080;
    const height = 1350; 
    canvas.width = width;
    canvas.height = height;

    const bg = poem.backgroundColor || 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)';
    
    if (bg.includes('gradient')) {
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#0a0a0a');
      grad.addColorStop(1, '#1a1a1a');
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = bg;
    }
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.rotate(-Math.PI / 12);
    ctx.font = '30px serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.textAlign = 'center';
    
    const stepX = 250; 
    const stepY = 100; 
    for (let x = -width; x < width * 2; x += stepX) {
      for (let y = -height; y < height * 2; y += stepY) {
        ctx.fillText('ECHO PAGES', x, y);
      }
    }
    ctx.restore();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    
    ctx.font = 'italic 76px serif';
    ctx.fillText((poem.title || 'UNTITLED').toUpperCase(), width / 2, 350);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(width / 3, 420);
    ctx.lineTo(2 * width / 3, 420);
    ctx.stroke();

    ctx.font = 'italic 44px serif';
    const lines = poem.content.split('\n');
    let startY = 550;
    const lineHeight = 65;
    lines.forEach(line => {
      ctx.fillText(line, width / 2, startY);
      startY += lineHeight;
    });

    ctx.font = '24px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    const footerY = height - 150;
    ctx.fillText(`BY @${poem.author.toUpperCase()}`, width / 2, footerY);
    ctx.font = 'bold 18px sans-serif';
    ctx.letterSpacing = '3px';
    ctx.fillText(`${poem.genre.toUpperCase()} · ${poem.score}% MATCH`, width / 2, footerY + 50);

    try {
      const link = document.createElement('a');
      link.download = `echo-${(poem.title || 'fragment').toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error("Canvas Export Failed", e);
    }
  };

  return (
    <div 
      className={`min-h-[90vh] relative transition-all duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'} overflow-hidden flex flex-col`}
      style={{ background: poem.backgroundColor || '#0a0a0a' }}
    >
      {/* Dense Watermark Pattern */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.04] select-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='250' height='100' viewBox='0 0 250 100' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' fill='white' font-family='serif' font-size='30' letter-spacing='0.2em' transform='rotate(-12 125 50)'%3EECHO PAGES%3C/text%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '250px 100px'
      }}>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* Main Content Overlay */}
      <div className="max-w-4xl mx-auto px-6 py-12 md:py-24 bg-black/30 backdrop-blur-[3px] flex-grow flex flex-col justify-center relative z-10 text-white w-full border-x border-white/5">
        <button 
          onClick={onBack}
          className="mb-16 self-start flex items-center space-x-3 opacity-40 hover:opacity-100 transition-all text-[10px] uppercase tracking-[0.3em] font-bold"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Return</span>
        </button>

        <article className="space-y-16">
          <header className="space-y-6">
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-[11px] uppercase tracking-[0.3em] text-white font-black bg-white/10 px-4 py-1 rounded-sm">
                {poem.genre} {poem.score > 0 ? `· ${poem.score}% Match` : ''}
              </span>
              <div className="h-[1px] flex-grow bg-white/10" />
            </div>
            
            <h1 className="instrument-serif text-6xl md:text-8xl leading-[1] italic tracking-tight">
              {poem.title || 'Untitled Fragment'}
            </h1>
            
            {poem.justification && (
               <p className="text-[11px] uppercase tracking-[0.2em] opacity-40 border-l-2 border-white/20 pl-6 py-2 max-w-2xl leading-relaxed italic">
                 {poem.justification}
               </p>
            )}
          </header>

          <div className="serif-font text-2xl md:text-4xl leading-[1.6] whitespace-pre-line italic opacity-90 min-h-[15rem] tracking-wide">
            {poem.content}
          </div>

          <div className="pt-24 grid grid-cols-1 md:grid-cols-2 items-end border-t border-white/10 gap-12">
            <div className="flex flex-col space-y-4">
              <span className="text-[10px] uppercase tracking-[0.4em] opacity-30 font-bold">Emotion Spectrum</span>
              <div className="flex items-center gap-6">
                <div className="space-y-1">
                  <span className="instrument-serif text-5xl font-medium tracking-wide leading-none">{poem.emotionTag}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] opacity-40 uppercase font-mono tracking-tighter">Intensity</span>
                  <span className="text-xl font-mono">{poem.emotionalWeight}%</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 md:justify-end">
              <button 
                onClick={handleCopyLink}
                className="px-10 py-4 border-2 border-white/20 hover:border-white transition-all text-[11px] uppercase tracking-[0.4em] text-white font-bold backdrop-blur-sm"
              >
                {copyStatus === 'copied' ? 'Link Captured' : 'Copy Link'}
              </button>
              <button 
                onClick={saveAsImage}
                className="px-10 py-4 bg-white/5 border border-white/20 hover:bg-white/10 transition-all text-[11px] uppercase tracking-[0.4em] text-white/60 hover:text-white"
              >
                Capture Frame
              </button>
            </div>
          </div>

          <div className="pt-12 flex justify-between items-center opacity-30 text-[10px] uppercase tracking-[0.4em] font-medium">
            <div className="flex flex-col">
              <span className="text-[8px] opacity-50 mb-1">Origin</span>
              <span>@{poem.author}</span>
            </div>
            <div className="flex flex-col text-right">
              <span className="text-[8px] opacity-50 mb-1">Frequency Date</span>
              <span>{new Date(poem.timestamp).toLocaleDateString('en-GB').replace(/\//g, ' . ')}</span>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
};

export default PoemDetail;

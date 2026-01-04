
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
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch (err) {
      alert("Please copy manually: " + text);
    }
    document.body.removeChild(textArea);
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

    // Fill background
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#0a0a0a');
    grad.addColorStop(1, '#1a1a1a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Dense, Large Watermark for Export (30px)
    ctx.save();
    ctx.rotate(-Math.PI / 12);
    ctx.font = '30px serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.textAlign = 'center';
    
    // Ultra-tight tiling for export (140x55)
    const stepX = 140; 
    const stepY = 55; 
    for (let x = -width; x < width * 2; x += stepX) {
      for (let y = -height; y < height * 2; y += stepY) {
        ctx.fillText('ECHO PAGES', x, y);
      }
    }
    ctx.restore();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    
    // Poem Title
    ctx.font = 'italic 76px serif';
    ctx.fillText((poem.title || 'UNTITLED').toUpperCase(), width / 2, 350);

    // Visual Divider
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(width / 3, 420);
    ctx.lineTo(2 * width / 3, 420);
    ctx.stroke();

    // Poem Content
    ctx.font = 'italic 44px serif';
    const lines = poem.content.split('\n');
    let startY = 550;
    const lineHeight = 65;
    lines.forEach(line => {
      ctx.fillText(line, width / 2, startY);
      startY += lineHeight;
    });

    // Metadata Footer
    ctx.font = '24px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    const footerY = height - 150;
    ctx.fillText(`BY @${poem.author.toUpperCase()}`, width / 2, footerY);
    ctx.font = 'bold 18px sans-serif';
    ctx.letterSpacing = '3px';
    ctx.fillText(`${(poem.genre || 'Poetry').toUpperCase()} · ${(poem.score || 0)}% MATCH`, width / 2, footerY + 50);

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
      className={`min-h-[90vh] relative transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'} overflow-hidden bg-black`}
    >
      {/* Tiled Watermark Background - Larger 30px Font, Ultra-Dense Spacing (140x55 tile) */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.06] select-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='140' height='55' viewBox='0 0 140 55' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' fill='white' font-family='serif' font-size='30' letter-spacing='-0.08em' transform='rotate(-12 70 27)'%3EECHO PAGES%3C/text%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '140px 55px'
      }}>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <div className="max-w-3xl mx-auto px-6 py-20 haunting-gradient min-h-[90vh] flex flex-col justify-center relative z-10 text-white">
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
              <span className="text-[11px] uppercase tracking-[0.3em] text-white font-bold">
                {poem.genre || 'Poetry'} · {poem.score || 0}% Match
              </span>
              <div className="h-[1px] flex-grow bg-white/10" />
            </div>
            <h1 className="instrument-serif text-5xl md:text-7xl leading-tight italic">
              {poem.title || 'Untitled Fragment'}
            </h1>
          </header>

          <div className="serif-font text-xl md:text-2xl leading-relaxed whitespace-pre-line italic opacity-90 min-h-[12rem]">
            {poem.content}
          </div>

          <div className="pt-20 flex flex-col md:flex-row items-center justify-between border-t border-white/10 pt-10 gap-8">
            <div className="flex flex-col space-y-2">
              <span className="text-[10px] uppercase tracking-widest opacity-40">Emotion Spectrum</span>
              <div className="flex items-center space-x-3">
                <span className="instrument-serif text-3xl font-medium tracking-wide">{poem.emotionTag}</span>
                <span className="text-[10px] opacity-20 uppercase font-mono tracking-tighter">({poem.emotionalWeight}%)</span>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={handleCopyLink}
                className="px-8 py-3 border border-white/20 hover:border-white transition-all text-[10px] uppercase tracking-widest text-white min-w-[140px]"
              >
                {copyStatus === 'copied' ? 'Link Copied' : 'Copy Link'}
              </button>
              <button 
                onClick={saveAsImage}
                className="px-8 py-3 border border-white/20 hover:border-white transition-all text-[10px] uppercase tracking-widest text-white/60 hover:text-white"
              >
                Save as Image
              </button>
            </div>
          </div>

          <div className="pt-10 flex justify-between items-center opacity-30 text-[9px] uppercase tracking-[0.3em]">
            <span>Echoed by @{poem.author}</span>
            <span>{new Date(poem.timestamp).toLocaleDateString('en-GB').replace(/\//g, '-')}</span>
          </div>
        </article>
      </div>
    </div>
  );
};

export default PoemDetail;

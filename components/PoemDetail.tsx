
import React, { useEffect, useState, useRef } from 'react';
import { Poem } from '../types.ts';
import { geminiService } from '../services/geminiService.ts';

interface PoemDetailProps {
  poem: Poem;
  onBack: () => void;
}

// Audio decoding helpers for Gemini raw PCM (24kHz Mono)
function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const PoemDetail: React.FC<PoemDetailProps> = ({ poem, onBack }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  const [audioStatus, setAudioStatus] = useState<'idle' | 'loading' | 'playing'>('idle');
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    setIsVisible(true);
    
    // Aesthetic protection - discourage inspection
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    window.addEventListener('contextmenu', handleContextMenu);
    
    return () => {
      setIsVisible(false);
      window.removeEventListener('contextmenu', handleContextMenu);
      if (sourceRef.current) {
        try { sourceRef.current.stop(); } catch(e) {}
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/#/p/${poem.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    });
  };

  const handleListen = async () => {
    if (audioStatus !== 'idle') {
      if (audioStatus === 'playing' && sourceRef.current) {
        try { sourceRef.current.stop(); } catch(e) {}
        setAudioStatus('idle');
      }
      return;
    }

    setAudioStatus('loading');
    const base64Audio = await geminiService.getPoemAudio(poem.title, poem.content);
    
    if (!base64Audio) {
      setAudioStatus('idle');
      alert("The spectral voice could not be summoned. Connection lost.");
      return;
    }

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      
      const audioData = decodeBase64(base64Audio);
      const audioBuffer = await decodeAudioData(audioData, audioContextRef.current, 24000, 1);
      
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      
      source.onended = () => {
        setAudioStatus('idle');
        sourceRef.current = null;
      };

      sourceRef.current = source;
      source.start();
      setAudioStatus('playing');
    } catch (err) {
      console.error("Playback error:", err);
      setAudioStatus('idle');
    }
  };

  const shareToInstagram = () => {
    const text = `"${poem.title}"\n\n${poem.content}\n\n— Echoed on Echo Pages\n${window.location.origin}/#/p/${poem.id}`;
    navigator.clipboard.writeText(text);
    alert('Poem and Link copied for your Stories.');
  };

  return (
    <div 
      className={`min-h-[90vh] relative transition-opacity duration-1000 protected-view ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      style={{ background: poem.backgroundColor }}
    >
      {/* Visual Noise Watermark */}
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
                <div className="text-[10px] opacity-30">{poem.emotionalWeight}% / {poem.tone}</div>
              </div>

              <div className="flex flex-wrap gap-4">
                <button 
                  onClick={handleListen}
                  disabled={audioStatus === 'loading'}
                  className={`flex items-center space-x-3 text-[10px] uppercase tracking-widest border px-6 py-3 transition-all ${
                    audioStatus === 'playing' 
                    ? 'border-white bg-white text-black' 
                    : 'border-white/20 hover:border-white/60 text-white'
                  }`}
                >
                  {audioStatus === 'loading' ? (
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <div className={`w-2 h-2 rounded-full ${audioStatus === 'playing' ? 'bg-black animate-pulse' : 'bg-white/40'}`} />
                  )}
                  <span>{audioStatus === 'loading' ? 'Summoning...' : audioStatus === 'playing' ? 'Echoing' : 'Listen'}</span>
                </button>

                <button 
                  onClick={handleCopyLink}
                  className="px-6 py-3 border border-white/10 hover:border-white/40 transition-all text-[10px] uppercase tracking-widest text-white/60 hover:text-white"
                >
                  {copyStatus === 'copied' ? 'Link Captured' : 'Copy Frequency'}
                </button>

                <button 
                  onClick={shareToInstagram}
                  className="px-6 py-3 border border-white/10 hover:border-white/40 transition-all text-[10px] uppercase tracking-widest text-white/60 hover:text-white"
                >
                  Stories
                </button>
              </div>
            </div>

            <div className="pt-6 flex justify-between items-center opacity-20 text-[10px] uppercase tracking-widest">
              <span>Authored by @{poem.author}</span>
              <span>{new Date(poem.timestamp).toLocaleDateString()}</span>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
};

export default PoemDetail;

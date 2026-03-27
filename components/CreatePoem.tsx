
import React, { useState, useEffect } from 'react';
import { Poem } from '../types.ts';
import { CONFIG } from '../config.ts';
import { supabase } from '../services/supabaseService.ts';
import { ADMIN_EMAILS } from '../constants.ts';
import { geminiService } from '../services/geminiService.ts';
import { validationService } from '../services/validationService.ts';

interface CreatePoemProps {
  onPublish: (poem: Partial<Poem>) => Promise<void>;
  onUpdate?: (id: string, updates: Partial<Poem>) => Promise<void>;
  onCancel: () => void;
  initialPoem?: Poem | null;
}

const CreatePoem: React.FC<CreatePoemProps> = ({ onPublish, onUpdate, onCancel, initialPoem }) => {
  const [title, setTitle] = useState(initialPoem?.title || '');
  const [content, setContent] = useState(initialPoem?.content || '');
  const [isPublishing, setIsPublishing] = useState(false);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [safetyError, setSafetyError] = useState<string | null>(null);
  const [regenCount, setRegenCount] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      if (!u) { window.location.hash = '#/auth'; return; }
      setUser(u);
      setIsAdmin(!!u.email && ADMIN_EMAILS.includes(u.email));
    });
  }, []);

  const handleGenerateTitle = async () => {
    if (!content.trim() || regenCount >= CONFIG.MAX_TITLE_REGEN || isGeneratingTitle) return;
    
    const localVal = validationService.validateContent(content);
    if (!localVal.valid) {
      setSafetyError(localVal.reason || "Invalid fragment.");
      return;
    }

    setIsGeneratingTitle(true);
    setSafetyError(null);
    try {
      const analysis = await geminiService.analyzePoem(content.trim());
      if (!analysis.isSafe) {
        setSafetyError(analysis.errorReason || "Violated Resonance detected.");
        return;
      }
      setTitle(analysis.suggestedTitle);
      setRegenCount(prev => prev + 1);
    } catch (err) { console.error("Title Generation Failed:", err); }
    finally { setIsGeneratingTitle(false); }
  };

  const handleAction = async () => {
    if (!content.trim() || isPublishing) return;
    if (!user) return;

    if (!initialPoem) {
      const rateCheck = validationService.checkRateLimit(user.id);
      if (!rateCheck.allowed && !isAdmin) {
        setSafetyError(rateCheck.reason || "Frequency limit reached.");
        return;
      }
    }

    const localVal = validationService.validateContent(content);
    if (!localVal.valid) {
      setSafetyError(localVal.reason || "Structural dissonance detected.");
      return;
    }
    
    setIsPublishing(true);
    setSafetyError(null);
    
    try {
      if (initialPoem && onUpdate) {
        await onUpdate(initialPoem.id, { title: title.trim(), content: content.trim() });
      } else {
        const poemDraft: Partial<Poem> = {
          title: title.trim(),
          content: content.trim(),
          author: user.user_metadata?.display_name || user.email?.split('@')[0] || 'Anonymous',
          userId: user.id,
          timestamp: Date.now()
        };
        await onPublish(poemDraft);
        validationService.recordPost(user.id);
      }
    } catch (err: any) {
      setSafetyError(err.message || "Transmission interrupted by forbidden frequencies.");
      setIsPublishing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-20 animate-fade-in relative">
      {safetyError && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-3xl animate-fade-in">
          <div className="max-w-xl w-full bg-gradient-to-b from-red-950/20 to-black p-12 border border-red-500/20 text-center space-y-10 shadow-2xl rounded-sm">
            <div className="w-20 h-20 mx-auto border border-red-500/40 rounded-full flex items-center justify-center animate-pulse">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="space-y-4">
              <h3 className="instrument-serif italic text-4xl text-red-500/90 tracking-tight">Forbidden Resonance</h3>
              <p className="serif-font text-lg italic opacity-60 leading-relaxed text-white">
                "{safetyError}"<br/>
                The Sanctuary requires purity of thought and rhythm.
              </p>
            </div>
            <button 
              onClick={() => setSafetyError(null)}
              className="w-full py-5 border border-red-500/30 hover:border-red-500 transition-all text-[10px] uppercase tracking-[0.5em] font-black text-red-500/80"
            >
              Adjust Frequency
            </button>
          </div>
        </div>
      )}

      <div className="space-y-12">
        <header className="flex justify-between items-center border-b border-echo-border pb-8">
          <div>
            <h2 className="instrument-serif text-5xl italic text-white">{initialPoem ? 'Refine Fragment' : 'Commit Fragment'}</h2>
            <p className="text-[9px] uppercase tracking-widest opacity-30 mt-1">
              {isAdmin ? "Admin Publication" : "Community Echo"}
            </p>
          </div>
          <button onClick={onCancel} className="text-[10px] uppercase tracking-widest opacity-30 hover:opacity-100 px-4 py-2 border border-echo-border transition-all text-white">Discard</button>
        </header>
        
        <div className="space-y-16">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-[10px] uppercase tracking-[0.4em] opacity-30 text-white font-bold">Title (Optional)</p>
              {regenCount < CONFIG.MAX_TITLE_REGEN && content.length > 10 && (
                <button 
                  onClick={handleGenerateTitle}
                  disabled={isGeneratingTitle}
                  className="text-[8px] uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity border-b border-white/20 pb-0.5"
                >
                  {isGeneratingTitle ? 'Tuning...' : 'Generate with AI'}
                </button>
              )}
            </div>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="The Echo of..."
              className="w-full bg-transparent border-b border-echo-border py-4 focus:border-white focus:outline-none instrument-serif text-4xl transition-colors text-white"
            />
          </div>

          <div className="space-y-4">
             <p className="text-[10px] uppercase tracking-[0.4em] opacity-30 text-white font-bold">Fragment</p>
             <textarea 
               value={content}
               onChange={(e) => setContent(e.target.value)}
               placeholder="Whisper into the void..."
               className="w-full h-80 bg-transparent border border-echo-border p-8 focus:border-white focus:outline-none transition-all serif-font text-2xl italic leading-relaxed whitespace-pre-line text-white/90"
             />
          </div>

          <div className="pt-8">
            <button 
              onClick={handleAction}
              disabled={isPublishing || !content.trim()}
              className="w-full py-6 bg-echo-text text-echo-bg text-[11px] uppercase tracking-[0.4em] font-bold hover:bg-white transition-all disabled:opacity-20 flex items-center justify-center space-x-4"
            >
              {isPublishing && <div className="w-4 h-4 border-2 border-echo-bg/30 border-t-echo-bg rounded-full animate-spin" />}
              <span>{isPublishing ? 'Analyzing Resonance...' : (initialPoem ? 'Update Echo' : 'Commit to the Void')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Fix for line 13 of App.tsx: Adding default export
export default CreatePoem;

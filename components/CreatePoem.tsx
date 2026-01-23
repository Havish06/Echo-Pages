import React, { useState, useEffect } from 'react';
import { Poem } from '../types.ts';
import { supabase } from '../services/supabaseService.ts';
import { ADMIN_EMAILS } from '../constants.ts';
import { geminiService } from '../services/geminiService.ts';

interface CreatePoemProps {
  onPublish: (poem: Partial<Poem>) => Promise<void>;
  onCancel: () => void;
}

const CreatePoem: React.FC<CreatePoemProps> = ({ onPublish, onCancel }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [safetyError, setSafetyError] = useState<string | null>(null);
  const [regenCount, setRegenCount] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      if (!u) {
         window.location.hash = '#/auth';
         return;
      }
      setUser(u);
      setIsAdmin(!!u.email && ADMIN_EMAILS.includes(u.email));
    });
  }, []);

  const handleGenerateTitle = async () => {
    if (!content.trim() || regenCount >= 3 || isGeneratingTitle) return;
    
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
    } catch (err) {
      console.error("Title Generation Failed:", err);
    } finally {
      setIsGeneratingTitle(false);
    }
  };

  const handlePublish = async () => {
    if (!content.trim() || isPublishing) return;
    if (!user) return;
    
    setIsPublishing(true);
    setSafetyError(null);
    
    try {
      // Final safety check and analysis
      const meta = await geminiService.analyzePoem(content.trim(), title.trim() || undefined);
      
      if (!meta.isSafe) {
        setSafetyError(meta.errorReason || "The Sanctuary cannot record this frequency.");
        setIsPublishing(false);
        return;
      }

      const finalPoem: Partial<Poem> = {
        title: meta.suggestedTitle,
        content: content.trim(),
        author: user.user_metadata?.display_name || user.email?.split('@')[0] || 'Anonymous',
        userId: user.id,
        timestamp: Date.now()
      };

      await onPublish(finalPoem);
    } catch (err) {
      setIsPublishing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-20 animate-fade-in relative">
      {/* Safety Violation Overlay */}
      {safetyError && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-3xl animate-fade-in">
          <div className="max-w-xl w-full bg-gradient-to-b from-red-950/20 to-black p-12 border border-red-500/20 text-center space-y-10 shadow-2xl">
            <div className="w-20 h-20 mx-auto border border-red-500/40 rounded-full flex items-center justify-center animate-pulse">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="space-y-4">
              <h3 className="instrument-serif italic text-4xl text-red-500/90">Forbidden Frequency</h3>
              <p className="serif-font text-lg italic opacity-60 leading-relaxed">
                "{safetyError}"<br/>
                The Sanctuary rejects fragments containing vulgarity or hate. Every echo must remain pure.
              </p>
            </div>
            <button 
              onClick={() => setSafetyError(null)}
              className="w-full py-4 border border-red-500/30 hover:border-red-500 transition-all text-[10px] uppercase tracking-[0.5em] font-black text-red-500/80"
            >
              Adjust Resonance
            </button>
          </div>
        </div>
      )}

      <div className="space-y-12">
        <header className="flex justify-between items-center border-b border-echo-border pb-8">
          <div>
            <h2 className="instrument-serif text-5xl italic">Commit Fragment</h2>
            <p className="text-[9px] uppercase tracking-widest opacity-30 mt-1">
              {isAdmin ? "Direct Curated Publication" : "Sharing to Community Echoes"}
            </p>
          </div>
          <button onClick={onCancel} className="text-[10px] uppercase tracking-widest opacity-30 hover:opacity-100 px-4 py-2 border border-echo-border transition-all">Discard</button>
        </header>
        
        <div className="space-y-16">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-[10px] uppercase tracking-[0.4em] opacity-30">Label (Title)</p>
              {content.trim() && regenCount < 3 && (
                <button 
                  onClick={handleGenerateTitle}
                  disabled={isGeneratingTitle}
                  className="text-[9px] uppercase tracking-widest opacity-60 hover:opacity-100 transition-all flex items-center space-x-2 border border-white/10 px-3 py-1 bg-white/5"
                >
                  {isGeneratingTitle ? "Calculating..." : regenCount === 0 ? "Generate with AI" : `Regenerate (${3 - regenCount} left)`}
                </button>
              )}
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Leave empty for auto-generation on publish..."
              className="w-full bg-transparent border-b border-echo-border py-4 focus:outline-none instrument-serif text-4xl placeholder:opacity-10 transition-all focus:border-white/40"
              disabled={isPublishing}
            />
          </div>

          <div className="space-y-4">
            <p className="text-[10px] uppercase tracking-[0.4em] opacity-30">The Fragment</p>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter your verse..."
              className="w-full h-80 bg-transparent border border-echo-border p-10 focus:border-echo-text focus:outline-none transition-all serif-font text-2xl italic leading-relaxed shadow-inner"
              disabled={isPublishing}
            />
          </div>

          <div className="space-y-8">
            <button
              onClick={handlePublish}
              disabled={isPublishing || !content.trim()}
              className="w-full py-8 bg-echo-text text-echo-bg text-[11px] uppercase tracking-[0.5em] font-black hover:bg-white transition-all disabled:opacity-20 flex items-center justify-center space-x-4 shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_50px_rgba(255,255,255,0.2)]"
            >
              {isPublishing ? (
                <>
                  <div className="w-4 h-4 border-2 border-echo-bg/30 border-t-echo-bg rounded-full animate-spin" />
                  <span>Analyzing Frequency...</span>
                </>
              ) : (
                <span>Commit Echo</span>
              )}
            </button>
            <p className="text-[9px] text-center uppercase tracking-[0.3em] opacity-20 italic">
              AI analysis will perform safety filtering and resonance matching upon commitment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePoem;
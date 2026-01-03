
import React, { useState, useEffect } from 'react';
import { Poem } from '../types.ts';
import { geminiService } from '../services/geminiService.ts';
import { supabase } from '../services/supabaseService.ts';

interface CreatePoemProps {
  onPublish: (poem: Poem) => void;
  onCancel: () => void;
}

const CreatePoem: React.FC<CreatePoemProps> = ({ onPublish, onCancel }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  }, []);

  const handlePublish = async () => {
    if (!content.trim()) return;
    if (!user) {
      alert("Entrance required. Reconnect your identity.");
      return;
    }
    
    setIsPublishing(true);
    setWarning(null);
    
    try {
      const meta = await geminiService.analyzePoem(content, title);
      
      if (!meta.isSafe || meta.containsRestricted) {
        setWarning("Some words may not align with our community guidelines. Please revise before publishing.");
        setIsPublishing(false);
        return;
      }

      const finalPoem: Partial<Poem> = {
        title: title.trim() || meta.suggestedTitle,
        content: content.trim(),
        author: user.user_metadata?.display_name || user.email?.split('@')[0] || 'Observer',
        userId: user.id,
        timestamp: Date.now(),
        emotionTag: meta.emotionTag,
        emotionalWeight: meta.emotionalWeight,
        score: meta.genreScore,
        genre: meta.detectedGenre,
        backgroundColor: meta.backgroundGradient
      };

      onPublish(finalPoem as Poem);
    } catch (error) {
      console.error("Publishing error:", error);
      alert("Transmission interrupted.");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-20 animate-fade-in">
      <div className="space-y-12">
        <header className="flex justify-between items-center border-b border-echo-border pb-8">
          <h2 className="instrument-serif text-5xl italic">New Echo</h2>
          <button onClick={onCancel} className="text-[10px] uppercase tracking-widest opacity-30 hover:opacity-100 px-4 py-2 border border-echo-border">Discard</button>
        </header>
        
        <div className="space-y-16">
          <div className="space-y-4">
            <p className="text-[10px] uppercase tracking-[0.4em] opacity-30">Label (Optional)</p>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Leave empty for auto-generation..."
              className="w-full bg-transparent border-b border-echo-border py-4 focus:outline-none instrument-serif text-4xl"
            />
          </div>

          <div className="space-y-4">
            <p className="text-[10px] uppercase tracking-[0.4em] opacity-30">The Fragment</p>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Whisper your truth..."
              className="w-full h-80 bg-transparent border border-echo-border p-10 focus:border-echo-text focus:outline-none transition-all serif-font text-2xl italic leading-relaxed"
            />
          </div>

          {warning && (
            <div className="p-6 border border-red-900 bg-red-950/20 text-red-200 text-sm italic">
              {warning}
            </div>
          )}

          <div className="space-y-8">
            <button
              onClick={handlePublish}
              disabled={isPublishing || !content.trim()}
              className="w-full py-8 bg-echo-text text-echo-bg text-[11px] uppercase tracking-[0.5em] font-bold hover:bg-white transition-all disabled:opacity-20"
            >
              {isPublishing ? 'Detecting Resonance...' : 'Commit to the Dark'}
            </button>
            <p className="text-center text-[9px] uppercase tracking-[0.2em] opacity-20">AI will automatically detect Genre and calculate Mastery Score.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePoem;

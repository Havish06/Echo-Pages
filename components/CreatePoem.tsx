
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
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  }, []);

  const handlePublish = async () => {
    if (!content.trim()) return;
    
    if (!user) {
      alert("You must enter the void (login) before echoing. Your thoughts require an anchor.");
      return;
    }
    
    setIsPublishing(true);
    
    try {
      // Automatic detection via Gemini API - detects Genre, Emotion, and provides Accuracy
      const meta = await geminiService.analyzePoem(content);
      
      if (!meta.isSafe) {
        alert("The void rejected this frequency. Maintain the sanctity of the platform.");
        setIsPublishing(false);
        return;
      }

      const finalPoem: Partial<Poem> = {
        title: title.trim() || meta.suggestedTitle,
        content: content.trim(),
        author: user.email?.split('@')[0] || 'Observer',
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
      alert("Transmission interrupted. The spectral connection is unstable.");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-20 animate-fade-in">
      <div className="space-y-12">
        <header className="flex justify-between items-baseline border-b border-echo-border pb-8">
          <div className="space-y-1">
            <h2 className="instrument-serif text-5xl italic">New Echo</h2>
            <p className="text-[10px] uppercase tracking-[0.3em] opacity-30 mt-2">Genre resonance and accuracy will be detected automatically.</p>
          </div>
          <button 
            onClick={onCancel} 
            className="text-[10px] uppercase tracking-widest opacity-30 hover:opacity-100 transition-opacity border border-echo-border px-4 py-2"
          >
            Discard
          </button>
        </header>
        
        <div className="space-y-16">
          <div className="space-y-4">
            <p className="text-[10px] uppercase tracking-[0.4em] opacity-30">Identity Label</p>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="A name for your shadow (Optional)"
              className="w-full bg-transparent border-b border-echo-border py-6 focus:border-echo-text focus:outline-none instrument-serif text-5xl placeholder:opacity-10 transition-all"
            />
          </div>

          <div className="space-y-4">
            <p className="text-[10px] uppercase tracking-[0.4em] opacity-30">The Verse</p>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Whisper into the void..."
              className="w-full h-[500px] bg-transparent border border-echo-border p-10 focus:border-echo-text focus:outline-none transition-all serif-font text-3xl italic leading-relaxed placeholder:opacity-10 resize-none scrollbar-hide"
            />
          </div>

          <div className="pt-10 space-y-8">
            <button
              onClick={handlePublish}
              disabled={isPublishing || !content.trim()}
              className="group relative w-full py-10 bg-echo-text text-echo-bg text-[11px] uppercase tracking-[0.6em] font-black hover:bg-white transition-all disabled:opacity-20 overflow-hidden"
            >
              {isPublishing ? (
                <div className="flex items-center justify-center space-x-6">
                  <div className="w-4 h-4 border-2 border-echo-bg/30 border-t-echo-bg rounded-full animate-spin" />
                  <span className="animate-pulse">Measuring Spectral Resonance...</span>
                </div>
              ) : (
                'Commit Echo to the Dark'
              )}
            </button>
            <p className="text-center text-[10px] uppercase tracking-[0.3em] opacity-20">
              AI evaluates genre precision (0-100%) and emotional mastery.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePoem;

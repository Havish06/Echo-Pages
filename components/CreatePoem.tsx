
import React, { useState, useEffect } from 'react';
import { Poem } from '../types.ts';
import { supabase } from '../services/supabaseService.ts';
import { ADMIN_EMAILS } from '../constants.ts';

interface CreatePoemProps {
  onPublish: (poem: Partial<Poem>) => Promise<void>;
  onCancel: () => void;
}

const CreatePoem: React.FC<CreatePoemProps> = ({ onPublish, onCancel }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
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

  const handlePublish = async () => {
    if (!content.trim() || isPublishing) return;
    if (!user) return;
    
    setIsPublishing(true);
    
    const finalPoem: Partial<Poem> = {
      title: title.trim(),
      content: content.trim(),
      author: user.user_metadata?.display_name || user.email?.split('@')[0] || 'Anonymous',
      userId: user.id,
      timestamp: Date.now()
    };

    try {
      // Trigger publish (which saves skeleton and redirects in App.tsx)
      await onPublish(finalPoem);
      // Navigation happens in App.tsx automatically on success
    } catch (err) {
      // If saving the skeleton fails, reset loading state so user can try again
      setIsPublishing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-20 animate-fade-in">
      <div className="space-y-12">
        <header className="flex justify-between items-center border-b border-echo-border pb-8">
          <div>
            <h2 className="instrument-serif text-5xl italic">Commit Fragment</h2>
            <p className="text-[9px] uppercase tracking-widest opacity-20 mt-1">
              {isAdmin ? "Direct Curated Publication" : "Sharing to Community Echoes"}
            </p>
          </div>
          <button onClick={onCancel} className="text-[10px] uppercase tracking-widest opacity-30 hover:opacity-100 px-4 py-2 border border-echo-border transition-all">Discard</button>
        </header>
        
        <div className="space-y-16">
          <div className="space-y-4">
            <p className="text-[10px] uppercase tracking-[0.4em] opacity-30">Label (Optional)</p>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Leave empty for auto-generation..."
              className="w-full bg-transparent border-b border-echo-border py-4 focus:outline-none instrument-serif text-4xl placeholder:opacity-10"
              disabled={isPublishing}
            />
          </div>

          <div className="space-y-4">
            <p className="text-[10px] uppercase tracking-[0.4em] opacity-30">The Fragment</p>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter your verse..."
              className="w-full h-80 bg-transparent border border-echo-border p-10 focus:border-echo-text focus:outline-none transition-all serif-font text-2xl italic leading-relaxed"
              disabled={isPublishing}
            />
          </div>

          <div className="space-y-8">
            <button
              onClick={handlePublish}
              disabled={isPublishing || !content.trim()}
              className="w-full py-8 bg-echo-text text-echo-bg text-[11px] uppercase tracking-[0.5em] font-bold hover:bg-white transition-all disabled:opacity-20 flex items-center justify-center space-x-4"
            >
              {isPublishing ? (
                <>
                  <div className="w-4 h-4 border-2 border-echo-bg/30 border-t-echo-bg rounded-full animate-spin" />
                  <span>Transmitting...</span>
                </>
              ) : (
                <span>Commit Echo</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePoem;

import React, { useState } from 'react';
import { Poem } from '../types.ts';
import { geminiService } from '../services/geminiService.ts';

interface AdminPortalProps {
  onPublish: (poem: Partial<Poem>) => Promise<void>;
  onCancel: () => void;
}

const AdminPortal: React.FC<AdminPortalProps> = ({ onPublish, onCancel }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [safetyError, setSafetyError] = useState<string | null>(null);

  const handlePublish = async () => {
    if (!content.trim() || isPublishing) return;
    
    setIsPublishing(true);
    setSafetyError(null);
    
    try {
      // Admin safety check
      const meta = await geminiService.analyzePoem(content.trim(), title.trim() || undefined);
      
      if (!meta.isSafe) {
        setSafetyError(meta.errorReason || "Restricted resonance in curated fragment.");
        setIsPublishing(false);
        return;
      }

      const finalPoem: Partial<Poem> = {
        title: meta.suggestedTitle,
        content: content.trim(),
        author: 'Admin',
        userId: 'admin',
        timestamp: Date.now()
      };

      await onPublish(finalPoem);
    } catch (err) {
      console.error("Admin upload failed:", err);
      setIsPublishing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-20 animate-fade-in relative">
      {/* Safety Violation Overlay */}
      {safetyError && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-3xl animate-fade-in">
          <div className="max-w-xl w-full bg-gradient-to-b from-red-950/20 to-black p-12 border border-red-500/20 text-center space-y-10">
            <h3 className="instrument-serif italic text-4xl text-red-500/90">Sanctuary Rejection</h3>
            <p className="serif-font text-lg italic opacity-60">
              "{safetyError}"<br/>
              Even curated echoes must respect the Sanctuary's silence.
            </p>
            <button 
              onClick={() => setSafetyError(null)}
              className="w-full py-4 border border-red-500/30 hover:border-red-500 transition-all text-[10px] uppercase tracking-[0.5em] font-black text-red-500/80"
            >
              Re-evaluate Fragment
            </button>
          </div>
        </div>
      )}

      <div className="space-y-12">
        <div className="flex justify-between items-baseline border-b border-echo-border pb-8">
          <div>
            <h2 className="instrument-serif text-4xl italic text-white">Curate the Read Feed</h2>
            <p className="text-[10px] uppercase tracking-widest opacity-30 mt-2">Publish directly to the curated collection.</p>
          </div>
          <button 
            onClick={onCancel}
            className="text-[10px] uppercase tracking-widest opacity-30 hover:opacity-100 transition-opacity"
          >
            Discard
          </button>
        </div>

        <div className="space-y-10">
          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-widest opacity-30 font-bold text-white/60">Title (Optional)</p>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="AI will generate if left blank..."
              className="w-full bg-transparent border-b border-echo-border py-4 focus:border-echo-text focus:outline-none instrument-serif text-4xl transition-colors text-white"
            />
          </div>

          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-widest opacity-30 font-bold text-white/60">Content</p>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="The Curated Verse..."
              className="w-full h-96 bg-transparent border border-echo-border p-8 focus:border-echo-text focus:outline-none transition-all serif-font text-2xl italic leading-relaxed whitespace-pre-line text-white/90"
            />
          </div>

          <div className="pt-12">
            <button
              onClick={handlePublish}
              disabled={isPublishing || !content.trim()}
              className="w-full py-6 bg-echo-text text-echo-bg text-[11px] uppercase tracking-[0.4em] font-bold hover:bg-white transition-all disabled:opacity-20 flex items-center justify-center space-x-4"
            >
              {isPublishing && <div className="w-4 h-4 border-2 border-echo-bg/30 border-t-echo-bg rounded-full animate-spin" />}
              <span>{isPublishing ? 'Analyzing Resonance...' : 'Publish to Read'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPortal;
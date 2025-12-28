
import React, { useState } from 'react';
import { Poem } from '../types.ts';
import { geminiService } from '../services/geminiService.ts';

interface AdminPortalProps {
  onPublish: (poem: Poem) => void;
  onCancel: () => void;
}

const AdminPortal: React.FC<AdminPortalProps> = ({ onPublish, onCancel }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = async () => {
    if (!content.trim() || !title.trim()) {
      alert("Please provide both a title and the content for curated echoes.");
      return;
    }
    
    setIsPublishing(true);
    
    try {
      const meta = await geminiService.analyzePoem(content);
      
      const finalPoem: Poem = {
        id: '', // DB handles ID
        title: title.trim(),
        content: content.trim(),
        author: 'Admin',
        timestamp: Date.now(),
        emotionTag: meta.emotionTag,
        emotionalWeight: meta.emotionalWeight,
        tone: 'melancholic',
        genre: 'Curated',
        backgroundColor: meta.backgroundGradient
      };

      onPublish(finalPoem);
    } catch (error) {
      console.error("Admin Publication error:", error);
      alert("Failed to commit the curate. Check console for table schema details.");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-20 animate-fade-in">
      <div className="space-y-12">
        <div className="flex justify-between items-baseline border-b border-echo-border pb-8">
          <div>
            <h2 className="instrument-serif text-4xl italic">Curate the feed</h2>
            <p className="text-[10px] uppercase tracking-widest opacity-30 mt-2">Submission to the read-only curated collection.</p>
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
            <p className="text-[10px] uppercase tracking-widest opacity-30">Title</p>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give this curate a name..."
              className="w-full bg-transparent border-b border-echo-border py-4 focus:border-echo-text focus:outline-none instrument-serif text-4xl transition-colors"
            />
          </div>

          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-widest opacity-30">Content</p>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter the verse to be curated..."
              className="w-full h-96 bg-transparent border border-echo-border p-8 focus:border-echo-text focus:outline-none transition-all serif-font text-2xl italic leading-relaxed whitespace-pre-line"
            />
          </div>

          <div className="pt-12">
            <button
              onClick={handlePublish}
              disabled={isPublishing || !content.trim() || !title.trim()}
              className="w-full py-6 bg-echo-text text-echo-bg text-[11px] uppercase tracking-[0.4em] font-medium hover:opacity-80 transition-all disabled:opacity-20 flex items-center justify-center space-x-4"
            >
              {isPublishing && <div className="w-4 h-4 border-2 border-echo-bg/30 border-t-echo-bg rounded-full animate-spin" />}
              <span>{isPublishing ? 'Transmitting...' : 'Commit to Curated Feed'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPortal;

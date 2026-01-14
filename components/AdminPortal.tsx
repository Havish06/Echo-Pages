
import React, { useState } from 'react';
import { Poem } from '../types.ts';

interface AdminPortalProps {
  onPublish: (poem: Partial<Poem>) => void;
  onCancel: () => void;
}

const AdminPortal: React.FC<AdminPortalProps> = ({ onPublish, onCancel }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = () => {
    if (!content.trim()) return;
    
    setIsPublishing(true);
    
    const finalPoem: Partial<Poem> = {
      title: title.trim(),
      content: content.trim(),
      author: 'Admin',
      userId: 'admin',
      timestamp: Date.now()
    };

    onPublish(finalPoem);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-20 animate-fade-in">
      <div className="space-y-12">
        <div className="flex justify-between items-baseline border-b border-echo-border pb-8">
          <div>
            <h2 className="instrument-serif text-4xl italic">Curate the Read Feed</h2>
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
            <p className="text-[10px] uppercase tracking-widest opacity-30">Title (Optional)</p>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="AI will generate if left blank..."
              className="w-full bg-transparent border-b border-echo-border py-4 focus:border-echo-text focus:outline-none instrument-serif text-4xl transition-colors"
            />
          </div>

          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-widest opacity-30">Content</p>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="The Curated Verse..."
              className="w-full h-96 bg-transparent border border-echo-border p-8 focus:border-echo-text focus:outline-none transition-all serif-font text-2xl italic leading-relaxed whitespace-pre-line"
            />
          </div>

          <div className="pt-12">
            <button
              onClick={handlePublish}
              disabled={isPublishing || !content.trim()}
              className="w-full py-6 bg-echo-text text-echo-bg text-[11px] uppercase tracking-[0.4em] font-medium hover:opacity-80 transition-all disabled:opacity-20 flex items-center justify-center space-x-4"
            >
              {isPublishing && <div className="w-4 h-4 border-2 border-echo-bg/30 border-t-echo-bg rounded-full animate-spin" />}
              <span>{isPublishing ? 'Committing...' : 'Publish to Read'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPortal;

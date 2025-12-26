
import React, { useState } from 'react';
import { Poem } from '../types.ts';
import { TONES, GENRES, DEFAULT_GRADIENT } from '../constants.ts';
import { geminiService } from '../services/geminiService.ts';

interface AdminPortalProps {
  onPublish: (poem: Poem) => void;
  onCancel: () => void;
}

const AdminPortal: React.FC<AdminPortalProps> = ({ onPublish, onCancel }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTone, setSelectedTone] = useState<typeof TONES[number]['id']>('melancholic');
  const [selectedGenre, setSelectedGenre] = useState<string>('Free Verse');
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = async () => {
    if (!content.trim() || !title.trim()) {
      alert("Please provide both a title and the content.");
      return;
    }
    
    setIsPublishing(true);
    
    try {
      const meta = await geminiService.analyzePoem(content);
      
      const finalPoem: Poem = {
        id: '', // Handled by DB
        title: title,
        content: content,
        author: 'Admin',
        timestamp: Date.now(),
        emotionTag: meta.emotionTag,
        emotionalWeight: meta.emotionalWeight,
        tone: selectedTone as any,
        genre: selectedGenre,
        backgroundColor: meta.backgroundGradient || TONES.find(t => t.id === selectedTone)?.gradient || DEFAULT_GRADIENT
      };

      onPublish(finalPoem);
    } catch (error) {
      console.error("Publication error:", error);
      const fallbackPoem: Poem = {
        id: '', 
        title: title,
        content: content,
        author: 'Admin',
        timestamp: Date.now(),
        emotionTag: selectedTone.charAt(0).toUpperCase() + selectedTone.slice(1),
        emotionalWeight: 50,
        tone: selectedTone as any,
        genre: selectedGenre,
        backgroundColor: TONES.find(t => t.id === selectedTone)?.gradient || DEFAULT_GRADIENT
      };
      onPublish(fallbackPoem);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-20 animate-fade-in">
      <div className="space-y-12">
        <div className="flex justify-between items-baseline border-b border-echo-border pb-8">
          <h2 className="instrument-serif text-4xl italic">Admin Curation</h2>
          <button 
            onClick={onCancel}
            className="text-[10px] uppercase tracking-widest opacity-30 hover:opacity-100 transition-opacity"
          >
            Discard
          </button>
        </div>

        <div className="space-y-10">
          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-widest opacity-30">Curated Title</p>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter title..."
              className="w-full bg-transparent border-b border-echo-border py-4 focus:border-echo-text focus:outline-none instrument-serif text-4xl transition-colors"
            />
          </div>

          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-widest opacity-30">Poem Body</p>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste or type content..."
              className="w-full h-96 bg-transparent border border-echo-border p-8 focus:border-echo-text focus:outline-none transition-all serif-font text-2xl italic leading-relaxed whitespace-pre-line"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-4">
              <p className="text-[10px] uppercase tracking-widest opacity-30">Tone Filter</p>
              <div className="flex flex-wrap gap-2">
                {TONES.map((tone) => (
                  <button
                    key={tone.id}
                    onClick={() => setSelectedTone(tone.id)}
                    className={`px-5 py-2 border text-[10px] uppercase tracking-widest transition-all ${
                      selectedTone === tone.id ? 'border-echo-text bg-echo-text/5' : 'border-echo-border opacity-40 hover:opacity-100'
                    }`}
                  >
                    {tone.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-[10px] uppercase tracking-widest opacity-30">Category</p>
              <div className="flex flex-wrap gap-2">
                {GENRES.map((genre) => (
                  <button
                    key={genre}
                    onClick={() => setSelectedGenre(genre)}
                    className={`px-5 py-2 border text-[10px] uppercase tracking-widest transition-all ${
                      selectedGenre === genre ? 'border-echo-text bg-echo-text/5' : 'border-echo-border opacity-40 hover:opacity-100'
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>
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

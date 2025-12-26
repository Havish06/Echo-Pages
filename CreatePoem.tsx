
import React, { useState, useEffect } from 'react';
import { Poem } from '../types.ts';
import { geminiService } from '../services/geminiService.ts';

interface CreatePoemProps {
  onPublish: (poem: Poem) => void;
  onCancel: () => void;
}

const BRAINSTORMING_PROMPTS = [
  "The streetlights hummed a secret only the rain understood...",
  "I found a piece of silence in my pocket today...",
  "Memory is a house with too many locked doors...",
  "Between the heartbeat and the breath, there is a ghost...",
  "The coffee went cold while I watched the shadows stretch...",
  "We are all just echoes of people we used to be...",
  "The stars are just holes in the ceiling of the world...",
  "Write about the weight of a word left unsaid...",
  "Describe the color of a forgotten Sunday afternoon..."
];

const CreatePoem: React.FC<CreatePoemProps> = ({ onPublish, onCancel }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [placeholder, setPlaceholder] = useState('');

  useEffect(() => {
    // Select a random brainstorming prompt on mount
    const randomPrompt = BRAINSTORMING_PROMPTS[Math.floor(Math.random() * BRAINSTORMING_PROMPTS.length)];
    setPlaceholder(randomPrompt);
  }, []);

  const handlePublish = async () => {
    if (!content.trim()) {
      alert("The void requires words to echo.");
      return;
    }
    
    setIsPublishing(true);
    
    try {
      // AI handles the atmospheric metadata in the background
      const meta = await geminiService.analyzePoem(content);
      
      const finalPoem: Poem = {
        id: Date.now().toString(),
        title: title.trim() || meta.suggestedTitle,
        content: content.trim(),
        author: 'Observer',
        timestamp: Date.now(),
        emotionTag: meta.emotionTag,
        emotionalWeight: meta.emotionalWeight,
        tone: 'melancholic',
        genre: 'Poetry',
        backgroundColor: meta.backgroundGradient
      };

      onPublish(finalPoem);
    } catch (error) {
      console.error("Error during publishing:", error);
      alert("The echo failed to reach the depths. Please try again.");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-20 animate-fade-in">
      <div className="space-y-12">
        <header className="flex justify-between items-baseline border-b border-echo-border pb-8">
          <div className="space-y-1">
            <h2 className="instrument-serif text-4xl italic">Contribute an echo</h2>
            <p className="text-[10px] uppercase tracking-widest opacity-30">Pure expression, no filters.</p>
          </div>
          <button 
            onClick={onCancel}
            className="text-[10px] uppercase tracking-widest opacity-30 hover:opacity-100 transition-opacity"
          >
            Cancel
          </button>
        </header>
        
        <div className="space-y-10">
          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-widest opacity-30">Title (Optional)</p>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your echo a name..."
              className="w-full bg-transparent border-b border-echo-border py-4 focus:border-echo-text focus:outline-none instrument-serif text-4xl transition-colors"
            />
          </div>

          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-widest opacity-30">Your Verse</p>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={placeholder}
              className="w-full h-96 bg-transparent border border-echo-border p-8 focus:border-echo-text focus:outline-none transition-all serif-font text-2xl italic leading-relaxed whitespace-pre-line placeholder:opacity-20"
            />
          </div>

          <div className="pt-8">
            <button
              onClick={handlePublish}
              disabled={isPublishing || !content.trim()}
              className="w-full py-6 bg-echo-text text-echo-bg text-[11px] uppercase tracking-[0.4em] font-medium hover:opacity-80 transition-all disabled:opacity-20 flex items-center justify-center space-x-4"
            >
              {isPublishing && <div className="w-4 h-4 border-2 border-echo-bg/30 border-t-echo-bg rounded-full animate-spin" />}
              <span>{isPublishing ? 'Transmitting to the Void...' : 'Publish Echo'}</span>
            </button>
            <p className="text-center mt-6 text-[10px] uppercase tracking-widest opacity-20">
              AI will set the atmosphere based on your words.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePoem;

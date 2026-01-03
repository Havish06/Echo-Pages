
import React from 'react';
import { View } from '../types.ts';

interface HomeProps {
  dailyLine: string;
  onNavigate: (view: View) => void;
}

const Home: React.FC<HomeProps> = ({ dailyLine, onNavigate }) => {
  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center px-6 relative overflow-hidden">
      {/* Background Decorative Element */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg h-96 bg-echo-text/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-3xl w-full text-center space-y-12 relative z-10">
        <p className="text-xs uppercase tracking-[0.3em] opacity-30 animate-pulse">
          Daily Echo
        </p>
        
        {dailyLine ? (
          <h1 className="instrument-serif italic text-4xl md:text-6xl lg:text-7xl leading-tight text-echo-text animate-fade-in">
            "{dailyLine}"
          </h1>
        ) : (
          <div className="space-y-4">
            <h1 className="instrument-serif italic text-4xl md:text-6xl opacity-10 animate-pulse">
              Synchronizing frequency...
            </h1>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-12">
          <button 
            onClick={() => onNavigate('feed')}
            className="px-10 py-4 border-2 border-echo-text bg-transparent text-echo-text hover:bg-echo-text hover:text-echo-bg transition-all duration-300 text-sm tracking-widest uppercase font-medium"
          >
            Read the feed
          </button>
          
          <button 
            onClick={() => onNavigate('create')}
            className="text-echo-text opacity-50 hover:opacity-100 transition-opacity text-sm tracking-widest uppercase border-b border-transparent hover:border-echo-text pb-1"
          >
            Contribute an echo
          </button>
        </div>
      </div>

      <div className="absolute bottom-12 text-[10px] uppercase tracking-[0.4em] opacity-20 text-echo-text">
        Minimalist. Introspective. Intelligent.
      </div>
    </div>
  );
};

export default Home;

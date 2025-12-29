
import React from 'react';
import { View } from '../types.ts';

interface HeaderProps {
  currentView: View;
  onNavigate: (view: View) => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, onNavigate }) => {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-echo-bg/80 px-6 py-6 border-b border-echo-border flex justify-between items-center transition-all duration-500">
      <div 
        className="cursor-pointer group flex items-center space-x-2"
        onClick={() => onNavigate('home')}
      >
        <span className="instrument-serif text-3xl font-medium tracking-tighter transition-all duration-500">
          Echo Pages
        </span>
      </div>

      <nav className="flex items-center space-x-8 text-[10px] uppercase tracking-widest font-light">
        {[
          { id: 'feed', label: 'Read' },
          { id: 'user-feed', label: 'By Echoes' },
          { id: 'create', label: 'Create' },
          { id: 'about', label: 'Manifesto' }
        ].map((item) => (
          <button 
            key={item.id}
            onClick={() => onNavigate(item.id as View)}
            className={`hover:opacity-100 transition-opacity border-b py-1 ${
              currentView === item.id 
              ? 'opacity-100 font-bold border-echo-text' 
              : 'opacity-40 border-transparent hover:border-echo-muted'
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </header>
  );
};

export default Header;

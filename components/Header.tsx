
import React, { useEffect, useState } from 'react';
import { View } from '../types.ts';
import { supabase } from '../services/supabaseService.ts';

interface HeaderProps {
  currentView: View;
  onNavigate: (view: View) => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, onNavigate }) => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-echo-bg/80 px-6 py-6 border-b border-echo-border flex flex-col md:flex-row justify-between items-center gap-6 transition-all duration-500">
      <div 
        className="cursor-pointer group flex items-center space-x-2"
        onClick={() => onNavigate('home')}
      >
        <span className="instrument-serif text-3xl font-medium tracking-tighter transition-all duration-500">
          Echo Pages
        </span>
      </div>

      <nav className="flex items-center space-x-6 text-[10px] uppercase tracking-widest font-light">
        {[
          { id: 'feed', label: 'Read' },
          { id: 'user-feed', label: 'Echoes' },
          { id: 'leaderboard', label: 'Ranks' },
          { id: 'create', label: 'Create' },
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
        
        <div className="w-[1px] h-4 bg-echo-border mx-2" />
        
        {user ? (
          <button 
            onClick={() => onNavigate('profile')}
            className={`hover:opacity-100 transition-opacity ${currentView === 'profile' ? 'opacity-100' : 'opacity-40'}`}
          >
            Account
          </button>
        ) : (
          <button 
            onClick={() => onNavigate('auth')}
            className="px-4 py-1.5 border border-echo-text/20 hover:border-echo-text transition-all"
          >
            Enter
          </button>
        )}
      </nav>
    </header>
  );
};

export default Header;

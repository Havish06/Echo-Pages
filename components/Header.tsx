
import React, { useEffect, useState } from 'react';
import { View } from '../types.ts';
import { supabase, authService } from '../services/supabaseService.ts';
import { ADMIN_EMAILS } from '../constants.ts';

interface HeaderProps {
  currentView: View;
  onNavigate: (view: View) => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, onNavigate }) => {
  const [user, setUser] = useState<any>(null);
  const [confirmLogout, setConfirmLogout] = useState(false);

  useEffect(() => {
    const updateAuth = (session: any) => {
      setUser(session?.user ?? null);
    };

    supabase.auth.getSession().then(({ data: { session } }) => updateAuth(session));
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      updateAuth(session);
    });
    
    return () => subscription.unsubscribe();
  }, []);

  const handleLogoutClick = () => {
    if (confirmLogout) {
      authService.logout();
      setConfirmLogout(false);
    } else {
      setConfirmLogout(true);
      setTimeout(() => setConfirmLogout(false), 3000);
    }
  };

  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Account';

  const navItems = [
    { id: 'feed', label: 'Read' },
    { id: 'user-feed', label: 'Echoes' },
    { id: 'leaderboard', label: 'Ranks' },
  ];

  if (user) {
    navItems.push({ id: 'create', label: 'Create' });
  }

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-echo-bg/95 px-6 py-6 border-b border-echo-border flex flex-col md:flex-row justify-between items-center gap-6">
      <div 
        className="cursor-pointer group flex items-center space-x-2"
        onClick={() => onNavigate('home')}
      >
        <span className="instrument-serif text-3xl font-medium tracking-tighter text-white">
          Echo Pages
        </span>
      </div>

      <nav className="flex items-center space-x-6 text-[10px] uppercase tracking-widest font-bold">
        {navItems.map((item) => (
          <button 
            key={item.id}
            onClick={() => onNavigate(item.id as View)}
            className={`hover:opacity-100 transition-opacity border-b py-1 ${
              currentView === item.id 
              ? 'opacity-100 font-black border-white' 
              : 'opacity-70 border-transparent hover:border-white/50'
            }`}
          >
            {item.label}
          </button>
        ))}
        
        <div className="w-[1px] h-4 bg-echo-border mx-2" />
        
        {user ? (
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => onNavigate('profile')}
              className={`hover:opacity-100 transition-opacity font-black ${currentView === 'profile' ? 'opacity-100' : 'opacity-80'}`}
            >
              {displayName}
            </button>
            <button 
              onClick={handleLogoutClick}
              className={`transition-all ${confirmLogout ? 'text-red-500 scale-110' : 'opacity-60 hover:opacity-100 hover:text-red-500'}`}
              title={confirmLogout ? "Click again to confirm" : "Logout"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        ) : (
          <button 
            onClick={() => onNavigate('auth')}
            className="px-6 py-1.5 border border-white/60 hover:border-white transition-all text-white font-bold"
          >
            Login
          </button>
        )}
      </nav>
    </header>
  );
};

export default Header;

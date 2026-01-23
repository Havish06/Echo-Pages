
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
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      setIsAdmin(!!u?.email && ADMIN_EMAILS.includes(u.email));
    });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user ?? null;
      setUser(u);
      setIsAdmin(!!u?.email && ADMIN_EMAILS.includes(u.email));
    });
    
    return () => subscription.unsubscribe();
  }, []);

  const navItems = [
    { id: 'feed', label: 'Read' },
    { id: 'user-feed', label: 'Echoes' },
    { id: 'leaderboard', label: 'Ranks' },
  ];
  if (user) navItems.push({ id: 'create', label: 'Create' });
  if (isAdmin) navItems.push({ id: 'admin', label: 'Admin' });

  const handleLogout = async () => {
    try {
      await authService.logout();
      onNavigate('home');
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-black/90 px-6 py-6 border-b border-echo-border flex flex-col md:flex-row justify-between items-center gap-6">
      <div className="cursor-pointer" onClick={() => onNavigate('home')}>
        <span className="instrument-serif text-3xl font-medium tracking-tighter text-white">Echo Pages</span>
      </div>

      <nav className="flex items-center space-x-8 text-[10px] uppercase tracking-widest font-black">
        {navItems.map((item) => (
          <button 
            key={item.id}
            onClick={() => onNavigate(item.id as View)}
            className={`transition-all border-b py-1 ${currentView === item.id ? 'opacity-100 border-white' : 'opacity-40 border-transparent hover:opacity-100 hover:border-white/50'}`}
          >
            {item.label}
          </button>
        ))}
        {user ? (
          <div className="flex items-center space-x-6 border-l border-white/20 pl-6">
            <button 
              onClick={() => onNavigate('profile')} 
              className={`opacity-90 hover:opacity-100 text-white font-black border-b py-1 transition-all ${currentView === 'profile' ? 'border-white' : 'border-transparent'}`}
            >
              {user.user_metadata?.display_name || 'Profile'}
            </button>
            <button 
              onClick={handleLogout} 
              className="px-5 py-2 border-2 border-white bg-white text-black hover:bg-transparent hover:text-white font-bold transition-all rounded-sm tracking-[0.2em] shadow-[0_0_15px_rgba(255,255,255,0.2)]"
            >
              SIGN OUT
            </button>
          </div>
        ) : (
          <button 
            onClick={() => onNavigate('auth')} 
            className="px-6 py-2 border border-white/40 hover:border-white text-white font-black transition-all hover:bg-white/5 rounded-sm"
          >
            LOGIN
          </button>
        )}
      </nav>
    </header>
  );
};

export default Header;

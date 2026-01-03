
import React, { useEffect, useState } from 'react';
import { supabase, authService } from '../services/supabaseService.ts';
import { Poem } from '../types.ts';

const Profile: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({ total: 0, avg: 0 });
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) loadUserStats(session.user.id);
    });
  }, []);

  const loadUserStats = async (userId: string) => {
    const { data } = await supabase.from('echoes').select('score').eq('user_id', userId);
    if (data && data.length > 0) {
      const avg = data.reduce((acc, curr) => acc + (curr.score || 0), 0) / data.length;
      setStats({ total: data.length, avg: Math.round(avg) });
    }
  };

  const handleSignOut = () => {
    if (!confirmSignOut) {
      setConfirmSignOut(true);
      setTimeout(() => setConfirmSignOut(false), 3000); // Reset after 3 seconds
      return;
    }
    authService.logout();
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-6 py-20 space-y-24 animate-fade-in">
      <header className="flex flex-col md:flex-row justify-between items-end gap-12 border-b border-echo-border pb-16">
        <div className="space-y-6">
          <p className="text-[10px] uppercase tracking-[0.4em] opacity-30">Identity Anchor</p>
          <h1 className="instrument-serif italic text-6xl md:text-8xl leading-none">
            {user.user_metadata?.full_name || user.email?.split('@')[0]}
          </h1>
          <p className="serif-font text-lg md:text-xl italic opacity-40">{user.email}</p>
        </div>
        
        <div className="flex flex-col items-end space-y-4">
           <button 
            onClick={handleSignOut}
            className={`text-[10px] uppercase tracking-[0.2em] px-8 py-4 transition-all border ${
              confirmSignOut 
              ? 'bg-red-950/20 border-red-900 text-red-400' 
              : 'border-echo-border opacity-30 hover:opacity-100 hover:border-white'
            }`}
          >
            {confirmSignOut ? 'Click Again to Dissolve Session' : 'Dissolve Session'}
          </button>
          {confirmSignOut && <p className="text-[9px] uppercase tracking-widest opacity-20">Ephemeral exit initiated.</p>}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="border border-echo-border p-12 space-y-8 hover:border-white/10 transition-colors">
          <p className="text-[10px] uppercase tracking-widest opacity-30">Frequency Mastery</p>
          <div className="text-8xl md:text-9xl instrument-serif leading-none">{stats.avg}%</div>
          <p className="text-sm italic opacity-40 leading-relaxed">The average precision of your fragments relative to their detected genres.</p>
        </div>

        <div className="border border-echo-border p-12 space-y-8 hover:border-white/10 transition-colors">
          <p className="text-[10px] uppercase tracking-widest opacity-30">Total Echoes</p>
          <div className="text-8xl md:text-9xl instrument-serif leading-none">{stats.total}</div>
          <p className="text-sm italic opacity-40 leading-relaxed">Permanent ripples recorded within the collective silence.</p>
        </div>
      </div>

      <div className="pt-20 border-t border-echo-border/30 text-center">
        <p className="instrument-serif italic text-2xl opacity-20">"To exist is to be recognized by the void."</p>
      </div>
    </div>
  );
};

export default Profile;

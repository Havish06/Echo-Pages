
import React, { useEffect, useState } from 'react';
import { supabase, authService } from '../services/supabaseService.ts';
import { Poem } from '../types.ts';

const Profile: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({ total: 0, avg: 0 });

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

  const handleSignOut = () => authService.logout();

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-6 py-20 space-y-24 animate-fade-in">
      <header className="flex flex-col md:flex-row justify-between items-end gap-8 border-b border-echo-border pb-12">
        <div className="space-y-4">
          <p className="text-[10px] uppercase tracking-[0.4em] opacity-30">Identity</p>
          <h1 className="instrument-serif italic text-7xl">{user.email?.split('@')[0]}</h1>
          <p className="serif-font text-lg italic opacity-50">{user.email}</p>
        </div>
        <button 
          onClick={handleSignOut}
          className="text-[10px] uppercase tracking-widest opacity-30 hover:opacity-100 hover:text-red-400 transition-all border border-echo-border px-6 py-3"
        >
          Dissolve Session
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="border border-echo-border p-12 space-y-6">
          <p className="text-[10px] uppercase tracking-widest opacity-30">Frequency Mastery</p>
          <div className="text-8xl instrument-serif leading-none">{stats.avg}%</div>
          <p className="text-sm italic opacity-40">Average genre accuracy across all fragments.</p>
        </div>

        <div className="border border-echo-border p-12 space-y-6">
          <p className="text-[10px] uppercase tracking-widest opacity-30">Total Echoes</p>
          <div className="text-8xl instrument-serif leading-none">{stats.total}</div>
          <p className="text-sm italic opacity-40">Permanent ripples left in the void.</p>
        </div>
      </div>
    </div>
  );
};

export default Profile;

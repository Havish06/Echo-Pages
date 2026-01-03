
import React, { useEffect, useState } from 'react';
import { supabase, authService } from '../services/supabaseService.ts';

const Profile: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [displayName, setDisplayName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [stats, setStats] = useState({ total: 0, avg: 75 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setDisplayName(session?.user?.user_metadata?.display_name || '');
      if (session?.user) loadUserStats(session.user.id);
    });
  }, []);

  const loadUserStats = async (userId: string) => {
    const { data } = await supabase.from('echoes').select('score').eq('user_id', userId);
    if (data && data.length > 0) {
      setStats({ total: data.length, avg: 75 });
    }
  };

  const handleUpdateName = async () => {
    setLoading(true);
    try {
      await authService.updateDisplayName(displayName);
      setIsEditing(false);
      alert("Frequency updated.");
    } catch (e) {
      alert("Update failed.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-6 py-20 space-y-20 animate-fade-in">
      <header className="border-b border-echo-border pb-16 space-y-12">
        <div className="space-y-4">
          <p className="text-[10px] uppercase tracking-[0.4em] opacity-30">Identity Anchor</p>
          <div className="flex items-center space-x-6">
            {isEditing ? (
              <div className="flex-grow flex items-center space-x-4">
                <input 
                  type="text" 
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="instrument-serif italic text-6xl bg-transparent border-b border-echo-text w-full focus:outline-none"
                  autoFocus
                />
                <button onClick={handleUpdateName} disabled={loading} className="text-xs uppercase tracking-widest opacity-50 hover:opacity-100">Save</button>
                <button onClick={() => setIsEditing(false)} className="text-xs uppercase tracking-widest opacity-20">Cancel</button>
              </div>
            ) : (
              <h1 
                onClick={() => setIsEditing(true)}
                className="instrument-serif italic text-6xl md:text-8xl cursor-pointer hover:opacity-70 transition-opacity"
              >
                {displayName || 'Anonymous'}
              </h1>
            )}
          </div>
          <p className="serif-font text-lg italic opacity-40">{user.email}</p>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="p-10 border border-echo-border space-y-6">
          <p className="text-[10px] uppercase tracking-widest opacity-30">Mastery Score</p>
          <div className="text-7xl instrument-serif">{stats.avg}%</div>
          <p className="text-xs italic opacity-40">Your current resonance within the Hierarchy.</p>
        </div>
        <div className="p-10 border border-echo-border space-y-6">
          <p className="text-[10px] uppercase tracking-widest opacity-30">Total Echoes</p>
          <div className="text-7xl instrument-serif">{stats.total}</div>
          <p className="text-xs italic opacity-40">Fragments committed to the void.</p>
        </div>
      </section>

      <section className="pt-20 border-t border-echo-border space-y-10">
        <p className="text-[10px] uppercase tracking-widest opacity-30">Future Potentials</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 opacity-10">
          <div className="p-8 border border-echo-border text-[9px] uppercase tracking-widest">Spectral Collections</div>
          <div className="p-8 border border-echo-border text-[9px] uppercase tracking-widest">Echo Merging</div>
          <div className="p-8 border border-echo-border text-[9px] uppercase tracking-widest">Void Duets</div>
        </div>
      </section>
    </div>
  );
};

export default Profile;

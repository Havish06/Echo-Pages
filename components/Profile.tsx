
import React, { useEffect, useState } from 'react';
import { supabase, authService } from '../services/supabaseService.ts';
import { Poem } from '../types.ts';

const Profile: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [stats, setStats] = useState({ total: 0, avg: 0 });
  const [loading, setLoading] = useState(false);
  const [userEchoes, setUserEchoes] = useState<Poem[]>([]);

  const loadUserStatsAndEchoes = async (userId: string) => {
    const { data, error } = await supabase.from('echoes').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (!error && data) {
      const totalScore = data.reduce((acc, curr) => acc + (curr.score || 0), 0);
      setStats({ total: data.length, avg: data.length > 0 ? Math.round(totalScore / data.length) : 0 });
      setUserEchoes(data.map(d => ({
        id: String(d.id),
        title: d.title || '...',
        content: d.content || '',
        author: d.author || 'Anonymous',
        userId: d.user_id || '',
        timestamp: new Date(d.created_at).getTime(),
        emotionTag: d.emotion_tag || 'Echo',
        emotionalWeight: Number(d.emotional_weight) || 50,
        score: Number(d.score) || 0,
        tone: 'melancholic', 
        genre: d.genre || 'Echo',
        backgroundColor: d.background_color || '',
        visibility: 'echoes'
      })));
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      setDisplayName(u?.user_metadata?.display_name || '');
      setUsername(u?.user_metadata?.username || '');
      setAvatarUrl(u?.user_metadata?.avatar_url || '');
      if (u) loadUserStatsAndEchoes(u.id);
    });
  }, []);

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      await authService.updateProfile({ 
        display_name: displayName,
        username: username,
        avatar_url: avatarUrl
      });
      setIsEditing(false);
    } catch (err) {
      alert("Metamorphosis failed. The identity remains unchanged.");
    } finally {
      setLoading(false);
    }
  };

  const generatePhantomAvatar = () => {
    const seed = Math.random().toString(36).substring(7);
    setAvatarUrl(`https://api.dicebear.com/7.x/shapes/svg?seed=${seed}&backgroundColor=0a0a0a,111111`);
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-6 py-20 space-y-20 animate-fade-in">
      <header className="border-b border-echo-border pb-16 space-y-12">
        <div className="flex flex-col md:flex-row gap-12 items-center md:items-start">
          {/* Avatar Area */}
          <div className="relative group">
            <div className="w-32 h-32 md:w-48 md:h-48 border border-white/10 rounded-sm overflow-hidden bg-neutral-900 shadow-2xl transition-all hover:border-white/30">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Identity" className="w-full h-full object-cover opacity-80" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[10px] uppercase tracking-widest opacity-20">No Sigil</div>
              )}
            </div>
            {isEditing && (
              <button 
                onClick={generatePhantomAvatar}
                className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-white text-black px-4 py-1.5 text-[8px] uppercase tracking-[0.3em] font-black hover:bg-neutral-200 transition-all whitespace-nowrap shadow-xl"
              >
                Generate Sigil
              </button>
            )}
          </div>

          <div className="flex-grow space-y-6 text-center md:text-left w-full">
            <p className="text-[10px] uppercase tracking-[0.4em] opacity-90 font-black text-white">Identity Anchor</p>
            {isEditing ? (
              <div className="space-y-6">
                <div className="space-y-1">
                  <label className="text-[8px] uppercase tracking-widest opacity-40">Display Name</label>
                  <input 
                    type="text" 
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="Fragment Observer"
                    className="instrument-serif italic text-4xl bg-transparent border-b border-white/20 w-full focus:outline-none text-white pb-2"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[8px] uppercase tracking-widest opacity-40">Username</label>
                    <div className="flex gap-2 items-center border-b border-white/10">
                      <span className="opacity-40 text-sm">@</span>
                      <input 
                        type="text" 
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        placeholder="observer"
                        className="instrument-serif text-2xl bg-transparent w-full focus:outline-none text-white/60 py-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] uppercase tracking-widest opacity-40">Avatar URL</label>
                    <input 
                      type="text" 
                      value={avatarUrl}
                      onChange={e => setAvatarUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-neutral-900 border border-white/10 px-3 py-2 text-[10px] uppercase tracking-widest text-white/40 focus:border-white/30 outline-none"
                    />
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <button onClick={handleUpdateProfile} disabled={loading} className="px-6 py-2 bg-white text-black text-[10px] uppercase tracking-widest font-black hover:bg-neutral-200 transition-all">
                    {loading ? 'Encrypting...' : 'Save changes'}
                  </button>
                  <button onClick={() => setIsEditing(false)} className="px-6 py-2 border border-white/20 text-white text-[10px] uppercase tracking-widest font-black hover:bg-white/10 transition-all">Discard</button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <h1 className="instrument-serif italic text-6xl md:text-8xl text-white leading-none">
                    {displayName || 'Anonymous'}
                  </h1>
                  <p className="instrument-serif text-3xl opacity-40 italic">@{username || 'observer'}</p>
                </div>
                <button 
                  onClick={() => setIsEditing(true)} 
                  className="text-[10px] uppercase tracking-widest opacity-40 hover:opacity-100 transition-all border-b border-white/20 pb-1"
                >
                  Modify Identity
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="p-10 border border-white/20 bg-white/5 space-y-6 rounded-sm">
          <p className="text-[10px] uppercase tracking-widest opacity-90 font-black text-white">Mastery Score</p>
          <div className="text-7xl instrument-serif text-white font-bold">{stats.avg}%</div>
        </div>
        <div className="p-10 border border-white/20 bg-white/5 space-y-6 rounded-sm">
          <p className="text-[10px] uppercase tracking-widest opacity-90 font-black text-white">Total Echoes</p>
          <div className="text-7xl instrument-serif text-white font-bold">{stats.total}</div>
        </div>
      </section>

      {/* My Echoes Management */}
      <section className="space-y-12">
        <header className="flex justify-between items-center border-b border-white/10 pb-4">
          <h2 className="instrument-serif text-4xl italic">Your Recorded Echoes</h2>
          <p className="text-[10px] uppercase tracking-widest opacity-30">{userEchoes.length} Fragments persists</p>
        </header>

        <div className="space-y-4">
          {userEchoes.map(echo => (
            <div key={echo.id} className="flex items-center justify-between p-6 border border-white/5 hover:bg-white/[0.02] transition-all group rounded-sm">
              <div className="space-y-1">
                <h3 className="instrument-serif text-2xl group-hover:italic transition-all">{echo.title}</h3>
                <p className="text-[10px] uppercase tracking-widest opacity-30">{echo.genre} · {new Date(echo.timestamp).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center space-x-6">
                <button 
                  onClick={() => window.location.hash = `#/p/${echo.id}`}
                  className="text-[10px] uppercase tracking-widest opacity-30 hover:opacity-100 transition-all font-black"
                >
                  View
                </button>
              </div>
            </div>
          ))}
          {userEchoes.length === 0 && (
            <div className="text-center py-20 opacity-20 italic serif-font text-xl">The void awaits your first whisper.</div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Profile;

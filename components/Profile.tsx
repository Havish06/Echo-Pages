
import React, { useEffect, useState } from 'react';
import { supabase, authService, supabaseService } from '../services/supabaseService.ts';
import { Poem, UserProfile } from '../types.ts';
import { getResonanceColor } from '../utils.ts';

interface ProfileProps {
  userId?: string | null;
}

const Profile: React.FC<ProfileProps> = ({ userId: externalUserId }) => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [userEchoes, setUserEchoes] = useState<Poem[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const isOwnProfile = !externalUserId || (currentUser && currentUser.id === externalUserId);
  const targetId = externalUserId || currentUser?.id;

  const loadProfileData = async (uid: string) => {
    setLoading(true);
    try {
      const [prof, echoes, session] = await Promise.all([
        supabaseService.getUserProfile(uid),
        supabase.from('echoes').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
        supabase.auth.getSession()
      ]);

      const sessUser = session.data.session?.user;
      setCurrentUser(sessUser);

      if (prof) {
        setProfile(prof);
      }
      
      if (echoes.data) {
        setUserEchoes(echoes.data.map(d => ({
          id: String(d.id),
          title: d.title || '...',
          content: d.content || '',
          author: d.author || 'Anonymous',
          userId: d.user_id || '',
          timestamp: new Date(d.created_at).getTime(),
          score: Number(d.score) || 0,
          genre: d.genre || 'Echo',
          tone: d.tone || 'melancholic',
          backgroundColor: d.background_color || '',
          visibility: 'echoes',
          likesCount: 0, // Placeholder
          dislikesCount: 0 // Placeholder
        })));
      }

      if (sessUser && !isOwnProfile) {
        const following = await supabaseService.getFollowingIds(sessUser.id);
        setIsFollowing(following.includes(uid));
      }

      if (isOwnProfile && sessUser) {
        setDisplayName(sessUser.user_metadata?.display_name || '');
        setUsername(sessUser.user_metadata?.username || '');
        setAvatarUrl(sessUser.user_metadata?.avatar_url || '');
      }
    } catch (err) {
      console.error("Profile load failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const { data } = await supabase.auth.getSession();
        const sessionUser = data.session?.user || null;
        setCurrentUser(sessionUser);

        const uid = externalUserId || sessionUser?.id;
        if (uid) {
          await loadProfileData(uid);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Profile initialization failed", err);
        setLoading(false);
      }
    };
    init();
  }, [externalUserId]);

  const handleUpdateProfile = async () => {
    setActionLoading(true);
    try {
      await authService.updateProfile({ 
        display_name: displayName,
        username: username,
        avatar_url: avatarUrl
      });
      setIsEditing(false);
      if (targetId) loadProfileData(targetId);
    } catch (err) {
      alert("Metamorphosis failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUser || !targetId || actionLoading) return;
    setActionLoading(true);
    try {
      if (isFollowing) {
        await supabaseService.unfollowUser(currentUser.id, targetId);
        setIsFollowing(false);
      } else {
        await supabaseService.followUser(currentUser.id, targetId);
        setIsFollowing(true);
      }
      loadProfileData(targetId);
    } catch (err) {
      console.error("Follow action failed", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePoem = async (poemId: string) => {
    setActionLoading(true);
    try {
      const success = await supabaseService.deleteEcho(poemId);
      if (success) {
        setConfirmDeleteId(null);
        if (targetId) loadProfileData(targetId);
      }
    } catch (err) {
      console.error("Delete failed", err);
    } finally {
      setActionLoading(false);
    }
  };

  const generatePhantomAvatar = () => {
    const seed = Math.random().toString(36).substring(7);
    setAvatarUrl(`https://api.dicebear.com/7.x/shapes/svg?seed=${seed}&backgroundColor=0a0a0a,111111`);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center italic instrument-serif text-2xl opacity-40">Tuning into frequency...</div>;
  if (!profile && !isOwnProfile) return <div className="min-h-screen flex items-center justify-center italic instrument-serif text-2xl opacity-40">Identity lost to the void.</div>;

  return (
    <div className="max-w-4xl mx-auto px-6 py-20 space-y-20 animate-fade-in">
      <header className="border-b border-echo-border pb-16 space-y-12">
        <div className="flex flex-col md:flex-row gap-12 items-center md:items-start">
          <div className="relative group">
            <div className="w-32 h-32 md:w-48 md:h-48 border border-white/10 rounded-sm overflow-hidden bg-neutral-900 shadow-2xl transition-all hover:border-white/30">
              {(isOwnProfile ? avatarUrl : profile?.avatarUrl) ? (
                <img src={isOwnProfile ? avatarUrl : profile?.avatarUrl} alt="Identity" className="w-full h-full object-cover opacity-80" />
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
            <div className="flex justify-between items-start">
               <p className="text-[10px] uppercase tracking-[0.4em] opacity-90 font-black text-white">Identity Anchor</p>
               {!isOwnProfile && currentUser && (
                 <button 
                   onClick={handleFollowToggle}
                   disabled={actionLoading}
                   className={`px-8 py-2 text-[10px] uppercase tracking-[0.3em] font-black transition-all border ${isFollowing ? 'border-white/20 text-white/60 hover:border-red-500/40 hover:text-red-400' : 'border-white bg-white text-black hover:bg-transparent hover:text-white'}`}
                 >
                   {actionLoading ? '...' : isFollowing ? 'Unfollow' : 'Follow'}
                 </button>
               )}
            </div>
            
            {isEditing ? (
              <div className="space-y-6">
                <div className="space-y-4">
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
                </div>
                <div className="flex gap-4 pt-4">
                  <button onClick={handleUpdateProfile} disabled={actionLoading} className="px-6 py-2 bg-white text-black text-[10px] uppercase tracking-widest font-black hover:bg-neutral-200 transition-all">
                    {actionLoading ? 'Encrypting...' : 'Save changes'}
                  </button>
                  <button onClick={() => setIsEditing(false)} className="px-6 py-2 border border-white/20 text-white text-[10px] uppercase tracking-widest font-black hover:bg-white/10 transition-all">Discard</button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <h1 className="instrument-serif italic text-6xl md:text-8xl text-white leading-none">
                    {isOwnProfile ? (displayName || 'Anonymous') : (profile?.displayName || 'Anonymous')}
                  </h1>
                  <p className="instrument-serif text-3xl opacity-40 italic">@{isOwnProfile ? (username || 'observer') : (profile?.username || 'observer')}</p>
                </div>
                
                <div className="flex justify-center md:justify-start space-x-8 text-[10px] uppercase tracking-[0.2em] font-bold opacity-60">
                  <span>{profile?.followersCount || 0} Followers</span>
                  <span>{profile?.followingCount || 0} Following</span>
                </div>

                {isOwnProfile && (
                  <button 
                    onClick={() => setIsEditing(true)} 
                    className="text-[10px] uppercase tracking-widest opacity-40 hover:opacity-100 transition-all border-b border-white/20 pb-1"
                  >
                    Modify Identity
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="p-10 border border-white/20 bg-white/5 space-y-6 rounded-sm">
          <p className="text-[10px] uppercase tracking-widest opacity-90 font-black text-white">Mean Resonance</p>
          <div className="text-7xl instrument-serif text-white font-bold">{profile?.avgScore || 0}%</div>
        </div>
        <div className="p-10 border border-white/20 bg-white/5 space-y-6 rounded-sm">
          <p className="text-[10px] uppercase tracking-widest opacity-90 font-black text-white">Total Echoes</p>
          <div className="text-7xl instrument-serif text-white font-bold">{profile?.totalPoems || 0}</div>
        </div>
      </section>

      <section className="space-y-12">
        <header className="flex justify-between items-center border-b border-white/10 pb-4">
          <h2 className="instrument-serif text-4xl italic">{isOwnProfile ? 'Your Recorded Echoes' : 'Public Echoes'}</h2>
          <p className="text-[10px] uppercase tracking-widest opacity-30">{userEchoes.length} Fragments persists</p>
        </header>

        <div className="space-y-6">
          {userEchoes.map(echo => {
            const resonanceColor = getResonanceColor(echo.score);
            return (
              <div key={echo.id} className="p-8 border border-white/5 hover:bg-white/[0.02] transition-all group rounded-sm space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <h3 className="instrument-serif text-3xl group-hover:italic transition-all">{echo.title}</h3>
                    <p className="text-[10px] uppercase tracking-widest opacity-30 font-black">{echo.genre} · {new Date(echo.timestamp).toLocaleDateString()}</p>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2 min-w-[120px]">
                    <span className="text-[9px] font-mono font-bold opacity-40 uppercase tracking-widest">Resonance: {echo.score}%</span>
                    <div className="w-full md:w-32 h-1 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full transition-all duration-1000"
                        style={{ 
                          width: `${echo.score}%`, 
                          backgroundColor: resonanceColor,
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button 
                      onClick={() => window.location.hash = `#/p/${echo.id}`}
                      className="px-6 py-2 border border-white/10 hover:border-white text-[9px] uppercase tracking-widest opacity-40 hover:opacity-100 transition-all font-black text-white"
                    >
                      Enter Frequency
                    </button>
                    {isOwnProfile && (
                      <div className="flex gap-2">
                        {confirmDeleteId === echo.id ? (
                          <>
                            <button 
                              onClick={() => handleDeletePoem(echo.id)}
                              disabled={actionLoading}
                              className="px-4 py-2 bg-red-500/20 border border-red-500/50 text-[9px] uppercase tracking-widest font-black text-red-400 hover:bg-red-500/30 transition-all"
                            >
                              Confirm
                            </button>
                            <button 
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-4 py-2 border border-white/10 text-[9px] uppercase tracking-widest font-black text-white/40 hover:text-white transition-all"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button 
                            onClick={() => setConfirmDeleteId(echo.id)}
                            className="px-6 py-2 border border-red-500/10 hover:border-red-500/40 text-[9px] uppercase tracking-widest opacity-40 hover:opacity-100 transition-all font-black text-red-400"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {userEchoes.length === 0 && (
            <div className="text-center py-20 italic opacity-20">The void is silent here.</div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Profile;

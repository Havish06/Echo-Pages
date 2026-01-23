import React, { useState, useEffect, useRef } from 'react';
import { Poem, View } from './types.ts';
import { geminiService } from './services/geminiService.ts';
import { supabaseService, supabase } from './services/supabaseService.ts';
import { ADMIN_EMAILS } from './constants.ts';

import Header from './components/Header.tsx';
import Footer from './components/Footer.tsx';
import Home from './components/Home.tsx';
import Feed from './components/Feed.tsx';
import PoemDetail from './components/PoemDetail.tsx';
import CreatePoem from './components/CreatePoem.tsx';
import About from './components/About.tsx';
import Contact from './components/Contact.tsx';
import Privacy from './components/Privacy.tsx';
import Profile from './components/Profile.tsx';
import Leaderboard from './components/Leaderboard.tsx';
import Auth from './components/Auth.tsx';
import AdminPortal from './components/AdminPortal.tsx';

// Expanded high-contrast atmospheric color pairs for maximum diversity
const ATMOSPHERIC_PALETTE = [
  ['#0f172a', '#1e1b4b'], // Midnight Indigo
  ['#1e1b4b', '#450a0a'], // Bruised Crimson
  ['#020617', '#1e293b'], // Deep Slate
  ['#2d0a0a', '#000000'], // Blood & Shadow
  ['#1e1b0b', '#451a03'], // Burnt Umber
  ['#082f49', '#0c4a6e'], // Ocean Abyss
  ['#171717', '#404040'], // Gunmetal
  ['#312e81', '#1e1b4b'], // Twilight Navy
  ['#4c1d95', '#1e1b4b'], // Royal Violet
  ['#064e3b', '#022c22'], // Forest Noir
  ['#18181b', '#3f3f46'], // Zinc Shadow
  ['#450a0a', '#1a1a1a'], // Crimson Void
  ['#022c22', '#064e3b'], // Emerald Depths
  ['#1e1b4b', '#2d0a45'], // Amethyst Dusk
  ['#0f172a', '#164e63'], // Cyan Depths
  ['#2d0a0a', '#581c87'], // Vampire Purple
  ['#111827', '#312e81'], // Starry Night
  ['#000000', '#262626'], // Infinite Void
  ['#431407', '#1a0b2e'], // Rust & Phantom
  ['#312e81', '#1e3a8a'], // Electric Cobalt
  ['#450a0a', '#7f1d1d'], // Dried Blood
  ['#065f46', '#022c22'], // Mossy Stone
  ['#1e293b', '#0f172a'], // Cold Rain
  ['#2e1065', '#4c1d95'], // Deep Orchid
  ['#0c4a6e', '#164e63'], // Arctic Water
  ['#581c87', '#2e1065'], // Spectral Violet
  ['#1a1a1a', '#450a0a'], // Ash & Ember
  ['#020617', '#082f49'], // Deep Sea
  ['#1e1b4b', '#312e81'], // Horizon Dusk
  ['#1a0b2e', '#2d0a0a'], // Witching Hour
  ['#4c1d95', '#0f172a'], // Neon Shadow
  ['#162221', '#064e3b'], // Midnight Moss
  ['#2d1b1b', '#450a0a'], // Iron Oxide
  ['#1e1b4b', '#1e1b4b'], // Solid Indigo
  ['#0f172a', '#334155'], // Slate Steel
  ['#4c0519', '#881337'], // Rose Black
  ['#06202a', '#083344'], // Dark Cyan
  ['#1a1a2e', '#16213e'], // Cyber Navy
  ['#2d3436', '#000000'], // Charcoal Void
  ['#093028', '#237a57'], // Deep Jungle
  ['#4e4376', '#2b5876'], // Atmospheric Grey
  ['#141e30', '#243b55'], // Royal Night
  ['#0f0c29', '#302b63'], // Classic Shadow
  ['#114357', '#0f0c29'], // Storm Blue
  ['#3a1c71', '#d76d77'], // Sunset Bruise (Darkened)
  ['#1e130c', '#9a8478'], // Ash Sand
  ['#2c3e50', '#000000'], // Moon Noir
  ['#134e4a', '#0f172a'], // Teal Abyss
  ['#312e81', '#4c1d95'], // Indigo Royal
  ['#450a0a', '#1e1b4b'], // Wine and Night
];

export const getAtmosphericGradient = (id: string) => {
  if (!id) return 'linear-gradient(180deg, #0f172a 0%, #1e1b4b 100%)';
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  
  const palette = ATMOSPHERIC_PALETTE[Math.abs(hash) % ATMOSPHERIC_PALETTE.length];
  return `linear-gradient(180deg, ${palette[0]} 0%, ${palette[1]} 100%)`;
};

const App: React.FC = () => {
  const [adminPoems, setAdminPoems] = useState<Poem[]>([]);
  const [userPoems, setUserPoems] = useState<Poem[]>([]);
  const [currentView, setCurrentView] = useState<View>('home');
  const [previousView, setPreviousView] = useState<View>('home');
  const [selectedPoemId, setSelectedPoemId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const currentViewRef = useRef<View>('home');
  useEffect(() => {
    currentViewRef.current = currentView;
  }, [currentView]);

  const [dailyLine, setDailyLine] = useState<string>(() => {
    return localStorage.getItem('echo_daily_line_v1') || "Silence is the only thing we truly own.";
  });

  const [showOnboarding, setShowOnboarding] = useState(false);

  const syncStateWithHash = async () => {
    const hash = window.location.hash || '#/';
    const { data: { session } } = await supabase.auth.getSession();
    setCurrentUser(session?.user ?? null);
    
    let targetView: View = 'home';
    let targetPoemId: string | null = null;

    if (hash.startsWith('#/p/')) {
      targetView = 'detail';
      targetPoemId = hash.replace('#/p/', '');
    } else {
      const views: Record<string, View> = {
        '#/read': 'feed',
        '#/echoes': 'user-feed',
        '#/create': 'create',
        '#/about': 'about',
        '#/contact': 'contact',
        '#/privacy': 'privacy',
        '#/profile': 'profile',
        '#/ranks': 'leaderboard',
        '#/auth': 'auth',
        '#/admin': 'admin',
        '#/': 'home'
      };
      targetView = views[hash] || 'home';
    }

    if (['profile', 'create', 'admin'].includes(targetView) && !session) {
      window.location.hash = '#/auth';
      return;
    }
    if (targetView === 'admin' && session && !ADMIN_EMAILS.includes(session.user.email || '')) {
      window.location.hash = '#/';
      return;
    }

    const lastView = currentViewRef.current;
    if (lastView !== 'detail' && lastView !== targetView) {
      setPreviousView(lastView);
    }

    setSelectedPoemId(targetPoemId);
    setCurrentView(targetView);
  };

  const refreshData = async () => {
    try {
      const [admins, users] = await Promise.all([
        supabaseService.getAdminPoems(),
        supabaseService.getEchoes()
      ]);
      setAdminPoems(admins || []);
      setUserPoems(users || []);
    } catch (err) {
      console.error("Data Refresh Failed:", err);
    }
  };

  useEffect(() => {
    const handleHashChange = () => syncStateWithHash();
    window.addEventListener('hashchange', handleHashChange);
    syncStateWithHash();
    refreshData();

    const channel = supabase.channel('global_echo_sync')
      .on('postgres_changes', { event: '*', table: 'echoes', schema: 'public' }, () => refreshData())
      .on('postgres_changes', { event: '*', table: 'admin_poems', schema: 'public' }, () => refreshData())
      .subscribe();

    geminiService.getDailyLine().then(line => setDailyLine(line));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setCurrentUser(session?.user ?? null);
      if (event === 'SIGNED_IN') {
        if (!sessionStorage.getItem('echo_onboarded')) {
          setShowOnboarding(true);
          sessionStorage.setItem('echo_onboarded', 'true');
        }
        syncStateWithHash();
      }
    });

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, []);

  const navigateTo = (view: View, poemId: string | null = null) => {
    const routes: Record<View, string> = {
      'home': '#/',
      'feed': '#/read',
      'user-feed': '#/echoes',
      'create': '#/create',
      'about': '#/about',
      'contact': '#/contact',
      'privacy': '#/privacy',
      'admin': '#/admin',
      'profile': '#/profile',
      'leaderboard': '#/ranks',
      'auth': '#/auth',
      'detail': `#/p/${poemId}`
    };
    window.location.hash = routes[view];
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePublish = async (newPoem: Partial<Poem>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const effectiveUserId = (newPoem.userId === 'admin') ? 'admin' : (session?.user?.id || 'anonymous');
      const isAdminUser = effectiveUserId === 'admin' || (!!session?.user?.email && ADMIN_EMAILS.includes(session.user.email));
      const visibility = isAdminUser ? 'read' : 'echoes';
      
      const originalTitle = newPoem.title?.trim();
      
      const meta = await geminiService.analyzePoem(newPoem.content || '', originalTitle);

      const fullPoem: Partial<Poem> = {
        ...newPoem,
        userId: effectiveUserId,
        title: meta.suggestedTitle,
        visibility: visibility,
        emotionTag: meta.emotionTag,
        emotionalWeight: meta.emotionalWeight,
        score: meta.score,
        genre: meta.genre,
        justification: meta.justification,
        backgroundColor: meta.backgroundGradient
      };

      let saved: Poem | null = isAdminUser 
        ? await supabaseService.createAdminPoem(fullPoem)
        : await supabaseService.createEcho(fullPoem);

      if (!saved || !saved.id) throw new Error("Sync failed.");
      
      if (isAdminUser) {
        setAdminPoems(prev => [saved!, ...prev]);
        navigateTo('feed');
      } else {
        setUserPoems(prev => [saved!, ...prev]);
        navigateTo('user-feed');
      }

    } catch (err) {
      console.error("Publication Error:", err);
      alert("The transmission was interrupted by the void. Please try again.");
      throw err;
    }
  };

  const allPoems = [...adminPoems, ...userPoems];
  const selectedPoem = allPoems.find(p => p.id === selectedPoemId);

  return (
    <div className="min-h-screen flex flex-col bg-echo-bg text-echo-text selection:bg-white/10">
      <Header currentView={currentView} onNavigate={navigateTo} />
      
      <main className="flex-grow">
        {currentView === 'home' && <Home dailyLine={dailyLine} onNavigate={navigateTo} />}
        {(currentView === 'feed' || currentView === 'user-feed') && (
          <div className="pt-10 animate-fade-in">
            <header className="mb-12 text-center space-y-4">
              <h2 className="instrument-serif text-6xl md:text-8xl italic opacity-95 tracking-tighter">
                {currentView === 'feed' ? 'Read' : 'Echoes'}
              </h2>
              <p className="text-[10px] uppercase tracking-[0.5em] opacity-80 font-bold">
                {currentView === 'feed' ? 'Curated Introspection' : 'Community Resonance'}
              </p>
            </header>
            <Feed 
              poems={currentView === 'feed' ? adminPoems : userPoems} 
              onSelectPoem={(id) => navigateTo('detail', id)} 
              currentUser={currentUser}
            />
          </div>
        )}
        {currentView === 'detail' && selectedPoem && (
          <PoemDetail 
            poem={selectedPoem} 
            onBack={() => navigateTo(previousView)} 
            currentUser={currentUser}
          />
        )}
        {currentView === 'create' && <CreatePoem onPublish={handlePublish} onCancel={() => navigateTo('home')} />}
        {currentView === 'admin' && <AdminPortal onPublish={handlePublish} onCancel={() => navigateTo('home')} />}
        {currentView === 'leaderboard' && <Leaderboard />}
        {currentView === 'profile' && <Profile />}
        {currentView === 'auth' && <Auth />}
        {currentView === 'about' && <About />}
        {currentView === 'contact' && <Contact />}
        {currentView === 'privacy' && <Privacy />}
      </main>

      {showOnboarding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-2xl animate-fade-in p-6 text-white">
          <div className="max-w-xl w-full text-center space-y-12">
            <h2 className="instrument-serif italic text-7xl md:text-8xl">Echosystem</h2>
            <div className="space-y-8 serif-font textxl md:text-2xl opacity-80 italic leading-relaxed">
              <p>You have entered a sanctuary for fragments.</p>
              <p>Every contribution is analyzed for its unique emotional frequency.</p>
            </div>
            <button 
              onClick={() => setShowOnboarding(false)}
              className="w-full py-6 border-2 border-white/40 hover:border-white transition-all text-[12px] uppercase tracking-[0.5em] font-black"
            >
              Enter the Frequency
            </button>
          </div>
        </div>
      )}

      <Footer onContactClick={() => navigateTo('contact')} onPrivacyClick={() => navigateTo('privacy')} />
    </div>
  );
};

export default App;
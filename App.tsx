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

// Expanded high-contrast atmospheric color pairs for deterministic fallback
const ATMOSPHERIC_PALETTE = [
  ['#0f172a', '#1e1b4b'], ['#1e1b4b', '#450a0a'], ['#020617', '#1e293b'],
  ['#2d0a0a', '#000000'], ['#1e1b0b', '#451a03'], ['#082f49', '#0c4a6e'],
  ['#171717', '#404040'], ['#312e81', '#1e1b4b'], ['#4c1d95', '#1e1b4b']
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

  useEffect(() => { currentViewRef.current = currentView; }, [currentView]);

  const [dailyLine, setDailyLine] = useState<string>(() => {
    return localStorage.getItem('echo_daily_line_v1') || "Silence is the only thing we truly own.";
  });

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
        '#/read': 'feed', '#/echoes': 'user-feed', '#/create': 'create', '#/about': 'about',
        '#/contact': 'contact', '#/privacy': 'privacy', '#/profile': 'profile',
        '#/ranks': 'leaderboard', '#/auth': 'auth', '#/admin': 'admin', '#/': 'home'
      };
      targetView = views[hash] || 'home';
    }

    if (['profile', 'create', 'admin'].includes(targetView) && !session) {
      window.location.hash = '#/auth';
      return;
    }
    
    const lastView = currentViewRef.current;
    if (lastView !== 'detail' && lastView !== targetView) setPreviousView(lastView);

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
    } catch (err) { console.error("Data Refresh Failed:", err); }
  };

  useEffect(() => {
    window.addEventListener('hashchange', syncStateWithHash);
    syncStateWithHash();
    refreshData();

    const channel = supabase.channel('global_echo_sync')
      .on('postgres_changes', { event: '*', table: 'echoes', schema: 'public' }, () => refreshData())
      .on('postgres_changes', { event: '*', table: 'admin_poems', schema: 'public' }, () => refreshData())
      .subscribe();

    geminiService.getDailyLine().then(line => setDailyLine(line));

    return () => {
      window.removeEventListener('hashchange', syncStateWithHash);
      supabase.removeChannel(channel);
    };
  }, []);

  const navigateTo = (view: View, poemId: string | null = null) => {
    const routes: Record<View, string> = {
      'home': '#/', 'feed': '#/read', 'user-feed': '#/echoes', 'create': '#/create',
      'about': '#/about', 'contact': '#/contact', 'privacy': '#/privacy', 'admin': '#/admin',
      'profile': '#/profile', 'leaderboard': '#/ranks', 'auth': '#/auth', 'detail': `#/p/${poemId}`
    };
    window.location.hash = routes[view];
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePublish = async (newPoem: Partial<Poem>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const isAdminUser = newPoem.userId === 'admin' || (!!session?.user?.email && ADMIN_EMAILS.includes(session.user.email));
      
      // AI analysis - shared for both Read and Echoes
      const meta = await geminiService.analyzePoem(newPoem.content || '', newPoem.title);
      
      // Final Safety Barrier
      if (!meta.isSafe) throw new Error(meta.errorReason || "Forbidden Resonance");

      // MVP FEATURE 1: TITLE GENERATION
      // If no title provided by user, always use the AI generated one.
      const finalTitle = (newPoem.title && newPoem.title.trim() !== "" && newPoem.title.toLowerCase() !== 'untitled') 
        ? newPoem.title 
        : meta.suggestedTitle;

      const fullPoem: Partial<Poem> = {
        ...newPoem,
        title: finalTitle,
        emotionTag: meta.emotionTag,
        emotionalWeight: meta.emotionalWeight,
        score: meta.score,
        genre: meta.genre,
        justification: meta.justification,
        backgroundColor: meta.backgroundGradient,
        visibility: isAdminUser ? 'read' : 'echoes'
      };

      let saved: Poem | null = isAdminUser 
        ? await supabaseService.createAdminPoem(fullPoem)
        : await supabaseService.createEcho(fullPoem);

      if (!saved) throw new Error("Sync failure");
      
      if (isAdminUser) {
        setAdminPoems(prev => [saved!, ...prev]);
        navigateTo('feed');
      } else {
        setUserPoems(prev => [saved!, ...prev]);
        navigateTo('user-feed');
      }
    } catch (err) {
      console.error("Publication Error:", err);
      throw err; 
    }
  };

  const allPoems = [...adminPoems, ...userPoems];
  const selectedPoem = allPoems.find(p => p.id === selectedPoemId);

  return (
    <div className="min-h-screen flex flex-col bg-echo-bg text-echo-text">
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
          <PoemDetail poem={selectedPoem} onBack={() => navigateTo(previousView)} />
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
      <Footer onContactClick={() => navigateTo('contact')} onPrivacyClick={() => navigateTo('privacy')} />
    </div>
  );
};

export default App;
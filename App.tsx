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

const App: React.FC = () => {
  const [adminPoems, setAdminPoems] = useState<Poem[]>([]);
  const [userPoems, setUserPoems] = useState<Poem[]>([]);
  const [currentView, setCurrentView] = useState<View>('home');
  const [previousView, setPreviousView] = useState<View>('home');
  const [selectedPoemId, setSelectedPoemId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [dailyLine, setDailyLine] = useState<string>(() => localStorage.getItem('echo_daily_line_v1') || "Silence is the only thing we truly own.");

  const currentViewRef = useRef<View>('home');
  useEffect(() => { currentViewRef.current = currentView; }, [currentView]);

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
    
    if (currentViewRef.current !== 'detail' && currentViewRef.current !== targetView) setPreviousView(currentViewRef.current);
    setSelectedPoemId(targetPoemId);
    setCurrentView(targetView);
  };

  const refreshData = async () => {
    try {
      const [admins, users] = await Promise.all([supabaseService.getAdminPoems(), supabaseService.getEchoes()]);
      setAdminPoems(admins || []);
      setUserPoems(users || []);
    } catch (err) { console.error("Data Sync Error:", err); }
  };

  useEffect(() => {
    window.addEventListener('hashchange', syncStateWithHash);
    syncStateWithHash();
    refreshData();
    geminiService.getDailyLine().then(line => setDailyLine(line));
    return () => window.removeEventListener('hashchange', syncStateWithHash);
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
    const meta = await geminiService.analyzePoem(newPoem.content || '', newPoem.title);
    if (!meta.isSafe) throw new Error("Forbidden Resonance");

    const isAdminUser = !!currentUser?.email && ADMIN_EMAILS.includes(currentUser.email);
    const finalPoem: Partial<Poem> = {
      ...newPoem,
      title: (newPoem.title && newPoem.title.trim() !== "" && newPoem.title.toLowerCase() !== 'untitled') ? newPoem.title : meta.suggestedTitle,
      score: meta.score,
      genre: meta.genre,
      justification: meta.justification,
      backgroundColor: meta.backgroundGradient,
      visibility: isAdminUser ? 'read' : 'echoes'
    };

    const saved = isAdminUser ? await supabaseService.createAdminPoem(finalPoem) : await supabaseService.createEcho(finalPoem);
    if (!saved) throw new Error("Transmission Failed");
    refreshData();
    navigateTo(isAdminUser ? 'feed' : 'user-feed');
  };

  const allPoems = [...adminPoems, ...userPoems];
  const selectedPoem = allPoems.find(p => p.id === selectedPoemId);

  return (
    <div className="min-h-screen flex flex-col bg-echo-bg text-echo-text selection:bg-neutral-800">
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
            <Feed poems={currentView === 'feed' ? adminPoems : userPoems} onSelectPoem={(id) => navigateTo('detail', id)} />
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
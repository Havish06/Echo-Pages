
import React, { useState, useEffect } from 'react';
import { Poem, View } from './types.ts';
import { geminiService } from './services/geminiService.ts';
import { supabaseService, supabase } from './services/supabaseService.ts';

import Header from './components/Header.tsx';
import Footer from './components/Footer.tsx';
import Home from './components/Home.tsx';
import Feed from './components/Feed.tsx';
import PoemDetail from './components/PoemDetail.tsx';
import CreatePoem from './components/CreatePoem.tsx';
import About from './components/About.tsx';
import Contact from './components/Contact.tsx';
import Privacy from './components/Privacy.tsx';
import AdminPortal from './components/AdminPortal.tsx';
import Profile from './components/Profile.tsx';
import Leaderboard from './components/Leaderboard.tsx';
import Auth from './components/Auth.tsx';

const App: React.FC = () => {
  const [adminPoems, setAdminPoems] = useState<Poem[]>([]);
  const [userPoems, setUserPoems] = useState<Poem[]>([]);
  const [currentView, setCurrentView] = useState<View>('home');
  const [previousView, setPreviousView] = useState<View>('home');
  const [selectedPoemId, setSelectedPoemId] = useState<string | null>(null);
  
  const [dailyLine, setDailyLine] = useState<string>(() => {
    return localStorage.getItem('echo_daily_line_v1') || "Silence is the only thing we truly own.";
  });

  const [showOnboarding, setShowOnboarding] = useState(false);

  const syncStateWithHash = async (isInitialLoad = false) => {
    if (isInitialLoad) {
      window.location.hash = '#/';
      setCurrentView('home');
      setSelectedPoemId(null);
      return;
    }

    const hash = window.location.hash || '#/';
    const { data: { session } } = await supabase.auth.getSession();
    const protectedViews: View[] = ['profile', 'create', 'admin'];
    
    if (hash.startsWith('#/p/')) {
      const id = hash.replace('#/p/', '');
      setSelectedPoemId(id);
      setCurrentView('detail');
    } else {
      const views: Record<string, View> = {
        '#/read': 'feed',
        '#/echoes': 'user-feed',
        '#/create': 'create',
        '#/about': 'about',
        '#/contact': 'contact',
        '#/privacy': 'privacy',
        '#/admin': 'admin',
        '#/profile': 'profile',
        '#/ranks': 'leaderboard',
        '#/auth': 'auth',
        '#/': 'home'
      };
      
      const targetView = views[hash] || 'home';
      
      if (protectedViews.includes(targetView) && !session) {
        window.location.hash = '#/auth';
        return;
      }

      if (currentView !== 'detail') {
        setPreviousView(currentView);
      }
      setCurrentView(targetView);
      setSelectedPoemId(null);
    }
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
    const handleHashChange = () => syncStateWithHash(false);
    window.addEventListener('hashchange', handleHashChange);
    
    syncStateWithHash(true);
    refreshData();

    geminiService.getDailyLine().then(line => {
      setDailyLine(line);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        if (!sessionStorage.getItem('echo_onboarded')) {
          setShowOnboarding(true);
          sessionStorage.setItem('echo_onboarded', 'true');
        }
        syncStateWithHash(false);
      }
      if (event === 'SIGNED_OUT') {
        sessionStorage.removeItem('echo_onboarded');
        navigateTo('home');
      }
    });

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      subscription.unsubscribe();
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

  const handleAddCommunityPoem = async (newPoem: Partial<Poem>) => {
    const savedPoem = await supabaseService.createEcho(newPoem);
    if (savedPoem) {
      setUserPoems(prev => [savedPoem, ...prev]);
      navigateTo('user-feed');
    }
  };

  const handleAddAdminPoem = async (newPoem: Partial<Poem>) => {
    const savedPoem = await supabaseService.createAdminPoem(newPoem);
    if (savedPoem) {
      setAdminPoems(prev => [savedPoem, ...prev]);
      navigateTo('feed');
    }
  };

  const allPoems = [...adminPoems, ...userPoems];
  const selectedPoem = allPoems.find(p => p.id === selectedPoemId);

  const handleBackFromDetail = (poem: Poem) => {
    if (previousView === 'feed' || previousView === 'user-feed') {
      navigateTo(previousView);
    } else {
      const fallback = poem.author === 'Admin' ? 'feed' : 'user-feed';
      navigateTo(fallback);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-echo-bg text-echo-text relative">
      <Header currentView={currentView} onNavigate={navigateTo} />
      
      <main className="flex-grow">
        <div className="animate-fade-in duration-500">
          {currentView === 'home' && <Home dailyLine={dailyLine} onNavigate={navigateTo} />}
          {currentView === 'feed' && (
            <div className="pt-10">
              <header className="mb-12 text-center space-y-2">
                <h2 className="instrument-serif text-5xl italic opacity-90">Read</h2>
                <p className="text-[10px] uppercase tracking-[0.3em] opacity-30">Curated Curiosities</p>
              </header>
              <Feed 
                variant="grid" 
                poems={adminPoems} 
                onSelectPoem={(id) => navigateTo('detail', id)} 
              />
            </div>
          )}
          {currentView === 'user-feed' && (
            <div className="pt-10">
              <header className="mb-12 text-center space-y-2">
                <h2 className="instrument-serif text-5xl italic opacity-90">Echoes</h2>
                <p className="text-[10px] uppercase tracking-[0.3em] opacity-30">The Community Stream</p>
              </header>
              <Feed 
                variant="grid" 
                poems={userPoems} 
                onSelectPoem={(id) => navigateTo('detail', id)} 
              />
            </div>
          )}
          {currentView === 'detail' && selectedPoem && (
            <PoemDetail poem={selectedPoem} onBack={() => handleBackFromDetail(selectedPoem)} />
          )}
          {currentView === 'create' && <CreatePoem onPublish={handleAddCommunityPoem} onCancel={() => navigateTo('home')} />}
          {currentView === 'leaderboard' && <Leaderboard />}
          {currentView === 'profile' && <Profile />}
          {currentView === 'auth' && <Auth />}
          {currentView === 'about' && <About />}
          {currentView === 'contact' && <Contact />}
          {currentView === 'privacy' && <Privacy />}
          {currentView === 'admin' && <AdminPortal onPublish={handleAddAdminPoem} onCancel={() => navigateTo('home')} />}
        </div>
      </main>

      {showOnboarding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-echo-bg/95 backdrop-blur-xl animate-fade-in p-6">
          <div className="max-w-md w-full text-center space-y-10">
            <h2 className="instrument-serif italic text-6xl">Echo Pages Guide</h2>
            <div className="space-y-6 serif-font text-xl opacity-70 italic">
              <p>Welcome to a sanctuary for the unspoken.</p>
              <p>Observe the curated 'Read' feed, contribute your own 'Echoes', and track your mastery in the 'Ranks'.</p>
              <p>Every fragment you commit is evaluated for genre precision and emotional depth.</p>
            </div>
            <button 
              onClick={() => setShowOnboarding(false)}
              className="w-full py-5 border border-echo-text/20 hover:border-echo-text transition-all text-[11px] uppercase tracking-[0.4em]"
            >
              Begin Observation
            </button>
          </div>
        </div>
      )}

      <Footer onAdminClick={() => navigateTo('admin')} onContactClick={() => navigateTo('contact')} onPrivacyClick={() => navigateTo('privacy')} />
    </div>
  );
};

export default App;


import React, { useState, useEffect } from 'react';
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

const App: React.FC = () => {
  const [adminPoems, setAdminPoems] = useState<Poem[]>([]);
  const [userPoems, setUserPoems] = useState<Poem[]>([]);
  const [currentView, setCurrentView] = useState<View>('home');
  const [previousView, setPreviousView] = useState<View>('home');
  const [selectedPoemId, setSelectedPoemId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [dailyLine, setDailyLine] = useState<string>(() => {
    return localStorage.getItem('echo_daily_line_v1') || "Silence is the only thing we truly own.";
  });

  const [showOnboarding, setShowOnboarding] = useState(false);

  const checkAdmin = (user: any) => {
    return !!user?.email && ADMIN_EMAILS.includes(user.email);
  };

  const syncStateWithHash = async (isInitialLoad = false) => {
    const hash = window.location.hash || '#/';
    const { data: { session } } = await supabase.auth.getSession();
    const protectedViews: View[] = ['profile', 'create'];
    
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
      setAdminPoems((admins || []).filter(p => !!p && !!p.id));
      setUserPoems((users || []).filter(p => !!p && !!p.id));
    } catch (err) {
      console.error("Data Refresh Failed:", err);
    }
  };

  useEffect(() => {
    const handleHashChange = () => syncStateWithHash(false);
    window.addEventListener('hashchange', handleHashChange);
    
    // On mount, sync hash but allow specific deep links
    syncStateWithHash(false);
    refreshData();

    geminiService.getDailyLine().then(line => {
      setDailyLine(line);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAdmin(checkAdmin(session?.user));
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

  const handlePublish = async (newPoem: Partial<Poem>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const isUserAdmin = checkAdmin(session?.user);
      const visibility = isUserAdmin ? 'read' : 'echoes';
      
      const skeletonPoem: Partial<Poem> = {
        ...newPoem,
        title: newPoem.title || 'Whispering...', 
        visibility: visibility,
        emotionTag: 'Echo',
        score: 0,
        genre: 'Analyzing...',
        backgroundColor: '#121212'
      };

      let savedPoem: Poem | null = null;
      if (isUserAdmin) {
        savedPoem = await supabaseService.createAdminPoem(skeletonPoem);
      } else {
        savedPoem = await supabaseService.createEcho(skeletonPoem);
      }

      if (!savedPoem || !savedPoem.id) {
        throw new Error("Supabase rejected the fragment or returned an empty identity.");
      }

      const finalSavedPoem = { ...savedPoem };
      const targetPoemId = String(finalSavedPoem.id);

      // Instant UI update
      if (isUserAdmin) {
        setAdminPoems(prev => [finalSavedPoem, ...prev]);
        navigateTo('feed');
      } else {
        setUserPoems(prev => [finalSavedPoem, ...prev]);
        navigateTo('user-feed');
      }

      // Spectral Calibration Task
      (async () => {
        try {
          const meta = await geminiService.analyzePoem(newPoem.content || '', newPoem.title || '');
          const updates: Partial<Poem> = {
            title: newPoem.title || meta.suggestedTitle,
            emotionTag: meta.emotionTag,
            emotionalWeight: meta.emotionalWeight,
            score: meta.score,
            genre: meta.genre,
            justification: meta.justification,
            backgroundColor: meta.backgroundGradient
          };

          const updated = await supabaseService.updatePoem(targetPoemId, visibility, updates);
          if (updated && updated.id) {
            if (visibility === 'read') {
              setAdminPoems(prev => prev.map(p => (p.id === updated.id) ? updated : p));
            } else {
              setUserPoems(prev => prev.map(p => (p.id === updated.id) ? updated : p));
            }
          }
        } catch (bgErr) {
          console.error("Calibration failed:", bgErr);
        }
      })();

    } catch (err) {
      console.error("Publication Error:", err);
      alert("Transmission interrupted. Try again.");
      throw err; 
    }
  };

  const allPoems = [...adminPoems, ...userPoems];
  const selectedPoem = allPoems.find(p => p.id === selectedPoemId);

  const handleBackFromDetail = (poem: Poem) => {
    if (previousView === 'feed' || previousView === 'user-feed') {
      navigateTo(previousView);
    } else {
      const fallback = (poem && poem.visibility === 'read') ? 'feed' : 'user-feed';
      navigateTo(fallback);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-echo-bg text-echo-text relative overflow-x-hidden">
      <Header currentView={currentView} onNavigate={navigateTo} />
      
      <main className="flex-grow">
        <div className="transition-all duration-700">
          {currentView === 'home' && <Home dailyLine={dailyLine} onNavigate={navigateTo} />}
          {currentView === 'feed' && (
            <div className="pt-10 animate-fade-in">
              <header className="mb-16 text-center space-y-4">
                <h2 className="instrument-serif text-6xl md:text-8xl italic opacity-90 tracking-tighter">Read</h2>
                <div className="flex items-center justify-center gap-4">
                  <div className="h-[1px] w-8 bg-white/20" />
                  <p className="text-[10px] uppercase tracking-[0.5em] opacity-30">The Curated Fragments</p>
                  <div className="h-[1px] w-8 bg-white/20" />
                </div>
              </header>
              <Feed 
                variant="grid" 
                poems={adminPoems} 
                onSelectPoem={(id) => navigateTo('detail', id)} 
              />
            </div>
          )}
          {currentView === 'user-feed' && (
            <div className="pt-10 animate-fade-in">
              <header className="mb-16 text-center space-y-4">
                <h2 className="instrument-serif text-6xl md:text-8xl italic opacity-90 tracking-tighter">Echoes</h2>
                <div className="flex items-center justify-center gap-4">
                  <div className="h-[1px] w-8 bg-white/20" />
                  <p className="text-[10px] uppercase tracking-[0.5em] opacity-30">Community Resonance</p>
                  <div className="h-[1px] w-8 bg-white/20" />
                </div>
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
          {currentView === 'create' && <CreatePoem onPublish={handlePublish} onCancel={() => navigateTo('home')} />}
          {currentView === 'leaderboard' && <Leaderboard />}
          {currentView === 'profile' && <Profile />}
          {currentView === 'auth' && <Auth />}
          {currentView === 'about' && <About />}
          {currentView === 'contact' && <Contact />}
          {currentView === 'privacy' && <Privacy />}
        </div>
      </main>

      {showOnboarding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-echo-bg/95 backdrop-blur-2xl animate-fade-in p-6">
          <div className="max-w-xl w-full text-center space-y-12">
            <h2 className="instrument-serif italic text-7xl md:text-8xl tracking-tight">Echosystem</h2>
            <div className="space-y-8 serif-font text-xl md:text-2xl opacity-60 italic leading-relaxed">
              <p>Welcome to a sanctuary for the unspoken.</p>
              <p>Observe the curated 'Read' feed, contribute your own 'Echoes', and track resonance in 'Ranks'.</p>
              <p>Every fragment committed is evaluated for genre precision and emotional depth by our intelligence.</p>
            </div>
            <button 
              onClick={() => setShowOnboarding(false)}
              className="w-full py-6 border-2 border-white/20 hover:border-white transition-all text-[12px] uppercase tracking-[0.5em] font-black"
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

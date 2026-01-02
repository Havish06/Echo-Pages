
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
  const [selectedPoemId, setSelectedPoemId] = useState<string | null>(null);
  const [dailyLine, setDailyLine] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const syncStateWithHash = () => {
    const hash = window.location.hash || '#/';
    if (hash.startsWith('#/p/')) {
      setSelectedPoemId(hash.replace('#/p/', ''));
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
      setCurrentView(views[hash] || 'home');
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
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    window.addEventListener('hashchange', syncStateWithHash);
    syncStateWithHash();
    refreshData();

    geminiService.getDailyLine().then(line => {
      setDailyLine(line);
    });

    return () => window.removeEventListener('hashchange', syncStateWithHash);
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

  const handleAddCuratePoem = async (newPoem: Partial<Poem>) => {
    const savedPoem = await supabaseService.createAdminCurate(newPoem);
    if (savedPoem) {
      setAdminPoems(prev => [savedPoem, ...prev]);
      navigateTo('feed');
    }
  };

  const allPoems = [...adminPoems, ...userPoems];
  const selectedPoem = allPoems.find(p => p.id === selectedPoemId);

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-500 bg-echo-bg text-echo-text">
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
              <Feed poems={adminPoems} onSelectPoem={(id) => navigateTo('detail', id)} />
            </div>
          )}
          {currentView === 'user-feed' && (
            <div className="pt-10">
              <header className="mb-12 text-center space-y-2">
                <h2 className="instrument-serif text-5xl italic opacity-90">Echoes</h2>
                <p className="text-[10px] uppercase tracking-[0.3em] opacity-30">The Community Stream</p>
              </header>
              <Feed poems={userPoems} onSelectPoem={(id) => navigateTo('detail', id)} />
            </div>
          )}
          {currentView === 'detail' && selectedPoem && (
            <PoemDetail poem={selectedPoem} onBack={() => navigateTo(selectedPoem.author === 'Admin' ? 'feed' : 'user-feed')} />
          )}
          {currentView === 'create' && <CreatePoem onPublish={handleAddCommunityPoem} onCancel={() => navigateTo('home')} />}
          {currentView === 'leaderboard' && <Leaderboard />}
          {currentView === 'profile' && <Profile />}
          {currentView === 'auth' && <Auth />}
          {currentView === 'about' && <About />}
          {currentView === 'contact' && <Contact />}
          {currentView === 'privacy' && <Privacy />}
          {currentView === 'admin' && <AdminPortal onPublish={handleAddCuratePoem} onCancel={() => navigateTo('home')} />}
        </div>
      </main>

      <Footer onAdminClick={() => navigateTo('admin')} onContactClick={() => navigateTo('contact')} onPrivacyClick={() => navigateTo('privacy')} />
    </div>
  );
};

export default App;

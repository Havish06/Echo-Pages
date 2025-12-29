
import React, { useState, useEffect, useRef } from 'react';
import { Poem, View } from './types.ts';
import { geminiService } from './services/geminiService.ts';
import { supabaseService } from './services/supabaseService.ts';

import Header from './components/Header.tsx';
import Footer from './components/Footer.tsx';
import Home from './components/Home.tsx';
import Feed from './components/Feed.tsx';
import PoemDetail from './components/PoemDetail.tsx';
import CreatePoem from './components/CreatePoem.tsx';
import About from './components/About.tsx';
import Contact from './components/Contact.tsx';
import AdminPortal from './components/AdminPortal.tsx';

const App: React.FC = () => {
  const [adminPoems, setAdminPoems] = useState<Poem[]>([]);
  const [userPoems, setUserPoems] = useState<Poem[]>([]);
  const [currentView, setCurrentView] = useState<View>('home');
  const [selectedPoemId, setSelectedPoemId] = useState<string | null>(null);
  const [dailyLine, setDailyLine] = useState<string>(() => localStorage.getItem('echo_daily_line') || 'The echoes are louder than the voices.');
  const [isLoading, setIsLoading] = useState(true);

  // Sync state with URL Hash for internal navigation
  const syncStateWithHash = () => {
    const hash = window.location.hash || '#/';
    
    if (hash.startsWith('#/p/')) {
      const id = hash.replace('#/p/', '');
      setCurrentView('detail');
      setSelectedPoemId(id);
    } else {
      switch (hash) {
        case '#/read':
          setCurrentView('feed');
          setSelectedPoemId(null);
          break;
        case '#/echoes':
          setCurrentView('user-feed');
          setSelectedPoemId(null);
          break;
        case '#/create':
          setCurrentView('create');
          setSelectedPoemId(null);
          break;
        case '#/about':
          setCurrentView('about');
          setSelectedPoemId(null);
          break;
        case '#/contact':
          setCurrentView('contact');
          setSelectedPoemId(null);
          break;
        case '#/admin':
          setCurrentView('admin');
          setSelectedPoemId(null);
          break;
        case '#/':
        default:
          setCurrentView('home');
          setSelectedPoemId(null);
          break;
      }
    }
  };

  useEffect(() => {
    /** 
     * MANDATORY LANDING LOGIC
     * On every refresh or initial load, we force the hash to root.
     * This ensures the user always starts at the "Daily Echo" home page.
     */
    if (window.location.hash !== '' && window.location.hash !== '#/') {
      window.location.hash = '#/';
    }
    
    // Explicitly set state to home to prevent any race conditions with the listener
    setCurrentView('home');
    setSelectedPoemId(null);

    // Start listening for FUTURE hash changes (user clicks within the app)
    window.addEventListener('hashchange', syncStateWithHash);

    const loadInitialData = async () => {
      const hasCache = !!localStorage.getItem('echo_daily_line');
      if (hasCache) setIsLoading(false);

      supabaseService.getAdminPoems().then(setAdminPoems);
      supabaseService.getEchoes().then(setUserPoems);
      
      geminiService.getDailyLine().then(line => {
        setDailyLine(line);
        setIsLoading(false);
      }).catch(() => setIsLoading(false));
    };
    
    loadInitialData();
    return () => window.removeEventListener('hashchange', syncStateWithHash);
  }, []);

  const navigateTo = (view: View, poemId: string | null = null) => {
    let hash = '#/';
    if (view === 'detail' && poemId) hash = `#/p/${poemId}`;
    else if (view === 'feed') hash = '#/read';
    else if (view === 'user-feed') hash = '#/echoes';
    else if (view === 'create') hash = '#/create';
    else if (view === 'about') hash = '#/about';
    else if (view === 'contact') hash = '#/contact';
    else if (view === 'admin') hash = '#/admin';

    window.location.hash = hash;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddPoem = async (newPoem: Poem) => {
    const savedPoem = await supabaseService.createEcho(newPoem);
    if (savedPoem) {
      setUserPoems(prev => [savedPoem, ...prev]);
      navigateTo('user-feed');
    } else {
      alert("The echo failed to reach the void.");
    }
  };

  const handleAddAdminPoem = async (newPoem: Poem) => {
    const savedPoem = await supabaseService.createAdminPoem(newPoem);
    if (savedPoem) {
      setAdminPoems(prev => [savedPoem, ...prev]);
      navigateTo('feed');
    } else {
      alert("Submission failed.");
    }
  };

  const allPoems = [...adminPoems, ...userPoems];
  const selectedPoem = allPoems.find(p => p.id === selectedPoemId);

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-500 bg-echo-bg text-echo-text">
      <Header 
        currentView={currentView} 
        onNavigate={navigateTo} 
      />
      
      <main className="flex-grow">
        {isLoading && currentView === 'home' && !dailyLine ? (
          <div className="min-h-[80vh] flex items-center justify-center opacity-20 italic instrument-serif animate-pulse">
            Opening the void...
          </div>
        ) : (
          <div className="animate-fade-in duration-500">
            {currentView === 'home' && (
              <Home dailyLine={dailyLine} onNavigate={navigateTo} />
            )}
            
            {currentView === 'feed' && (
              <div className="pt-10">
                <div className="max-w-7xl mx-auto px-6 mb-8 text-center">
                  <h2 className="instrument-serif text-4xl italic opacity-80">Read</h2>
                  <p className="text-[10px] uppercase tracking-widest opacity-40 mt-2">Curated Fragments</p>
                </div>
                <Feed poems={adminPoems} onSelectPoem={(id) => navigateTo('detail', id)} />
              </div>
            )}

            {currentView === 'user-feed' && (
              <div className="pt-10">
                <div className="max-w-7xl mx-auto px-6 mb-8 text-center">
                  <h2 className="instrument-serif text-4xl italic opacity-80">By Echoes</h2>
                  <p className="text-[10px] uppercase tracking-widest opacity-40 mt-2">Community Echoes</p>
                </div>
                <Feed poems={userPoems} onSelectPoem={(id) => navigateTo('detail', id)} />
              </div>
            )}
            
            {currentView === 'detail' && selectedPoem && (
              <PoemDetail 
                poem={selectedPoem} 
                onBack={() => {
                  const isAdmin = adminPoems.some(p => p.id === selectedPoem.id);
                  navigateTo(isAdmin ? 'feed' : 'user-feed');
                }} 
              />
            )}
            
            {currentView === 'create' && (
              <CreatePoem onPublish={handleAddPoem} onCancel={() => navigateTo('user-feed')} />
            )}

            {currentView === 'admin' && (
              <AdminPortal onPublish={handleAddAdminPoem} onCancel={() => navigateTo('feed')} />
            )}

            {currentView === 'about' && (
              <About />
            )}

            {currentView === 'contact' && (
              <Contact />
            )}
          </div>
        )}
      </main>

      <Footer onAdminClick={() => navigateTo('admin')} onContactClick={() => navigateTo('contact')} />
    </div>
  );
};

export default App;

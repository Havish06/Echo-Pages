
import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseService.ts';

interface FooterProps {
  onAdminClick?: () => void;
  onContactClick?: () => void;
  onPrivacyClick?: () => void;
}

// Simple admin definition for MVP
const ADMIN_EMAILS = ['havishkanamarlapudi@gmail.com'];

const Footer: React.FC<FooterProps> = ({ onAdminClick, onContactClick, onPrivacyClick }) => {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const userEmail = session?.user?.email;
      setIsAdmin(!!userEmail && ADMIN_EMAILS.includes(userEmail));
    });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const userEmail = session?.user?.email;
      setIsAdmin(!!userEmail && ADMIN_EMAILS.includes(userEmail));
    });
    
    return () => subscription.unsubscribe();
  }, []);

  const handleSecretAdminClick = () => {
    if (isAdmin && onAdminClick) {
      onAdminClick();
    }
  };

  return (
    <footer className="px-6 py-12 border-t border-white/5 opacity-30 bg-echo-bg">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div 
          onClick={handleSecretAdminClick}
          className={`instrument-serif text-lg italic ${isAdmin ? 'cursor-pointer hover:opacity-100 transition-opacity' : 'cursor-default'}`}
        >
          Echo Pages &copy; {new Date().getFullYear()}
        </div>
        
        <div className="flex space-x-6 text-[9px] uppercase tracking-widest items-center">
          <a href="https://instagram.com/echo_pages" target="_blank" rel="noopener noreferrer" className="hover:opacity-100 transition-opacity">Instagram</a>
          <button onClick={onPrivacyClick} className="hover:opacity-100 transition-opacity uppercase">Privacy</button>
          <button onClick={onContactClick} className="hover:opacity-100 transition-opacity uppercase">Contact</button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

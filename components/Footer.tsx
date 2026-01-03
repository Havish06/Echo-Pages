
import React from 'react';

interface FooterProps {
  onAdminClick?: () => void;
  onContactClick?: () => void;
  onPrivacyClick?: () => void;
}

const Footer: React.FC<FooterProps> = ({ onAdminClick, onContactClick, onPrivacyClick }) => {
  return (
    <footer className="px-6 py-12 border-t border-white/5 opacity-30 bg-echo-bg">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="instrument-serif text-lg italic">
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

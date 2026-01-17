
import React from 'react';

interface FooterProps {
  onContactClick?: () => void;
  onPrivacyClick?: () => void;
}

const Footer: React.FC<FooterProps> = ({ onContactClick, onPrivacyClick }) => {
  return (
    <footer className="px-6 py-12 border-t border-white/10 bg-echo-bg text-white/95">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="instrument-serif text-xl italic select-none font-medium opacity-90">
          Echo Pages &copy; {new Date().getFullYear()}
        </div>
        
        <div className="flex space-x-8 text-[10px] uppercase tracking-widest items-center font-black opacity-80">
          <a href="https://instagram.com/echo_pages" target="_blank" rel="noopener noreferrer" className="hover:opacity-100 transition-opacity">Instagram</a>
          <button onClick={onPrivacyClick} className="hover:opacity-100 transition-opacity uppercase">Privacy</button>
          <button onClick={onContactClick} className="hover:opacity-100 transition-opacity uppercase">Contact</button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

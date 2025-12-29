
import React from 'react';

interface FooterProps {
  onAdminClick?: () => void;
  onContactClick?: () => void;
  onPrivacyClick?: () => void;
}

const Footer: React.FC<FooterProps> = ({ onAdminClick, onContactClick, onPrivacyClick }) => {
  return (
    <footer className="px-6 py-20 border-t border-white/5 opacity-30">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="instrument-serif text-xl italic flex items-center gap-2">
          <span>Echo Pages &copy;</span>
          <span 
            onClick={onAdminClick} 
            className="cursor-default hover:opacity-100 transition-opacity"
          >
            {new Date().getFullYear()}
          </span>
        </div>
        
        <div className="flex space-x-6 text-[10px] uppercase tracking-widest items-center">
          <a 
            href="https://instagram.com/echo_pages" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="hover:opacity-100 transition-opacity"
          >
            Instagram
          </a>
          <span className="opacity-10">/</span>
          <button 
            onClick={onPrivacyClick}
            className="hover:opacity-100 transition-opacity uppercase"
          >
            Privacy
          </button>
          <span className="opacity-10">/</span>
          <button 
            onClick={onContactClick} 
            className="hover:opacity-100 transition-opacity uppercase"
          >
            Contact
          </button>
        </div>

        <div className="text-[10px] uppercase tracking-widest opacity-0 pointer-events-none">
          {/* Placeholder for balance */}
        </div>
      </div>
    </footer>
  );
};

export default Footer;


import React from 'react';

const Contact: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-6 py-40 space-y-24 animate-fade-in">
      <div className="space-y-4">
        <h1 className="instrument-serif italic text-6xl md:text-8xl text-echo-text">Connect</h1>
        <p className="text-[10px] uppercase tracking-[0.5em] opacity-30 max-w-sm leading-relaxed">
          The void is never truly empty. It is waiting for the right frequency.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-32">
        {/* Email Section */}
        <section className="space-y-6">
          <p className="text-[10px] uppercase tracking-[0.4em] opacity-30">Direct Transmission</p>
          <div className="space-y-2">
            <a 
              href="mailto:havishkanamarlapudi@gmail.com" 
              className="serif-font text-2xl italic hover:opacity-100 opacity-70 border-b border-transparent hover:border-echo-text transition-all duration-500 block w-fit"
            >
              havishkanamarlapudi@gmail.com
            </a>
            <p className="text-[10px] italic opacity-20">Replies arrive during the quiet hours.</p>
          </div>
        </section>

        {/* Social Section */}
        <section className="space-y-6">
          <p className="text-[10px] uppercase tracking-[0.4em] opacity-30">Visual Atmosphere</p>
          <a 
            href="https://instagram.com/echo_pages" 
            target="_blank" 
            rel="noopener noreferrer"
            className="serif-font text-2xl italic hover:opacity-100 opacity-70 border-b border-transparent hover:border-echo-text transition-all duration-500 block w-fit"
          >
            @echo_pages
          </a>
        </section>

        {/* Philosophy Section */}
        <section className="space-y-6">
          <p className="text-[10px] uppercase tracking-[0.4em] opacity-30">Status</p>
          <div className="flex items-center space-x-3">
            <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-pulse" />
            <span className="serif-font text-xl italic opacity-50">Listening to the silence.</span>
          </div>
        </section>
      </div>

      <div className="pt-20 border-t border-echo-border">
        <p className="instrument-serif text-3xl italic opacity-40 leading-tight max-w-lg">
          "We speak because we are afraid of the dark, but we write because we want to live in it."
        </p>
      </div>
    </div>
  );
};

export default Contact;


import React from 'react';

const About: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto px-6 py-40 space-y-20 animate-fade-in">
      <h1 className="instrument-serif italic text-6xl md:text-8xl text-white">Manifesto</h1>

      <div className="space-y-12 serif-font text-xl md:text-2xl leading-relaxed italic text-white/95">
        <p>
          We are drowning in noise, but thirsty for meaning.
        </p>
        
        <p>
          Echo Pages exists because words shouldn't just be scrolled; they should be felt. We believe in the power of the fragment, the beauty of the unspoken, and the necessity of introspection in a world designed to distract.
        </p>

        <p>
          This is not a social network. It is a digital sanctuary. 
          There are no likes to hunt, no comments to moderate, no algorithms to please. 
          Only the echo of a voice that finally found its rhythm.
        </p>

        <div className="h-[1px] w-24 bg-white/40" />

        <p className="instrument-serif text-4xl not-italic text-white">
          "Why do words echo longer than voices?"
        </p>

        <p className="text-sm uppercase tracking-[0.4em] font-black opacity-80 text-white">
          The Unspoken Collective.
        </p>
      </div>
    </div>
  );
};

export default About;

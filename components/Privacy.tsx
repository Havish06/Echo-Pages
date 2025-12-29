
import React from 'react';

const Privacy: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto px-6 py-40 space-y-12 animate-fade-in text-center">
      <h1 className="instrument-serif italic text-6xl text-echo-text">Privacy</h1>
      <p className="serif-font text-xl italic opacity-60 leading-relaxed max-w-lg mx-auto">
        Your echoes belong to the void. We do not track, identify, or monetize your thoughts. 
        Everything here is as ephemeral as a whisper.
      </p>
      <div className="pt-10 border-t border-echo-border w-24 mx-auto" />
      <p className="text-[10px] uppercase tracking-[0.5em] opacity-20">
        Sanctity of the Echo.
      </p>
    </div>
  );
};

export default Privacy;

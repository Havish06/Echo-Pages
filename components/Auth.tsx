
import React, { useState } from 'react';
import { supabase } from '../services/supabaseService.ts';

const Auth: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) setMessage(error.message);
    else setMessage('Check your email for the magic link.');
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto py-40 px-6 space-y-12 animate-fade-in text-center">
      <h1 className="instrument-serif italic text-6xl">Entry</h1>
      <p className="serif-font text-lg italic opacity-60">To own your echoes, we must recognize your frequency.</p>
      
      <form onSubmit={handleLogin} className="space-y-6">
        <input 
          type="email" 
          placeholder="your@frequency.com"
          className="w-full bg-transparent border-b border-echo-border py-4 focus:outline-none focus:border-echo-text text-center text-xl"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <button 
          type="submit" 
          disabled={loading}
          className="w-full py-4 bg-echo-text text-echo-bg uppercase tracking-widest text-[11px] font-bold hover:opacity-80 transition-all disabled:opacity-30"
        >
          {loading ? 'Transmitting...' : 'Request Access'}
        </button>
      </form>
      {message && <p className="text-xs tracking-widest uppercase opacity-40">{message}</p>}
    </div>
  );
};

export default Auth;

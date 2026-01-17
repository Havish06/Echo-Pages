
import React, { useState, useEffect } from 'react';
import { supabase, authService } from '../services/supabaseService.ts';

const Auth: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [mailSent, setMailSent] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) window.location.hash = '#/profile';
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!email.includes('@')) {
      setError('A valid frequency (email) is required.');
      return;
    }
    if (password.length < 6) {
      setError('Sequence must be at least 6 characters.');
      return;
    }
    if (!isLogin && !displayName.trim()) {
      setError('An identity name is required for registration.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await authService.login(email, password);
        setSuccess(true);
        setTimeout(() => {
          window.location.hash = '#/profile';
        }, 800);
      } else {
        await authService.signup(email, password, displayName);
        setMailSent(true);
        setLoading(false);
      }
    } catch (err: any) {
      const errorMessage = typeof err === 'string' ? err : (err?.message || 'Identity verification failed.');
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await authService.loginWithGoogle();
    } catch (err: any) {
      setError(err?.message || 'Google authentication failed.');
      setLoading(false);
    }
  };

  if (mailSent) {
    return (
      <div className="max-w-md mx-auto py-24 px-6 space-y-12 animate-fade-in text-center min-h-[80vh] flex flex-col justify-center items-center">
        <div className="w-20 h-20 border border-echo-text/40 rounded-full flex items-center justify-center mb-8">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="instrument-serif italic text-5xl text-white">Transmission Sent</h2>
        <p className="serif-font text-lg italic opacity-80 text-white">
          Check your inbox to confirm your frequency. Once verified, you may return to claim your space.
        </p>
        <button 
          onClick={() => { setMailSent(false); setIsLogin(true); }}
          className="px-10 py-4 border border-echo-text/60 hover:border-white transition-all text-[10px] uppercase tracking-[0.4em] font-black text-white"
        >
          Return to Login
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-24 px-6 space-y-12 animate-fade-in text-center min-h-[80vh] flex flex-col justify-center">
      <div className="space-y-4">
        <h1 className="instrument-serif italic text-6xl text-white">
          {success && isLogin ? 'Recognized' : (isLogin ? 'Welcome back' : 'New Identity')}
        </h1>
        <p className="serif-font text-lg italic opacity-80 text-white">
          {isLogin ? 'Reconnect with the collective silence.' : 'Claim your space within the void.'}
        </p>
      </div>

      <div className={`space-y-8 transition-all duration-700 ${success && isLogin ? 'opacity-0 scale-95' : 'opacity-100'}`}>
        <form onSubmit={handleSubmit} className="space-y-6 text-left">
          {!isLogin && (
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest opacity-90 ml-1 font-black text-white">Display Name</label>
              <input 
                type="text" 
                placeholder="Observer"
                className="w-full bg-neutral-900 border border-white/20 px-5 py-4 focus:outline-none focus:border-white transition-all text-white placeholder:opacity-40"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                required={!isLogin}
              />
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest opacity-90 ml-1 font-black text-white">Email</label>
            <input 
              type="email" 
              placeholder="you@echo.com"
              className="w-full bg-neutral-900 border border-white/20 px-5 py-4 focus:outline-none focus:border-white transition-all text-white placeholder:opacity-40"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest opacity-90 ml-1 font-black text-white">Password</label>
            <div className="relative group">
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••"
                className="w-full bg-neutral-900 border border-white/20 px-5 py-4 pr-12 focus:outline-none focus:border-white transition-all text-white placeholder:opacity-40"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 transition-opacity p-1 text-white"
                title={showPassword ? "Hide Sequence" : "Reveal Sequence"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-950/40 border border-red-900 text-red-100 text-[10px] animate-fade-in font-black uppercase tracking-widest">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-5 bg-white text-black uppercase tracking-[0.5em] text-[11px] font-black hover:bg-neutral-200 transition-all disabled:opacity-20 flex items-center justify-center space-x-3"
          >
            {loading ? (
              <>
                <div className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                <span>Transmitting...</span>
              </>
            ) : (
              <span>{isLogin ? 'Confirm Login' : 'Initialize Identity'}</span>
            )}
          </button>
        </form>

        <div className="flex items-center space-x-4 text-[9px] uppercase tracking-widest opacity-50 text-white font-bold">
          <div className="h-[1px] flex-grow bg-white/20"></div>
          <span>Frequency Selection</span>
          <div className="h-[1px] flex-grow bg-white/20"></div>
        </div>

        <button 
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-4 border border-white/30 hover:border-white transition-all flex items-center justify-center space-x-3 text-[10px] uppercase tracking-widest text-white font-black"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"/></svg>
          <span>Continue with Google</span>
        </button>

        <button 
          onClick={() => { setIsLogin(!isLogin); setError(''); setShowPassword(false); }}
          className="text-[10px] uppercase tracking-widest opacity-70 hover:opacity-100 transition-opacity border-b border-transparent hover:border-white/40 pb-1 text-white font-bold"
        >
          {isLogin ? "Need a new identity?" : "Already recognized?"}
        </button>
      </div>
    </div>
  );
};

export default Auth;

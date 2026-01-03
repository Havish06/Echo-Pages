
import React, { useState, useEffect } from 'react';
import { supabase, authService } from '../services/supabaseService.ts';

const Auth: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) window.location.hash = '#/profile';
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!email.includes('@')) {
      setError('A valid frequency is required.');
      return;
    }
    if (password.length < 6) {
      setError('Sequence must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await authService.login(email, password);
        setSuccess(true);
      } else {
        await authService.signup(email, password, displayName);
        setSuccess(true);
        alert("Success. Check your frequency for verification.");
      }
      setTimeout(() => {
        window.location.hash = '#/profile';
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Identity verification failed.');
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await authService.loginWithGoogle();
    } catch (err: any) {
      setError(`Auth failed: ${err.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-24 px-6 space-y-12 animate-fade-in text-center min-h-[80vh] flex flex-col justify-center">
      <div className="space-y-4">
        <h1 className="instrument-serif italic text-6xl">
          {success ? 'Recognized' : (isLogin ? 'Welcome back' : 'New Identity')}
        </h1>
        <p className="serif-font text-lg italic opacity-40">
          {isLogin ? 'Reconnect with the collective silence.' : 'Claim your space within the void.'}
        </p>
      </div>

      <div className={`space-y-8 transition-all duration-700 ${success ? 'opacity-0 scale-95' : 'opacity-100'}`}>
        <form onSubmit={handleSubmit} className="space-y-6 text-left">
          {!isLogin && (
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest opacity-30 ml-1">Display Name</label>
              <input 
                type="text" 
                placeholder="Observer"
                className="w-full bg-neutral-900 border border-echo-border px-5 py-4 focus:outline-none focus:border-white transition-all text-echo-text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                required={!isLogin}
              />
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest opacity-30 ml-1">Email</label>
            <input 
              type="email" 
              placeholder="you@echo.com"
              className="w-full bg-neutral-900 border border-echo-border px-5 py-4 focus:outline-none focus:border-white transition-all text-echo-text"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest opacity-30 ml-1">Password</label>
            <input 
              type="password" 
              placeholder="••••••••"
              className="w-full bg-neutral-900 border border-echo-border px-5 py-4 focus:outline-none focus:border-white transition-all text-echo-text"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-5 bg-echo-text text-echo-bg uppercase tracking-[0.4em] text-[11px] font-bold hover:bg-white transition-all disabled:opacity-20 flex items-center justify-center space-x-3"
          >
            {loading ? (
              <>
                <div className="w-3 h-3 border-2 border-echo-bg/30 border-t-echo-bg rounded-full animate-spin" />
                <span>Signing you in...</span>
              </>
            ) : (
              <span>{isLogin ? 'Login' : 'Sign Up'}</span>
            )}
          </button>
        </form>

        <div className="flex items-center space-x-4 text-[9px] uppercase tracking-widest opacity-20">
          <div className="h-[1px] flex-grow bg-echo-border"></div>
          <span>Or</span>
          <div className="h-[1px] flex-grow bg-echo-border"></div>
        </div>

        <button 
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-4 border border-echo-border hover:border-echo-text transition-all flex items-center justify-center space-x-3 text-[10px] uppercase tracking-widest"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"/></svg>
          <span>Continue with Google</span>
        </button>

        <button 
          onClick={() => { setIsLogin(!isLogin); setError(''); }}
          className="text-[10px] uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity"
        >
          {isLogin ? "Need an identity?" : "Already recognized?"}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-950/20 border border-red-900 text-red-200 text-xs animate-fade-in">
          {error}
        </div>
      )}
    </div>
  );
};

export default Auth;

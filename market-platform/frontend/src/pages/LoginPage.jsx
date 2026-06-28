import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, User as UserIcon, Loader2, TrendingUp } from 'lucide-react';
import GlassCard from '../components/GlassCard';

export default function LoginPage() {
  const { loginGoogle, loginGuest, loading } = useAuth();
  const [guestName, setGuestName] = useState('');
  const [error, setError] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleCredentialResponse = async (response) => {
    setIsSigningIn(true);
    setError('');
    try {
      await loginGoogle(response.credential);
    } catch (err) {
      console.error(err);
      setError('Google Authentication failed. Please try again.');
      setIsSigningIn(false);
    }
  };

  useEffect(() => {
    const initGoogle = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: "846823789818-3s4gh09a9q6ae402dt6voajhhntdkbtd.apps.googleusercontent.com",
          callback: handleCredentialResponse,
          auto_select: false
        });
        window.google.accounts.id.renderButton(
          document.getElementById("google-signin-btn"),
          { theme: "filled_blue", size: "large", width: 320, shape: "rectangular" }
        );
      } else {
        // Retry in 500ms if script is still loading
        setTimeout(initGoogle, 500);
      }
    };
    initGoogle();
  }, []);

  const handleGuestSubmit = async (e) => {
    e.preventDefault();
    if (!guestName.trim()) {
      setError('Please enter a name to continue.');
      return;
    }
    setIsSigningIn(true);
    setError('');
    try {
      await loginGuest(guestName);
    } catch (err) {
      console.error(err);
      setError('Failed to log in as guest.');
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-screen w-screen flex items-center justify-center relative bg-slate-950 overflow-hidden font-sans select-none z-[1000]">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full pointer-events-none z-0 opacity-20"
        style={{ background: 'radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, transparent 70%)' }} />
      
      <div className="relative z-10 w-full max-w-md px-4">
        <GlassCard className="p-8 border border-slate-800/80 bg-slate-900/60 backdrop-blur-2xl shadow-2xl rounded-3xl">
          {/* Logo & Title */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-tr from-cyan-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/20 mb-4 animate-pulse">
              <TrendingUp className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent tracking-tight">
              SK SHARE MARKET
            </h1>
            <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400 mt-1">
              Analysis & Intelligence Platform
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm text-center">
              {error}
            </div>
          )}

          {isSigningIn || loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mb-4" />
              <p className="text-slate-400 text-sm">Authenticating session...</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Google Sign-in Button Wrapper */}
              <div className="flex flex-col items-center">
                <div id="google-signin-btn" className="w-full flex justify-center h-[44px]" />
                <span className="text-xs text-slate-500 mt-2">Sign in safely using your Google account</span>
              </div>

              {/* Separator */}
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800" />
                </div>
                <span className="relative px-3 text-xs uppercase tracking-wider text-slate-500 bg-slate-900/90 rounded-md">
                  or
                </span>
              </div>

              {/* Guest Form */}
              <form onSubmit={handleGuestSubmit} className="space-y-4">
                <div>
                  <label htmlFor="guest-name" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Enter platform as guest
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      id="guest-name"
                      type="text"
                      placeholder="Your name"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 text-white placeholder-slate-600 outline-none text-sm transition-all duration-300"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-3 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-white text-sm font-semibold rounded-xl shadow-lg transition-all duration-300 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  Continue as Guest
                </button>
              </form>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}

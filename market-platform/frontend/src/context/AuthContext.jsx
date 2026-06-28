import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { loginWithGoogle, loginAsGuest, sendHeartbeat, logoutSession } from '../api/client';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(false);
  const visitedPages = useRef(new Set());

  // Track the current page path
  useEffect(() => {
    if (!token) return;
    
    // Add current path
    const path = window.location.pathname;
    visitedPages.current.add(path);

    // Watch for url changes (single page app routes)
    const handleLocationChange = () => {
      visitedPages.current.add(window.location.pathname);
    };

    // Override pushState and replaceState to catch client-side routing changes
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function(...args) {
      originalPushState.apply(this, args);
      handleLocationChange();
    };
    window.history.replaceState = function(...args) {
      originalReplaceState.apply(this, args);
      handleLocationChange();
    };

    window.addEventListener('popstate', handleLocationChange);

    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, [token, window.location.pathname]);

  // Periodically send heartbeat
  useEffect(() => {
    if (!token) return;

    const triggerHeartbeat = async () => {
      const pages = Array.from(visitedPages.current);
      if (pages.length > 0) {
        try {
          await sendHeartbeat(pages);
          // Clear successfully logged pages
          pages.forEach(p => visitedPages.current.delete(p));
        } catch (err) {
          console.error('Failed to send heartbeat:', err);
        }
      } else {
        // Even if no new pages, send heartbeat to update online status
        try {
          await sendHeartbeat([]);
        } catch (err) {
          console.error('Heartbeat error:', err);
        }
      }
    };

    // Initial heartbeat
    triggerHeartbeat();

    const interval = setInterval(triggerHeartbeat, 20000); // Heartbeat every 20s

    // Send final heartbeat on unload
    const handleUnload = () => {
      const pages = Array.from(visitedPages.current);
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      // Use sendBeacon for reliable delivery on page close
      const data = JSON.stringify({ pages_visited: pages });
      const blob = new Blob([data], { type: 'application/json' });
      navigator.sendBeacon(`${API_BASE}/auth/heartbeat`, blob);
    };

    window.addEventListener('beforeunload', handleUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [token]);

  const loginGoogle = async (googleCredential) => {
    setLoading(true);
    try {
      const res = await loginWithGoogle(googleCredential);
      localStorage.setItem('token', res.access_token);
      localStorage.setItem('user', JSON.stringify(res.user));
      setToken(res.access_token);
      setUser(res.user);
      return res.user;
    } finally {
      setLoading(false);
    }
  };

  const loginGuest = async (name) => {
    setLoading(true);
    try {
      const res = await loginAsGuest(name);
      localStorage.setItem('token', res.access_token);
      localStorage.setItem('user', JSON.stringify(res.user));
      setToken(res.access_token);
      setUser(res.user);
      return res.user;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      if (token) {
        await logoutSession().catch(() => {});
      }
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, loginGoogle, loginGuest, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

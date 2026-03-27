'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';

export default function LoginProfileCard() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<{ score: number, games_played: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    
    // Check current session
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser(session.user);
          
          // Fetch user stats
          const { data: statData } = await supabase
            .from('leaderboard')
            .select('score, games_played')
            .eq('id', session.user.id)
            .single();
            
          if (statData) setStats(statData as any);
        } else {
          setUser(null);
          setStats(null);
        }
      } catch (e) {
        console.error("Session fetch error:", e);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        try {
          if (session?.user) {
            setUser(session.user);
            const { data: statData } = await supabase
              .from('leaderboard')
              .select('score, games_played')
              .eq('id', session.user.id)
              .single();
            if (statData) setStats(statData as any);
          } else {
            setUser(null);
            setStats(null);
          }
        } catch (e) {
          console.error("Auth change error:", e);
        } finally {
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (provider: 'discord' | 'google') => {
    // Redirects to OAuth provider
    await supabase.auth.signInWithOAuth({
      provider: provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="loginContent" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', animation: 'pulse 2s infinite' }} />
        <div style={{ flex: 1 }}>
          <div style={{ height: 16, width: '60%', background: 'rgba(255,255,255,0.1)', borderRadius: 4, marginBottom: 8 }} />
          <div style={{ height: 12, width: '80%', background: 'rgba(255,255,255,0.05)', borderRadius: 4 }} />
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="loginContent" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <Link href="/profile" className="avatarWrap" style={{ position: 'relative', width: 56, height: 56, flexShrink: 0, textDecoration: 'none' }}>
          <Image 
            src={user.user_metadata.avatar_url || '/7mz-logo.jpg'} 
            alt={user.user_metadata.full_name || 'Usuário'} 
            width={56} 
            height={56} 
            style={{ borderRadius: '50%', objectFit: 'cover' }} 
          />
          <div className="avatarRing" style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: '1.5px solid var(--accent-orange)' }} />
        </Link>
        <div className="loginText" style={{ flex: 1, minWidth: 0 }}>
          <Link href="/profile" style={{ textDecoration: 'none', color: 'inherit' }}>
            <h4 className="loginPrompt" style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: '1rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.user_metadata.full_name}
            </h4>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-orange)' }}>
              {stats ? `${stats.score.toLocaleString()} pts` : '0 pts'}
            </span>
            <span style={{ color: 'var(--border-medium)' }}>•</span>
            <button 
              onClick={handleLogout}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', padding: 0, cursor: 'pointer', textDecoration: 'underline' }}
            >
              Sair
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="loginContent" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div className="avatarWrap" style={{ position: 'relative', width: 56, height: 56, flexShrink: 0 }}>
          <Image src="/7mz-logo.jpg" alt="Avatar" width={56} height={56} style={{ borderRadius: '50%', opacity: 0.3, filter: 'grayscale(1)' }} />
          <div className="avatarRing" style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: '1.5px dashed var(--border-medium)', animation: 'rotateRing 10s linear infinite' }} />
        </div>
        <div className="loginText" style={{ flex: 1, minWidth: 0 }}>
          <h4 className="loginPrompt" style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: '0.95rem', fontWeight: 600 }}>Acesse sua conta</h4>
          <p className="loginDesc" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>Participe do ranking</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button 
          onClick={() => handleLogin('discord')}
          style={{ 
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 16px', 
            background: '#5865F2', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', 
            fontFamily: 'var(--font-ui)', fontSize: '0.78rem', fontWeight: 700, 
            letterSpacing: '0.04em', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap', width: '100%'
          }}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
          </svg>
          ENTRAR COM DISCORD
        </button>

        <button 
          onClick={() => handleLogin('google')}
          style={{ 
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 16px', 
            background: '#ffffff', color: '#111111', border: 'none', borderRadius: 'var(--radius-md)', 
            fontFamily: 'var(--font-ui)', fontSize: '0.78rem', fontWeight: 700, 
            letterSpacing: '0.04em', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap', width: '100%'
          }}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          ENTRAR COM GOOGLE
        </button>
      </div>
    </div>
  );
}

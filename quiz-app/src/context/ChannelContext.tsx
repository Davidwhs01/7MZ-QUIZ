'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getAllArtists, type ArtistRecord } from '@/lib/artists-store';

export type ChannelCategory = 'GEEK' | 'POP';
// Broad type — any string from Supabase is valid now
export type ChannelType = string;
export type Artist = ChannelType;

// Hardcoded CSS themes for existing artists (curated manually)
// New artists without a CSS theme will get dynamic CSS vars from Supabase colors
const HARDCODED_THEMES = new Set([
  '7MZ', 'ENYGMA', 'MELANIE', 'RODRIGOZIN', 'MITSKI',
  'M4RKIM', 'ANIRAP', 'DAIKINEZ', 'NISHIKAY',
]);

interface ChannelContextProps {
  activeChannel: ChannelType;
  setActiveChannel: (channel: ChannelType) => void;
  channelCategory: ChannelCategory;
  setChannelCategory: (category: ChannelCategory) => void;
  isLoaded: boolean;
  artists: ArtistRecord[];
}

const ChannelContext = createContext<ChannelContextProps | undefined>(undefined);

// Inject dynamic CSS variables from Supabase colors for artists without hardcoded themes
function applyDynamicTheme(artist: ArtistRecord) {
  const body = document.body;

  if (artist.primary_color) {
    body.style.setProperty('--accent-orange', artist.primary_color);
    body.style.setProperty('--accent-orange-bright', artist.primary_color);
    body.style.setProperty('--accent-orange-dim', artist.primary_color);
    body.style.setProperty('--accent-neon', artist.primary_color);
    body.style.setProperty('--accent-orange-rgb', artist.primary_color_rgb ?? '255, 107, 43');
    const [r, g, b] = (artist.primary_color_rgb ?? '255,107,43').split(',').map(Number);
    body.style.setProperty('--glow-orange', `0 0 20px rgba(${r},${g},${b},0.25), 0 0 60px rgba(${r},${g},${b},0.08)`);
    body.style.setProperty('--glow-orange-strong', `0 0 30px rgba(${r},${g},${b},0.5), 0 0 80px rgba(${r},${g},${b},0.15)`);
    body.style.setProperty('--border-orange', `rgba(${r},${g},${b},0.25)`);
  } else {
    // No colors — clear dynamic overrides, let defaults apply
    ['--accent-orange','--accent-orange-bright','--accent-orange-dim','--accent-neon',
     '--accent-orange-rgb','--glow-orange','--glow-orange-strong','--border-orange'].forEach(
      v => body.style.removeProperty(v)
    );
  }

  if (artist.secondary_color) {
    body.style.setProperty('--accent-blue', artist.secondary_color);
    body.style.setProperty('--accent-blue-rgb', artist.secondary_color_rgb ?? '59, 130, 246');
    body.style.setProperty('--accent-blue-dim', artist.secondary_color);
  } else {
    ['--accent-blue','--accent-blue-rgb','--accent-blue-dim'].forEach(
      v => body.style.removeProperty(v)
    );
  }
}

function clearDynamicTheme() {
  const props = [
    '--accent-orange','--accent-orange-bright','--accent-orange-dim','--accent-neon',
    '--accent-orange-rgb','--glow-orange','--glow-orange-strong','--border-orange',
    '--accent-blue','--accent-blue-rgb','--accent-blue-dim',
  ];
  props.forEach(v => document.body.style.removeProperty(v));
}

export const ChannelProvider = ({ children }: { children: ReactNode }) => {
  const [activeChannel, setActiveChannel] = useState<ChannelType>('7MZ');
  const [channelCategory, setChannelCategory] = useState<ChannelCategory>('GEEK');
  const [isLoaded, setIsLoaded] = useState(false);
  const [artists, setArtists] = useState<ArtistRecord[]>([]);

  // Load artists from Supabase
  useEffect(() => {
    getAllArtists().then(setArtists);
  }, []);

  // Load saved channel from localStorage
  useEffect(() => {
    const savedCategory = localStorage.getItem('geek-arena-category') as ChannelCategory;
    const savedChannel = localStorage.getItem('geek-arena-channel') as ChannelType;
    if (savedCategory === 'GEEK' || savedCategory === 'POP') {
      setChannelCategory(savedCategory);
    }
    if (savedChannel) {
      setActiveChannel(savedChannel);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('geek-arena-category', channelCategory);
    localStorage.setItem('geek-arena-channel', activeChannel);
  }, [activeChannel, channelCategory, isLoaded]);

  // Apply theme when channel changes
  useEffect(() => {
    if (!isLoaded) return;

    const allThemeClasses = [
      'theme-7mz', 'theme-enygma', 'theme-melanie', 'theme-rodrigozin',
      'theme-mitski', 'theme-m4rkim', 'theme-anirap', 'theme-daikinez',
      'theme-nishikay',
      // Also remove dynamic theme classes for previously imported artists
      ...artists.map(a => a.theme_class).filter(Boolean) as string[],
    ];
    document.body.classList.remove(...allThemeClasses);

    if (HARDCODED_THEMES.has(activeChannel)) {
      // Existing artist — use CSS class and clear any dynamic inline vars
      clearDynamicTheme();
      document.body.classList.add(`theme-${activeChannel.toLowerCase()}`);
    } else {
      // New artist from Supabase — inject CSS vars dynamically
      const artist = artists.find(a => a.id === activeChannel);
      if (artist) {
        applyDynamicTheme(artist);
      }
    }
  }, [activeChannel, isLoaded, artists]);

  return (
    <ChannelContext.Provider value={{
      activeChannel,
      setActiveChannel,
      channelCategory,
      setChannelCategory,
      isLoaded,
      artists,
    }}>
      {children}
    </ChannelContext.Provider>
  );
};

export const useChannel = () => {
  const context = useContext(ChannelContext);
  if (context === undefined) {
    throw new Error('useChannel must be used within a ChannelProvider');
  }
  return context;
};
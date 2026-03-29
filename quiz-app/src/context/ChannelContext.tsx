'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ChannelType = '7MZ' | 'ENYGMA';

interface ChannelContextProps {
  activeChannel: ChannelType;
  setActiveChannel: (channel: ChannelType) => void;
}

const ChannelContext = createContext<ChannelContextProps | undefined>(undefined);

export const ChannelProvider = ({ children }: { children: ReactNode }) => {
  const [activeChannel, setActiveChannel] = useState<ChannelType>('7MZ');
  const [isMounted, setIsMounted] = useState(false);

  // Rehydrate channel from localStorage on mount
  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem('geek-arena-channel') as ChannelType;
    if (saved && (saved === '7MZ' || saved === 'ENYGMA')) {
      setActiveChannel(saved);
    }
  }, []);

  // Sync to localStorage and Body Class whenever it changes
  useEffect(() => {
    if (!isMounted) return;
    localStorage.setItem('geek-arena-channel', activeChannel);

    // Apply global CSS Theme classes
    if (activeChannel === '7MZ') {
      document.body.classList.remove('theme-enygma');
      document.body.classList.add('theme-7mz');
    } else {
      document.body.classList.remove('theme-7mz');
      document.body.classList.add('theme-enygma');
    }
  }, [activeChannel, isMounted]);

  // Prevent flash content if needed:
  // if (!isMounted) return <div style={{ minHeight: '100vh', background: '#050508' }} />; // Opcionalmente, mostrar spinner/preto base

  return (
    <ChannelContext.Provider value={{ activeChannel, setActiveChannel }}>
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

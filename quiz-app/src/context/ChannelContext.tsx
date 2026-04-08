'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ChannelCategory = 'GEEK' | 'POP';
export type ChannelType = '7MZ' | 'ENYGMA' | 'MELANIE' | 'RODRIGOZIN' | 'MITSKI' | 'M4RKIM';

interface ChannelContextProps {
  activeChannel: ChannelType;
  setActiveChannel: (channel: ChannelType) => void;
  channelCategory: ChannelCategory;
  setChannelCategory: (category: ChannelCategory) => void;
  isLoaded: boolean;
}

const ChannelContext = createContext<ChannelContextProps | undefined>(undefined);

export const ChannelProvider = ({ children }: { children: ReactNode }) => {
  const [activeChannel, setActiveChannel] = useState<ChannelType>('7MZ');
  const [channelCategory, setChannelCategory] = useState<ChannelCategory>('GEEK');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount (client only)
  useEffect(() => {
    const savedCategory = localStorage.getItem('geek-arena-category') as ChannelCategory;
    const savedChannel = localStorage.getItem('geek-arena-channel') as ChannelType;
    
    if (savedCategory === 'GEEK' || savedCategory === 'POP') {
      setChannelCategory(savedCategory);
    }
    
    if (savedChannel && (savedChannel === '7MZ' || savedChannel === 'ENYGMA' || savedChannel === 'MELANIE' || savedChannel === 'RODRIGOZIN' || savedChannel === 'MITSKI' || savedChannel === 'M4RKIM')) {
      const isGeek = savedChannel === '7MZ' || savedChannel === 'ENYGMA' || savedChannel === 'RODRIGOZIN' || savedChannel === 'M4RKIM';
      const categoryMatch = (savedCategory === 'GEEK' && isGeek) || 
                           (savedCategory === 'POP' && (savedChannel === 'MELANIE' || savedChannel === 'MITSKI'));
      
      if (categoryMatch) {
        setActiveChannel(savedChannel);
      } else {
        setActiveChannel(savedCategory === 'GEEK' ? '7MZ' : 'MELANIE');
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage when changes
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('geek-arena-category', channelCategory);
    localStorage.setItem('geek-arena-channel', activeChannel);
  }, [activeChannel, channelCategory, isLoaded]);

  // Apply theme
  useEffect(() => {
    if (!isLoaded) return;
    document.body.classList.remove('theme-7mz', 'theme-enygma', 'theme-melanie', 'theme-rodrigozin', 'theme-mitski', 'theme-m4rkim');
    if (activeChannel === '7MZ') {
      document.body.classList.add('theme-7mz');
    } else if (activeChannel === 'ENYGMA') {
      document.body.classList.add('theme-enygma');
    } else if (activeChannel === 'MELANIE') {
      document.body.classList.add('theme-melanie');
    } else if (activeChannel === 'RODRIGOZIN') {
      document.body.classList.add('theme-rodrigozin');
    } else if (activeChannel === 'MITSKI') {
      document.body.classList.add('theme-mitski');
    } else if (activeChannel === 'M4RKIM') {
      document.body.classList.add('theme-m4rkim');
    }
  }, [activeChannel, isLoaded]);

  return (
    <ChannelContext.Provider value={{ 
      activeChannel, 
      setActiveChannel,
      channelCategory, 
      setChannelCategory,
      isLoaded
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
'use client';

import { useState } from 'react';
import { useChannel, ChannelType, ChannelCategory } from '@/context/ChannelContext';
import styles from './ArtistMenu.module.css';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface ArtistMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const GEEK_ARTISTS: { id: ChannelType; name: string; logo: string; desc: string }[] = [
  { id: '7MZ', name: '7 Minutoz', logo: '/7mz-logo.jpg', desc: 'Rap nerd, anime & games' },
  { id: 'ENYGMA', name: 'Enygma', logo: '/enygma-logo.jpg', desc: 'Rap de personagens' },
  { id: 'M4RKIM', name: 'M4rkim', logo: '/M4rkim-Logo.jpg', desc: 'Rap nacional' },
  { id: 'ANIRAP', name: 'Anirap', logo: '/anirap-logo.jpg', desc: 'Rap nacional' },
];

const POP_ARTISTS: { id: ChannelType; name: string; logo: string; desc: string }[] = [
  { id: 'MELANIE', name: 'Melanie Martinez', logo: '/Melanie-Logo.jpg', desc: 'Pop alternativo' },
  { id: 'MITSKI', name: 'Mitski', logo: '/Mitski-Logo.jpg', desc: 'Pop Indie' },
];

export default function ArtistMenu({ isOpen, onClose }: ArtistMenuProps) {
  const { activeChannel, setActiveChannel, channelCategory, setChannelCategory } = useChannel();

  const handleSelectCategory = (category: ChannelCategory) => {
    // Switch category and set default channel for that category
    if (category === 'GEEK') {
      setChannelCategory('GEEK');
      // If current channel is not geek, switch to first geek channel
      if (activeChannel !== '7MZ' && activeChannel !== 'ENYGMA' && activeChannel !== 'M4RKIM') {
        setActiveChannel('7MZ');
      }
    } else {
      setChannelCategory('POP');
      // If current channel is not pop, switch to melanie
      if (activeChannel !== 'MELANIE') {
        setActiveChannel('MELANIE');
      }
    }
    onClose();
  };

  const handleSelectArtist = (channelId: ChannelType) => {
    setActiveChannel(channelId);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          <motion.div
            className={styles.drawer}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className={styles.handle} />
            
            <div className={styles.header}>
              <h2 className={styles.title}>Escolha um Artista</h2>
              <button className={styles.closeBtn} onClick={onClose}>
                ✕
              </button>
            </div>

            {/* Category Tabs */}
            <div className={styles.categoryTabs}>
              <button
                className={`${styles.categoryTab} ${channelCategory === 'GEEK' ? styles.categoryTabActive : ''}`}
                onClick={() => handleSelectCategory('GEEK')}
              >
                <span className={styles.categoryIcon}>🎮</span>
                <span className={styles.categoryName}>GEEK</span>
                {channelCategory === 'GEEK' && <span className={styles.categoryCheck}>✓</span>}
              </button>
              <button
                className={`${styles.categoryTab} ${channelCategory === 'POP' ? styles.categoryTabActive : ''}`}
                onClick={() => handleSelectCategory('POP')}
              >
                <span className={styles.categoryIcon}>🎤</span>
                <span className={styles.categoryName}>POP / OUTROS</span>
                {channelCategory === 'POP' && <span className={styles.categoryCheck}>✓</span>}
              </button>
            </div>

            {/* Artist List for Current Category */}
            <div className={styles.artistList}>
              {channelCategory === 'GEEK' && (
                <div className={styles.categorySection}>
                  {GEEK_ARTISTS.map((artist) => (
                    <button
                      key={artist.id}
                      className={`${styles.artistCard} ${activeChannel === artist.id ? styles.artistCardActive : ''}`}
                      onClick={() => handleSelectArtist(artist.id)}
                    >
                      <div className={styles.artistLogo}>
                        <Image 
                          src={artist.logo} 
                          alt={artist.name} 
                          width={56}
                          height={56}
                          style={{ objectFit: 'cover' }}
                        />
                      </div>
                      <div className={styles.artistInfo}>
                        <span className={styles.artistName}>{artist.name}</span>
                        <span className={styles.artistDesc}>{artist.desc}</span>
                      </div>
                      {activeChannel === artist.id && (
                        <span className={styles.selectedBadge}>SELECIONADO</span>
                      )}
                      {activeChannel !== artist.id && (
                        <span className={styles.selectArrow}>→</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
              
              {channelCategory === 'POP' && (
                <div className={styles.categorySection}>
                  {POP_ARTISTS.map((artist) => (
                    <button
                      key={artist.id}
                      className={`${styles.artistCard} ${activeChannel === artist.id ? styles.artistCardActive : ''}`}
                      onClick={() => handleSelectArtist(artist.id)}
                    >
                      <div className={styles.artistLogo}>
                        <Image 
                          src={artist.logo} 
                          alt={artist.name} 
                          width={56}
                          height={56}
                          style={{ objectFit: 'cover' }}
                        />
                      </div>
                      <div className={styles.artistInfo}>
                        <span className={styles.artistName}>{artist.name}</span>
                        <span className={styles.artistDesc}>{artist.desc}</span>
                      </div>
                      {activeChannel === artist.id && (
                        <span className={styles.selectedBadge}>SELECIONADO</span>
                      )}
                      {activeChannel !== artist.id && (
                        <span className={styles.selectArrow}>→</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
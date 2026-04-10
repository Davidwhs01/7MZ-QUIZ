'use client';

import { useState, useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import styles from './ChannelSelector.module.css';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useChannel } from '@/context/ChannelContext';
import type { ArtistRecord } from '@/lib/artists-store';

export type ChannelType = string;

let uidCounter = 10;

interface ChannelSelectorProps {
  onChannelChange?: (channel: ChannelType) => void;
}

export default function ChannelSelector({ onChannelChange }: ChannelSelectorProps) {
  const pathname = usePathname();
  const { activeChannel, setActiveChannel, isLoaded, artists } = useChannel();

  // Current section from URL
  const section: 'geek' | 'pop' = pathname.startsWith('/pop') ? 'pop' : 'geek';

  // Artists for this section, from Supabase
  const availableArtists = useMemo<ArtistRecord[]>(
    () => artists.filter(a => a.section === section),
    [artists, section]
  );
  const availableIds = useMemo(() => availableArtists.map(a => a.id), [availableArtists]);

  const getArtistInfo = (id: string): ArtistRecord | null =>
    availableArtists.find(a => a.id === id) ?? null;

  const getLogo = (artist: ArtistRecord | null): string => {
    if (!artist) return '/7mz-logo.jpg';
    // Prefer local logo_url (e.g. /daikinez-logo.jpg), fall back to avatar_url (YouTube CDN)
    return artist.logo_url ?? artist.avatar_url ?? '/7mz-logo.jpg';
  };

  // Validate active channel for current section
  const currentId = availableIds.includes(activeChannel) ? activeChannel : availableIds[0] ?? '7MZ';

  const getNext = (id: string) => {
    const idx = availableIds.indexOf(id);
    return availableIds[(idx + 1) % availableIds.length];
  };
  const getPrev = (id: string) => {
    const idx = availableIds.indexOf(id);
    return availableIds[(idx - 1 + availableIds.length) % availableIds.length];
  };

  const [items, setItems] = useState(() => [
    { uid: 1, id: currentId },
    { uid: 2, id: currentId },
    { uid: 3, id: currentId },
  ]);

  useEffect(() => {
    if (availableIds.length === 0) return;
    const safe = availableIds.includes(currentId) ? currentId : availableIds[0];
    setItems([
      { uid: uidCounter++, id: getPrev(safe) },
      { uid: uidCounter++, id: safe },
      { uid: uidCounter++, id: getNext(safe) },
    ]);
  }, [currentId, availableIds.join(',')]);

  const [direction, setDirection] = useState(0);

  const slideRight = () => {
    setDirection(1);
    const newId = items[2].id;
    setItems(prev => [prev[1], prev[2], { uid: uidCounter++, id: prev[1].id }]);
    setActiveChannel(newId);
    onChannelChange?.(newId);
  };
  const slideLeft = () => {
    setDirection(-1);
    const newId = items[0].id;
    setItems(prev => [{ uid: uidCounter++, id: prev[1].id }, prev[0], prev[1]]);
    setActiveChannel(newId);
    onChannelChange?.(newId);
  };
  const handleSelect = (index: number) => {
    if (index === 0) slideLeft();
    if (index === 2) slideRight();
  };

  // Loading skeleton
  if (!isLoaded || availableArtists.length === 0) {
    return (
      <div className={styles.selectorContainer}>
        <div className={styles.carousel}>
          <motion.div className={`${styles.channelItem} ${styles.active}`}>
            <div className={styles.avatarWrapper}>
              <motion.div className={styles.glowRing} style={{ opacity: 1, scale: 1 }} />
              <Image src="/7mz-logo.jpg" alt="Loading" fill style={{ objectFit: 'cover' }} priority className={styles.avatar} />
            </div>
            <motion.span className={styles.channelName} style={{ position: 'absolute', bottom: -55, whiteSpace: 'nowrap' }}>
              Carregando...
            </motion.span>
          </motion.div>
        </div>
      </div>
    );
  }

  // Single channel — no carousel needed
  if (availableArtists.length <= 1) {
    const artist = availableArtists[0];
    return (
      <div className={styles.selectorContainer}>
        <div className={styles.carousel}>
          <motion.div className={`${styles.channelItem} ${styles.active}`}>
            <div className={styles.avatarWrapper}>
              <motion.div className={styles.glowRing} style={{ opacity: 1, scale: 1 }} />
              <Image src={getLogo(artist)} alt={artist?.name ?? ''} fill style={{ objectFit: 'cover' }} priority className={styles.avatar} unoptimized={!getLogo(artist).startsWith('/')} />
            </div>
            <motion.span className={styles.channelName} style={{ position: 'absolute', bottom: -55, whiteSpace: 'nowrap' }}>
              {artist?.name}
            </motion.span>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.selectorContainer}>
      <div className={styles.carousel}>
        <AnimatePresence initial={false}>
          {items.map((item, index) => {
            const isCenter = index === 1;
            const artist = getArtistInfo(item.id);
            const logo = getLogo(artist);
            const xPos = index === 0 ? -160 : index === 2 ? 160 : 0;

            const getInitialX = () => {
              if (direction === 1) return index === 0 ? -160 : index === 2 ? 240 : 0;
              if (direction === -1) return index === 0 ? -240 : index === 2 ? 160 : 0;
              return index === 0 ? -160 : 160;
            };

            return (
              <motion.div
                key={item.uid}
                className={`${styles.channelItem} ${isCenter ? styles.active : styles.inactive}`}
                onClick={() => handleSelect(index)}
                initial={{ opacity: 0, scale: 0.8, x: getInitialX() }}
                animate={{
                  opacity: isCenter ? 1 : 0.5,
                  scale: isCenter ? 1 : 0.8,
                  filter: isCenter ? 'blur(0px) grayscale(0%)' : 'blur(4px) grayscale(50%)',
                  zIndex: isCenter ? 10 : 1,
                  x: xPos,
                }}
                exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                transition={{ type: 'spring', stiffness: 280, damping: 30, mass: 0.8 }}
                whileHover={{ scale: isCenter ? 1.02 : 0.85, opacity: isCenter ? 1 : 0.7 }}
                whileTap={{ scale: isCenter ? 0.98 : 0.8 }}
              >
                <div className={styles.avatarWrapper} style={{ pointerEvents: 'none' }}>
                  <motion.div
                    className={styles.glowRing}
                    animate={{ opacity: isCenter ? 1 : 0, scale: isCenter ? 1 : 0.8 }}
                    transition={{ duration: 0.3 }}
                  />
                  <Image
                    src={logo}
                    alt={artist?.name ?? item.id}
                    fill
                    sizes="(max-width: 768px) 150px, 200px"
                    style={{ objectFit: 'cover' }}
                    priority={isCenter}
                    className={styles.avatar}
                    unoptimized={!logo.startsWith('/')}
                  />
                </div>
                <motion.span
                  className={styles.channelName}
                  style={{ position: 'absolute', bottom: -55, whiteSpace: 'nowrap' }}
                  initial={false}
                  animate={{ opacity: isCenter ? 1 : 0, y: isCenter ? 0 : 10 }}
                  transition={{ duration: 0.2 }}
                >
                  {artist?.name ?? item.id}
                </motion.span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
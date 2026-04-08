'use client';

import { useState, useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import styles from './ChannelSelector.module.css';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useChannel } from '@/context/ChannelContext';

export type ChannelType = '7MZ' | 'ENYGMA' | 'MELANIE' | 'RODRIGOZIN' | 'MITSKI';

const CHANNELS = {
  '7MZ': { id: '7MZ', name: '7 Minutoz', logo: '/7mz-logo.jpg' },
  'ENYGMA': { id: 'ENYGMA', name: 'Enygma', logo: '/enygma-logo.jpg' },
  'MELANIE': { id: 'MELANIE', name: 'Melanie Martinez', logo: '/Melanie-Logo.jpg' },
  'RODRIGOZIN': { id: 'RODRIGOZIN', name: 'Rodrigo Zin', logo: '/RodrigoZin-Logo.jpg' },
  'MITSKI': { id: 'MITSKI', name: 'Mitski', logo: '/Mitski-Logo.jpg' },
} as const;

const SECTION_CHANNELS: Record<string, ChannelType[]> = {
  'geek': ['7MZ', 'ENYGMA', 'RODRIGOZIN'],
  'pop': ['MELANIE', 'MITSKI'],
};

let uidCounter = 10;

interface ChannelSelectorProps {
  onChannelChange?: (channel: ChannelType) => void;
}

export default function ChannelSelector({ onChannelChange }: ChannelSelectorProps) {
  const pathname = usePathname();
  const { activeChannel, setActiveChannel, isLoaded } = useChannel();

  // Get current section from URL
  const section = pathname === '/pop' ? 'pop' : 
                  pathname.startsWith('/pop') ? 'pop' : 
                  pathname === '/geek' ? 'geek' : 
                  pathname.startsWith('/geek') ? 'geek' : 'geek';

  const availableChannels = useMemo(() => SECTION_CHANNELS[section] || ['7MZ'], [section]);

  // Validate activeChannel for current section
  const currentChannel = availableChannels.includes(activeChannel) 
    ? activeChannel 
    : availableChannels[0];

  const getNextChannel = (current: ChannelType): ChannelType => {
    const idx = availableChannels.indexOf(current);
    const nextIdx = (idx + 1) % availableChannels.length;
    return availableChannels[nextIdx];
  };

  const getPrevChannel = (current: ChannelType): ChannelType => {
    const idx = availableChannels.indexOf(current);
    const prevIdx = (idx - 1 + availableChannels.length) % availableChannels.length;
    return availableChannels[prevIdx];
  };

  const [items, setItems] = useState(() => {
    return [
      { uid: 1, id: getPrevChannel(currentChannel) },
      { uid: 2, id: currentChannel },
      { uid: 3, id: getNextChannel(currentChannel) },
    ];
  });

  useEffect(() => {
    setItems([
      { uid: uidCounter++, id: getPrevChannel(currentChannel) },
      { uid: uidCounter++, id: currentChannel },
      { uid: uidCounter++, id: getNextChannel(currentChannel) }
    ]);
  }, [currentChannel]);

  const slideRight = () => {
    const newActiveId = items[2].id;
    setItems((prev) => [
      prev[1],
      prev[2],
      { uid: uidCounter++, id: prev[1].id }
    ]);
    setActiveChannel(newActiveId);
    onChannelChange?.(newActiveId);
  };

  const slideLeft = () => {
    const newActiveId = items[0].id;
    setItems((prev) => [
      { uid: uidCounter++, id: prev[1].id },
      prev[0],
      prev[1]
    ]);
    setActiveChannel(newActiveId);
    onChannelChange?.(newActiveId);
  };

  const handleSelect = (index: number) => {
    if (index === 0) slideLeft();
    if (index === 2) slideRight();
  };

  // Don't render carousel until context is loaded from localStorage
  if (!isLoaded) {
    return (
      <div className={styles.selectorContainer}>
        <div className={styles.carousel}>
          <motion.div
            className={`${styles.channelItem} ${styles.active}`}
          >
            <div className={styles.avatarWrapper}>
              <motion.div className={styles.glowRing} style={{ opacity: 1, scale: 1 }} />
              <Image
                src={CHANNELS['7MZ'].logo}
                alt="Loading"
                fill
                style={{ objectFit: 'cover' }}
                priority
                className={styles.avatar}
              />
            </div>
            <motion.span
              className={styles.channelName}
              style={{ position: 'absolute', bottom: -55, whiteSpace: 'nowrap' }}
            >
              Carregando...
            </motion.span>
          </motion.div>
        </div>
      </div>
    );
  }

  // Only show selector if there are multiple channels in section
  if (availableChannels.length <= 1) {
    const channelInfo = CHANNELS[availableChannels[0]];
    return (
      <div className={styles.selectorContainer}>
        <div className={styles.carousel}>
          <motion.div
            className={`${styles.channelItem} ${styles.active}`}
          >
            <div className={styles.avatarWrapper}>
              <motion.div className={styles.glowRing} style={{ opacity: 1, scale: 1 }} />
              <Image
                src={channelInfo.logo}
                alt={`${channelInfo.name} Logo`}
                fill
                style={{ objectFit: 'cover' }}
                priority
                className={styles.avatar}
              />
            </div>
            <motion.span
              className={styles.channelName}
              style={{ position: 'absolute', bottom: -55, whiteSpace: 'nowrap' }}
            >
              {channelInfo.name}
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
            const channelInfo = CHANNELS[item.id];
            
            const xPos = index === 0 ? -160 : index === 2 ? 160 : 0;

            return (
              <motion.div
                key={item.uid}
                className={`${styles.channelItem} ${isCenter ? styles.active : styles.inactive}`}
                onClick={() => handleSelect(index)}
                initial={{ opacity: 0, scale: 0.8, x: index === 0 ? -240 : 240 }}
                animate={{
                  opacity: isCenter ? 1 : 0.5,
                  scale: isCenter ? 1 : 0.8,
                  filter: isCenter ? 'blur(0px) grayscale(0%)' : 'blur(4px) grayscale(50%)',
                  zIndex: isCenter ? 10 : 1,
                  x: xPos,
                }}
                exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                transition={{
                  type: 'spring',
                  stiffness: 280,
                  damping: 30,
                  mass: 0.8
                }}
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
                    src={channelInfo.logo}
                    alt={`${channelInfo.name} Logo`}
                    fill
                    sizes="(max-width: 768px) 150px, 200px"
                    style={{ objectFit: 'cover' }}
                    priority={isCenter}
                    className={styles.avatar}
                  />
                </div>
                
                <motion.span
                  className={styles.channelName}
                  style={{ position: 'absolute', bottom: -55, whiteSpace: 'nowrap' }}
                  initial={false}
                  animate={{ opacity: isCenter ? 1 : 0, y: isCenter ? 0 : 10 }}
                  transition={{ duration: 0.2 }}
                >
                  {channelInfo.name}
                </motion.span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
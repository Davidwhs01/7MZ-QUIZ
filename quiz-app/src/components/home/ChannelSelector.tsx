'use client';

import { useState, useEffect, useRef } from 'react';
import { useChannel, ChannelType } from '@/context/ChannelContext';
import styles from './ChannelSelector.module.css';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

const CHANNELS = {
  '7MZ': { id: '7MZ', name: '7 Minutoz', logo: '/7mz-logo.jpg' },
  'ENYGMA': { id: 'ENYGMA', name: 'Enygma', logo: '/enygma-logo.jpg' },
} as const;

let uidCounter = 10;

export default function ChannelSelector() {
  const { activeChannel, setActiveChannel } = useChannel();
  const isInitialMount = useRef(true);

  // Cyclical array to allow continuous "infinite" sliding
  const [items, setItems] = useState(() => {
    return [
      { uid: 1, id: activeChannel === '7MZ' ? 'ENYGMA' : '7MZ' as ChannelType },
      { uid: 2, id: activeChannel },
      { uid: 3, id: activeChannel === '7MZ' ? 'ENYGMA' : '7MZ' as ChannelType },
    ];
  });

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    if (items[1].id !== activeChannel) {
      setItems([
        { uid: uidCounter++, id: activeChannel === '7MZ' ? 'ENYGMA' : '7MZ' as ChannelType },
        { uid: uidCounter++, id: activeChannel },
        { uid: uidCounter++, id: activeChannel === '7MZ' ? 'ENYGMA' : '7MZ' as ChannelType }
      ]);
    }
  }, [activeChannel, items]);

  const slideRight = () => {
    const newActiveId = items[2].id;
    setItems((prev) => [
      prev[1],
      prev[2],
      { uid: uidCounter++, id: prev[1].id }
    ]);
    setActiveChannel(newActiveId);
  };

  const slideLeft = () => {
    const newActiveId = items[0].id;
    setItems((prev) => [
      { uid: uidCounter++, id: prev[1].id },
      prev[0],
      prev[1]
    ]);
    setActiveChannel(newActiveId);
  };

  const handleSelect = (index: number) => {
    if (index === 0) slideLeft();
    if (index === 2) slideRight();
  };

  return (
    <div className={styles.selectorContainer}>
      <div className={styles.carousel}>
        <AnimatePresence initial={false}>
          {items.map((item, index) => {
            const isCenter = index === 1;
            const channelInfo = CHANNELS[item.id];
            
            // X positions for left, center, right slots
            const xPos = index === 0 ? -160 : index === 2 ? 160 : 0;

            return (
              <motion.div
                key={item.uid}
                // No 'layout' prop here to prevent layout jumps/blinking. 
                // Everything is explicitly animated via transforms.
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
                  {/* Glow Ring fades strictly with opacity */}
                  <motion.div
                    className={styles.glowRing}
                    animate={{ opacity: isCenter ? 1 : 0, scale: isCenter ? 1 : 0.8 }}
                    transition={{ duration: 0.3 }}
                  />
                  <Image
                    src={channelInfo.logo}
                    alt={`${channelInfo.name} Logo`}
                    fill
                    style={{ objectFit: 'cover' }}
                    priority={isCenter}
                    className={styles.avatar}
                  />
                </div>
                
                {/* Text is always rendered but faded out. Absolute positioned to avoid layout shifts. */}
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

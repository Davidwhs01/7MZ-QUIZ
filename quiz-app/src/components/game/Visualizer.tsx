'use client';

import { useState, useEffect } from 'react';
import styles from './Visualizer.module.css';

interface VisualizerProps {
  isPlaying: boolean;
  barCount?: number;
  minHeight?: number;
  maxHeight?: number;
}

export default function Visualizer({ 
  isPlaying, 
  barCount = 24,
  minHeight = 10,
  maxHeight = 45 
}: VisualizerProps) {
  const [heights, setHeights] = useState<number[]>(
    Array.from({ length: barCount }, () => minHeight)
  );

  useEffect(() => {
    if (!isPlaying) {
      setHeights(Array.from({ length: barCount }, () => 3));
      return;
    }

    const interval = setInterval(() => {
      setHeights(prev => 
        prev.map(() => minHeight + Math.random() * (maxHeight - minHeight))
      );
    }, 120);

    return () => clearInterval(interval);
  }, [isPlaying, barCount, minHeight, maxHeight]);

  return (
    <div className={styles.container}>
      <div className={styles.label}>
        {isPlaying ? '♪ TOCANDO...' : '♪ PAUSADO'}
      </div>
      <div className={styles.bars}>
        {heights.map((h, i) => (
          <div
            key={i}
            className={styles.bar}
            style={{
              height: `${h}px`,
              opacity: isPlaying ? 1 : 0.3,
            }}
          />
        ))}
      </div>
    </div>
  );
}

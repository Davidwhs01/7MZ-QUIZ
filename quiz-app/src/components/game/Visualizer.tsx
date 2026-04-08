'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './Visualizer.module.css';

interface VisualizerProps {
  isPlaying: boolean;
  barCount?: number;
  minHeight?: number;
  maxHeight?: number;
}

export default function Visualizer({ 
  isPlaying, 
  barCount = 32,
  minHeight = 8,
  maxHeight = 70 
}: VisualizerProps) {
  const [heights, setHeights] = useState<number[]>(
    Array.from({ length: barCount }, () => minHeight)
  );
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const phaseRef = useRef(0);

  useEffect(() => {
    if (!isPlaying) {
      setHeights(Array.from({ length: barCount }, () => 4));
      phaseRef.current = 0;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      phaseRef.current += 0.15;
      
      setHeights(prev => 
        prev.map((_, i) => {
          // i = 0 é grave (esquerda), i = barCount-1 é agudo (direita)
          // Graves (esquerda) = mais energia, agudos (direita) = menos energia
          const position = i / (barCount - 1); // 0 = grave, 1 = agudo
          
          // Graves têm mais amplitude, agudos têm menos
          const amplitudeFactor = 1 - position * 0.7; // 1.0 no início, 0.3 no final
          
          // Múltiplas frequências simulando bandas de equalizador
          const freq1 = Math.sin(phaseRef.current * 1.0 + i * 0.3) * 0.5;
          const freq2 = Math.sin(phaseRef.current * 1.7 + i * 0.5) * 0.3;
          const freq3 = Math.sin(phaseRef.current * 2.3 + i * 0.8) * 0.2;
          
          // Adicionar randomness para parecer mais real
          const noise = (Math.random() - 0.5) * 0.3;
          
          // Combinar tudo
          const combined = (freq1 + freq2 + freq3 + noise + 0.5) * amplitudeFactor;
          
          const height = minHeight + (maxHeight - minHeight) * Math.max(0, Math.min(1, combined));
          
          return Math.max(minHeight, height);
        })
      );
    }, 40);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, barCount, minHeight, maxHeight]);

  return (
    <div className={styles.container}>
      <div className={styles.label}>
        {isPlaying ? '♪ TOCANDO...' : '♪ PAUSADO'}
      </div>
      <div className={styles.bars}>
        {heights.map((h, i) => {
          return (
            <div
              key={i}
              className={styles.bar}
              style={{
                height: `${h}px`,
                opacity: isPlaying ? 0.8 : 0.2,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
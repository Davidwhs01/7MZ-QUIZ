'use client';

/**
 * MagneticPlayBtn — taste-skill
 * Botão magnético com spring physics via Framer Motion useMotionValue.
 * NUNCA usa useState para hover contínuo (conforme SKILL.md §4).
 * Isloado como leaf component para não re-renderizar o pai.
 */

import { useRef, useCallback } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface Props {
  href: string;
  label?: string;
}

const spring = { type: 'spring' as const, stiffness: 260, damping: 22, mass: 0.8 };

export default function MagneticPlayBtn({ href, label = 'JOGAR' }: Props) {
  const ref = useRef<HTMLAnchorElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springX = useSpring(x, spring);
  const springY = useSpring(y, spring);

  // Transform sutil: o botão se move ±10px em direção ao cursor
  const translateX = useTransform(springX, [-1, 1], [-10, 10]);
  const translateY = useTransform(springY, [-1, 1], [-8, 8]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    x.set((e.clientX - cx) / (rect.width / 2));
    y.set((e.clientY - cy) / (rect.height / 2));
  }, [x, y]);

  const handleMouseLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  return (
    <motion.a
      ref={ref}
      href={href}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        translateX,
        translateY,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        padding: '14px 32px',
        borderRadius: '12px',
        background: 'var(--accent-orange)',
        color: '#060606',
        fontFamily: 'var(--font-ui)',
        fontSize: '0.88rem',
        fontWeight: 800,
        letterSpacing: '0.08em',
        textDecoration: 'none',
        cursor: 'pointer',
        userSelect: 'none',
        boxShadow: '0 6px 20px rgba(var(--accent-orange-rgb), 0.3)',
        willChange: 'transform',
        textTransform: 'uppercase',
      }}
      whileHover={{
        scale: 1.04,
        boxShadow: '0 12px 32px rgba(var(--accent-orange-rgb), 0.45)',
      }}
      whileTap={{ scale: 0.97 }}
      transition={spring}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
      </svg>
      {label}
    </motion.a>
  );
}

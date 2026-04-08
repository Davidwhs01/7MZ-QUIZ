'use client';

import { useState } from 'react';
import styles from './BottomDrawer.module.css';
import LoginProfileCard from './LoginProfileCard';
import GlobalRankingCard from './GlobalRankingCard';
import { useChannel, ChannelCategory } from '@/context/ChannelContext';
import { useRouter } from 'next/navigation';

export default function BottomDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const { channelCategory, setChannelCategory } = useChannel();
  const router = useRouter();

  const handleToggleSection = (category: ChannelCategory) => {
    setChannelCategory(category);
    setIsOpen(false);
    router.push(category === 'GEEK' ? '/geek' : '/pop');
  };

  return (
    <>
      {/* Floating trigger button */}
      <button
        className={styles.triggerBtn}
        onClick={() => setIsOpen(true)}
        aria-label="Abrir menu"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
          <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
        </svg>
        <span className={styles.triggerLabel}>Menu</span>
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div className={styles.backdrop} onClick={() => setIsOpen(false)} />
      )}

      {/* Drawer */}
      <div className={`${styles.drawer} ${isOpen ? styles.drawerOpen : ''}`}>
        {/* Handle bar */}
        <div className={styles.handleBar} onClick={() => setIsOpen(false)}>
          <div className={styles.handle} />
        </div>

        {/* Drawer content */}
        <div className={styles.drawerContent}>
          {/* Section Toggle */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionIcon}>🎵</span>
              <h3 className={styles.sectionTitle}>SEÇÃO</h3>
            </div>
            <div className={styles.sectionToggle}>
              <button
                className={`${styles.toggleBtn} ${channelCategory === 'GEEK' ? styles.toggleBtnActive : ''}`}
                onClick={() => handleToggleSection('GEEK')}
              >
                <span className={styles.toggleIcon}>🎮</span>
                <span>GEEK</span>
              </button>
              <button
                className={`${styles.toggleBtn} ${channelCategory === 'POP' ? styles.toggleBtnActive : ''}`}
                onClick={() => handleToggleSection('POP')}
              >
                <span className={styles.toggleIcon}>🎤</span>
                <span>POP</span>
              </button>
            </div>
          </section>

          {/* Divider */}
          <div className={styles.divider} />

          {/* Login Section */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionIcon}>👤</span>
              <h3 className={styles.sectionTitle}>SEU PERFIL</h3>
            </div>
            <LoginProfileCard />
          </section>

          {/* Divider */}
          <div className={styles.divider} />

          {/* Ranking Section */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionIcon}>🏆</span>
              <h3 className={styles.sectionTitle}>RANKING GLOBAL</h3>
            </div>
            <GlobalRankingCard />
            <p className={styles.rankingFooter}>Faça login para ver sua posição</p>
          </section>
        </div>
      </div>
    </>
  );
}

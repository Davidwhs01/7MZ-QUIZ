'use client';

import { useState } from 'react';
import styles from './BottomDrawer.module.css';
import LoginProfileCard from './LoginProfileCard';
import GlobalRankingCard from './GlobalRankingCard';

export default function BottomDrawer() {
  const [isOpen, setIsOpen] = useState(false);

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

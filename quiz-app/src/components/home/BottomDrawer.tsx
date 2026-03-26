'use client';

import { useState } from 'react';
import Image from 'next/image';
import styles from './BottomDrawer.module.css';

const MOCK_RANKING = [
  { rank: 1, name: "Lucas A.R.T.", points: "9,999", color: "var(--accent-orange)" },
  { rank: 2, name: "Gabriel Rodrigues", points: "8,540", color: "var(--accent-blue)" },
  { rank: 3, name: "Pablo Mattheus", points: "7,210", color: "#a855f7" },
  { rank: 4, name: "Nerd Hits Fan", points: "5,120", color: "var(--text-muted)" },
  { rank: 5, name: "Otaku Sniper", points: "4,600", color: "var(--text-muted)" },
];

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
            <div className={styles.loginContent}>
              <div className={styles.avatarWrap}>
                <Image src="/7mz-logo.jpg" alt="Avatar" width={48} height={48} className={styles.avatarImg} />
                <div className={styles.avatarRing} />
              </div>
              <div className={styles.loginText}>
                <h4 className={styles.loginPrompt}>Acesse sua conta</h4>
                <p className={styles.loginDesc}>Salve pontuação e participe do ranking</p>
              </div>
              <button className={styles.discordBtn}>
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
                </svg>
                ENTRAR COM DISCORD
              </button>
            </div>
          </section>

          {/* Divider */}
          <div className={styles.divider} />

          {/* Ranking Section */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionIcon}>🏆</span>
              <h3 className={styles.sectionTitle}>RANKING GLOBAL</h3>
            </div>
            <div className={styles.rankingList}>
              {MOCK_RANKING.map((player, idx) => (
                <div key={idx} className={styles.rankItem}>
                  <span className={styles.rankNumber} style={{ color: player.color }}>#{player.rank}</span>
                  <span className={styles.rankName}>{player.name}</span>
                  <span className={styles.rankPoints}>{player.points} pts</span>
                </div>
              ))}
            </div>
            <p className={styles.rankingFooter}>Faça login para ver sua posição</p>
          </section>
        </div>
      </div>
    </>
  );
}

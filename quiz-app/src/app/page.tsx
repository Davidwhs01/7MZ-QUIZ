import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';
import BottomDrawer from '@/components/home/BottomDrawer';
import LoginProfileCard from '@/components/home/LoginProfileCard';
import GlobalRankingCard from '@/components/home/GlobalRankingCard';

export default function Home() {
  return (
    <div className={styles.page}>
      {/* === Background Layer === */}
      <div className={styles.bgLayer}>
        <div className={`${styles.splatter} ${styles.splatterOrange}`} />
        <div className={`${styles.splatter} ${styles.splatterBlue}`} />
        <div className={`${styles.splatter} ${styles.splatterGreen}`} />
        <div className={styles.gridFloor} />
        <div className={styles.diagonalLine} />
        <div className={`${styles.diagonalLine} ${styles.diagonalLine2}`} />
      </div>

      <div className={styles.lobbyContainer}>
        {/* === LEFT SIDEBAR: Payer Profile / Login === */}
        <aside className={styles.sidebarLeft}>
          <div className={styles.sidebarCard}>
            <div className={styles.sidebarHeader}>
              <span className={styles.sidebarIcon}>👤</span>
              <h3 className={styles.sidebarTitle}>SEU PERFIL</h3>
            </div>
            <LoginProfileCard />
          </div>
        </aside>

        {/* === CENTER: Main Content === */}
        <main className={styles.centerContent}>
          <section className={styles.hero}>
            <div className={styles.logoContainer}>
              <div className={styles.energyRing} />
              <div className={styles.energyRing2} />
              <div className={styles.logoImage}>
                <Image
                  src="/7mz-logo.jpg"
                  alt="7 Minutoz"
                  width={200}
                  height={200}
                  priority
                />
              </div>
            </div>

            <div className={styles.titleBlock}>
              <h1 className={styles.title}>
                <span className={styles.titleQuiz}>ARENA</span>
              </h1>
              <div className={styles.subtitleLine}>
                <span className={styles.subtitleDecor} />
                <p className={styles.subtitle}>O QUIZ DEFINITIVO DE RAP GEEK</p>
                <span className={styles.subtitleDecor} />
              </div>
            </div>

            <div className={styles.statsBar}>
              <div className={styles.statItem}>
                <span className={styles.statNumber}>172+</span>
                <span className={styles.statLabel}>Músicas</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.statItem}>
                <span className={styles.statNumber}>∞</span>
                <span className={styles.statLabel}>Rodadas</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.statItem}>
                <span className={styles.statNumber}>3</span>
                <span className={styles.statLabel}>Modos</span>
              </div>
            </div>
          </section>

          <section className={styles.modesSection}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTag}>SELECIONE</span>
              <h2 className={styles.sectionTitle}>MODOS DE JOGO</h2>
            </div>

            <div className={styles.modesGrid}>
              <Link href="/play" className={styles.modeCard}>
                <div className={styles.modeCardShine} />
                <div className={styles.modeCardBorder} />
                <div className={styles.modeCardInner}>
                  <div className={styles.modeIconWrap}>
                    <span className={styles.modeIcon}>🎵</span>
                    <div className={styles.modeIconGlow} />
                  </div>
                  <div className={styles.modeInfo}>
                    <h3 className={styles.modeName}>Adivinhe a Música pelo Áudio</h3>
                    <p className={styles.modeDesc}>Ouça um trecho aleatório e lute para descobrir qual música está tocando</p>
                  </div>
                  <div className={styles.modeRight}>
                    <span className={styles.modeStatus}>JOGAR</span>
                    <svg className={styles.modeArrow} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </div>
                </div>
              </Link>

              <div className={`${styles.modeCard} ${styles.modeCardLocked}`}>
                <div className={styles.modeCardInner}>
                  <div className={styles.modeIconWrap}>
                    <span className={styles.modeIcon}>✍️</span>
                  </div>
                  <div className={styles.modeInfo}>
                    <h3 className={styles.modeName}>Complete a Letra</h3>
                    <p className={styles.modeDesc}>Complete os versos de rap geek que faltam na música para pontuar</p>
                  </div>
                  <div className={styles.modeRight}>
                    <span className={styles.modeLock}>EM BREVE</span>
                  </div>
                </div>
              </div>

              <div className={`${styles.modeCard} ${styles.modeCardLocked}`}>
                <div className={styles.modeCardInner}>
                  <div className={styles.modeIconWrap}>
                    <span className={styles.modeIcon}>🎭</span>
                  </div>
                  <div className={styles.modeInfo}>
                    <h3 className={styles.modeName}>Adivinhe o Personagem</h3>
                    <p className={styles.modeDesc}>Descubra sobre qual figura geek a música está retratando</p>
                  </div>
                  <div className={styles.modeRight}>
                    <span className={styles.modeLock}>EM BREVE</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* === RIGHT SIDEBAR: Global Ranking === */}
        <aside className={styles.sidebarRight}>
          <div className={styles.sidebarCard}>
            <div className={styles.sidebarHeader}>
              <span className={styles.sidebarIcon}>🏆</span>
              <h3 className={styles.sidebarTitle}>RANKING GLOBAL</h3>
            </div>
            
            <div className={styles.rankingList}>
              {[
                { rank: 1, name: "Lucas A.R.T.", points: "9,999", color: "var(--accent-orange)" },
                { rank: 2, name: "Gabriel Rodrigues", points: "8,540", color: "var(--accent-blue)" },
                { rank: 3, name: "Pablo Mattheus", points: "7,210", color: "#a855f7" },
                { rank: 4, name: "Nerd Hits Fan", points: "5,120", color: "var(--text-muted)" },
                { rank: 5, name: "Otaku Sniper", points: "4,600", color: "var(--text-muted)" },
              ].map((player, idx) => (
                <div key={idx} className={styles.rankItem}>
                  <span className={styles.rankNumber} style={{ color: player.color }}>#{player.rank}</span>
                  <span className={styles.rankName}>{player.name}</span>
                  <span className={styles.rankPoints}>{player.points} pts</span>
                </div>
              ))}
            </div>
            
            <div className={styles.rankingFooter}>
              Faça login para ver sua posição
            </div>
          </div>
        </aside>
      </div>

      {/* === Footer === */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <p className={styles.footerText}>
            Fan-made com <span className={styles.footerHeart}>♥</span> para a comunidade 7 Minutoz
          </p>
          <a
            href="https://www.youtube.com/@7minutoz"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.footerLink}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            Canal no YouTube
          </a>
        </div>
      </footer>
      {/* === Bottom Drawer (Mobile only) === */}
      <BottomDrawer />
    </div>
  );
}

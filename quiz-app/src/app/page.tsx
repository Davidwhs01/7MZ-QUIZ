import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';

export default function Home() {
  return (
    <div className={styles.page}>
      {/* === Background Layer === */}
      <div className={styles.bgLayer}>
        {/* Animated splatter blobs — 7MZ brand colors */}
        <div className={`${styles.splatter} ${styles.splatterOrange}`} />
        <div className={`${styles.splatter} ${styles.splatterBlue}`} />
        <div className={`${styles.splatter} ${styles.splatterGreen}`} />

        {/* Neon grid floor */}
        <div className={styles.gridFloor} />

        {/* Diagonal accent lines */}
        <div className={styles.diagonalLine} />
        <div className={`${styles.diagonalLine} ${styles.diagonalLine2}`} />
      </div>

      {/* === Hero Section === */}
      <section className={styles.hero}>
        {/* Logo with energy ring */}
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

        {/* Title */}
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>
            <span className={styles.titleQuiz}>QUIZ</span>
          </h1>
          <div className={styles.subtitleLine}>
            <span className={styles.subtitleDecor} />
            <p className={styles.subtitle}>O QUIZ DEFINITIVO DE RAP GEEK</p>
            <span className={styles.subtitleDecor} />
          </div>
        </div>

        {/* Stats bar */}
        <div className={styles.statsBar}>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>20+</span>
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

      {/* === Modes Section === */}
      <section className={styles.modesSection}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTag}>SELECIONE</span>
          <h2 className={styles.sectionTitle}>MODOS DE JOGO</h2>
        </div>

        <div className={styles.modesGrid}>
          {/* Active Mode - Audio */}
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
                <p className={styles.modeDesc}>
                  Ouça um trecho aleatório e descubra qual música está tocando
                </p>
              </div>
              <div className={styles.modeRight}>
                <span className={styles.modeStatus}>JOGAR</span>
                <svg className={styles.modeArrow} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </div>
            </div>
          </Link>

          {/* Locked Mode - Lyrics */}
          <div className={`${styles.modeCard} ${styles.modeCardLocked}`}>
            <div className={styles.modeCardInner}>
              <div className={styles.modeIconWrap}>
                <span className={styles.modeIcon}>✍️</span>
              </div>
              <div className={styles.modeInfo}>
                <h3 className={styles.modeName}>Complete a Letra</h3>
                <p className={styles.modeDesc}>
                  Complete os versos que faltam na letra da música
                </p>
              </div>
              <div className={styles.modeRight}>
                <span className={styles.modeLock}>EM BREVE</span>
              </div>
            </div>
          </div>

          {/* Locked Mode - Character */}
          <div className={`${styles.modeCard} ${styles.modeCardLocked}`}>
            <div className={styles.modeCardInner}>
              <div className={styles.modeIconWrap}>
                <span className={styles.modeIcon}>🎭</span>
              </div>
              <div className={styles.modeInfo}>
                <h3 className={styles.modeName}>Adivinhe o Personagem</h3>
                <p className={styles.modeDesc}>
                  Descubra sobre qual personagem é a música
                </p>
              </div>
              <div className={styles.modeRight}>
                <span className={styles.modeLock}>EM BREVE</span>
              </div>
            </div>
          </div>
        </div>
      </section>

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
    </div>
  );
}

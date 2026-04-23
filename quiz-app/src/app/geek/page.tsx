'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';
import BottomDrawer from '@/components/home/BottomDrawer';
import LoginProfileCard from '@/components/home/LoginProfileCard';
import GlobalRankingCard from '@/components/home/GlobalRankingCard';
import ChannelSelector from '@/components/home/ChannelSelector';
import { type SongCategory, type Song, getSongsBySection } from '@/data/songs';
import { useChannel } from '@/context/ChannelContext';
import { getAllSongs, invalidateSongsCache } from '@/lib/songs-store';
import { createClient } from '@/utils/supabase/client';
import { createRoom, joinRoom } from '@/utils/supabase/battle';
import { SECTIONS } from '@/data/sections';

// ── SVG Icons (taste-skill: zero emojis) ─────────────────────────────────────
const IconUser = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
  </svg>
);
const IconTrophy = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4a2 2 0 0 1-2-2V5h4"/><path d="M18 9h2a2 2 0 0 0 2-2V5h-4"/>
    <path d="M12 17v4"/><path d="M8 21h8"/><path d="M6 9a6 6 0 0 0 12 0V3H6z"/>
  </svg>
);
const IconMusic = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
  </svg>
);
const IconSwords = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" y1="19" x2="19" y2="13"/>
    <polyline points="9.5 6.5 6 3 3 6 6.5 9.5"/><polyline points="14.5 6.5 18 3 21 6 17.5 9.5"/>
    <line x1="5" y1="19" x2="11" y2="13"/>
  </svg>
);
const IconPencil = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
  </svg>
);
const IconMask = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12c0-5.5 4-9 10-9s10 3.5 10 9c0 2-1 4-3 5.5C17 18 15 18 12 18s-5 0-7-0.5C3 16 2 14 2 12z"/>
    <path d="M8 12h.01M16 12h.01"/>
  </svg>
);
const IconYoutube = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);
const IconGamepad = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="6" width="20" height="12" rx="2"/>
    <path d="M6 12h4M8 10v4"/><circle cx="15" cy="11" r="1"/><circle cx="18" cy="13" r="1"/>
  </svg>
);
const IconArrowRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18">
    <path d="m9 18 6-6-6-6"/>
  </svg>
);
const IconMicVocal = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"/>
    <path d="M16 9a5 5 0 0 1 0 6"/><path d="M19.364 18.364a10 10 0 0 0 0-12.728"/>
  </svg>
);
const IconChevronRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6"/>
  </svg>
);

// ── Marquee items ─────────────────────────────────────────────────────────────
const MARQUEE_ITEMS = [
  { label: 'Geek Arena', accent: false },
  { label: '·', accent: true },
  { label: '7 Minutoz', accent: false },
  { label: '·', accent: true },
  { label: 'Enygma', accent: false },
  { label: '·', accent: true },
  { label: 'M4rkim', accent: false },
  { label: '·', accent: true },
  { label: 'Rodrigozin', accent: false },
  { label: '·', accent: true },
  { label: 'Daikinez', accent: false },
  { label: '·', accent: true },
  { label: 'Nishikay', accent: false },
  { label: '·', accent: true },
  { label: 'Anirap', accent: false },
  { label: '·', accent: true },
  { label: 'Adivinhe a Música', accent: false },
  { label: '·', accent: true },
];

type GameMode = 'single' | 'multi';

export default function GeekHome() {
  const router = useRouter();
  const { activeChannel, isLoaded } = useChannel();
  const [gameMode, setGameMode] = useState<GameMode>('single');
  const [selectedSelo, setSelectedSelo] = useState<SongCategory | 'PÓS REVELAÇÃO'>('NERD HITS');
  const [battleMode, setBattleMode] = useState<'normal' | 'inferno'>('normal');
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeGame, setActiveGame] = useState<{ id: string; code: string } | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const section = SECTIONS.geek;
  const sectionSongs = useMemo(() => getSongsBySection('geek'), []);

  useEffect(() => {
    createClient().auth.getSession().then((res: { data: { session: unknown } }) => {
      setIsLoggedIn(res.data.session !== null);
    });
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    const check = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('game_rooms')
        .select('id, room_code')
        .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
        .in('status', ['waiting', 'playing'])
        .limit(1);
      if (data && data.length > 0) {
        setActiveGame({ id: data[0].id, code: data[0].room_code });
      }
    };
    check();
  }, [isLoggedIn]);

  // Derive selo options dynamically from songs in cache
  const [artistSongs, setArtistSongs] = useState<Song[]>([]);
  const [songsReady, setSongsReady] = useState(false);
  useEffect(() => {
    setSongsReady(false);
    getAllSongs().then(all => {
      setArtistSongs(all.filter(s => s.artist === activeChannel));
      const categories = [...new Set(all.filter(s => s.artist === activeChannel).map(s => s.category))].filter(Boolean);
      if (categories.length > 0) {
        setSelectedSelo(categories[0] as SongCategory);
      }
      setSongsReady(true);
    });
  }, [activeChannel]); // reload whenever artist changes

  const selloOptions = useMemo(() => {
    const categories = [...new Set(artistSongs.map(s => s.category))].filter(Boolean);
    const hasPosRevelacao = artistSongs.some(s => s.selos?.includes('PÓS REVELAÇÃO'));
    const opts: { key: string; label: string }[] = categories.map(cat => ({ key: cat, label: cat }));
    if (hasPosRevelacao) opts.push({ key: 'PÓS REVELAÇÃO', label: 'PÓS REVELAÇÃO' });
    return opts;
  }, [artistSongs]);

  const handleCreateRoom = useCallback(async () => {
    if (!isLoggedIn) return;
    setLoading(true);
    setError('');
    const { room, error: err } = await createRoom(battleMode, activeChannel);
    if (err || !room) {
      setError(err || 'Erro ao criar sala');
      setLoading(false);
      return;
    }
    router.push(`/battle/${room.id}`);
  }, [battleMode, router, isLoggedIn, activeChannel]);

  const handleJoinRoom = useCallback(async () => {
    if (roomCode.length < 4) return;
    setLoading(true);
    setError('');
    const { room, error: err } = await joinRoom(roomCode);
    if (err || !room) {
      setError(err || 'Sala não encontrada');
      setLoading(false);
      return;
    }
    router.push(`/battle/${room.id}`);
  }, [roomCode, router]);

  // ── Loading state premium ──────────────────────────────────────────────────
  if (!isLoaded) {
    return (
      <div className={styles.page} style={{ minHeight: '100dvh' }}>
        <div className={styles.bgLayer}>
          <div className={styles.wallpaper} />
          <div className={`${styles.orb} ${styles.orb1}`} />
          <div className={`${styles.orb} ${styles.orb2}`} />
          <div className={`${styles.orb} ${styles.orb3}`} />
          <div className={`${styles.splatter} ${styles.splatterOrange}`} />
          <div className={`${styles.splatter} ${styles.splatterBlue}`} />
          <div className={styles.noise} />
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100dvh',
          flexDirection: 'column',
          gap: '32px',
          padding: '40px',
        }}>
          {/* Pulsing ring — sem spinner genérico */}
          <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              border: '2px solid transparent',
              borderTopColor: 'var(--accent-orange)',
              borderRightColor: 'rgba(var(--accent-orange-rgb), 0.3)',
              animation: 'rotateRing 1.2s linear infinite',
            }} />
            <div style={{
              position: 'absolute', inset: 8, borderRadius: '50%',
              border: '1.5px solid transparent',
              borderBottomColor: 'var(--accent-blue)',
              borderLeftColor: 'rgba(var(--accent-blue-rgb), 0.2)',
              animation: 'rotateRing 2s linear infinite reverse',
            }} />
            <div style={{
              position: 'absolute', inset: '50%', transform: 'translate(-50%,-50%)',
              width: 10, height: 10, borderRadius: '50%',
              background: 'var(--accent-orange)',
              boxShadow: '0 0 12px var(--accent-orange)',
              animation: 'pulse 2s ease-in-out infinite',
            }} />
          </div>
          {/* Skeleton layout */}
          <div style={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="skeleton-shimmer" style={{ height: 20, width: '60%', margin: '0 auto', borderRadius: 6 }} />
            <div className="skeleton-shimmer" style={{ height: 14, width: '40%', margin: '0 auto', borderRadius: 6 }} />
            <div style={{ marginTop: 12 }}>
              {[1, 2, 3].map(i => (
                <div key={i} className="skeleton-shimmer" style={{
                  height: 72, borderRadius: 16, marginBottom: 12,
                  animationDelay: `${i * 150}ms`,
                }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div className={styles.page}>
      <div className={styles.bgLayer}>
        <div className={styles.wallpaper} />
        <div className={`${styles.orb} ${styles.orb1}`} />
        <div className={`${styles.orb} ${styles.orb2}`} />
        <div className={`${styles.orb} ${styles.orb3}`} />
        <div className={`${styles.splatter} ${styles.splatterOrange}`} />
        <div className={`${styles.splatter} ${styles.splatterBlue}`} />
        <div className={`${styles.splatter} ${styles.splatterGreen}`} />
        <div className={`${styles.geometric} ${styles.triangle}`} />
        <div className={`${styles.geometric} ${styles.circle}`} />
        <div className={`${styles.geometric} ${styles.diamond}`} />
        <div className={styles.noise} />
        <div className={styles.gridFloor} />
        <div className={styles.diagonalLine} />
        <div className={`${styles.diagonalLine} ${styles.diagonalLine2}`} />
      </div>

      <div className={styles.lobbyContainer}>
        {/* ── Sidebar esquerda ─────────────────────────────────────────── */}
        <aside className={styles.sidebarLeft}>
          <div className={styles.sidebarCard}>
            <div className={styles.sidebarHeader}>
              <span className={styles.sidebarIcon}><IconUser /></span>
              <h3 className={styles.sidebarTitle}>SEU PERFIL</h3>
            </div>
            <LoginProfileCard />
            <Link href="/pop" className={styles.sectionSwitch}>
              <span className={styles.sectionSwitchIcon}><IconMicVocal /></span>
              <span className={styles.sectionSwitchText}>Ir para POP</span>
              <span style={{ marginLeft: 'auto', opacity: 0.5 }}><IconChevronRight /></span>
            </Link>
          </div>
        </aside>

        {/* ── Conteúdo central ─────────────────────────────────────────── */}
        <main className={styles.centerContent}>
          <section className={styles.hero}>
            <ChannelSelector />

            <div className={styles.titleBlock}>
              <h1 className={styles.title}>
                <span className={styles.titleQuiz}>
                  {section.title}
                </span>
              </h1>
              <div className={styles.subtitleLine}>
                <span className={styles.subtitleDecor} />
                <p className={styles.subtitle}>
                  {section.subtitle}
                </p>
                <span className={styles.subtitleDecor} />
              </div>
            </div>

            <div className={styles.statsBar}>
              <div className={styles.statItem}>
                <span className={styles.statNumber}>
                  {artistSongs.length}+
                </span>
                <span className={styles.statLabel}>Músicas</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.statItem}>
                <span className={styles.statNumber}>∞</span>
                <span className={styles.statLabel}>Rodadas</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.statItem}>
                <span className={styles.statNumber}>
                  {new Set([
                    ...artistSongs.map(s => s.category),
                    ...artistSongs.flatMap(s => s.selos || [])
                  ]).size}
                </span>
                <span className={styles.statLabel}>Selos</span>
              </div>
            </div>
          </section>

          <section className={styles.modesSection}>
            <div className={styles.sectionHeader}>
              <div className={styles.modeToggle}>
                <div
                  className={styles.modeTogglePill}
                  style={{ transform: gameMode === 'single' ? 'translateX(0)' : 'translateX(100%)' }}
                />
                <button
                  className={`${styles.modeToggleBtn} ${gameMode === 'single' ? styles.modeToggleActive : ''}`}
                  onClick={() => { setGameMode('single'); setError(''); }}
                >
                  <IconMusic /> SINGLE
                </button>
                <button
                  className={`${styles.modeToggleBtn} ${gameMode === 'multi' ? styles.modeToggleActive : ''}`}
                  onClick={() => { setGameMode('multi'); setError(''); }}
                >
                  <IconSwords /> MULTI
                </button>
              </div>
            </div>

            {gameMode === 'multi' && activeGame && (
              <Link href={`/battle/${activeGame.id}`} className={styles.activeBanner}>
                <span><IconGamepad /></span>
                <div>
                  <strong>Partida em andamento</strong>
                  <span> Sala {activeGame.code}</span>
                </div>
                <span className={styles.activeBannerArrow}><IconArrowRight /></span>
              </Link>
            )}

            {gameMode === 'single' ? (
              <div key="single-panel" className={`${styles.modesGrid} ${styles.panelEnter}`}>
                <Link href={`/play?artist=${activeChannel.toLowerCase()}`} className={styles.modeCard}>
                  <div className={styles.modeCardShine} />
                  <div className={styles.modeCardBorder} />
                  <div className={styles.modeCardInner}>
                    <div className={styles.modeIconWrap}>
                      <span className={styles.modeIcon}><IconMusic /></span>
                      <div className={styles.modeIconGlow} />
                    </div>
                    <div className={styles.modeInfo}>
                      <h3 className={styles.modeName}>Adivinhe a Música pelo Áudio</h3>
                      <p className={styles.modeDesc}>Ouça um trecho aleatório e descubra qual música está tocando</p>
                    </div>
                    <div className={styles.modeRight}>
                      <span className={styles.modeStatus}>JOGAR</span>
                      <IconArrowRight />
                    </div>
                  </div>
                </Link>

                <div className={`${styles.modeCard} ${styles.modeCardLocked}`}>
                  <div className={styles.modeCardInner}>
                    <div className={styles.modeIconWrap}>
                      <span className={styles.modeIcon}><IconPencil /></span>
                    </div>
                    <div className={styles.modeInfo}>
                      <h3 className={styles.modeName}>Complete a Letra</h3>
                      <p className={styles.modeDesc}>Complete os versos de rap geek que faltam na música</p>
                    </div>
                    <div className={styles.modeRight}>
                      <span className={styles.modeLock}>EM BREVE</span>
                    </div>
                  </div>
                </div>

                <div className={`${styles.modeCard} ${styles.modeCardLocked}`}>
                  <div className={styles.modeCardInner}>
                    <div className={styles.modeIconWrap}>
                      <span className={styles.modeIcon}><IconMask /></span>
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
            ) : (
              <div key="multi-panel" className={`${styles.multiPanel} ${styles.panelEnter}`}>
                <div className={`${styles.multiCard} ${styles.multiCardActive}`}>
                  <span className={styles.multiCardEmoji}><IconSwords /></span>
                  <div className={styles.multiCardInfo}>
                    <div className={styles.multiCardName}>Batalha 1v1</div>
                    <div className={styles.multiCardDesc}>5 rodadas · 3 vidas · Quem somar mais pontos vence</div>
                  </div>
                  <span className={styles.multiCardBadge}>PRONTO</span>
                </div>

                <div className={styles.multiSection}>
                  <div className={styles.multiLabel}>Selo</div>
                  <div className={styles.seloRow}>
                    {selloOptions.length === 0 ? (
                      <span style={{ opacity: 0.5, fontSize: '0.85rem' }}>Carregando...</span>
                    ) : selloOptions.map(opt => (
                      <button
                        key={opt.key}
                        className={`${styles.seloBtn} ${selectedSelo === opt.key ? styles.seloBtnActive : ''}`}
                        onClick={() => setSelectedSelo(opt.key)}
                      >
                        <span className={styles.seloBtnName}>{opt.label}</span>
                        <span className={styles.seloBtnCount}>
                          {opt.key === 'PÓS REVELAÇÃO'
                            ? artistSongs.filter(s => s.selos?.includes('PÓS REVELAÇÃO')).length
                            : artistSongs.filter(s => s.category === opt.key).length} músicas
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.multiSection}>
                  <div className={styles.multiLabel}>Dificuldade</div>
                  <div className={styles.diffRow}>
                    <button
                      className={`${styles.diffBtn} ${battleMode === 'normal' ? styles.diffBtnActive : ''}`}
                      onClick={() => setBattleMode('normal')}
                    >
                      <span className={styles.diffBtnName}>Normal</span>
                      <span className={styles.diffBtnTag}>Com dicas</span>
                    </button>
                    <button
                      className={`${styles.diffBtn} ${battleMode === 'inferno' ? styles.diffBtnActive : ''}`}
                      onClick={() => setBattleMode('inferno')}
                    >
                      <span className={styles.diffBtnName}>Inferno</span>
                      <span className={styles.diffBtnTag}>Sem dicas</span>
                    </button>
                  </div>
                </div>

                <button
                  className={styles.createBtn}
                  onClick={handleCreateRoom}
                  disabled={loading || !isLoggedIn}
                >
                  {!isLoggedIn ? 'FAÇA LOGIN PARA JOGAR' : loading ? 'CRIANDO...' : 'CRIAR SALA'}
                </button>

                <div className={styles.joinDivider}>ou entre com código</div>
                <div className={styles.joinRow}>
                  <input
                    className={styles.codeInput}
                    type="text"
                    placeholder="CÓDIGO"
                    value={roomCode}
                    onChange={e => { setRoomCode(e.target.value.toUpperCase()); setError(''); }}
                    maxLength={6}
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <button
                    className={styles.joinBtn}
                    onClick={handleJoinRoom}
                    disabled={loading || roomCode.length < 4 || !isLoggedIn}
                  >
                    ENTRAR
                  </button>
                </div>

                {error && (
                  <div className={styles.multiError}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    {error}
                  </div>
                )}

                <div className={`${styles.multiCard} ${styles.multiCardLocked}`}>
                  <span className={styles.multiCardEmoji}><IconTrophy /></span>
                  <div className={styles.multiCardInfo}>
                    <div className={styles.multiCardName}>Torneio</div>
                    <div className={styles.multiCardDesc}>Eliminatório com 4, 8 ou 16 jogadores</div>
                  </div>
                  <span className={styles.multiCardBadgeSoon}>EM BREVE</span>
                </div>
              </div>
            )}
          </section>
        </main>

        {/* ── Sidebar direita ───────────────────────────────────────────── */}
        <aside className={styles.sidebarRight}>
          <div className={styles.sidebarCard}>
            <div className={styles.sidebarHeader}>
              <span className={styles.sidebarIcon}><IconTrophy /></span>
              <h3 className={styles.sidebarTitle}>RANKING GLOBAL</h3>
              <span className="live-dot" style={{ marginLeft: 'auto' }} title="Ao vivo" />
            </div>
            <GlobalRankingCard />
          </div>
        </aside>
      </div>

      {/* ── Footer com Marquee Cinético ───────────────────────────────────── */}
      <footer className={styles.footer}>
        {/* Kinetic Marquee strip — taste-skill */}
        <div className={styles.marqueeStrip}>
          <div className={styles.marqueeTrack}>
            {/* Duplicado para loop contínuo */}
            {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
              <span
                key={i}
                className={`${styles.marqueeItem} ${item.accent ? styles.marqueeItemAccent : ''}`}
              >
                {item.label}
              </span>
            ))}
          </div>
        </div>

        <div className={styles.footerInner}>
          <p className={styles.footerText}>
            Feito com <span className={styles.footerHeart}>♥</span> para a fanbase de música geek
          </p>
          <a
            href="https://www.youtube.com/@7minutoz"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.footerLink}
          >
            <IconYoutube />
            Canal no YouTube
          </a>
        </div>
      </footer>
      <BottomDrawer />
    </div>
  );
}

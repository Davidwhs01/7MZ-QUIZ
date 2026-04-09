'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../page.module.css';
import BottomDrawer from '@/components/home/BottomDrawer';
import LoginProfileCard from '@/components/home/LoginProfileCard';
import GlobalRankingCard from '@/components/home/GlobalRankingCard';
import ChannelSelector from '@/components/home/ChannelSelector';
import { getSongsBySection } from '@/data/songs';
import { useChannel } from '@/context/ChannelContext';
import { createClient } from '@/utils/supabase/client';
import { createRoom, joinRoom } from '@/utils/supabase/battle';
import { SECTIONS } from '@/data/sections';

type GameMode = 'single' | 'multi';

export default function PopHome() {
  const router = useRouter();
  const { isLoaded, activeChannel } = useChannel();
  const [gameMode, setGameMode] = useState<GameMode>('single');
  const [selectedSelo] = useState<'POP'>('POP');
  const [battleMode, setBattleMode] = useState<'normal' | 'inferno'>('normal');
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeGame, setActiveGame] = useState<{ id: string; code: string } | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const section = SECTIONS.pop;
  const sectionSongs = useMemo(() => getSongsBySection('pop'), []);

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
  }, [battleMode, router, isLoggedIn]);

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

  if (!isLoaded) {
    return (
      <div className={styles.page}>
        <div className={styles.bgLayer}>
          <div className={`${styles.orb} ${styles.orb1}`} />
          <div className={`${styles.orb} ${styles.orb2}`} />
          <div className={`${styles.orb} ${styles.orb3}`} />
          <div className={`${styles.splatter} ${styles.splatterPink}`} />
          <div className={`${styles.splatter} ${styles.splatterPurple}`} />
          <div className={`${styles.splatter} ${styles.splatterHotPink}`} />
          <div className={`${styles.geometric} ${styles.triangle}`} />
          <div className={`${styles.geometric} ${styles.circle}`} />
          <div className={`${styles.geometric} ${styles.diamond}`} />
          <div className={styles.noise} />
        </div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100vh',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <div className={styles.spinner} style={{ width: 48, height: 48 }} />
          <p style={{ color: 'var(--text-primary)', opacity: 0.7 }}>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.bgLayer}>
        <div className={`${styles.orb} ${styles.orb1}`} />
        <div className={`${styles.orb} ${styles.orb2}`} />
        <div className={`${styles.orb} ${styles.orb3}`} />
        <div className={`${styles.splatter} ${styles.splatterPink}`} />
        <div className={`${styles.splatter} ${styles.splatterPurple}`} />
        <div className={`${styles.splatter} ${styles.splatterHotPink}`} />
        <div className={`${styles.geometric} ${styles.triangle}`} />
        <div className={`${styles.geometric} ${styles.circle}`} />
        <div className={`${styles.geometric} ${styles.diamond}`} />
        <div className={styles.gridFloor} />
        <div className={styles.diagonalLine} />
        <div className={styles.noise} />
      </div>

      <div className={styles.lobbyContainer}>
        <aside className={styles.sidebarLeft}>
          <div className={styles.sidebarCard}>
            <div className={styles.sidebarHeader}>
              <span className={styles.sidebarIcon}>👤</span>
              <h3 className={styles.sidebarTitle}>SEU PERFIL</h3>
            </div>
            <LoginProfileCard />
            <Link href="/geek" className={styles.sectionSwitch}>
              <span className={styles.sectionSwitchIcon}>🎮</span>
              <span className={styles.sectionSwitchText}>Ir para GEEK</span>
            </Link>
          </div>
        </aside>

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
                  {sectionSongs.length}+
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
                <span className={styles.statNumber}>2</span>
                <span className={styles.statLabel}>Artistas</span>
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
                  🎵 SINGLE
                </button>
                <button
                  className={`${styles.modeToggleBtn} ${gameMode === 'multi' ? styles.modeToggleActive : ''}`}
                  onClick={() => { setGameMode('multi'); setError(''); }}
                >
                  ⚔️ MULTI
                </button>
              </div>
            </div>

            {gameMode === 'multi' && activeGame && (
              <Link href={`/battle/${activeGame.id}`} className={styles.activeBanner}>
                <span>🎮</span>
                <div>
                  <strong>Partida em andamento</strong>
                  <span> Sala {activeGame.code}</span>
                </div>
                <span className={styles.activeBannerArrow}>→</span>
              </Link>
            )}

            {gameMode === 'single' ? (
                <div key="single-panel" className={`${styles.modesGrid} ${styles.panelEnter}`}>
                  <Link href={`/play?artist=${activeChannel === 'MITSKI' ? 'mitski' : 'meln'}`} className={styles.modeCard}>
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
                        <p className={styles.modeDesc}>Complete os versos que faltam na música para pontuar</p>
                      </div>
                      <div className={styles.modeRight}>
                        <span className={styles.modeLock}>EM BREVE</span>
                      </div>
                    </div>
                  </div>

                  <div className={`${styles.modeCard} ${styles.modeCardLocked}`}>
                    <div className={styles.modeCardInner}>
                      <div className={styles.modeIconWrap}>
                        <span className={styles.modeIcon}>🎤</span>
                      </div>
                      <div className={styles.modeInfo}>
                        <h3 className={styles.modeName}>Adivinhe o Álbum</h3>
                        <p className={styles.modeDesc}>Descubra de qual álbum a música faz parte</p>
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
                    <span className={styles.multiCardEmoji}>⚔️</span>
                    <div className={styles.multiCardInfo}>
                      <div className={styles.multiCardName}>Batalha 1v1</div>
                      <div className={styles.multiCardDesc}>5 rodadas • 3 vidas • Quem somar mais pontos vence</div>
                    </div>
                    <span className={styles.multiCardBadge}>PRONTO</span>
                  </div>

                  <div className={styles.multiSection}>
                    <div className={styles.multiLabel}>Dificuldade</div>
                    <div className={styles.diffRow}>
                      <button
                        className={`${styles.diffBtn} ${battleMode === 'normal' ? styles.diffBtnActive : ''}`}
                        onClick={() => setBattleMode('normal')}
                      >
                        <span className={styles.diffBtnName}>⚡ Normal</span>
                        <span className={styles.diffBtnTag}>Com dicas</span>
                      </button>
                      <button
                        className={`${styles.diffBtn} ${battleMode === 'inferno' ? styles.diffBtnActive : ''}`}
                        onClick={() => setBattleMode('inferno')}
                      >
                        <span className={styles.diffBtnName}>🔥 Inferno</span>
                        <span className={styles.diffBtnTag}>Sem dicas</span>
                      </button>
                    </div>
                  </div>

                  <button
                    className={styles.createBtn}
                    onClick={handleCreateRoom}
                    disabled={loading || !isLoggedIn}
                  >
                    {!isLoggedIn ? 'FAÇA LOGIN PARA JOGAR' : loading ? 'CRIANDO...' : '⚔️ CRIAR SALA'}
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

                  {error && <div className={styles.multiError}>{error}</div>}

                  <div className={`${styles.multiCard} ${styles.multiCardLocked}`}>
                    <span className={styles.multiCardEmoji}>🏆</span>
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

        <aside className={styles.sidebarRight}>
          <div className={styles.sidebarCard}>
            <div className={styles.sidebarHeader}>
              <span className={styles.sidebarIcon}>🏆</span>
              <h3 className={styles.sidebarTitle}>RANKING GLOBAL</h3>
            </div>
            <GlobalRankingCard />
          </div>
        </aside>
      </div>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <p className={styles.footerText}>
            Feito com <span className={styles.footerHeart}>♥</span> para a fanbase de música pop
          </p>
        </div>
      </footer>
      <BottomDrawer />
    </div>
  );
}
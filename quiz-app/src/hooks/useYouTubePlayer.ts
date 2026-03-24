'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    YT: typeof YT;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface UseYouTubePlayerOptions {
  onReady?: () => void;
  onError?: (error: number) => void;
}

export function useYouTubePlayer(containerId: string, options?: UseYouTubePlayerOptions) {
  const playerRef = useRef<YT.Player | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const readyCallbackRef = useRef(options?.onReady);
  const errorCallbackRef = useRef(options?.onError);
  
  readyCallbackRef.current = options?.onReady;
  errorCallbackRef.current = options?.onError;

  // Load YouTube IFrame API
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      initPlayer();
      return;
    }

    const existingScript = document.getElementById('youtube-iframe-api');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'youtube-iframe-api';
      script.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(script);
    }

    const prevCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prevCallback?.();
      initPlayer();
    };

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function initPlayer() {
    if (playerRef.current) return;
    
    playerRef.current = new window.YT.Player(containerId, {
      height: '0',
      width: '0',
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        playsinline: 1,
        rel: 0,
        showinfo: 0,
      },
      events: {
        onReady: () => {
          setIsReady(true);
          // Set initial volume
          playerRef.current?.setVolume(70);
          readyCallbackRef.current?.();
        },
        onStateChange: (event: YT.OnStateChangeEvent) => {
          setIsPlaying(event.data === YT.PlayerState.PLAYING);
        },
        onError: (event: YT.OnErrorEvent) => {
          console.error('YouTube Player Error:', event.data);
          errorCallbackRef.current?.(event.data);
        },
      },
    });
  }

  const changeVolume = useCallback((newVolume: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(newVolume)));
    setVolume(clamped);
    playerRef.current?.setVolume(clamped);
  }, []);

  const loadAndPlay = useCallback((
    videoId: string,
    startSeconds: number,
    durationSeconds: number
  ) => {
    if (!playerRef.current) return;
    
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    playerRef.current.loadVideoById({
      videoId,
      startSeconds,
    });

    // Auto-pause after duration
    timerRef.current = setTimeout(() => {
      playerRef.current?.pauseVideo();
      setIsPlaying(false);
    }, durationSeconds * 1000);
  }, []);

  // Load a video silently and return its real duration
  const getRealDuration = useCallback((videoId: string): Promise<number> => {
    return new Promise((resolve) => {
      if (!playerRef.current) { resolve(0); return; }

      // Mute, load at 0, then poll getDuration
      const prevVol = playerRef.current.getVolume?.() ?? 70;
      playerRef.current.setVolume(0);
      playerRef.current.loadVideoById({ videoId, startSeconds: 0 });

      let attempts = 0;
      const poll = setInterval(() => {
        attempts++;
        const dur = playerRef.current?.getDuration?.() ?? 0;
        if (dur > 0 || attempts > 40) {  // max ~4 seconds of polling
          clearInterval(poll);
          playerRef.current?.pauseVideo();
          playerRef.current?.setVolume(prevVol);
          resolve(dur > 0 ? dur : 240); // fallback 4min
        }
      }, 100);
    });
  }, []);

  const replay = useCallback((
    videoId: string,
    startSeconds: number,
    durationSeconds: number
  ) => {
    if (!playerRef.current) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    playerRef.current.seekTo(startSeconds, true);
    playerRef.current.playVideo();

    timerRef.current = setTimeout(() => {
      playerRef.current?.pauseVideo();
      setIsPlaying(false);
    }, durationSeconds * 1000);
  }, []);

  const pause = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    playerRef.current?.pauseVideo();
    setIsPlaying(false);
  }, []);

  const stop = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    playerRef.current?.stopVideo();
    setIsPlaying(false);
  }, []);

  return {
    isReady,
    isPlaying,
    volume,
    changeVolume,
    loadAndPlay,
    getRealDuration,
    replay,
    pause,
    stop,
  };
}

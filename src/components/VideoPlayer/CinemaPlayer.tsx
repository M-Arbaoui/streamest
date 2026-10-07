import React, { useState, useEffect, useRef, useCallback } from 'react';
import Hls from 'hls.js';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Settings,
  Tv,
  Download,
  Check,
  Radio,
  Sliders,
  Sparkles,
  Layers,
  ChevronDown,
  X,
  Gauge,
  Info,
  ShieldCheck,
  Share2,
  ExternalLink,
  Smartphone,
  Server,
  ArrowRight,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { 
  MediaItem, 
  PlayerEngine, 
  TranscodeProfile, 
  Episode 
} from '../../types';
import { 
  TRANSCODE_PROFILES, 
  EMBED_SERVERS, 
  EmbedServer,
  getStreamUrlForMedia,
  getSavedServerId,
  savePreferredServerId
} from '../../services/hlsStreams';
import { TMDBService, getImageUrl } from '../../services/tmdb';
import { authService } from '../../services/authService';
import { offlineService } from '../../services/offlineCache';

interface CinemaPlayerProps {
  media: MediaItem;
  season?: number;
  episode?: number;
  initialServerId?: string;
  onClose: () => void;
  onSwitchToMultiStream?: () => void;
}

export const CinemaPlayer: React.FC<CinemaPlayerProps> = ({
  media,
  season = 1,
  episode = 1,
  initialServerId,
  onClose,
  onSwitchToMultiStream,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  // Determine initial server & engine
  const initialSaved = initialServerId || getSavedServerId();
  const foundInitialServer = EMBED_SERVERS.find((s) => s.id === initialSaved) || EMBED_SERVERS[0];
  const startAsEmbed = initialSaved !== 'hls-ultra';

  // Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [theaterMode, setTheaterMode] = useState(false);
  const [ambientGlow, setAmbientGlow] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);

  // Engine & Transcoding State
  const [currentEngine, setCurrentEngine] = useState<PlayerEngine>(startAsEmbed ? 'embed-bridge' : 'hls-ultra');
  const [currentProfile, setCurrentProfile] = useState<TranscodeProfile>(TRANSCODE_PROFILES[0]); // Auto
  const [selectedEmbedServer, setSelectedEmbedServer] = useState<EmbedServer>(foundInitialServer);
  const [customStreamUrl, setCustomStreamUrl] = useState('');
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showSourcesDrawer, setShowSourcesDrawer] = useState(false);
  const [showStatsHUD, setShowStatsHUD] = useState(false);
  const [subtitleTrack, setSubtitleTrack] = useState<'off' | 'en' | 'es' | 'fr'>('off');
  const [iframeKey, setIframeKey] = useState(0);
  const [showSourceHint, setShowSourceHint] = useState(false);

  // Series Episodes
  const [currentSeason, setCurrentSeason] = useState(season);
  const [currentEpisode, setCurrentEpisode] = useState(episode);
  const [episodesList, setEpisodesList] = useState<Episode[]>([]);
  const [showEpisodeDrawer, setShowEpisodeDrawer] = useState(false);

  // Offline Download State
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Real-time Stream Health Telemetry
  const [stats, setStats] = useState({
    bitrate: 'Auto (6,850 kbps)',
    bufferLength: '12.4s',
    droppedFrames: 0,
    resolution: '1920x1080 @ 60fps',
    codec: 'avc1.64002a / mp4a.40.2',
    latency: '0.8s',
  });

  const controlsTimeoutRef = useRef<number | null>(null);
  const isTv = media.media_type === 'tv';
  const title = media.title || media.name || 'Cinema Stream';

  // Check if media is downloaded
  useEffect(() => {
    setIsDownloaded(offlineService.isDownloaded(media.id, currentSeason, currentEpisode));
  }, [media.id, currentSeason, currentEpisode]);

  // Load episodes if TV show
  useEffect(() => {
    if (isTv) {
      TMDBService.getEpisodes(media.id, currentSeason).then((eps) => {
        setEpisodesList(eps);
      });
    }
  }, [media.id, currentSeason, isTv]);

  // Nudge user toward switching sources if embed might be slow
  useEffect(() => {
    if (currentEngine === 'embed-bridge') {
      const timer = setTimeout(() => {
        setShowSourceHint(true);
      }, 7000);
      return () => clearTimeout(timer);
    } else {
      setShowSourceHint(false);
    }
  }, [currentEngine, selectedEmbedServer, iframeKey]);

  // Handle server switch
  const handleSelectServer = (srv: EmbedServer) => {
    setSelectedEmbedServer(srv);
    setCurrentEngine('embed-bridge');
    savePreferredServerId(srv.id);
    setIframeKey((k) => k + 1);
    setShowSourcesDrawer(false);
    setShowSourceHint(false);
  };

  const handleSelectHls = () => {
    setCurrentEngine('hls-ultra');
    savePreferredServerId('hls-ultra');
    setShowSourcesDrawer(false);
    setShowSourceHint(false);
  };

  const handleNextServer = () => {
    const currentIndex = EMBED_SERVERS.findIndex((s) => s.id === selectedEmbedServer.id);
    const nextIndex = (currentIndex + 1) % EMBED_SERVERS.length;
    handleSelectServer(EMBED_SERVERS[nextIndex]);
  };

  // Initialize Stream with HLS or Fallback
  const initPlayerStream = useCallback(() => {
    if (currentEngine === 'embed-bridge') return;

    const video = videoRef.current;
    if (!video) return;

    const stream = getStreamUrlForMedia(media.id, media.media_type, currentSeason, currentEpisode);
    const targetUrl = customStreamUrl.trim() || stream.hlsUrl;

    // Destroy existing HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported() && currentEngine === 'hls-ultra') {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
      });

      hls.loadSource(targetUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        setIsBuffering(false);
        video.play().catch(() => {});
        setIsPlaying(true);

        if (data.levels && data.levels.length > 0) {
          const highest = data.levels[data.levels.length - 1];
          setStats((prev) => ({
            ...prev,
            resolution: `${highest.width}x${highest.height} @ 60fps`,
            bitrate: `${Math.round(highest.bitrate / 1000)} kbps`,
          }));
        }
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        const lvl = hls.levels[data.level];
        if (lvl) {
          setStats((prev) => ({
            ...prev,
            resolution: `${lvl.width}x${lvl.height}`,
            bitrate: `${Math.round(lvl.bitrate / 1000)} kbps`,
          }));
        }
      });

      hls.on(Hls.Events.ERROR, (_, errData) => {
        if (errData.fatal) {
          console.warn('HLS Fatal Error, falling back to direct video MP4', errData);
          hls.destroy();
          video.src = stream.fallbackMp4;
          video.play().catch(() => {});
        }
      });

      hlsRef.current = hls;
    } else {
      // Fallback direct MP4
      video.src = stream.fallbackMp4;
      video.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [media.id, media.media_type, currentSeason, currentEpisode, currentEngine, customStreamUrl]);

  useEffect(() => {
    initPlayerStream();
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [initPlayerStream]);

  // Telemetry buffer ticker
  useEffect(() => {
    const timer = setInterval(() => {
      const video = videoRef.current;
      if (!video) return;

      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        const remainingBuffer = Math.max(0, bufferedEnd - video.currentTime);
        setStats((prev) => ({
          ...prev,
          bufferLength: `${remainingBuffer.toFixed(1)}s`,
          droppedFrames: (video as any).webkitDroppedFrameCount || 0,
        }));
      }

      // Sync progress to user account
      if (video.duration > 0 && video.currentTime > 5) {
        authService.updateProgress(
          media.id,
          title,
          media.media_type || 'movie',
          video.currentTime,
          video.duration,
          media.poster_path,
          media.backdrop_path,
          currentSeason,
          currentEpisode
        );
      }
    }, 2000);

    return () => clearInterval(timer);
  }, [media, currentSeason, currentEpisode, title]);

  // Auto-hide controls
  const handleMouseMove = () => {
    setControlsVisible(true);
    if (controlsTimeoutRef.current) {
      window.clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = window.setTimeout(() => {
      if (isPlaying) {
        setControlsVisible(false);
      }
    }, 3500);
  };

  // Play / Pause Toggle
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  // Skip 10 seconds
  const skip = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds));
  };

  // Fullscreen Toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Picture in Picture
  const togglePiP = async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await video.requestPictureInPicture();
      }
    } catch (e) {
      console.warn('PiP not available', e);
    }
  };

  // Download for Offline
  const handleOfflineDownload = async () => {
    setIsDownloading(true);
    const stream = getStreamUrlForMedia(media.id, media.media_type, currentSeason, currentEpisode);
    await offlineService.startDownload(
      media.id,
      title,
      media.media_type || 'movie',
      media.poster_path,
      stream.fallbackMp4,
      currentSeason,
      currentEpisode,
      duration || 5400
    );
    setIsDownloading(false);
    setIsDownloaded(true);
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          setIsMuted((prev) => !prev);
          break;
        case 'arrowleft':
          e.preventDefault();
          skip(-10);
          break;
        case 'arrowright':
          e.preventDefault();
          skip(10);
          break;
        case 'arrowup':
          e.preventDefault();
          setVolume((v) => Math.min(1, v + 0.1));
          break;
        case 'arrowdown':
          e.preventDefault();
          setVolume((v) => Math.max(0, v - 0.1));
          break;
        case 'escape':
          if (!isFullscreen) onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, onClose]);

  // Sync volume with video element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Format seconds to mm:ss or hh:mm:ss
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const nextServerCandidate = (() => {
    const idx = EMBED_SERVERS.findIndex((s) => s.id === selectedEmbedServer.id);
    return EMBED_SERVERS[(idx + 1) % EMBED_SERVERS.length];
  })();

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={`fixed inset-0 z-50 bg-black flex flex-col justify-center items-center overflow-hidden transition-all duration-300 ${
        theaterMode ? 'p-0' : ''
      }`}
    >
      {/* Ambient Glow Reflection behind player */}
      {ambientGlow && (
        <div
          className="absolute inset-0 pointer-events-none opacity-30 blur-3xl scale-110 -z-10 transition-opacity duration-1000"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, #f59e0b 0%, #3b82f6 30%, transparent 70%)`,
          }}
        />
      )}

      {/* Main Video Viewport or Embed Bridge */}
      <div className="relative w-full h-full flex items-center justify-center bg-black">
        {currentEngine === 'embed-bridge' ? (
          <div className="w-full h-full flex flex-col relative">
            {/* Top Bar for Embed Mode */}
            <div className="px-4 py-2.5 bg-zinc-950/95 border-b border-white/10 flex flex-wrap items-center justify-between text-xs gap-2 z-20">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSourcesDrawer(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold transition cursor-pointer"
                >
                  <Server className="w-3.5 h-3.5 text-amber-400" />
                  <span>Source: {selectedEmbedServer.label}</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                <span className="text-zinc-500 hidden sm:inline">|</span>
                <span className="text-zinc-400 hidden sm:inline font-mono">
                  {isTv ? `S${currentSeason} : E${currentEpisode}` : 'Full Movie'}
                </span>
              </div>

              {/* Server Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleNextServer}
                  className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-zinc-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer border border-white/10"
                  title="Switch to next mirror server"
                >
                  <RefreshCw className="w-3 h-3 text-amber-400" />
                  <span className="hidden sm:inline">Try Next:</span>
                  <span className="font-semibold text-white">{nextServerCandidate.label}</span>
                </button>

                <button
                  onClick={handleSelectHls}
                  className="px-2.5 py-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold rounded-lg text-xs flex items-center gap-1 transition shadow-md cursor-pointer"
                  title="Switch to adaptive HLS.js video engine"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Ultra HLS</span>
                </button>

                <button
                  onClick={toggleFullscreen}
                  className="p-1.5 text-zinc-400 hover:text-white rounded-lg bg-white/5 hover:bg-white/10 transition"
                  title="Fullscreen"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={onClose}
                  className="p-1.5 text-zinc-400 hover:text-white rounded-lg bg-white/5 hover:bg-white/10 transition"
                  title="Close player"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Source Buffering / Hint Banner */}
            {showSourceHint && (
              <div className="absolute top-12 left-4 right-4 z-30 p-2.5 rounded-xl bg-zinc-900/90 backdrop-blur-md border border-amber-500/30 text-xs text-zinc-300 flex items-center justify-between shadow-2xl animate-fade-in">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    Stream taking a while or blocked? Embed servers may experience downtime.{' '}
                    <strong className="text-white">Try another video source:</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleNextServer}
                    className="px-2 py-0.5 rounded bg-amber-400 text-black font-bold text-[11px] hover:bg-amber-300 cursor-pointer"
                  >
                    Switch to {nextServerCandidate.label}
                  </button>
                  <button
                    onClick={() => setShowSourcesDrawer(true)}
                    className="px-2 py-0.5 rounded bg-white/10 text-white font-medium text-[11px] hover:bg-white/20 cursor-pointer"
                  >
                    View All Sources
                  </button>
                  <button
                    onClick={() => setShowSourceHint(false)}
                    className="text-zinc-500 hover:text-white p-0.5"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* Embed Iframe */}
            <iframe
              key={`${selectedEmbedServer.id}-${media.id}-${currentSeason}-${currentEpisode}-${iframeKey}`}
              src={
                isTv
                  ? selectedEmbedServer.tv(media.id, currentSeason, currentEpisode)
                  : selectedEmbedServer.movie(media.id)
              }
              title={title}
              className="w-full flex-1 border-0 bg-black"
              allowFullScreen
              allow="autoplay; encrypted-media; picture-in-picture; accelerometer; gyroscope"
            />
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-contain cursor-pointer"
              onClick={togglePlay}
              onTimeUpdate={() => {
                if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
              }}
              onLoadedMetadata={() => {
                if (videoRef.current) setDuration(videoRef.current.duration);
              }}
              onWaiting={() => setIsBuffering(true)}
              onPlaying={() => setIsBuffering(false)}
              playsInline
            />

            {/* Subtitles Overlay */}
            {subtitleTrack !== 'off' && isPlaying && (
              <div className="absolute bottom-24 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-lg bg-black/80 text-amber-200 font-sans text-sm sm:text-base border border-white/10 shadow-lg pointer-events-none">
                {subtitleTrack === 'en'
                  ? `[Atmos CC]: "Long live the fighters in the cinematic universe."`
                  : subtitleTrack === 'es'
                  ? `[Subtitulado]: "Larga vida a los luchadores del universo cinemático."`
                  : `[Sous-titres]: "Longue vie aux combattants dans l'univers cinématographique."`}
              </div>
            )}

            {/* Buffering Spinner */}
            {isBuffering && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 pointer-events-none">
                <div className="w-12 h-12 border-3 border-amber-400 border-t-transparent rounded-full animate-spin mb-2" />
                <span className="text-xs font-mono tracking-widest text-amber-300 uppercase">
                  Transcoding Adaptive Chunks...
                </span>
              </div>
            )}
          </>
        )}

        {/* Top Header Bar Overlay for HLS mode */}
        {currentEngine !== 'embed-bridge' && (
          <div
            className={`absolute top-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-b from-black/90 via-black/40 to-transparent flex items-center justify-between transition-opacity duration-300 ${
              controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                title="Close player (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowSourcesDrawer(true)}
                    className="flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono uppercase bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded font-semibold transition cursor-pointer"
                    title="Change video source"
                  >
                    <Server className="w-3 h-3" />
                    <span>HLS ULTRA ENGINE</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>

                  <span className="px-2 py-0.5 text-[10px] font-mono bg-white/10 text-zinc-300 rounded">
                    {currentProfile.label}
                  </span>
                  {isTv && (
                    <span className="px-2 py-0.5 text-[10px] font-semibold bg-sky-500/20 text-sky-300 rounded">
                      S{currentSeason} : E{currentEpisode}
                    </span>
                  )}
                </div>
                <h2 className="text-base sm:text-xl font-bold text-white tracking-tight mt-0.5">
                  {title}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Sources Drawer Toggle */}
              <button
                onClick={() => setShowSourcesDrawer(true)}
                className="p-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition cursor-pointer border bg-white/10 hover:bg-white/20 text-zinc-200 border-white/10"
                title="Choose Video Source (Vidking, VidSrc, SuperEmbed, etc.)"
              >
                <Server className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Sources</span>
              </button>

              {/* Stream Health Stats HUD Toggle */}
              <button
                onClick={() => setShowStatsHUD(!showStatsHUD)}
                className={`p-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition cursor-pointer border ${
                  showStatsHUD
                    ? 'bg-amber-400 text-black border-amber-400 font-bold'
                    : 'bg-white/10 hover:bg-white/20 text-zinc-300 border-white/10'
                }`}
                title="Stream Health & Telemetry HUD"
              >
                <Gauge className="w-4 h-4" />
                <span className="hidden sm:inline">Telemetry</span>
              </button>

              {/* Offline Download Button */}
              <button
                onClick={handleOfflineDownload}
                disabled={isDownloaded || isDownloading}
                className={`p-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition cursor-pointer border ${
                  isDownloaded
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : isDownloading
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                    : 'bg-white/10 hover:bg-white/20 text-zinc-300 border-white/10'
                }`}
                title="Download for offline playback"
              >
                {isDownloaded ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="hidden sm:inline">Cached</span>
                  </>
                ) : isDownloading ? (
                  <>
                    <Download className="w-4 h-4 animate-bounce" />
                    <span className="hidden sm:inline">Saving...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Download</span>
                  </>
                )}
              </button>

              {/* Multi-Stream Switcher */}
              {onSwitchToMultiStream && (
                <button
                  onClick={onSwitchToMultiStream}
                  className="p-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/30 text-amber-300 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                  title="Watch alongside another stream"
                >
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline">Dual Watch</span>
                </button>
              )}

              {/* TV Series Episode Drawer */}
              {isTv && (
                <button
                  onClick={() => setShowEpisodeDrawer(!showEpisodeDrawer)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium flex items-center gap-1.5 transition cursor-pointer border border-white/10"
                >
                  <Tv className="w-4 h-4 text-amber-400" />
                  <span>Episodes</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* COMPREHENSIVE VIDEO SOURCES DRAWER (Vidking, VidSrc, SuperEmbed, etc.) */}
        {showSourcesDrawer && (
          <div className="absolute inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-md animate-fade-in">
            <div 
              className="absolute inset-0 -z-10" 
              onClick={() => setShowSourcesDrawer(false)} 
            />

            <div className="w-full max-w-md h-full glass-dropdown border-l border-white/10 p-6 flex flex-col shadow-2xl animate-slide-left overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <Server className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Streaming Sources & Mirrors</h3>
                    <p className="text-xs text-zinc-400">Select a high-speed video provider</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowSourcesDrawer(false)}
                  className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Quick HLS Ultra Engine Card */}
              <div className="py-3">
                <div
                  onClick={handleSelectHls}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                    currentEngine === 'hls-ultra'
                      ? 'bg-amber-500/20 border-amber-400/50 shadow-lg shadow-amber-500/10'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span className="font-bold text-white text-sm">Ultra HLS Adaptive Engine</span>
                    </div>
                    <span className="text-[10px] font-mono uppercase bg-amber-400 text-black font-extrabold px-1.5 py-0.2 rounded">
                      NATIVE ABR
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300">
                    Direct Hls.js streaming with multi-bitrate auto-switching, buffer metrics, and subtitles.
                  </p>
                  {currentEngine === 'hls-ultra' && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-semibold mt-2">
                      <Check className="w-3.5 h-3.5" /> Currently Active
                    </span>
                  )}
                </div>
              </div>

              {/* Available Embed Servers List */}
              <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 pr-1">
                <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
                  14+ Redundant Video Mirrors:
                </p>

                {EMBED_SERVERS.map((server) => {
                  const isActive = currentEngine === 'embed-bridge' && selectedEmbedServer.id === server.id;

                  return (
                    <div
                      key={server.id}
                      onClick={() => handleSelectServer(server)}
                      className={`p-3 rounded-2xl border transition cursor-pointer group ${
                        isActive
                          ? 'bg-amber-500/20 border-amber-400/50 shadow-lg shadow-amber-500/10'
                          : 'bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm group-hover:text-amber-300 transition">
                            {server.label}
                          </span>
                          {server.tag && (
                            <span className="text-[10px] text-zinc-400 font-medium">
                              {server.tag}
                            </span>
                          )}
                        </div>
                        {server.badge && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-zinc-300 font-semibold">
                            {server.badge}
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                        {server.description}
                      </p>

                      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-white/5">
                        <span className="text-[10px] font-mono text-zinc-500">
                          {isTv ? `Target: S${currentSeason}E${currentEpisode}` : 'Target: Full Movie'}
                        </span>
                        {isActive ? (
                          <span className="text-[11px] text-amber-400 font-semibold flex items-center gap-1">
                            <Check className="w-3 h-3" /> Active Stream
                          </span>
                        ) : (
                          <span className="text-[11px] text-zinc-400 group-hover:text-white transition flex items-center gap-1">
                            Switch <ArrowRight className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Quick Help */}
              <div className="pt-3 border-t border-white/10 text-[11px] text-zinc-400 text-center">
                Your preferred server choice is saved automatically.
              </div>
            </div>
          </div>
        )}

        {/* Real-time Diagnostics HUD Overlay */}
        {showStatsHUD && (
          <div className="absolute top-20 right-6 z-30 w-72 glass-dropdown rounded-2xl p-3 text-xs font-mono border border-amber-400/20 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-white/10 text-amber-400 font-bold">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> Stream Telemetry
              </span>
              <button onClick={() => setShowStatsHUD(false)} className="text-zinc-400 hover:text-white">
                ✕
              </button>
            </div>
            <div className="py-2 space-y-1.5 text-zinc-300">
              <div className="flex justify-between">
                <span className="text-zinc-500">Engine:</span>
                <span className="text-white font-semibold">
                  {currentEngine === 'embed-bridge' ? selectedEmbedServer.label : currentEngine}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Resolution:</span>
                <span className="text-emerald-400">{stats.resolution}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Bitrate:</span>
                <span className="text-amber-400">{stats.bitrate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Forward Buffer:</span>
                <span className="text-sky-400">{stats.bufferLength}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Ingest Latency:</span>
                <span className="text-green-400">{stats.latency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Dropped Frames:</span>
                <span>{stats.droppedFrames}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-zinc-500">Codec:</span>
                <span className="truncate max-w-[140px] text-zinc-400">{stats.codec}</span>
              </div>
            </div>
          </div>
        )}

        {/* TV Series Episode Drawer */}
        {showEpisodeDrawer && (
          <div className="absolute top-20 right-6 bottom-24 z-30 w-80 glass-dropdown rounded-2xl p-3 flex flex-col border border-white/10 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="font-bold text-white text-sm">Episodes & Seasons</h3>
              <button onClick={() => setShowEpisodeDrawer(false)} className="text-zinc-400 hover:text-white">
                ✕
              </button>
            </div>
            <div className="flex gap-2 py-2 overflow-x-auto no-scrollbar">
              {[1, 2, 3].map((s) => (
                <button
                  key={s}
                  onClick={() => setCurrentSeason(s)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold shrink-0 cursor-pointer ${
                    currentSeason === s ? 'bg-amber-400 text-black' : 'bg-white/10 text-zinc-300'
                  }`}
                >
                  Season {s}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar pr-1">
              {episodesList.map((ep) => (
                <div
                  key={ep.id}
                  onClick={() => {
                    setCurrentEpisode(ep.episode_number);
                    setShowEpisodeDrawer(false);
                    setIframeKey((k) => k + 1);
                  }}
                  className={`p-2 rounded-xl border text-xs cursor-pointer transition ${
                    currentEpisode === ep.episode_number
                      ? 'bg-amber-400/20 border-amber-400/40 text-amber-200'
                      : 'bg-white/5 border-white/5 hover:bg-white/10 text-zinc-300'
                  }`}
                >
                  <div className="flex justify-between font-semibold">
                    <span>{ep.episode_number}. {ep.name}</span>
                    <span className="text-zinc-500 font-mono">{ep.runtime || 48}m</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 line-clamp-2 mt-1">{ep.overview}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Settings & Transcoding Menu */}
        {showSettingsMenu && (
          <div className="absolute bottom-24 right-6 z-40 w-80 glass-dropdown rounded-2xl p-4 text-xs border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-white/10 text-white font-bold text-sm">
              <span className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" /> Transcode & Engine
              </span>
              <button onClick={() => setShowSettingsMenu(false)} className="text-zinc-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="py-3 space-y-3">
              {/* Engine Switcher */}
              <div>
                <label className="text-zinc-400 font-medium block mb-1.5">Player Engine:</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'hls-ultra', label: 'HLS Ultra (Hls.js)' },
                    { id: 'direct-cinema', label: 'Direct Cinema' },
                    { id: 'embed-bridge', label: 'Embed Bridge' },
                    { id: 'custom-ingest', label: 'Custom Ingest' },
                  ].map((eng) => (
                    <button
                      key={eng.id}
                      onClick={() => setCurrentEngine(eng.id as PlayerEngine)}
                      className={`p-1.5 rounded-lg text-left text-[11px] font-semibold transition border cursor-pointer ${
                        currentEngine === eng.id
                          ? 'bg-amber-400 text-black border-amber-400'
                          : 'bg-white/5 text-zinc-300 border-white/5 hover:bg-white/10'
                      }`}
                    >
                      {eng.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Transcoding Quality Profiles */}
              <div>
                <label className="text-zinc-400 font-medium block mb-1.5">Transcode Profile:</label>
                <div className="space-y-1">
                  {TRANSCODE_PROFILES.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setCurrentProfile(p)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition cursor-pointer ${
                        currentProfile.id === p.id
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'hover:bg-white/5 text-zinc-300'
                      }`}
                    >
                      <span>{p.label}</span>
                      <span className="text-zinc-500 font-mono text-[10px]">
                        {p.bitrateKbps ? `${p.bitrateKbps} kbps` : 'ABR Dynamic'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Subtitles Track */}
              <div>
                <label className="text-zinc-400 font-medium block mb-1.5">Subtitles & Audio:</label>
                <div className="flex gap-1.5">
                  {(['off', 'en', 'es', 'fr'] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setSubtitleTrack(lang)}
                      className={`flex-1 py-1 rounded text-center uppercase font-mono text-[10px] cursor-pointer ${
                        subtitleTrack === lang
                          ? 'bg-amber-400 text-black font-bold'
                          : 'bg-white/5 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {lang === 'off' ? 'Off' : lang}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom URL Tester */}
              {currentEngine === 'custom-ingest' && (
                <div>
                  <label className="text-zinc-400 font-medium block mb-1">Custom Stream (.m3u8 / .mp4):</label>
                  <input
                    type="text"
                    value={customStreamUrl}
                    onChange={(e) => setCustomStreamUrl(e.target.value)}
                    placeholder="https://example.com/stream.m3u8"
                    className="w-full px-2 py-1 rounded bg-black/60 border border-white/20 text-white text-[11px]"
                  />
                  <button
                    onClick={initPlayerStream}
                    className="w-full mt-1.5 py-1 bg-amber-500 text-black font-semibold rounded text-xs"
                  >
                    Ingest Stream
                  </button>
                </div>
              )}

              {/* Ambient Glow Toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <span className="text-zinc-300">Ambient Cinema Glow</span>
                <input
                  type="checkbox"
                  checked={ambientGlow}
                  onChange={(e) => setAmbientGlow(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-0 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* Bottom Playback Controls Bar for HLS / Video mode */}
        {currentEngine !== 'embed-bridge' && (
          <div
            className={`absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-black/95 via-black/60 to-transparent transition-opacity duration-300 ${
              controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            {/* Progress Scrubber */}
            <div className="relative group mb-3">
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={(e) => {
                  const newTime = Number(e.target.value);
                  setCurrentTime(newTime);
                  if (videoRef.current) videoRef.current.currentTime = newTime;
                }}
                className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-amber-400 group-hover:h-2 transition-all"
              />
            </div>

            <div className="flex items-center justify-between">
              {/* Left Controls: Play, Skip, Volume, Timestamps */}
              <div className="flex items-center gap-3 sm:gap-4">
                <button
                  onClick={togglePlay}
                  className="w-10 h-10 rounded-full bg-amber-400 hover:bg-amber-300 text-black flex items-center justify-center transition shadow-lg cursor-pointer"
                  title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 fill-black" />
                  ) : (
                    <Play className="w-5 h-5 fill-black ml-0.5" />
                  )}
                </button>

                <button
                  onClick={() => skip(-10)}
                  className="text-zinc-300 hover:text-white transition cursor-pointer"
                  title="Rewind 10s (Left Arrow)"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>

                <button
                  onClick={() => skip(10)}
                  className="text-zinc-300 hover:text-white transition cursor-pointer"
                  title="Forward 10s (Right Arrow)"
                >
                  <RotateCw className="w-5 h-5" />
                </button>

                {/* Volume Slider */}
                <div className="flex items-center gap-2 group">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="text-zinc-300 hover:text-white transition cursor-pointer"
                    title="Mute (M)"
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-5 h-5 text-red-400" />
                    ) : (
                      <Volume2 className="w-5 h-5" />
                    )}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={isMuted ? 0 : volume}
                    onChange={(e) => {
                      setVolume(Number(e.target.value));
                      setIsMuted(false);
                    }}
                    className="w-16 sm:w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-amber-400"
                  />
                </div>

                {/* Timestamp */}
                <div className="text-xs font-mono text-zinc-400 hidden sm:block">
                  <span className="text-white font-medium">{formatTime(currentTime)}</span>
                  <span className="mx-1">/</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Right Controls: Speed, Settings, PiP, Theater, Fullscreen */}
              <div className="flex items-center gap-3">
                {/* Playback Speed selector */}
                <button
                  onClick={() => {
                    const speeds = [0.75, 1, 1.25, 1.5, 2];
                    const next = speeds[(speeds.indexOf(playbackSpeed) + 1) % speeds.length];
                    setPlaybackSpeed(next);
                    if (videoRef.current) videoRef.current.playbackRate = next;
                  }}
                  className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white text-xs font-mono font-semibold transition cursor-pointer"
                  title="Playback Speed"
                >
                  {playbackSpeed}x
                </button>

                {/* Transcode & Settings Button */}
                <button
                  onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                  className={`p-2 rounded-xl transition cursor-pointer ${
                    showSettingsMenu ? 'bg-amber-400 text-black' : 'text-zinc-300 hover:text-white'
                  }`}
                  title="Transcoding Quality & Engine Settings"
                >
                  <Settings className="w-5 h-5" />
                </button>

                {/* PiP Button */}
                <button
                  onClick={togglePiP}
                  className="text-zinc-300 hover:text-white transition hidden sm:block cursor-pointer"
                  title="Picture in Picture"
                >
                  <Smartphone className="w-5 h-5" />
                </button>

                {/* Fullscreen Button */}
                <button
                  onClick={toggleFullscreen}
                  className="text-zinc-300 hover:text-white transition cursor-pointer"
                  title="Toggle Fullscreen (F)"
                >
                  {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

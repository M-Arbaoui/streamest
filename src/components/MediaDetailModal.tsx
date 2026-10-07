import React, { useState, useEffect } from 'react';
import { 
  X, 
  Play, 
  Plus, 
  Check, 
  Download, 
  Star, 
  Clock, 
  Calendar, 
  Film, 
  Tv, 
  Layers, 
  ShieldCheck,
  Sparkles,
  ChevronDown,
  Server,
  ArrowRight
} from 'lucide-react';
import { MediaItem, Episode } from '../types';
import { TMDBService, getImageUrl } from '../services/tmdb';
import { authService } from '../services/authService';
import { offlineService } from '../services/offlineCache';
import { 
  TRANSCODE_PROFILES, 
  EMBED_SERVERS, 
  getSavedServerId, 
  savePreferredServerId,
  EmbedServer 
} from '../services/hlsStreams';

interface MediaDetailModalProps {
  media: MediaItem | null;
  onClose: () => void;
  onPlay: (media: MediaItem, season?: number, episode?: number, serverId?: string) => void;
  onSelectSimilar: (media: MediaItem) => void;
}

export const MediaDetailModal: React.FC<MediaDetailModalProps> = ({
  media,
  onClose,
  onPlay,
  onSelectSimilar,
}) => {
  const [details, setDetails] = useState<MediaItem | null>(null);
  const [activeTab, setActiveTab] = useState<'sources' | 'episodes' | 'specs' | 'similar'>('sources');
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedServerId, setSelectedServerId] = useState<string>(getSavedServerId());

  useEffect(() => {
    if (!media) return;

    setLoading(true);
    setInWatchlist(authService.isInWatchlist(media.id));
    setIsDownloaded(offlineService.isDownloaded(media.id));

    TMDBService.getDetails(media.id, media.media_type || 'movie')
      .then((full) => {
        setDetails(full);
        setLoading(false);
      })
      .catch(() => {
        setDetails(media);
        setLoading(false);
      });
  }, [media]);

  // Load episodes if TV
  useEffect(() => {
    if (!media || media.media_type !== 'tv') return;
    TMDBService.getEpisodes(media.id, selectedSeason).then((eps) => {
      setEpisodes(eps);
    });
  }, [media, selectedSeason]);

  if (!media) return null;

  const currentItem = details || media;
  const isTv = currentItem.media_type === 'tv';
  const title = currentItem.title || currentItem.name || 'Cinema Title';
  const year = (currentItem.release_date || currentItem.first_air_date || '').split('-')[0];

  const handleToggleWatchlist = () => {
    const added = authService.toggleWatchlist(media.id);
    setInWatchlist(added);
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    await offlineService.startDownload(
      media.id,
      title,
      media.media_type || 'movie',
      media.poster_path,
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
      isTv ? selectedSeason : undefined,
      isTv ? 1 : undefined
    );
    setIsDownloading(false);
    setIsDownloaded(true);
  };

  const currentServerObj = EMBED_SERVERS.find((s) => s.id === selectedServerId);
  const currentServerLabel = selectedServerId === 'hls-ultra' ? 'Ultra HLS' : (currentServerObj?.label || 'Vidking');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl animate-fade-in overflow-y-auto">
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      <div className="relative w-full max-w-4xl glass-dropdown rounded-3xl border border-white/10 overflow-hidden shadow-2xl animate-scale-up my-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition cursor-pointer border border-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Backdrop Header */}
        <div className="relative h-64 sm:h-96 w-full overflow-hidden bg-zinc-900">
          <img
            src={getImageUrl(currentItem.backdrop_path || currentItem.poster_path, 'original')}
            alt={title}
            className="w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d12] via-[#0d0d12]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0d0d12] via-transparent to-transparent hidden sm:block" />

          {/* Title & Actions Info Overlay */}
          <div className="absolute bottom-6 left-6 right-6">
            {/* Zero-Pill Unboxed Metadata Line */}
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-zinc-300 font-normal tracking-wide mb-2.5">
              <span className="text-amber-400 font-medium">4K Master Transfer</span>
              <span aria-hidden="true" className="text-zinc-500">·</span>
              <span>Dolby Atmos</span>
              <span aria-hidden="true" className="text-zinc-500">·</span>
              <span>{isTv ? 'Television Series' : 'Feature Film'}</span>
              {year && (
                <>
                  <span aria-hidden="true" className="text-zinc-500">·</span>
                  <span>{year}</span>
                </>
              )}
              {currentItem.vote_average > 0 && (
                <>
                  <span aria-hidden="true" className="text-zinc-500">·</span>
                  <span className="text-amber-300 font-mono">★ {currentItem.vote_average.toFixed(1)}</span>
                </>
              )}
            </div>

            <h1 className="text-3xl sm:text-5xl font-serif text-white tracking-tight drop-shadow-md">
              {title}
            </h1>
            {currentItem.tagline && (
              <p className="text-xs sm:text-sm text-zinc-300/80 italic mt-1 font-serif line-clamp-1">
                "{currentItem.tagline}"
              </p>
            )}

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <button
                onClick={() => {
                  onPlay(currentItem, isTv ? selectedSeason : undefined, isTv ? 1 : undefined, selectedServerId);
                  onClose();
                }}
                className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-semibold text-sm flex items-center gap-2 shadow-lg shadow-amber-400/20 transition cursor-pointer"
              >
                <Play className="w-4 h-4 fill-black" />
                Watch via {currentServerLabel}
              </button>

              <button
                onClick={handleToggleWatchlist}
                className={`py-2 px-4 rounded-xl border transition flex items-center gap-2 text-xs font-medium cursor-pointer ${
                  inWatchlist
                    ? 'bg-amber-400/10 border-amber-400/50 text-amber-300'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 text-zinc-200'
                }`}
              >
                {inWatchlist ? <Check className="w-3.5 h-3.5 text-amber-400" /> : <Plus className="w-3.5 h-3.5" />}
                <span>{inWatchlist ? 'In Watchlist' : 'Add to List'}</span>
              </button>

              <button
                onClick={handleDownload}
                disabled={isDownloaded || isDownloading}
                className={`py-2 px-4 rounded-xl border transition flex items-center gap-2 text-xs font-medium cursor-pointer ${
                  isDownloaded
                    ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                    : isDownloading
                    ? 'bg-amber-500/20 border-amber-500/30 text-amber-300'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 text-zinc-200'
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isDownloaded ? 'Saved in Vault' : isDownloading ? 'Caching...' : 'Download Offline'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Overview & Body */}
        <div className="p-6">
          <div className="mb-5">
            <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold mb-2">
              Synopsis & Narrative
            </h3>
            <p className="text-zinc-300 text-sm leading-relaxed max-w-3xl">
              {currentItem.overview || 'No synopsis provided for this title.'}
            </p>
          </div>

          {/* Quick Sources Selector Rail */}
          <div className="mb-5 p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-amber-400" />
                Select Streaming Source:
              </span>
              <span className="text-[11px] text-zinc-400 font-mono">
                Active: <strong className="text-amber-300">{currentServerLabel}</strong>
              </span>
            </div>

            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {/* Ultra HLS Pill */}
              <button
                onClick={() => {
                  setSelectedServerId('hls-ultra');
                  savePreferredServerId('hls-ultra');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition flex items-center gap-1.5 cursor-pointer border ${
                  selectedServerId === 'hls-ultra'
                    ? 'bg-amber-400 text-black border-amber-400 shadow-md'
                    : 'bg-white/5 hover:bg-white/10 text-zinc-300 border-white/10'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ultra HLS</span>
              </button>

              {/* Embed Servers */}
              {EMBED_SERVERS.map((srv) => {
                const isSelected = selectedServerId === srv.id;
                return (
                  <button
                    key={srv.id}
                    onClick={() => {
                      setSelectedServerId(srv.id);
                      savePreferredServerId(srv.id);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition flex items-center gap-1.5 cursor-pointer border ${
                      isSelected
                        ? 'bg-amber-400 text-black border-amber-400 shadow-md font-bold'
                        : 'bg-white/5 hover:bg-white/10 text-zinc-300 border-white/10'
                    }`}
                  >
                    <span>{srv.label}</span>
                    {srv.badge && (
                      <span className={`text-[9px] px-1 rounded ${isSelected ? 'bg-black/20 text-black' : 'bg-white/10 text-zinc-400'}`}>
                        {srv.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-white/10 mb-4 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('sources')}
              className={`py-2 px-4 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'sources'
                  ? 'border-amber-400 text-amber-300'
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              All Video Sources (14+)
            </button>
            {isTv && (
              <button
                onClick={() => setActiveTab('episodes')}
                className={`py-2 px-4 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'episodes'
                    ? 'border-amber-400 text-amber-300'
                    : 'border-transparent text-zinc-400 hover:text-white'
                }`}
              >
                <Tv className="w-3.5 h-3.5" />
                Seasons & Episodes
              </button>
            )}
            <button
              onClick={() => setActiveTab('specs')}
              className={`py-2 px-4 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'specs'
                  ? 'border-amber-400 text-amber-300'
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Transcoding Specs
            </button>
          </div>

          {/* Video Sources Tab */}
          {activeTab === 'sources' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto no-scrollbar pr-1">
              {/* Native HLS */}
              <div
                onClick={() => {
                  setSelectedServerId('hls-ultra');
                  savePreferredServerId('hls-ultra');
                  onPlay(currentItem, isTv ? selectedSeason : undefined, isTv ? 1 : undefined, 'hls-ultra');
                  onClose();
                }}
                className={`p-3.5 rounded-2xl border transition cursor-pointer flex flex-col justify-between group ${
                  selectedServerId === 'hls-ultra'
                    ? 'bg-amber-500/20 border-amber-400/50'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white text-sm group-hover:text-amber-300 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      Ultra HLS Adaptive Engine
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-400 text-black font-extrabold">
                      NATIVE ABR
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Custom native Hls.js pipeline with automatic bitrate scaling, buffer diagnostics, and subtitle overlay.
                  </p>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5 text-xs text-amber-400 font-semibold">
                  <span>Direct Stream</span>
                  <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Play Now <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>

              {/* Embed Servers */}
              {EMBED_SERVERS.map((srv) => (
                <div
                  key={srv.id}
                  onClick={() => {
                    setSelectedServerId(srv.id);
                    savePreferredServerId(srv.id);
                    onPlay(currentItem, isTv ? selectedSeason : undefined, isTv ? 1 : undefined, srv.id);
                    onClose();
                  }}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer flex flex-col justify-between group ${
                    selectedServerId === srv.id
                      ? 'bg-amber-500/20 border-amber-400/50'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-white text-sm group-hover:text-amber-300">
                        {srv.label}
                      </span>
                      {srv.badge && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-zinc-300 font-semibold">
                          {srv.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      {srv.description}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5 text-xs text-zinc-400 group-hover:text-amber-300 font-semibold">
                    <span>{srv.tag}</span>
                    <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Play via {srv.label} <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Episodes Tab */}
          {isTv && activeTab === 'episodes' && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs text-zinc-400">Select Season:</span>
                <select
                  value={selectedSeason}
                  onChange={(e) => setSelectedSeason(Number(e.target.value))}
                  className="bg-black/60 border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white"
                >
                  {[1, 2, 3].map((s) => (
                    <option key={s} value={s}>
                      Season {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto no-scrollbar pr-1">
                {episodes.map((ep) => (
                  <div
                    key={ep.id}
                    onClick={() => {
                      onPlay(currentItem, selectedSeason, ep.episode_number, selectedServerId);
                      onClose();
                    }}
                    className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-amber-400/30 transition flex flex-col justify-between group cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white group-hover:text-amber-300 transition">
                        E{ep.episode_number}. {ep.name}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400">{ep.runtime || 50}m</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                      {ep.overview}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Specs & Transcoding Tab */}
          {activeTab === 'specs' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {TRANSCODE_PROFILES.map((p) => (
                <div key={p.id} className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-white">{p.label}</span>
                    <span className="text-amber-400 font-mono text-[10px]">
                      {p.bitrateKbps ? `${p.bitrateKbps} kbps` : 'Dynamic ABR'}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-400 space-y-0.5">
                    <p>Codec: {p.codec}</p>
                    <p>Resolution: {p.resolution} @ {p.fps}fps</p>
                    <p>Audio: AAC / Opus {p.audioBitrateKbps} kbps</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


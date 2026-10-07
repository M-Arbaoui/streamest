import React, { useState, useEffect } from 'react';
import { Play, Info, Plus, Check, ChevronDown, Server } from 'lucide-react';
import { MediaItem } from '../types';
import { getImageUrl } from '../services/tmdb';
import { authService } from '../services/authService';
import { EMBED_SERVERS, getSavedServerId, savePreferredServerId } from '../services/hlsStreams';

interface HeroBannerProps {
  items: MediaItem[];
  onPlay: (item: MediaItem, season?: number, episode?: number, serverId?: string) => void;
  onOpenDetails: (item: MediaItem) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ items, onPlay, onOpenDetails }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [showServerMenu, setShowServerMenu] = useState(false);
  const [selectedServerId, setSelectedServerId] = useState<string>(getSavedServerId());

  const heroItem = items[currentIndex] || items[0];

  useEffect(() => {
    if (!heroItem) return;
    setInWatchlist(authService.isInWatchlist(heroItem.id));
  }, [heroItem]);

  // Subtle crossfade rotation every 10 seconds
  useEffect(() => {
    if (items.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % Math.min(items.length, 5));
    }, 10000);
    return () => clearInterval(interval);
  }, [items.length]);

  if (!heroItem) return null;

  const title = heroItem.title || heroItem.name || 'Featured Film';
  const year = (heroItem.release_date || heroItem.first_air_date || '').split('-')[0];

  const handleToggleWatchlist = () => {
    const added = authService.toggleWatchlist(heroItem.id);
    setInWatchlist(added);
  };

  const handleSelectServer = (srvId: string) => {
    savePreferredServerId(srvId);
    setSelectedServerId(srvId);
    setShowServerMenu(false);
    onPlay(heroItem, 1, 1, srvId);
  };

  // Use high-resolution generated cinematic asset for featured slot 0, else TMDB backdrop
  const backdropSrc = currentIndex === 0
    ? '/src/assets/images/hero_cinema_masterpiece_1791332114706.jpg'
    : getImageUrl(heroItem.backdrop_path, 'original');

  const currentServerObj = EMBED_SERVERS.find((s) => s.id === selectedServerId);
  const serverShortLabel = selectedServerId === 'hls-ultra' ? 'HLS Master' : (currentServerObj?.label?.split(' ')[0] || 'Vidking');

  return (
    <div className="relative h-[82vh] sm:h-[88vh] w-full overflow-hidden bg-[#060608] select-none">
      {/* Background Image with Measured Scrim */}
      <div className="absolute inset-0">
        <img
          src={backdropSrc}
          alt={title}
          className="w-full h-full object-cover object-center scale-[1.01] transition-transform duration-1000 ease-out"
          referrerPolicy="no-referrer"
        />
        {/* Measured Scrims (Anti-Slop contrast rules) */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#060608] via-[#060608]/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#060608]/95 via-[#060608]/50 to-transparent w-full md:w-3/4" />
      </div>

      {/* Hero Narrative & Controls */}
      <div className="relative h-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 flex flex-col justify-end pb-16 sm:pb-24 z-20">
        <div className="max-w-2xl">
          {/* Zero-Pill Unboxed Metadata Line with Typographic Separators */}
          <div className="flex items-center gap-2 text-xs sm:text-sm text-zinc-300 font-normal tracking-wide mb-3">
            <span className="text-amber-400 font-medium">Curated Spotlight</span>
            <span aria-hidden="true" className="text-zinc-600">·</span>
            {year && <span>{year}</span>}
            <span aria-hidden="true" className="text-zinc-600">·</span>
            <span>4K Master</span>
            <span aria-hidden="true" className="text-zinc-600">·</span>
            <span>Dolby Atmos</span>
            {heroItem.vote_average > 0 && (
              <>
                <span aria-hidden="true" className="text-zinc-600">·</span>
                <span className="text-amber-300 font-mono">★ {heroItem.vote_average.toFixed(1)}</span>
              </>
            )}
          </div>

          {/* Majestic Serif Title with Balance */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif font-normal text-white tracking-tight leading-[1.03] mb-3 text-balance drop-shadow-lg">
            {title}
          </h1>

          {/* Narrative Overview */}
          <p className="text-sm sm:text-base text-zinc-300/90 font-light leading-relaxed line-clamp-3 max-w-xl mb-7">
            {heroItem.overview}
          </p>

          {/* Action Points */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Split Play / Source Selector */}
            <div className="relative inline-flex">
              <button
                onClick={() => onPlay(heroItem, 1, 1, selectedServerId)}
                className="py-2.5 px-6 rounded-l-xl bg-amber-400 hover:bg-amber-300 text-black font-semibold text-sm transition-colors cursor-pointer flex items-center gap-2 shadow-lg shadow-amber-400/15"
              >
                <Play className="w-4 h-4 fill-black ml-0.5" />
                Watch via {serverShortLabel}
              </button>
              <button
                onClick={() => setShowServerMenu(!showServerMenu)}
                className="py-2.5 px-3 rounded-r-xl bg-amber-400/90 hover:bg-amber-300 text-black border-l border-black/15 transition-colors cursor-pointer flex items-center justify-center"
                title="Choose streaming server"
                aria-label="Choose streaming server"
              >
                <ChevronDown className="w-4 h-4" />
              </button>

              {/* Server Quick Picker Popover */}
              {showServerMenu && (
                <div 
                  className="absolute left-0 bottom-full mb-2 w-72 glass-dropdown rounded-2xl p-2 z-50 text-xs shadow-2xl animate-fade-in"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
                    <span className="font-semibold text-white">Select Stream Node</span>
                    <span className="text-[10px] text-zinc-400 font-mono">Fastest first</span>
                  </div>
                  <div className="py-1 max-h-56 overflow-y-auto no-scrollbar">
                    <button
                      onClick={() => handleSelectServer('vidking')}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition cursor-pointer ${
                        selectedServerId === 'vidking' ? 'bg-amber-400/15 text-amber-300' : 'text-zinc-200 hover:bg-white/10'
                      }`}
                    >
                      <div>
                        <p className="font-medium">Vidking Pro</p>
                        <p className="text-[10px] text-zinc-400">Fastest CDN · Ad-minimal</p>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-mono">24ms</span>
                    </button>

                    <button
                      onClick={() => handleSelectServer('vidsrc_xyz')}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition cursor-pointer ${
                        selectedServerId === 'vidsrc_xyz' ? 'bg-amber-400/15 text-amber-300' : 'text-zinc-200 hover:bg-white/10'
                      }`}
                    >
                      <div>
                        <p className="font-medium">VidSrc XYZ</p>
                        <p className="text-[10px] text-zinc-400">Official VidSrc mirror</p>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-mono">31ms</span>
                    </button>

                    <button
                      onClick={() => handleSelectServer('vidlink')}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition cursor-pointer ${
                        selectedServerId === 'vidlink' ? 'bg-amber-400/15 text-amber-300' : 'text-zinc-200 hover:bg-white/10'
                      }`}
                    >
                      <div>
                        <p className="font-medium">VidLink PRO</p>
                        <p className="text-[10px] text-zinc-400">Next-gen cinema player</p>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-mono">35ms</span>
                    </button>

                    <button
                      onClick={() => handleSelectServer('hls-ultra')}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition cursor-pointer ${
                        selectedServerId === 'hls-ultra' ? 'bg-amber-400/15 text-amber-300' : 'text-zinc-200 hover:bg-white/10'
                      }`}
                    >
                      <div>
                        <p className="font-medium">HLS Master Stream</p>
                        <p className="text-[10px] text-zinc-400">Adaptive multi-bitrate</p>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-mono">18ms</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => onOpenDetails(heroItem)}
              className="py-2.5 px-5 rounded-xl text-zinc-200 hover:text-white hover:bg-white/10 text-sm font-medium transition-colors cursor-pointer flex items-center gap-2 border border-white/10"
            >
              <Info className="w-4 h-4 text-zinc-400" />
              Overview
            </button>

            <button
              onClick={handleToggleWatchlist}
              className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                inWatchlist
                  ? 'border-amber-400/50 bg-amber-400/10 text-amber-300'
                  : 'border-white/10 text-zinc-300 hover:text-white hover:bg-white/10'
              }`}
              title={inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
              aria-label="Toggle Watchlist"
            >
              {inWatchlist ? <Check className="w-4 h-4 text-amber-400" /> : <Plus className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Interactive Spotlight Thumbnail Switcher Dock */}
        <div className="hidden md:flex absolute bottom-8 right-6 sm:right-12 items-center gap-3 z-30">
          <span className="text-[11px] text-zinc-500 font-light mr-1">Spotlight Queue:</span>
          {items.slice(0, 4).map((item, idx) => {
            const isSelected = idx === currentIndex;
            const itemTitle = item.title || item.name || 'Title';
            return (
              <button
                key={item.id}
                onClick={() => setCurrentIndex(idx)}
                className={`group relative flex items-center gap-2.5 p-1.5 rounded-xl border transition-all cursor-pointer text-left ${
                  isSelected
                    ? 'bg-white/15 border-amber-400/60 shadow-lg'
                    : 'bg-black/50 border-white/10 hover:border-white/20 hover:bg-black/70'
                }`}
              >
                <img
                  src={getImageUrl(item.poster_path, 'w300')}
                  alt={itemTitle}
                  className="w-8 h-11 object-cover rounded-md"
                />
                <div className="pr-2 max-w-[110px]">
                  <p className="text-[11px] font-medium text-white truncate">
                    {itemTitle}
                  </p>
                  <p className="text-[9px] text-zinc-400 font-mono">
                    {item.media_type === 'tv' ? 'Series' : 'Film'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};


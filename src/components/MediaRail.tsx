import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Play, Plus, Check, ChevronDown, Server } from 'lucide-react';
import { MediaItem } from '../types';
import { getImageUrl } from '../services/tmdb';
import { authService } from '../services/authService';
import { EMBED_SERVERS, getSavedServerId } from '../services/hlsStreams';

interface MediaRailProps {
  title: string;
  subtitle?: string;
  items: MediaItem[];
  progressMap?: Record<number, number>; // mediaId -> percentage (0-100)
  onPlay: (item: MediaItem, season?: number, episode?: number, serverId?: string) => void;
  onOpenDetails: (item: MediaItem) => void;
}

export const MediaRail: React.FC<MediaRailProps> = ({
  title,
  subtitle,
  items,
  progressMap = {},
  onPlay,
  onOpenDetails,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeServerMenuId, setActiveServerMenuId] = useState<number | null>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = direction === 'left' ? -550 : 550;
    scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
  };

  if (!items || items.length === 0) return null;

  return (
    <section className="py-6 select-none relative group/rail">
      {/* Rail Header with Clean Typography */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 mb-3.5 flex items-baseline justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-serif text-white tracking-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-zinc-400 mt-0.5 font-light">
              {subtitle}
            </p>
          )}
        </div>

        {/* Quiet Scroll Navigation */}
        <div className="hidden sm:flex items-center gap-2 opacity-0 group-hover/rail:opacity-100 transition-opacity">
          <button
            onClick={() => scroll('left')}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Scrolling Items */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto no-scrollbar px-6 sm:px-8 lg:px-12 scroll-smooth"
      >
        {items.map((item) => {
          const itemTitle = item.title || item.name || 'Untitled';
          const year = (item.release_date || item.first_air_date || '').split('-')[0];
          const progress = progressMap[item.id] || 0;
          const isInWatchlist = authService.isInWatchlist(item.id);

          return (
            <div
              key={`${item.media_type || 'm'}-${item.id}`}
              onClick={() => onOpenDetails(item)}
              className="group/card relative flex-shrink-0 w-36 sm:w-44 lg:w-48 cursor-pointer transition-transform duration-300"
            >
              {/* Poster Image (Zero-Pill Discipline: NO badge sandwich on top) */}
              <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-zinc-900 border border-white/5 transition-all duration-300 group-hover/card:border-white/20 group-hover/card:shadow-2xl">
                <img
                  src={getImageUrl(item.poster_path, 'w500')}
                  alt={itemTitle}
                  className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover/card:scale-[1.04]"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />

                {/* Subtle Hover Action Bar */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/card:opacity-100 transition-opacity flex flex-col justify-between p-3">
                  {/* Top quick bookmark */}
                  <div className="flex justify-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        authService.toggleWatchlist(item.id);
                      }}
                      className={`p-1.5 rounded-lg backdrop-blur-md transition cursor-pointer ${
                        isInWatchlist ? 'bg-amber-400 text-black' : 'bg-black/60 text-white hover:bg-black/80'
                      }`}
                      title={isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
                    >
                      {isInWatchlist ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Center Play Button */}
                  <div className="flex items-center justify-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlay(item, 1, 1, getSavedServerId());
                      }}
                      className="w-11 h-11 rounded-full bg-amber-400 text-black flex items-center justify-center shadow-lg transition-transform hover:scale-110 cursor-pointer"
                      title={`Play ${itemTitle}`}
                    >
                      <Play className="w-4 h-4 fill-black ml-0.5" />
                    </button>
                  </div>

                  {/* Bottom Format & Quick Server Ingest Trigger */}
                  <div className="flex items-center justify-between text-[10px] text-zinc-300 font-mono">
                    <span>4K UHD</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveServerMenuId(activeServerMenuId === item.id ? null : item.id);
                      }}
                      className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white transition flex items-center gap-1 cursor-pointer"
                    >
                      <span>Node</span>
                      <ChevronDown className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>

                {/* Quick Server Switcher Popover */}
                {activeServerMenuId === item.id && (
                  <div 
                    className="absolute inset-x-2 bottom-2 glass-dropdown rounded-xl p-1.5 z-40 text-xs shadow-2xl animate-fade-in"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <p className="px-2 py-1 text-[9px] uppercase tracking-wider text-zinc-400 font-mono border-b border-white/5">
                      Stream Ingest
                    </p>
                    <div className="max-h-28 overflow-y-auto no-scrollbar py-1 space-y-0.5">
                      {['vidking', 'vidsrc_xyz', 'vidlink', 'hls-ultra'].map((srvId) => {
                        const srv = EMBED_SERVERS.find((s) => s.id === srvId);
                        const label = srvId === 'hls-ultra' ? 'HLS Master' : (srv?.label?.split(' ')[0] || srvId);
                        return (
                          <button
                            key={srvId}
                            onClick={() => {
                              setActiveServerMenuId(null);
                              onPlay(item, 1, 1, srvId);
                            }}
                            className="w-full text-left px-2 py-1 rounded text-[11px] text-zinc-200 hover:bg-amber-400/20 hover:text-amber-300 transition flex items-center justify-between cursor-pointer"
                          >
                            <span>{label}</span>
                            <span className="text-[9px] text-emerald-400 font-mono">play</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Continue Watching Progress Line (Sleek hairline along the base) */}
                {progress > 0 && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/60">
                    <div
                      className="h-full bg-amber-400"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Unboxed Metadata (Clean typographic line with separators) */}
              <div className="pt-2 px-0.5">
                <h3 className="text-xs sm:text-sm font-medium text-zinc-100 truncate group-hover/card:text-amber-300 transition-colors">
                  {itemTitle}
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-zinc-400 font-light">
                  {year && <span>{year}</span>}
                  <span aria-hidden="true" className="text-zinc-600">·</span>
                  <span>{item.media_type === 'tv' ? 'Series' : 'Film'}</span>
                  {item.vote_average > 0 && (
                    <>
                      <span aria-hidden="true" className="text-zinc-600">·</span>
                      <span className="text-amber-400/90 font-mono">★ {item.vote_average.toFixed(1)}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};


import React from 'react';
import { Play, Sparkles, Server, Activity, ShieldCheck, ArrowRight, Film } from 'lucide-react';
import { MediaItem } from '../types';

interface CinemaEditorialShowcaseProps {
  onPlayFeatured: (item: MediaItem) => void;
  onOpenServerStudio: () => void;
}

export const CinemaEditorialShowcase: React.FC<CinemaEditorialShowcaseProps> = ({
  onPlayFeatured,
  onOpenServerStudio,
}) => {
  const sampleFestivalFilm: MediaItem = {
    id: 990001,
    title: 'The Brutalist Pavilion',
    overview: 'An architect embarks on a monument to eternity across postwar Europe, confronting vision, sacrifice, and modernism.',
    poster_path: '/src/assets/images/showcase_festival_film_1791332135091.jpg',
    backdrop_path: '/src/assets/images/showcase_festival_film_1791332135091.jpg',
    media_type: 'movie',
    vote_average: 9.1,
    release_date: '2024-11-15',
  };

  const sampleNoirFilm: MediaItem = {
    id: 990002,
    title: 'Metropolis Midnight: Rain & Neon',
    overview: 'A rogue cyber-investigator traces an illicit memory broadcast through the perpetual downpour of a high-altitude megalopolis.',
    poster_path: '/src/assets/images/bento_cinema_noir_1791332125932.jpg',
    backdrop_path: '/src/assets/images/bento_cinema_noir_1791332125932.jpg',
    media_type: 'movie',
    vote_average: 8.8,
    release_date: '2025-01-20',
  };

  return (
    <section className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-10 select-none">
      {/* Editorial Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-3 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-400 font-light mb-1">
            <span className="text-amber-400 font-medium">Editorial Selection</span>
            <span aria-hidden="true" className="text-zinc-600">·</span>
            <span>Curated Screenings</span>
            <span aria-hidden="true" className="text-zinc-600">·</span>
            <span>4K Master Transfers</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif text-white tracking-tight">
            Curator's Spotlight & Stream Engine
          </h2>
        </div>

        <button
          onClick={onOpenServerStudio}
          className="flex items-center gap-2 text-xs text-zinc-400 hover:text-amber-300 transition-colors cursor-pointer group self-start sm:self-auto"
        >
          <span>Server Studio (14 Providers)</span>
          <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Bento Showcase Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Card 1: Festival Masterwork (7 Columns) */}
        <div className="md:col-span-7 relative rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 group min-h-[340px] sm:min-h-[400px] flex flex-col justify-end p-6 sm:p-8">
          <img
            src="/src/assets/images/showcase_festival_film_1791332135091.jpg"
            alt="The Brutalist Pavilion"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            referrerPolicy="no-referrer"
          />
          {/* Contrast Scrim */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />

          <div className="relative z-10">
            <div className="flex items-center gap-2 text-xs text-zinc-300 font-light mb-2">
              <span className="text-amber-400 font-medium">Grand Jury Laureate</span>
              <span aria-hidden="true" className="text-zinc-500">·</span>
              <span>2024</span>
              <span aria-hidden="true" className="text-zinc-500">·</span>
              <span>4K Remaster</span>
              <span aria-hidden="true" className="text-zinc-500">·</span>
              <span className="text-amber-300 font-mono">★ 9.1</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-serif text-white mb-2 tracking-tight">
              The Brutalist Pavilion
            </h3>
            <p className="text-xs sm:text-sm text-zinc-300/80 font-light line-clamp-2 max-w-lg mb-5">
              An architect embarks on a monument to eternity across postwar Europe, confronting vision, sacrifice, and modernism.
            </p>

            <button
              onClick={() => onPlayFeatured(sampleFestivalFilm)}
              className="py-2 px-5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-semibold text-xs transition-colors cursor-pointer flex items-center gap-2 self-start shadow-md"
            >
              <Play className="w-3.5 h-3.5 fill-black ml-0.5" />
              Stream Presentation
            </button>
          </div>
        </div>

        {/* Column 2: Stacked Cards (5 Columns) */}
        <div className="md:col-span-5 flex flex-col gap-5">
          {/* Card 2: Neo-Noir Feature */}
          <div className="relative rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 group flex-1 min-h-[190px] flex flex-col justify-end p-5 sm:p-6">
            <img
              src="/src/assets/images/bento_cinema_noir_1791332125932.jpg"
              alt="Metropolis Midnight"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-transparent" />

            <div className="relative z-10">
              <div className="flex items-center gap-2 text-[11px] text-zinc-300 font-light mb-1">
                <span className="text-sky-400 font-medium">Midnight Noir</span>
                <span aria-hidden="true" className="text-zinc-500">·</span>
                <span>Spatial Audio</span>
                <span aria-hidden="true" className="text-zinc-500">·</span>
                <span className="text-amber-300 font-mono">★ 8.8</span>
              </div>
              <h4 className="text-lg sm:text-xl font-serif text-white mb-1">
                Metropolis Midnight: Rain & Neon
              </h4>
              <div className="flex items-center justify-between mt-3">
                <button
                  onClick={() => onPlayFeatured(sampleNoirFilm)}
                  className="flex items-center gap-1.5 text-xs text-amber-300 hover:text-amber-200 transition-colors font-medium cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-amber-300" />
                  Watch Screening
                </button>
                <span className="text-[10px] font-mono text-zinc-400">1080p @ 60fps</span>
              </div>
            </div>
          </div>

          {/* Card 3: Streaming Engine Live Health HUD */}
          <div 
            onClick={onOpenServerStudio}
            className="p-5 rounded-2xl glass-panel border border-white/10 hover:border-white/20 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-medium text-white">Stream Node Health</span>
                </div>
                <span className="text-[11px] font-mono text-emerald-400">Optimal</span>
              </div>
              <p className="text-[11px] text-zinc-400 font-light mb-3">
                Active multi-CDN routing across 14 providers with dynamic failover.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/5 text-[11px] font-mono text-zinc-300">
              <div className="p-2 rounded-lg bg-white/[0.03]">
                <p className="text-[10px] text-zinc-500 uppercase">Primary</p>
                <p className="text-amber-400 font-medium mt-0.5">Vidking Pro</p>
              </div>
              <div className="p-2 rounded-lg bg-white/[0.03]">
                <p className="text-[10px] text-zinc-500 uppercase">Avg Ping</p>
                <p className="text-emerald-400 font-medium mt-0.5">~22ms</p>
              </div>
              <div className="p-2 rounded-lg bg-white/[0.03]">
                <p className="text-[10px] text-zinc-500 uppercase">Format</p>
                <p className="text-white font-medium mt-0.5">4K HDR</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

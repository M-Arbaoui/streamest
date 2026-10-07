import React, { useState, useEffect } from 'react';
import { 
  Play, 
  ChevronRight, 
  Layers, 
  Bookmark, 
  Film, 
  Tv, 
  Radio 
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { CinemaEditorialShowcase } from './components/CinemaEditorialShowcase';
import { MediaRail } from './components/MediaRail';
import { CinemaPlayer } from './components/VideoPlayer/CinemaPlayer';
import { MultiStreamPlayer } from './components/VideoPlayer/MultiStreamPlayer';
import { LiveHub } from './components/LiveChannels/LiveHub';
import { OfflineVaultView } from './components/OfflineVault/OfflineVaultView';
import { MediaDetailModal } from './components/MediaDetailModal';
import { SearchModal } from './components/SearchModal';
import { AuthModal } from './components/Auth/AuthModal';
import { ServerStudioModal } from './components/ServerStudioModal';
import { MobileNavigation } from './components/MobileNavigation';
import { MobileBezelWrapper } from './components/MobileBezelWrapper';
import { TMDBService, GENRES, FALLBACK_MEDIA, getImageUrl } from './services/tmdb';
import { authService } from './services/authService';
import { MediaItem, UserAccount } from './types';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [isMobileFrame, setIsMobileFrame] = useState(false);

  // Active Modals & Overlays
  const [activePlayMedia, setActivePlayMedia] = useState<MediaItem | null>(null);
  const [playerSeason, setPlayerSeason] = useState(1);
  const [playerEpisode, setPlayerEpisode] = useState(1);
  const [playerServerId, setPlayerServerId] = useState<string | undefined>(undefined);
  const [showMultiWatch, setShowMultiWatch] = useState(false);
  const [detailMedia, setDetailMedia] = useState<MediaItem | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isServerStudioOpen, setIsServerStudioOpen] = useState(false);

  // Media Collections
  const [heroItems, setHeroItems] = useState<MediaItem[]>([]);
  const [trendingMovies, setTrendingMovies] = useState<MediaItem[]>([]);
  const [popularSeries, setPopularSeries] = useState<MediaItem[]>([]);
  const [topRated, setTopRated] = useState<MediaItem[]>([]);
  const [sciFiCollection, setSciFiCollection] = useState<MediaItem[]>([]);
  const [actionCollection, setActionCollection] = useState<MediaItem[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string | number>('all');
  const [genreResults, setGenreResults] = useState<MediaItem[]>([]);

  // User State
  const [account, setAccount] = useState<UserAccount>(authService.getAccount());

  // Load Catalogs from TMDB with fallback resiliency
  useEffect(() => {
    const unsub = authService.subscribe((acc) => setAccount(acc));

    async function loadCatalogs() {
      try {
        const [trending, series, top, scifi, action] = await Promise.all([
          TMDBService.getTrending('all', 'day'),
          TMDBService.getSeries('popular'),
          TMDBService.getMovies('top_rated'),
          TMDBService.getByGenre(878, 'movie'),
          TMDBService.getByGenre(28, 'movie'),
        ]);

        setHeroItems(trending.slice(0, 5));
        setTrendingMovies(trending);
        setPopularSeries(series);
        setTopRated(top);
        setSciFiCollection(scifi);
        setActionCollection(action);
      } catch (e) {
        console.warn('Initial load fallback', e);
        setHeroItems(FALLBACK_MEDIA.slice(0, 4));
        setTrendingMovies(FALLBACK_MEDIA);
        setPopularSeries(FALLBACK_MEDIA.filter((m) => m.media_type === 'tv'));
        setTopRated(FALLBACK_MEDIA);
        setSciFiCollection(FALLBACK_MEDIA);
        setActionCollection(FALLBACK_MEDIA);
      }
    }

    loadCatalogs();
    return () => unsub();
  }, []);

  // Handle Genre filter
  useEffect(() => {
    if (currentPage === 'movies' || currentPage === 'series') {
      const type = currentPage === 'movies' ? 'movie' : 'tv';
      TMDBService.getByGenre(selectedGenre, type).then((res) => {
        setGenreResults(res);
      });
    }
  }, [selectedGenre, currentPage]);

  const handlePlayMedia = (media: MediaItem, season = 1, ep = 1, serverId?: string) => {
    setActivePlayMedia(media);
    setPlayerSeason(season);
    setPlayerEpisode(ep);
    setPlayerServerId(serverId);
  };

  // Build continue watching items map
  const continueWatchingItems = account.history.map((h) => ({
    id: h.mediaId,
    title: h.title,
    overview: 'Resume playback where you left off.',
    poster_path: h.posterPath,
    backdrop_path: h.backdropPath,
    media_type: h.mediaType,
    vote_average: 8.5,
  }));

  const progressMap = account.history.reduce<Record<number, number>>((acc, h) => {
    acc[h.mediaId] = h.progressPercentage;
    return acc;
  }, {});

  // Watchlist items
  const watchlistItems = [
    ...trendingMovies,
    ...popularSeries,
    ...topRated,
    ...FALLBACK_MEDIA,
  ].filter(
    (item, index, self) =>
      account.watchlist.includes(item.id) &&
      index === self.findIndex((t) => t.id === item.id)
  );

  return (
    <MobileBezelWrapper isMobileFrame={isMobileFrame}>
      <div className="min-h-screen bg-[#060608] text-zinc-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
        {/* Navigation Bar */}
        <Navbar
          currentPage={currentPage}
          onNavigate={(page) => {
            setCurrentPage(page);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenAuth={() => setIsAuthOpen(true)}
          onOpenServerStudio={() => setIsServerStudioOpen(true)}
          isMobileDeviceView={isMobileFrame}
          onToggleMobileDeviceView={() => setIsMobileFrame(!isMobileFrame)}
        />

        {/* Main Content Router */}
        <main className="flex-1 pb-20">
          {/* HOME PAGE */}
          {currentPage === 'home' && (
            <div>
              {/* Grand Hero Spotlight Banner */}
              <HeroBanner
                items={heroItems.length > 0 ? heroItems : FALLBACK_MEDIA}
                onPlay={(item, season, ep, srvId) => handlePlayMedia(item, season, ep, srvId)}
                onOpenDetails={(item) => setDetailMedia(item)}
              />

              {/* Quiet Live Screening Callout Bar */}
              <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 -mt-8 sm:-mt-10 relative z-30 mb-6">
                <div
                  onClick={() => setCurrentPage('live')}
                  className="p-4 sm:p-5 rounded-2xl glass-panel border border-white/10 hover:border-white/20 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-amber-400">
                      <Radio className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-xs text-zinc-400 font-light mb-0.5">
                        <span className="text-amber-400 font-medium">Live Screening Salon</span>
                        <span aria-hidden="true" className="text-zinc-600">·</span>
                        <span>18,450 Watching Now</span>
                      </div>
                      <h3 className="text-sm sm:text-base font-serif text-white group-hover:text-amber-300 transition-colors">
                        Watchy Cinema Club · Continuous 4K Master Broadcast
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-zinc-300 group-hover:text-amber-300 transition-colors self-end sm:self-center font-medium">
                    <span>Enter Live Salon</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>

              {/* Curated Editorial Bento Showcase */}
              <CinemaEditorialShowcase
                onPlayFeatured={(item) => handlePlayMedia(item)}
                onOpenServerStudio={() => setIsServerStudioOpen(true)}
              />

              {/* Continue Watching Rail */}
              {continueWatchingItems.length > 0 && (
                <MediaRail
                  title="Continue Watching"
                  subtitle="Resume playback where you left off"
                  items={continueWatchingItems}
                  progressMap={progressMap}
                  onPlay={(item, s, ep, srvId) => handlePlayMedia(item, s, ep, srvId)}
                  onOpenDetails={(item) => setDetailMedia(item)}
                />
              )}

              {/* Trending Now Rail */}
              <MediaRail
                title="Trending Cinema"
                subtitle="High-retention masterworks streaming globally"
                items={trendingMovies}
                progressMap={progressMap}
                onPlay={(item, s, ep, srvId) => handlePlayMedia(item, s, ep, srvId)}
                onOpenDetails={(item) => setDetailMedia(item)}
              />

              {/* Multi-Watch Engine Feature Section */}
              <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 my-10">
                <div className="p-8 rounded-2xl glass-panel border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="max-w-xl">
                    <div className="text-xs text-zinc-400 font-light mb-1">
                      <span>Boutique Engine</span>
                      <span aria-hidden="true" className="mx-2 text-zinc-600">·</span>
                      <span className="text-amber-400">Concurrent Screening</span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-serif text-white tracking-tight">
                      Split-Screen Multi-Watch
                    </h3>
                    <p className="text-xs sm:text-sm text-zinc-400 font-light mt-1.5 leading-relaxed">
                      Experience side-by-side or picture-in-picture concurrent streaming. Run a live community screening alongside your selected masterwork.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowMultiWatch(true)}
                    className="py-2.5 px-6 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs sm:text-sm flex items-center gap-2 self-start md:self-center transition-colors cursor-pointer border border-white/10 whitespace-nowrap"
                  >
                    <Layers className="w-4 h-4 text-amber-400" />
                    Open Multi-Watch
                  </button>
                </div>
              </div>

              {/* TV Series Rail */}
              <MediaRail
                title="Episodic Narratives"
                subtitle="Complete series master cuts with full seasons"
                items={popularSeries}
                progressMap={progressMap}
                onPlay={(item, s, ep, srvId) => handlePlayMedia(item, s, ep, srvId)}
                onOpenDetails={(item) => setDetailMedia(item)}
              />

              {/* Top Rated Masterpieces */}
              <MediaRail
                title="Hallmark Masterpieces"
                subtitle="Highest rated all-time cinematic productions"
                items={topRated}
                progressMap={progressMap}
                onPlay={(item, s, ep, srvId) => handlePlayMedia(item, s, ep, srvId)}
                onOpenDetails={(item) => setDetailMedia(item)}
              />

              {/* Sci-Fi Rail */}
              <MediaRail
                title="Speculative & Cosmic Odysseys"
                subtitle="Cinematic sci-fi graded for dynamic HDR contrast"
                items={sciFiCollection}
                progressMap={progressMap}
                onPlay={(item, s, ep, srvId) => handlePlayMedia(item, s, ep, srvId)}
                onOpenDetails={(item) => setDetailMedia(item)}
              />
            </div>
          )}

          {/* MOVIES & SERIES PAGES */}
          {(currentPage === 'movies' || currentPage === 'series') && (
            <div className="pt-24 pb-16 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
              <div className="mb-6 pb-4 border-b border-white/5 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                <div>
                  <div className="text-xs text-zinc-400 font-light mb-1">
                    <span>{currentPage === 'movies' ? 'Feature Films' : 'Television Suite'}</span>
                    <span aria-hidden="true" className="mx-2 text-zinc-600">·</span>
                    <span>14 Video Providers Connected</span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-serif text-white tracking-tight">
                    {currentPage === 'movies' ? 'Cinema Archive' : 'Episodic Dramas'}
                  </h1>
                </div>

                <button
                  onClick={() => setIsServerStudioOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-zinc-300 border border-white/10 transition cursor-pointer self-start sm:self-auto"
                >
                  Configure Providers (Vidking, VidSrc...)
                </button>
              </div>

              {/* Refined Segmented Genre Selector (Buttons with clear states, zero pills) */}
              <div className="flex gap-1.5 p-1 bg-white/5 rounded-xl border border-white/5 overflow-x-auto no-scrollbar mb-8">
                {GENRES.map((g) => {
                  const isSelected = selectedGenre === g.id;
                  return (
                    <button
                      key={g.id}
                      onClick={() => setSelectedGenre(g.id)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-white/10 text-white shadow-sm'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {g.name}
                    </button>
                  );
                })}
              </div>

              {/* Clean Media Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                {(genreResults.length > 0 ? genreResults : currentPage === 'movies' ? trendingMovies : popularSeries).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setDetailMedia(item)}
                    className="group cursor-pointer"
                  >
                    <div className="aspect-[2/3] w-full rounded-xl overflow-hidden bg-zinc-900 border border-white/5 transition-all duration-300 group-hover:border-white/20 group-hover:shadow-2xl relative">
                      <img
                        src={getImageUrl(item.poster_path, 'w500')}
                        alt={item.title || item.name}
                        className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlayMedia(item);
                          }}
                          className="w-10 h-10 rounded-full bg-amber-400 text-black flex items-center justify-center shadow-lg transition-transform hover:scale-105"
                        >
                          <Play className="w-4 h-4 fill-black ml-0.5" />
                        </button>
                      </div>
                    </div>
                    <div className="pt-2 px-0.5">
                      <h4 className="text-xs sm:text-sm font-medium text-white truncate group-hover:text-amber-300 transition-colors">
                        {item.title || item.name}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-zinc-400 font-light">
                        <span>{(item.release_date || item.first_air_date || '').split('-')[0] || '2024'}</span>
                        {item.vote_average > 0 && (
                          <>
                            <span aria-hidden="true" className="text-zinc-600">·</span>
                            <span className="text-amber-400/90 font-mono">★ {item.vote_average.toFixed(1)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* LIVE CINEMA SALON */}
          {currentPage === 'live' && <LiveHub />}

          {/* MULTI-WATCH ENGINE */}
          {currentPage === 'multi-stream' && (
            <div className="pt-24 pb-16 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
              <MultiStreamPlayer onClose={() => setCurrentPage('home')} />
            </div>
          )}

          {/* OFFLINE VAULT */}
          {currentPage === 'offline' && (
            <OfflineVaultView
              onPlayOfflineMedia={(media, season, ep) => handlePlayMedia(media, season, ep)}
            />
          )}

          {/* WATCHLIST */}
          {currentPage === 'mylist' && (
            <div className="pt-24 pb-16 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
              <div className="mb-6 pb-4 border-b border-white/5">
                <div className="text-xs text-zinc-400 font-light mb-1">
                  <span>Personal Library</span>
                  <span aria-hidden="true" className="mx-2 text-zinc-600">·</span>
                  <span>Synced across devices</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-serif text-white tracking-tight">
                  Curated Watchlist
                </h1>
              </div>

              {watchlistItems.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                  {watchlistItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setDetailMedia(item)}
                      className="group cursor-pointer"
                    >
                      <div className="aspect-[2/3] w-full rounded-xl overflow-hidden bg-zinc-900 border border-white/5 transition-all duration-300 group-hover:border-white/20 group-hover:shadow-2xl relative">
                        <img
                          src={getImageUrl(item.poster_path, 'w500')}
                          alt={item.title || item.name}
                          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlayMedia(item);
                            }}
                            className="w-10 h-10 rounded-full bg-amber-400 text-black flex items-center justify-center shadow-lg"
                          >
                            <Play className="w-4 h-4 fill-black ml-0.5" />
                          </button>
                        </div>
                      </div>
                      <div className="pt-2 px-0.5">
                        <h4 className="text-xs sm:text-sm font-medium text-white truncate group-hover:text-amber-300 transition-colors">
                          {item.title || item.name}
                        </h4>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-24 text-center glass-panel rounded-2xl p-8 max-w-lg mx-auto">
                  <Bookmark className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                  <h3 className="text-lg font-serif text-white">Your Watchlist is Empty</h3>
                  <p className="text-xs text-zinc-400 font-light mt-1 mb-6">
                    Add titles from the curated cinema library to build your private collection.
                  </p>
                  <button
                    onClick={() => setCurrentPage('home')}
                    className="py-2.5 px-6 rounded-xl bg-amber-400 text-black font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Explore Library
                  </button>
                </div>
              )}
            </div>
          )}
        </main>

        {/* Quiet Editorial Footer (Anti-slop compliant: no fake telemetry tickers) */}
        <footer className="border-t border-white/5 py-12 px-6 sm:px-8 lg:px-12 bg-black/40 text-xs text-zinc-500">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <span className="font-serif text-lg text-white font-normal">
                Watchy<span className="text-amber-400">.</span>
              </span>
              <p className="text-[11px] text-zinc-500 font-light mt-0.5">
                Cinema without the noise. High-definition adaptive streaming.
              </p>
            </div>

            <div className="flex items-center gap-6 text-[11px] text-zinc-400 font-light">
              <span>Adaptive HLS Pipeline</span>
              <span aria-hidden="true" className="text-zinc-700">·</span>
              <span>14 Video Providers</span>
              <span aria-hidden="true" className="text-zinc-700">·</span>
              <span>Offline CacheStorage</span>
            </div>
          </div>
        </footer>

        {/* Mobile Navigation */}
        <MobileNavigation
          currentPage={currentPage}
          onNavigate={(page) => setCurrentPage(page)}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenAuth={() => setIsAuthOpen(true)}
        />

        {/* Modals & Overlays */}
        {activePlayMedia && (
          <CinemaPlayer
            media={activePlayMedia}
            season={playerSeason}
            episode={playerEpisode}
            initialServerId={playerServerId}
            onClose={() => setActivePlayMedia(null)}
            onSwitchToMultiStream={() => {
              setActivePlayMedia(null);
              setShowMultiWatch(true);
            }}
          />
        )}

        {showMultiWatch && (
          <MultiStreamPlayer onClose={() => setShowMultiWatch(false)} />
        )}

        {detailMedia && (
          <MediaDetailModal
            media={detailMedia}
            onClose={() => setDetailMedia(null)}
            onPlay={(media, s, ep, srvId) => handlePlayMedia(media, s, ep, srvId)}
            onSelectSimilar={(media) => setDetailMedia(media)}
          />
        )}

        <SearchModal
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          onSelectMedia={(media) => setDetailMedia(media)}
          onPlayMedia={(media) => handlePlayMedia(media)}
        />

        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
        />

        <ServerStudioModal
          isOpen={isServerStudioOpen}
          onClose={() => setIsServerStudioOpen(false)}
          onSelectServer={(srvId) => setPlayerServerId(srvId)}
        />
      </div>
    </MobileBezelWrapper>
  );
}


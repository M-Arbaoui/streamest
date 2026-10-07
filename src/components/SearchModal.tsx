import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Play } from 'lucide-react';
import { TMDBService, getImageUrl } from '../services/tmdb';
import { MediaItem } from '../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMedia: (item: MediaItem) => void;
  onPlayMedia: (item: MediaItem) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectMedia,
  onPlayMedia,
}) => {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'movie' | 'tv'>('all');
  const [results, setResults] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await TMDBService.search(query, filter);
        setResults(res);
      } catch (err) {
        console.error('Search error', err);
      } finally {
        setLoading(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [query, filter]);

  if (!isOpen) return null;

  const popularSuggestions = ['Dune', 'Arcane', 'Oppenheimer', 'Interstellar', 'Squid Game', 'Deadpool'];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/80 backdrop-blur-md">
      <div 
        className="fixed inset-0 -z-10" 
        onClick={onClose} 
      />

      <div className="w-full max-w-2xl glass-dropdown rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
        {/* Search Bar Input */}
        <div className="relative flex items-center px-5 py-4 border-b border-white/5">
          <Search className="w-4 h-4 text-zinc-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search films, series, directors..."
            className="w-full bg-transparent text-white placeholder-zinc-500 text-sm sm:text-base focus:outline-none font-light"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-full text-zinc-400 hover:text-white transition-colors mr-2 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2 py-0.5 text-xs text-zinc-400 hover:text-white rounded border border-white/10 transition cursor-pointer"
          >
            ESC
          </button>
        </div>

        {/* Filter Segmented Control (Zero-Pills: Clean segmented button block) */}
        <div className="px-5 py-2.5 bg-black/30 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-1 p-0.5 bg-white/5 rounded-lg text-xs">
            {(['all', 'movie', 'tv'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-md font-medium capitalize transition-colors cursor-pointer ${
                  filter === f
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {f === 'all' ? 'All' : f === 'movie' ? 'Films' : 'Series'}
              </button>
            ))}
          </div>

          {results.length > 0 && (
            <span className="text-xs text-zinc-400 font-mono">
              {results.length} found
            </span>
          )}
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-4 no-scrollbar">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-zinc-400 gap-2">
              <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-light">Searching catalog...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {results.map((item) => {
                const title = item.title || item.name || 'Untitled';
                const year = (item.release_date || item.first_air_date || '').split('-')[0];
                return (
                  <div
                    key={`${item.media_type}-${item.id}`}
                    onClick={() => {
                      onSelectMedia(item);
                      onClose();
                    }}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors group cursor-pointer"
                  >
                    <div className="relative w-12 h-16 rounded-lg overflow-hidden shrink-0 bg-zinc-800">
                      <img
                        src={getImageUrl(item.poster_path, 'w300')}
                        alt={title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onPlayMedia(item);
                            onClose();
                          }}
                          className="w-7 h-7 rounded-full bg-amber-400 text-black flex items-center justify-center shadow-md cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-black ml-0.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 pr-1">
                      {/* Zero-Pill Unboxed Metadata Line */}
                      <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-light mb-0.5">
                        <span>{item.media_type === 'tv' ? 'Series' : 'Film'}</span>
                        {year && (
                          <>
                            <span aria-hidden="true" className="text-zinc-600">·</span>
                            <span>{year}</span>
                          </>
                        )}
                        {item.vote_average > 0 && (
                          <>
                            <span aria-hidden="true" className="text-zinc-600">·</span>
                            <span className="text-amber-300">★ {item.vote_average.toFixed(1)}</span>
                          </>
                        )}
                      </div>

                      <h4 className="text-xs sm:text-sm font-medium text-white truncate group-hover:text-amber-300 transition-colors">
                        {title}
                      </h4>
                      <p className="text-[11px] text-zinc-400 line-clamp-1 font-light mt-0.5">
                        {item.overview || 'No synopsis available.'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : query ? (
            <div className="py-12 text-center text-zinc-400">
              <p className="text-sm font-medium text-white">No titles found for "{query}"</p>
              <p className="text-xs text-zinc-500 font-light mt-1">Try searching for Denis Villeneuve, Oppenheimer, or Interstellar.</p>
            </div>
          ) : (
            <div className="py-6 px-2">
              <p className="text-xs text-zinc-500 font-light mb-2.5">
                Popular inquiries
              </p>
              <div className="flex flex-wrap gap-2">
                {popularSuggestions.map((term) => (
                  <button
                    key={term}
                    onClick={() => setQuery(term)}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-zinc-300 hover:text-white transition-colors cursor-pointer border border-white/5"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

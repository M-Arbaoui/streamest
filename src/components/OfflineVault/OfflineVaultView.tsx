import React, { useState, useEffect } from 'react';
import { 
  DownloadCloud, 
  Trash2, 
  Play, 
  HardDrive, 
  WifiOff, 
  Wifi, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Film
} from 'lucide-react';
import { offlineService } from '../../services/offlineCache';
import { OfflineDownload, MediaItem } from '../../types';
import { getImageUrl } from '../../services/tmdb';

interface OfflineVaultViewProps {
  onPlayOfflineMedia: (media: MediaItem, season?: number, episode?: number) => void;
}

export const OfflineVaultView: React.FC<OfflineVaultViewProps> = ({ onPlayOfflineMedia }) => {
  const [downloads, setDownloads] = useState<OfflineDownload[]>(offlineService.getDownloads());
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(offlineService.getOfflineMode());
  const [storageStats, setStorageStats] = useState(offlineService.getStorageStats());

  useEffect(() => {
    const unsub = offlineService.subscribe((list) => {
      setDownloads(list);
      setStorageStats(offlineService.getStorageStats());
    });
    const unsubMode = offlineService.subscribeOfflineMode((mode) => {
      setIsOfflineMode(mode);
    });

    return () => {
      unsub();
      unsubMode();
    };
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    offlineService.deleteDownload(id);
  };

  const handlePlay = (item: OfflineDownload) => {
    const mockMedia: MediaItem = {
      id: item.mediaId,
      title: item.title,
      overview: 'Offline cached media item loaded directly from local storage.',
      poster_path: item.posterPath,
      backdrop_path: item.posterPath,
      media_type: item.mediaType,
      vote_average: 8.8,
    };
    onPlayOfflineMedia(mockMedia, item.season, item.episode);
  };

  const percentUsed = Math.min(100, Math.round((storageStats.usedBytes / storageStats.totalBytes) * 100));

  return (
    <div className="pt-24 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header & Storage Meter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <DownloadCloud className="w-5 h-5" />
            </span>
            <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-bold">
              OFFLINE VAULT
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Downloaded Media & Cache
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Watch your favorite films and series anywhere, zero Wi-Fi or cellular data required.
          </p>
        </div>

        {/* Offline Simulation Toggle */}
        <div className="flex items-center gap-4 p-4 rounded-2xl glass-panel border border-white/10">
          <div>
            <p className="text-xs font-semibold text-white">Offline Mode Simulation</p>
            <p className="text-[11px] text-zinc-400">
              {isOfflineMode ? 'Testing offline playback only' : 'Online connected'}
            </p>
          </div>
          <button
            onClick={() => offlineService.toggleOfflineMode()}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              isOfflineMode
                ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20'
                : 'bg-white/10 hover:bg-white/20 text-zinc-200'
            }`}
          >
            {isOfflineMode ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4 text-emerald-400" />}
            {isOfflineMode ? 'Offline Active' : 'Go Offline'}
          </button>
        </div>
      </div>

      {/* Storage Gauge Banner */}
      <div className="p-6 glass-panel rounded-3xl border border-white/10 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-2.5">
            <HardDrive className="w-5 h-5 text-amber-400" />
            <span className="text-sm font-bold text-white">Local Device Storage Quota</span>
          </div>
          <div className="text-xs font-mono text-zinc-400">
            <span className="text-white font-bold">{storageStats.usedFormatted}</span> of 64.0 GB used ({storageStats.freeFormatted} available)
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden p-0.5">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-500"
            style={{ width: `${Math.max(4, percentUsed)}%` }}
          />
        </div>
      </div>

      {/* Offline Mode Active Notice */}
      {isOfflineMode && (
        <div className="p-4 mb-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 text-xs text-amber-200">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          <span>
            <strong>Offline Mode Enabled:</strong> Network requests are suspended. You are streaming seamlessly from local CacheStorage and IndexedDB media blobs.
          </span>
        </div>
      )}

      {/* Downloaded Items Grid */}
      {downloads.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {downloads.map((item) => {
            const isDone = item.status === 'completed';
            const sizeMb = (item.fileSizeBytes / (1024 * 1024)).toFixed(0);

            return (
              <div
                key={item.id}
                onClick={() => isDone && handlePlay(item)}
                className={`flex gap-3.5 p-3.5 rounded-2xl glass-panel border border-white/10 transition group cursor-pointer ${
                  isDone ? 'hover:border-amber-400/40 hover:bg-white/10' : ''
                }`}
              >
                {/* Poster */}
                <div className="relative w-20 h-28 rounded-xl overflow-hidden shrink-0 bg-zinc-800">
                  <img
                    src={getImageUrl(item.posterPath, 'w300')}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  {isDone && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-9 h-9 rounded-full bg-amber-400 text-black flex items-center justify-center shadow-lg">
                        <Play className="w-4 h-4 fill-black ml-0.5" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-white/10 text-zinc-300">
                        {item.mediaType === 'tv' ? 'Episode' : 'Movie'}
                      </span>
                      <span className="text-xs font-mono text-zinc-400">{sizeMb} MB</span>
                    </div>
                    <h3 className="font-bold text-white text-sm truncate group-hover:text-amber-300 transition">
                      {item.title}
                    </h3>
                  </div>

                  <div>
                    {!isDone ? (
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[11px] text-amber-300 font-mono">
                          <span>Downloading...</span>
                          <span>{item.progress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-400 transition-all duration-300"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-xs pt-2">
                        <span className="flex items-center gap-1 text-emerald-400 font-medium text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Ready Offline
                        </span>
                        <button
                          onClick={(e) => handleDelete(item.id, e)}
                          className="p-1 text-zinc-500 hover:text-red-400 transition"
                          title="Delete from local cache"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-20 text-center glass-panel rounded-3xl border border-white/10 p-8">
          <Film className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">Your Offline Vault is Empty</h3>
          <p className="text-sm text-zinc-400 max-w-md mx-auto mt-1 mb-6">
            Click the download icon on any title or inside the cinema player to save high-definition media for offline viewing.
          </p>
        </div>
      )}
    </div>
  );
};

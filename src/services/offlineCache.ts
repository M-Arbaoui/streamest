import { MediaType, OfflineDownload } from '../types';

const STORAGE_KEY = 'watchy_offline_downloads';
const CACHE_NAME = 'watchy-video-cache-v1';

class OfflineService {
  private downloads: OfflineDownload[] = [];
  private listeners: Array<(downloads: OfflineDownload[]) => void> = [];
  private activeIntervals = new Map<string, number>();
  private isOfflineMode = false;
  private modeListeners: Array<(isOffline: boolean) => void> = [];

  constructor() {
    this.downloads = this.loadDownloads();
  }

  private loadDownloads(): OfflineDownload[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Failed to load offline downloads', e);
    }
    // Seed with initial sample so user immediately sees how offline caching works
    return [
      {
        id: 'dl_693134',
        mediaId: 693134,
        title: 'Dune: Part Two (1080p Atmos)',
        mediaType: 'movie',
        posterPath: '/czembW0RJJrzkFuBhGsy638Uady.jpg',
        streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
        fileSizeBytes: 1845493824, // ~1.8 GB
        downloadedBytes: 1845493824,
        progress: 100,
        status: 'completed',
        downloadedAt: Date.now() - 3600 * 1000 * 12,
        durationSeconds: 9960,
      },
      {
        id: 'dl_94605_2_3',
        mediaId: 94605,
        title: 'Arcane: S2 E3 (4K HDR)',
        mediaType: 'tv',
        season: 2,
        episode: 3,
        posterPath: '/fqldf2t8ztc9aiwn397rDit3OsM.jpg',
        streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        fileSizeBytes: 849382400, // ~850 MB
        downloadedBytes: 849382400,
        progress: 100,
        status: 'completed',
        downloadedAt: Date.now() - 3600 * 1000 * 48,
        durationSeconds: 2700,
      },
    ];
  }

  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.downloads));
      this.notify();
    } catch (e) {
      console.error('Failed to save offline downloads', e);
    }
  }

  private notify(): void {
    this.listeners.forEach((l) => l([...this.downloads]));
  }

  subscribe(listener: (downloads: OfflineDownload[]) => void): () => void {
    this.listeners.push(listener);
    listener([...this.downloads]);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  subscribeOfflineMode(listener: (isOffline: boolean) => void): () => void {
    this.modeListeners.push(listener);
    listener(this.isOfflineMode);
    return () => {
      this.modeListeners = this.modeListeners.filter((l) => l !== listener);
    };
  }

  toggleOfflineMode(): boolean {
    this.isOfflineMode = !this.isOfflineMode;
    this.modeListeners.forEach((l) => l(this.isOfflineMode));
    return this.isOfflineMode;
  }

  getOfflineMode(): boolean {
    return this.isOfflineMode;
  }

  getDownloads(): OfflineDownload[] {
    return [...this.downloads];
  }

  isDownloaded(mediaId: number, season?: number, episode?: number): boolean {
    return this.downloads.some(
      (d) =>
        d.mediaId === mediaId &&
        d.season === season &&
        d.episode === episode &&
        d.status === 'completed'
    );
  }

  getDownloadForMedia(mediaId: number, season?: number, episode?: number): OfflineDownload | undefined {
    return this.downloads.find(
      (d) => d.mediaId === mediaId && d.season === season && d.episode === episode
    );
  }

  async startDownload(
    mediaId: number,
    title: string,
    mediaType: MediaType,
    posterPath: string | null,
    streamUrl: string,
    season?: number,
    episode?: number,
    durationSeconds = 5400
  ): Promise<string> {
    const id = `dl_${mediaId}_${season || 0}_${episode || 0}`;
    const existing = this.downloads.find((d) => d.id === id);
    if (existing && existing.status === 'completed') {
      return id;
    }

    const estimatedSize = Math.floor(1.2 * 1024 * 1024 * 1024 * (Math.random() * 0.8 + 0.6)); // ~700MB - 1.6GB
    const newDownload: OfflineDownload = {
      id,
      mediaId,
      title: season && episode ? `${title}: S${season} E${episode}` : title,
      mediaType,
      season,
      episode,
      posterPath,
      streamUrl,
      fileSizeBytes: estimatedSize,
      downloadedBytes: 0,
      progress: 5,
      status: 'downloading',
      downloadedAt: Date.now(),
      durationSeconds,
    };

    if (existing) {
      this.downloads = this.downloads.filter((d) => d.id !== id);
    }
    this.downloads.unshift(newDownload);
    this.save();

    // Cache the media assets in browser CacheStorage if supported
    if ('caches' in window) {
      try {
        const cache = await caches.open(CACHE_NAME);
        if (posterPath) {
          cache.add(`https://image.tmdb.org/t/p/w780${posterPath}`).catch(() => {});
        }
      } catch (e) {
        console.warn('Cache API error', e);
      }
    }

    // Realistic progressive download simulation with chunk intervals
    let downloaded = 0;
    const intervalId = window.setInterval(() => {
      const step = estimatedSize / 20; // 20 steps
      downloaded += step;
      const progress = Math.min(100, Math.round((downloaded / estimatedSize) * 100));

      const target = this.downloads.find((d) => d.id === id);
      if (!target) {
        clearInterval(intervalId);
        return;
      }

      target.downloadedBytes = Math.min(downloaded, estimatedSize);
      target.progress = progress;

      if (progress >= 100) {
        target.status = 'completed';
        target.downloadedBytes = estimatedSize;
        clearInterval(intervalId);
        this.activeIntervals.delete(id);
      }
      this.save();
    }, 450);

    this.activeIntervals.set(id, intervalId);
    return id;
  }

  deleteDownload(id: string): void {
    const interval = this.activeIntervals.get(id);
    if (interval) {
      clearInterval(interval);
      this.activeIntervals.delete(id);
    }
    this.downloads = this.downloads.filter((d) => d.id !== id);
    this.save();
  }

  getStorageStats(): { usedBytes: number; totalBytes: number; usedFormatted: string; freeFormatted: string } {
    const usedBytes = this.downloads.reduce((acc, curr) => acc + (curr.downloadedBytes || 0), 0);
    const totalBytes = 64 * 1024 * 1024 * 1024; // 64 GB Virtual device quota
    return {
      usedBytes,
      totalBytes,
      usedFormatted: (usedBytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB',
      freeFormatted: ((totalBytes - usedBytes) / (1024 * 1024 * 1024)).toFixed(1) + ' GB',
    };
  }
}

export const offlineService = new OfflineService();

import { MediaType, UserAccount, UserProfile } from '../types';

const STORAGE_KEY = 'watchy_auth_account';

const DEFAULT_PROFILES: UserProfile[] = [
  {
    id: 'p1',
    name: 'Cinema VIP',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80',
    isKid: false,
    accentColor: '#f59e0b',
    preferredQuality: 'auto',
    playbackSpeed: 1,
    autoPlayNext: true,
  },
  {
    id: 'p2',
    name: 'Studio Director',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&h=200&q=80',
    isKid: false,
    accentColor: '#3b82f6',
    preferredQuality: '4k',
    playbackSpeed: 1,
    autoPlayNext: true,
  },
  {
    id: 'p3',
    name: 'Kids World',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&h=200&q=80',
    isKid: true,
    pin: '1234',
    accentColor: '#10b981',
    preferredQuality: '1080p',
    playbackSpeed: 1,
    autoPlayNext: false,
  },
];

const DEFAULT_ACCOUNT: UserAccount = {
  id: 'usr_premium_101',
  email: 'director@watchy.cinema',
  username: 'Alex Vance',
  plan: 'Pro 4K Cinema Pass',
  profiles: DEFAULT_PROFILES,
  activeProfileId: 'p1',
  watchlist: [693134, 94605, 157336], // Dune, Arcane, Interstellar
  history: [
    {
      mediaId: 693134,
      title: 'Dune: Part Two',
      mediaType: 'movie',
      posterPath: '/czembW0RJJrzkFuBhGsy638Uady.jpg',
      backdropPath: '/xOMo8BRK7PfcJv9JCnx7s520fr.jpg',
      progressPercentage: 45,
      currentTimeSeconds: 4480,
      durationSeconds: 9960,
      updatedAt: Date.now() - 3600 * 1000 * 4,
    },
    {
      mediaId: 94605,
      title: 'Arcane',
      mediaType: 'tv',
      season: 2,
      episode: 3,
      posterPath: '/fqldf2t8ztc9aiwn397rDit3OsM.jpg',
      backdropPath: '/2meX1nMdScFOoV4370rqHWFDxZ0.jpg',
      progressPercentage: 80,
      currentTimeSeconds: 2160,
      durationSeconds: 2700,
      updatedAt: Date.now() - 3600 * 1000 * 24,
    },
  ],
};

class AuthService {
  private account: UserAccount;
  private listeners: Array<(account: UserAccount) => void> = [];

  constructor() {
    this.account = this.loadFromStorage();
  }

  private loadFromStorage(): UserAccount {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Failed to parse saved auth account', e);
    }
    return DEFAULT_ACCOUNT;
  }

  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.account));
      this.notify();
    } catch (e) {
      console.error('Failed to save auth state', e);
    }
  }

  private notify(): void {
    this.listeners.forEach((l) => l({ ...this.account }));
  }

  subscribe(listener: (account: UserAccount) => void): () => void {
    this.listeners.push(listener);
    listener({ ...this.account });
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  getAccount(): UserAccount {
    return { ...this.account };
  }

  getActiveProfile(): UserProfile {
    return (
      this.account.profiles.find((p) => p.id === this.account.activeProfileId) ||
      this.account.profiles[0]
    );
  }

  switchProfile(profileId: string): boolean {
    const target = this.account.profiles.find((p) => p.id === profileId);
    if (!target) return false;
    this.account.activeProfileId = profileId;
    this.save();
    return true;
  }

  login(email: string, username = 'Movie Connoisseur'): void {
    this.account.email = email;
    this.account.username = username;
    this.save();
  }

  logout(): void {
    this.account = {
      ...DEFAULT_ACCOUNT,
      username: 'Guest Viewer',
      email: 'guest@watchy.local',
      plan: 'Free Standard',
    };
    this.save();
  }

  upgradePlan(plan: 'Pro 4K Cinema Pass' | 'Studio VIP'): void {
    this.account.plan = plan;
    this.save();
  }

  toggleWatchlist(mediaId: number): boolean {
    const index = this.account.watchlist.indexOf(mediaId);
    let added = false;
    if (index > -1) {
      this.account.watchlist.splice(index, 1);
    } else {
      this.account.watchlist.unshift(mediaId);
      added = true;
    }
    this.save();
    return added;
  }

  isInWatchlist(mediaId: number): boolean {
    return this.account.watchlist.includes(mediaId);
  }

  updateProgress(
    mediaId: number,
    title: string,
    mediaType: MediaType,
    currentTimeSeconds: number,
    durationSeconds: number,
    posterPath: string | null = null,
    backdropPath: string | null = null,
    season?: number,
    episode?: number
  ): void {
    if (durationSeconds <= 0) return;
    const progress = Math.min(Math.round((currentTimeSeconds / durationSeconds) * 100), 100);

    const existingIndex = this.account.history.findIndex(
      (h) => h.mediaId === mediaId && h.season === season && h.episode === episode
    );

    const record = {
      mediaId,
      title,
      mediaType,
      season,
      episode,
      posterPath,
      backdropPath,
      progressPercentage: progress,
      currentTimeSeconds,
      durationSeconds,
      updatedAt: Date.now(),
    };

    if (existingIndex > -1) {
      this.account.history.splice(existingIndex, 1);
    }

    this.account.history.unshift(record);
    if (this.account.history.length > 30) {
      this.account.history.pop();
    }
    this.save();
  }

  addProfile(name: string, isKid: boolean, pin?: string): UserProfile {
    const newProfile: UserProfile = {
      id: `p_${Date.now()}`,
      name,
      avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&h=200&q=80`,
      isKid,
      pin,
      accentColor: isKid ? '#10b981' : '#f59e0b',
      preferredQuality: 'auto',
      playbackSpeed: 1,
      autoPlayNext: true,
    };
    this.account.profiles.push(newProfile);
    this.save();
    return newProfile;
  }
}

export const authService = new AuthService();

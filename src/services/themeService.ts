export type CinemaTheme = 'noir' | 'criterion' | 'sapphire';

interface ThemeConfig {
  id: CinemaTheme;
  name: string;
  tagline: string;
  accentColor: string;
  accentBg: string;
  bgHex: string;
}

export const CINEMA_THEMES: ThemeConfig[] = [
  {
    id: 'noir',
    name: 'Titanium Noir',
    tagline: 'Deep Obsidian & Champagne Gold',
    accentColor: '#f59e0b',
    accentBg: 'bg-amber-400',
    bgHex: '#070709',
  },
  {
    id: 'criterion',
    name: 'Criterion Heritage',
    tagline: 'Velvet Mahogany & Gilded Gold',
    accentColor: '#d4af37',
    accentBg: 'bg-yellow-500',
    bgHex: '#090708',
  },
  {
    id: 'sapphire',
    name: 'Midnight Sapphire',
    tagline: 'Celestial Indigo & Ice Cyan',
    accentColor: '#38bdf8',
    accentBg: 'bg-sky-400',
    bgHex: '#050711',
  },
];

const STORAGE_KEY = 'watchy_cinema_theme';

class ThemeService {
  private currentTheme: CinemaTheme = 'noir';
  private listeners: Array<(theme: CinemaTheme) => void> = [];

  constructor() {
    const saved = localStorage.getItem(STORAGE_KEY) as CinemaTheme | null;
    if (saved && ['noir', 'criterion', 'sapphire'].includes(saved)) {
      this.currentTheme = saved;
    }
  }

  public getTheme(): CinemaTheme {
    return this.currentTheme;
  }

  public setTheme(theme: CinemaTheme) {
    this.currentTheme = theme;
    localStorage.setItem(STORAGE_KEY, theme);
    document.documentElement.setAttribute('data-theme', theme);
    this.notify();
  }

  public subscribe(listener: (theme: CinemaTheme) => void) {
    this.listeners.push(listener);
    listener(this.currentTheme);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l(this.currentTheme));
  }
}

export const themeService = new ThemeService();

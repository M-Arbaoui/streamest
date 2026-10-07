import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ChevronDown, 
  Check, 
  Sliders, 
  Sparkles, 
  Wifi, 
  WifiOff, 
  Smartphone, 
  Monitor,
  HardDrive,
  Server,
  Palette
} from 'lucide-react';
import { authService } from '../services/authService';
import { offlineService } from '../services/offlineCache';
import { themeService, CinemaTheme, CINEMA_THEMES } from '../services/themeService';
import { getSavedServerId, EMBED_SERVERS } from '../services/hlsStreams';
import { UserAccount, UserProfile } from '../types';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onOpenSearch: () => void;
  onOpenAuth: () => void;
  onOpenServerStudio?: () => void;
  isMobileDeviceView: boolean;
  onToggleMobileDeviceView: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  onOpenSearch,
  onOpenAuth,
  onOpenServerStudio,
  isMobileDeviceView,
  onToggleMobileDeviceView,
}) => {
  const [account, setAccount] = useState<UserAccount>(authService.getAccount());
  const [activeProfile, setActiveProfile] = useState<UserProfile>(authService.getActiveProfile());
  const [isOffline, setIsOffline] = useState<boolean>(offlineService.getOfflineMode());
  const [scrolled, setScrolled] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<CinemaTheme>(themeService.getTheme());
  const [currentServerId, setCurrentServerId] = useState<string>(getSavedServerId());

  useEffect(() => {
    const unsubAuth = authService.subscribe((acc) => {
      setAccount(acc);
      setActiveProfile(authService.getActiveProfile());
    });
    const unsubOffline = offlineService.subscribeOfflineMode((offline) => {
      setIsOffline(offline);
    });
    const unsubTheme = themeService.subscribe((theme) => {
      setCurrentTheme(theme);
    });

    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      unsubAuth();
      unsubOffline();
      unsubTheme();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleCycleTheme = () => {
    const themes: CinemaTheme[] = ['noir', 'criterion', 'sapphire'];
    const nextIndex = (themes.indexOf(currentTheme) + 1) % themes.length;
    themeService.setTheme(themes[nextIndex]);
  };

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'movies', label: 'Movies' },
    { id: 'series', label: 'Series' },
    { id: 'live', label: 'Live Cinema' },
    { id: 'mylist', label: 'Watchlist' },
  ];

  const activeServerObj = EMBED_SERVERS.find((s) => s.id === currentServerId);
  const serverLabel = currentServerId === 'hls-ultra' ? 'HLS Master' : (activeServerObj?.label?.split(' ')[0] || 'Vidking');

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-colors duration-300 ${
        scrolled
          ? 'bg-[#060608]/92 backdrop-blur-md border-b border-white/5 py-4'
          : 'bg-gradient-to-b from-[#060608]/90 via-[#060608]/40 to-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 flex items-center justify-between">
        {/* Zone 1: Brand Wordmark (Single text element in Cormorant Garamond display face) */}
        <button
          onClick={() => onNavigate('home')}
          className="text-2xl sm:text-3xl font-serif tracking-tight text-white focus:outline-none cursor-pointer select-none"
        >
          Watchy<span className="text-amber-400">.</span>
        </button>

        {/* Zone 2: 4-6 Clean Text Navigation Links (Strictly single-line unboxed text) */}
        <nav className="hidden md:flex items-center gap-8 text-sm">
          {navLinks.map((link) => {
            const isActive = currentPage === link.id;
            return (
              <button
                key={link.id}
                onClick={() => onNavigate(link.id)}
                className={`transition-colors whitespace-nowrap cursor-pointer relative py-1 ${
                  isActive
                    ? 'text-white font-medium'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute -bottom-1 left-0 right-0 h-[1.5px] bg-amber-400/90 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Actions (Server Status, Theme, Search, Profile) */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Action: Server Studio Drawer Trigger */}
          {onOpenServerStudio && (
            <button
              onClick={onOpenServerStudio}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs text-zinc-300 transition-colors cursor-pointer"
              title="Configure streaming source providers"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-[11px] text-zinc-400">Source:</span>
              <span className="font-medium text-white">{serverLabel}</span>
            </button>
          )}

          {/* Action: Cinema Palette Theme Switcher */}
          <button
            onClick={handleCycleTheme}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            title={`Current theme: ${currentTheme.toUpperCase()}. Click to cycle.`}
            aria-label="Cycle theme"
          >
            <Palette className="w-4 h-4 text-zinc-300" />
          </button>

          {/* Action: Search */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 text-zinc-400 hover:text-white text-xs sm:text-sm transition-colors cursor-pointer"
            aria-label="Search titles"
          >
            <Search className="w-4 h-4 text-zinc-300" />
            <span className="hidden sm:inline">Search</span>
          </button>

          {/* Action: User Profile */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-1 rounded-full focus:outline-none transition cursor-pointer"
              aria-label="Account menu"
            >
              <img
                src={activeProfile.avatar}
                alt={activeProfile.name}
                className="w-7 h-7 rounded-full object-cover ring-1 ring-white/20 hover:ring-amber-400/60 transition"
              />
              <ChevronDown className="w-3 h-3 text-zinc-400 hidden sm:block" />
            </button>

            {/* Profile Menu Dropdown */}
            {showProfileMenu && (
              <div
                className="absolute right-0 mt-3 w-64 glass-dropdown rounded-2xl p-2 z-50 text-xs shadow-2xl animate-fade-in"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-3 py-2.5 border-b border-white/10">
                  <p className="font-semibold text-white text-sm truncate">{account.username}</p>
                  <p className="text-[11px] text-zinc-400">{account.email}</p>
                </div>

                <div className="py-2">
                  <p className="px-3 py-1 text-[10px] uppercase tracking-wider text-zinc-500 font-medium">
                    Profiles
                  </p>
                  {account.profiles.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        authService.switchProfile(p.id);
                        setShowProfileMenu(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/10 text-left transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={p.avatar}
                          alt={p.name}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                        <span className="text-zinc-200 font-medium">{p.name}</span>
                        {p.isKid && (
                          <span className="text-[10px] text-zinc-400">· Kids</span>
                        )}
                      </div>
                      {p.id === activeProfile.id && (
                        <Check className="w-3.5 h-3.5 text-amber-400" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Secondary Preferences in Menu */}
                <div className="pt-2 border-t border-white/10 flex flex-col gap-1">
                  {onOpenServerStudio && (
                    <button
                      onClick={() => {
                        onOpenServerStudio();
                        setShowProfileMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-zinc-300 hover:text-white hover:bg-white/10 transition flex items-center justify-between cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Server className="w-3.5 h-3.5 text-zinc-400" />
                        Server Studio (14 Nodes)
                      </span>
                      <span className="text-[10px] text-emerald-400 font-mono">Active</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      onNavigate('offline');
                      setShowProfileMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-zinc-300 hover:text-white hover:bg-white/10 transition flex items-center justify-between cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <HardDrive className="w-3.5 h-3.5 text-zinc-400" />
                      Offline Vault
                    </span>
                    {isOffline && (
                      <span className="text-[10px] text-amber-400 font-mono">Offline</span>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      onToggleMobileDeviceView();
                      setShowProfileMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-zinc-300 hover:text-white hover:bg-white/10 transition flex items-center justify-between cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      {isMobileDeviceView ? (
                        <Monitor className="w-3.5 h-3.5 text-zinc-400" />
                      ) : (
                        <Smartphone className="w-3.5 h-3.5 text-zinc-400" />
                      )}
                      {isMobileDeviceView ? 'Switch to Cinema View' : 'Mobile Frame Preview'}
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onOpenAuth();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-zinc-300 hover:text-white hover:bg-white/10 transition flex items-center gap-2 cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5 text-zinc-400" />
                    Account Settings
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};


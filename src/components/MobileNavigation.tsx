import React from 'react';
import { Home, Film, Radio, Bookmark, User, Search } from 'lucide-react';

interface MobileNavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onOpenSearch: () => void;
  onOpenAuth: () => void;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  currentPage,
  onNavigate,
  onOpenSearch,
  onOpenAuth,
}) => {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'movies', label: 'Movies', icon: Film },
    { id: 'live', label: 'Live', icon: Radio },
    { id: 'mylist', label: 'Saved', icon: Bookmark },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#060608]/95 backdrop-blur-xl border-t border-white/5 px-2 py-2 safe-area-bottom">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const isActive = currentPage === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 relative transition-colors cursor-pointer ${
                isActive ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-1 font-light tracking-wide">{tab.label}</span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-amber-400 mt-0.5" />
              )}
            </button>
          );
        })}

        {/* Search Action */}
        <button
          onClick={onOpenSearch}
          className="flex flex-col items-center justify-center py-1 px-3 text-zinc-500 hover:text-zinc-300 cursor-pointer"
        >
          <Search className="w-5 h-5" />
          <span className="text-[10px] mt-1 font-light tracking-wide">Search</span>
        </button>

        {/* Profile Action */}
        <button
          onClick={onOpenAuth}
          className="flex flex-col items-center justify-center py-1 px-3 text-zinc-500 hover:text-zinc-300 cursor-pointer"
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] mt-1 font-light tracking-wide">Account</span>
        </button>
      </div>
    </nav>
  );
};

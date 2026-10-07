import React, { useState } from 'react';
import { 
  X, 
  User, 
  Shield, 
  Lock, 
  Sparkles, 
  Check, 
  Plus, 
  Crown, 
  Tv, 
  DownloadCloud, 
  Layers,
  ArrowRight
} from 'lucide-react';
import { authService } from '../../services/authService';
import { UserAccount, UserProfile } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [account, setAccount] = useState<UserAccount>(authService.getAccount());
  const [activeTab, setActiveTab] = useState<'profiles' | 'upgrade' | 'account'>('profiles');
  const [newProfileName, setNewProfileName] = useState('');
  const [isKidProfile, setIsKidProfile] = useState(false);
  const [pinCode, setPinCode] = useState('');
  const [showAddProfileForm, setShowAddProfileForm] = useState(false);
  const [loginEmail, setLoginEmail] = useState(account.email);
  const [loginName, setLoginName] = useState(account.username);

  const [authNotice, setAuthNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectProfile = (profile: UserProfile) => {
    authService.switchProfile(profile.id);
    setAuthNotice(`Switched to profile: ${profile.name}`);
    setTimeout(() => {
      onClose();
    }, 400);
  };

  const handleCreateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;

    authService.addProfile(newProfileName.trim(), isKidProfile, pinCode.trim() || undefined);
    setAccount(authService.getAccount());
    setNewProfileName('');
    setIsKidProfile(false);
    setPinCode('');
    setShowAddProfileForm(false);
    setAuthNotice('Profile created successfully.');
  };

  const handleUpgrade = (plan: 'Pro 4K Cinema Pass' | 'Studio VIP') => {
    authService.upgradePlan(plan);
    setAccount(authService.getAccount());
    setAuthNotice(`Upgraded to ${plan}! 4K UHD and Multi-Watch unlocked.`);
  };

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    authService.login(loginEmail, loginName);
    setAccount(authService.getAccount());
    setAuthNotice('Account details updated.');
    setTimeout(() => {
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      <div className="w-full max-w-2xl glass-dropdown rounded-3xl border border-white/10 overflow-hidden shadow-2xl animate-scale-up">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <Crown className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Watchy Account & Profiles
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {authNotice && (
          <div className="px-6 py-2 bg-amber-400/10 border-b border-amber-400/20 text-xs text-amber-300 flex items-center justify-between animate-fade-in">
            <span>{authNotice}</span>
            <button onClick={() => setAuthNotice(null)} className="text-zinc-400 hover:text-white">✕</button>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex border-b border-white/10 bg-black/40 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('profiles')}
            className={`flex-1 py-3 text-center border-b-2 transition cursor-pointer ${
              activeTab === 'profiles'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            Who's Watching (Profiles)
          </button>
          <button
            onClick={() => setActiveTab('upgrade')}
            className={`flex-1 py-3 text-center border-b-2 transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'upgrade'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Cinema Pass Perks
          </button>
          <button
            onClick={() => setActiveTab('account')}
            className={`flex-1 py-3 text-center border-b-2 transition cursor-pointer ${
              activeTab === 'account'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            Account Details
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {activeTab === 'profiles' && (
            <div>
              <p className="text-zinc-400 text-xs mb-6 text-center">
                Select your personalized profile to sync watchlist, history, and preferred bitrate.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                {account.profiles.map((p) => {
                  const isActive = p.id === account.activeProfileId;
                  return (
                    <div
                      key={p.id}
                      onClick={() => handleSelectProfile(p)}
                      className={`flex flex-col items-center p-4 rounded-2xl border transition group cursor-pointer ${
                        isActive
                          ? 'bg-amber-500/20 border-amber-400/50 shadow-lg shadow-amber-500/10'
                          : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="relative mb-3">
                        <img
                          src={p.avatar}
                          alt={p.name}
                          className="w-16 h-16 rounded-2xl object-cover ring-2 ring-white/10 group-hover:scale-105 transition-transform"
                        />
                        {p.isKid && (
                          <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[9px] bg-emerald-500 text-black font-extrabold rounded-full">
                            KIDS
                          </span>
                        )}
                        {p.pin && (
                          <span className="absolute -bottom-1 -right-1 p-1 bg-zinc-900 rounded-full text-zinc-400 ring-1 ring-white/20">
                            <Lock className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-white group-hover:text-amber-300 transition">
                        {p.name}
                      </span>
                      {isActive && (
                        <span className="text-[10px] font-mono text-amber-400 mt-0.5">
                          Active Profile
                        </span>
                      )}
                    </div>
                  );
                })}

                {/* Add Profile Tile */}
                {!showAddProfileForm && (
                  <button
                    onClick={() => setShowAddProfileForm(true)}
                    className="flex flex-col items-center justify-center p-4 rounded-2xl border border-dashed border-white/20 hover:border-amber-400/50 hover:bg-white/5 transition cursor-pointer text-zinc-400 hover:text-white group"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                      <Plus className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-semibold">Add Profile</span>
                  </button>
                )}
              </div>

              {/* Add Profile Drawer */}
              {showAddProfileForm && (
                <form onSubmit={handleCreateProfile} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                  <h4 className="text-sm font-bold text-white">Create New Profile</h4>
                  <input
                    type="text"
                    value={newProfileName}
                    onChange={(e) => setNewProfileName(e.target.value)}
                    placeholder="Profile name (e.g. Cinema Room, Guest)"
                    className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-xs text-white"
                  />
                  <div className="flex items-center justify-between text-xs text-zinc-300 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isKidProfile}
                        onChange={(e) => setIsKidProfile(e.target.checked)}
                        className="rounded text-amber-500"
                      />
                      <span>Kids Mode (Filters mature ratings)</span>
                    </label>

                    {isKidProfile && (
                      <input
                        type="password"
                        maxLength={4}
                        value={pinCode}
                        onChange={(e) => setPinCode(e.target.value)}
                        placeholder="4-digit PIN"
                        className="w-24 px-2 py-1 bg-black border border-white/20 rounded text-center text-xs text-white"
                      />
                    )}
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddProfileForm(false)}
                      className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!newProfileName.trim()}
                      className="px-4 py-1.5 rounded-lg bg-amber-400 text-black font-bold text-xs"
                    >
                      Save Profile
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {activeTab === 'upgrade' && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/20 via-amber-500/5 to-transparent border border-amber-500/30">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-extrabold">
                      ACTIVE TIER
                    </span>
                    <h3 className="text-xl font-extrabold text-white">{account.plan}</h3>
                  </div>
                  <span className="p-3 rounded-2xl bg-amber-400 text-black">
                    <Sparkles className="w-6 h-6" />
                  </span>
                </div>
                <p className="text-xs text-zinc-300">
                  Full access to adaptive high-definition HLS pipelines, multi-player engines, and offline caching.
                </p>
              </div>

              {/* Perks List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {[
                  { icon: Tv, title: '4K Ultra Cinema Master', desc: 'Up to 2160p 60fps AV1/HEVC streams with zero throttling' },
                  { icon: Layers, title: 'Dual Multi-Watch Engine', desc: 'Watch 2 streams side-by-side or picture-in-picture' },
                  { icon: DownloadCloud, title: 'Offline Vault Cache', desc: 'Download whole films and binge series for flights' },
                  { icon: Shield, title: 'Parental PIN Control', desc: 'Lock kids profiles with 4-digit code protection' },
                ].map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-white/5 border border-white/5 flex gap-3">
                    <item.icon className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-white">{item.title}</h4>
                      <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => handleUpgrade('Pro 4K Cinema Pass')}
                  className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs shadow-lg shadow-amber-400/20 flex items-center gap-1.5 cursor-pointer"
                >
                  Confirm Pro Cinema Pass
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'account' && (
            <form onSubmit={handleSaveAccount} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Display Name</label>
                <input
                  type="text"
                  value={loginName}
                  onChange={(e) => setLoginName(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Email Address</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-2 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => {
                    authService.logout();
                    setAccount(authService.getAccount());
                    onClose();
                  }}
                  className="text-red-400 hover:underline"
                >
                  Sign Out / Reset to Guest
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-400 text-black font-bold"
                >
                  Save Profile Settings
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

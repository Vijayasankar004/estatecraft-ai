import React, { useState, useRef, useEffect } from 'react';
import { 
  Building2, 
  Search, 
  Settings, 
  RotateCcw, 
  Award, 
  User, 
  LogOut, 
  ChevronDown, 
  ShieldCheck, 
  Briefcase, 
  MapPin,
  Sparkles,
  Sun,
  Moon,
  Camera,
  UploadCloud,
  Link2,
  Check,
  Globe
} from 'lucide-react';
import { AVATAR_PRESETS } from '../data/userProfiles';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  inventoryCount, 
  onOpenSettings, 
  onResetInventory,
  onOpenDemoScript,
  currentUser,
  onOpenAuth,
  onLogout,
  onUpdateUser,
  onSelectDemoProfile,
  theme = 'dark',
  onToggleTheme,
  language = 'en',
  onLanguageChange,
  supportedLanguages = [],
  t = (k, f) => f || k
}) {
  const hasCustomKey = Boolean(localStorage.getItem('gemini_api_key'));
  const [isLiveMode, setIsLiveMode] = useState(true);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isEditingPhoto, setIsEditingPhoto] = useState(false);
  const [photoUrlInput, setPhotoUrlInput] = useState('');
  const [photoFeedback, setPhotoFeedback] = useState('');
  const fileInputRef = useRef(null);
  const dropdownRef = useRef(null);
  const langMenuRef = useRef(null);

  const toggleMode = () => {
    setIsLiveMode(prev => !prev);
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setPhotoFeedback('File must be under 5MB');
        setTimeout(() => setPhotoFeedback(''), 2500);
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result === 'string' && onUpdateUser) {
          onUpdateUser({ avatar: result });
          setPhotoFeedback('Photo updated!');
          setTimeout(() => setPhotoFeedback(''), 2500);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApplyUrlPhoto = () => {
    if (photoUrlInput.trim().startsWith('http') && onUpdateUser) {
      onUpdateUser({ avatar: photoUrlInput.trim() });
      setPhotoUrlInput('');
      setPhotoFeedback('Photo updated!');
      setTimeout(() => setPhotoFeedback(''), 2500);
    }
  };

  const handleSelectPreset = (url) => {
    if (onUpdateUser) {
      onUpdateUser({ avatar: url });
      setPhotoFeedback('Photo updated!');
      setTimeout(() => setPhotoFeedback(''), 2500);
    }
  };

  // Close profile and language dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
      if (langMenuRef.current && !langMenuRef.current.contains(event.target)) {
        setIsLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLangObj = supportedLanguages.find(l => l.code === language) || { code: 'en', name: 'English', native: 'English', flag: '🌐' };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950 font-black text-xl">
            🏛️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 dark:text-white text-lg tracking-tight font-serif">
                EstateCraft <span className="text-emerald-500 font-sans font-bold text-sm">AI</span>
              </span>
              
              {/* LIVE / DEMO MODE BADGE */}
              <button
                type="button"
                onClick={toggleMode}
                className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                  isLiveMode 
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                    : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/25'
                }`}
                title="Click to toggle Live vs Demo mode"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isLiveMode ? 'bg-emerald-500 dark:bg-emerald-400 animate-pulse' : 'bg-amber-500 dark:bg-amber-400'}`} />
                <span>{isLiveMode ? t('liveMode', 'Live Mode') : t('demoMode', 'Demo Mode')}</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:block">
              {t('tagline', 'Listing Description & Conversational Match Engine')}
            </p>
          </div>
        </div>

        {/* Center: Navigation Bar with Agent Portal vs Buyer Matcher Tabs */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTab('agent')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'agent'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/50'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>{t('agentPortal', 'Agent Portal')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('buyer')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'buyer'
                ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/50'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>{t('buyerMatcher', 'Buyer Matcher')}</span>
          </button>
        </div>

        {/* Right Controls: User Account + Demo Script + Theme Toggle + Inventory */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          
          {/* USER / AGENT ACCOUNT BUTTON & DROPDOWN */}
          <div className="relative" ref={dropdownRef}>
            {currentUser ? (
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen(prev => !prev)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-sm transition"
              >
                <img
                  src={currentUser.avatar || "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=256&q=80"}
                  alt={currentUser.name}
                  className="w-6 h-6 rounded-full object-cover ring-1 ring-emerald-500"
                />
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1 leading-none">
                    <span>{currentUser.name.split(' ')[0]}</span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono uppercase ${
                      currentUser.role === 'agent' 
                        ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30' 
                        : 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30'
                    }`}>
                      {currentUser.role === 'agent' ? 'Agent' : 'Buyer'}
                    </span>
                  </div>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs transition shadow-md shadow-emerald-500/20"
              >
                <User className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('signIn', 'Sign In / Create Account')}</span>
                <span className="sm:hidden">{t('signIn', 'Sign In')}</span>
              </button>
            )}

            {/* Profile Dropdown Menu */}
            {currentUser && isProfileMenuOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/90 shadow-2xl p-4 space-y-3 animate-fadeIn z-50 text-xs text-slate-700 dark:text-slate-200">
                {/* Profile header */}
                <div className="flex items-start gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="relative group shrink-0">
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-12 h-12 rounded-2xl object-cover ring-2 ring-emerald-500/50 shadow-md"
                    />
                    <label
                      className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center cursor-pointer text-white text-[9px] font-bold"
                      title="Upload New Photo"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Edit</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="overflow-hidden flex-1">
                    <div className="font-bold text-sm text-slate-900 dark:text-white truncate">{currentUser.name}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{currentUser.email}</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full font-semibold ${
                        currentUser.role === 'agent' 
                          ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30' 
                          : 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30'
                      }`}>
                        {currentUser.role === 'agent' ? '🏢 Verified Agent' : '👤 Home Buyer'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsEditingPhoto(prev => !prev)}
                        className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
                      >
                        <Camera className="w-2.5 h-2.5" />
                        <span>{isEditingPhoto ? '✕' : t('changePhoto', 'Change Photo')}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Inline Photo Editor when toggled or edit button clicked */}
                {isEditingPhoto && (
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-emerald-500" />
                        Update Profile Picture:
                      </span>
                      {photoFeedback && (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[10px] flex items-center gap-1">
                          <Check className="w-3 h-3" /> {photoFeedback}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer flex-1 py-1.5 px-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition text-center flex items-center justify-center gap-1.5">
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>{t('uploadPhoto', 'Upload from Computer')}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <div className="flex items-center gap-1.5 pt-0.5">
                      <input
                        type="url"
                        value={photoUrlInput}
                        onChange={(e) => setPhotoUrlInput(e.target.value)}
                        placeholder="Or paste URL: https://..."
                        className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-[11px] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleApplyUrlPhoto}
                        className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-700 dark:text-slate-300 text-[11px] font-bold transition"
                      >
                        {t('apply', 'Apply')}
                      </button>
                    </div>

                    <div className="pt-1.5 border-t border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Quick Presets:</div>
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                        {AVATAR_PRESETS.map((preset) => (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => handleSelectPreset(preset.url)}
                            title={preset.label}
                            className={`rounded-lg p-0.5 border transition shrink-0 ${
                              currentUser.avatar === preset.url
                                ? 'border-emerald-500 ring-1 ring-emerald-500'
                                : 'border-transparent hover:border-slate-300 dark:hover:border-slate-700'
                            }`}
                          >
                            <img
                              src={preset.url}
                              alt={preset.label}
                              className="w-7 h-7 rounded-md object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Role Details */}
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                  {currentUser.role === 'agent' ? (
                    <>
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                        <Briefcase className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="truncate">{currentUser.agency || "Sotheby's Realty"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        <span>RERA ID: {currentUser.reraNumber || "A51900018420"}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                        <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Target: {currentUser.targetCity || "Mumbai / Bengaluru"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                        <Award className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Budget: {currentUser.budgetRange || "₹5 Cr - ₹15 Cr"}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Fast Role Switching for Demos */}
                <div className="space-y-1 pt-1 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Quick Profile Switch:</span>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectDemoProfile(currentUser.role === 'agent' ? 'buyer' : 'agent');
                      setIsProfileMenuOpen(false);
                    }}
                    className="w-full text-left p-2 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs flex items-center justify-between transition"
                  >
                    <span>Switch to {currentUser.role === 'agent' ? 'Buyer (Ananya)' : 'Agent (Vikram)'}</span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  </button>
                </div>

                {/* Sign Out Button */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onOpenAuth();
                    }}
                    className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
                  >
                    {t('switchAccount', 'Switch Account')}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onLogout();
                    }}
                    className="flex items-center gap-1 text-xs text-rose-500 hover:text-rose-600 font-medium"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>{t('signOut', 'Sign Out')}</span>
                  </button>
                </div>

              </div>
            )}
          </div>

          {/* 2-Minute Demo Script Button */}
          <button
            type="button"
            onClick={onOpenDemoScript}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-bold transition shadow-sm"
            title="Open 2-minute interactive demo walkthrough"
          >
            <Award className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden md:inline">{t('demoGuide', 'Demo Guide')}</span>
          </button>

          {/* LANGUAGE SELECTOR */}
          <div className="relative" ref={langMenuRef}>
            <button
              type="button"
              onClick={() => setIsLangMenuOpen(prev => !prev)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 shadow-sm"
              title="Change Language / भाषा बदलें"
              aria-label="Change Language"
            >
              <Globe className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="text-sm leading-none">{currentLangObj.flag}</span>
              <span className="font-semibold hidden xl:inline">{currentLangObj.native}</span>
              <span className="font-bold text-[10px] uppercase xl:hidden">{currentLangObj.code}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isLangMenuOpen && (
              <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/90 shadow-2xl p-2 space-y-1 animate-fadeIn z-50 text-xs">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Select Language
                </div>
                <div className="max-h-64 overflow-y-auto space-y-0.5 custom-scrollbar">
                  {supportedLanguages.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        onLanguageChange(lang.code);
                        setIsLangMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl transition text-left ${
                        language === lang.code
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base leading-none">{lang.flag}</span>
                        <div className="flex flex-col">
                          <span className="text-xs font-medium leading-tight">{lang.native}</span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">{lang.name}</span>
                        </div>
                      </div>
                      {language === lang.code && (
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* THEME TOGGLE (DARK / LIGHT) */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="flex items-center justify-center w-9 h-9 rounded-xl border transition-all text-xs dark:bg-slate-900 dark:hover:bg-slate-800 dark:border-slate-800 dark:text-amber-300 bg-white hover:bg-slate-100 border-slate-200 text-indigo-600 shadow-sm"
            title={theme === 'dark' ? t('switchToLight', 'Switch to Light Mode') : t('switchToDark', 'Switch to Dark Mode')}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 transition-transform hover:rotate-45 duration-300" />
            ) : (
              <Moon className="w-4 h-4 transition-transform hover:-rotate-12 duration-300" />
            )}
          </button>

          {/* Inventory Count */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
            <span className="text-slate-500 dark:text-slate-400">{t('listings', 'Listings')}:</span>
            <span className="font-bold text-slate-900 dark:text-white font-mono">{inventoryCount}</span>
          </div>

          {/* Reset button */}
          <button
            type="button"
            onClick={onResetInventory}
            className="hidden sm:flex items-center gap-1 p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs transition"
            title="Reset to 10 curated Indian seed listings"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* AI Settings */}
          <button
            type="button"
            onClick={onOpenSettings}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
              hasCustomKey
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                : 'bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
            }`}
            title="Configure AI Engine / Gemini Key"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {hasCustomKey ? 'Gemini Live' : 'AI Engine'}
            </span>
          </button>

        </div>

      </div>
    </header>
  );
}

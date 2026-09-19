import React, { useState } from 'react';
import { 
  Building2, 
  User, 
  Mail, 
  Lock, 
  Phone, 
  Award, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  Briefcase,
  MapPin,
  X,
  Camera,
  UploadCloud,
  Link2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DEMO_ACCOUNTS, AVATAR_PRESETS } from '../data/userProfiles';

export default function AuthModal({ isOpen, onClose, onLoginSuccess }) {
  const [authMode, setAuthMode] = useState('signup'); // 'signup' | 'signin'
  const [selectedRole, setSelectedRole] = useState('agent'); // 'agent' | 'buyer'

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  
  // Profile Picture state
  const [avatar, setAvatar] = useState('https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=256&q=80');
  const [isCustomUrlMode, setIsCustomUrlMode] = useState(false);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');

  // Agent specific
  const [agency, setAgency] = useState('');
  const [reraNumber, setReraNumber] = useState('');

  // Buyer specific
  const [targetCity, setTargetCity] = useState('Mumbai');
  const [budgetRange, setBudgetRange] = useState('₹5 Cr - ₹15 Cr');

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    // If using default presets, switch default avatar to match role
    if (role === 'agent' && avatar.includes('photo-1573496359142-b8d87734a5a2')) {
      setAvatar('https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=256&q=80');
    } else if (role === 'buyer' && avatar.includes('photo-1560250097-0b93528c311a')) {
      setAvatar('https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image file must be under 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result === 'string') {
          setAvatar(result);
          setError('');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please fill in your email and password.');
      return;
    }

    if (authMode === 'signup' && !name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);

      const userProfile = {
        id: `usr_${Date.now()}`,
        name: name || (selectedRole === 'agent' ? 'Licensed Real Estate Agent' : 'Valued Home Buyer'),
        email: email.trim(),
        role: selectedRole,
        phone: phone || '+91 98000 00000',
        agency: selectedRole === 'agent' ? (agency || 'Premier Realty Partners') : undefined,
        reraNumber: selectedRole === 'agent' ? (reraNumber || 'RERA/MH/2026/0491') : undefined,
        targetCity: selectedRole === 'buyer' ? targetCity : undefined,
        budgetRange: selectedRole === 'buyer' ? budgetRange : undefined,
        avatar: avatar || (selectedRole === 'agent' 
          ? 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=256&q=80'
          : 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80'),
        createdAt: new Date().toISOString()
      };

      // Notify backend if online
      fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userProfile)
      }).catch(() => {});

      try {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      } catch (e) {}

      onLoginSuccess(userProfile);
      onClose();
    }, 600);
  };

  const handleDemoLogin = (role) => {
    const demoUser = DEMO_ACCOUNTS[role];
    try {
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
    } catch (e) {}
    onLoginSuccess(demoUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 dark:bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3 h-3" /> User & Agent Portal
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
            {authMode === 'signup' ? 'Create Your Account' : 'Welcome Back'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {authMode === 'signup' 
              ? 'Join EstateCraft AI to manage listings or discover dream homes.'
              : 'Sign in to access your listings, favorited homes, and tour requests.'}
          </p>
        </div>

        {/* 1-Click Demo Logins for Fast Exploration / Presentation */}
        <div className="p-3.5 rounded-2xl bg-amber-500/10 dark:bg-slate-950/80 border border-amber-500/30 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-amber-700 dark:text-amber-300">
            <span className="flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              1-Click Demo Profiles:
            </span>
            <span className="text-[10px] text-amber-600 dark:text-amber-400/80 font-mono">Instant sign in</span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleDemoLogin('agent')}
              className="p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-left transition group"
            >
              <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                <Building2 className="w-3 h-3" /> Login as Agent
              </div>
              <div className="text-[10px] text-slate-600 dark:text-slate-400 truncate mt-0.5">Vikram Malhotra</div>
              <div className="text-[9px] text-emerald-600 dark:text-emerald-400/80 font-mono">Sotheby's Realty</div>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('buyer')}
              className="p-2.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-left transition group"
            >
              <div className="text-xs font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                <User className="w-3 h-3" /> Login as Buyer
              </div>
              <div className="text-[10px] text-slate-600 dark:text-slate-400 truncate mt-0.5">Ananya Sharma</div>
              <div className="text-[9px] text-indigo-600 dark:text-indigo-400/80 font-mono">Tech Exec • Bengaluru</div>
            </button>
          </div>
        </div>

        {/* Tab Switcher: Sign Up vs Sign In */}
        <div className="flex rounded-xl bg-slate-100 dark:bg-slate-950 p-1 border border-slate-200 dark:border-slate-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => setAuthMode('signup')}
            className={`flex-1 py-2 rounded-lg transition-all ${
              authMode === 'signup'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={() => setAuthMode('signin')}
            className={`flex-1 py-2 rounded-lg transition-all ${
              authMode === 'signin'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Sign In
          </button>
        </div>

        {/* Account Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* ROLE SELECTOR (SIGN UP MODE) */}
          {authMode === 'signup' && (
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                I Am Registering As:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleRoleChange('agent')}
                  className={`p-3 rounded-2xl border flex flex-col items-start gap-1 transition ${
                    selectedRole === 'agent'
                      ? 'bg-emerald-500/15 border-emerald-500 text-slate-900 dark:text-white shadow-lg shadow-emerald-500/10'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Building2 className={`w-4 h-4 ${selectedRole === 'agent' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                    <span>Real Estate Agent</span>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">List & generate AI descriptions</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleChange('buyer')}
                  className={`p-3 rounded-2xl border flex flex-col items-start gap-1 transition ${
                    selectedRole === 'buyer'
                      ? 'bg-indigo-500/15 border-indigo-500 text-slate-900 dark:text-white shadow-lg shadow-indigo-500/10'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <User className={`w-4 h-4 ${selectedRole === 'buyer' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                    <span>Home Buyer / Client</span>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Search & match dream homes</span>
                </button>
              </div>
            </div>
          )}

          {/* PROFILE PICTURE PICKER & UPLOADER (SIGN UP MODE) */}
          {authMode === 'signup' && (
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Profile Picture
                </label>
                <span className="text-[10px] text-slate-500 font-mono">Upload or pick preset</span>
              </div>

              {/* Avatar preview + Action buttons */}
              <div className="flex items-center gap-3.5">
                <div className="relative group shrink-0">
                  <img
                    src={avatar}
                    alt="Profile Preview"
                    className="w-14 h-14 rounded-2xl object-cover ring-2 ring-emerald-500/40 shadow-md"
                  />
                  <label className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition flex items-center justify-center cursor-pointer text-white">
                    <Camera className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    {/* File Upload Button */}
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition">
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Upload Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>

                    {/* Or URL input toggle */}
                    <button
                      type="button"
                      onClick={() => setIsCustomUrlMode(prev => !prev)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition"
                    >
                      <Link2 className="w-3 h-3" />
                      <span>{isCustomUrlMode ? 'Hide URL' : 'Image URL'}</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500">Supports PNG, JPG, WebP from your device.</p>
                </div>
              </div>

              {/* Custom URL Input if toggled */}
              {isCustomUrlMode && (
                <div className="pt-1">
                  <input
                    type="url"
                    value={customAvatarUrl}
                    onChange={(e) => {
                      setCustomAvatarUrl(e.target.value);
                      if (e.target.value.trim().startsWith('http')) {
                        setAvatar(e.target.value.trim());
                      }
                    }}
                    placeholder="Paste image link: https://..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              )}

              {/* Clickable Preset Avatars */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-500 mb-1.5">Or select a quick preset:</div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {AVATAR_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setAvatar(preset.url);
                        setCustomAvatarUrl('');
                      }}
                      title={preset.label}
                      className={`relative rounded-xl p-0.5 border transition shrink-0 ${
                        avatar === preset.url 
                          ? 'border-emerald-500 ring-2 ring-emerald-500/30' 
                          : 'border-transparent hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.label}
                        className="w-8 h-8 rounded-lg object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Full Name (Sign Up Only) */}
          {authMode === 'signup' && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={selectedRole === 'agent' ? 'e.g. Vikram Malhotra' : 'e.g. Ananya Sharma'}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* AGENT ROLE SPECIFIC FIELDS */}
          {authMode === 'signup' && selectedRole === 'agent' && (
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200 dark:border-slate-800">
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Briefcase className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Agency / Brokerage
                </label>
                <input
                  type="text"
                  value={agency}
                  onChange={(e) => setAgency(e.target.value)}
                  placeholder="e.g. Sotheby's Realty"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> RERA / License ID
                </label>
                <input
                  type="text"
                  value={reraNumber}
                  onChange={(e) => setReraNumber(e.target.value)}
                  placeholder="e.g. A51900018420"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          {/* BUYER ROLE SPECIFIC FIELDS */}
          {authMode === 'signup' && selectedRole === 'buyer' && (
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200 dark:border-slate-800">
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-indigo-600 dark:text-indigo-400" /> Target City
                </label>
                <input
                  type="text"
                  value={targetCity}
                  onChange={(e) => setTargetCity(e.target.value)}
                  placeholder="e.g. Mumbai, Bengaluru"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Award className="w-3 h-3 text-indigo-600 dark:text-indigo-400" /> Budget Range
                </label>
                <input
                  type="text"
                  value={budgetRange}
                  onChange={(e) => setBudgetRange(e.target.value)}
                  placeholder="e.g. ₹5 Cr - ₹15 Cr"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>{authMode === 'signup' ? 'Create Account & Continue' : 'Sign In to Account'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}

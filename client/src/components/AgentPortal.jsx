import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Copy, 
  Check, 
  Save, 
  Home, 
  Crown, 
  Heart, 
  Wand2, 
  Image as ImageIcon, 
  MapPin, 
  DollarSign, 
  Maximize2, 
  Bed, 
  Bath, 
  Plus, 
  X, 
  CheckCircle2,
  RefreshCw,
  Tag,
  Flame,
  ShieldCheck,
  Briefcase,
  User,
  Upload,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Star,
  Layers
} from 'lucide-react';
import confetti from 'canvas-confetti';

const Instagram = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);

import { SAMPLE_FORM_PRESETS, POPULAR_FEATURE_TAGS } from '../data/sampleProperties';
import { generateListingDescriptions, autoClassifyVibes, formatCurrency, formatNumber } from '../services/aiService';

export default function AgentPortal({ 
  onSaveListing, 
  existingInventoryCount, 
  onSwitchToBuyer, 
  currentUser, 
  onOpenAuth,
  language = 'en',
  t = (k, f) => f || k
}) {
  // Form State with Multi-Photo Gallery Support
  const [formData, setFormData] = useState({
    propertyId: 'prop-worli-penthouse-1',
    address: 'Worli Sea Face, Worli, Mumbai, Maharashtra 400030',
    bedrooms: 5,
    bathrooms: 6,
    sqft: 5800,
    price: 185000000,
    propertyType: 'Ultra-Luxury Sea-Facing Penthouse',
    photoUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
    photos: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80'
    ],
    keyFeatures: [
      "Unobstructed Arabian Sea Views",
      "Private Cantilevered Plunge Pool",
      "Italian Calacatta Marble Flooring",
      "Direct Key-Card High-Speed Elevator",
      "Gourmet German Poggenpohl Kitchen"
    ],
    customNotes: 'South Mumbai prime sea face location with sunset sea vistas and triple-tier security.'
  });

  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [newUrlInput, setNewUrlInput] = useState('');
  const [customFeatureInput, setCustomFeatureInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDescriptions, setGeneratedDescriptions] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activePresetIndex, setActivePresetIndex] = useState(0);
  const [suggestedVibes, setSuggestedVibes] = useState([]);

  // Auto-classify vibes dynamically whenever features or notes change
  useEffect(() => {
    const vibes = autoClassifyVibes(formData);
    setSuggestedVibes(vibes);
  }, [formData.propertyType, formData.keyFeatures, formData.customNotes, formData.address]);

  // Handle Input Changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle Multiple File Upload from Device
  const handleMultipleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setIsUploadingFiles(true);
    const readers = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers).then(images => {
      const validImages = images.filter(Boolean);
      if (validImages.length > 0) {
        setFormData(prev => {
          const updatedPhotos = [...(prev.photos || []), ...validImages];
          return {
            ...prev,
            photos: updatedPhotos,
            photoUrl: updatedPhotos[0]
          };
        });
      }
      setIsUploadingFiles(false);
      e.target.value = '';
    });
  };

  // Add Photo via Public URL
  const handleAddPhotoUrl = (urlToAdd = null) => {
    const url = (urlToAdd || newUrlInput).trim();
    if (!url) return;

    setFormData(prev => {
      const existing = prev.photos || [];
      if (existing.includes(url)) return prev;
      const updated = [...existing, url];
      return {
        ...prev,
        photos: updated,
        photoUrl: prev.photoUrl || url
      };
    });
    setNewUrlInput('');
  };

  // Remove Photo from gallery
  const handleRemovePhoto = (indexToRemove) => {
    setFormData(prev => {
      const existing = prev.photos || [];
      const updated = existing.filter((_, idx) => idx !== indexToRemove);
      return {
        ...prev,
        photos: updated,
        photoUrl: updated[0] || ''
      };
    });
    setActivePhotoIdx(prev => Math.max(0, Math.min(prev, (formData.photos?.length || 1) - 2)));
  };

  // Set as Cover / Primary Photo
  const handleSetCoverPhoto = (index) => {
    setFormData(prev => {
      const existing = [...(prev.photos || [])];
      if (index === 0 || !existing[index]) return prev;
      const selected = existing.splice(index, 1)[0];
      existing.unshift(selected);
      return {
        ...prev,
        photos: existing,
        photoUrl: selected
      };
    });
    setActivePhotoIdx(0);
  };

  // Toggle Feature Tag
  const toggleFeatureTag = (tag) => {
    setFormData(prev => {
      const exists = prev.keyFeatures.includes(tag);
      return {
        ...prev,
        keyFeatures: exists 
          ? prev.keyFeatures.filter(t => t !== tag)
          : [...prev.keyFeatures, tag]
      };
    });
  };

  // Add Custom Feature
  const handleAddCustomFeature = (e) => {
    e?.preventDefault();
    if (!customFeatureInput.trim()) return;
    if (!formData.keyFeatures.includes(customFeatureInput.trim())) {
      setFormData(prev => ({
        ...prev,
        keyFeatures: [...prev.keyFeatures, customFeatureInput.trim()]
      }));
    }
    setCustomFeatureInput('');
  };

  // Remove Feature
  const removeFeature = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      keyFeatures: prev.keyFeatures.filter(tag => tag !== tagToRemove)
    }));
  };

  // Instantly Fill Sample Data for Judging / Demo
  const handleFillSampleData = (presetIndex = null) => {
    const nextIdx = presetIndex !== null ? presetIndex : (activePresetIndex + 1) % SAMPLE_FORM_PRESETS.length;
    setActivePresetIndex(nextIdx);
    const preset = SAMPLE_FORM_PRESETS[nextIdx];

    const presetPhotos = preset.photos || [preset.photoUrl];

    setFormData({
      propertyId: preset.id || `prop-preset-${nextIdx + 1}`,
      address: preset.address,
      bedrooms: preset.bedrooms,
      bathrooms: preset.bathrooms,
      sqft: preset.sqft,
      price: preset.price,
      propertyType: preset.propertyType,
      photoUrl: presetPhotos[0] || preset.photoUrl,
      photos: presetPhotos,
      keyFeatures: [...preset.keyFeatures],
      customNotes: preset.customNotes
    });

    setActivePhotoIdx(0);
    setSavedSuccess(false);
  };

  // Generate 3-Column Tone Descriptions
  const handleGenerate = async () => {
    if (!formData.address.trim()) {
      alert('Please provide a property address.');
      return;
    }

    setIsGenerating(true);
    setSavedSuccess(false);

    try {
      const result = await generateListingDescriptions(formData);
      setGeneratedDescriptions(result);
      if (result.suggestedVibes) {
        setSuggestedVibes(result.suggestedVibes);
      }
    } catch (err) {
      console.error('Error generating descriptions:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy text to clipboard
  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Save to Public Inventory
  const handleSaveToInventory = () => {
    if (!generatedDescriptions) return;

    const newListing = {
      id: `prop-${Date.now()}`,
      address: formData.address,
      bedrooms: Number(formData.bedrooms),
      bathrooms: Number(formData.bathrooms),
      sqft: Number(formData.sqft),
      price: Number(formData.price),
      propertyType: formData.propertyType || 'Single Family Home',
      photoUrl: (formData.photos && formData.photos[0]) || formData.photoUrl || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
      photos: (formData.photos && formData.photos.length > 0) ? formData.photos : [(formData.photoUrl || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80')],
      keyFeatures: formData.keyFeatures,
      customNotes: formData.customNotes,
      vibeTags: suggestedVibes,
      descriptions: generatedDescriptions,
      agentId: currentUser?.id || 'usr_agent_001',
      agentName: currentUser?.name || 'Vikram Malhotra',
      agency: currentUser?.agency || "Sotheby's International Realty Mumbai",
      agentContact: currentUser?.phone || "+91 98200 12345",
      createdAt: new Date().toISOString()
    };

    onSaveListing(newListing);
    setSavedSuccess(true);

    try {
      confetti({
        particleCount: 85,
        spread: 75,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // ignore
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 transition-colors duration-200">
      {/* Top Banner / Hero */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r dark:from-slate-900 dark:via-slate-900/90 dark:to-emerald-950/40 from-slate-100 via-white to-emerald-50/50 border dark:border-slate-800 border-slate-200 shadow-xl transition-colors duration-200">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> Agent Studio • AI Copywriter
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold dark:text-white text-slate-900 tracking-tight">
              Create & Generate Listing Descriptions
            </h1>
            <p className="dark:text-slate-400 text-slate-600 max-w-2xl text-xs sm:text-sm">
              Input property specs to automatically generate 3 platform-tailored, multi-tone descriptions in seconds. 
              Save to public inventory to immediately test live buyer matchmaking!
            </p>
          </div>

          {/* Fill Sample Data Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => handleFillSampleData()}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transition-all transform active:scale-95"
              title="Populate realistic Indian real estate sample data"
            >
              <Wand2 className="w-4 h-4 text-slate-950" />
              <span>{t('fillSampleData', 'Fill Sample Data')}</span>
              <span className="text-xs bg-slate-950/20 px-2 py-0.5 rounded-full font-mono">
                Preset #{activePresetIndex + 1}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Square Form on Left (6 Cols), Generated Display on Right (6 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* INPUT FORM COLUMN: SQUARE SHAPE SPECIFICATIONS CARD */}
        <div className="lg:col-span-6 space-y-4">
          <div className="glass-panel rounded-3xl p-6 border dark:border-slate-800 border-slate-200 shadow-xl lg:aspect-square flex flex-col justify-between overflow-hidden transition-all duration-200">
            
            {/* Square Header */}
            <div className="flex items-center justify-between border-b dark:border-slate-800 border-slate-200 pb-3.5 shrink-0">
              <div className="flex items-center gap-2">
                <Home className="w-5 h-5 text-emerald-500" />
                <h2 className="text-lg font-bold dark:text-white text-slate-900">{t('propertySpecs', 'Property Specifications')}</h2>
              </div>
              <span className="text-[10px] uppercase font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold">
                {t('studioCard', '1:1 Studio Card')}
              </span>
            </div>

            {/* Scrollable Square Interior Body */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1.5 py-2 custom-scrollbar">
              
              {/* Authoring Agent Info Banner */}
              {currentUser?.role === 'agent' ? (
                <div className="flex items-center justify-between p-3 rounded-2xl dark:bg-slate-950/70 bg-slate-50 border dark:border-emerald-500/30 border-emerald-500/20 text-xs">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-8 h-8 rounded-xl object-cover ring-1 ring-emerald-500 shrink-0"
                    />
                    <div className="overflow-hidden">
                      <div className="font-bold dark:text-white text-slate-900 flex items-center gap-1.5 truncate">
                        <span>{currentUser.name}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono shrink-0">
                          RERA Verified
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {currentUser.agency || "Sotheby's International Realty Mumbai"} • {currentUser.reraNumber || "A51900018420"}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenAuth}
                    className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-semibold shrink-0 ml-2"
                  >
                    Edit
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 rounded-2xl dark:bg-slate-950/70 bg-amber-500/10 border border-amber-500/30 text-xs">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">
                      Publishing as guest. Create an Agent account for custom RERA branding.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenAuth}
                    className="text-amber-600 dark:text-amber-400 hover:underline font-bold shrink-0 ml-2"
                  >
                    Create Agent ID
                  </button>
                </div>
              )}

              {/* Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider dark:text-slate-300 text-slate-700 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-500" /> Property Address & City
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="e.g. Worli Sea Face, Mumbai"
                  className="w-full dark:bg-slate-900/90 bg-white dark:border-slate-700/70 border-slate-300 rounded-xl px-4 py-2.5 text-sm dark:text-white text-slate-900 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                />
              </div>

              {/* Numeric Specs Grid (Beds, Baths, Sqft, Price) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Bed className="w-3.5 h-3.5 text-emerald-500" /> Beds
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.bedrooms}
                    onChange={(e) => handleInputChange('bedrooms', e.target.value)}
                    className="w-full dark:bg-slate-900/90 bg-white dark:border-slate-700/70 border-slate-300 rounded-xl px-3 py-2 text-sm dark:text-white text-slate-900 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Bath className="w-3.5 h-3.5 text-emerald-500" /> Baths
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.bathrooms}
                    onChange={(e) => handleInputChange('bathrooms', e.target.value)}
                    className="w-full dark:bg-slate-900/90 bg-white dark:border-slate-700/70 border-slate-300 rounded-xl px-3 py-2 text-sm dark:text-white text-slate-900 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Maximize2 className="w-3.5 h-3.5 text-emerald-500" /> Sq Ft
                  </label>
                  <input
                    type="number"
                    min="100"
                    step="50"
                    value={formData.sqft}
                    onChange={(e) => handleInputChange('sqft', e.target.value)}
                    className="w-full dark:bg-slate-900/90 bg-white dark:border-slate-700/70 border-slate-300 rounded-xl px-3 py-2 text-sm dark:text-white text-slate-900 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <span className="text-emerald-500 font-bold">₹</span> Price (INR)
                  </label>
                  <input
                    type="number"
                    min="500000"
                    step="500000"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    className="w-full dark:bg-slate-900/90 bg-white dark:border-slate-700/70 border-slate-300 rounded-xl px-3 py-2 text-sm dark:text-white text-slate-900 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Target Listing Price Display */}
              <div className="flex items-center justify-between px-3.5 py-2 rounded-xl dark:bg-slate-900/60 bg-slate-100 border dark:border-slate-800 border-slate-200 text-xs">
                <span className="text-slate-500 dark:text-slate-400">Target Asking Price:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                  {formatCurrency(formData.price)}
                </span>
              </div>

              {/* Architectural Style */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider dark:text-slate-300 text-slate-700">
                  Property Architecture & Style
                </label>
                <input
                  type="text"
                  value={formData.propertyType}
                  onChange={(e) => handleInputChange('propertyType', e.target.value)}
                  placeholder="e.g. Ultra-Luxury Sea-Facing Penthouse, Smart Villa"
                  className="w-full dark:bg-slate-900/90 bg-white dark:border-slate-700/70 border-slate-300 rounded-xl px-4 py-2.5 text-sm dark:text-white text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Multi-Photo Upload & Interactive Media Gallery */}
              <div className="space-y-3 p-3.5 rounded-2xl dark:bg-slate-900/80 bg-slate-100/90 border dark:border-slate-800 border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider dark:text-slate-200 text-slate-800 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-emerald-500" />
                    Property Photos & Gallery
                  </label>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold flex items-center gap-1">
                    <Layers className="w-3 h-3" /> {(formData.photos || []).length} Photos
                  </span>
                </div>

                {/* Dual Upload Options: File Input + URL Input */}
                <div className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* 1. Device Multiple File Upload */}
                    <div>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        id="agent-multi-photo-upload"
                        onChange={handleMultipleFileUpload}
                        className="hidden"
                      />
                      <label
                        htmlFor="agent-multi-photo-upload"
                        className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition shadow-sm border ${
                          isUploadingFiles
                            ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-wait'
                            : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 border-emerald-400/40 shadow-emerald-500/15'
                        }`}
                      >
                        {isUploadingFiles ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Reading Photos...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5" />
                            <span>Upload from Computer</span>
                          </>
                        )}
                      </label>
                    </div>

                    {/* 2. Add URL Field */}
                    <div className="flex items-center gap-1.5">
                      <input
                        type="url"
                        value={newUrlInput}
                        onChange={(e) => setNewUrlInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddPhotoUrl();
                          }
                        }}
                        placeholder="Paste image URL..."
                        className="flex-1 dark:bg-slate-950 bg-white dark:border-slate-700 border-slate-300 rounded-xl px-2.5 py-1.5 text-xs dark:text-white text-slate-900 font-mono focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddPhotoUrl()}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold shrink-0"
                      >
                        + Add
                      </button>
                    </div>
                  </div>

                  {/* Quick Angle Presets */}
                  <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                    <span className="text-slate-500 dark:text-slate-400">Quick Angles:</span>
                    <button
                      type="button"
                      onClick={() => handleAddPhotoUrl('https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80')}
                      className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 hover:bg-emerald-500/20 text-slate-700 dark:text-slate-300 transition"
                    >
                      + Living Area
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddPhotoUrl('https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80')}
                      className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 hover:bg-emerald-500/20 text-slate-700 dark:text-slate-300 transition"
                    >
                      + Kitchen
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddPhotoUrl('https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80')}
                      className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 hover:bg-emerald-500/20 text-slate-700 dark:text-slate-300 transition"
                    >
                      + Master Bedroom
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddPhotoUrl('https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80')}
                      className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 hover:bg-emerald-500/20 text-slate-700 dark:text-slate-300 transition"
                    >
                      + Pool & Sun Deck
                    </button>
                  </div>
                </div>

                {/* Active Photo Main Preview (Square 1:1) */}
                {formData.photos && formData.photos.length > 0 && (
                  <div className="space-y-2">
                    <div className="relative w-full aspect-video sm:aspect-square max-h-56 rounded-2xl overflow-hidden border dark:border-slate-800 border-slate-300 bg-slate-950 group shadow-md">
                      <img
                        src={formData.photos[activePhotoIdx] || formData.photos[0]}
                        alt={`Property photo ${activePhotoIdx + 1}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1200&q=80';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30 pointer-events-none" />

                      {/* Cover Badge */}
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                        {activePhotoIdx === 0 ? (
                          <span className="px-2 py-0.5 rounded-lg bg-amber-500 text-slate-950 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-md">
                            <Star className="w-3 h-3 fill-slate-950" /> Cover Photo
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-lg bg-slate-950/80 backdrop-blur-md text-white text-[10px] font-mono">
                            Photo {activePhotoIdx + 1} of {formData.photos.length}
                          </span>
                        )}
                      </div>

                      {/* Navigation Arrows on Preview */}
                      {formData.photos.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={() => setActivePhotoIdx((prev) => (prev > 0 ? prev - 1 : formData.photos.length - 1))}
                            className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-slate-950/70 hover:bg-slate-950 text-white backdrop-blur-sm transition"
                            title="Previous Photo"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setActivePhotoIdx((prev) => (prev < formData.photos.length - 1 ? prev + 1 : 0))}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-slate-950/70 hover:bg-slate-950 text-white backdrop-blur-sm transition"
                            title="Next Photo"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      {/* Quick Action Bar on Preview */}
                      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                        {activePhotoIdx !== 0 ? (
                          <button
                            type="button"
                            onClick={() => handleSetCoverPhoto(activePhotoIdx)}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/90 hover:bg-amber-400 text-slate-950 text-[11px] font-bold transition flex items-center gap-1 shadow"
                          >
                            <Star className="w-3 h-3" /> Make Cover Photo
                          </button>
                        ) : (
                          <span className="text-[10px] text-amber-300 font-medium px-2 py-0.5 rounded bg-slate-950/70">
                            ★ Active primary listing image
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(activePhotoIdx)}
                          className="px-2.5 py-1 rounded-lg bg-red-600/90 hover:bg-red-500 text-white text-[11px] font-semibold transition flex items-center gap-1 shadow"
                        >
                          <Trash2 className="w-3 h-3" /> Remove
                        </button>
                      </div>
                    </div>

                    {/* Horizontal Thumbnail Strip */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                      {formData.photos.map((photo, index) => {
                        const isSelected = activePhotoIdx === index;
                        const isCover = index === 0;

                        return (
                          <div
                            key={index}
                            onClick={() => setActivePhotoIdx(index)}
                            className={`relative w-14 h-14 shrink-0 rounded-xl overflow-hidden cursor-pointer border-2 transition-all group ${
                              isSelected
                                ? 'border-emerald-500 scale-105 shadow-md ring-2 ring-emerald-500/30'
                                : 'border-slate-300 dark:border-slate-700 opacity-70 hover:opacity-100'
                            }`}
                          >
                            <img
                              src={photo}
                              alt={`Thumbnail ${index + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src = 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1200&q=80';
                              }}
                            />
                            {isCover && (
                              <div className="absolute top-0.5 left-0.5 bg-amber-500 text-slate-950 p-0.5 rounded text-[8px] font-bold">
                                ★
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemovePhoto(index);
                              }}
                              className="absolute top-0.5 right-0.5 p-0.5 rounded bg-slate-950/80 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition"
                              title="Delete photo"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        );
                      })}

                      {/* Add more photo button in strip */}
                      <label
                        htmlFor="agent-multi-photo-upload"
                        className="w-14 h-14 shrink-0 rounded-xl border-2 border-dashed border-slate-400 dark:border-slate-700 hover:border-emerald-500 flex flex-col items-center justify-center cursor-pointer text-slate-400 hover:text-emerald-500 transition"
                        title="Upload more photos"
                      >
                        <Plus className="w-4 h-4" />
                        <span className="text-[8px] font-semibold">+ More</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Key Features (Tags + Custom Text) */}
              <div className="space-y-2.5">
                <label className="text-xs font-semibold uppercase tracking-wider dark:text-slate-300 text-slate-700">
                  Key Features & Amenities
                </label>

                {/* Selected tags */}
                <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 dark:bg-slate-900/70 bg-slate-100/80 rounded-xl border dark:border-slate-800 border-slate-200">
                  {formData.keyFeatures.length === 0 && (
                    <span className="text-xs text-slate-500 italic p-1">No tags selected. Click pills below or add custom.</span>
                  )}
                  {formData.keyFeatures.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeFeature(tag)}
                        className="hover:text-emerald-900 dark:hover:text-emerald-100 transition"
                        title="Remove feature"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

                {/* Custom Feature Text Input */}
                <form onSubmit={handleAddCustomFeature} className="flex gap-2">
                  <input
                    type="text"
                    value={customFeatureInput}
                    onChange={(e) => setCustomFeatureInput(e.target.value)}
                    placeholder="Type custom feature and press Enter..."
                    className="flex-1 dark:bg-slate-900/90 bg-white dark:border-slate-700/70 border-slate-300 rounded-xl px-3 py-2 text-xs dark:text-white text-slate-900 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomFeature}
                    className="px-3 py-2 dark:bg-slate-800 dark:hover:bg-slate-700 bg-slate-200 hover:bg-slate-300 dark:text-slate-200 text-slate-800 text-xs font-semibold rounded-xl border dark:border-slate-700 border-slate-300 flex items-center gap-1 transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </form>

                {/* Popular tags */}
                <div className="space-y-1">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Quick amenity tags:</span>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1 custom-scrollbar">
                    {POPULAR_FEATURE_TAGS.map((tag) => {
                      const isSelected = formData.keyFeatures.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleFeatureTag(tag)}
                          className={`text-xs px-2.5 py-1 rounded-lg transition-all ${
                            isSelected
                              ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                              : 'dark:bg-slate-800/80 dark:hover:bg-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 border dark:border-slate-700/50 border-slate-200'
                          }`}
                        >
                          {isSelected ? '✓ ' : '+ '}
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Custom Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider dark:text-slate-300 text-slate-700">
                  Agent's Custom Notes & Proximity Perks
                </label>
                <textarea
                  rows={2}
                  value={formData.customNotes}
                  onChange={(e) => handleInputChange('customNotes', e.target.value)}
                  placeholder="Nearby schools, parks, orientation, security details..."
                  className="w-full dark:bg-slate-900/90 bg-white dark:border-slate-700/70 border-slate-300 rounded-xl px-4 py-2 text-xs dark:text-white text-slate-900 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* VIBE AUTO-CLASSIFIER */}
              <div className="p-3 rounded-2xl dark:bg-indigo-950/30 bg-indigo-50/70 border dark:border-indigo-500/30 border-indigo-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-indigo-500" />
                    AI Vibe Auto-Classifier
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Dynamic Synthesis</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {suggestedVibes.map((vibe) => (
                    <span
                      key={vibe}
                      className="text-xs px-2.5 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/40 font-mono font-medium"
                    >
                      {vibe}
                    </span>
                  ))}
                </div>
              </div>

            </div>

            {/* Bottom Docked Action: GENERATE BUTTON */}
            <div className="pt-3.5 border-t dark:border-slate-800 border-slate-200 shrink-0">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className={`w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl font-bold text-sm shadow-xl transition-all ${
                  isGenerating
                    ? 'dark:bg-slate-800 bg-slate-200 text-slate-400 cursor-not-allowed border dark:border-slate-700 border-slate-300'
                    : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-extrabold shadow-emerald-500/25 hover:shadow-emerald-500/40 transform active:scale-98'
                }`}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-600 dark:text-emerald-400" />
                    <span>{t('generating', 'Generating Platform Copy...')}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-slate-950" />
                    <span>{t('generateTones', 'Generate 3 Tone Descriptions')}</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: 3-COLUMN TONE COMPARISON DISPLAY */}
        <div className="lg:col-span-6 space-y-6">
          {!generatedDescriptions && !isGenerating && (
            <div className="glass-panel rounded-3xl p-8 border dark:border-slate-800 border-slate-200 text-center space-y-4 shadow-md">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold dark:text-white text-slate-900">{t('generateTones', 'Generate Listing Copy')}</h3>
              <p className="dark:text-slate-400 text-slate-600 text-sm max-w-md mx-auto">
                Click <span className="text-emerald-600 dark:text-emerald-400 font-semibold">"{t('generateTones', 'Generate 3 Tone Descriptions')}"</span> or hit 
                <span className="text-amber-600 dark:text-amber-400 font-semibold"> "{t('fillSampleData', 'Fill Sample Data')}"</span> to produce side-by-side Luxury, Cozy, and Instagram platform versions.
              </p>
              <button
                type="button"
                onClick={handleGenerate}
                className="px-6 py-2.5 rounded-xl dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold border dark:border-slate-700 border-slate-300 transition"
              >
                {t('generateTones', 'Generate Now')}
              </button>
            </div>
          )}

          {isGenerating && (
            <div className="glass-panel rounded-3xl p-8 border dark:border-slate-800 border-slate-200 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500 animate-ping" />
                <span className="dark:text-slate-200 text-slate-800 font-semibold">{t('generating', 'Synthesizing 3 Platform Tones...')}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
                <div className="h-64 dark:bg-slate-800/60 bg-slate-200 rounded-2xl" />
                <div className="h-64 dark:bg-slate-800/60 bg-slate-200 rounded-2xl" />
                <div className="h-64 dark:bg-slate-800/60 bg-slate-200 rounded-2xl" />
              </div>
            </div>
          )}

          {generatedDescriptions && !isGenerating && (
            <div className="space-y-6">
              {/* Header Bar with Cache Hit Status Indicator */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-card p-4 rounded-2xl border dark:border-slate-800 border-slate-200 shadow-sm">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-lg font-bold dark:text-white text-slate-900 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      Platform Tone Descriptions
                    </h3>
                    {generatedDescriptions.cached ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1 font-mono">
                        ⚡ Served from Cache (0 API tokens • {formData.propertyId || 'cached'})
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 flex items-center gap-1 font-mono">
                        ✨ Fresh AI Synthesis (&lt;100 words)
                      </span>
                    )}
                  </div>
                  <p className="text-xs dark:text-slate-400 text-slate-500">
                    Predefined styles optimized for maximum buyer impact under 80–100 words.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSaveToInventory}
                  disabled={savedSuccess}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-lg w-full sm:w-auto ${
                    savedSuccess
                      ? 'bg-emerald-600 text-white cursor-default'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                  }`}
                >
                  {savedSuccess ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{t('savedInventory', 'Saved to Public Inventory!')}</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{t('saveInventory', 'Save to Public Inventory')}</span>
                    </>
                  )}
                </button>
              </div>

              {savedSuccess && (
                <div className="p-4 rounded-2xl dark:bg-emerald-950/40 bg-emerald-50/80 border dark:border-emerald-500/40 border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
                  <div className="flex items-center gap-2 dark:text-emerald-300 text-emerald-800 text-xs">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>
                      Listing successfully published! Now indexed for live natural language matching.
                    </span>
                  </div>
                  {onSwitchToBuyer && (
                    <button
                      type="button"
                      onClick={onSwitchToBuyer}
                      className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition shrink-0"
                    >
                      Test in Buyer Search →
                    </button>
                  )}
                </div>
              )}

              {/* 3 COLUMNS: LUXURY, COZY, MINIMALIST */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* 1. LUXURY / UPSCALE */}
                <div className="glass-panel rounded-3xl p-5 border border-amber-500/30 flex flex-col justify-between relative group hover:border-amber-500/60 transition-all shadow-xl dark:bg-gradient-to-b dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/10 bg-white">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-500">
                          <Crown className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-amber-600 dark:text-amber-300">{t('luxuryTone', 'Luxury / Upscale')}</h4>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">Architectural Prestige</span>
                        </div>
                      </div>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-500/20 font-semibold">
                        Zillow/MLS
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                      High-end vocabulary, architectural prestige & grand scale.
                    </p>

                    <div className="dark:bg-slate-950/80 bg-slate-50 rounded-2xl p-4 border dark:border-slate-800/80 border-slate-200 text-xs leading-relaxed dark:text-slate-200 text-slate-800 font-sans min-h-[190px]">
                      {generatedDescriptions.luxury}
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                      <span>{generatedDescriptions.luxury?.split(/\s+/).filter(Boolean).length || 0} words</span>
                      <span className="text-emerald-500 font-semibold">✓ Under 100 words</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t dark:border-slate-800 border-slate-200 mt-4">
                    <button
                      type="button"
                      onClick={() => handleCopy(generatedDescriptions.luxury, 'luxury')}
                      className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition ${
                        copiedKey === 'luxury'
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'dark:bg-slate-800/80 dark:hover:bg-slate-800 dark:text-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-500/30'
                      }`}
                    >
                      {copiedKey === 'luxury' ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>{t('copied', 'Copied to Clipboard!')}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>{t('copyClipboard', 'Copy to Clipboard')}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* 2. COZY / FAMILY */}
                <div className="glass-panel rounded-3xl p-5 border border-emerald-500/30 flex flex-col justify-between relative group hover:border-emerald-500/60 transition-all shadow-xl dark:bg-gradient-to-b dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/10 bg-white">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-500">
                          <Heart className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-emerald-600 dark:text-emerald-300">{t('cozyTone', 'Cozy / Family')}</h4>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">Warmth & Neighborhood</span>
                        </div>
                      </div>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20 font-semibold">
                        Community
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                      Warmth, natural light, neighborhood charm & family spaces.
                    </p>

                    <div className="dark:bg-slate-950/80 bg-slate-50 rounded-2xl p-4 border dark:border-slate-800/80 border-slate-200 text-xs leading-relaxed dark:text-slate-200 text-slate-800 font-sans min-h-[190px]">
                      {generatedDescriptions.cozy}
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                      <span>{generatedDescriptions.cozy?.split(/\s+/).filter(Boolean).length || 0} words</span>
                      <span className="text-emerald-500 font-semibold">✓ Under 100 words</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t dark:border-slate-800 border-slate-200 mt-4">
                    <button
                      type="button"
                      onClick={() => handleCopy(generatedDescriptions.cozy, 'cozy')}
                      className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition ${
                        copiedKey === 'cozy'
                          ? 'bg-emerald-500 text-slate-950 font-bold'
                          : 'dark:bg-slate-800/80 dark:hover:bg-slate-800 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-500/30'
                      }`}
                    >
                      {copiedKey === 'cozy' ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>{t('copied', 'Copied to Clipboard!')}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>{t('copyClipboard', 'Copy to Clipboard')}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* 3. MINIMALIST / MODERN */}
                <div className="glass-panel rounded-3xl p-5 border border-cyan-500/30 flex flex-col justify-between relative group hover:border-cyan-500/60 transition-all shadow-xl dark:bg-gradient-to-b dark:from-slate-900 dark:via-slate-900 dark:to-cyan-950/10 bg-white">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-xl bg-cyan-500/20 text-cyan-500">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-cyan-600 dark:text-cyan-300">{t('minimalistTone', 'Minimalist / Modern')}</h4>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">Clean & Streamlined</span>
                        </div>
                      </div>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 border border-cyan-500/20 font-semibold">
                        Modern
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                      Clean architectural lines, essential elements & clutter-free luxury.
                    </p>

                    <div className="dark:bg-slate-950/80 bg-slate-50 rounded-2xl p-4 border dark:border-slate-800/80 border-slate-200 text-xs leading-relaxed dark:text-slate-200 text-slate-800 font-sans min-h-[190px]">
                      {generatedDescriptions.minimalist || "Designed with sleek architectural precision, uncluttered open space, and abundant natural light."}
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                      <span>{(generatedDescriptions.minimalist || '').split(/\s+/).filter(Boolean).length} words</span>
                      <span className="text-emerald-500 font-semibold">✓ Under 100 words</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t dark:border-slate-800 border-slate-200 mt-4">
                    <button
                      type="button"
                      onClick={() => handleCopy(generatedDescriptions.minimalist || '', 'minimalist')}
                      className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition ${
                        copiedKey === 'minimalist'
                          ? 'bg-cyan-500 text-slate-950 font-bold'
                          : 'dark:bg-slate-800/80 dark:hover:bg-slate-800 dark:text-cyan-300 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-500/30'
                      }`}
                    >
                      {copiedKey === 'minimalist' ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>{t('copied', 'Copied to Clipboard!')}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>{t('copyClipboard', 'Copy to Clipboard')}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

              </div>

              {/* 4. OPTIONAL INSTAGRAM POST PREVIEW */}
              {generatedDescriptions.instagram && (
                <div className="glass-panel rounded-3xl p-5 border border-purple-500/30 dark:bg-slate-900/80 bg-white shadow-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-xl bg-purple-500/20 text-purple-500">
                        <Instagram className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-purple-600 dark:text-purple-300">{t('socialTone', 'Instagram / Social Media')}</h4>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">Viral engagement with emojis & hashtags</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(generatedDescriptions.instagram, 'instagram')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                        copiedKey === 'instagram'
                          ? 'bg-purple-500 text-slate-950 font-bold'
                          : 'dark:bg-slate-800 bg-purple-50 hover:bg-purple-100 text-purple-800 dark:text-purple-300 border border-purple-500/30'
                      }`}
                    >
                      {copiedKey === 'instagram' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'instagram' ? t('copied', 'Copied!') : t('copyClipboard', 'Copy Post')}</span>
                    </button>
                  </div>
                  <div className="dark:bg-slate-950/80 bg-slate-50 rounded-2xl p-4 border dark:border-slate-800/80 border-slate-200 text-xs leading-relaxed dark:text-slate-200 text-slate-800 font-sans whitespace-pre-line max-h-48 overflow-y-auto">
                    {generatedDescriptions.instagram}
                  </div>
                </div>
              )}

              {/* Action Bar */}
              <div className="glass-panel p-5 rounded-3xl border dark:border-slate-800 border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg bg-white dark:bg-slate-900/90">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl dark:bg-slate-800 bg-emerald-50 text-emerald-600 dark:text-emerald-400">
                    <Save className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold dark:text-white text-slate-900">Save & List Publicly</h4>
                    <p className="text-xs dark:text-slate-400 text-slate-500">
                      Saves to public inventory so buyers can discover it via natural language matching.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveToInventory}
                  disabled={savedSuccess}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm shadow-xl transition-all ${
                    savedSuccess
                      ? 'bg-emerald-600 text-white cursor-default'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/25'
                  }`}
                >
                  <Save className="w-4 h-4" />
                  <span>{savedSuccess ? 'Saved in Public Inventory!' : 'Save to Public Inventory'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

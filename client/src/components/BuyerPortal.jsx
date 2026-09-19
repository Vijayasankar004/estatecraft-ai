import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Sparkles, 
  CheckCircle, 
  AlertCircle, 
  MapPin, 
  Bed, 
  Bath, 
  Maximize2, 
  Calendar, 
  Crown, 
  Home, 
  SlidersHorizontal,
  ArrowRight,
  TrendingUp,
  Tag,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Camera
} from 'lucide-react';

const Instagram = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);

import { matchBuyerPrompt, formatCurrency, formatNumber } from '../services/aiService';

// QUICK TEST CHIPS FOR INDIAN REAL ESTATE
const EXACT_PHASE_4_TEST_CHIPS = [
  "Spacious sea-facing 5 BHK in Mumbai Worli with Arabian Sea views under ₹20 Cr",
  "Modern luxury villa in Bengaluru Koramangala with private pool under ₹8 Cr",
  "Portuguese heritage home in Goa Assagao with private pool under ₹7 Cr",
  "Golf course facing luxury apartment in Gurugram DLF Phase 5 under ₹10 Cr"
];

export default function BuyerPortal({ 
  inventory, 
  onSwitchToAgent, 
  currentUser, 
  onOpenAuth,
  language = 'en',
  t = (k, f) => f || k 
}) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [matchedResults, setMatchedResults] = useState([]);
  const [activeToneOnCard, setActiveToneOnCard] = useState({});
  const [selectedPropertyModal, setSelectedPropertyModal] = useState(null);
  const [tourScheduled, setTourScheduled] = useState(false);
  const [activePhotoIndexMap, setActivePhotoIndexMap] = useState({});
  const [modalPhotoIndex, setModalPhotoIndex] = useState(0);

  const getPropertyPhotos = (property) => {
    if (Array.isArray(property?.photos) && property.photos.length > 0) {
      return property.photos;
    }
    if (property?.photoUrl) {
      return [property.photoUrl];
    }
    return ['https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1200&q=80'];
  };

  const handlePrevPhoto = (e, propId, total) => {
    e.stopPropagation();
    setActivePhotoIndexMap(prev => ({
      ...prev,
      [propId]: ((prev[propId] || 0) - 1 + total) % total
    }));
  };

  const handleNextPhoto = (e, propId, total) => {
    e.stopPropagation();
    setActivePhotoIndexMap(prev => ({
      ...prev,
      [propId]: ((prev[propId] || 0) + 1) % total
    }));
  };

  // Initialize with the first quick chip on mount
  useEffect(() => {
    handleRunSearch(EXACT_PHASE_4_TEST_CHIPS[0]);
  }, [inventory]);

  const handleRunSearch = async (textToSearch) => {
    const searchText = textToSearch !== undefined ? textToSearch : query;
    if (!searchText.trim()) return;

    setQuery(searchText);
    setIsSearching(true);
    setTourScheduled(false);

    try {
      const response = await matchBuyerPrompt(searchText, inventory);
      if (Array.isArray(response)) {
        setMatchedResults(response);
      } else if (response && response.results) {
        setMatchedResults(response.results);
      }
    } catch (err) {
      console.error('Buyer match error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCardToneChange = (propId, tone) => {
    setActiveToneOnCard(prev => ({
      ...prev,
      [propId]: tone
    }));
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 transition-colors duration-200">
      {/* Top Banner & Conversational Search Input */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r dark:from-slate-900 dark:via-slate-900/90 dark:to-indigo-950/40 from-slate-100 via-white to-indigo-50/50 border dark:border-slate-800 border-slate-200 shadow-xl transition-colors duration-200">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> {t('buyerMatcher', 'Conversational Search & Matcher')}
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold dark:text-white text-slate-900 tracking-tight">
            {t('buyerTitle', 'Conversational Property Search')}
          </h1>
          <p className="dark:text-slate-400 text-slate-600 text-xs sm:text-sm">
            {t('buyerSubtitle', 'Describe your lifestyle, family needs, and preferred city in natural words. Our AI calculates relevance and explains why each property fits.')}
          </p>

          {/* Conversational Search Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleRunSearch();
            }}
            className="relative flex items-center pt-2"
          >
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('searchPlaceholder', 'e.g. Looking for a sea-facing 4 BHK in Mumbai with a pool under ₹15 Cr...')}
                className="w-full dark:bg-slate-900/95 bg-white dark:border-slate-700/80 border-slate-300 rounded-2xl pl-12 pr-32 py-4 text-sm sm:text-base dark:text-white text-slate-900 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 shadow-xl transition"
              />
              <button
                type="submit"
                disabled={isSearching}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-500/25 transition disabled:opacity-50"
              >
                {isSearching ? t('searching', 'Matching...') : t('searchBtn', 'Find Matches')}
              </button>
            </div>
          </form>

          {/* Quick Test Chips */}
          <div className="space-y-2 pt-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              {t('quickChips', 'Quick Test Prompts:')}
            </span>
            <div className="flex flex-wrap gap-2">
              {EXACT_PHASE_4_TEST_CHIPS.map((chip, idx) => {
                const isActive = query === chip;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleRunSearch(chip)}
                    className={`text-xs px-3.5 py-2 rounded-xl transition-all text-left flex items-center gap-2 ${
                      isActive
                        ? 'bg-indigo-600 text-white font-bold border border-indigo-400 shadow-md shadow-indigo-600/30'
                        : 'dark:bg-slate-800/90 bg-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 dark:text-slate-200 text-slate-800 border dark:border-slate-700/70 border-slate-300 hover:border-indigo-500/50'
                    }`}
                  >
                    <span>🎯</span>
                    <span>"{chip}"</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b dark:border-slate-800 border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold dark:text-white text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-500" />
            {t('rankedMatches', 'Ranked Match Results')} ({matchedResults.length} Evaluated)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Properties ordered by relevance with transparent AI match reasoning boxes and badge breakdowns.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            Inventory: <strong className="text-emerald-600 dark:text-emerald-400">{inventory.length} homes</strong>
          </span>
          <button
            type="button"
            onClick={onSwitchToAgent}
            className="text-xs px-3 py-1.5 rounded-lg dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-800 border dark:border-slate-700 border-slate-300 transition font-medium"
          >
            + Create New in Agent Portal
          </button>
        </div>
      </div>

      {/* RANKED MATCH RESULTS LIST */}
      <div className="space-y-6">
        {matchedResults.map((property, rank) => {
          const currentTone = activeToneOnCard[property.id] || 'luxury';
          const matchPercentage = property.matchScore || 85;

          const scoreTheme = 
            matchPercentage >= 90 
              ? { text: 'text-emerald-400', border: 'border-emerald-500/40', bg: 'bg-emerald-500/10' }
              : matchPercentage >= 75
              ? { text: 'text-indigo-400', border: 'border-indigo-500/40', bg: 'bg-indigo-500/10' }
              : { text: 'text-amber-400', border: 'border-amber-500/40', bg: 'bg-amber-500/10' };

          return (
            <div
              key={property.id}
              className="glass-panel rounded-3xl border dark:border-slate-800 border-slate-200 hover:border-slate-300 dark:hover:border-slate-700 transition-all overflow-hidden shadow-lg group bg-white dark:bg-slate-900/60"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12">
                
                {/* Photo & Badge Breakdown (4 Cols) */}
                {(() => {
                  const photos = getPropertyPhotos(property);
                  const currentPhotoIdx = (activePhotoIndexMap[property.id] || 0) % photos.length;
                  const currentPhoto = photos[currentPhotoIdx];

                  return (
                    <div className="lg:col-span-4 relative h-64 lg:h-auto min-h-[280px] overflow-hidden bg-slate-900 group/img">
                      <img
                        src={currentPhoto}
                        alt={property.address}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1200&q=80';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/25 to-transparent pointer-events-none" />
                      
                      {/* Rank Badge */}
                      <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-slate-950/85 backdrop-blur-md border border-white/10 text-xs font-bold font-mono text-white flex items-center gap-1 z-10">
                        <span>#{rank + 1}</span>
                        <span className="opacity-70">Ranked Match</span>
                      </div>

                      {/* Multi-photo pill if multiple photos */}
                      {photos.length > 1 && (
                        <div className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md border border-white/10 text-[11px] font-bold font-mono text-white flex items-center gap-1.5 z-10 shadow-lg">
                          <Camera className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{currentPhotoIdx + 1}/{photos.length}</span>
                        </div>
                      )}

                      {/* Multi-photo Prev / Next navigation arrows */}
                      {photos.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => handlePrevPhoto(e, property.id, photos.length)}
                            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-950/75 hover:bg-slate-950 text-white flex items-center justify-center backdrop-blur-sm border border-white/20 opacity-90 sm:opacity-0 sm:group-hover/img:opacity-100 transition-all z-20 shadow-md hover:scale-110"
                            title="Previous photo"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleNextPhoto(e, property.id, photos.length)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-950/75 hover:bg-slate-950 text-white flex items-center justify-center backdrop-blur-sm border border-white/20 opacity-90 sm:opacity-0 sm:group-hover/img:opacity-100 transition-all z-20 shadow-md hover:scale-110"
                            title="Next photo"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>

                          {/* Navigation Indicator Dots */}
                          <div className="absolute bottom-20 left-0 right-0 flex justify-center gap-1.5 z-10 pointer-events-none">
                            {photos.map((_, dotIdx) => (
                              <span
                                key={dotIdx}
                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                  dotIdx === currentPhotoIdx ? 'w-4 bg-white shadow-sm' : 'w-1.5 bg-white/40'
                                }`}
                              />
                            ))}
                          </div>
                        </>
                      )}

                      {/* Badge Breakdown: Price, beds/baths, sqft */}
                      <div className="absolute bottom-4 left-4 right-4 space-y-2 z-10">
                        <span className="text-2xl font-extrabold text-white font-mono drop-shadow-lg block">
                          {formatCurrency(property.price)}
                        </span>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-200 font-medium">
                          <span className="px-2 py-0.5 rounded bg-slate-950/80 border border-white/10 flex items-center gap-1">
                            <Bed className="w-3 h-3 text-indigo-400" /> {property.bedrooms} Beds
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-950/80 border border-white/10 flex items-center gap-1">
                            <Bath className="w-3 h-3 text-indigo-400" /> {property.bathrooms} Baths
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-950/80 border border-white/10 flex items-center gap-1">
                            <Maximize2 className="w-3 h-3 text-indigo-400" /> {formatNumber(property.sqft)} sqft
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Main Content & Reasoning (8 Cols) */}
                <div className="lg:col-span-8 p-6 flex flex-col justify-between space-y-6">
                  
                  {/* Top Bar: Title, Address & Match Score Badge */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b dark:border-slate-800 border-slate-200 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs uppercase tracking-wider font-semibold text-indigo-600 dark:text-indigo-400">
                          {property.propertyType || 'Residential Property'}
                        </span>
                        {property.title && (
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-serif italic hidden sm:inline">
                            • {property.title}
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold dark:text-white text-slate-900 flex items-center gap-1.5 mt-0.5">
                        <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
                        {property.address}
                      </h3>
                      {property.agentName && (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1">
                          <span>Listed by</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{property.agentName}</span>
                          {property.agency && <span>• {property.agency}</span>}
                        </div>
                      )}
                    </div>

                    {/* Ordered Match Relevance Badge (e.g. 96% Match) */}
                    <div className={`px-4 py-2.5 rounded-2xl border flex items-center gap-2.5 shrink-0 ${scoreTheme.bg} ${scoreTheme.border} ${scoreTheme.text}`}>
                      <Sparkles className="w-4 h-4" />
                      <div>
                        <div className="text-sm font-extrabold leading-none font-mono">
                          {matchPercentage}% Match
                        </div>
                        <div className="text-[10px] opacity-80 uppercase tracking-wider font-semibold">
                          Relevance Score
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* HIGHLIGHTING AI MATCH REASONING & FAIR WEIGHTED SCORING */}
                  <div className="rounded-2xl p-4 dark:bg-slate-900/90 bg-indigo-50/70 border dark:border-indigo-500/30 border-indigo-200 space-y-3 shadow-inner">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                        Fair AI Matching • Weighted Score Breakdown
                      </h4>
                      <span className="text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        Total: {matchPercentage} / 100
                      </span>
                    </div>

                    {/* Prominent One-Line AI Explanation (Requirement 2) */}
                    <div className="p-3.5 rounded-xl dark:bg-slate-950/80 bg-white border dark:border-slate-800 border-slate-200 text-xs font-medium dark:text-slate-200 text-slate-800 leading-relaxed shadow-sm flex items-start gap-2">
                      <span className="text-emerald-500 font-bold shrink-0">🎯</span>
                      <div>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {property.oneLineExplanation || property.explanation || property.matchReason || `${matchPercentage}% Match — This property meets the key criteria the buyer requested.`}
                        </span>
                      </div>
                    </div>

                    {/* 4 Weighted Scoring Meters (40% / 30% / 20% / 10%) */}
                    {property.weightedBreakdown && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                        {/* Location (40%) */}
                        <div className="p-2 rounded-xl dark:bg-slate-950/60 bg-white border dark:border-slate-800 border-slate-200 space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                            <span className="font-semibold">📍 Location Fit</span>
                            <span className="font-mono font-bold text-emerald-500">{property.weightedBreakdown.location || 0}/40</span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-emerald-500 h-1.5 rounded-full transition-all"
                              style={{ width: `${Math.min(100, ((property.weightedBreakdown.location || 0) / 40) * 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Budget (30%) */}
                        <div className="p-2 rounded-xl dark:bg-slate-950/60 bg-white border dark:border-slate-800 border-slate-200 space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                            <span className="font-semibold">💰 Budget Fit</span>
                            <span className="font-mono font-bold text-blue-500">{property.weightedBreakdown.budget || 0}/30</span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-blue-500 h-1.5 rounded-full transition-all"
                              style={{ width: `${Math.min(100, ((property.weightedBreakdown.budget || 0) / 30) * 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Style (20%) */}
                        <div className="p-2 rounded-xl dark:bg-slate-950/60 bg-white border dark:border-slate-800 border-slate-200 space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                            <span className="font-semibold">🏛️ Style Match</span>
                            <span className="font-mono font-bold text-purple-500">{property.weightedBreakdown.style || 0}/20</span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-purple-500 h-1.5 rounded-full transition-all"
                              style={{ width: `${Math.min(100, ((property.weightedBreakdown.style || 0) / 20) * 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Features (10%) */}
                        <div className="p-2 rounded-xl dark:bg-slate-950/60 bg-white border dark:border-slate-800 border-slate-200 space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                            <span className="font-semibold">✨ Features Match</span>
                            <span className="font-mono font-bold text-amber-500">{property.weightedBreakdown.features || 0}/10</span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-amber-500 h-1.5 rounded-full transition-all"
                              style={{ width: `${Math.min(100, ((property.weightedBreakdown.features || 0) / 10) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Matched Tags Badges */}
                    {property.matchedTags && property.matchedTags.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Matched criteria:</span>
                        {property.matchedTags.map((tag, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                          >
                            <CheckCircle className="w-3 h-3 text-emerald-500" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* TONE / STYLE SELECTOR FOR DESCRIPTIONS (Luxury, Cozy, Minimalist, Social) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <SlidersHorizontal className="w-3 h-3 text-indigo-500" />
                        Preview Listing Copy Tone:
                      </span>

                      <div className="flex items-center gap-1 dark:bg-slate-900 bg-slate-100 p-1 rounded-xl border dark:border-slate-800 border-slate-200 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleCardToneChange(property.id, 'luxury')}
                          className={`text-xs px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1 ${
                            currentTone === 'luxury'
                              ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-semibold'
                              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                          }`}
                        >
                          <Crown className="w-3 h-3" /> {t('luxuryTone', 'Luxury')}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCardToneChange(property.id, 'cozy')}
                          className={`text-xs px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1 ${
                            currentTone === 'cozy'
                              ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-semibold'
                              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                          }`}
                        >
                          <Home className="w-3 h-3" /> {t('cozyTone', 'Cozy')}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCardToneChange(property.id, 'minimalist')}
                          className={`text-xs px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1 ${
                            currentTone === 'minimalist'
                              ? 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 font-semibold'
                              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                          }`}
                        >
                          <Sparkles className="w-3 h-3" /> {t('minimalistTone', 'Minimalist')}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCardToneChange(property.id, 'instagram')}
                          className={`text-xs px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1 ${
                            currentTone === 'instagram'
                              ? 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30 font-semibold'
                              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                          }`}
                        >
                          <Instagram className="w-3 h-3" /> {t('socialTone', 'Social')}
                        </button>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl dark:bg-slate-950/60 bg-slate-50 border dark:border-slate-800/80 border-slate-200 text-xs dark:text-slate-300 text-slate-700 leading-relaxed max-h-28 overflow-y-auto whitespace-pre-line">
                      {property.descriptions?.[currentTone] || (
                        <span className="italic text-slate-500">
                          {property.customNotes || 'Spacious residence in prime neighborhood.'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bottom Amenities & Action */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 border-t dark:border-slate-800 border-slate-200">
                    <div className="flex flex-wrap gap-1.5 max-w-md">
                      {(property.features || property.keyFeatures || []).slice(0, 4).map((tag, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-0.5 rounded-lg text-[11px] dark:bg-slate-800/70 bg-slate-100 dark:text-slate-300 text-slate-700 border dark:border-slate-700/50 border-slate-200"
                        >
                          {tag}
                        </span>
                      ))}
                      {(property.features || property.keyFeatures || []).length > 4 && (
                        <span className="text-[11px] text-slate-500 self-center">
                          +{(property.features || property.keyFeatures || []).length - 4} more
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPropertyModal(property);
                        setModalPhotoIndex(0);
                      }}
                      className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-lg shadow-indigo-500/20 w-full sm:w-auto"
                    >
                      <span>{t('requestTour', 'Schedule Tour')}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Schedule Tour Simulation Modal */}
      {selectedPropertyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-500" />
                <h3 className="text-lg font-bold dark:text-white text-slate-900">{t('scheduleViewing', 'Schedule Private Viewing')}</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedPropertyModal(null);
                  setTourScheduled(false);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-500 dark:text-slate-300">
                You are requesting a private walk-through for:
              </p>
              
              {/* Multi-Photo Carousel in Modal */}
              {(() => {
                const modalPhotos = getPropertyPhotos(selectedPropertyModal);
                const activePhoto = modalPhotos[modalPhotoIndex] || modalPhotos[0];

                return (
                  <div className="rounded-2xl overflow-hidden border dark:border-slate-800 border-slate-200 bg-slate-950">
                    <div className="relative h-44 sm:h-48 w-full overflow-hidden">
                      <img
                        src={activePhoto}
                        alt={selectedPropertyModal.address}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1200&q=80';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent pointer-events-none" />

                      {modalPhotos.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={() => setModalPhotoIndex((prev) => (prev - 1 + modalPhotos.length) % modalPhotos.length)}
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-950/80 hover:bg-slate-950 text-white flex items-center justify-center border border-white/20 transition shadow"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setModalPhotoIndex((prev) => (prev + 1) % modalPhotos.length)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-950/80 hover:bg-slate-950 text-white flex items-center justify-center border border-white/20 transition shadow"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-slate-950/80 text-white text-[10px] font-mono border border-white/20 flex items-center gap-1">
                            <Camera className="w-3 h-3 text-indigo-400" />
                            <span>{modalPhotoIndex + 1} / {modalPhotos.length}</span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Thumbnail Strip */}
                    {modalPhotos.length > 1 && (
                      <div className="flex gap-1.5 p-2 bg-slate-900/90 overflow-x-auto border-t border-slate-800 scrollbar-thin">
                        {modalPhotos.map((pUrl, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setModalPhotoIndex(idx)}
                            className={`relative w-12 h-9 rounded-lg overflow-hidden shrink-0 border-2 transition ${
                              modalPhotoIndex === idx ? 'border-indigo-500 scale-105 ring-2 ring-indigo-500/40' : 'border-transparent opacity-60 hover:opacity-100'
                            }`}
                          >
                            <img src={pUrl} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="p-3 bg-slate-50 dark:bg-slate-950/90 border-t dark:border-slate-800 border-slate-200">
                      <div className="font-bold text-sm dark:text-white text-slate-900">{selectedPropertyModal.address}</div>
                      <div className="text-xs text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                        {formatCurrency(selectedPropertyModal.price)} • {selectedPropertyModal.bedrooms} Beds • {selectedPropertyModal.bathrooms} Baths
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Client Profile Identification */}
              {currentUser ? (
                <div className="p-3 rounded-2xl dark:bg-slate-950/80 bg-slate-50 border dark:border-indigo-500/30 border-indigo-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-8 h-8 rounded-lg object-cover ring-1 ring-indigo-500"
                    />
                    <div>
                      <div className="font-bold dark:text-white text-slate-900 flex items-center gap-1.5">
                        <span>{currentUser.name}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-mono uppercase">
                          {currentUser.role}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {currentUser.phone || '+91 98450 67890'} • {currentUser.email}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenAuth}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                  >
                    Switch
                  </button>
                </div>
              ) : (
                <div className="p-3 rounded-2xl dark:bg-indigo-950/30 bg-indigo-50/80 border dark:border-indigo-500/30 border-indigo-200 flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-300">Sign in to save this tour to your account dashboard:</span>
                  <button
                    type="button"
                    onClick={onOpenAuth}
                    className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                  >
                    Sign In / Register
                  </button>
                </div>
              )}

              {!tourScheduled ? (
                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      className="p-3 rounded-2xl border dark:border-indigo-500/50 border-indigo-400 dark:bg-indigo-500/10 bg-indigo-50 text-xs font-semibold text-indigo-700 dark:text-indigo-300 text-left"
                    >
                      📅 Tomorrow at 2:00 PM
                    </button>
                    <button
                      type="button"
                      className="p-3 rounded-2xl border dark:border-slate-800 border-slate-200 dark:bg-slate-800/40 bg-slate-50 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium dark:text-slate-300 text-slate-700 text-left"
                    >
                      📅 Saturday at 11:00 AM
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTourScheduled(true)}
                    className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow-lg shadow-indigo-600/25"
                  >
                    Confirm Tour Request
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-2xl dark:bg-emerald-950/40 bg-emerald-50 border dark:border-emerald-500/40 border-emerald-500/30 text-center space-y-2">
                  <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
                  <div className="text-sm font-bold text-emerald-700 dark:text-emerald-300">Tour Confirmed!</div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    The listing agent has received your request and matched criteria profile.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

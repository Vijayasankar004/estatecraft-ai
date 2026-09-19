import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AgentPortal from './components/AgentPortal';
import BuyerPortal from './components/BuyerPortal';
import ApiKeyModal from './components/ApiKeyModal';
import DemoScriptModal from './components/DemoScriptModal';
import AuthModal from './components/AuthModal';
import { DEMO_ACCOUNTS } from './data/userProfiles';
import { INITIAL_PUBLIC_INVENTORY } from './data/sampleProperties';
import { SUPPORTED_LANGUAGES, TRANSLATIONS } from './data/translations';

export default function App() {
  const [activeTab, setActiveTab] = useState('agent'); // 'agent' | 'buyer'
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('estatecraft_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch (e) {}
    return 'dark';
  });

  const [language, setLanguage] = useState(() => {
    try {
      const saved = localStorage.getItem('estatecraft_lang');
      if (saved && TRANSLATIONS[saved]) return saved;
    } catch (e) {}
    return 'en';
  });

  const handleLanguageChange = (newLang) => {
    if (TRANSLATIONS[newLang]) {
      setLanguage(newLang);
      try {
        localStorage.setItem('estatecraft_lang', newLang);
      } catch (e) {}
    }
  };

  const t = (key, fallback = '') => {
    const langDict = TRANSLATIONS[language] || TRANSLATIONS.en;
    if (langDict && langDict[key]) return langDict[key];
    const enDict = TRANSLATIONS.en;
    if (enDict && enDict[key]) return enDict[key];
    return fallback || key;
  };

  // Apply theme class to document root and body with high efficiency
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      if (body) {
        body.classList.add('dark');
        body.classList.remove('light');
      }
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      if (body) {
        body.classList.remove('dark');
        body.classList.add('light');
      }
    }
    try {
      localStorage.setItem('estatecraft_theme', theme);
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', theme === 'dark' ? '#090d16' : '#f8fafc');
    } catch (e) {}
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('estatecraft_user');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse saved user:', e);
    }
    return DEMO_ACCOUNTS.agent;
  });
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [inventory, setInventory] = useState(() => {
    try {
      const saved = localStorage.getItem('estatecraft_inventory_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 10 && !parsed[0].address?.includes('San Francisco')) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved inventory:', e);
    }
    return INITIAL_PUBLIC_INVENTORY;
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDemoScriptOpen, setIsDemoScriptOpen] = useState(false);

  // Sync with backend /api/listings on mount if server is up
  useEffect(() => {
    fetch('/api/listings')
      .then(res => res.json())
      .then(data => {
        const list = data.data || data.listings;
        if (data.success && Array.isArray(list) && list.length > 0) {
          setInventory(list);
          localStorage.setItem('estatecraft_inventory_v3', JSON.stringify(list));
        }
      })
      .catch(err => {
        // Backend not running yet or in client-only mode, using local state seamlessly
      });
  }, []);

  // Sync inventory changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('estatecraft_inventory_v3', JSON.stringify(inventory));
    } catch (e) {
      console.warn('Failed to save inventory to localStorage:', e);
    }
  }, [inventory]);

  // Handle saving a listing from Agent Portal
  const handleSaveListing = async (newListing) => {
    // Ensure agent ownership details are embedded
    const listingWithAgent = {
      ...newListing,
      agentId: newListing.agentId || currentUser?.id || 'usr_agent_001',
      agentEmail: newListing.agentEmail || currentUser?.email || 'vikram@sothebysrealty.in',
      agentName: newListing.agentName || currentUser?.name || 'Vikram Malhotra',
      agency: newListing.agency || currentUser?.agency || "Sotheby's International Realty Mumbai"
    };

    setInventory((prev) => [listingWithAgent, ...prev]);

    // Also attempt to persist to backend /api/listings
    try {
      await fetch('/api/listings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-agent-id': currentUser?.id || 'usr_agent_001',
          'x-agent-email': currentUser?.email || 'vikram@sothebysrealty.in'
        },
        body: JSON.stringify(listingWithAgent)
      });
    } catch (e) {
      // Offline fallback already updated state
    }
  };

  // Remove Photo from Stored Listing (Enforces Specific Agent Permission)
  const handleRemovePhotoFromListing = async (listingId, photoIndexOrUrl) => {
    const targetListing = inventory.find(item => String(item.id) === String(listingId));
    if (!targetListing) return { success: false, error: 'Listing not found in inventory' };

    // Check frontend authorization: only the specific agent who owns this listing
    const isOwner = currentUser && (
      (targetListing.agentId && currentUser.id === targetListing.agentId) ||
      (targetListing.agentEmail && currentUser.email?.toLowerCase() === targetListing.agentEmail?.toLowerCase()) ||
      (!targetListing.agentId && currentUser.role === 'agent')
    );

    if (!isOwner) {
      const authorizedAgent = targetListing.agentName || targetListing.agentEmail || 'the specific listing agent';
      return {
        success: false,
        error: `Permission Denied: Photos can only be removed by the specific agent who uploaded this property (${authorizedAgent}).`
      };
    }

    // Agent authorized: update local inventory state
    const updatedInventory = inventory.map(item => {
      if (String(item.id) === String(listingId)) {
        const existingPhotos = Array.isArray(item.photos) ? [...item.photos] : [item.photoUrl].filter(Boolean);
        const newPhotos = typeof photoIndexOrUrl === 'number'
          ? existingPhotos.filter((_, idx) => idx !== photoIndexOrUrl)
          : existingPhotos.filter(p => (typeof p === 'string' ? p : p.url) !== photoIndexOrUrl);
        return {
          ...item,
          photos: newPhotos,
          photoUrl: newPhotos[0] || ''
        };
      }
      return item;
    });

    setInventory(updatedInventory);

    // Call backend API with agent credentials
    try {
      const res = await fetch(`/api/listings/${listingId}/photos/remove`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-agent-id': currentUser.id,
          'x-agent-email': currentUser.email
        },
        body: JSON.stringify({
          photoIndex: typeof photoIndexOrUrl === 'number' ? photoIndexOrUrl : undefined,
          photoUrl: typeof photoIndexOrUrl === 'string' ? photoIndexOrUrl : undefined,
          agentId: currentUser.id,
          agentEmail: currentUser.email
        })
      });
      const data = await res.json();
      return data;
    } catch (err) {
      return { success: true, message: 'Photo removed from local storage' };
    }
  };

  // Add Photos to Stored Listing (Enforces Specific Agent Permission)
  const handleAddPhotosToListing = async (listingId, newPhotos) => {
    const targetListing = inventory.find(item => String(item.id) === String(listingId));
    if (!targetListing) return { success: false, error: 'Listing not found' };

    const isOwner = currentUser && (
      (targetListing.agentId && currentUser.id === targetListing.agentId) ||
      (targetListing.agentEmail && currentUser.email?.toLowerCase() === targetListing.agentEmail?.toLowerCase()) ||
      (!targetListing.agentId && currentUser.role === 'agent')
    );

    if (!isOwner) {
      const authorizedAgent = targetListing.agentName || targetListing.agentEmail || 'the specific listing agent';
      return {
        success: false,
        error: `Permission Denied: Only the specific agent (${authorizedAgent}) can add photos to this property.`
      };
    }

    const updatedInventory = inventory.map(item => {
      if (String(item.id) === String(listingId)) {
        const combined = [...(item.photos || []), ...newPhotos];
        return {
          ...item,
          photos: combined,
          photoUrl: combined[0] || item.photoUrl
        };
      }
      return item;
    });

    setInventory(updatedInventory);

    try {
      const res = await fetch(`/api/listings/${listingId}/photos/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-agent-id': currentUser.id,
          'x-agent-email': currentUser.email
        },
        body: JSON.stringify({
          photos: newPhotos,
          agentId: currentUser.id,
          agentEmail: currentUser.email
        })
      });
      return await res.json();
    } catch (err) {
      return { success: true, message: 'Photos added to local storage' };
    }
  };

  // Delete Listing from Inventory (Enforces Specific Agent Permission)
  const handleDeleteListing = async (listingId) => {
    const targetListing = inventory.find(item => String(item.id) === String(listingId));
    if (!targetListing) return { success: false, error: 'Listing not found' };

    const isOwner = currentUser && (
      (targetListing.agentId && currentUser.id === targetListing.agentId) ||
      (targetListing.agentEmail && currentUser.email?.toLowerCase() === targetListing.agentEmail?.toLowerCase()) ||
      (!targetListing.agentId && currentUser.role === 'agent')
    );

    if (!isOwner) {
      const authorizedAgent = targetListing.agentName || targetListing.agentEmail || 'the specific listing agent';
      return {
        success: false,
        error: `Permission Denied: Only the specific agent (${authorizedAgent}) can delete this listing.`
      };
    }

    setInventory(prev => prev.filter(item => String(item.id) !== String(listingId)));

    try {
      const res = await fetch(`/api/listings/${listingId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-agent-id': currentUser.id,
          'x-agent-email': currentUser.email
        },
        body: JSON.stringify({
          agentId: currentUser.id,
          agentEmail: currentUser.email
        })
      });
      return await res.json();
    } catch (err) {
      return { success: true, message: 'Listing deleted from local storage' };
    }
  };

  // User Auth Handlers
  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    localStorage.setItem('estatecraft_user', JSON.stringify(user));
    if (user.role === 'agent') {
      setActiveTab('agent');
    } else {
      setActiveTab('buyer');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('estatecraft_user');
  };

  const handleUpdateUser = (updatedFields) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...updatedFields };
    setCurrentUser(updated);
    try {
      localStorage.setItem('estatecraft_user', JSON.stringify(updated));
    } catch (e) {}

    // Persist to server if available
    fetch('/api/users/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: currentUser.id, email: currentUser.email, ...updatedFields })
    }).catch(() => {});
  };

  const handleSelectDemoProfile = (role) => {
    const user = DEMO_ACCOUNTS[role] || DEMO_ACCOUNTS.agent;
    setCurrentUser(user);
    localStorage.setItem('estatecraft_user', JSON.stringify(user));
    setActiveTab(role === 'agent' ? 'agent' : 'buyer');
  };

  // Reset inventory back to initial default seed
  const handleResetInventory = () => {
    if (window.confirm('Reset all listings back to the 10 curated Indian listings?')) {
      setInventory(INITIAL_PUBLIC_INVENTORY);
      localStorage.setItem('estatecraft_inventory_v3', JSON.stringify(INITIAL_PUBLIC_INVENTORY));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-800 dark:text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-500 transition-colors duration-200">
      {/* Top Navbar with Live/Demo badge, user account profile, language switcher, theme toggle & Demo Guide */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        inventoryCount={inventory.length}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onResetInventory={handleResetInventory}
        onOpenDemoScript={() => setIsDemoScriptOpen(true)}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        onUpdateUser={handleUpdateUser}
        onSelectDemoProfile={handleSelectDemoProfile}
        theme={theme}
        onToggleTheme={toggleTheme}
        language={language}
        onLanguageChange={handleLanguageChange}
        supportedLanguages={SUPPORTED_LANGUAGES}
        t={t}
      />

      {/* Main Workspace Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {activeTab === 'agent' ? (
          <AgentPortal
            inventory={inventory}
            onSaveListing={handleSaveListing}
            onRemovePhotoFromListing={handleRemovePhotoFromListing}
            onAddPhotosToListing={handleAddPhotosToListing}
            onDeleteListing={handleDeleteListing}
            existingInventoryCount={inventory.length}
            onSwitchToBuyer={() => setActiveTab('buyer')}
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthOpen(true)}
            t={t}
            language={language}
          />
        ) : (
          <BuyerPortal
            inventory={inventory}
            onSwitchToAgent={() => setActiveTab('agent')}
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthOpen(true)}
            t={t}
            language={language}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/60 py-6 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-slate-700 dark:text-slate-300">EstateCraft AI</span>
            <span>• {t('tagline', 'Real Estate Listing Description & Conversational Match Generator')}</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <button
              type="button"
              onClick={() => setIsDemoScriptOpen(true)}
              className="text-amber-500 hover:underline font-medium"
            >
              {t('demoGuide', 'Demo Guide')}
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="text-emerald-500 hover:underline"
            >
              AI Settings
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ApiKeyModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <DemoScriptModal
        isOpen={isDemoScriptOpen}
        onClose={() => setIsDemoScriptOpen(false)}
        t={t}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        t={t}
      />
    </div>
  );
}

/**
 * AI Service for Real Estate Listing Generation and Natural Language Matching.
 * Seamlessly communicates with the Express backend REST API (/api/*)
 * with robust local client-side fallback if backend is offline.
 * Formats all pricing in Indian Rupees (INR / ₹) using Crores and Lakhs.
 */

export const formatCurrency = (amount) => {
  if (!amount) return '₹0';
  const num = Number(amount);
  if (num >= 10000000) {
    const cr = (num / 10000000).toFixed(2).replace(/\.00$/, '');
    return `₹${cr} Cr`;
  }
  if (num >= 100000) {
    const lakh = (num / 100000).toFixed(2).replace(/\.00$/, '');
    return `₹${lakh} Lakh`;
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(num);
};

export const formatNumber = (num) => {
  if (!num) return '0';
  return new Intl.NumberFormat('en-IN').format(num);
};

/**
 * Phase 5 Stretch: Vibe Auto-Classifier
 * Suggests vibe tags based on Indian property features, architecture, and notes.
 */
export function autoClassifyVibes(propertyData) {
  const text = `${propertyData.propertyType || ''} ${propertyData.address || ''} ${(propertyData.features || propertyData.keyFeatures || []).join(' ')} ${propertyData.customNotes || ''}`.toLowerCase();
  const vibes = [];

  if (text.includes('sea') || text.includes('ocean') || text.includes('worli') || text.includes('marine') || text.includes('beach')) {
    vibes.push('#SeaFacingLuxury');
  }
  if (text.includes('golf') || text.includes('dlf') || text.includes('gurugram')) {
    vibes.push('#GolfCourseViews');
  }
  if (text.includes('pool') || text.includes('plunge') || text.includes('theatre') || text.includes('chef') || text.includes('cellar')) {
    vibes.push('#EntertainersDream');
  }
  if (text.includes('heritage') || text.includes('portuguese') || text.includes('colonial') || text.includes('victorian') || text.includes('teak') || text.includes('historic')) {
    vibes.push('#HeritageCharm');
  }
  if (text.includes('koramangala') || text.includes('indiranagar') || text.includes('whitefield') || text.includes('bengaluru') || text.includes('tech')) {
    vibes.push('#TechHubLuxury');
  }
  if (text.includes('garden') || text.includes('lawn') || text.includes('courtyard') || text.includes('school') || text.includes('family')) {
    vibes.push('#FamilyGarden');
  }
  if (text.includes('solar') || text.includes('smart') || text.includes('ev') || text.includes('tesla')) {
    vibes.push('#SmartEcoHome');
  }
  if (text.includes('sun') || text.includes('skylight') || text.includes('terrace') || text.includes('veranda')) {
    vibes.push('#SunlitSanctuary');
  }

  return vibes.length > 0 ? vibes : ['#CuratedHome', '#PrimeLocation'];
}

/**
 * Generate 3-Column Listing Descriptions
 * Calls POST /api/generate-descriptions, falls back to local synthesis.
 */
// -------------------------------------------------------------
// Client-Side Description Cache: Map<propertyId_tone, { descriptions, hash }>
// -------------------------------------------------------------
const clientCache = new Map();

function computeClientHash(data) {
  const { 
    address = '', 
    bedrooms = '', 
    bathrooms = '', 
    sqft = '', 
    price = '', 
    propertyType = '', 
    features = [], 
    keyFeatures = [] 
  } = data;
  const feats = (keyFeatures.length > 0 ? keyFeatures : features).slice().sort().join('|');
  return `${String(address).trim().toLowerCase()}#${bedrooms}#${bathrooms}#${sqft}#${price}#${String(propertyType).trim().toLowerCase()}#${feats}`;
}

/**
 * Generate Listing Descriptions (Luxury, Cozy, Minimalist)
 * Checks cache first using (propertyId + tone).
 * Calls POST /api/generate-descriptions, falls back to local synthesis.
 * All descriptions strictly under 80-100 words.
 */
export async function generateListingDescriptions(propertyData, apiKey = '', requestedTone = null) {
  const currentHash = computeClientHash(propertyData);
  const propId = propertyData.propertyId || propertyData.id || currentHash;

  // Check client cache if requesting specific tone or all tones
  if (requestedTone) {
    const cacheKey = `${propId}_${requestedTone.toLowerCase()}`;
    const cached = clientCache.get(cacheKey);
    if (cached && cached.hash === currentHash) {
      return {
        ...cached.descriptions,
        cached: true,
        source: 'Cache',
        suggestedVibes: autoClassifyVibes(propertyData)
      };
    }
  } else {
    const cacheKey = `${propId}_all`;
    const cached = clientCache.get(cacheKey);
    if (cached && cached.hash === currentHash) {
      return {
        ...cached.descriptions,
        cached: true,
        source: 'Cache',
        suggestedVibes: autoClassifyVibes(propertyData)
      };
    }
  }

  try {
    const response = await fetch('/api/generate-descriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { 'x-gemini-key': apiKey } : {})
      },
      body: JSON.stringify({
        ...propertyData,
        propertyId: propId,
        tone: requestedTone
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.descriptions) {
        // Store in client cache
        clientCache.set(`${propId}_all`, { descriptions: data.descriptions, hash: currentHash });
        if (data.descriptions.luxury) clientCache.set(`${propId}_luxury`, { descriptions: data.descriptions, hash: currentHash });
        if (data.descriptions.cozy) clientCache.set(`${propId}_cozy`, { descriptions: data.descriptions, hash: currentHash });
        if (data.descriptions.minimalist) clientCache.set(`${propId}_minimalist`, { descriptions: data.descriptions, hash: currentHash });

        return {
          ...data.descriptions,
          cached: data.cached || false,
          source: data.source || 'AI Engine',
          suggestedVibes: data.suggestedVibes || autoClassifyVibes(propertyData)
        };
      }
    }
  } catch (err) {
    console.warn('Backend /api/generate-descriptions unreachable, using local AI engine:', err.message);
  }

  const localRes = generateLocalDescriptions(propertyData);
  clientCache.set(`${propId}_all`, { descriptions: localRes, hash: currentHash });
  return localRes;
}

function generateLocalDescriptions(data) {
  const { address = 'Prime Indian Residence', bedrooms = 4, bathrooms = 4, sqft = 3500, price = 50000000, keyFeatures = [], features = [], propertyType = 'Residence' } = data;
  const rawFeats = keyFeatures.length > 0 ? keyFeatures : features;
  const featArr = Array.isArray(rawFeats) ? rawFeats : [rawFeats].filter(Boolean);
  const formattedPrice = formatCurrency(price);
  const formattedSqft = formatNumber(sqft);
  const primaryFeature = featArr[0] || 'imported Italian marble flooring';
  const secondaryFeature = featArr[1] || 'private swimming pool';
  const locName = address ? address.split(',')[0] : 'prime location';

  // Strictly under 80-100 words each
  const luxury = `Elegant premium residence with spacious interiors and refined finishes throughout in prestigious ${locName}. Spanning ${formattedSqft} square feet, this ${bedrooms}-bedroom sanctuary features ${primaryFeature.toLowerCase()}, ${secondaryFeature.toLowerCase()}, and grand entertaining scale designed for discerning living. Offered at ${formattedPrice}.`;

  const cozy = `Warm family-friendly home with inviting spaces centered on comfort and togetherness in peaceful ${locName}. Gentle natural daylight fills the ${bedrooms} bedrooms, complemented by ${primaryFeature.toLowerCase()} and a serene backyard retreat ideal for growing roots near neighborhood schools. Offered at ${formattedPrice}.`;

  const minimalist = `Clean modern design focused on simplicity, functional elegance, and seamless flow. Defined by crisp lines, open-concept living, and ${primaryFeature.toLowerCase()}, this ${bedrooms}-bed residence strips away excess to create an inspiring, tranquil environment suited for modern lifestyles. Offered at ${formattedPrice}.`;

  const instagram = `🔥 JUST LISTED: Modern ${propertyType} in ${locName}! ✨\n\n💎 ${bedrooms} Bed / ${bathrooms} Bath • ${formattedSqft} SQ FT\n💰 Offered at ${formattedPrice}\n✨ ${primaryFeature}\n✨ ${secondaryFeature}\n\nDM "TOUR" for private showings! 🥂 #LuxuryHomes #EstateCraftAI`;

  return {
    luxury,
    cozy,
    minimalist,
    instagram,
    cached: false,
    source: 'Local Mock Mode',
    suggestedVibes: autoClassifyVibes(data)
  };
}

/**
 * Match Buyer Query against Inventory
 * Weighted Fair Scoring: Location (40%) + Budget (30%) + Style (20%) + Features (10%)
 * Returns 0-100 score with One-Line AI Explanation
 */
export async function matchBuyerPrompt(promptText, inventoryList) {
  try {
    const response = await fetch('/api/match-properties', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: promptText })
    });

    if (response.ok) {
      const data = await response.json();
      const list = data.matches || data.results;
      if (data.success && Array.isArray(list)) {
        return list;
      }
    }
  } catch (err) {
    console.warn('Backend /api/match-properties unreachable, using local matching engine:', err.message);
  }

  return matchLocally(promptText, inventoryList);
}

function matchLocally(promptText, inventory) {
  const query = promptText.toLowerCase();

  // 1. Parse Budget terms
  let maxBudget = null;
  const crMatch = query.match(/(?:under|below|less than|max|budget of|up to|within)?\s*₹?\s*([\d,.]+)\s*(?:cr|crore|crores)\b/i);
  const lakhMatch = query.match(/(?:under|below|less than|max|budget of|up to|within)?\s*₹?\s*([\d,.]+)\s*(?:lakh|lakhs|lac|lacs|l)\b/i);
  const numMatch = query.match(/(?:under|below|less than|max|budget of|up to|within)\s*₹?\s*([\d,]{6,})\b/i);

  if (crMatch) {
    maxBudget = parseFloat(crMatch[1].replace(/,/g, '')) * 10000000;
  } else if (lakhMatch) {
    maxBudget = parseFloat(lakhMatch[1].replace(/,/g, '')) * 100000;
  } else if (numMatch) {
    maxBudget = parseFloat(numMatch[1].replace(/,/g, ''));
  }

  // 2. Location dictionary with Cities & Localities
  const LOCATION_DB = [
    {
      city: "Mumbai",
      cityTerms: ["mumbai", "bombay", "south mumbai", "navi mumbai"],
      localities: ["worli", "bandra", "juhu", "sea face", "marine drive", "colaba", "lower parel", "mahalaxmi", "altamount", "malabar hill"]
    },
    {
      city: "Bengaluru",
      cityTerms: ["bengaluru", "bangalore"],
      localities: ["koramangala", "indiranagar", "whitefield", "sarjapur", "sadashivanagar", "lavelle road", "mg road", "hsr"]
    },
    {
      city: "Gurugram",
      cityTerms: ["gurugram", "gurgaon", "ncr", "delhi ncr"],
      localities: ["dlf", "dlf phase 5", "golf course", "golf course road", "cyber city", "sohna road"]
    },
    {
      city: "Goa",
      cityTerms: ["goa", "north goa", "south goa"],
      localities: ["assagao", "anjuna", "candolim", "panjim", "siolim", "vagator", "calangute", "morjim"]
    },
    {
      city: "Hyderabad",
      cityTerms: ["hyderabad"],
      localities: ["jubilee hills", "jubilee", "banjara hills", "banjara", "gachibowli", "hitec city", "madhapur"]
    },
    {
      city: "Chennai",
      cityTerms: ["chennai", "madras"],
      localities: ["boat club", "boat club road", "adyar", "poes garden", "ecr", "ra puram", "besant nagar"]
    },
    {
      city: "Pune",
      cityTerms: ["pune"],
      localities: ["koregaon park", "koregaon", "kalyani nagar", "baner", "viman nagar"]
    },
    {
      city: "Kolkata",
      cityTerms: ["kolkata", "calcutta"],
      localities: ["ballygunge", "alipore", "salt lake", "new town"]
    }
  ];

  // Safe word-boundary match helper (prevents false positives like 'goals' matching 'goa')
  const containsWord = (text, term) => {
    if (!text || !term) return false;
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(?:^|[^a-zA-Z0-9])${escaped}(?:$|[^a-zA-Z0-9])`, 'i').test(text);
  };

  let requestedCity = null;
  let requestedLocality = null;

  for (const locEntry of LOCATION_DB) {
    const hasCity = locEntry.cityTerms.some(t => containsWord(query, t));
    const matchedLoc = locEntry.localities.find(l => containsWord(query, l));

    if (hasCity || matchedLoc) {
      requestedCity = locEntry.city;
      if (matchedLoc) {
        requestedLocality = matchedLoc;
      }
      break;
    }
  }

  // 3. BHK / Bedroom count detection
  let requestedBhk = null;
  const bhkMatch = query.match(/(\d+)\s*(?:bhk|bedroom|bed|beds)\b/i);
  if (bhkMatch) {
    requestedBhk = parseInt(bhkMatch[1], 10);
  }

  // 4. Style & Architecture detection
  const STYLE_DEFINITIONS = [
    { name: "villa", terms: ["villa", "independent villa", "bungalow", "independent house", "estate"] },
    { name: "penthouse", terms: ["penthouse", "sky mansion", "glass penthouse", "sky loft", "top floor"] },
    { name: "heritage", terms: ["heritage", "portuguese", "colonial", "vintage", "restored", "traditional"] },
    { name: "apartment", terms: ["apartment", "flat", "condo", "high rise", "suite"] },
    { name: "luxury", terms: ["luxury", "ultra-luxury", "upscale", "palatial", "sea-facing", "sea facing"] },
    { name: "modern", terms: ["modern", "contemporary", "minimalist", "tech", "sleek"] },
    { name: "cozy", terms: ["cozy", "warm", "family"] }
  ];

  const requestedStyles = STYLE_DEFINITIONS.filter(s => s.terms.some(t => query.includes(t))).map(s => s.name);

  // 5. Feature detection
  const FEATURE_DEFINITIONS = [
    { name: "private swimming pool", terms: ["pool", "plunge", "swimming", "swimming pool", "private pool"] },
    { name: "Arabian Sea views", terms: ["sea view", "sea views", "ocean view", "arabian sea", "sea-facing", "sea facing"] },
    { name: "championship golf views", terms: ["golf", "fairway", "golf course"] },
    { name: "landscaped garden", terms: ["garden", "lawn", "courtyard", "zen", "koi", "backyard"] },
    { name: "private elevator", terms: ["elevator", "lift", "private elevator"] },
    { name: "smart automation & solar", terms: ["smart", "solar", "automation", "tesla", "ev"] },
    { name: "home theatre suite", terms: ["theatre", "theater", "cinema"] },
    { name: "Italian marble flooring", terms: ["marble", "italian", "calacatta"] },
    { name: "premier schools nearby", terms: ["school", "schools", "kids"] }
  ];

  const requestedFeatures = FEATURE_DEFINITIONS.filter(f => f.terms.some(t => query.includes(t))).map(f => f.name);

  const results = inventory.map(property => {
    const propText = `${property.title || ''} ${property.address || ''} ${property.propertyType || ''} ${(property.features || property.keyFeatures || []).join(' ')} ${property.customNotes || ''}`.toLowerCase();
    const propLocationText = `${property.address || ''} ${property.title || ''}`.toLowerCase();

    // A. Location Fit (40% Weight: 0 to 40)
    let locationScore = 0;
    let locationHighlight = "";
    let locationStatus = "neutral";

    if (requestedCity) {
      const cityEntry = LOCATION_DB.find(c => c.city.toLowerCase() === requestedCity.toLowerCase());
      const listingInCity = cityEntry ? (
        cityEntry.cityTerms.some(t => containsWord(propLocationText, t)) ||
        cityEntry.localities.some(l => containsWord(propLocationText, l))
      ) : containsWord(propLocationText, requestedCity.toLowerCase());

      if (listingInCity) {
        if (requestedLocality) {
          const matchesLocality = containsWord(propLocationText, requestedLocality.toLowerCase());
          if (matchesLocality) {
            locationScore = 40; // 100% exact locality
            locationHighlight = `${requestedLocality.charAt(0).toUpperCase() + requestedLocality.slice(1)} location`;
            locationStatus = "exact";
          } else {
            locationScore = 28; // 70% same city
            locationHighlight = `${requestedCity} location`;
            locationStatus = "same_city";
          }
        } else {
          locationScore = 40;
          locationHighlight = `${requestedCity} location`;
          locationStatus = "exact";
        }
      } else {
        locationScore = 0; // Wrong city!
        locationHighlight = "";
        locationStatus = "different_city";
      }
    } else {
      locationScore = 36;
      locationHighlight = `${(property.address || "").split(',')[0]} location`;
      locationStatus = "neutral";
    }

    // B. Budget Fit (30% Weight: 0 to 30)
    let budgetScore = 0;
    let budgetHighlight = "";

    if (maxBudget) {
      if (property.price <= maxBudget) {
        if (property.price >= maxBudget * 0.60) {
          budgetScore = 30;
        } else {
          budgetScore = 26;
        }
        budgetHighlight = `pricing within your ${formatCurrency(maxBudget)} budget`;
      } else {
        const excessRatio = (property.price - maxBudget) / maxBudget;
        if (excessRatio <= 0.05) {
          budgetScore = 20;
          budgetHighlight = `pricing near your ${formatCurrency(maxBudget)} budget`;
        } else if (excessRatio <= 0.15) {
          budgetScore = 10;
          budgetHighlight = `pricing slightly above budget`;
        } else if (excessRatio <= 0.25) {
          budgetScore = 4;
          budgetHighlight = `pricing above budget`;
        } else {
          budgetScore = 0;
          budgetHighlight = `pricing at ${formatCurrency(property.price)} (exceeds budget)`;
        }
      }
    } else {
      budgetScore = 28;
      budgetHighlight = `competitive ${formatCurrency(property.price)} pricing`;
    }

    // C. Style Match (20% Weight: 0 to 20)
    let styleScore = 0;
    let styleHighlight = "";

    let bhkScore = 0;
    if (requestedBhk) {
      if (property.bedrooms === requestedBhk) {
        bhkScore = 8;
      } else if (Math.abs(property.bedrooms - requestedBhk) === 1) {
        bhkScore = 4;
      } else {
        bhkScore = 0;
      }
    } else {
      bhkScore = 6;
    }

    let archScore = 0;
    let matchedStyles = [];
    if (requestedStyles.length > 0) {
      matchedStyles = requestedStyles.filter(sName => {
        const sObj = STYLE_DEFINITIONS.find(s => s.name === sName);
        return sObj && sObj.terms.some(t => propText.includes(t));
      });

      if (matchedStyles.length >= 2) {
        archScore = 12;
      } else if (matchedStyles.length === 1) {
        archScore = 8;
      } else {
        archScore = 1;
      }
      styleHighlight = matchedStyles.length > 0 ? `${matchedStyles.join(' and ')} style` : `${property.propertyType} architecture`;
    } else {
      archScore = 10;
      styleHighlight = `${property.propertyType} design`;
    }

    styleScore = Math.min(20, Math.max(0, bhkScore + archScore));

    // D. Features Match (10% Weight: 0 to 10)
    let featuresScore = 0;
    let matchedFeaturesList = [];

    if (requestedFeatures.length > 0) {
      matchedFeaturesList = requestedFeatures.filter(fName => {
        const fObj = FEATURE_DEFINITIONS.find(f => f.name === fName);
        return fObj && fObj.terms.some(t => propText.includes(t));
      });

      const ratio = matchedFeaturesList.length / requestedFeatures.length;
      if (ratio >= 0.99) {
        featuresScore = 10;
      } else if (ratio >= 0.5) {
        featuresScore = 6;
      } else {
        featuresScore = 0;
      }
    } else {
      featuresScore = 8;
      const feats = property.features || property.keyFeatures || [];
      if (feats.length > 0) {
        matchedFeaturesList = [feats[0]];
      }
    }

    const totalScore = Math.min(100, Math.max(5, locationScore + budgetScore + styleScore + featuresScore));

    const positiveHighlights = [];
    if (locationScore >= 28 && locationHighlight) positiveHighlights.push(locationHighlight);
    if (requestedBhk && property.bedrooms === requestedBhk) positiveHighlights.push(`${property.bedrooms} BHK`);
    if (styleScore >= 12 && styleHighlight) positiveHighlights.push(styleHighlight);
    if (matchedFeaturesList.length > 0) positiveHighlights.push(matchedFeaturesList.slice(0, 2).join(" and "));
    if (maxBudget && property.price <= maxBudget) positiveHighlights.push("within budget pricing");

    let oneLineExplanation = "";
    if (locationStatus === "different_city") {
      const propCity = (property.address || "").includes("Mumbai") ? "Mumbai"
        : (property.address || "").includes("Bengaluru") ? "Bengaluru"
        : (property.address || "").includes("Goa") ? "Goa"
        : (property.address || "").includes("Gurugram") ? "Gurugram"
        : (property.address || "").includes("Hyderabad") ? "Hyderabad"
        : (property.address || "").includes("Chennai") ? "Chennai"
        : "another city";
      oneLineExplanation = `${totalScore}% Match — This property has the ${positiveHighlights.length > 0 ? positiveHighlights.join(", ") : "luxury qualities"} the buyer requested, but is located in ${propCity} instead of ${requestedCity}.`;
    } else if (maxBudget && property.price > maxBudget * 1.15) {
      oneLineExplanation = `${totalScore}% Match — This property has the ${positiveHighlights.length > 0 ? positiveHighlights.join(", ") : "desired features"} the buyer requested, though asking price (${formatCurrency(property.price)}) exceeds the target budget.`;
    } else {
      const cleanHighlightsStr = positiveHighlights.length > 0 ? positiveHighlights.join(", ") : "desired lifestyle criteria";
      oneLineExplanation = `${totalScore}% Match — This property has the ${cleanHighlightsStr} the buyer requested.`;
    }

    return {
      ...property,
      matchScore: totalScore,
      matchReason: oneLineExplanation,
      matchReasoning: oneLineExplanation,
      oneLineExplanation,
      matchedTags: [
        ...(locationScore >= 28 ? [locationHighlight || `${requestedCity} area`] : []),
        ...(requestedBhk && property.bedrooms === requestedBhk ? [`${property.bedrooms} BHK Exact`] : []),
        ...(maxBudget && property.price <= maxBudget ? [`Under ${formatCurrency(maxBudget)}`] : []),
        ...matchedFeaturesList.slice(0, 3)
      ].filter(Boolean),
      weightedBreakdown: {
        location: locationScore,
        locationMax: 40,
        budget: budgetScore,
        budgetMax: 30,
        style: styleScore,
        styleMax: 20,
        features: featuresScore,
        featuresMax: 10,
        total: totalScore
      }
    };
  });

  return results.sort((a, b) => b.matchScore - a.matchScore);
}

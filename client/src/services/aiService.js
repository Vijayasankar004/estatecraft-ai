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

  // 2. Dictionaries
  const LOCATION_KEYWORDS = [
    { name: "Mumbai", terms: ["mumbai", "worli", "bandra", "juhu", "sea face", "marine drive", "south mumbai"] },
    { name: "Bengaluru", terms: ["bengaluru", "bangalore", "koramangala", "indiranagar", "whitefield", "sarjapur"] },
    { name: "Gurugram", terms: ["gurugram", "gurgaon", "dlf", "golf course", "cyber city"] },
    { name: "Goa", terms: ["goa", "assagao", "anjuna", "candolim", "panjim"] },
    { name: "Hyderabad", terms: ["hyderabad", "jubilee", "banjara", "gachibowli", "hitec"] },
    { name: "Chennai", terms: ["chennai", "boat club", "adyar", "poes garden", "ecr"] },
    { name: "Pune", terms: ["pune", "koregaon", "kalyani nagar", "baner"] },
    { name: "Kolkata", terms: ["kolkata", "ballygunge", "alipore", "salt lake"] }
  ];

  const matchedLocationObj = LOCATION_KEYWORDS.find(loc => loc.terms.some(t => query.includes(t)));
  const locationQuery = matchedLocationObj ? matchedLocationObj.name : null;

  const STYLE_KEYWORDS = [
    { name: "luxury", terms: ["luxury", "upscale", "palatial", "penthouse", "sea-facing", "sea", "ocean"] },
    { name: "cozy", terms: ["cozy", "warm", "family", "charm", "heritage", "portuguese", "victorian", "cottage"] },
    { name: "minimalist", terms: ["minimalist", "modern", "contemporary", "clean", "sleek", "smart home", "eco"] }
  ];
  const requestedStyles = STYLE_KEYWORDS.filter(s => s.terms.some(t => query.includes(t))).map(s => s.name);

  const FEATURE_KEYWORDS = [
    { name: "private pool", terms: ["pool", "plunge", "swimming"] },
    { name: "garden", terms: ["garden", "lawn", "courtyard", "backyard"] },
    { name: "schools nearby", terms: ["school", "schools", "kids"] },
    { name: "golf views", terms: ["golf", "fairway"] },
    { name: "sea views", terms: ["sea view", "ocean view", "sea-facing"] },
    { name: "elevator", terms: ["elevator", "lift"] },
    { name: "marble flooring", terms: ["marble", "italian"] },
    { name: "smart home", terms: ["smart", "solar", "automation"] }
  ];
  const requestedFeatures = FEATURE_KEYWORDS.filter(f => f.terms.some(t => query.includes(t))).map(f => f.name);

  const results = inventory.map(property => {
    const propText = `${property.title || ''} ${property.address || ''} ${property.propertyType || ''} ${(property.features || property.keyFeatures || []).join(' ')} ${property.customNotes || ''}`.toLowerCase();

    // A. Location (40%)
    let locationScore = 0;
    let locationHighlight = "";
    if (locationQuery) {
      if (matchedLocationObj.terms.some(t => propText.includes(t))) {
        locationScore = 40;
        locationHighlight = `${matchedLocationObj.name} location`;
      } else {
        locationScore = 12;
      }
    } else {
      locationScore = 32;
      locationHighlight = `${property.address.split(',')[0]} location`;
    }

    // B. Budget (30%)
    let budgetScore = 0;
    let budgetHighlight = "";
    if (maxBudget) {
      if (property.price <= maxBudget) {
        budgetScore = (property.price >= maxBudget * 0.70) ? 30 : 26;
        budgetHighlight = `pricing within your ${formatCurrency(maxBudget)} budget`;
      } else {
        const ratio = property.price / maxBudget;
        budgetScore = ratio <= 1.10 ? 18 : ratio <= 1.25 ? 10 : 5;
        budgetHighlight = `value at ${formatCurrency(property.price)}`;
      }
    } else {
      budgetScore = 25;
      budgetHighlight = `competitive ${formatCurrency(property.price)} pricing`;
    }

    // C. Style (20%)
    let styleScore = 0;
    let styleHighlight = "";
    if (requestedStyles.length > 0) {
      const found = requestedStyles.filter(style => {
        const sObj = STYLE_KEYWORDS.find(s => s.name === style);
        return sObj && sObj.terms.some(t => propText.includes(t));
      });
      if (found.length > 0) {
        styleScore = Math.min(20, 14 + found.length * 3);
        styleHighlight = `${found.join(' and ')} style`;
      } else {
        styleScore = 8;
        styleHighlight = `${property.propertyType} architecture`;
      }
    } else {
      styleScore = 16;
      styleHighlight = `${property.propertyType} design`;
    }

    // D. Features (10%)
    let featuresScore = 0;
    let featureHighlights = [];
    if (requestedFeatures.length > 0) {
      const found = requestedFeatures.filter(fName => {
        const fObj = FEATURE_KEYWORDS.find(f => f.name === fName);
        return fObj && fObj.terms.some(t => propText.includes(t));
      });
      if (found.length >= 2) {
        featuresScore = 10;
        featureHighlights = found;
      } else if (found.length === 1) {
        featuresScore = 7;
        featureHighlights = found;
      } else {
        featuresScore = 4;
      }
    } else {
      featuresScore = 8;
      const feats = property.features || property.keyFeatures || [];
      if (feats.length > 0) {
        featureHighlights = [feats[0].toLowerCase()];
      }
    }

    const totalScore = Math.min(98, Math.max(35, Math.round(locationScore + budgetScore + styleScore + featuresScore)));

    const highlights = [];
    if (featureHighlights.length > 0) highlights.push(featureHighlights.join(" and "));
    if (styleHighlight) highlights.push(styleHighlight);
    if (locationHighlight) highlights.push(locationHighlight);

    const cleanHighlightsStr = highlights.length > 0 ? highlights.join(", ") : "desired lifestyle criteria";
    const oneLineExplanation = `${totalScore}% Match — This property has the ${cleanHighlightsStr} the buyer requested.`;

    return {
      ...property,
      matchScore: totalScore,
      matchReason: oneLineExplanation,
      matchReasoning: oneLineExplanation,
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

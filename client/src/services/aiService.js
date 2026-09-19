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
export async function generateListingDescriptions(propertyData, apiKey = '') {
  try {
    const response = await fetch('/api/generate-descriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { 'x-gemini-key': apiKey } : {})
      },
      body: JSON.stringify(propertyData)
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.descriptions) {
        return {
          ...data.descriptions,
          suggestedVibes: data.suggestedVibes || autoClassifyVibes(propertyData)
        };
      }
    }
  } catch (err) {
    console.warn('Backend /api/generate-descriptions unreachable, using local AI engine:', err.message);
  }

  return generateLocalDescriptions(propertyData);
}

function generateLocalDescriptions(data) {
  const { address, bedrooms, bathrooms, sqft, price, keyFeatures = [], features = [], customNotes = '', propertyType = 'Property' } = data;
  const rawFeats = keyFeatures.length > 0 ? keyFeatures : features;
  const featuresList = Array.isArray(rawFeats) ? rawFeats : [rawFeats].filter(Boolean);
  const formattedPrice = formatCurrency(price);
  const formattedSqft = formatNumber(sqft);
  
  const cityMatch = address.match(/,\s*([^,]+),\s*([A-Za-z\s]+)\s*\d{6}/);
  const locationTag = cityMatch ? `${cityMatch[1]}, ${cityMatch[2]}` : address.split(',')[0] || 'Prime Location';

  const feat1 = featuresList[0] || 'an expansive open floor plan';
  const feat2 = featuresList[1] || 'imported Italian marble flooring';
  const feat3 = featuresList[2] || 'a luminous master suite sanctuary';
  const feat4 = featuresList[3] || 'seamless indoor-outdoor entertaining flow';

  const luxury = `Commanding an exalted address at ${address}, this bespoke ${propertyType.toLowerCase()} redefines refined luxury living across ${formattedSqft} square feet. Unrivaled craftsmanship greets you upon arrival, showcasing ${feat1.toLowerCase()} alongside ${feat2.toLowerCase()}. Designed for grand entertaining and supreme privacy, the residence features ${bedrooms} palatial bedroom suites and ${bathrooms} spa-caliber baths. ${customNotes ? `${customNotes.trim()} ` : ''}A peerless sanctuary offering ${feat3.toLowerCase()} and majestic scale, curated specifically for the discerning homeowner seeking generational distinction in ${locationTag}. Offered at ${formattedPrice}.`;

  const cozy = `Welcome home to warmth, peace, and timeless comfort at ${address}. Flooded with bright natural daylight and gentle breezes, this inviting ${bedrooms}-bedroom, ${bathrooms}-bath residence is crafted around real life and joyful family gatherings. With ${formattedSqft} square feet of welcoming living space, you will fall in love with ${feat1.toLowerCase()} and ${feat2.toLowerCase()}, making morning tea and peaceful family evenings a pure joy. Step outside to discover ${feat4.toLowerCase()}, while the friendly neighborhood and peaceful surroundings make this the perfect haven for growing roots. ${customNotes ? `${customNotes.trim()} ` : ''}Offered at ${formattedPrice}.`;

  const bulletFeatures = featuresList.slice(0, 5).map(f => `✨ ${f}`).join('\n');
  const hashtagCity = cityMatch ? cityMatch[1].replace(/\s+/g, '') : 'RealEstate';

  const instagram = `🔥 JUST LISTED: The Ultimate Dream Home in ${locationTag}! 🏡✨

Stop scrolling — this gorgeous ${bedrooms} Bed / ${bathrooms} Bath showstopper just hit the market and it is an absolute 10/10! 😍

💎 ${formattedSqft} SQ FT of pure modern elegance
💰 Offered at ${formattedPrice}
📍 ${address}

HIGHLIGHTS YOU WILL OBSESS OVER:
${bulletFeatures || `✨ ${feat1}\n✨ ${feat2}\n✨ ${feat3}`}
${customNotes ? `🔑 Bonus: ${customNotes}\n` : ''}
Tag someone who needs to move here ASAP! 👇
📩 DM us "TOUR" for floorplans and exclusive private showing slots! 🥂

#${hashtagCity}RealEstate #JustListed #DreamHome #IndianLuxuryHomes #HouseHunting #LuxuryListing #InteriorDesign #EstateCraftAI`;

  return {
    luxury,
    cozy,
    instagram,
    suggestedVibes: autoClassifyVibes(data)
  };
}

/**
 * Match Buyer Query against Inventory
 * Calls POST /api/match-properties, falls back to local semantic engine.
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

  // Parse Indian Currency Cues: Crores (cr, crore) and Lakhs (lakh, lac, L)
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

  let minBeds = null;
  const bedMatch = query.match(/(\d+)\s*(?:bed|bedroom|bhk|br)/i);
  if (bedMatch) minBeds = parseInt(bedMatch[1], 10);

  const results = inventory.map(property => {
    let score = 65;
    const matchedTags = [];
    const propText = `${property.title || ''} ${property.address || ''} ${property.propertyType || ''} ${(property.features || property.keyFeatures || []).join(' ')} ${property.customNotes || ''}`.toLowerCase();

    let budgetReason = '';
    if (maxBudget) {
      if (property.price <= maxBudget) {
        score += 18;
        budgetReason = `Priced at ${formatCurrency(property.price)}, comfortably within your ${formatCurrency(maxBudget)} budget.`;
        matchedTags.push('Within Budget');
      } else {
        score -= 15;
        budgetReason = `Priced at ${formatCurrency(property.price)}, slightly exceeding your ${formatCurrency(maxBudget)} limit.`;
      }
    } else {
      budgetReason = `Priced competitively at ${formatCurrency(property.price)} (${formatNumber(property.sqft)} sqft).`;
    }

    if (minBeds) {
      if (property.bedrooms >= minBeds) {
        score += 10;
        matchedTags.push(`${property.bedrooms} BHK / Beds`);
      } else {
        score -= 10;
      }
    }

    let specificMatches = [];

    // City & Location checks
    if ((query.includes('mumbai') || query.includes('worli') || query.includes('sea')) && (propText.includes('mumbai') || propText.includes('worli') || propText.includes('sea'))) {
      score += 20;
      specificMatches.push('Worli / Mumbai Arabian Sea frontage');
      matchedTags.push('Sea Facing Mumbai');
    }
    if ((query.includes('bengaluru') || query.includes('bangalore') || query.includes('koramangala') || query.includes('indiranagar') || query.includes('whitefield')) && 
        (propText.includes('bengaluru') || propText.includes('koramangala') || propText.includes('indiranagar') || propText.includes('whitefield'))) {
      score += 20;
      specificMatches.push('Bengaluru prime tech corridor location');
      matchedTags.push('Bengaluru Prime');
    }
    if ((query.includes('gurugram') || query.includes('gurgaon') || query.includes('dlf') || query.includes('golf')) && 
        (propText.includes('gurugram') || propText.includes('dlf') || propText.includes('golf'))) {
      score += 20;
      specificMatches.push('Golf Course Road Gurugram luxury');
      matchedTags.push('Golf Course Facing');
    }
    if ((query.includes('goa') || query.includes('assagao') || query.includes('portuguese')) && 
        (propText.includes('goa') || propText.includes('assagao') || propText.includes('portuguese'))) {
      score += 20;
      specificMatches.push('Portuguese-Goan heritage villa lifestyle');
      matchedTags.push('Goa Heritage');
    }
    if ((query.includes('hyderabad') || query.includes('jubilee')) && (propText.includes('hyderabad') || propText.includes('jubilee'))) {
      score += 20;
      specificMatches.push('Jubilee Hills Hyderabad palatial estate');
      matchedTags.push('Jubilee Hills');
    }
    if ((query.includes('chennai') || query.includes('boat club') || query.includes('adyar')) && (propText.includes('chennai') || propText.includes('boat club'))) {
      score += 20;
      specificMatches.push('Chennai Boat Club Road heritage sanctuary');
      matchedTags.push('Boat Club Chennai');
    }
    if ((query.includes('pune') || query.includes('koregaon')) && (propText.includes('pune') || propText.includes('koregaon'))) {
      score += 20;
      specificMatches.push('Pune Koregaon Park botanical enclave');
      matchedTags.push('Koregaon Park Pune');
    }
    if ((query.includes('kolkata') || query.includes('ballygunge')) && (propText.includes('kolkata') || propText.includes('ballygunge'))) {
      score += 20;
      specificMatches.push('Ballygunge South Kolkata historic manor');
      matchedTags.push('Ballygunge Kolkata');
    }

    // Specific features checks
    if ((query.includes('pool') || query.includes('plunge')) && (propText.includes('pool') || propText.includes('plunge'))) {
      score += 12;
      specificMatches.push('private swimming pool');
      matchedTags.push('Private Pool');
    }
    if ((query.includes('garden') || query.includes('lawn') || query.includes('yard')) && (propText.includes('garden') || propText.includes('lawn'))) {
      score += 12;
      specificMatches.push('private landscaped garden / lawn');
      matchedTags.push('Private Garden');
    }
    if (query.includes('school') && propText.includes('school')) {
      score += 10;
      specificMatches.push('proximity to top-rated schools');
      matchedTags.push('Top Schools');
    }
    if ((query.includes('solar') || query.includes('eco')) && propText.includes('solar')) {
      score += 10;
      specificMatches.push('100% rooftop solar energy');
      matchedTags.push('Solar Powered');
    }

    score = Math.min(99, Math.max(45, Math.round(score)));

    let reasoning = '';
    if (specificMatches.length > 0) {
      reasoning = `Why this fits: This property matches your ${specificMatches.join(' and ')}. ${budgetReason} ${property.customNotes || ''}`;
    } else {
      reasoning = `Why this fits: Outstanding candidate in prime ${property.address.split(',')[0]} offering ${formatNumber(property.sqft)} sqft with ${(property.features || property.keyFeatures || []).slice(0, 2).join(' and ')}. ${budgetReason}`;
    }

    return {
      ...property,
      matchScore: score,
      matchReason: reasoning,
      matchReasoning: reasoning,
      matchedTags: Array.from(new Set([...matchedTags, ...(property.vibeTags || []).slice(0, 2)])),
      breakdown: {
        budget: Math.min(99, Math.max(60, score - 5)),
        features: Math.min(99, Math.max(55, score + 2)),
        lifestyle: Math.min(99, Math.max(50, score))
      }
    };
  });

  return results.sort((a, b) => b.matchScore - a.matchScore);
}

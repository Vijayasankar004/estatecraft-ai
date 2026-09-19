import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables from .env file (if present)
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, "data", "listings.json");
const USERS_FILE = path.join(__dirname, "data", "users.json");

const app = express();
const PORT = process.env.PORT || 5000;

// Enable JSON body parsing and CORS
app.use(cors());
app.use(express.json());

// Helper function: Format currency in Indian Rupees (Crores & Lakhs)
const formatCurrency = (amount) => {
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

const formatNumber = (num) => {
  if (!num) return '0';
  return new Intl.NumberFormat('en-IN').format(num);
};

// Helper function: Read listings from JSON file
async function getListings() {
  try {
    const data = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading listings database:", err);
    return [];
  }
}

// Helper function: Save listings to JSON file
async function saveListings(listings) {
  await fs.writeFile(DATA_FILE, JSON.stringify(listings, null, 2), "utf-8");
}

// Helper function: Read users from JSON file
async function getUsers() {
  try {
    const data = await fs.readFile(USERS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading users database:", err);
    return [];
  }
}

// Helper function: Save users to JSON file
async function saveUsers(users) {
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
}

// -------------------------------------------------------------
// 1. Health Check Endpoint
// -------------------------------------------------------------
app.get("/api/health", async (req, res) => {
  const listings = await getListings();
  const hasKey = Boolean(process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY);
  res.json({
    status: "online",
    currency: "INR (₹)",
    mode: hasKey ? "Live AI" : "Smart Simulation (Hackathon Safe Mode)",
    totalListings: listings.length,
    timestamp: new Date().toISOString()
  });
});

// -------------------------------------------------------------
// 2. GET /api/listings: Read all properties
// -------------------------------------------------------------
app.get("/api/listings", async (req, res) => {
  try {
    const listings = await getListings();
    res.json({ success: true, count: listings.length, data: listings });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to load listings" });
  }
});

// -------------------------------------------------------------
// 3. POST /api/listings: Save a new property
// -------------------------------------------------------------
app.post("/api/listings", async (req, res) => {
  try {
    const newProperty = req.body;
    if (!newProperty.address) {
      return res.status(400).json({ success: false, error: "Address is required" });
    }

    const listings = await getListings();
    const id = newProperty.id || `prop_${Date.now()}`;
    const propertyWithId = {
      id,
      ...newProperty,
      createdAt: new Date().toISOString()
    };

    listings.unshift(propertyWithId); // Add new listing to top
    await saveListings(listings);

    res.status(201).json({ success: true, data: propertyWithId });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to save property" });
  }
});

// -------------------------------------------------------------
// GET /api/users: Read all registered users / agents
// -------------------------------------------------------------
app.get("/api/users", async (req, res) => {
  try {
    const users = await getUsers();
    const safeUsers = users.map(({ password, ...rest }) => rest);
    res.json({ success: true, count: safeUsers.length, data: safeUsers });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to load users" });
  }
});

// -------------------------------------------------------------
// POST /api/auth/register: Create user or agent account
// -------------------------------------------------------------
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, role, phone, agency, reraNumber, targetCity, budgetRange, avatar } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: "Email is required" });
    }

    const users = await getUsers();
    const existingIndex = users.findIndex(u => u.email?.toLowerCase() === email.toLowerCase());
    if (existingIndex >= 0) {
      if (avatar) {
        users[existingIndex].avatar = avatar;
        await saveUsers(users);
      }
      return res.json({ success: true, user: users[existingIndex], message: "Account found" });
    }

    const defaultAvatar = role === 'agent'
      ? 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=256&q=80'
      : 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80';

    const newUser = {
      id: `usr_${role || 'user'}_${Date.now()}`,
      name: name || (role === 'agent' ? 'Licensed Real Estate Agent' : 'Home Buyer'),
      email: email.trim(),
      role: role || 'buyer',
      phone: phone || '+91 98000 00000',
      agency: role === 'agent' ? (agency || 'Premier Realty Partners') : undefined,
      reraNumber: role === 'agent' ? (reraNumber || 'RERA/MH/2026/0491') : undefined,
      targetCity: role === 'buyer' ? (targetCity || 'Mumbai') : undefined,
      budgetRange: role === 'buyer' ? (budgetRange || '₹5 Cr - ₹15 Cr') : undefined,
      avatar: avatar || defaultAvatar,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    await saveUsers(users);

    res.json({ success: true, user: newUser, message: "Account registered successfully" });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ success: false, error: "Failed to register user" });
  }
});

// -------------------------------------------------------------
// POST /api/users/update: Update user profile details (avatar, phone, etc.)
// -------------------------------------------------------------
app.post("/api/users/update", async (req, res) => {
  try {
    const { id, email, ...updates } = req.body;
    if (!id && !email) {
      return res.status(400).json({ success: false, error: "User ID or email is required" });
    }

    const users = await getUsers();
    const index = users.findIndex(u => (id && u.id === id) || (email && u.email?.toLowerCase() === email.toLowerCase()));

    if (index === -1) {
      // User doesn't exist yet, create or return
      return res.status(404).json({ success: false, error: "User not found" });
    }

    users[index] = { ...users[index], ...updates, updatedAt: new Date().toISOString() };
    await saveUsers(users);

    res.json({ success: true, user: users[index] });
  } catch (error) {
    console.error("User update error:", error);
    res.status(500).json({ success: false, error: "Failed to update profile" });
  }
});

// -------------------------------------------------------------
// Description Cache (propertyId + tone -> { description, detailsHash, timestamp })
// -------------------------------------------------------------
const descriptionCache = new Map();

function computePropertyDetailsHash(data) {
  const { 
    address = "", 
    bedrooms = "", 
    bathrooms = "", 
    sqft = "", 
    price = "", 
    propertyType = "", 
    features = [], 
    keyFeatures = [] 
  } = data;
  const rawFeats = keyFeatures.length > 0 ? keyFeatures : features;
  const featsStr = Array.isArray(rawFeats) ? rawFeats.slice().sort().join("|") : String(rawFeats || "");
  return `${String(address).trim().toLowerCase()}#${bedrooms}#${bathrooms}#${sqft}#${price}#${String(propertyType).trim().toLowerCase()}#${featsStr}`;
}

// -------------------------------------------------------------
// 4. POST /api/generate-descriptions: Generate Luxury, Cozy, Minimalist copy
// Supports caching per (propertyId + tone) and local mock mode under 80-100 words
// -------------------------------------------------------------
app.post("/api/generate-descriptions", async (req, res) => {
  try {
    const { 
      propertyId,
      tone,
      address = "Prime Indian Residence", 
      bedrooms = 4, 
      bathrooms = 4, 
      sqft = 3500, 
      price = 50000000, 
      propertyType, 
      features = [], 
      keyFeatures = [] 
    } = req.body;

    const currentHash = computePropertyDetailsHash(req.body);
    const propKey = propertyId || currentHash;

    const requestedTones = tone ? [tone.toLowerCase()] : ["luxury", "cozy", "minimalist", "instagram"];
    
    // Check cache first
    const cachedDescriptions = {};
    let allCached = true;
    for (const t of requestedTones) {
      const cacheKey = `${propKey}_${t}`;
      const cachedEntry = descriptionCache.get(cacheKey);
      if (cachedEntry && cachedEntry.detailsHash === currentHash) {
        cachedDescriptions[t] = cachedEntry.description;
      } else {
        allCached = false;
      }
    }

    if (allCached && Object.keys(cachedDescriptions).length > 0) {
      return res.json({ 
        success: true, 
        source: "Cache", 
        cached: true, 
        propertyId: propKey,
        descriptions: cachedDescriptions 
      });
    }

    const rawFeats = keyFeatures.length > 0 ? keyFeatures : features;
    const featArr = Array.isArray(rawFeats) ? rawFeats : [rawFeats].filter(Boolean);
    const featureList = featArr.join(", ");
    const typeStr = propertyType || "Luxury Residence";
    const formattedPrice = formatCurrency(price);
    const formattedSqft = formatNumber(sqft);
    const primaryFeature = featArr[0] || "Italian marble flooring";
    const secondaryFeature = featArr[1] || "private swimming pool";
    const thirdFeature = featArr[2] || "panoramic open views";

    let generated = null;

    // Live AI Integration (if OPENAI_API_KEY present)
    if (process.env.OPENAI_API_KEY) {
      try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content: `You are an expert real estate copywriter. Output ONLY a valid JSON object with keys "luxury", "cozy", "minimalist", and "instagram". Prices are in INR (${formattedPrice}).
CRITICAL REQUIREMENT: Keep every single description strictly under 80 to 100 words. High impact, elegant, and concise.
- luxury: Sophisticated, architectural prestige, bespoke finishes, grand entertaining scale. (60-85 words)
- cozy: Emotional, warm, family-oriented, peaceful neighborhood focus. (60-85 words)
- minimalist: Clean modern design focused on simplicity, functional flow, natural light, and uncluttered elegance. (60-85 words)
- instagram: Punchy hook, bullet points, emojis, call-to-action and hashtags. (under 80 words)`
              },
              {
                role: "user",
                content: `Property: ${address}, ${bedrooms} beds, ${bathrooms} baths, ${sqft} sqft, Price: ${formattedPrice}, Type: ${typeStr}. Features: ${featureList}.`
              }
            ],
            response_format: { type: "json_object" }
          })
        });

        if (response.ok) {
          const aiData = await response.json();
          const parsed = JSON.parse(aiData.choices[0].message.content);
          if (parsed.luxury && parsed.cozy && (parsed.minimalist || parsed.instagram)) {
            generated = {
              luxury: parsed.luxury,
              cozy: parsed.cozy,
              minimalist: parsed.minimalist || `Clean modern design focused on simplicity, natural light, and effortless flow. Featuring ${primaryFeature.toLowerCase()} and crisp architectural lines, this ${bedrooms}-bedroom home removes clutter to highlight functional elegance. Offered at ${formattedPrice}.`,
              instagram: parsed.instagram || `🔥 JUST LISTED: ${typeStr} in ${address.split(',')[0]}! ✨ ${bedrooms} Bed / ${bathrooms} Bath showstopper. 💎 Offered at ${formattedPrice}. DM "TOUR" for floorplans!`
            };
          }
        }
      } catch (err) {
        console.warn("OpenAI call failed, falling back to local mock mode:", err.message);
      }
    }

    // LOCAL MOCK MODE (when OpenAI is disabled or offline, strictly under 80-100 words)
    if (!generated) {
      const locName = address ? address.split(',')[0] : 'prime location';
      generated = {
        luxury: `Elegant premium residence with spacious interiors and refined finishes throughout in prestigious ${locName}. Spanning ${formattedSqft} square feet, this ${bedrooms}-bedroom sanctuary features ${primaryFeature.toLowerCase()}, ${secondaryFeature.toLowerCase()}, and grand entertaining scale designed for discerning living. Offered at ${formattedPrice}.`,
        cozy: `Warm family-friendly home with inviting spaces centered on comfort and togetherness in peaceful ${locName}. Gentle natural daylight fills the ${bedrooms} bedrooms, complemented by ${primaryFeature.toLowerCase()} and a serene backyard retreat ideal for growing roots near neighborhood schools. Offered at ${formattedPrice}.`,
        minimalist: `Clean modern design focused on simplicity, functional elegance, and seamless flow. Defined by crisp lines, open-concept living, and ${primaryFeature.toLowerCase()}, this ${bedrooms}-bed residence strips away excess to create an inspiring, tranquil environment suited for modern lifestyles. Offered at ${formattedPrice}.`,
        instagram: `🔥 JUST LISTED: Modern ${typeStr} in ${locName}! ✨\n\n💎 ${bedrooms} Bed / ${bathrooms} Bath • ${formattedSqft} SQ FT\n💰 Offered at ${formattedPrice}\n✨ ${primaryFeature}\n✨ ${secondaryFeature}\n\nDM "TOUR" for private showings! 🥂 #LuxuryHomes #EstateCraftAI`
      };
    }

    // Save to cache per (propertyId + tone)
    for (const t of ["luxury", "cozy", "minimalist", "instagram"]) {
      if (generated[t]) {
        descriptionCache.set(`${propKey}_${t}`, {
          description: generated[t],
          detailsHash: currentHash,
          timestamp: Date.now()
        });
      }
    }

    return res.json({ 
      success: true, 
      source: process.env.OPENAI_API_KEY && generated ? "OpenAI Live" : "Local Mock Mode", 
      cached: false, 
      propertyId: propKey,
      descriptions: generated 
    });
  } catch (error) {
    console.error("Error in generate-descriptions:", error);
    res.status(500).json({ success: false, error: "Failed to generate descriptions" });
  }
});

// -------------------------------------------------------------
// 5. POST /api/match-properties: Weighted Fair Scoring out of 100
// Weights: Location Fit (40%) + Budget Fit (30%) + Style Match (20%) + Features Match (10%)
// Displays: Match percentage & One-line AI explanation
// -------------------------------------------------------------
app.post("/api/match-properties", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || !query.trim()) {
      return res.status(400).json({ success: false, error: "Search query is required" });
    }

    const listings = await getListings();
    const queryLower = query.toLowerCase();

    // 1. Parse Budget terms (Crores & Lakhs)
    let maxBudget = null;
    const crMatch = queryLower.match(/(?:under|below|less than|max|budget of|up to|within)?\s*₹?\s*([\d,.]+)\s*(?:cr|crore|crores)\b/i);
    const lakhMatch = queryLower.match(/(?:under|below|less than|max|budget of|up to|within)?\s*₹?\s*([\d,.]+)\s*(?:lakh|lakhs|lac|lacs|l)\b/i);
    const numMatch = queryLower.match(/(?:under|below|less than|max|budget of|up to|within)\s*₹?\s*([\d,]{6,})\b/i);

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

    // Detect requested city and requested locality from query
    let requestedCity = null;
    let requestedLocality = null;

    for (const locEntry of LOCATION_DB) {
      const hasCity = locEntry.cityTerms.some(t => containsWord(queryLower, t));
      const matchedLoc = locEntry.localities.find(l => containsWord(queryLower, l));

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
    const bhkMatch = queryLower.match(/(\d+)\s*(?:bhk|bedroom|bed|beds)\b/i);
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

    const requestedStyles = STYLE_DEFINITIONS.filter(s => s.terms.some(t => queryLower.includes(t))).map(s => s.name);

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

    const requestedFeatures = FEATURE_DEFINITIONS.filter(f => f.terms.some(t => queryLower.includes(t))).map(f => f.name);

    // Score every property separately with strict, honest weighted criteria out of 100
    const scoredListings = listings.map((listing) => {
      const listingFullText = [
        listing.title || "",
        listing.address || "",
        listing.propertyType || "",
        ...(listing.features || []),
        ...(listing.keyFeatures || []),
        listing.customNotes || "",
        listing.descriptions?.luxury || "",
        listing.descriptions?.cozy || "",
        listing.descriptions?.minimalist || "",
        listing.descriptions?.instagram || ""
      ].join(" ").toLowerCase();

      // --- A. Location Fit (40% Weight: 0 to 40) ---
      let locationScore = 0;
      let locationHighlight = "";
      let locationStatus = "neutral";

      const listingLocationText = [listing.address || "", listing.title || ""].join(" ").toLowerCase();

      if (requestedCity) {
        const cityEntry = LOCATION_DB.find(c => c.city.toLowerCase() === requestedCity.toLowerCase());
        const listingInCity = cityEntry ? (
          cityEntry.cityTerms.some(t => containsWord(listingLocationText, t)) ||
          cityEntry.localities.some(l => containsWord(listingLocationText, l))
        ) : containsWord(listingLocationText, requestedCity.toLowerCase());

        if (listingInCity) {
          // If a specific locality was asked for (e.g. Worli, Koramangala, Assagao, DLF Phase 5)
          if (requestedLocality) {
            const matchesLocality = containsWord(listingLocationText, requestedLocality.toLowerCase());
            if (matchesLocality) {
              locationScore = 40; // Perfect 100% location fit
              locationHighlight = `${requestedLocality.charAt(0).toUpperCase() + requestedLocality.slice(1)} location`;
              locationStatus = "exact";
            } else {
              locationScore = 28; // Same city, nearby locality (70% location fit)
              locationHighlight = `${requestedCity} location`;
              locationStatus = "same_city";
            }
          } else {
            locationScore = 40; // Requested city match
            locationHighlight = `${requestedCity} location`;
            locationStatus = "exact";
          }
        } else {
          // Completely different city -> 0 / 40!
          locationScore = 0;
          locationHighlight = "";
          locationStatus = "different_city";
        }
      } else {
        // No location requested: valid for any market
        locationScore = 36;
        locationHighlight = `${(listing.address || "").split(',')[0]} location`;
        locationStatus = "neutral";
      }

      // --- B. Budget Fit (30% Weight: 0 to 30) ---
      let budgetScore = 0;
      let budgetHighlight = "";

      if (maxBudget) {
        if (listing.price <= maxBudget) {
          if (listing.price >= maxBudget * 0.60) {
            budgetScore = 30; // 100% budget fit
          } else {
            budgetScore = 26; // Well below budget
          }
          budgetHighlight = `pricing within your ${formatCurrency(maxBudget)} budget`;
        } else {
          const excessRatio = (listing.price - maxBudget) / maxBudget;
          if (excessRatio <= 0.05) {
            budgetScore = 20; // within 5% stretch
            budgetHighlight = `pricing near your ${formatCurrency(maxBudget)} budget`;
          } else if (excessRatio <= 0.15) {
            budgetScore = 10;
            budgetHighlight = `pricing slightly above budget`;
          } else if (excessRatio <= 0.25) {
            budgetScore = 4;
            budgetHighlight = `pricing above budget`;
          } else {
            budgetScore = 0; // Way over budget (> 25% over)
            budgetHighlight = `pricing at ${formatCurrency(listing.price)} (exceeds budget)`;
          }
        }
      } else {
        budgetScore = 28;
        budgetHighlight = `competitive ${formatCurrency(listing.price)} pricing`;
      }

      // --- C. Style Match (20% Weight: 0 to 20) ---
      let styleScore = 0;
      let styleHighlight = "";

      // Bedroom alignment (up to 8 pts)
      let bhkScore = 0;
      if (requestedBhk) {
        if (listing.bedrooms === requestedBhk) {
          bhkScore = 8;
        } else if (Math.abs(listing.bedrooms - requestedBhk) === 1) {
          bhkScore = 4;
        } else {
          bhkScore = 0;
        }
      } else {
        bhkScore = 6;
      }

      // Architecture & Vibe alignment (up to 12 pts)
      let archScore = 0;
      let matchedStyles = [];
      if (requestedStyles.length > 0) {
        matchedStyles = requestedStyles.filter(sName => {
          const sObj = STYLE_DEFINITIONS.find(s => s.name === sName);
          return sObj && sObj.terms.some(t => listingFullText.includes(t));
        });

        if (matchedStyles.length >= 2) {
          archScore = 12;
        } else if (matchedStyles.length === 1) {
          archScore = 8;
        } else {
          archScore = 1;
        }
        styleHighlight = matchedStyles.length > 0 ? `${matchedStyles.join(' and ')} style` : `${listing.propertyType} architecture`;
      } else {
        archScore = 10;
        styleHighlight = `${listing.propertyType} design`;
      }

      styleScore = Math.min(20, Math.max(0, bhkScore + archScore));

      // --- D. Features Match (10% Weight: 0 to 10) ---
      let featuresScore = 0;
      let matchedFeaturesList = [];

      if (requestedFeatures.length > 0) {
        matchedFeaturesList = requestedFeatures.filter(fName => {
          const fObj = FEATURE_DEFINITIONS.find(f => f.name === fName);
          return fObj && fObj.terms.some(t => listingFullText.includes(t));
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
        const feats = listing.features || listing.keyFeatures || [];
        if (feats.length > 0) {
          matchedFeaturesList = [feats[0]];
        }
      }

      // Final score calculation out of 100
      const totalScore = Math.min(100, Math.max(5, locationScore + budgetScore + styleScore + featuresScore));

      // Compose clean, accurate One-Line AI Explanation
      const positiveHighlights = [];
      if (locationScore >= 28 && locationHighlight) positiveHighlights.push(locationHighlight);
      if (requestedBhk && listing.bedrooms === requestedBhk) positiveHighlights.push(`${listing.bedrooms} BHK`);
      if (styleScore >= 12 && styleHighlight) positiveHighlights.push(styleHighlight);
      if (matchedFeaturesList.length > 0) positiveHighlights.push(matchedFeaturesList.slice(0, 2).join(" and "));
      if (maxBudget && listing.price <= maxBudget) positiveHighlights.push("within budget pricing");

      let oneLineExplanation = "";
      if (locationStatus === "different_city") {
        // Honest disclosure of different city
        const propCity = (listing.address || "").includes("Mumbai") ? "Mumbai"
          : (listing.address || "").includes("Bengaluru") ? "Bengaluru"
          : (listing.address || "").includes("Goa") ? "Goa"
          : (listing.address || "").includes("Gurugram") ? "Gurugram"
          : (listing.address || "").includes("Hyderabad") ? "Hyderabad"
          : (listing.address || "").includes("Chennai") ? "Chennai"
          : "another city";
        oneLineExplanation = `${totalScore}% Match — This property has the ${positiveHighlights.length > 0 ? positiveHighlights.join(", ") : "luxury qualities"} the buyer requested, but is located in ${propCity} instead of ${requestedCity}.`;
      } else if (maxBudget && listing.price > maxBudget * 1.15) {
        oneLineExplanation = `${totalScore}% Match — This property has the ${positiveHighlights.length > 0 ? positiveHighlights.join(", ") : "desired features"} the buyer requested, though asking price (${formatCurrency(listing.price)}) exceeds the target budget.`;
      } else {
        const cleanHighlightsStr = positiveHighlights.length > 0 ? positiveHighlights.join(", ") : "desired lifestyle criteria";
        oneLineExplanation = `${totalScore}% Match — This property has the ${cleanHighlightsStr} the buyer requested.`;
      }

      return {
        ...listing,
        matchScore: totalScore,
        matchReason: oneLineExplanation,
        matchReasoning: oneLineExplanation,
        oneLineExplanation,
        matchedTags: [
          ...(locationScore >= 28 ? [locationHighlight || `${requestedCity} area`] : []),
          ...(requestedBhk && listing.bedrooms === requestedBhk ? [`${listing.bedrooms} BHK Exact`] : []),
          ...(maxBudget && listing.price <= maxBudget ? [`Under ${formatCurrency(maxBudget)}`] : []),
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

    // Rank from highest match score to lowest
    scoredListings.sort((a, b) => b.matchScore - a.matchScore);

    res.json({
      success: true,
      query,
      count: scoredListings.length,
      matches: scoredListings
    });
  } catch (error) {
    console.error("Error in match-properties:", error);
    res.status(500).json({ success: false, error: "Failed to rank properties" });
  }
});

// -------------------------------------------------------------
// Serve Frontend Static Files & SPA Fallback
// -------------------------------------------------------------
const CLIENT_DIST = path.join(__dirname, "..", "client", "dist");
app.use(express.static(CLIENT_DIST));

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) {
    return next();
  }
  res.sendFile(path.join(CLIENT_DIST, "index.html"), (err) => {
    if (err) {
      res.status(200).send(`
        <html>
          <body style="font-family: sans-serif; padding: 40px; background: #0f172a; color: #f8fafc; text-align: center;">
            <h2>🏛️ EstateCraft AI Server Running</h2>
            <p>React Frontend Vite dev server is running on: <a href="http://localhost:3000" style="color: #10b981; font-weight: bold; font-size: 18px;">http://localhost:3000</a></p>
          </body>
        </html>
      `);
    }
  });
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`🚀 Real Estate AI Backend Running on port ${PORT} (INR Currency)`);
  console.log(`📡 Web Application & Health: http://localhost:${PORT}`);
  console.log(`🏠 Listings API: http://localhost:${PORT}/api/listings`);
  console.log(`⚡ Vite React Dev Server: http://localhost:3000`);
  console.log(`🌐 Network / LAN Access: http://0.0.0.0:${PORT}`);
  console.log(`====================================================`);
});

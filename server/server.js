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
// 4. POST /api/generate-descriptions: Generate 3 tone variants
// -------------------------------------------------------------
app.post("/api/generate-descriptions", async (req, res) => {
  try {
    const { 
      address, 
      bedrooms = 4, 
      bathrooms = 4, 
      sqft = 3500, 
      price = 50000000, 
      propertyType, 
      features = [], 
      keyFeatures = [] 
    } = req.body;

    const rawFeats = keyFeatures.length > 0 ? keyFeatures : features;
    const featureList = Array.isArray(rawFeats) ? rawFeats.join(", ") : rawFeats;
    const typeStr = propertyType || "Luxury Residence";
    const formattedPrice = formatCurrency(price);
    const formattedSqft = formatNumber(sqft);

    // Live AI Integration (if API key present)
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
                content: `You are an expert Indian luxury real estate copywriter. Output ONLY a valid JSON object with keys "luxury", "cozy", and "instagram". Prices are in INR (e.g. ₹X Cr or ₹X Lakh).
- luxury: Sophisticated, architectural prestige, bespoke finishes, grand entertaining scale.
- cozy: Emotional, warm, family-oriented, peaceful neighborhood focus.
- instagram: Punchy, emojis, bullet points, engaging call-to-action and 4-5 relevant hashtags.`
              },
              {
                role: "user",
                content: `Property: ${address || "Prime Indian Residence"}, ${bedrooms} beds, ${bathrooms} baths, ${sqft} sqft, Price: ${formattedPrice}, Type: ${typeStr}. Features: ${featureList}.`
              }
            ],
            response_format: { type: "json_object" }
          })
        });

        if (response.ok) {
          const aiData = await response.json();
          const parsed = JSON.parse(aiData.choices[0].message.content);
          return res.json({ success: true, source: "OpenAI Live", descriptions: parsed });
        }
      } catch (err) {
        console.warn("OpenAI call failed, falling back to smart generator:", err.message);
      }
    }

    // SMART FALLBACK SIMULATOR
    const featArr = Array.isArray(rawFeats) ? rawFeats : [rawFeats].filter(Boolean);
    const primaryFeature = featArr[0] || "Italian marble flooring";
    const secondaryFeature = featArr[1] || "private swimming pool";
    const thirdFeature = featArr[2] || "panoramic open views";

    const generated = {
      luxury: `Commanding a peerless address at ${address || "this distinguished enclave"}, this bespoke ${typeStr.toLowerCase()} spans ${formattedSqft} square feet of curated architectural grandeur. Defined by ${primaryFeature.toLowerCase()} alongside ${secondaryFeature.toLowerCase()}, this palatial sanctuary features ${bedrooms} palatial bedroom suites and ${bathrooms} spa-caliber baths, epitomizing the highest echelon of Indian luxury living. Offered at ${formattedPrice}.`,
      cozy: `Welcome home to warmth, peace, and timeless comfort at ${address || "this charming haven"}. Filled with bright natural daylight and gentle breezes, this welcoming ${bedrooms}-bedroom, ${bathrooms}-bath ${typeStr.toLowerCase()} is centered around real life and joyful family gatherings. Featuring ${primaryFeature.toLowerCase()} and safe, peaceful surroundings, it offers the perfect retreat for growing roots. Offered at ${formattedPrice}.`,
      instagram: `🔥 JUST LISTED: The Ultimate Dream Home in India! 🏡✨\n\nStop scrolling — this gorgeous ${bedrooms} Bed / ${bathrooms} Bath showstopper just hit the market! 😍\n\n💎 ${formattedSqft} SQ FT of pure modern luxury\n💰 Offered at ${formattedPrice}\n📍 ${address || "Prime Location"}\n\nHIGHLIGHTS YOU WILL OBSESS OVER:\n✨ ${primaryFeature}\n✨ ${secondaryFeature}\n✨ ${thirdFeature}\n\nTag someone who needs to see this! 👇💫\nDM us "TOUR" for floorplans and private showings! 🥂\n\n#IndianRealEstate #LuxuryHomesIndia #DreamHome #InteriorDesign #Architecture #EstateCraftAI`
    };

    return res.json({ success: true, source: "Smart Engine", descriptions: generated });
  } catch (error) {
    console.error("Error in generate-descriptions:", error);
    res.status(500).json({ success: false, error: "Failed to generate descriptions" });
  }
});

// -------------------------------------------------------------
// 5. POST /api/match-properties: AI Natural Language Matcher & Ranker
// -------------------------------------------------------------
app.post("/api/match-properties", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || !query.trim()) {
      return res.status(400).json({ success: false, error: "Search query is required" });
    }

    const listings = await getListings();
    const queryLower = query.toLowerCase();

    // Parse Indian budget terms: Crores (cr, crore) and Lakhs (lakh, lac, L)
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

    // Semantic keywords mapping for Indian real estate
    const scoredListings = listings.map((listing) => {
      let score = 65; // Base score
      const reasons = [];

      const fullText = [
        listing.title || "",
        listing.address,
        listing.propertyType,
        ...(listing.features || []),
        listing.descriptions?.luxury || "",
        listing.descriptions?.cozy || "",
        listing.descriptions?.instagram || ""
      ].join(" ").toLowerCase();

      // 1. Budget scoring
      let budgetReason = '';
      if (maxBudget) {
        if (listing.price <= maxBudget) {
          score += 18;
          budgetReason = `Priced at ${formatCurrency(listing.price)}, comfortably within your ${formatCurrency(maxBudget)} budget.`;
        } else {
          score -= 15;
          budgetReason = `Priced at ${formatCurrency(listing.price)}, slightly exceeding your ${formatCurrency(maxBudget)} limit.`;
        }
      } else {
        budgetReason = `Priced at ${formatCurrency(listing.price)} (${formatNumber(listing.sqft)} sqft).`;
      }

      // 2. City & Location intent matching
      const keywords = [
        { terms: ["mumbai", "worli", "sea", "arabian sea", "ocean"], weight: 25, reason: "Matches your request for Mumbai Arabian Sea oceanfront views" },
        { terms: ["bengaluru", "bangalore", "koramangala", "indiranagar", "whitefield"], weight: 25, reason: "Located in Bengaluru's most sought-after tech & lifestyle corridors" },
        { terms: ["gurugram", "gurgaon", "dlf", "golf"], weight: 25, reason: "Frontline fairway luxury overlooking DLF championship golf course" },
        { terms: ["goa", "assagao", "portuguese"], weight: 25, reason: "Authentic Portuguese-Goan heritage villa with private lagoon pool" },
        { terms: ["hyderabad", "jubilee"], weight: 25, reason: "Palatial modern estate in prime Jubilee Hills" },
        { terms: ["chennai", "boat club"], weight: 25, reason: "Exclusive colonial heritage bungalow on prestigious Boat Club Road" },
        { terms: ["pune", "koregaon"], weight: 25, reason: "Lush botanical garden villa in tranquil Koregaon Park" },
        { terms: ["kolkata", "ballygunge"], weight: 25, reason: "Aristocratic heritage manor on historic Ballygunge Circular Road" },
        { terms: ["pool", "plunge", "swimming"], weight: 15, reason: "Includes private swimming pool & sun deck" },
        { terms: ["garden", "backyard", "lawn", "courtyard"], weight: 15, reason: "Features expansive private garden and open courtyards" },
        { terms: ["school", "schools", "family"], weight: 15, reason: "Located near top-ranked international schools and family parks" },
        { terms: ["solar", "smart", "eco"], weight: 15, reason: "100% rooftop solar energy and smart home technology" }
      ];

      keywords.forEach((kw) => {
        const queryHasKeyword = kw.terms.some((term) => queryLower.includes(term));
        const listingHasKeyword = kw.terms.some((term) => fullText.includes(term));

        if (queryHasKeyword && listingHasKeyword) {
          score += kw.weight;
          reasons.push(kw.reason);
        }
      });

      // Clamp score between 45% and 98%
      const finalScore = Math.min(98, Math.max(45, score));

      // Compose human-like AI explanation
      let matchReason = reasons.length > 0
        ? `Why this fits: ${reasons.slice(0, 2).join(" and ")}. ${budgetReason}`
        : `Why this fits: This ${listing.bedrooms}-bed ${listing.propertyType} in ${listing.address.split(',')[0]} aligns with your general lifestyle criteria. ${budgetReason}`;

      return {
        ...listing,
        matchScore: finalScore,
        matchReason,
        matchReasoning: matchReason
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
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Real Estate AI Backend Running on port ${PORT} (INR Currency)`);
  console.log(`📡 Web Application & Health: http://localhost:${PORT}`);
  console.log(`🏠 Listings API: http://localhost:${PORT}/api/listings`);
  console.log(`⚡ Vite React Dev Server: http://localhost:3000`);
  console.log(`====================================================`);
});

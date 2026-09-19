# EstateCraft AI: 2-Minute Hackathon Demo Script

> **Goal**: Deliver a high-energy, memorable presentation showing both sides of the application (Agent Copywriting and Conversational Buyer Matchmaking) in under 2 minutes.

---

## ⏱️ Timeline & Talking Points

### 0:00 - 0:30 | The Hook & Zero-Friction Input (Agent Portal)
* **What to say**:
  > *"Every real estate agent dreads writing listing copy. It takes 45+ minutes to write, format, and re-tune descriptions for Zillow versus social media. EstateCraft AI turns property specifications into multi-platform, multi-tone listing copy in 3 seconds."*

* **Live Action**:
  1. Open the app on the **Agent Portal** tab.
  2. Point to the top banner and click **"Fill Sample Data"**.
  3. Show the judges:
     - Specs (Address, Beds, Baths, Sqft, Price) fill instantly.
     - The high-resolution photo preview updates.
     - Selected amenity pills appear.
     - Point to the **Vibe Auto-Classifier** box: *"Notice how our AI dynamically classifies vibe tags like `#VictorianHeritage` and `#Sunlit` based on the features!"*

---

### 0:30 - 1:00 | 3-Column Tone Comparison Display (Features 1 & 2)
* **What to say**:
  > *"Generic real estate descriptions fail because different platforms have completely different audiences. An MLS buyer wants architectural provenance, while an Instagram scroller wants emojis and viral hooks. Look at our 3-column side-by-side comparison."*

* **Live Action**:
  1. Click **"Generate 3 Tone Descriptions"**.
  2. The animated spinner runs as the AI crafts the copy.
  3. Walk through the 3 columns:
     - **Column 1: Luxury / Upscale (Zillow/MLS)**: Point out architectural terms like *bespoke*, *heritage sanctuary*, and *ornate hand-carved fireplaces*.
     - **Column 2: Cozy / Family (Community)**: Point out emotional warmth, *golden afternoon sun*, *private garden for family barbecues*, and *top-rated elementary schools*.
     - **Column 3: Instagram / Social (Viral Post)**: Show the hook (*✨ HISTORIC SAN FRANCISCO VICTORIAN DREAMS!*), bulleted emoji specs, call to action (*DM @EstateCraft for private tours*), and hashtag stack.
  4. Click **"Copy to Clipboard"** on any card to show the copy feedback.
  5. Click **"Save to Public Inventory"**:
     - Confetti explodes on screen! 🎉
     - Notice the inventory count badge in the navbar increments.

---

### 1:00 - 1:45 | Conversational Search & Explainable Reasoning (Features 3 & 4)
* **What to say**:
  > *"Now let's step into the buyer's shoes. Property search has been stuck in rigid 2005 dropdown filters. Buyers don't think in SQL queries—they think in lifestyles: 'I want a cozy historic home with a garden for my kids near good schools.' Let's test that."*

* **Live Action**:
  1. Click the **"Buyer Matcher"** tab in the top navigation.
  2. Click the first **Quick Test Chip**:
     > *"Cozy Victorian with original hardwood and a garden for a family"*
  3. Show the immediate ranked results:
     - **Rank #1 (96% Match)**: The Alamo Square Victorian.
  4. Zoom in on the **Highlighting AI Match Reasoning Box**:
     > *"Why this fits: This property matches your Victorian architectural request, original hardwood floors, and features an expansive private garden just 2 blocks from top-rated elementary schools."*
  5. Highlight the badge breakdown: Price, beds/baths, and matched criteria pills.
  6. Click the second Quick Test Chip:
     > *"Modern minimalist condo in the city close to nightlife & transit"*
  7. Instantly, the **Tribeca Modern Loft** jumps to Rank #1 with updated match reasoning explaining transit and nightlife proximity.

---

### 1:45 - 2:00 | The Closer & Technical Architecture
* **What to say**:
  > *"Under the hood, EstateCraft AI is a full-stack system powered by Express REST APIs, intelligent semantic scoring, live Google Gemini support, and a zero-setup local engine that never fails. It bridges the gap between agent efficiency and conversational home discovery. Thank you!"*

---

## 🏆 Scoring Rubric Checklist

- [x] **Phase 1**: Express backend server with `GET /api/listings`, `POST /api/listings`, `POST /api/generate-descriptions`, `POST /api/match-properties`, and 5 curated listings in `listings.json`.
- [x] **Phase 2**: Fast Vite + React + Tailwind frontend with navigation bar, tabs, and **Live / Demo Mode badge**.
- [x] **Phase 3**: Agent Portal with input form, **"Fill Sample Data" button**, generate spinner, 3-column tone comparison (Luxury, Cozy, Instagram), and **Copy to Clipboard** & **Save to Public Inventory** actions.
- [x] **Phase 4**: Conversational search bar, **all 3 exact quick test chips**, ranked results (0–100%), **Highlighting AI Match Reasoning Box** (*"Why this fits:..."*), and badge breakdowns.
- [x] **Phase 5**: **Vibe Auto-Classifier** (inferred `#Sunlit`, `#MidCenturyModern`, `#EntertainersDream`, etc.) + **2-Minute Demo Script**.

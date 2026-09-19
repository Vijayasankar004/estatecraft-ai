# EstateCraft AI: AI Real Estate Listing Description & Match Generator

EstateCraft AI is a dual-persona web application built for real estate agents and home buyers. It automates high-conversion listing copy generation across distinct tones/platforms and replaces rigid filter-based house hunting with natural language conversational matching and explainable reasoning.

---

## Key Features

### 🏢 1. Agent Portal (`AgentPortal.jsx`)
- **Input Specifications**: Address, bedrooms, bathrooms, square footage, asking price, architectural style, and high-resolution photo URL.
- **Key Features & Amenities**: Clickable popular tags (Chef's Kitchen, Infinity Pool, Smart Home, Wine Cellar, etc.) + custom free-form feature adder + custom notes textarea.
- **"Fill Sample Data" Button**: Instantly cycles through 3 pre-built realistic listings (Bel-Air Glass Haven, Portland Craftsman Retreat, SoHo Sky Loft) so judges and evaluators don't need to type anything during demos.
- **Generate Button & Spinner**: Calls the AI engine with active animation and state feedback.
- **3-Column Tone Comparison Display**:
  1. **Luxury / Upscale (Zillow/MLS)**: Sophisticated vocabulary, architectural prestige, bespoke finishes, and grand entertaining scale.
  2. **Cozy / Family (Community)**: Natural daylight, warmth, neighborhood charm, top schools, and family gathering spaces.
  3. **Instagram / Social (Viral Post)**: High-energy hooks, formatted emoji bullets, clear call-to-action ("DM for private showing"), and trending real estate hashtags.
- **Actions**:
  - **"Copy to Clipboard"**: Quick one-click copy on each tone column with instant visual confirmation.
  - **"Save to Public Inventory"**: Attaches all 3 descriptions to the listing, saves to local storage, triggers celebratory confetti, and immediately makes the property searchable in the Buyer Matchmaker.

### 🔍 2. Buyer Matchmaker (`BuyerPortal.jsx`)
- **Natural Language Search Omnibar**: Buyers describe their dream home in plain English (e.g., *"Looking for an ultra-luxury modern villa in LA with an infinity pool and wine cellar under $7M"*).
- **One-Click Query Suggestions**: Pre-configured chips for judging and rapid evaluation.
- **AI Match Ranking (0-100%)**: Evaluates budget compatibility, spatial requirements, lifestyle aesthetic, and specific amenities.
- **Transparent "Why It Matches" Reasoning**:
  - Exact green criteria matched (e.g. *"Priced within budget: $6,450,000"*, *"Includes requested Infinity Edge Pool"*, *"Features high-end architectural design"*).
  - Honest trade-offs & alerts (e.g. price variances, location considerations, competition).
  - Multi-dimensional breakdown score (Budget, Features, Lifestyle).
- **Interactive Tone Selector on Property Cards**: Allows buyers to flip between Luxury, Cozy, and Instagram perspectives on any listing in the catalog.
- **Interactive Tour Request Modal**: Allows buyers to simulate scheduling private viewings with immediate confirmation.

### ⚙️ 3. Dual-Mode AI Engine
- **Zero-Setup Local Engine**: Out of the box, generates rich, context-aware descriptions and semantic match evaluations with zero setup or API keys needed.
- **Google Gemini 1.5 Flash Support**: Optional API key configuration modal to connect live Gemini for real-time generative creativity.

---

## Quick Start Guide

1. Navigate to the project directory:
   ```bash
   cd C:\Users\avidi\.gemini\antigravity\scratch\estate-craft-ai
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Launch local dev server:
   ```bash
   npm run dev
   ```

4. Open `http://localhost:3000` in your browser.

---

## Judging / Demo Flow

1. **Step 1 (Agent Portal)**: Click **"Fill Sample Data"** in the top-right banner. Notice all fields, tags, and photo preview fill instantly.
2. **Step 2**: Click **"Generate 3 Tone Descriptions"**. View the 3-column comparison display side-by-side (Luxury, Cozy, Instagram).
3. **Step 3**: Click **"Save to Public Inventory"**. Notice the confetti animation and the inventory count update in the navbar.
4. **Step 4 (Buyer Portal)**: Switch to the **"Buyer Matchmaker"** tab. Click any of the suggested prompt chips or type your own query.
5. **Step 5**: Notice the ranked property list, the **"Why This Home Matches"** green checkmarks and trade-off badges, and toggle the tone switcher on the listing cards!

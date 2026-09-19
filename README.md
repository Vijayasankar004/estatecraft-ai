# 🏠 AI Real Estate Listing Description & Match Generator

> A two-sided AI platform bridging conversational buyer intent and automated multi-tone property copy.

Built for the Hackathon Problem: **AI Real Estate Listing Description & Match Generator**.

---

## 🎯 Overview

Real estate agents spend hours manually crafting listings tailored for different platforms (Zillow, Instagram, Luxury portals). Meanwhile, buyers struggle to express what "home" feels like through rigid search filters (bedrooms, price).

This application solves both sides:
1. **Agent Side**: Takes property details & photos $\rightarrow$ Generates 3 distinct tone versions (**Luxury**, **Cozy**, **Instagram/Social**) with one click.
2. **Buyer Side**: Natural language conversational search $\rightarrow$ Ranks listings (0–100%) with **explainable AI reasoning** on why the property fits.

---

## 🚀 Phase 1 Architecture (Completed)

Phase 1 provides the core backend REST API and structured JSON database:

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database**: Local JSON storage (`server/data/listings.json`) with 5 curated test properties
- **AI Engine**: Dual-mode engine with live OpenAI integration + zero-failure smart simulation engine for hackathon demo resilience

### REST API Endpoints

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `GET /api/health` | `GET` | Health check, server status, and listing counter |
| `GET /api/listings` | `GET` | Retrieve all properties in the inventory |
| `POST /api/listings` | `POST` | Save a new property created by an agent |
| `POST /api/generate-descriptions` | `POST` | Generate 3 distinct tone versions (Luxury, Cozy, Instagram) |
| `POST /api/match-properties` | `POST` | Rank properties against natural language buyer queries with match reasoning |

---

## 📦 Project Structure

```
ai-realestate-generator/
├── .gitignore
├── README.md
└── server/
    ├── package.json
    ├── .env.example
    ├── server.js
    └── data/
        └── listings.json
```

---

## 🛠️ Quick Start (Phase 1)

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Run the Server
```bash
npm start
```
The server will start at `http://localhost:5000`.

### 3. Verify Endpoints
- **Health Check**: Visit `http://localhost:5000/api/health`
- **Listings**: Visit `http://localhost:5000/api/listings`

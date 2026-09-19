import test from 'node:test';
import assert from 'node:assert';

const BASE_URL = 'http://localhost:5000';

test('1. Health Check Endpoint returns online status and INR currency', async () => {
  const res = await fetch(`${BASE_URL}/api/health`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.status, 'online');
  assert.strictEqual(data.currency, 'INR (₹)');
  assert.ok(data.totalListings >= 10);
});

test('2. Listings Endpoint returns curated Indian real estate listings', async () => {
  const res = await fetch(`${BASE_URL}/api/listings`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.ok(Array.isArray(data.data));
  assert.ok(data.data.length >= 10);

  // Check currency formatting and Indian addresses
  const first = data.data[0];
  assert.ok(first.address);
  assert.ok(first.price);
  assert.ok(first.bedrooms);
});

test('3. Generate 3-Tone Listing Descriptions (Luxury, Cozy, Instagram)', async () => {
  const payload = {
    address: 'Bandra West, Mumbai',
    propertyType: 'Penthouse',
    bedrooms: 4,
    bathrooms: 4,
    sqft: 3200,
    price: 150000000,
    features: ['Sea View', 'Private Deck', 'Italian Marble'],
    vibeTags: ['#SeaFacing', '#UltraLuxury']
  };

  const res = await fetch(`${BASE_URL}/api/generate-descriptions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.ok(data.descriptions.luxury, 'Luxury tone generated');
  assert.ok(data.descriptions.cozy, 'Cozy tone generated');
  assert.ok(data.descriptions.instagram, 'Instagram tone generated');
});

test('4. Conversational Buyer Semantic Matching with Reasoning', async () => {
  const payload = {
    query: 'Modern luxury villa in Bengaluru with a private pool'
  };

  const res = await fetch(`${BASE_URL}/api/match-properties`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.ok(Array.isArray(data.matches));
  assert.ok(data.matches.length > 0);

  const topMatch = data.matches[0];
  assert.ok(topMatch.matchScore >= 50, 'Scored property');
  assert.ok(topMatch.matchReason, 'AI reasoning present');
});

test('5. User Authentication & Profile Picture Support', async () => {
  const testUser = {
    name: 'Evaluator Agent',
    email: `evaluator_${Date.now()}@test.com`,
    role: 'agent',
    phone: '+91 99999 88888',
    agency: 'Premier AI Realty',
    reraNumber: 'RERA/MH/2026/0999',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=256&q=80'
  };

  const res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testUser)
  });

  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.user.role, 'agent');
  assert.strictEqual(data.user.avatar, testUser.avatar);
});

test('6. Caching of Descriptions using propertyId + tone and < 100 word limits', async () => {
  const propertyId = 'prop-cache-test-101';
  const payload = {
    propertyId,
    address: 'Koramangala 4th Block, Bengaluru',
    propertyType: 'Modern Villa',
    bedrooms: 4,
    bathrooms: 4,
    sqft: 4200,
    price: 85000000,
    features: ['Private Pool', 'Solar Roof', 'Italian Kitchen']
  };

  // First call: generates and caches
  const res1 = await fetch(`${BASE_URL}/api/generate-descriptions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data1 = await res1.json();
  assert.strictEqual(data1.success, true);
  assert.ok(data1.descriptions.luxury);
  assert.ok(data1.descriptions.cozy);
  assert.ok(data1.descriptions.minimalist, 'Minimalist tone is present');

  // Verify word counts under 80-100 words
  const luxWords = data1.descriptions.luxury.split(/\s+/).filter(Boolean).length;
  const cozyWords = data1.descriptions.cozy.split(/\s+/).filter(Boolean).length;
  const minWords = data1.descriptions.minimalist.split(/\s+/).filter(Boolean).length;
  assert.ok(luxWords <= 100, `Luxury description under 100 words: got ${luxWords}`);
  assert.ok(cozyWords <= 100, `Cozy description under 100 words: got ${cozyWords}`);
  assert.ok(minWords <= 100, `Minimalist description under 100 words: got ${minWords}`);

  // Second call with same propertyId + tone returns cached
  const res2 = await fetch(`${BASE_URL}/api/generate-descriptions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, tone: 'luxury' })
  });
  const data2 = await res2.json();
  assert.strictEqual(data2.success, true);
  assert.strictEqual(data2.cached, true, 'Result was served from cache');
  assert.strictEqual(data2.descriptions.luxury, data1.descriptions.luxury, 'Identical cached content returned');
});

test('7. Weighted Property Matching (40% Location, 30% Budget, 20% Style, 10% Features)', async () => {
  const payload = {
    query: 'Looking for a sea-facing luxury 5 BHK in Mumbai Worli with a private pool under ₹20 Cr'
  };

  const res = await fetch(`${BASE_URL}/api/match-properties`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.ok(data.matches.length > 0);

  const top = data.matches[0];
  assert.ok(top.weightedBreakdown, 'Weighted breakdown object present');
  assert.strictEqual(top.weightedBreakdown.locationMax, 40, 'Location weight is 40%');
  assert.strictEqual(top.weightedBreakdown.budgetMax, 30, 'Budget weight is 30%');
  assert.strictEqual(top.weightedBreakdown.styleMax, 20, 'Style weight is 20%');
  assert.strictEqual(top.weightedBreakdown.featuresMax, 10, 'Features weight is 10%');

  // Verify one-line explanation format: "X% Match — This property has..."
  assert.ok(top.matchReason.includes('% Match — This property has'), `One-line explanation format matches specification: ${top.matchReason}`);
});

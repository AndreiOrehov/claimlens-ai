# Live Pricing via Gemini Search Grounding

## Problem

The pricing database (`pricing-db.js`) contains hardcoded US market prices from June 2025. These prices become stale immediately and there is no mechanism to update them. Users receive estimates based on potentially outdated data, reducing trust and accuracy.

## Solution

Before each damage analysis, the app fetches current market prices via Gemini 2.5 Flash with Google Search grounding. Results are cached in localStorage for 24 hours. The existing local database serves as fallback and independent validation layer.

## Architecture

### Data Flow

```
User clicks "Analyze"
        |
        v
  Check localStorage cache
  key: pricing_cache_{type}_{class|area}_{stateCode}
  TTL: 24 hours
        |
   cache hit?
   /        \
  yes        no
  |           |
  |     Gemini 2.5 Flash
  |     + google_search_retrieval
  |     (search for current repair costs)
  |           |
  |      success?
  |      /       \
  |    yes        no
  |     |          |
  |   cache it    fallback to
  |   (24h)       pricing-db.js
  |     |          |
  v     v          v
  Merge: API data + local DB gaps
        |
        v
  Build pricing context for prompt
  (label source: "Live" or "Reference")
        |
        v
  Nano Banana 2 + photos + pricing context
        |
        v
  Validate estimates against local pricing-db.js
  (always, regardless of pricing source)
```

### Components

#### 1. `fetchFreshPricing(type, options)` — new function in `pricing-db.js`

**Parameters:**
- `type`: `"auto"` or `"property"`
- `options.stateCode`: US state code (e.g., `"CA"`)
- `options.make`, `options.model`: for auto claims
- `options.area`, `options.cause`: for property claims

**Behavior:**
1. Build cache key: `pricing_cache_{type}_{vehicleClass|area}_{stateCode}`
2. Check localStorage — if cached and `Date.now() - timestamp < 86400000` (24h), return cached
3. Build component list:
   - Auto: all 17 components for the vehicle class
   - Property: relevant components via existing `getRelevantPropertyItems(area, cause)`
4. Call Gemini 2.5 Flash with `google_search_retrieval` tool
5. Parse JSON from response
6. On success: cache to localStorage, return data
7. On failure: return `null`

**Returns:** `{ source: "google_search", components: {...}, labor_rate: number } | null`

#### 2. `mergePricing(freshData, type, options)` — new function in `pricing-db.js`

Combines fresh API data with local database:
- If `freshData` is null: return local pricing only
- If `freshData` has all components: use API data, fill gaps from local
- Partial data: merge component-by-component

Returns unified pricing object with `source` field (`"live"` or `"reference"` per component).

#### 3. `buildPricingContext(type, options)` — modified

Add optional parameter `freshPricing`:
```javascript
buildPricingContext(type, { make, model, stateCode, freshPricing })
```

- If `freshPricing` provided: generate context text from it, label as `[Live pricing from Google Search]`
- If not: use existing local DB logic, label as `[Reference pricing database, last updated 2025-06]`

#### 4. `validateEstimates(assessment, type, options)` — unchanged

Always validates against `pricing-db.js` local data. This is independent quality control.

### Gemini Search Grounding Request Format

**Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={API_KEY}`

**Auto claims example:**
```json
{
  "contents": [{
    "parts": [{
      "text": "Find current 2025-2026 US auto body repair costs for a midsize class vehicle in California.\n\nComponents needed: front bumper, rear bumper, fender, hood, door, windshield, headlight, taillight, mirror, trunk, quarter panel, roof, frame, suspension, airbag, grille, paint per panel.\n\nFor each component provide repair cost range and replacement cost range in USD.\nAlso provide the average body shop labor rate per hour for this state.\n\nReturn ONLY valid JSON (no markdown):\n{\n  \"source\": \"google_search\",\n  \"state\": \"CA\",\n  \"vehicle_class\": \"midsize\",\n  \"labor_rate_per_hour\": number,\n  \"components\": {\n    \"bumper_front\": { \"repair\": [low, high], \"replace\": [low, high] },\n    ...\n  }\n}"
    }]
  }],
  "tools": [{
    "google_search_retrieval": {
      "dynamic_retrieval_config": {
        "mode": "MODE_DYNAMIC",
        "dynamic_threshold": 0.3
      }
    }
  }]
}
```

**Property claims example:**
```json
{
  "contents": [{
    "parts": [{
      "text": "Find current 2025-2026 repair costs in New York state for: roof shingle replacement per sq ft, drywall repair per sq ft, interior painting per sq ft, water damage dryout per sq ft, mold remediation per sq ft.\n\nFor each provide materials cost and labor cost per unit.\n\nReturn ONLY valid JSON (no markdown):\n{\n  \"source\": \"google_search\",\n  \"state\": \"NY\",\n  \"components\": {\n    \"roof_shingle\": { \"unit\": \"sq ft\", \"materials\": [low, high], \"labor\": [low, high] },\n    ...\n  }\n}"
    }]
  }]
}
```

### Cache Format (localStorage)

```javascript
{
  key: "pricing_cache_auto_midsize_CA",
  value: JSON.stringify({
    data: { /* parsed Gemini response */ },
    timestamp: 1712400000000,
    ttl: 86400000
  })
}
```

### Error Handling

| Scenario | Behavior |
|----------|----------|
| Gemini API unavailable (network error) | Fallback to `pricing-db.js`, no user-facing error |
| Response is not valid JSON | Fallback to `pricing-db.js` |
| JSON parses but has empty/zero prices | Fallback to `pricing-db.js` |
| Partial response (some components missing) | Merge: API data + missing from `pricing-db.js` |
| Rate limit (429) | Fallback to `pricing-db.js`, do not retry |
| Corrupted cache in localStorage | Delete cache entry, fetch fresh |

### UI Changes

#### Progress bar stages (in `handleAnalyze`)
```
0-20%:   "Fetching current market prices..."   (new)
20-40%:  "Processing images..."
40-70%:  "Identifying damage areas..."
70-90%:  "Estimating repair costs..."
90-100%: "Generating report..."
```

#### Pricing source badge (in ReportView)
Next to "Pricing Validation" header, show:
- **"Live Prices"** (green badge) — data from Google Search, cached < 24h
- **"Reference Prices"** (gray badge) — fallback to local database

## Files Changed

| File | Changes | Lines Added |
|------|---------|-------------|
| `pricing-db.js` | Add `fetchFreshPricing()`, `getCacheKey()`, `mergePricing()`. Update `buildPricingContext()` signature. | ~80-100 |
| `damage-assessment-mvp.jsx` | Call `fetchFreshPricing()` in `handleAnalyze()`. Update progress bar. Add source badge in ReportView. | ~15-20 |

## Constraints

- Gemini free tier: 15 requests per minute — sufficient for MVP
- localStorage limit: ~5-10MB — each cache entry ~2KB, supports ~5000 unique combinations
- Google Search grounding does not guarantee structured responses — robust JSON parsing required
- API key (via VITE_GEMINI_API_KEY env var) is shared with photo analysis — same rate limits apply
- `pricing-db.js` local data (v1.0.0, 2025-06) remains the source of truth for validation

## Out of Scope

- Admin UI for manual price editing
- Multiple API fallbacks (SerpAPI, etc.)
- Historical price tracking
- Price alerts or notifications
- Server-side caching or proxy

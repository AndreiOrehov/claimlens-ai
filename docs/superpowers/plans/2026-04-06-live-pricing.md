# Live Pricing via Gemini Search Grounding — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fetch current market prices via Gemini 2.5 Flash + Google Search grounding before each analysis, cache for 24h, fall back to local `pricing-db.js` on failure.

**Architecture:** Two-phase Gemini usage — first call (2.5 Flash + Search) fetches live prices, second call (Nano Banana 2) analyzes photos with those prices. Cache in localStorage keyed by `{type}_{class}_{state}`, TTL 24h. Local `pricing-db.js` is fallback + independent validation.

**Tech Stack:** Gemini API (existing key), localStorage caching, existing React/Vite app.

---

## File Structure

| File | Role | Changes |
|------|------|---------|
| `pricing-db.js` | Pricing data + utilities | Add `getCacheKey()`, `getCachedPricing()`, `setCachedPricing()`, `fetchFreshPricing()`, `mergePricing()`. Modify `buildPricingContext()`. Export new functions. |
| `damage-assessment-mvp.jsx` | Main app component | Import new functions. Modify `handleAnalyze()` to call `fetchFreshPricing()` before photo analysis. Update progress bar text. Add `pricingSource` to claim object. Add source badge in ReportView. |

---

### Task 1: Cache helpers in `pricing-db.js`

**Files:**
- Modify: `pricing-db.js` (after line 439, before the `AREA_PRICING_MAP` block at line 441)

- [ ] **Step 1: Add `getCacheKey()` function**

Add after the closing `}` of `buildPricingContext` (line 439) and before the `// --- Map areas/causes` comment (line 441):

```javascript
// --- Live pricing cache helpers ---
const GEMINI_API_KEY = "AIzaSyA4SyLpBF2uCJe0142lJkFPXU2BNIjHTyg";
const CACHE_TTL = 86400000; // 24 hours in ms

export function getCacheKey(type, options) {
  if (type === "auto") {
    const cls = getVehicleClass(options.make, options.model);
    return `pricing_cache_auto_${cls}_${options.stateCode}`;
  }
  return `pricing_cache_property_${options.area || "multiple"}_${options.stateCode}`;
}
```

- [ ] **Step 2: Add `getCachedPricing()` function**

Add immediately after `getCacheKey`:

```javascript
export function getCachedPricing(cacheKey) {
  try {
    const raw = localStorage.getItem(cacheKey);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (Date.now() - cached.timestamp > CACHE_TTL) {
      localStorage.removeItem(cacheKey);
      return null;
    }
    return cached.data;
  } catch {
    localStorage.removeItem(cacheKey);
    return null;
  }
}
```

- [ ] **Step 3: Add `setCachedPricing()` function**

Add immediately after `getCachedPricing`:

```javascript
function setCachedPricing(cacheKey, data) {
  try {
    localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
  } catch {
    // localStorage full — silently ignore
  }
}
```

- [ ] **Step 4: Verify no syntax errors**

Run: `cd "C:\Users\Android\Claude\Insurance" && export PATH="$PATH:/c/Program Files/nodejs" && npx vite build 2>&1 | tail -5`

Expected: Build succeeds with no errors.

- [ ] **Step 5: Commit**

```bash
git add pricing-db.js
git commit -m "feat: add pricing cache helpers (getCacheKey, getCachedPricing, setCachedPricing)"
```

---

### Task 2: `fetchFreshPricing()` in `pricing-db.js`

**Files:**
- Modify: `pricing-db.js` (after `setCachedPricing`, before `AREA_PRICING_MAP`)

- [ ] **Step 1: Add `fetchFreshPricing()` for auto claims**

Add after `setCachedPricing`:

```javascript
export async function fetchFreshPricing(type, options) {
  const cacheKey = getCacheKey(type, options);
  const cached = getCachedPricing(cacheKey);
  if (cached) return cached;

  try {
    const state = getStateData(options.stateCode);

    let promptText = "";
    if (type === "auto") {
      const cls = getVehicleClass(options.make, options.model);
      const clsLabel = { economy: "Economy", midsize: "Mid-size", luxury: "Luxury", truck_suv: "Truck/SUV" }[cls];
      const componentNames = Object.keys(AUTO_PARTS_PRICING).map((k) => k.replace(/_/g, " ")).join(", ");
      promptText = `Find current 2025-2026 US auto body repair costs for a ${clsLabel} class vehicle in ${state.label}.

Components needed: ${componentNames}.

For each component provide repair cost range [low, high] and replacement cost range [low, high] in USD.
Also provide the average body shop labor rate per hour for this state.

Return ONLY valid JSON (no markdown, no backticks):
{
  "source": "google_search",
  "state": "${options.stateCode}",
  "vehicle_class": "${cls}",
  "labor_rate_per_hour": number,
  "components": {
    "bumper_front": { "repair": [low, high], "replace": [low, high] },
    "bumper_rear": { "repair": [low, high], "replace": [low, high] }
  }
}
Use the exact component keys: ${Object.keys(AUTO_PARTS_PRICING).join(", ")}.`;
    }

    if (type === "property") {
      const relevant = getRelevantPropertyItems(options.area, options.cause);
      const componentNames = relevant.map((k) => {
        const d = PROPERTY_PRICING[k];
        return d ? `${k.replace(/_/g, " ")} (per ${d.unit})` : k.replace(/_/g, " ");
      }).join(", ");
      promptText = `Find current 2025-2026 repair costs in ${state.label} for: ${componentNames}.

For each provide materials cost range [low, high] and labor cost range [low, high] per unit.

Return ONLY valid JSON (no markdown, no backticks):
{
  "source": "google_search",
  "state": "${options.stateCode}",
  "components": {
    "roof_shingle": { "unit": "sq ft", "materials": [low, high], "labor": [low, high] }
  }
}
Use the exact component keys: ${relevant.join(", ")}.`;
    }

    if (!promptText) return null;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          tools: [{
            google_search_retrieval: {
              dynamic_retrieval_config: { mode: "MODE_DYNAMIC", dynamic_threshold: 0.3 },
            },
          }],
        }),
      }
    );

    const data = await response.json();
    if (data.error) return null;

    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
    const cleaned = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    if (!parsed.components || Object.keys(parsed.components).length === 0) return null;

    setCachedPricing(cacheKey, parsed);
    return parsed;
  } catch {
    return null;
  }
}
```

- [ ] **Step 2: Verify build**

Run: `cd "C:\Users\Android\Claude\Insurance" && export PATH="$PATH:/c/Program Files/nodejs" && npx vite build 2>&1 | tail -5`

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add pricing-db.js
git commit -m "feat: add fetchFreshPricing() with Gemini Search grounding"
```

---

### Task 3: `mergePricing()` in `pricing-db.js`

**Files:**
- Modify: `pricing-db.js` (after `fetchFreshPricing`, before `AREA_PRICING_MAP`)

- [ ] **Step 1: Add `mergePricing()` function**

Add after `fetchFreshPricing`:

```javascript
export function mergePricing(freshData, type, options) {
  const state = getStateData(options.stateCode);

  if (type === "auto") {
    const cls = getVehicleClass(options.make, options.model);
    const merged = {};
    for (const [key, localData] of Object.entries(AUTO_PARTS_PRICING)) {
      const local = localData[cls];
      const fresh = freshData?.components?.[key];
      if (fresh && fresh.repair && fresh.replace) {
        merged[key] = { ...fresh, source: "live" };
      } else {
        merged[key] = {
          repair: local.repair,
          replace: local.replace,
          labor_hours: local.labor_hours,
          source: "reference",
        };
      }
    }
    return {
      source: freshData ? "live" : "reference",
      labor_rate_per_hour: freshData?.labor_rate_per_hour || state.autoLaborRate,
      components: merged,
    };
  }

  if (type === "property") {
    const relevant = getRelevantPropertyItems(options.area, options.cause);
    const mult = state.propertyMultiplier;
    const merged = {};
    for (const key of relevant) {
      const local = PROPERTY_PRICING[key];
      const fresh = freshData?.components?.[key];
      if (fresh && fresh.materials && fresh.labor) {
        merged[key] = { ...fresh, source: "live" };
      } else if (local) {
        merged[key] = {
          unit: local.unit,
          materials: [local.materials[0] * mult, local.materials[1] * mult],
          labor: [local.labor[0] * mult, local.labor[1] * mult],
          notes: local.notes,
          source: "reference",
        };
      }
    }
    return { source: freshData ? "live" : "reference", components: merged };
  }

  return { source: "reference", components: {} };
}
```

- [ ] **Step 2: Verify build**

Run: `cd "C:\Users\Android\Claude\Insurance" && export PATH="$PATH:/c/Program Files/nodejs" && npx vite build 2>&1 | tail -5`

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add pricing-db.js
git commit -m "feat: add mergePricing() to combine live and local data"
```

---

### Task 4: Update `buildPricingContext()` to accept fresh pricing

**Files:**
- Modify: `pricing-db.js` — the `buildPricingContext` function (lines 381-438)

- [ ] **Step 1: Modify `buildPricingContext` to use merged pricing when available**

Replace the function body. The function signature adds `freshPricing` to options:

In the auto branch (inside `if (type === "auto")`), replace lines 389-406 with:

```javascript
    const sourceLabel = options.freshPricing?.source === "live"
      ? "[Live pricing from Google Search]"
      : `[Reference pricing database, last updated ${PRICING_LAST_UPDATED}]`;

    let lines = [
      `\n--- PRICING REFERENCE DATA (${state.label}, ${clsLabel} class) ${sourceLabel} ---`,
      `State avg body shop labor rate: $${options.freshPricing?.labor_rate_per_hour || state.autoLaborRate}/hr`,
      `Vehicle class: ${clsLabel}`,
      ``,
      `Component costs (parts+labor, USD):`,
      `Component | Repair Range | Replace Range | Labor Hours`,
    ];

    if (options.freshPricing?.components) {
      for (const [key, d] of Object.entries(options.freshPricing.components)) {
        const name = key.replace(/_/g, " ");
        const rep = d.repair?.[0] != null ? `$${d.repair[0]}-$${d.repair[1]}` : "N/A";
        const repl = d.replace?.[0] != null ? `$${d.replace[0]}-$${d.replace[1]}` : "N/A";
        const hours = d.labor_hours ? `${d.labor_hours[0]}-${d.labor_hours[1]}h` : "—";
        lines.push(`${name} | ${rep} | ${repl} | ${hours}`);
      }
    } else {
      for (const [key, data] of Object.entries(AUTO_PARTS_PRICING)) {
        const d = data[cls];
        const name = key.replace(/_/g, " ");
        const rep = d.repair[0] !== null ? `$${d.repair[0]}-$${d.repair[1]}` : "N/A";
        const repl = d.replace[0] !== null ? `$${d.replace[0]}-$${d.replace[1]}` : "N/A";
        lines.push(`${name} | ${rep} | ${repl} | ${d.labor_hours[0]}-${d.labor_hours[1]}h`);
      }
    }
    lines.push(`\nUse these as baseline. Adjust within reason for specific damage severity and circumstances.`);
    return lines.join("\n");
```

In the property branch (inside `if (type === "property")`), replace lines 414-435 with:

```javascript
    const sourceLabel = options.freshPricing?.source === "live"
      ? "[Live pricing from Google Search]"
      : `[Reference pricing database, last updated ${PRICING_LAST_UPDATED}]`;

    let lines = [
      `\n--- PRICING REFERENCE DATA (${state.label}, multiplier: ${mult}x) ${sourceLabel} ---`,
      ``,
      `Relevant repair costs:`,
      `Work Type | Unit | Materials | Labor | Total/Unit | Notes`,
    ];

    if (options.freshPricing?.components) {
      for (const [key, d] of Object.entries(options.freshPricing.components)) {
        const name = key.replace(/_/g, " ");
        const matLo = d.materials?.[0]?.toFixed(2) || "?";
        const matHi = d.materials?.[1]?.toFixed(2) || "?";
        const labLo = d.labor?.[0]?.toFixed(2) || "?";
        const labHi = d.labor?.[1]?.toFixed(2) || "?";
        const totLo = (d.materials?.[0] + d.labor?.[0])?.toFixed(2) || "?";
        const totHi = (d.materials?.[1] + d.labor?.[1])?.toFixed(2) || "?";
        lines.push(`${name} | per ${d.unit || "unit"} | $${matLo}-$${matHi} | $${labLo}-$${labHi} | $${totLo}-$${totHi} | ${d.notes || ""}`);
      }
    } else {
      for (const key of relevant) {
        const d = PROPERTY_PRICING[key];
        if (!d) continue;
        const matLo = (d.materials[0] * mult).toFixed(2);
        const matHi = (d.materials[1] * mult).toFixed(2);
        const labLo = (d.labor[0] * mult).toFixed(2);
        const labHi = (d.labor[1] * mult).toFixed(2);
        const totLo = ((d.materials[0] + d.labor[0]) * mult).toFixed(2);
        const totHi = ((d.materials[1] + d.labor[1]) * mult).toFixed(2);
        const name = key.replace(/_/g, " ");
        lines.push(`${name} | per ${d.unit} | $${matLo}-$${matHi} | $${labLo}-$${labHi} | $${totLo}-$${totHi} | ${d.notes}`);
      }
    }
    lines.push(`\nUse these as baseline. Adjust for specific damage extent and property characteristics.`);
    return lines.join("\n");
```

- [ ] **Step 2: Verify build**

Run: `cd "C:\Users\Android\Claude\Insurance" && export PATH="$PATH:/c/Program Files/nodejs" && npx vite build 2>&1 | tail -5`

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add pricing-db.js
git commit -m "feat: update buildPricingContext to use live pricing data when available"
```

---

### Task 5: Update import and `handleAnalyze()` in main component

**Files:**
- Modify: `damage-assessment-mvp.jsx` — line 2 (import), lines 584-700 (handleAnalyze)

- [ ] **Step 1: Update import on line 2**

Replace line 2:
```javascript
import { US_STATES, buildPricingContext, validateEstimates, getVehicleClass } from "./pricing-db.js";
```
With:
```javascript
import { US_STATES, buildPricingContext, validateEstimates, getVehicleClass, fetchFreshPricing, mergePricing } from "./pricing-db.js";
```

- [ ] **Step 2: Add `fetchFreshPricing` call in `handleAnalyze`**

In `handleAnalyze()`, after the `try {` line (line 598) and before `const vehicleContext` (line 599), add:

```javascript
      // Fetch live pricing (or use cache/fallback)
      const pricingOptions = type === "auto"
        ? { make: vMake, model: vModel, stateCode: claimState }
        : { area: pArea, cause: pCause, stateCode: claimState };
      const freshData = await fetchFreshPricing(type, pricingOptions);
      const mergedPricing = mergePricing(freshData, type, pricingOptions);
```

- [ ] **Step 3: Pass merged pricing to `buildPricingContext`**

Replace the existing `buildPricingContext` calls in the system prompt (lines 632-640):

Replace:
```javascript
${(() => {
  if (type === "auto" && vMake && claimState) {
    return buildPricingContext("auto", { make: vMake, model: vModel, stateCode: claimState });
  }
  if (type === "property" && claimState) {
    return buildPricingContext("property", { area: pArea, cause: pCause, stateCode: claimState });
  }
  return "";
})()}
```

With:
```javascript
${(() => {
  if (type === "auto" && vMake && claimState) {
    return buildPricingContext("auto", { make: vMake, model: vModel, stateCode: claimState, freshPricing: mergedPricing });
  }
  if (type === "property" && claimState) {
    return buildPricingContext("property", { area: pArea, cause: pCause, stateCode: claimState, freshPricing: mergedPricing });
  }
  return "";
})()}
```

- [ ] **Step 4: Add `pricingSource` to claim object**

In the claim object (around line 680), add after `state: claimState,`:

```javascript
        pricingSource: mergedPricing?.source || "reference",
```

- [ ] **Step 5: Verify build**

Run: `cd "C:\Users\Android\Claude\Insurance" && export PATH="$PATH:/c/Program Files/nodejs" && npx vite build 2>&1 | tail -5`

Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add damage-assessment-mvp.jsx
git commit -m "feat: integrate fetchFreshPricing into handleAnalyze flow"
```

---

### Task 6: Update progress bar text

**Files:**
- Modify: `damage-assessment-mvp.jsx` — the progress text line (around line 872)

- [ ] **Step 1: Update progress text thresholds**

Find this line:
```javascript
            {progress < 30 ? "Processing images..." : progress < 60 ? "Identifying damage areas..." : progress < 90 ? "Estimating repair costs..." : "Generating report..."}
```

Replace with:
```javascript
            {progress < 15 ? "Fetching current market prices..." : progress < 35 ? "Processing images..." : progress < 65 ? "Identifying damage areas..." : progress < 90 ? "Estimating repair costs..." : "Generating report..."}
```

- [ ] **Step 2: Commit**

```bash
git add damage-assessment-mvp.jsx
git commit -m "feat: update progress bar with pricing fetch stage"
```

---

### Task 7: Add pricing source badge in ReportView

**Files:**
- Modify: `damage-assessment-mvp.jsx` — the Pricing Validation section (around line 1512)

- [ ] **Step 1: Add source badge after "Pricing Validation" text**

Find the line:
```javascript
            Pricing Validation
```

Replace the entire `<h3>` element (lines 1512-1520) with:

```javascript
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            Pricing Validation
            {claim.pricingSource === "live" && (
              <span style={{
                fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 12,
                background: palette.successSoft, color: palette.success,
              }}>
                Live Prices
              </span>
            )}
            {claim.pricingSource !== "live" && (
              <span style={{
                fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 12,
                background: palette.surfaceAlt, color: palette.textDim,
              }}>
                Reference Prices
              </span>
            )}
            <span style={{
              fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 12,
              background: claim.validation.warnings === 0 ? palette.successSoft : palette.warningSoft,
              color: claim.validation.warnings === 0 ? palette.success : palette.warning,
            }}>
              {claim.validation.totalChecked} checked · {claim.validation.warnings} flagged
            </span>
          </h3>
```

- [ ] **Step 2: Verify build**

Run: `cd "C:\Users\Android\Claude\Insurance" && export PATH="$PATH:/c/Program Files/nodejs" && npx vite build 2>&1 | tail -5`

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add damage-assessment-mvp.jsx
git commit -m "feat: add Live/Reference pricing source badge in report"
```

---

### Task 8: End-to-end verification

- [ ] **Step 1: Start dev server and verify**

Run: `cd "C:\Users\Android\Claude\Insurance" && export PATH="$PATH:/c/Program Files/nodejs" && npx vite --port 5173`

Open http://localhost:5173 in browser.

- [ ] **Step 2: Test auto claim with live pricing**

1. Create a new auto claim: Toyota Camry, 2020, California
2. Upload at least one photo
3. Click Analyze
4. Verify progress bar shows "Fetching current market prices..." first
5. Verify report shows "Live Prices" green badge (if Search grounding succeeded) or "Reference Prices" gray badge (if fallback)
6. Verify validation still works with per-component indicators

- [ ] **Step 3: Test cache hit**

1. Create another auto claim with same vehicle class + state (e.g., Honda Civic, California — both midsize + CA)
2. Verify the pricing fetch is instant (cache hit, no API call)
3. Check browser DevTools → Application → Local Storage for `pricing_cache_auto_midsize_CA` entry

- [ ] **Step 4: Test property claim**

1. Switch to Property Damage
2. Select: roof damage, water/flood, New York
3. Upload photo, click Analyze
4. Verify pricing context uses relevant property components

- [ ] **Step 5: Test fallback**

1. Temporarily break the Gemini API key (change one character)
2. Clear localStorage cache
3. Submit a claim
4. Verify it still works — falls back to pricing-db.js silently
5. Verify report shows "Reference Prices" badge
6. Restore the API key

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "test: verify live pricing integration end-to-end"
```

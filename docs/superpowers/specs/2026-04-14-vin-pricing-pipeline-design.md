# VIN-Based Pricing Pipeline Design

**Date:** 2026-04-14
**Status:** Approved
**Baseline tag:** v0.9.9-stable

## Problem

Current pricing pipeline has 3 issues:
1. Price lookup runs in parallel with detection on 14 generic parts — wastes API calls on parts that may not be damaged
2. Prices are generic (by vehicle class), not model-specific or VIN-specific
3. No VIN input — user manually selects make/model/year, error-prone

## Solution

### New Pipeline Order

```
OLD (fallback):
  Photos → [generic price lookup + Gemini detection] parallel → merge → estimate

NEW:
  Photos → Gemini detection → damaged parts list → VIN-specific price lookup → estimate
```

Old pipeline preserved as fallback via code flag.

### VIN UI

Location: top of NewClaimView form, above vehicle fields.

Components:
- Text input field (17 chars, format validation: alphanumeric, no I/O/Q)
- "Scan" button — upload photo of VIN plate → Gemini OCR extracts VIN → populates field
- "Auto-fill" button — calls NHTSA vPIC API → fills year/make/model/trim/engine
- If VIN skipped — manual entry works as before
- VIN saved to claim object and displayed in PDF report

### NHTSA VIN Decode

```
GET https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/{VIN}?format=json
```

Free, no API key. Returns: ModelYear, Make, Model, Trim, EngineModel, BodyClass, DriveType.

Field mapping:
- ModelYear → vYear
- Make → vMake
- Model → vModel
- Trim → vTrim
- EngineModel + FuelTypePrimary → vEngine

### VIN OCR (Scan)

Use existing Gemini API with prompt:
```
Extract the 17-character VIN number from this image.
Return ONLY the VIN string, nothing else.
A valid VIN is exactly 17 alphanumeric characters (no I, O, or Q).
```

Single Gemini call, no consensus needed (OCR is deterministic enough).

### Price Lookup — New Flow

After detection produces damaged components list:

1. Group components into batches of 4-5
2. For each batch, LLM prompt:
   - WITH VIN: "Find OEM part numbers and prices for {year} {make} {model} {trim} VIN:{vin} — parts: {list}. Include OEM and aftermarket (CAPA/LKQ) price ranges."
   - WITHOUT VIN: "Find {year} {make} {model} replacement parts prices — parts: {list}. Include OEM and aftermarket price ranges."
3. Parse response: { component: { oem_part_number, oem_price, aftermarket_price } }
4. Merge into estimate

Provider chain: OpenAI (primary) → fallback to current static pricing.

### Fallback Chain (per component)

```
VIN + LLM lookup (exact) → generic LLM lookup (by model) → static AUTO_PARTS_PRICING (database)
```

### PDF Report Changes

Add VIN to header section:
```
Vehicle: 2023 Tesla Model Y Performance · Electric
VIN: 7SAYGDEF7PF858597
```

Add pricing source per component in damage breakdown:
```
Part: $1,000 (OEM: $1,400) [VIN-matched]
Part: $500 (OEM: $800) [model-estimate]
Part: $325 [reference DB]
```

### Implementation Order

1. Git tag v0.9.9-stable (done)
2. Add VIN field to UI + NHTSA auto-fill
3. Add VIN OCR (Scan button)
4. Add VIN to claim object + PDF report
5. Reorder pipeline: detection first, then price lookup
6. Implement VIN-specific price lookup
7. Fallback to old pipeline if new fails
8. Test with Malibu + Tesla cases

### Rollback

```
git checkout v0.9.9-stable
```

Restores the pre-VIN version immediately.

# Detection Engine — Stabilize Image Analysis Results

## Problem

ClaimPilot AI produces 46% variance between repeated analyses of the same photos. Root causes:
- Gemini inconsistently assigns `operation` (R&R vs Refinish vs Blend for same component)
- Gemini inconsistently assigns `severity` (moderate vs severe)
- Borderline components flip on minVotes=2 threshold (radiator_support, reinforcement)
- REFINISH/BLEND operations bypass severity-based derivation

Target: <=5% variance (ideally 0%).

## Solution

Extract all decision logic from Gemini. Gemini becomes detection-only ("eyes"). All derivation is deterministic and rule-based in a new `detection-engine.js` module.

## New Gemini Schema

### Remove from Gemini output:
- `operation` — derived from severity + component type
- `severity` — derived from damage_indicators weights
- `part_type` — derived from component category

### Add to Gemini output:
- `damage_indicators` — array of strings from closed vocabulary (22 indicators)

### Per-damage item schema:
```json
{
  "component": "STRING (from closed parts vocabulary)",
  "damage_indicators": ["STRING (from closed indicator vocabulary)"],
  "description": "STRING (specific visual evidence)"
}
```

### Top-level schema (unchanged fields):
- `summary`, `damage_type`, `confidence` — kept as-is
- `potential_damages` — kept (used as Gemini supplement to rule-based checklist)
- `recommendations`, `flags`, `repair_vs_replace` — kept as-is
- `adjuster_checklist` — removed (replaced by rule-based inspection checklist)

## Closed Indicator Vocabulary (22 indicators)

### Weight 3 — Deformation (structure lost):
`crushed`, `buckled`, `collapsed`, `torn`, `shattered`, `severed`, `kinked`, `pushed_in`

### Weight 2 — Damage (part compromised):
`cracked`, `dented`, `bent`, `creased`, `misaligned`, `punctured`, `gouged`, `broken`

### Weight 1 — Cosmetic (surface only):
`scratched`, `scuffed`, `chipped`, `faded`, `peeling`, `discolored`, `rubbed`

## Module: `detection-engine.js` (~350-400 lines)

### Exports:

```
INDICATOR_WEIGHTS          — {indicator: weight} mapping
COMPONENT_CATEGORIES       — {structural: [...], exterior_panel: [...], glass: [...], electronics: [...], mechanical: [...]}
ALWAYS_REPLACE             — components that cannot be repaired
GUARANTEED_PAIRS           — structural guarantee rules
INSPECTION_RULES           — rule-based checklist templates by impact zone

deriveSeverity(indicators)                         — max weight → severity
deriveOperation(component, severity)               — rules → operation
derivePartType(component)                          — category → OEM/AFT
guaranteedDamages(confirmedDamages, impactZones)   — add structural guarantees
buildInspectionChecklist(impactZones, geminiPotentials) — rule-based + Gemini union
mergeRuns(runs, minVotes)                          — consensus merge with weighted indicator union
processDetection(geminiRuns, vehicleInfo)           — main orchestrator
```

### deriveSeverity(indicators)

```
max weight of indicators → severity
weight 3 → "severe"
weight 2 → "moderate"
weight 1 → "minor"
empty [] → "moderate" (fallback)
```

### deriveOperation(component, severity)

Priority order:
1. Component in ALWAYS_REPLACE → "R&R" (regardless of severity)
2. severity = "severe" → "R&R"
3. severity = "moderate" or "minor" → "Repair"

ALWAYS_REPLACE list: headlamp, headlight, tail_lamp, tail_light, fog_lamp, fog_light, grille, windshield, back_glass, rear_window, side_window, door_glass, quarter_glass, sunroof, mirror, sensor, camera, radar, abs_sensor, parking_sensor, airbag, seat_belt, wiring_harness, license_plate_lamp, backup_lamp, ac_condenser, ac_compressor, radiator, alternator, starter, water_pump.

No Refinish/Blend at this stage — paint operations are added in pricing phase.

### derivePartType(component)

- structural (reinforcement, support, frame_rail, crossmember, floor_pan) → "OEM"
- glass (windshield, back_glass, door_glass, quarter_glass) → "OEM"
- electronics (sensor, camera, radar, airbag, wiring_harness) → "OEM"
- everything else (exterior panels, mechanical) → "AFT"

### mergeRuns(runs, minVotes=2)

1. Normalize component names (snake_case, alphabetical word sort)
2. Group by component across runs (with side-awareness: LH/RH never merge)
3. Filter: component must appear in >= minVotes runs
4. Merge damage_indicators with weighted consensus:
   - Weight 1-2 indicators: require 2+ runs to confirm
   - Weight 3 indicators (deformation): 1 run sufficient (if component already confirmed by minVotes)
   - Rationale: `scratched` can be confused with dirt; `buckled` cannot
5. Use longest description from any run
6. Post-processing: if Gemini returns an indicator not in the closed vocabulary, attempt fuzzy match (e.g., "smashed" → "crushed", "warped" → "bent"). If no match found, ignore the indicator (description field preserves the detail for PDF).

### guaranteedDamages(confirmedDamages, impactZones)

#### Front impact rules:
| Condition | Add | Severity | Operation |
|---|---|---|---|
| front_bumper_cover = severe | front_bumper_reinforcement | severe | R&R |
| front_bumper_cover = severe + hood = severe | radiator_support | severe | R&R |
| radiator_support = severe | ac_condenser | severe | R&R |
| radiator_support = severe | radiator | severe | R&R |

#### Rear impact rules:
| Condition | Add | Severity | Operation |
|---|---|---|---|
| rear_bumper_cover = severe | rear_bumper_reinforcement | severe | R&R |
| trunk_lid = severe + rear_bumper_cover = severe | rear_body_panel | severe | R&R |

#### Structural (caption-triggered):
| Condition | Add | Severity | Operation |
|---|---|---|---|
| frame/structural keywords in caption | frame_setup | severe | Sublet |
| ^ + rear impact | rear_frame_rail | severe | R&R |
| ^ + rear impact | trunk_floor_pan | moderate | R&R |
| ^ + rear impact | rear_crossmember | severe | R&R |
| ^ + front impact | front_frame_rail | severe | R&R |

#### Sublet (always):
| Condition | Add |
|---|---|
| Any confirmed damage | diagnostic_scan (pre+post combo) |
| Front impact severe | wheel_alignment |
| Structural damage | frame_setup (if not already present) |

### R&I Cascade (moved from damage-assessment-mvp.jsx)

| Primary R&R | Add R&I |
|---|---|
| hood | hood_insulator |
| front_fender (per side) | fender_liner (same side) |
| quarter_panel (per side) | wheelhouse_liner (same side), body_side_molding (same side), rear_spoiler |
| trunk_lid | rear_spoiler |
| liftgate | rear_spoiler, liftgate_glass |
| rear_body_panel | splash_shield |

### buildInspectionChecklist(impactZones, geminiPotentials)

Rule-based templates by zone:

**Front severe:**
- Inspect front frame rails for sway/crush/buckling
- Check radiator and A/C condenser for leaks
- Verify engine/transmission mount integrity
- Check cooling fan operation
- Inspect front suspension components
- Verify airbag deployment status

**Rear severe:**
- Inspect rear frame rails for deformation
- Check trunk floor pan for buckling
- Inspect spare tire well
- Check exhaust system routing and hangers
- Inspect fuel system components
- Verify rear suspension alignment

**General (always):**
- Perform pre-repair diagnostic scan
- Check all glass for cracks not visible in photos
- Verify all door/panel gaps and alignment
- Check for fluid leaks under vehicle

**Gemini supplement:** Union of unique observations from all runs' `potential_damages` — added after rule-based items, deduplicated.

## Changes to `damage-assessment-mvp.jsx`

### Remove (~250 lines):
- Merge block (lines ~1748-1870) → `mergeRuns()`
- Operation derivation (lines ~1821-1840) → `deriveOperation()`
- ALWAYS_REPLACE list → engine constant
- SEV_WEIGHT / median severity → `deriveSeverity()`
- Enrichment Phase 1 (lines ~1902-2006) → `guaranteedDamages()`, R&I cascade, `buildInspectionChecklist()`

### Modify:
- Gemini JSON schema: remove `operation`, `severity`, `part_type`; add `damage_indicators`
- Prompt: remove operation/severity instructions; add indicator vocabulary and instructions
- Replace merge+enrichment with single `processDetection()` call

### Keep unchanged:
- Pricing Phase 2 (lines ~2008-2185) — receives same `damages[]` format
- PDF generation
- UI components
- ACV lookup, state rates
- `pricing-db.js`, `labor-times.js`

## Updated Prompt (key sections)

```
For each damaged component, provide ONLY:
- component: from CLOSED PARTS VOCABULARY (snake_case, append _LH/_RH for sided parts)
- damage_indicators: array from CLOSED INDICATOR VOCABULARY:
  [crushed, buckled, collapsed, torn, shattered, severed, kinked, pushed_in,
   cracked, dented, bent, creased, misaligned, punctured, gouged, broken,
   scratched, scuffed, chipped, faded, peeling, discolored, rubbed]
- description: what you see — specific visual evidence

Do NOT assess severity, operation type, part type, or any costs.
Your ONLY job is to identify WHAT is damaged and describe the VISIBLE DAMAGE INDICATORS.
```

## Data Flow

```
Photos → Gemini 3.1 Flash × 3 (component + indicators + description)
    ↓
detection-engine.js:
    mergeRuns()              — consensus minVotes=2, weighted indicator union
    deriveSeverity()         — indicators → severity (deterministic)
    deriveOperation()        — component + severity → operation (deterministic)
    derivePartType()         — component category → OEM/AFT (deterministic)
    guaranteedDamages()      — structural pairs (deterministic)
    R&I cascade              — adjacent components (deterministic)
    buildInspectionChecklist() — rule-based + Gemini union
    ↓
damage-assessment-mvp.jsx:
    Pricing Phase 2          — hours, rates, parts from DB (deterministic)
    Report generation        — PDF, UI
```

**Single point of variability:** Gemini detection (which components seen + which indicators). Everything else is 100% deterministic.

## Expected Impact

- Current variance: 46% ($5,471 on $12K-17K estimates)
- Expected variance: <=5% (~$500-600)
- Source of remaining variance: Gemini may detect/miss 1-2 borderline components across runs; guaranteed pairs eliminate most of this for structural items

## Verification Plan

1. Run same photos 5 times → compare totals (target: max $500 spread)
2. Compare line items across runs → same components, same operations, same prices
3. Verify guaranteed pairs fire correctly (front severe → reinforcement + radiator_support)
4. Verify inspection checklist is identical across runs for same damage pattern
5. Validate against GEICO benchmark ($28K Tesla) — enrichment should still produce comparable totals

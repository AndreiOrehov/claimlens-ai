// Detection Engine — Deterministic damage derivation from Gemini detection output
// Gemini provides: component + damage_indicators + description
// This module derives: severity, operation, part_type, guaranteed pairs, inspection checklist
// All logic is rule-based and deterministic — same input = same output, always.

import { ALL_PARTS, PARTS_CATALOG } from "./parts-catalog.js";
import { DIAGNOSTIC_FLAT_RATES } from "./pricing-db.js";

// ============================================================
// CONSTANTS
// ============================================================

// --- 22 closed indicators with weights ---
export const INDICATOR_WEIGHTS = {
  // Weight 3 — Deformation (structure lost, part destroyed)
  crushed: 3, buckled: 3, collapsed: 3, torn: 3,
  shattered: 3, severed: 3, kinked: 3, pushed_in: 3,
  // Weight 2 — Damage (part compromised but exists)
  cracked: 2, dented: 2, bent: 2, creased: 2,
  misaligned: 2, punctured: 2, gouged: 2, broken: 2,
  // Weight 1 — Cosmetic (surface only)
  scratched: 1, scuffed: 1, chipped: 1, faded: 1,
  peeling: 1, discolored: 1, rubbed: 1,
};

// --- Wear/aging indicators — NOT collision damage, should be filtered when alone ---
export const WEAR_ONLY_INDICATORS = new Set([
  "discolored", "faded", "peeling", "rubbed",
]);

// --- Fuzzy synonym map for non-vocabulary indicators ---
export const FUZZY_INDICATOR_MAP = {
  smashed: "crushed", crunched: "crushed", mangled: "crushed", destroyed: "crushed",
  warped: "bent", twisted: "bent", deformed: "bent",
  split: "torn", ripped: "torn", separated: "torn",
  busted: "broken", snapped: "broken", fractured: "cracked",
  pushed: "pushed_in", pushed_back: "pushed_in", set_back: "pushed_in", setback: "pushed_in",
  wrinkled: "creased", folded: "creased",
  loose: "misaligned", shifted: "misaligned", offset: "misaligned", displaced: "misaligned",
  pierced: "punctured", perforated: "punctured",
  scraped: "scratched", marred: "scratched", abraded: "scuffed",
  worn: "faded", oxidized: "faded", cloudy: "faded", yellowed: "discolored",
  flaking: "peeling", blistering: "peeling",
  nicked: "chipped", pitted: "chipped",
};

// --- Component categories for part_type derivation ---
export const COMPONENT_CATEGORIES = {
  structural: [
    "front_bumper_reinforcement", "rear_bumper_reinforcement", "bumper_absorber",
    "radiator_support", "core_support", "upper_tie_bar",
    "front_frame_rail", "rear_frame_rail", "front_side_member", "rear_side_member",
    "front_floor_pan", "rear_floor_pan", "trunk_floor_pan", "spare_tire_well",
    "front_crossmember", "center_crossmember", "rear_crossmember", "rear_crossmember_structural",
    "strut_tower_front", "strut_tower_rear", "shock_tower_front", "shock_tower_rear",
    "firewall", "dash_panel", "dash_panel_reinforcement",
    "rocker_panel", "outer_rocker_panel", "inner_rocker_panel",
    "a_pillar", "b_pillar", "c_pillar", "d_pillar",
    "roof_side_rail", "rear_body_panel", "tail_panel",
    "front_apron_panel", "front_side_member_extension",
    "rear_wheelhouse", "inner_rear_wheelhouse", "front_wheelhouse", "inner_front_wheelhouse",
  ],
  glass: [
    "windshield", "front_windshield", "front_glass",
    "rear_window", "back_glass", "backlite",
    "side_window_glass", "door_glass", "quarter_glass", "quarter_window",
    "vent_glass", "vent_window", "sunroof_glass", "moonroof_glass", "sunroof_panel",
    "liftgate_glass", "tailgate_glass",
  ],
  electronics: [
    "headlamp_assembly", "headlight_assembly", "headlamp_housing",
    "tail_lamp_assembly", "tail_light_assembly",
    "fog_lamp", "fog_light", "daytime_running_lamp", "drl",
    "turn_signal_lamp", "indicator_lamp", "side_marker_lamp",
    "stop_lamp", "brake_light", "high_mount_stop_lamp", "third_brake_light",
    "reverse_lamp", "backup_lamp", "license_plate_lamp", "license_plate_light",
    "window_regulator", "power_window_regulator", "window_motor",
    "door_lock_actuator", "door_mirror", "outside_rearview_mirror", "side_view_mirror",
  ],
  mechanical: [
    "ac_condenser", "ac_compressor", "radiator", "alternator", "starter", "water_pump",
    "cooling_fan", "cooling_fan_assembly", "power_steering_rack", "tie_rod_end",
    "cv_axle", "wheel_hub_bearing",
  ],
  // Everything not in the above → exterior_panel / misc → defaults to AFT
};

// --- Non-repairable parts: always R&R regardless of severity ---
export const ALWAYS_REPLACE = [
  "headlamp", "headlight", "tail_lamp", "tail_light", "fog_lamp", "fog_light",
  "grille", "grille_assembly", "grille_surround",
  "windshield", "back_glass", "rear_window", "side_window", "door_glass", "quarter_glass",
  "sunroof", "sunroof_glass", "moonroof_glass",
  "mirror", "door_mirror", "side_view_mirror", "outside_rearview_mirror",
  "sensor", "camera", "radar", "abs_sensor", "parking_sensor",
  "airbag", "seat_belt", "wiring_harness",
  "license_plate_lamp", "backup_lamp", "reverse_lamp",
  "ac_condenser", "ac_compressor", "radiator", "alternator", "starter", "water_pump",
  "window_regulator", "window_motor", "door_lock_actuator",
  "wheel_tire", "tire", "wheel_rim", "rim",
  "turn_signal_lamp", "indicator_lamp", "side_marker_lamp",
  "stop_lamp", "brake_light", "high_mount_stop_lamp", "third_brake_light",
  "daytime_running_lamp", "drl", "reflector",
  "emblem", "badge",
];

// --- Guaranteed structural pairs ---
// If condition components are confirmed, add the guaranteed component
export const GUARANTEED_PAIRS = {
  front: [
    {
      condition: (damages) => hasSevere(damages, "front_bumper_cover"),
      add: { component: "front_bumper_reinforcement", severity: "severe", operation: "R&R", part_type: "OEM", description: "Reinforcement bar behind bumper cover — guaranteed damaged from severe frontal impact." },
    },
    {
      condition: (damages) => hasSevere(damages, "front_bumper_cover") && hasSevere(damages, "hood"),
      add: { component: "radiator_support", severity: "severe", operation: "R&R", part_type: "OEM", description: "Radiator support crushed — severe front bumper + hood impact guarantees structural damage." },
    },
    {
      condition: (damages) => hasComponent(damages, "radiator_support"),
      add: { component: "ac_condenser", severity: "severe", operation: "R&R", part_type: "OEM", description: "A/C condenser damaged — mounted on radiator support which is impacted." },
    },
    {
      condition: (damages) => hasComponent(damages, "radiator_support"),
      add: { component: "radiator", severity: "severe", operation: "R&R", part_type: "OEM", description: "Radiator damaged — mounted on radiator support which is impacted." },
    },
  ],
  rear: [
    {
      condition: (damages) => hasSevere(damages, "rear_bumper_cover"),
      add: { component: "rear_bumper_reinforcement", severity: "severe", operation: "R&R", part_type: "OEM", description: "Reinforcement bar behind rear bumper cover — guaranteed damaged from severe rear impact." },
    },
    {
      condition: (damages) => hasSevere(damages, "trunk_lid") && hasSevere(damages, "rear_bumper_cover"),
      add: { component: "rear_body_panel", severity: "severe", operation: "R&R", part_type: "OEM", description: "Rear body panel deformed — severe trunk lid + rear bumper impact guarantees structural damage." },
    },
  ],
  structural: [
    {
      condition: (_, flags) => flags.hasFrameDamage && flags.impactRear,
      add: { component: "rear_frame_rail", severity: "severe", operation: "R&R", part_type: "OEM", description: "Frame rail damage confirmed — offset/deformation from rear impact." },
    },
    {
      condition: (_, flags) => flags.hasFrameDamage && flags.impactRear,
      add: { component: "trunk_floor_pan", severity: "moderate", operation: "R&R", part_type: "OEM", description: "Trunk floor likely buckled from rear structural impact." },
    },
    {
      condition: (_, flags) => flags.hasFrameDamage && flags.impactRear,
      add: { component: "rear_crossmember", severity: "severe", operation: "R&R", part_type: "OEM", description: "Rear crossmember likely damaged from frame offset." },
    },
    {
      condition: (_, flags) => flags.hasFrameDamage && flags.impactFront,
      add: { component: "front_frame_rail", severity: "severe", operation: "R&R", part_type: "OEM", description: "Frame rail damage from frontal impact." },
    },
    {
      condition: (_, flags) => flags.hasFrameDamage || flags.hasStructuralDamage,
      add: { component: "frame_setup", severity: "severe", operation: "Sublet", part_type: "OEM", description: "Frame jig setup, measuring, and pulling required for structural realignment." },
    },
  ],
};

// --- R&I Cascade: major panel R&R triggers R&I of adjacent components ---
export const RI_CASCADE = {
  quarter_panel: [
    ["wheelhouse_liner", "R&I", "minor", "R&I for quarter panel access"],
    ["body_side_molding", "R&I", "minor", "R&I for quarter panel access"],
    ["rear_spoiler", "R&I", "minor", "R&I for quarter panel/liftgate access"],
  ],
  rear_body_panel: [
    ["splash_shield", "R&I", "minor", "R&I for rear body panel access"],
  ],
  trunk_lid: [
    ["rear_spoiler", "R&I", "minor", "R&I for trunk lid replacement"],
  ],
  liftgate: [
    ["rear_spoiler", "R&I", "minor", "R&I for liftgate replacement"],
    ["liftgate_glass", "R&I", "minor", "Transfer glass to new liftgate"],
  ],
  front_fender: [
    ["fender_liner", "R&I", "minor", "R&I for fender access"],
  ],
  hood: [
    ["hood_insulator", "R&I", "minor", "Transfer insulator to new hood"],
  ],
};

// --- Inspection checklist templates by impact zone ---
export const INSPECTION_RULES = {
  front_severe: [
    "Inspect front frame rails for sway, crush, or buckling",
    "Check radiator and A/C condenser for leaks or damage",
    "Verify engine and transmission mount integrity",
    "Check cooling fan operation",
    "Inspect front suspension components for impact damage",
    "Verify airbag deployment status (front and side)",
  ],
  rear_severe: [
    "Inspect rear frame rails for deformation or buckling",
    "Check trunk floor pan for buckling or deformation",
    "Inspect spare tire well for damage",
    "Check exhaust system routing and hangers",
    "Inspect fuel system components and fuel tank",
    "Verify rear suspension alignment and components",
  ],
  general: [
    "Perform pre-repair diagnostic scan",
    "Perform post-repair diagnostic scan",
    "Check all glass panels for cracks not visible in photos",
    "Verify all door and panel gaps and alignment",
    "Check for fluid leaks under vehicle",
  ],
};

// --- Three-stage paint brands ---
export const THREE_STAGE_BRANDS = [
  "tesla", "lexus", "bmw", "mercedes-benz", "audi", "porsche",
  "cadillac", "lincoln", "genesis", "volvo", "land rover", "jaguar",
  "maserati", "bentley", "rolls-royce", "alfa romeo",
];


// ============================================================
// HELPER FUNCTIONS
// ============================================================

/** Check if a component with given severity exists in damages array */
function hasSevere(damages, componentSubstring) {
  return damages.some(d => {
    const c = (d.component || "").toLowerCase().replace(/_(lh|rh)$/i, "");
    return c.includes(componentSubstring) && d.severity === "severe";
  });
}

/** Check if component exists in damages (any severity) */
function hasComponent(damages, componentSubstring) {
  return damages.some(d => {
    const c = (d.component || "").toLowerCase().replace(/_(lh|rh)$/i, "");
    return c.includes(componentSubstring);
  });
}

/** Check if component key already exists (deduplication) */
function existsInSet(existingSet, component) {
  const raw = component.toLowerCase();
  const hasSide = /_(lh|rh)$/i.test(raw);
  const key = hasSide ? raw : raw.replace(/_(lh|rh)$/i, "");
  return existingSet.has(key);
}

/** Add component to damages array with deduplication.
 *  Sided components (ending _LH/_RH) are deduped WITH their side suffix,
 *  so fender_liner_LH and fender_liner_RH can coexist.
 *  Unsided components are deduped by base name. */
function addDamage(damages, existingSet, item) {
  const raw = (item.component || "").toLowerCase();
  const hasSide = /_(lh|rh)$/i.test(raw);
  const key = hasSide ? raw : raw.replace(/_(lh|rh)$/i, "");
  if (existingSet.has(key)) return;
  existingSet.add(key);
  damages.push(item);
}


// ============================================================
// PURE DERIVATION FUNCTIONS
// ============================================================

/**
 * Normalize a Gemini indicator to our closed vocabulary.
 * Returns canonical indicator or null if unrecognized.
 */
export function normalizeIndicator(raw) {
  if (!raw) return null;
  const lower = raw.toLowerCase().replace(/[\s\-]+/g, "_").replace(/[^a-z_]/g, "");
  if (INDICATOR_WEIGHTS[lower] !== undefined) return lower;
  if (FUZZY_INDICATOR_MAP[lower]) return FUZZY_INDICATOR_MAP[lower];
  return null;
}

/**
 * Derive severity from damage indicators.
 * max weight 3 → severe, 2 → moderate, 1 → minor, empty → moderate (fallback)
 */
export function deriveSeverity(indicators) {
  if (!indicators || indicators.length === 0) return "moderate";
  let maxWeight = 0;
  for (const ind of indicators) {
    const w = INDICATOR_WEIGHTS[ind] || 0;
    if (w > maxWeight) maxWeight = w;
  }
  if (maxWeight >= 3) return "severe";
  if (maxWeight >= 2) return "moderate";
  if (maxWeight >= 1) return "minor";
  return "moderate";
}

/**
 * Derive operation from component + severity.
 * ALWAYS_REPLACE → R&R; severe → R&R; else → Repair.
 * No Refinish/Blend here — paint ops added in pricing phase.
 */
export function deriveOperation(component, severity) {
  const comp = (component || "").toLowerCase().replace(/_(lh|rh)$/i, "");
  if (ALWAYS_REPLACE.some(p => comp.includes(p))) return "R&R";
  if (severity === "severe") return "R&R";
  return "Repair";
}

/**
 * Derive part type from component category.
 * structural/glass/electronics → OEM; everything else → AFT.
 */
export function derivePartType(component) {
  const comp = (component || "").toLowerCase().replace(/_(lh|rh)$/i, "");
  for (const cat of ["structural", "glass", "electronics"]) {
    if (COMPONENT_CATEGORIES[cat].some(p => comp.includes(p) || p.includes(comp))) return "OEM";
  }
  // Mechanical parts also OEM (no aftermarket for most)
  if (COMPONENT_CATEGORIES.mechanical.some(p => comp.includes(p) || p.includes(comp))) return "OEM";
  return "AFT";
}


// ============================================================
// MERGE RUNS — Consensus with weighted indicator union
// ============================================================

/**
 * Normalize component name for grouping: snake_case, alphabetically sorted words.
 */
function normalizeComponent(name) {
  const words = name.toLowerCase().replace(/_/g, " ").replace(/[^a-z0-9\s]/g, "").trim().split(/\s+/).sort();
  return words.join("_");
}

/** Extract side (L/R/null) from component key */
function getSide(key) {
  const words = key.split("_");
  if (words.includes("lh") || words.includes("left")) return "L";
  if (words.includes("rh") || words.includes("right")) return "R";
  return null;
}

/** Check if two normalized keys refer to the same component */
function isSimilar(a, b) {
  if (a === b) return true;
  const sideA = getSide(a), sideB = getSide(b);
  if (sideA && sideB && sideA !== sideB) return false;
  if ((sideA && !sideB) || (!sideA && sideB)) return false;
  if (a.includes(b) || b.includes(a)) return true;
  const aw = a.split("_"), bw = b.split("_");
  const shared = aw.filter(w => bw.includes(w)).length;
  return shared / Math.max(aw.length, bw.length) >= 0.7;
}

/**
 * Merge 3 Gemini runs into consensus damages.
 * - Component must appear in >= minVotes runs
 * - ALL indicators require 2+ runs to confirm (no single-run exceptions)
 * - High-cost components (quarter_panel, rocker_panel) require 3/3 runs
 * - Structural internals (frame_rail, crossmember, floor_pan) filtered from Gemini detection
 * Returns array of {component, damage_indicators[], description, _confidence, _runs}
 */
export function mergeRuns(runs, minVotes = 2) {
  if (!runs || runs.length === 0) return [];
  if (runs.length === 1) {
    // Single run: normalize indicators, pass through
    return (runs[0].damages || []).map(d => ({
      component: d.component,
      damage_indicators: (d.damage_indicators || []).map(normalizeIndicator).filter(Boolean),
      description: d.description || "",
      _confidence: "low",
      _runs: "1/1",
    }));
  }

  // Group damages by normalized component across runs
  const damageMap = {};
  runs.forEach((run, runIdx) => {
    (run.damages || []).forEach(d => {
      const norm = normalizeComponent(d.component || "");
      let canonKey = null;
      for (const existing of Object.keys(damageMap)) {
        if (isSimilar(norm, existing)) { canonKey = existing; break; }
      }
      if (!canonKey) canonKey = norm;
      if (!damageMap[canonKey]) damageMap[canonKey] = { component: d.component, entries: [] };
      damageMap[canonKey].entries.push({ ...d, runIdx });
    });
  });

  const totalRuns = runs.length;
  const merged = [];

  // Structural internals that Gemini should NOT detect from photos — only via guaranteed pairs or caption
  const GEMINI_BLACKLIST = ["frame_rail", "front_frame_rail", "rear_frame_rail", "crossmember",
    "rear_crossmember", "front_crossmember", "floor_pan", "trunk_floor_pan", "front_floor_pan",
    "rear_floor_pan", "spare_tire_well", "frame_setup", "strut_tower", "shock_tower", "firewall"];

  // High-cost components prone to hallucination — require ALL runs to agree
  const HIGH_THRESHOLD = ["quarter_panel", "rear_quarter_panel", "rocker_panel", "a_pillar",
    "b_pillar", "c_pillar"];

  for (const [key, info] of Object.entries(damageMap)) {
    const comp = (info.component || "").toLowerCase().replace(/_(lh|rh)$/i, "");
    const uniqueRuns = new Set(info.entries.map(e => e.runIdx)).size;

    // Block structural internals from Gemini detection — these come from guaranteed pairs only
    if (GEMINI_BLACKLIST.some(b => comp.includes(b))) {
      console.log(`[merge] ${key}: BLOCKED — structural internal, must come from guaranteed pairs`);
      continue;
    }

    // High-cost components require ALL runs to agree (3/3)
    const requiredVotes = HIGH_THRESHOLD.some(h => comp.includes(h)) ? totalRuns : minVotes;
    if (uniqueRuns < requiredVotes) {
      console.log(`[merge] ${key}: ${uniqueRuns}/${totalRuns} runs — FILTERED OUT (need ${requiredVotes})`);
      continue;
    }

    // Collect all indicators from all entries
    const indicatorCounts = {};
    for (const entry of info.entries) {
      const indicators = (entry.damage_indicators || []).map(normalizeIndicator).filter(Boolean);
      for (const ind of indicators) {
        if (!indicatorCounts[ind]) indicatorCounts[ind] = new Set();
        indicatorCounts[ind].add(entry.runIdx);
      }
    }

    // ALL indicators require 2+ runs to confirm — no single-run exceptions
    // Gemini can hallucinate "buckled" on undamaged panels; consensus prevents false positives
    const confirmedIndicators = [];
    for (const [ind, runSet] of Object.entries(indicatorCounts)) {
      if (runSet.size >= 2) {
        confirmedIndicators.push(ind);
      } else {
        console.log(`[merge] ${key}: indicator "${ind}" seen in ${runSet.size} runs — FILTERED (need 2+)`);
      }
    }

    // Filter wear-only components: if ALL confirmed indicators are wear/aging (discolored, faded, peeling, rubbed)
    // and there are no collision indicators, this is pre-existing wear — not an insurance claim item
    if (confirmedIndicators.length > 0 && confirmedIndicators.every(ind => WEAR_ONLY_INDICATORS.has(ind))) {
      console.log(`[merge] ${key}: FILTERED — wear-only indicators [${confirmedIndicators.join(", ")}], not collision damage`);
      continue;
    }

    // Use longest description
    const bestDesc = info.entries.sort((a, b) => (b.description || "").length - (a.description || "").length)[0];
    const confidence = uniqueRuns >= 3 ? "high" : uniqueRuns >= 2 ? "medium" : "low";

    merged.push({
      component: info.component,
      damage_indicators: confirmedIndicators,
      description: bestDesc.description || "",
      _confidence: confidence,
      _runs: `${uniqueRuns}/${totalRuns}`,
    });

    console.log(`[merge] ${key}: ${uniqueRuns}/${totalRuns} runs, indicators: [${confirmedIndicators.join(", ")}] → CONFIRMED`);
  }

  return merged;
}


// ============================================================
// GUARANTEED DAMAGES + R&I CASCADE
// ============================================================

/**
 * Add guaranteed structural components and R&I cascade items.
 * Returns { damages[], enrichmentFlags }
 */
export function guaranteedDamages(confirmedDamages, photos, vehicleInfo) {
  const damages = [...confirmedDamages];
  const existingSet = new Set(damages.map(d => {
    const raw = (d.component || "").toLowerCase();
    return /_(lh|rh)$/i.test(raw) ? raw : raw.replace(/_(lh|rh)$/i, "");
  }));

  // Detect impact zones from confirmed damages
  const impactFront = damages.some(d => {
    const c = (d.component || "").toLowerCase();
    return c.includes("front") || c.includes("hood") || c.includes("grille") || c.includes("headlamp") || c.includes("radiator");
  });
  const impactRear = damages.some(d => {
    const c = (d.component || "").toLowerCase();
    return c.includes("rear") || c.includes("trunk") || c.includes("tail") || c.includes("liftgate") || c.includes("quarter");
  });

  // Detect structural/frame damage from photo captions
  const allCaptions = (photos || []).map(p => (p.caption || "").toLowerCase()).join(" ");
  const hasFrameDamage = /frame\s*(damage|bend|buckl|offset|twist|push|crush|deform|crack)/i.test(allCaptions);
  const hasStructuralDamage = /structural|unibody|rail\s*(damage|bend|buckl)/i.test(allCaptions) || hasFrameDamage;

  const flags = { hasStructuralDamage, hasFrameDamage, impactFront, impactRear };

  // 1. Apply guaranteed pairs
  for (const zone of ["front", "rear", "structural"]) {
    const rules = GUARANTEED_PAIRS[zone] || [];
    for (const rule of rules) {
      if (rule.condition(damages, flags)) {
        addDamage(damages, existingSet, { ...rule.add });
      }
    }
  }

  // 2. R&I cascade: major panel R&R → R&I adjacent components
  for (const d of [...damages]) {
    const baseComp = (d.component || "").toLowerCase().replace(/_(lh|rh)$/i, "");
    const op = (d.operation || "").toUpperCase();
    if (op === "R&R" && RI_CASCADE[baseComp]) {
      const side = (d.component || "").match(/_(LH|RH)$/i)?.[0] || "";
      for (const [riComp, riOp, riSev, riDesc] of RI_CASCADE[baseComp]) {
        addDamage(damages, existingSet, {
          component: riComp + side,
          operation: riOp,
          severity: riSev,
          description: riDesc,
          part_type: "OEM",
        });
      }
    }
  }

  // 3. Severity-based escalation: quarter panel severe must be R&R
  for (const d of damages) {
    const c = (d.component || "").toLowerCase();
    if (c.includes("quarter_panel") && d.severity === "severe" && d.operation === "Repair") {
      d.operation = "R&R";
      d.description = (d.description || "") + " Severity upgraded to R&R — severe quarter panel damage requires full replacement.";
    }
  }

  // 4. Mechanical R&I for structural work
  if (hasStructuralDamage && impactRear) {
    addDamage(damages, existingSet, {
      component: "rear_suspension_ri", operation: "Sublet", severity: "moderate",
      description: "R&I rear suspension assembly for structural access and repair.", part_type: "OEM",
    });
  }
  if (hasStructuralDamage && impactFront) {
    addDamage(damages, existingSet, {
      component: "front_suspension_ri", operation: "Sublet", severity: "moderate",
      description: "R&I front suspension for structural access.", part_type: "OEM",
    });
  }

  // 5. Sublet items (always)
  if (damages.length > 0) {
    addDamage(damages, existingSet, {
      component: "diagnostic_scan", operation: "Sublet", severity: "minor",
      description: "Pre-repair and post-repair diagnostic system scans.", part_type: "OEM",
    });
  }
  if (impactFront && damages.some(d => d.severity === "severe")) {
    addDamage(damages, existingSet, {
      component: "wheel_alignment", operation: "Sublet", severity: "minor",
      description: "Four-wheel alignment required after front-end structural repair.", part_type: "OEM",
    });
  }

  // 6. Three-stage paint detection
  const isThreeStage = THREE_STAGE_BRANDS.includes((vehicleInfo?.make || "").toLowerCase());

  const enrichmentFlags = {
    hasStructuralDamage,
    hasFrameDamage,
    isThreeStage,
    impactFront,
    impactRear,
  };

  return { damages, enrichmentFlags };
}


// ============================================================
// INSPECTION CHECKLIST
// ============================================================

/**
 * Build inspection checklist from rules + Gemini potential damages.
 * Returns string array.
 */
export function buildInspectionChecklist(impactZones, geminiRuns) {
  const checklist = [...INSPECTION_RULES.general];

  // Add zone-specific items
  if (impactZones.impactFront) {
    const hasSevereFront = impactZones.frontSevere;
    if (hasSevereFront) checklist.push(...INSPECTION_RULES.front_severe);
  }
  if (impactZones.impactRear) {
    const hasSevereRear = impactZones.rearSevere;
    if (hasSevereRear) checklist.push(...INSPECTION_RULES.rear_severe);
  }

  // Collect unique potential_damages from all Gemini runs (union)
  const seenPotentials = new Set();
  for (const run of (geminiRuns || [])) {
    for (const pd of (run.potential_damages || [])) {
      const key = (pd.component || "").toLowerCase().replace(/[\s_\-]+/g, "");
      if (!seenPotentials.has(key)) {
        seenPotentials.add(key);
        checklist.push(`Inspect ${pd.component}: ${pd.reason}`);
      }
    }
  }

  // Deduplicate by fuzzy matching (same item phrased differently)
  const deduped = [];
  const seen = new Set();
  for (const item of checklist) {
    const key = item.toLowerCase().replace(/[^a-z0-9]/g, "").substring(0, 40);
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(item);
    }
  }

  return deduped;
}


// ============================================================
// CATALOG NORMALIZATION
// ============================================================

/**
 * Normalize component names to catalog entries (snake_case, fuzzy match).
 */
function catalogNormalize(damages) {
  const catalogSet = new Set(ALL_PARTS);
  for (const d of damages) {
    if (!d.component) continue;
    const raw = d.component.toLowerCase().replace(/[\s\-]+/g, "_").replace(/[^a-z0-9_]/g, "");
    const side = raw.match(/_(lh|rh|left|right)$/)?.[1];
    const base = raw.replace(/_(lh|rh|left|right)$/, "");
    const sideSuffix = side === "lh" || side === "left" ? "_LH" : side === "rh" || side === "right" ? "_RH" : "";
    if (catalogSet.has(base)) {
      d.component = base + sideSuffix;
    } else {
      let bestMatch = null, bestScore = 0;
      const baseWords = base.split("_").filter(w => w.length > 1);
      for (const cat of ALL_PARTS) {
        const catWords = cat.split("_");
        const shared = baseWords.filter(w => catWords.includes(w)).length;
        const score = shared / Math.max(baseWords.length, catWords.length);
        if (score > bestScore && score >= 0.5) { bestScore = score; bestMatch = cat; }
      }
      if (bestMatch) d.component = bestMatch + sideSuffix;
    }
  }
}


// ============================================================
// MAIN ORCHESTRATOR
// ============================================================

/**
 * Process Gemini detection runs into a stable, deterministic damages list.
 *
 * @param {Array} geminiRuns - Array of raw Gemini response objects (new schema with damage_indicators)
 * @param {Object} vehicleInfo - { make, model, year }
 * @param {Array} photos - Photos array with captions
 * @returns {{ damages: Array, adjuster_checklist: string[], potential_damages: Array, mergedAssessment: Object }}
 */
export function processDetection(geminiRuns, vehicleInfo, photos) {
  const validRuns = (geminiRuns || []).filter(Boolean);
  if (validRuns.length === 0) return { damages: [], adjuster_checklist: [], potential_damages: [] };

  // 1. Consensus merge — components + weighted indicator union
  const mergedComponents = mergeRuns(validRuns, validRuns.length === 1 ? 1 : 2);

  // 2. Post-merge component correction: fix Gemini misidentifications based on description
  for (const mc of mergedComponents) {
    const desc = (mc.description || "").toLowerCase();
    const comp = (mc.component || "").toLowerCase();
    const side = comp.match(/_(lh|rh)$/i)?.[0] || "";
    const baseSide = side || (desc.includes("left") ? "_LH" : desc.includes("right") ? "_RH" : "");

    // Tire/wheel misidentified as bumper, fender, or other body panel
    if (/\b(tire|tyre|flat|deflat|inflat|wheel\b.*(?:damage|bent|crack|miss))/i.test(desc) &&
        !comp.includes("wheel") && !comp.includes("tire")) {
      console.log(`[detection] Correcting ${mc.component} → wheel_tire${baseSide} (description mentions tire/flat)`);
      mc.component = `wheel_tire${baseSide}`;
      // Flat tire = missing/broken, not cosmetic — upgrade indicators
      if (!mc.damage_indicators.some(i => INDICATOR_WEIGHTS[i] >= 2)) {
        mc.damage_indicators = [...mc.damage_indicators.filter(i => INDICATOR_WEIGHTS[i] >= 2), "broken"];
      }
    }

    // Missing door glass misidentified as door_shell replacement
    if (/\b(glass.*miss|miss.*glass|window.*miss|miss.*window|glass.*absent|glass.*gone|tape.*opening|covering.*opening)\b/i.test(desc) &&
        (comp.includes("door_shell") || comp.includes("door_skin"))) {
      console.log(`[detection] Correcting ${mc.component} → side_window_glass${baseSide} (description mentions missing glass)`);
      mc.component = `side_window_glass${baseSide}`;
      if (!mc.damage_indicators.includes("broken")) {
        mc.damage_indicators = ["broken"];
      }
    }

    // Missing quarter glass — ensure correct component
    if (/\b(quarter.*glass.*miss|miss.*quarter.*glass|quarter.*window.*miss)\b/i.test(desc) &&
        !comp.includes("quarter_glass")) {
      console.log(`[detection] Correcting ${mc.component} → quarter_glass${baseSide} (description mentions missing quarter glass)`);
      mc.component = `quarter_glass${baseSide}`;
      if (!mc.damage_indicators.includes("broken")) {
        mc.damage_indicators = ["broken"];
      }
    }
  }

  // 3. Derive severity, operation, part_type for each component
  const damages = mergedComponents.map(mc => ({
    component: mc.component,
    operation: deriveOperation(mc.component, deriveSeverity(mc.damage_indicators)),
    description: mc.description,
    severity: deriveSeverity(mc.damage_indicators),
    part_type: derivePartType(mc.component),
    _confidence: mc._confidence,
    _runs: mc._runs,
    _indicators: mc.damage_indicators, // preserve for debugging
  }));

  // 4. Catalog normalize component names
  catalogNormalize(damages);

  // 5. Guaranteed damages + R&I cascade + sublets
  const { damages: enrichedDamages, enrichmentFlags } = guaranteedDamages(damages, photos, vehicleInfo);

  // 5. Attach enrichment flags to array (Pricing Phase 2 reads this)
  enrichedDamages._enrichmentFlags = enrichmentFlags;

  // 6. Determine impact zones for checklist
  const frontSevere = enrichedDamages.some(d => {
    const c = (d.component || "").toLowerCase();
    return (c.includes("front") || c.includes("hood") || c.includes("grille") || c.includes("headlamp")) && d.severity === "severe";
  });
  const rearSevere = enrichedDamages.some(d => {
    const c = (d.component || "").toLowerCase();
    return (c.includes("rear") || c.includes("trunk") || c.includes("tail") || c.includes("quarter")) && d.severity === "severe";
  });

  // 7. Build inspection checklist (rule-based + Gemini union)
  const adjuster_checklist = buildInspectionChecklist(
    { impactFront: enrichmentFlags.impactFront, impactRear: enrichmentFlags.impactRear, frontSevere, rearSevere },
    validRuns
  );

  // 8. Merge potential_damages from all runs (union, deduplicated)
  const potentialSet = new Set();
  const potential_damages = [];
  for (const run of validRuns) {
    for (const pd of (run.potential_damages || [])) {
      const key = (pd.component || "").toLowerCase().replace(/[\s_\-]+/g, "");
      if (!potentialSet.has(key)) {
        potentialSet.add(key);
        potential_damages.push({ component: pd.component, reason: pd.reason });
      }
    }
  }

  // 9. Merge top-level assessment fields (use first valid run as base)
  const base = validRuns[0];
  const mergedAssessment = {
    summary: base.summary || "",
    damage_type: base.damage_type || "auto",
    severity: deriveSeverity(enrichedDamages.flatMap(d => d._indicators || [])),
    confidence: Math.max(...validRuns.map(r => r.confidence || 0)),
    repair_vs_replace: base.repair_vs_replace || "needs_inspection",
    recommendations: [...new Set(validRuns.flatMap(r => r.recommendations || []))],
    flags: [...new Set(validRuns.flatMap(r => r.flags || []))],
  };

  // Override severity to total_loss if repair cost would be very high
  // (This is refined later in pricing phase, but we can flag it here)
  const severeCount = enrichedDamages.filter(d => d.severity === "severe").length;
  if (severeCount >= 8) mergedAssessment.severity = "total_loss";

  console.log(`[detection-engine] ${enrichedDamages.length} damages (${severeCount} severe), ` +
    `${potential_damages.length} potentials, ${adjuster_checklist.length} checklist items`);

  return {
    damages: enrichedDamages,
    adjuster_checklist,
    potential_damages,
    mergedAssessment,
  };
}

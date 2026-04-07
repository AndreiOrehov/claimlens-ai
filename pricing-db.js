// ============================================================
// ClaimLens AI — Pricing Reference Database
// Sources: autoGMS 2025, BEA Regional Price Parities 2023,
//          RepairPal, HomeAdvisor, Fixr, HomeWyse, BLS
// ============================================================

export const PRICING_VERSION = "1.0.0";
export const PRICING_LAST_UPDATED = "2025-06";

// --- US States with labor rates and regional multipliers ---
export const US_STATES = [
  { value: "AL", label: "Alabama",        autoLaborRate: 143, propertyMultiplier: 0.98 },
  { value: "AK", label: "Alaska",         autoLaborRate: 140, propertyMultiplier: 1.41 },
  { value: "AZ", label: "Arizona",        autoLaborRate: 145, propertyMultiplier: 1.02 },
  { value: "AR", label: "Arkansas",       autoLaborRate: 137, propertyMultiplier: 0.96 },
  { value: "CA", label: "California",     autoLaborRate: 150, propertyMultiplier: 1.39 },
  { value: "CO", label: "Colorado",       autoLaborRate: 146, propertyMultiplier: 1.06 },
  { value: "CT", label: "Connecticut",    autoLaborRate: 149, propertyMultiplier: 1.23 },
  { value: "DE", label: "Delaware",       autoLaborRate: 144, propertyMultiplier: 1.05 },
  { value: "DC", label: "Washington DC",  autoLaborRate: 151, propertyMultiplier: 1.30 },
  { value: "FL", label: "Florida",        autoLaborRate: 145, propertyMultiplier: 0.99 },
  { value: "GA", label: "Georgia",        autoLaborRate: 144, propertyMultiplier: 1.00 },
  { value: "HI", label: "Hawaii",         autoLaborRate: 148, propertyMultiplier: 1.42 },
  { value: "ID", label: "Idaho",          autoLaborRate: 138, propertyMultiplier: 1.01 },
  { value: "IL", label: "Illinois",       autoLaborRate: 147, propertyMultiplier: 1.05 },
  { value: "IN", label: "Indiana",        autoLaborRate: 141, propertyMultiplier: 0.99 },
  { value: "IA", label: "Iowa",           autoLaborRate: 139, propertyMultiplier: 1.06 },
  { value: "KS", label: "Kansas",         autoLaborRate: 140, propertyMultiplier: 1.00 },
  { value: "KY", label: "Kentucky",       autoLaborRate: 141, propertyMultiplier: 0.98 },
  { value: "LA", label: "Louisiana",      autoLaborRate: 144, propertyMultiplier: 0.98 },
  { value: "ME", label: "Maine",          autoLaborRate: 138, propertyMultiplier: 1.06 },
  { value: "MD", label: "Maryland",       autoLaborRate: 148, propertyMultiplier: 1.02 },
  { value: "MA", label: "Massachusetts",  autoLaborRate: 149, propertyMultiplier: 1.30 },
  { value: "MI", label: "Michigan",       autoLaborRate: 142, propertyMultiplier: 0.99 },
  { value: "MN", label: "Minnesota",      autoLaborRate: 144, propertyMultiplier: 1.10 },
  { value: "MS", label: "Mississippi",    autoLaborRate: 152, propertyMultiplier: 0.95 },
  { value: "MO", label: "Missouri",       autoLaborRate: 141, propertyMultiplier: 0.99 },
  { value: "MT", label: "Montana",        autoLaborRate: 137, propertyMultiplier: 1.00 },
  { value: "NE", label: "Nebraska",       autoLaborRate: 139, propertyMultiplier: 1.00 },
  { value: "NV", label: "Nevada",         autoLaborRate: 146, propertyMultiplier: 1.11 },
  { value: "NH", label: "New Hampshire",  autoLaborRate: 140, propertyMultiplier: 1.07 },
  { value: "NJ", label: "New Jersey",     autoLaborRate: 150, propertyMultiplier: 1.39 },
  { value: "NM", label: "New Mexico",     autoLaborRate: 139, propertyMultiplier: 0.99 },
  { value: "NY", label: "New York",       autoLaborRate: 151, propertyMultiplier: 1.30 },
  { value: "NC", label: "North Carolina", autoLaborRate: 143, propertyMultiplier: 1.04 },
  { value: "ND", label: "North Dakota",   autoLaborRate: 136, propertyMultiplier: 1.00 },
  { value: "OH", label: "Ohio",           autoLaborRate: 142, propertyMultiplier: 0.99 },
  { value: "OK", label: "Oklahoma",       autoLaborRate: 140, propertyMultiplier: 0.98 },
  { value: "OR", label: "Oregon",         autoLaborRate: 145, propertyMultiplier: 1.16 },
  { value: "PA", label: "Pennsylvania",   autoLaborRate: 146, propertyMultiplier: 1.14 },
  { value: "RI", label: "Rhode Island",   autoLaborRate: 147, propertyMultiplier: 1.20 },
  { value: "SC", label: "South Carolina", autoLaborRate: 142, propertyMultiplier: 1.07 },
  { value: "SD", label: "South Dakota",   autoLaborRate: 135, propertyMultiplier: 1.00 },
  { value: "TN", label: "Tennessee",      autoLaborRate: 143, propertyMultiplier: 0.98 },
  { value: "TX", label: "Texas",          autoLaborRate: 146, propertyMultiplier: 1.00 },
  { value: "UT", label: "Utah",           autoLaborRate: 141, propertyMultiplier: 1.01 },
  { value: "VT", label: "Vermont",        autoLaborRate: 127, propertyMultiplier: 1.08 },
  { value: "VA", label: "Virginia",       autoLaborRate: 145, propertyMultiplier: 1.07 },
  { value: "WA", label: "Washington",     autoLaborRate: 148, propertyMultiplier: 1.19 },
  { value: "WV", label: "West Virginia",  autoLaborRate: 136, propertyMultiplier: 0.97 },
  { value: "WI", label: "Wisconsin",      autoLaborRate: 140, propertyMultiplier: 1.08 },
  { value: "WY", label: "Wyoming",        autoLaborRate: 137, propertyMultiplier: 1.00 },
];

// --- Vehicle classification ---
const VEHICLE_CLASS_MAP = {
  economy: ["Kia", "Hyundai", "Nissan", "Mitsubishi"],
  midsize: ["Honda", "Toyota", "Mazda", "Subaru", "Volkswagen", "Chevrolet", "Ford", "Dodge", "Chrysler", "Buick", "GMC", "Ram", "Jeep"],
  luxury: ["BMW", "Mercedes-Benz", "Audi", "Lexus", "Acura", "Infiniti", "Cadillac", "Lincoln", "Genesis", "Volvo", "Porsche", "Tesla"],
};

const VEHICLE_CLASS_OVERRIDES = {
  Ford:      { "F-150": "truck_suv", "F-250": "truck_suv", "F-350": "truck_suv", Expedition: "truck_suv", Bronco: "truck_suv", Explorer: "truck_suv", Escape: "truck_suv" },
  Chevrolet: { "Silverado 1500": "truck_suv", "Silverado 2500HD": "truck_suv", Tahoe: "truck_suv", Suburban: "truck_suv", Colorado: "truck_suv", Traverse: "truck_suv", Equinox: "truck_suv" },
  Toyota:    { Tacoma: "truck_suv", Tundra: "truck_suv", "4Runner": "truck_suv", Sequoia: "truck_suv", "Land Cruiser": "truck_suv", Highlander: "truck_suv", "RAV4": "truck_suv" },
  Dodge:     { Durango: "truck_suv" },
  Ram:       { "1500": "truck_suv", "2500": "truck_suv", "3500": "truck_suv" },
  GMC:       { "Sierra 1500": "truck_suv", "Sierra 2500HD": "truck_suv", Yukon: "truck_suv", Canyon: "truck_suv", Terrain: "truck_suv", Acadia: "truck_suv" },
  Jeep:      { Wrangler: "truck_suv", Gladiator: "truck_suv", "Grand Cherokee": "truck_suv", Cherokee: "truck_suv", Wagoneer: "truck_suv", "Grand Wagoneer": "truck_suv" },
  Honda:     { Pilot: "truck_suv", Passport: "truck_suv", "CR-V": "truck_suv", Ridgeline: "truck_suv" },
  Nissan:    { Pathfinder: "truck_suv", Frontier: "truck_suv", Titan: "truck_suv", Armada: "truck_suv", Rogue: "truck_suv" },
  Hyundai:   { Tucson: "truck_suv", "Santa Fe": "truck_suv", Palisade: "truck_suv" },
  Kia:       { Telluride: "truck_suv", Sportage: "truck_suv", Sorento: "truck_suv" },
  Subaru:    { Outback: "truck_suv", Forester: "truck_suv", Ascent: "truck_suv" },
};

export function getVehicleClass(make, model) {
  if (VEHICLE_CLASS_OVERRIDES[make]?.[model]) return VEHICLE_CLASS_OVERRIDES[make][model];
  for (const [cls, makes] of Object.entries(VEHICLE_CLASS_MAP)) {
    if (makes.includes(make)) return cls;
  }
  return "midsize";
}

// --- Auto parts pricing (national averages, USD) ---
// repair/replace = [low, high] parts+labor; labor_hours = [low, high]
export const AUTO_PARTS_PRICING = {
  bumper_front: {
    economy:  { repair: [300, 600],   replace: [500, 1000],  labor_hours: [2, 5] },
    midsize:  { repair: [400, 800],   replace: [600, 1400],  labor_hours: [3, 6] },
    luxury:   { repair: [600, 1200],  replace: [1200, 3000], labor_hours: [3, 8] },
    truck_suv:{ repair: [400, 900],   replace: [700, 1800],  labor_hours: [3, 6] },
  },
  bumper_rear: {
    economy:  { repair: [300, 600],   replace: [500, 1100],  labor_hours: [2, 5] },
    midsize:  { repair: [400, 800],   replace: [600, 1500],  labor_hours: [3, 6] },
    luxury:   { repair: [600, 1200],  replace: [1200, 3200], labor_hours: [3, 8] },
    truck_suv:{ repair: [400, 900],   replace: [700, 1900],  labor_hours: [3, 6] },
  },
  fender: {
    economy:  { repair: [200, 500],   replace: [400, 900],   labor_hours: [2, 4] },
    midsize:  { repair: [300, 700],   replace: [500, 1200],  labor_hours: [3, 5] },
    luxury:   { repair: [500, 1000],  replace: [1000, 2500], labor_hours: [3, 7] },
    truck_suv:{ repair: [350, 750],   replace: [600, 1500],  labor_hours: [3, 5] },
  },
  hood: {
    economy:  { repair: [200, 500],   replace: [400, 1000],  labor_hours: [2, 4] },
    midsize:  { repair: [300, 700],   replace: [500, 1400],  labor_hours: [2, 5] },
    luxury:   { repair: [500, 1200],  replace: [1200, 3500], labor_hours: [3, 6] },
    truck_suv:{ repair: [350, 800],   replace: [600, 1800],  labor_hours: [2, 5] },
  },
  door: {
    economy:  { repair: [250, 600],   replace: [500, 1200],  labor_hours: [3, 6] },
    midsize:  { repair: [350, 800],   replace: [800, 2000],  labor_hours: [4, 7] },
    luxury:   { repair: [600, 1500],  replace: [1500, 4000], labor_hours: [4, 10] },
    truck_suv:{ repair: [400, 900],   replace: [900, 2500],  labor_hours: [4, 8] },
  },
  windshield: {
    economy:  { repair: [50, 150],    replace: [200, 450],   labor_hours: [1, 2] },
    midsize:  { repair: [50, 150],    replace: [250, 600],   labor_hours: [1, 2] },
    luxury:   { repair: [75, 200],    replace: [500, 1500],  labor_hours: [1, 3] },
    truck_suv:{ repair: [50, 150],    replace: [300, 700],   labor_hours: [1, 2] },
  },
  headlight: {
    economy:  { repair: [null, null], replace: [150, 500],   labor_hours: [0.5, 2] },
    midsize:  { repair: [null, null], replace: [200, 800],   labor_hours: [0.5, 2] },
    luxury:   { repair: [null, null], replace: [600, 2500],  labor_hours: [1, 3] },
    truck_suv:{ repair: [null, null], replace: [250, 900],   labor_hours: [0.5, 2] },
  },
  taillight: {
    economy:  { repair: [null, null], replace: [60, 300],    labor_hours: [0.5, 1.5] },
    midsize:  { repair: [null, null], replace: [100, 500],   labor_hours: [0.5, 2] },
    luxury:   { repair: [null, null], replace: [300, 1200],  labor_hours: [0.5, 2] },
    truck_suv:{ repair: [null, null], replace: [100, 600],   labor_hours: [0.5, 2] },
  },
  mirror: {
    economy:  { repair: [50, 150],    replace: [100, 300],   labor_hours: [1, 2] },
    midsize:  { repair: [75, 200],    replace: [150, 500],   labor_hours: [1, 2] },
    luxury:   { repair: [100, 300],   replace: [400, 1200],  labor_hours: [1, 3] },
    truck_suv:{ repair: [75, 200],    replace: [150, 600],   labor_hours: [1, 2] },
  },
  trunk: {
    economy:  { repair: [200, 500],   replace: [400, 900],   labor_hours: [2, 4] },
    midsize:  { repair: [300, 700],   replace: [500, 1300],  labor_hours: [2, 5] },
    luxury:   { repair: [500, 1000],  replace: [1000, 2800], labor_hours: [3, 6] },
    truck_suv:{ repair: [300, 700],   replace: [500, 1500],  labor_hours: [2, 5] },
  },
  quarter_panel: {
    economy:  { repair: [400, 900],   replace: [800, 2000],  labor_hours: [6, 12] },
    midsize:  { repair: [500, 1200],  replace: [1000, 3000], labor_hours: [8, 14] },
    luxury:   { repair: [800, 2000],  replace: [2000, 5500], labor_hours: [10, 18] },
    truck_suv:{ repair: [600, 1400],  replace: [1200, 3500], labor_hours: [8, 15] },
  },
  roof: {
    economy:  { repair: [300, 800],   replace: [800, 2000],  labor_hours: [4, 8] },
    midsize:  { repair: [400, 1000],  replace: [1000, 3000], labor_hours: [6, 10] },
    luxury:   { repair: [600, 1500],  replace: [2000, 6000], labor_hours: [6, 14] },
    truck_suv:{ repair: [500, 1200],  replace: [1200, 3500], labor_hours: [6, 12] },
  },
  frame: {
    economy:  { repair: [600, 2000],  replace: [2000, 5000],  labor_hours: [5, 15] },
    midsize:  { repair: [800, 3000],  replace: [3000, 7000],  labor_hours: [8, 20] },
    luxury:   { repair: [1500, 5000], replace: [5000, 12000], labor_hours: [10, 25] },
    truck_suv:{ repair: [1000, 4000], replace: [3000, 10000], labor_hours: [8, 20] },
  },
  suspension: {
    economy:  { repair: [200, 600],   replace: [400, 1200],  labor_hours: [2, 5] },
    midsize:  { repair: [300, 800],   replace: [500, 1800],  labor_hours: [2, 6] },
    luxury:   { repair: [500, 1500],  replace: [1000, 3500], labor_hours: [3, 8] },
    truck_suv:{ repair: [400, 1000],  replace: [600, 2200],  labor_hours: [3, 7] },
  },
  airbag: {
    economy:  { repair: [null, null], replace: [300, 800],   labor_hours: [1, 3] },
    midsize:  { repair: [null, null], replace: [400, 1200],  labor_hours: [1, 3] },
    luxury:   { repair: [null, null], replace: [800, 2500],  labor_hours: [2, 4] },
    truck_suv:{ repair: [null, null], replace: [400, 1500],  labor_hours: [1, 3] },
  },
  grille: {
    economy:  { repair: [50, 150],    replace: [100, 350],   labor_hours: [0.5, 1.5] },
    midsize:  { repair: [75, 200],    replace: [150, 500],   labor_hours: [0.5, 1.5] },
    luxury:   { repair: [150, 400],   replace: [400, 1500],  labor_hours: [0.5, 2] },
    truck_suv:{ repair: [75, 200],    replace: [150, 600],   labor_hours: [0.5, 1.5] },
  },
  paint_panel: {
    economy:  { repair: [300, 600],   replace: [null, null],  labor_hours: [3, 6] },
    midsize:  { repair: [400, 800],   replace: [null, null],  labor_hours: [4, 8] },
    luxury:   { repair: [600, 1500],  replace: [null, null],  labor_hours: [5, 10] },
    truck_suv:{ repair: [400, 900],   replace: [null, null],  labor_hours: [4, 8] },
  },
};

const AUTO_COMPONENT_ALIASES = {
  "front bumper": "bumper_front", "bumper front": "bumper_front", "front bumper cover": "bumper_front",
  "rear bumper": "bumper_rear", "bumper rear": "bumper_rear", "rear bumper cover": "bumper_rear",
  bumper: "bumper_front",
  fender: "fender", "front fender": "fender", "rear fender": "quarter_panel", "wing": "fender",
  hood: "hood", bonnet: "hood", "engine hood": "hood",
  door: "door", "door panel": "door", "door shell": "door", "driver door": "door", "passenger door": "door",
  "front door": "door", "rear door": "door", "side door": "door",
  windshield: "windshield", "front windshield": "windshield", "windscreen": "windshield", "front glass": "windshield",
  "rear window": "windshield", "rear glass": "windshield", "back glass": "windshield",
  headlight: "headlight", "head light": "headlight", "headlamp": "headlight", "head lamp": "headlight",
  "front light": "headlight",
  taillight: "taillight", "tail light": "taillight", "taillamp": "taillight", "rear light": "taillight",
  "brake light": "taillight",
  mirror: "mirror", "side mirror": "mirror", "wing mirror": "mirror", "rearview mirror": "mirror",
  "door mirror": "mirror",
  trunk: "trunk", "trunk lid": "trunk", "tailgate": "trunk", "liftgate": "trunk", "hatch": "trunk",
  "quarter panel": "quarter_panel", "rear quarter": "quarter_panel", "rear quarter panel": "quarter_panel",
  "front quarter panel": "fender",
  roof: "roof", "roof panel": "roof", "roof skin": "roof",
  frame: "frame", "structural": "frame", "frame rail": "frame", "unibody": "frame", "subframe": "frame",
  "chassis": "frame",
  suspension: "suspension", "strut": "suspension", "shock": "suspension", "shock absorber": "suspension",
  "control arm": "suspension", "spring": "suspension",
  airbag: "airbag", "air bag": "airbag", "srs": "airbag",
  grille: "grille", "grill": "grille", "front grille": "grille", "radiator grille": "grille",
  paint: "paint_panel", "paint job": "paint_panel", "repaint": "paint_panel", "paint work": "paint_panel",
  "scratch": "paint_panel", "clear coat": "paint_panel",
};

// --- Property repair pricing (national averages, USD per unit) ---
export const PROPERTY_PRICING = {
  // Roofing
  roof_shingle:     { unit: "sq ft", materials: [1.00, 3.50], labor: [2.00, 4.50], notes: "Asphalt shingle (3-tab to architectural)" },
  roof_tile:        { unit: "sq ft", materials: [7.00, 12.00], labor: [7.00, 14.00], notes: "Clay or concrete tile" },
  roof_metal:       { unit: "sq ft", materials: [5.00, 12.00], labor: [3.00, 12.00], notes: "Standing seam metal" },
  roof_flat:        { unit: "sq ft", materials: [2.50, 4.50], labor: [2.50, 5.00], notes: "TPO/EPDM/built-up flat roof" },
  // Siding
  siding_vinyl:     { unit: "sq ft", materials: [0.75, 2.00], labor: [2.00, 4.00], notes: "Vinyl siding" },
  siding_wood:      { unit: "sq ft", materials: [2.00, 4.00], labor: [2.70, 3.50], notes: "Wood clapboard/shingle" },
  siding_fiber:     { unit: "sq ft", materials: [2.00, 5.00], labor: [5.00, 13.00], notes: "Fiber cement (HardiePlank)" },
  siding_stucco:    { unit: "sq ft", materials: [2.00, 4.00], labor: [5.00, 6.00], notes: "Stucco finish" },
  // Drywall
  drywall_install:  { unit: "sq ft", materials: [0.50, 0.80], labor: [1.00, 2.70], notes: "New drywall hang + finish" },
  drywall_repair:   { unit: "each",  materials: [50, 200], labor: [200, 700], notes: "Patch repair per area ($295-$926 typical project)" },
  // Flooring
  floor_hardwood:   { unit: "sq ft", materials: [6.00, 12.00], labor: [3.00, 8.00], notes: "Solid hardwood install" },
  floor_laminate:   { unit: "sq ft", materials: [1.00, 4.00], labor: [4.00, 8.00], notes: "Laminate flooring" },
  floor_tile:       { unit: "sq ft", materials: [2.00, 6.00], labor: [5.00, 6.00], notes: "Ceramic/porcelain tile" },
  floor_carpet:     { unit: "sq ft", materials: [1.00, 3.00], labor: [2.00, 4.00], notes: "Carpet + pad" },
  floor_vinyl:      { unit: "sq ft", materials: [2.00, 5.00], labor: [1.50, 4.00], notes: "Luxury vinyl plank" },
  // Windows
  window_standard:  { unit: "each", materials: [150, 600], labor: [150, 300], notes: "Standard double-hung vinyl" },
  window_wood:      { unit: "each", materials: [400, 1200], labor: [200, 500], notes: "Wood-frame window" },
  window_large:     { unit: "each", materials: [200, 1500], labor: [300, 800], notes: "Large/picture window" },
  // Doors
  door_interior:    { unit: "each", materials: [50, 400], labor: [150, 350], notes: "Interior door + frame" },
  door_exterior:    { unit: "each", materials: [400, 1500], labor: [200, 600], notes: "Entry/exterior door" },
  door_sliding:     { unit: "each", materials: [350, 4000], labor: [300, 800], notes: "Sliding glass door" },
  // Plumbing
  plumb_pipe:       { unit: "each", materials: [50, 300], labor: [100, 4700], notes: "Pipe repair (accessible to in-wall)" },
  plumb_fixture:    { unit: "each", materials: [100, 400], labor: [200, 400], notes: "Faucet/toilet fixture" },
  plumb_waterheater:{ unit: "each", materials: [400, 2000], labor: [250, 1000], notes: "Water heater (tank to tankless)" },
  plumb_repipe:     { unit: "linear ft", materials: [3, 7], labor: [3, 7], notes: "Whole-house repipe" },
  // Electrical
  elec_outlet:      { unit: "each", materials: [5, 40], labor: [125, 200], notes: "Outlet install/replace" },
  elec_panel:       { unit: "each", materials: [300, 1000], labor: [600, 1500], notes: "Electrical panel (100-200 amp)" },
  elec_rewire:      { unit: "sq ft", materials: [2, 4], labor: [4, 6], notes: "House rewiring" },
  // HVAC
  hvac_repair:      { unit: "each", materials: [50, 300], labor: [150, 400], notes: "HVAC system repair" },
  hvac_ac:          { unit: "each", materials: [2400, 4900], labor: [1500, 3000], notes: "Central AC replacement" },
  hvac_furnace:     { unit: "each", materials: [2000, 5000], labor: [1800, 5000], notes: "Gas furnace replacement" },
  hvac_ductwork:    { unit: "linear ft", materials: [1, 8], labor: [7, 12], notes: "Ductwork repair/replace" },
  // Foundation
  found_crack:      { unit: "each", materials: [50, 200], labor: [200, 600], notes: "Foundation crack epoxy repair" },
  found_major:      { unit: "each", materials: [2000, 10000], labor: [3000, 20000], notes: "Major structural/piering" },
  // Painting
  paint_interior:   { unit: "sq ft", materials: [0.50, 1.00], labor: [1.50, 5.00], notes: "Interior wall painting" },
  paint_exterior:   { unit: "sq ft", materials: [0.30, 0.80], labor: [1.20, 3.20], notes: "Exterior painting" },
  // Other
  fence_wood:       { unit: "linear ft", materials: [5, 25], labor: [5, 25], notes: "Wood fence" },
  fence_chain:      { unit: "linear ft", materials: [3, 15], labor: [5, 15], notes: "Chain link fence" },
  gutter:           { unit: "linear ft", materials: [3, 10], labor: [4, 12], notes: "Aluminum gutter" },
  mold_remediation: { unit: "sq ft", materials: [2, 10], labor: [8, 20], notes: "Mold removal + treatment" },
  water_dryout:     { unit: "sq ft", materials: [1, 5], labor: [2, 25], notes: "Water damage dryout (cat 1-3)" },
  smoke_damage:     { unit: "each", materials: [500, 5000], labor: [1500, 13000], notes: "Smoke/fire damage remediation per project" },
  garage_door:      { unit: "each", materials: [500, 3000], labor: [300, 1500], notes: "Garage door replacement" },
  ceiling_repair:   { unit: "sq ft", materials: [1, 3], labor: [3, 9], notes: "Ceiling drywall repair + finish" },
  insulation:       { unit: "sq ft", materials: [0.50, 2.50], labor: [1.50, 3.00], notes: "Blown-in or batt insulation" },
};

const PROPERTY_COMPONENT_ALIASES = {
  // Roofing
  roof: "roof_shingle", "roof shingle": "roof_shingle", "shingle roof": "roof_shingle", "asphalt roof": "roof_shingle",
  "architectural shingle": "roof_shingle", "3-tab shingle": "roof_shingle",
  "tile roof": "roof_tile", "clay tile": "roof_tile", "concrete tile": "roof_tile",
  "metal roof": "roof_metal", "standing seam": "roof_metal",
  "flat roof": "roof_flat", "tpo": "roof_flat", "epdm": "roof_flat",
  // Siding
  siding: "siding_vinyl", "vinyl siding": "siding_vinyl",
  "wood siding": "siding_wood", "cedar siding": "siding_wood", "clapboard": "siding_wood",
  "fiber cement": "siding_fiber", "hardie": "siding_fiber", "hardieplank": "siding_fiber",
  stucco: "siding_stucco",
  // Drywall
  drywall: "drywall_install", "sheetrock": "drywall_install", "wall repair": "drywall_repair",
  "drywall patch": "drywall_repair", "drywall hole": "drywall_repair",
  // Flooring
  floor: "floor_hardwood", flooring: "floor_hardwood",
  "hardwood floor": "floor_hardwood", "hardwood": "floor_hardwood", "wood floor": "floor_hardwood",
  "laminate floor": "floor_laminate", laminate: "floor_laminate",
  "tile floor": "floor_tile", "ceramic tile": "floor_tile", "porcelain tile": "floor_tile",
  carpet: "floor_carpet", "carpet floor": "floor_carpet",
  "vinyl floor": "floor_vinyl", "lvp": "floor_vinyl", "vinyl plank": "floor_vinyl",
  // Windows
  window: "window_standard", windows: "window_standard",
  "picture window": "window_large", "bay window": "window_large",
  // Doors
  door: "door_interior", "interior door": "door_interior",
  "exterior door": "door_exterior", "entry door": "door_exterior", "front door": "door_exterior",
  "sliding door": "door_sliding", "patio door": "door_sliding", "sliding glass": "door_sliding",
  // Plumbing
  pipe: "plumb_pipe", "pipe repair": "plumb_pipe", "pipe burst": "plumb_pipe", "plumbing repair": "plumb_pipe",
  "broken pipe": "plumb_pipe", "leaking pipe": "plumb_pipe",
  fixture: "plumb_fixture", faucet: "plumb_fixture", toilet: "plumb_fixture",
  "water heater": "plumb_waterheater", "hot water heater": "plumb_waterheater",
  // Electrical
  outlet: "elec_outlet", "electrical outlet": "elec_outlet",
  "electrical panel": "elec_panel", "breaker panel": "elec_panel", "breaker box": "elec_panel",
  rewire: "elec_rewire", "electrical rewire": "elec_rewire", wiring: "elec_rewire",
  // HVAC
  hvac: "hvac_repair", "hvac repair": "hvac_repair", "heating repair": "hvac_repair",
  "ac unit": "hvac_ac", "air conditioner": "hvac_ac", "ac replacement": "hvac_ac", "central air": "hvac_ac",
  furnace: "hvac_furnace", "gas furnace": "hvac_furnace", heater: "hvac_furnace",
  ductwork: "hvac_ductwork", ducts: "hvac_ductwork", "air duct": "hvac_ductwork",
  // Foundation
  foundation: "found_crack", "foundation crack": "found_crack", "foundation repair": "found_crack",
  "structural repair": "found_major", "foundation failure": "found_major",
  // Painting
  painting: "paint_interior", "interior paint": "paint_interior", "wall painting": "paint_interior",
  "exterior paint": "paint_exterior", "exterior painting": "paint_exterior",
  // Other
  fence: "fence_wood", "wood fence": "fence_wood", "chain link": "fence_chain",
  gutter: "gutter", gutters: "gutter", downspout: "gutter",
  mold: "mold_remediation", "mold removal": "mold_remediation", "mildew": "mold_remediation",
  "water damage": "water_dryout", "water extraction": "water_dryout", "flood damage": "water_dryout",
  "smoke damage": "smoke_damage", "fire damage": "smoke_damage", "soot": "smoke_damage",
  "garage door": "garage_door",
  ceiling: "ceiling_repair", "ceiling damage": "ceiling_repair",
  insulation: "insulation",
};

// --- Utility: resolve component names ---
function resolveAutoComponent(name) {
  const lower = name.toLowerCase().trim();
  if (AUTO_COMPONENT_ALIASES[lower]) return AUTO_COMPONENT_ALIASES[lower];
  for (const [alias, key] of Object.entries(AUTO_COMPONENT_ALIASES)) {
    if (lower.includes(alias) || alias.includes(lower)) return key;
  }
  return null;
}

function resolvePropertyComponent(name) {
  const lower = name.toLowerCase().trim();
  if (PROPERTY_COMPONENT_ALIASES[lower]) return PROPERTY_COMPONENT_ALIASES[lower];
  for (const [alias, key] of Object.entries(PROPERTY_COMPONENT_ALIASES)) {
    if (lower.includes(alias) || alias.includes(lower)) return key;
  }
  return null;
}

// --- Utility: get state data ---
export function getStateData(stateCode) {
  const st = US_STATES.find((s) => s.value === stateCode);
  if (!st) return { autoLaborRate: 143, propertyMultiplier: 1.0, label: "Unknown" };
  return st;
}

// --- Build pricing context for Claude prompt ---
export function buildPricingContext(type, options) {
  const { stateCode } = options;
  const state = getStateData(stateCode);

  if (type === "auto") {
    const { make, model } = options;
    const cls = getVehicleClass(make, model);
    const clsLabel = { economy: "Economy", midsize: "Mid-size", luxury: "Luxury", truck_suv: "Truck/SUV" }[cls];

    let lines = [
      `\n--- PRICING REFERENCE DATA (${state.label}, ${clsLabel} class) ---`,
      `State avg body shop labor rate: $${state.autoLaborRate}/hr`,
      `Vehicle class: ${clsLabel}`,
      ``,
      `Component costs (parts+labor, USD):`,
      `Component | Repair Range | Replace Range | Labor Hours`,
    ];

    for (const [key, data] of Object.entries(AUTO_PARTS_PRICING)) {
      const d = data[cls];
      const name = key.replace(/_/g, " ");
      const rep = d.repair[0] !== null ? `$${d.repair[0]}-$${d.repair[1]}` : "N/A";
      const repl = d.replace[0] !== null ? `$${d.replace[0]}-$${d.replace[1]}` : "N/A";
      lines.push(`${name} | ${rep} | ${repl} | ${d.labor_hours[0]}-${d.labor_hours[1]}h`);
    }
    lines.push(`\nUse these as baseline. Adjust within reason for specific damage severity and circumstances.`);
    return lines.join("\n");
  }

  if (type === "property") {
    const { area, cause } = options;
    const mult = state.propertyMultiplier;
    const relevant = getRelevantPropertyItems(area, cause);

    let lines = [
      `\n--- PRICING REFERENCE DATA (${state.label}, multiplier: ${mult}x) ---`,
      `All costs below are national averages. Multiply by ${mult} for ${state.label} pricing.`,
      ``,
      `Relevant repair costs:`,
      `Work Type | Unit | Materials | Labor | Total/Unit | Notes`,
    ];

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
    lines.push(`\nUse these as baseline. Adjust for specific damage extent and property characteristics.`);
    return lines.join("\n");
  }

  return "";
}

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

function setCachedPricing(cacheKey, data) {
  try {
    localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
  } catch {
    // localStorage full — silently ignore
  }
}

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

// --- Map areas/causes to relevant pricing items ---
const AREA_PRICING_MAP = {
  roof:        ["roof_shingle", "roof_tile", "roof_metal", "roof_flat", "gutter", "insulation"],
  exterior:    ["siding_vinyl", "siding_wood", "siding_fiber", "siding_stucco", "paint_exterior", "gutter"],
  interior:    ["drywall_install", "drywall_repair", "paint_interior", "floor_hardwood", "floor_carpet", "ceiling_repair"],
  foundation:  ["found_crack", "found_major", "drywall_repair"],
  garage:      ["garage_door", "drywall_repair", "paint_interior", "elec_outlet"],
  windows:     ["window_standard", "window_wood", "window_large"],
  electrical:  ["elec_outlet", "elec_panel", "elec_rewire"],
  plumbing:    ["plumb_pipe", "plumb_fixture", "plumb_waterheater", "plumb_repipe"],
  hvac:        ["hvac_repair", "hvac_ac", "hvac_furnace", "hvac_ductwork"],
  fence:       ["fence_wood", "fence_chain"],
  multiple:    ["drywall_repair", "paint_interior", "paint_exterior", "floor_hardwood", "window_standard", "roof_shingle", "ceiling_repair"],
};

const CAUSE_EXTRA_MAP = {
  water_flood:    ["water_dryout", "mold_remediation", "drywall_repair", "floor_hardwood", "insulation"],
  fire_smoke:     ["smoke_damage", "drywall_repair", "paint_interior", "elec_rewire", "insulation"],
  storm_wind:     ["roof_shingle", "siding_vinyl", "window_standard", "fence_wood", "gutter"],
  hurricane:      ["roof_shingle", "siding_vinyl", "window_standard", "fence_wood", "gutter", "water_dryout"],
  vandalism:      ["window_standard", "door_exterior", "paint_exterior", "drywall_repair"],
  tree_fall:      ["roof_shingle", "siding_vinyl", "fence_wood", "gutter", "window_standard"],
  structural:     ["found_crack", "found_major", "drywall_repair"],
  mold:           ["mold_remediation", "drywall_repair", "insulation", "paint_interior"],
  plumbing_burst: ["plumb_pipe", "water_dryout", "drywall_repair", "floor_hardwood", "ceiling_repair", "mold_remediation"],
};

function getRelevantPropertyItems(area, cause) {
  const items = new Set(AREA_PRICING_MAP[area] || AREA_PRICING_MAP.multiple);
  const extras = CAUSE_EXTRA_MAP[cause] || [];
  for (const e of extras) items.add(e);
  return [...items];
}

// --- Validate estimates against reference data ---
export function validateEstimates(assessment, type, options) {
  if (!assessment?.damages?.length) return { items: [], confidenceModifier: "unknown", totalChecked: 0, warnings: 0 };

  const { stateCode } = options;
  const state = getStateData(stateCode);
  const results = [];
  let warnings = 0;

  for (const dmg of assessment.damages) {
    const costLow = dmg.estimated_cost_low ?? 0;
    const costHigh = dmg.estimated_cost_high ?? 0;
    const midEstimate = (costLow + costHigh) / 2;

    if (type === "auto") {
      const { make, model } = options;
      const cls = getVehicleClass(make, model);
      const key = resolveAutoComponent(dmg.component);

      if (!key || !AUTO_PARTS_PRICING[key]) {
        results.push({ component: dmg.component, status: "unknown", message: "No reference data", reference: null });
        continue;
      }

      const pricing = AUTO_PARTS_PRICING[key][cls];
      const laborRate = state.autoLaborRate;
      // Calculate expected total: wider of repair/replace + labor
      const repairTotal = pricing.repair[0] !== null
        ? [pricing.repair[0], pricing.repair[1]]
        : [0, 0];
      const replaceTotal = pricing.replace[0] !== null
        ? [pricing.replace[0], pricing.replace[1]]
        : [0, 0];

      const refLow = Math.min(
        repairTotal[0] || Infinity,
        replaceTotal[0] || Infinity
      );
      const refHigh = Math.max(repairTotal[1], replaceTotal[1]);

      // Add labor cost estimate
      const laborLow = pricing.labor_hours[0] * laborRate;
      const laborHigh = pricing.labor_hours[1] * laborRate;
      const totalRefLow = (refLow === Infinity ? 0 : refLow);
      const totalRefHigh = refHigh + laborHigh;

      // 40% tolerance band
      const tolerance = 0.4;
      const lowerBound = totalRefLow * (1 - tolerance);
      const upperBound = totalRefHigh * (1 + tolerance);

      let status = "in_range";
      let message = `Reference: $${totalRefLow.toLocaleString()}-$${totalRefHigh.toLocaleString()}`;

      if (midEstimate < lowerBound) {
        status = "below_range";
        message = `Below expected range ($${totalRefLow.toLocaleString()}-$${totalRefHigh.toLocaleString()})`;
        warnings++;
      } else if (midEstimate > upperBound) {
        status = "above_range";
        message = `Above expected range ($${totalRefLow.toLocaleString()}-$${totalRefHigh.toLocaleString()})`;
        warnings++;
      }

      results.push({ component: dmg.component, status, message, reference: { low: totalRefLow, high: totalRefHigh } });
    }

    if (type === "property") {
      const key = resolvePropertyComponent(dmg.component);
      if (!key || !PROPERTY_PRICING[key]) {
        results.push({ component: dmg.component, status: "unknown", message: "No reference data", reference: null });
        continue;
      }
      const d = PROPERTY_PRICING[key];
      const mult = state.propertyMultiplier;
      const unitLow = ((d.materials[0] + d.labor[0]) * mult).toFixed(2);
      const unitHigh = ((d.materials[1] + d.labor[1]) * mult).toFixed(2);
      results.push({
        component: dmg.component,
        status: "reference",
        message: `Reference: $${unitLow}-$${unitHigh} per ${d.unit}`,
        reference: { low: parseFloat(unitLow), high: parseFloat(unitHigh), unit: d.unit },
      });
    }
  }

  const totalChecked = results.filter((r) => r.status !== "unknown").length;
  let confidenceModifier = "unknown";
  if (totalChecked > 0) {
    const warningRatio = warnings / totalChecked;
    if (warningRatio === 0) confidenceModifier = "high";
    else if (warningRatio <= 0.3) confidenceModifier = "medium";
    else confidenceModifier = "low";
  }

  return { items: results, confidenceModifier, totalChecked, warnings };
}

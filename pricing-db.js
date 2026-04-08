// ============================================================
// ClaimPilot AI — Pricing Reference Database
// Sources: autoGMS 2025, BEA Regional Price Parities 2023,
//          RepairPal, HomeAdvisor, Fixr, HomeWyse, BLS
// ============================================================

export const PRICING_VERSION = "1.0.0";
export const PRICING_LAST_UPDATED = "2025-06";

// --- US States with labor rates and regional multipliers ---
export const US_STATES = [
  { value: "AL", label: "Alabama",        zip: "35203", autoLaborRate: 143, propertyMultiplier: 0.98 },
  { value: "AK", label: "Alaska",         zip: "99501", autoLaborRate: 140, propertyMultiplier: 1.41 },
  { value: "AZ", label: "Arizona",        zip: "85001", autoLaborRate: 145, propertyMultiplier: 1.02 },
  { value: "AR", label: "Arkansas",       zip: "72201", autoLaborRate: 137, propertyMultiplier: 0.96 },
  { value: "CA", label: "California",     zip: "90001", autoLaborRate: 150, propertyMultiplier: 1.39 },
  { value: "CO", label: "Colorado",       zip: "80201", autoLaborRate: 146, propertyMultiplier: 1.06 },
  { value: "CT", label: "Connecticut",    zip: "06101", autoLaborRate: 149, propertyMultiplier: 1.23 },
  { value: "DE", label: "Delaware",       zip: "19901", autoLaborRate: 144, propertyMultiplier: 1.05 },
  { value: "DC", label: "Washington DC",  zip: "20001", autoLaborRate: 151, propertyMultiplier: 1.30 },
  { value: "FL", label: "Florida",        zip: "33101", autoLaborRate: 145, propertyMultiplier: 0.99 },
  { value: "GA", label: "Georgia",        zip: "30301", autoLaborRate: 144, propertyMultiplier: 1.00 },
  { value: "HI", label: "Hawaii",         zip: "96801", autoLaborRate: 148, propertyMultiplier: 1.42 },
  { value: "ID", label: "Idaho",          zip: "83701", autoLaborRate: 138, propertyMultiplier: 1.01 },
  { value: "IL", label: "Illinois",       zip: "60601", autoLaborRate: 147, propertyMultiplier: 1.05 },
  { value: "IN", label: "Indiana",        zip: "46201", autoLaborRate: 141, propertyMultiplier: 0.99 },
  { value: "IA", label: "Iowa",           zip: "50301", autoLaborRate: 139, propertyMultiplier: 1.06 },
  { value: "KS", label: "Kansas",         zip: "66101", autoLaborRate: 140, propertyMultiplier: 1.00 },
  { value: "KY", label: "Kentucky",       zip: "40201", autoLaborRate: 141, propertyMultiplier: 0.98 },
  { value: "LA", label: "Louisiana",      zip: "70112", autoLaborRate: 144, propertyMultiplier: 0.98 },
  { value: "ME", label: "Maine",          zip: "04101", autoLaborRate: 138, propertyMultiplier: 1.06 },
  { value: "MD", label: "Maryland",       zip: "21201", autoLaborRate: 148, propertyMultiplier: 1.02 },
  { value: "MA", label: "Massachusetts",  zip: "02101", autoLaborRate: 149, propertyMultiplier: 1.30 },
  { value: "MI", label: "Michigan",       zip: "48201", autoLaborRate: 142, propertyMultiplier: 0.99 },
  { value: "MN", label: "Minnesota",      zip: "55401", autoLaborRate: 144, propertyMultiplier: 1.10 },
  { value: "MS", label: "Mississippi",    zip: "39201", autoLaborRate: 152, propertyMultiplier: 0.95 },
  { value: "MO", label: "Missouri",       zip: "63101", autoLaborRate: 141, propertyMultiplier: 0.99 },
  { value: "MT", label: "Montana",        zip: "59601", autoLaborRate: 137, propertyMultiplier: 1.00 },
  { value: "NE", label: "Nebraska",       zip: "68101", autoLaborRate: 139, propertyMultiplier: 1.00 },
  { value: "NV", label: "Nevada",         zip: "89101", autoLaborRate: 146, propertyMultiplier: 1.11 },
  { value: "NH", label: "New Hampshire",  zip: "03101", autoLaborRate: 140, propertyMultiplier: 1.07 },
  { value: "NJ", label: "New Jersey",     zip: "07101", autoLaborRate: 150, propertyMultiplier: 1.39 },
  { value: "NM", label: "New Mexico",     zip: "87101", autoLaborRate: 139, propertyMultiplier: 0.99 },
  { value: "NY", label: "New York",       zip: "10001", autoLaborRate: 151, propertyMultiplier: 1.30 },
  { value: "NC", label: "North Carolina", zip: "27601", autoLaborRate: 143, propertyMultiplier: 1.04 },
  { value: "ND", label: "North Dakota",   zip: "58501", autoLaborRate: 136, propertyMultiplier: 1.00 },
  { value: "OH", label: "Ohio",           zip: "43201", autoLaborRate: 142, propertyMultiplier: 0.99 },
  { value: "OK", label: "Oklahoma",       zip: "73101", autoLaborRate: 140, propertyMultiplier: 0.98 },
  { value: "OR", label: "Oregon",         zip: "97201", autoLaborRate: 145, propertyMultiplier: 1.16 },
  { value: "PA", label: "Pennsylvania",   zip: "19101", autoLaborRate: 146, propertyMultiplier: 1.14 },
  { value: "RI", label: "Rhode Island",   zip: "02901", autoLaborRate: 147, propertyMultiplier: 1.20 },
  { value: "SC", label: "South Carolina", zip: "29201", autoLaborRate: 142, propertyMultiplier: 1.07 },
  { value: "SD", label: "South Dakota",   zip: "57501", autoLaborRate: 135, propertyMultiplier: 1.00 },
  { value: "TN", label: "Tennessee",      zip: "37201", autoLaborRate: 143, propertyMultiplier: 0.98 },
  { value: "TX", label: "Texas",          zip: "75201", autoLaborRate: 146, propertyMultiplier: 1.00 },
  { value: "UT", label: "Utah",           zip: "84101", autoLaborRate: 141, propertyMultiplier: 1.01 },
  { value: "VT", label: "Vermont",        zip: "05601", autoLaborRate: 127, propertyMultiplier: 1.08 },
  { value: "VA", label: "Virginia",       zip: "23219", autoLaborRate: 145, propertyMultiplier: 1.07 },
  { value: "WA", label: "Washington",     zip: "98101", autoLaborRate: 148, propertyMultiplier: 1.19 },
  { value: "WV", label: "West Virginia",  zip: "25301", autoLaborRate: 136, propertyMultiplier: 0.97 },
  { value: "WI", label: "Wisconsin",      zip: "53201", autoLaborRate: 140, propertyMultiplier: 1.08 },
  { value: "WY", label: "Wyoming",        zip: "82001", autoLaborRate: 137, propertyMultiplier: 1.00 },
];

// --- State sales tax rates (applied to parts only, not labor) ---
export const STATE_SALES_TAX = {
  AL: 0.04, AK: 0.00, AZ: 0.056, AR: 0.065, CA: 0.0725, CO: 0.029,
  CT: 0.0635, DE: 0.00, FL: 0.06, GA: 0.04, HI: 0.04, ID: 0.06,
  IL: 0.0625, IN: 0.07, IA: 0.06, KS: 0.065, KY: 0.06, LA: 0.0445,
  ME: 0.055, MD: 0.06, MA: 0.0625, MI: 0.06, MN: 0.06875, MS: 0.07,
  MO: 0.04225, MT: 0.00, NE: 0.055, NV: 0.0685, NH: 0.00, NJ: 0.06625,
  NM: 0.05125, NY: 0.04, NC: 0.0475, ND: 0.05, OH: 0.0575, OK: 0.045,
  OR: 0.00, PA: 0.06, RI: 0.07, SC: 0.06, SD: 0.045, TN: 0.07,
  TX: 0.0625, UT: 0.061, VT: 0.06, VA: 0.053, WA: 0.065, WV: 0.06,
  WI: 0.05, WY: 0.04, DC: 0.06,
};

// --- Labor rate categories & multipliers relative to body rate ---
// Body rate = baseline from US_STATES.autoLaborRate
// Other categories are multiplied from that baseline
export const LABOR_RATE_CATEGORIES = {
  body:       { multiplier: 1.0,  label: "Body" },
  paint:      { multiplier: 1.0,  label: "Paint/Refinish" },
  frame:      { multiplier: 1.0,  label: "Frame/Structural" },
  structural: { multiplier: 1.0,  label: "Structural" },
  mechanical: { multiplier: 1.0,  label: "Mechanical" },
  diagnostic: { multiplier: 1.15, label: "Diagnostic/ADAS" },
  aluminum:   { multiplier: 1.5,  label: "Aluminum Certified" },
  glass:      { multiplier: 1.0,  label: "Glass" },
};

// --- Fraud & alternate parts disclaimers ---
// States with specific mandatory fraud warning language
export const STATE_FRAUD_WARNINGS = {
  NY: "Any person who knowingly and with intent to defraud any insurance company or other person files an application for insurance or statement of claim containing any materially false information, or conceals for the purpose of misleading, information concerning any fact material thereto, commits a fraudulent insurance act, which is a crime, and shall also be subject to a civil penalty not to exceed five thousand dollars and the stated value of the claim for each such violation.",
  FL: "Any person who knowingly and with intent to injure, defraud, or deceive any insurer files a statement of claim or an application containing any false, incomplete, or misleading information is guilty of a felony of the third degree.",
  NJ: "Any person who includes any false or misleading information on an application for an insurance policy is subject to criminal and civil penalties.",
  PA: "Any person who knowingly and with intent to defraud any insurance company or other person files an application for insurance or statement of claim containing any materially false information or conceals for the purpose of misleading, information concerning any fact material thereto commits a fraudulent insurance act, which is a crime and subjects such person to criminal and civil penalties.",
  KY: "Any person who knowingly and with intent to defraud any insurance company or other person files a statement of claim containing any materially false information or conceals, for the purpose of misleading, information concerning any fact material thereto commits a fraudulent insurance act, which is a crime.",
  CO: "It is unlawful to knowingly provide false, incomplete, or misleading facts or information to an insurance company for the purpose of defrauding or attempting to defraud the company. Penalties may include imprisonment, fines, denial of insurance, and civil damages.",
  VA: "It is a crime to knowingly provide false, incomplete, or misleading information to an insurance company for the purpose of defrauding the company. Penalties include imprisonment, fines, and denial of insurance benefits.",
  OH: "Any person who, with intent to defraud or knowing that he is facilitating a fraud against an insurer, submits an application or files a claim containing a false or deceptive statement is guilty of insurance fraud.",
  OK: "WARNING: Any person who knowingly, and with intent to injure, defraud or deceive any insurer, makes any claim for the proceeds of an insurance policy containing any false, incomplete or misleading information is guilty of a felony.",
  TX: "Any person who knowingly presents a false or fraudulent claim for the payment of a loss is guilty of a crime and may be subject to fines and confinement in state prison.",
};

export const STANDARD_FRAUD_DISCLAIMER = "Any person who knowingly presents a false or fraudulent claim for payment of a loss or benefit, or who knowingly presents false information in an application for insurance, is guilty of a crime and may be subject to fines and confinement in prison.";

export const ALTERNATE_PARTS_DISCLAIMER = "This estimate may include the use of aftermarket (non-OEM) or recycled (LKQ) replacement parts. These parts may not be manufactured by the original equipment manufacturer but are designed to function similarly. You have the right to request OEM parts; however, the cost difference may not be covered by your insurance policy. Aftermarket parts, if used, are identified on this estimate.";

// --- Diagnostic/ADAS flat rates (common sublet items) ---
export const DIAGNOSTIC_FLAT_RATES = {
  pre_repair_scan:    { low: 30, high: 75, label: "Pre-repair diagnostic scan" },
  post_repair_scan:   { low: 30, high: 75, label: "Post-repair diagnostic scan" },
  adas_calibration:   { low: 200, high: 600, label: "ADAS calibration (per system)" },
  four_wheel_align:   { low: 80, high: 175, label: "4-wheel alignment" },
};

// --- Vehicle classification ---
const VEHICLE_CLASS_MAP = {
  economy: ["Kia", "Hyundai", "Nissan", "Mitsubishi", "MINI", "Fiat", "smart"],
  midsize: ["Honda", "Toyota", "Mazda", "Subaru", "Volkswagen", "Chevrolet", "Ford", "Dodge", "Chrysler", "Buick", "GMC", "Ram", "Jeep"],
  premium: ["Acura", "Infiniti", "Cadillac", "Lincoln", "Genesis", "Volvo", "Tesla", "Alfa Romeo", "Jaguar", "Polestar", "Rivian", "Lucid"],
  luxury: ["BMW", "Mercedes-Benz", "Audi", "Lexus"],
  ultra_luxury: ["Porsche", "Land Rover", "Maserati", "Bentley", "Aston Martin", "Rolls-Royce", "Lamborghini", "Ferrari", "McLaren"],
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
  BMW:       { X3: "truck_suv", X5: "truck_suv", X7: "truck_suv" },
  "Mercedes-Benz": { GLA: "truck_suv", GLB: "truck_suv", GLC: "truck_suv", GLE: "truck_suv", GLS: "truck_suv", "G-Class": "truck_suv" },
  Audi:      { Q3: "truck_suv", Q5: "truck_suv", Q7: "truck_suv", Q8: "truck_suv", "e-tron": "truck_suv" },
  Lexus:     { GX: "truck_suv", LX470: "truck_suv", LX570: "truck_suv", LX600: "truck_suv", NX: "truck_suv", RX: "truck_suv", TX: "truck_suv" },
  Acura:     { MDX: "truck_suv", RDX: "truck_suv" },
  Infiniti:  { QX50: "truck_suv", QX55: "truck_suv", QX60: "truck_suv", QX80: "truck_suv" },
  Cadillac:  { Escalade: "truck_suv", XT4: "truck_suv", XT5: "truck_suv", XT6: "truck_suv", LYRIQ: "truck_suv" },
  Lincoln:   { Aviator: "truck_suv", Corsair: "truck_suv", Nautilus: "truck_suv", Navigator: "truck_suv" },
  Genesis:   { GV70: "truck_suv", GV80: "truck_suv" },
  Volvo:     { XC40: "truck_suv", XC60: "truck_suv", XC90: "truck_suv", EX30: "truck_suv", EX90: "truck_suv" },
  Porsche:   { Cayenne: "truck_suv", Macan: "truck_suv" },
  "Land Rover": { Defender: "truck_suv", Discovery: "truck_suv", "Discovery Sport": "truck_suv", "Range Rover": "truck_suv", "Range Rover Sport": "truck_suv", "Range Rover Velar": "truck_suv", "Range Rover Evoque": "truck_suv" },
  Tesla:     { "Model X": "truck_suv", "Model Y": "truck_suv", Cybertruck: "truck_suv" },
  Rivian:    { R1S: "truck_suv", R1T: "truck_suv" },
  Mazda:     { "CX-5": "truck_suv", "CX-30": "truck_suv", "CX-50": "truck_suv", "CX-70": "truck_suv", "CX-90": "truck_suv", "CX-9": "truck_suv" },
  Volkswagen:{ Atlas: "truck_suv", "Atlas Cross Sport": "truck_suv", Tiguan: "truck_suv", "ID.4": "truck_suv", "ID.Buzz": "truck_suv" },
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
    economy:     { repair: [300, 600],   replace: [500, 1000],   labor_hours: [2, 5] },
    midsize:     { repair: [400, 800],   replace: [600, 1400],   labor_hours: [3, 6] },
    premium:     { repair: [500, 1000],  replace: [900, 2200],   labor_hours: [3, 7] },
    luxury:      { repair: [600, 1200],  replace: [1200, 3000],  labor_hours: [3, 8] },
    ultra_luxury:{ repair: [1000, 2000], replace: [2500, 6000],  labor_hours: [4, 10] },
    truck_suv:   { repair: [400, 900],   replace: [700, 1800],   labor_hours: [3, 6] },
  },
  bumper_rear: {
    economy:     { repair: [300, 600],   replace: [500, 1100],   labor_hours: [2, 5] },
    midsize:     { repair: [400, 800],   replace: [600, 1500],   labor_hours: [3, 6] },
    premium:     { repair: [500, 1000],  replace: [900, 2300],   labor_hours: [3, 7] },
    luxury:      { repair: [600, 1200],  replace: [1200, 3200],  labor_hours: [3, 8] },
    ultra_luxury:{ repair: [1000, 2000], replace: [2500, 6500],  labor_hours: [4, 10] },
    truck_suv:   { repair: [400, 900],   replace: [700, 1900],   labor_hours: [3, 6] },
  },
  fender: {
    economy:     { repair: [200, 500],   replace: [400, 900],    labor_hours: [2, 4] },
    midsize:     { repair: [300, 700],   replace: [500, 1200],   labor_hours: [3, 5] },
    premium:     { repair: [400, 850],   replace: [750, 1800],   labor_hours: [3, 6] },
    luxury:      { repair: [500, 1000],  replace: [1000, 2500],  labor_hours: [3, 7] },
    ultra_luxury:{ repair: [800, 1800],  replace: [2000, 5000],  labor_hours: [4, 9] },
    truck_suv:   { repair: [350, 750],   replace: [600, 1500],   labor_hours: [3, 5] },
  },
  hood: {
    economy:     { repair: [200, 500],   replace: [400, 1000],   labor_hours: [2, 4] },
    midsize:     { repair: [300, 700],   replace: [500, 1400],   labor_hours: [2, 5] },
    premium:     { repair: [400, 950],   replace: [800, 2400],   labor_hours: [3, 6] },
    luxury:      { repair: [500, 1200],  replace: [1200, 3500],  labor_hours: [3, 6] },
    ultra_luxury:{ repair: [900, 2200],  replace: [3000, 8000],  labor_hours: [4, 8] },
    truck_suv:   { repair: [350, 800],   replace: [600, 1800],   labor_hours: [2, 5] },
  },
  door: {
    economy:     { repair: [250, 600],   replace: [500, 1200],   labor_hours: [3, 6] },
    midsize:     { repair: [350, 800],   replace: [800, 2000],   labor_hours: [4, 7] },
    premium:     { repair: [500, 1200],  replace: [1100, 3000],  labor_hours: [4, 9] },
    luxury:      { repair: [600, 1500],  replace: [1500, 4000],  labor_hours: [4, 10] },
    ultra_luxury:{ repair: [1000, 2500], replace: [3000, 8000],  labor_hours: [5, 12] },
    truck_suv:   { repair: [400, 900],   replace: [900, 2500],   labor_hours: [4, 8] },
  },
  windshield: {
    economy:     { repair: [50, 150],    replace: [200, 450],    labor_hours: [1, 2] },
    midsize:     { repair: [50, 150],    replace: [250, 600],    labor_hours: [1, 2] },
    premium:     { repair: [60, 175],    replace: [350, 1000],   labor_hours: [1, 2.5] },
    luxury:      { repair: [75, 200],    replace: [500, 1500],   labor_hours: [1, 3] },
    ultra_luxury:{ repair: [100, 300],   replace: [1000, 3000],  labor_hours: [1.5, 4] },
    truck_suv:   { repair: [50, 150],    replace: [300, 700],    labor_hours: [1, 2] },
  },
  headlight: {
    economy:     { repair: [null, null], replace: [150, 500],    labor_hours: [0.5, 2] },
    midsize:     { repair: [null, null], replace: [200, 800],    labor_hours: [0.5, 2] },
    premium:     { repair: [null, null], replace: [400, 1500],   labor_hours: [1, 2.5] },
    luxury:      { repair: [null, null], replace: [600, 2500],   labor_hours: [1, 3] },
    ultra_luxury:{ repair: [null, null], replace: [1500, 5000],  labor_hours: [1.5, 4] },
    truck_suv:   { repair: [null, null], replace: [250, 900],    labor_hours: [0.5, 2] },
  },
  taillight: {
    economy:     { repair: [null, null], replace: [60, 300],     labor_hours: [0.5, 1.5] },
    midsize:     { repair: [null, null], replace: [100, 500],    labor_hours: [0.5, 2] },
    premium:     { repair: [null, null], replace: [200, 800],    labor_hours: [0.5, 2] },
    luxury:      { repair: [null, null], replace: [300, 1200],   labor_hours: [0.5, 2] },
    ultra_luxury:{ repair: [null, null], replace: [600, 2500],   labor_hours: [1, 3] },
    truck_suv:   { repair: [null, null], replace: [100, 600],    labor_hours: [0.5, 2] },
  },
  mirror: {
    economy:     { repair: [50, 150],    replace: [100, 300],    labor_hours: [1, 2] },
    midsize:     { repair: [75, 200],    replace: [150, 500],    labor_hours: [1, 2] },
    premium:     { repair: [90, 250],    replace: [250, 800],    labor_hours: [1, 2.5] },
    luxury:      { repair: [100, 300],   replace: [400, 1200],   labor_hours: [1, 3] },
    ultra_luxury:{ repair: [200, 500],   replace: [800, 2500],   labor_hours: [1, 3] },
    truck_suv:   { repair: [75, 200],    replace: [150, 600],    labor_hours: [1, 2] },
  },
  trunk: {
    economy:     { repair: [200, 500],   replace: [400, 900],    labor_hours: [2, 4] },
    midsize:     { repair: [300, 700],   replace: [500, 1300],   labor_hours: [2, 5] },
    premium:     { repair: [400, 850],   replace: [750, 2000],   labor_hours: [3, 6] },
    luxury:      { repair: [500, 1000],  replace: [1000, 2800],  labor_hours: [3, 6] },
    ultra_luxury:{ repair: [800, 1800],  replace: [2000, 5500],  labor_hours: [4, 8] },
    truck_suv:   { repair: [300, 700],   replace: [500, 1500],   labor_hours: [2, 5] },
  },
  quarter_panel: {
    economy:     { repair: [400, 900],   replace: [800, 2000],   labor_hours: [6, 12] },
    midsize:     { repair: [500, 1200],  replace: [1000, 3000],  labor_hours: [8, 14] },
    premium:     { repair: [650, 1600],  replace: [1500, 4200],  labor_hours: [9, 16] },
    luxury:      { repair: [800, 2000],  replace: [2000, 5500],  labor_hours: [10, 18] },
    ultra_luxury:{ repair: [1500, 3500], replace: [4000, 10000], labor_hours: [12, 22] },
    truck_suv:   { repair: [600, 1400],  replace: [1200, 3500],  labor_hours: [8, 15] },
  },
  roof: {
    economy:     { repair: [300, 800],   replace: [800, 2000],   labor_hours: [4, 8] },
    midsize:     { repair: [400, 1000],  replace: [1000, 3000],  labor_hours: [6, 10] },
    premium:     { repair: [500, 1250],  replace: [1500, 4500],  labor_hours: [6, 12] },
    luxury:      { repair: [600, 1500],  replace: [2000, 6000],  labor_hours: [6, 14] },
    ultra_luxury:{ repair: [1000, 2500], replace: [4000, 12000], labor_hours: [8, 18] },
    truck_suv:   { repair: [500, 1200],  replace: [1200, 3500],  labor_hours: [6, 12] },
  },
  frame: {
    economy:     { repair: [600, 2000],  replace: [2000, 5000],   labor_hours: [5, 15] },
    midsize:     { repair: [800, 3000],  replace: [3000, 7000],   labor_hours: [8, 20] },
    premium:     { repair: [1200, 4000], replace: [4000, 9500],   labor_hours: [9, 22] },
    luxury:      { repair: [1500, 5000], replace: [5000, 12000],  labor_hours: [10, 25] },
    ultra_luxury:{ repair: [3000, 8000], replace: [8000, 20000],  labor_hours: [15, 35] },
    truck_suv:   { repair: [1000, 4000], replace: [3000, 10000],  labor_hours: [8, 20] },
  },
  suspension: {
    economy:     { repair: [200, 600],   replace: [400, 1200],   labor_hours: [2, 5] },
    midsize:     { repair: [300, 800],   replace: [500, 1800],   labor_hours: [2, 6] },
    premium:     { repair: [400, 1200],  replace: [750, 2600],   labor_hours: [3, 7] },
    luxury:      { repair: [500, 1500],  replace: [1000, 3500],  labor_hours: [3, 8] },
    ultra_luxury:{ repair: [900, 2500],  replace: [2000, 7000],  labor_hours: [4, 10] },
    truck_suv:   { repair: [400, 1000],  replace: [600, 2200],   labor_hours: [3, 7] },
  },
  airbag: {
    economy:     { repair: [null, null], replace: [300, 800],    labor_hours: [1, 3] },
    midsize:     { repair: [null, null], replace: [400, 1200],   labor_hours: [1, 3] },
    premium:     { repair: [null, null], replace: [600, 1800],   labor_hours: [1.5, 3.5] },
    luxury:      { repair: [null, null], replace: [800, 2500],   labor_hours: [2, 4] },
    ultra_luxury:{ repair: [null, null], replace: [1500, 5000],  labor_hours: [2, 5] },
    truck_suv:   { repair: [null, null], replace: [400, 1500],   labor_hours: [1, 3] },
  },
  grille: {
    economy:     { repair: [50, 150],    replace: [100, 350],    labor_hours: [0.5, 1.5] },
    midsize:     { repair: [75, 200],    replace: [150, 500],    labor_hours: [0.5, 1.5] },
    premium:     { repair: [100, 300],   replace: [250, 1000],   labor_hours: [0.5, 2] },
    luxury:      { repair: [150, 400],   replace: [400, 1500],   labor_hours: [0.5, 2] },
    ultra_luxury:{ repair: [250, 700],   replace: [800, 3000],   labor_hours: [1, 3] },
    truck_suv:   { repair: [75, 200],    replace: [150, 600],    labor_hours: [0.5, 1.5] },
  },
  paint_panel: {
    economy:     { repair: [300, 600],   replace: [null, null],  labor_hours: [3, 6] },
    midsize:     { repair: [400, 800],   replace: [null, null],  labor_hours: [4, 8] },
    premium:     { repair: [500, 1200],  replace: [null, null],  labor_hours: [5, 9] },
    luxury:      { repair: [600, 1500],  replace: [null, null],  labor_hours: [5, 10] },
    ultra_luxury:{ repair: [1000, 3000], replace: [null, null],  labor_hours: [6, 14] },
    truck_suv:   { repair: [400, 900],   replace: [null, null],  labor_hours: [4, 8] },
  },
  // --- Interior components ---
  dashboard: {
    economy:     { repair: [200, 600],   replace: [800, 2000],   labor_hours: [3, 8] },
    midsize:     { repair: [300, 800],   replace: [1000, 3000],  labor_hours: [4, 10] },
    premium:     { repair: [400, 1200],  replace: [1500, 4500],  labor_hours: [5, 12] },
    luxury:      { repair: [500, 1500],  replace: [2000, 6000],  labor_hours: [6, 14] },
    ultra_luxury:{ repair: [1000, 3000], replace: [5000, 12000], labor_hours: [8, 18] },
    truck_suv:   { repair: [400, 1000],  replace: [1200, 3500],  labor_hours: [4, 10] },
  },
  seat: {
    economy:     { repair: [150, 500],   replace: [500, 1500],   labor_hours: [2, 5] },
    midsize:     { repair: [200, 700],   replace: [800, 2500],   labor_hours: [2, 6] },
    premium:     { repair: [300, 1000],  replace: [1500, 5000],  labor_hours: [3, 7] },
    luxury:      { repair: [400, 1200],  replace: [2500, 9000],  labor_hours: [3, 8] },
    ultra_luxury:{ repair: [800, 2500],  replace: [5000, 15000], labor_hours: [4, 10] },
    truck_suv:   { repair: [250, 800],   replace: [900, 3500],   labor_hours: [2, 6] },
  },
  headliner: {
    economy:     { repair: [150, 400],   replace: [300, 800],    labor_hours: [2, 5] },
    midsize:     { repair: [200, 500],   replace: [400, 1200],   labor_hours: [3, 6] },
    premium:     { repair: [250, 650],   replace: [600, 1800],   labor_hours: [3, 7] },
    luxury:      { repair: [300, 800],   replace: [800, 2500],   labor_hours: [4, 8] },
    ultra_luxury:{ repair: [500, 1500],  replace: [1500, 5000],  labor_hours: [5, 10] },
    truck_suv:   { repair: [250, 600],   replace: [500, 1500],   labor_hours: [3, 7] },
  },
  steering_wheel: {
    economy:     { repair: [null, null], replace: [150, 400],    labor_hours: [1, 2] },
    midsize:     { repair: [null, null], replace: [200, 600],    labor_hours: [1, 2] },
    premium:     { repair: [null, null], replace: [350, 1000],   labor_hours: [1, 2.5] },
    luxury:      { repair: [null, null], replace: [500, 1500],   labor_hours: [1, 3] },
    ultra_luxury:{ repair: [null, null], replace: [1000, 3500],  labor_hours: [1.5, 4] },
    truck_suv:   { repair: [null, null], replace: [250, 700],    labor_hours: [1, 2] },
  },
  center_console: {
    economy:     { repair: [100, 300],   replace: [200, 600],    labor_hours: [1, 3] },
    midsize:     { repair: [150, 400],   replace: [300, 900],    labor_hours: [2, 4] },
    premium:     { repair: [200, 600],   replace: [450, 1400],   labor_hours: [2, 4.5] },
    luxury:      { repair: [300, 800],   replace: [600, 2000],   labor_hours: [2, 5] },
    ultra_luxury:{ repair: [500, 1500],  replace: [1200, 4000],  labor_hours: [3, 7] },
    truck_suv:   { repair: [150, 500],   replace: [350, 1000],   labor_hours: [2, 4] },
  },
  door_panel_interior: {
    economy:     { repair: [100, 300],   replace: [200, 500],    labor_hours: [1, 3] },
    midsize:     { repair: [150, 400],   replace: [300, 800],    labor_hours: [2, 4] },
    premium:     { repair: [200, 550],   replace: [450, 1300],   labor_hours: [2, 4.5] },
    luxury:      { repair: [300, 700],   replace: [600, 1800],   labor_hours: [2, 5] },
    ultra_luxury:{ repair: [500, 1200],  replace: [1200, 3500],  labor_hours: [3, 7] },
    truck_suv:   { repair: [150, 450],   replace: [350, 900],    labor_hours: [2, 4] },
  },
  carpet_flooring: {
    economy:     { repair: [100, 300],   replace: [300, 800],    labor_hours: [2, 5] },
    midsize:     { repair: [150, 400],   replace: [400, 1200],   labor_hours: [3, 6] },
    premium:     { repair: [200, 550],   replace: [600, 1800],   labor_hours: [3, 7] },
    luxury:      { repair: [250, 700],   replace: [800, 2500],   labor_hours: [4, 8] },
    ultra_luxury:{ repair: [400, 1200],  replace: [1500, 5000],  labor_hours: [5, 10] },
    truck_suv:   { repair: [200, 500],   replace: [500, 1500],   labor_hours: [3, 6] },
  },
  engine_compartment: {
    economy:     { repair: [1000, 3000], replace: [3000, 8000],   labor_hours: [10, 25] },
    midsize:     { repair: [1500, 5000], replace: [5000, 12000],  labor_hours: [12, 30] },
    premium:     { repair: [2200, 6500], replace: [6500, 18000],  labor_hours: [14, 35] },
    luxury:      { repair: [3000, 8000], replace: [8000, 25000],  labor_hours: [15, 40] },
    ultra_luxury:{ repair: [5000, 15000],replace: [15000, 50000], labor_hours: [20, 60] },
    truck_suv:   { repair: [2000, 6000], replace: [5000, 15000],  labor_hours: [12, 30] },
  },
  wiring_harness: {
    economy:     { repair: [300, 800],   replace: [800, 2000],   labor_hours: [4, 10] },
    midsize:     { repair: [400, 1200],  replace: [1000, 3000],  labor_hours: [5, 12] },
    premium:     { repair: [500, 1600],  replace: [1500, 4500],  labor_hours: [6, 16] },
    luxury:      { repair: [600, 2000],  replace: [2000, 6000],  labor_hours: [8, 20] },
    ultra_luxury:{ repair: [1000, 3500], replace: [4000, 12000], labor_hours: [10, 25] },
    truck_suv:   { repair: [500, 1500],  replace: [1200, 4000],  labor_hours: [6, 15] },
  },
  wheel_tire: {
    economy:     { repair: [50, 150],    replace: [100, 400],    labor_hours: [0.5, 1] },
    midsize:     { repair: [75, 200],    replace: [150, 600],    labor_hours: [0.5, 1] },
    premium:     { repair: [90, 250],    replace: [200, 900],    labor_hours: [0.5, 1] },
    luxury:      { repair: [100, 300],   replace: [300, 1200],   labor_hours: [0.5, 1.5] },
    ultra_luxury:{ repair: [200, 500],   replace: [600, 2500],   labor_hours: [0.5, 2] },
    truck_suv:   { repair: [75, 250],    replace: [200, 800],    labor_hours: [0.5, 1] },
  },
  sunroof: {
    economy:     { repair: [200, 500],   replace: [500, 1200],   labor_hours: [2, 5] },
    midsize:     { repair: [300, 700],   replace: [700, 1800],   labor_hours: [3, 6] },
    premium:     { repair: [400, 950],   replace: [900, 2600],   labor_hours: [3, 7] },
    luxury:      { repair: [500, 1200],  replace: [1200, 3500],  labor_hours: [3, 8] },
    ultra_luxury:{ repair: [800, 2000],  replace: [2500, 7000],  labor_hours: [4, 10] },
    truck_suv:   { repair: [400, 900],   replace: [800, 2200],   labor_hours: [3, 7] },
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
  // Interior
  dashboard: "dashboard", "dash": "dashboard", "instrument panel": "dashboard", "dash panel": "dashboard",
  "instrument cluster": "dashboard",
  seat: "seat", "driver seat": "seat", "passenger seat": "seat", "front seat": "seat", "rear seat": "seat",
  "back seat": "seat", "front driver seat": "seat", "front passenger seat": "seat",
  headliner: "headliner", "headlining": "headliner", "ceiling": "headliner", "roof liner": "headliner",
  "cabin ceiling": "headliner",
  "steering wheel": "steering_wheel", "steering column": "steering_wheel",
  "center console": "center_console", "centre console": "center_console", "console": "center_console",
  "gear selector": "center_console",
  "door panel interior": "door_panel_interior", "interior door panel": "door_panel_interior",
  "door card": "door_panel_interior", "door trim": "door_panel_interior",
  "front left door panel": "door_panel_interior", "front right door panel": "door_panel_interior",
  "rear left door panel": "door_panel_interior", "rear right door panel": "door_panel_interior",
  "left front door panel": "door_panel_interior", "right front door panel": "door_panel_interior",
  carpet: "carpet_flooring", "floor carpet": "carpet_flooring", "floor mat": "carpet_flooring",
  "interior carpet": "carpet_flooring", "cabin carpet": "carpet_flooring", "flooring": "carpet_flooring",
  "engine compartment": "engine_compartment", "engine bay": "engine_compartment", "engine": "engine_compartment",
  "motor": "engine_compartment", "engine block": "engine_compartment",
  "wiring harness": "wiring_harness", "wiring": "wiring_harness", "electrical wiring": "wiring_harness",
  "interior wiring": "wiring_harness", "wire harness": "wiring_harness",
  "wheel": "wheel_tire", "tire": "wheel_tire", "wheel and tire": "wheel_tire", "rim": "wheel_tire",
  sunroof: "sunroof", "sun roof": "sunroof", "moonroof": "sunroof", "moon roof": "sunroof",
  "sunroof glass": "sunroof",
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
    const clsLabel = { economy: "Economy", midsize: "Mid-size", premium: "Premium", luxury: "Luxury", ultra_luxury: "Ultra-Luxury", truck_suv: "Truck/SUV" }[cls];

    const sourceLabel = options.freshPricing?.source === "live"
      ? "[Live pricing from Google Search]"
      : `[Reference pricing database, last updated ${PRICING_LAST_UPDATED}]`;

    const bodyRate = options.freshPricing?.labor_rate_per_hour || state.autoLaborRate;
    const taxRate = STATE_SALES_TAX[stateCode] || 0;
    const taxPct = (taxRate * 100).toFixed(2);

    let lines = [
      `\n--- PRICING REFERENCE DATA (${state.label}, ${clsLabel} class) ${sourceLabel} ---`,
      `LABOR RATES (${state.label}):`,
      `  Body: $${bodyRate}/hr | Paint: $${bodyRate}/hr | Frame: $${bodyRate}/hr | Mechanical: $${bodyRate}/hr`,
      `  Diagnostic/ADAS: $${Math.round(bodyRate * LABOR_RATE_CATEGORIES.diagnostic.multiplier)}/hr | Aluminum: $${Math.round(bodyRate * LABOR_RATE_CATEGORIES.aluminum.multiplier)}/hr`,
      `Parts tax rate (${state.label}): ${taxRate > 0 ? taxPct + '%' : 'No state sales tax'}`,
      `Vehicle class: ${clsLabel}`,
      ``,
      `PART TYPES: OEM (original), AFT (aftermarket), LKQ (recycled/used), REMAN (remanufactured), RECON (reconditioned)`,
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
  }

  if (type === "property") {
    const { area, cause } = options;
    const mult = state.propertyMultiplier;
    const relevant = getRelevantPropertyItems(area, cause);

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
  }

  return "";
}

// --- Live pricing cache helpers ---
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
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
      const clsLabel = { economy: "Economy", midsize: "Mid-size", premium: "Premium", luxury: "Luxury", ultra_luxury: "Ultra-Luxury", truck_suv: "Truck/SUV" }[cls];
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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
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
    // Mitchell auto: single estimated_cost; Property: low/high range
    const costLow = dmg.estimated_cost ?? dmg.estimated_cost_low ?? 0;
    const costHigh = dmg.estimated_cost ?? dmg.estimated_cost_high ?? 0;
    const midEstimate = dmg.estimated_cost ?? (costLow + costHigh) / 2;

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
      const laborLow = pricing.labor_hours[0] * laborRate;
      const laborHigh = pricing.labor_hours[1] * laborRate;

      // Determine severity-appropriate range based on AI estimate
      const hasRepair = pricing.repair[0] !== null;
      const hasReplace = pricing.replace[0] !== null;

      let totalRefLow, totalRefHigh;
      if (hasRepair && hasReplace) {
        // Show repair low + labor low → replace high + labor high
        totalRefLow = pricing.repair[0] + laborLow;
        totalRefHigh = pricing.replace[1] + laborHigh;
      } else if (hasReplace) {
        totalRefLow = pricing.replace[0] + laborLow;
        totalRefHigh = pricing.replace[1] + laborHigh;
      } else if (hasRepair) {
        totalRefLow = pricing.repair[0] + laborLow;
        totalRefHigh = pricing.repair[1] + laborHigh;
      } else {
        totalRefLow = laborLow;
        totalRefHigh = laborHigh;
      }

      // 30% tolerance band
      const tolerance = 0.3;
      const lowerBound = totalRefLow * (1 - tolerance);
      const upperBound = totalRefHigh * (1 + tolerance);

      // Build detailed reference message
      const parts = [];
      if (hasRepair) parts.push(`Repair: $${pricing.repair[0].toLocaleString()}–$${pricing.repair[1].toLocaleString()}`);
      if (hasReplace) parts.push(`Replace: $${pricing.replace[0].toLocaleString()}–$${pricing.replace[1].toLocaleString()}`);
      parts.push(`Labor: ${pricing.labor_hours[0]}–${pricing.labor_hours[1]} hrs × $${laborRate}/hr`);

      let status = "in_range";
      let message = `${parts.join(" · ")} · Total: $${totalRefLow.toLocaleString()}–$${totalRefHigh.toLocaleString()}`;

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

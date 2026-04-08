// Standardized labor times database
// Sources: CCC/MOTOR, Mitchell P-Pages, DEG, ASA, CollisionBlast, SCRS, real estimates from forums
// All hours in decimal (tenths = 6 minutes)
// Values are [low, high] for midsize sedan baseline

export const LABOR_TIMES = {
  // ========== R&R (Remove & Replace) — BODY LABOR ==========
  rr_body: {
    // Front End
    front_bumper_cover:       { hours: [2.0, 2.5], type: "body", notes: "Includes R&I of fog lamps if equipped" },
    front_bumper:             { hours: [2.0, 2.5], type: "body", notes: "Alias for front_bumper_cover" },
    front_bumper_reinforcement: { hours: [0.5, 1.0], type: "body" },
    bumper_absorber:          { hours: [0.3, 0.5], type: "body", notes: "Often included with reinforcement" },
    bumper_bracket:           { hours: [0.3, 0.5], type: "body" },
    bumper_valance:           { hours: [0.5, 0.8], type: "body" },
    lower_valance_panel:      { hours: [0.5, 0.8], type: "body" },
    air_dam:                  { hours: [0.3, 0.5], type: "body" },
    radiator_support:         { hours: [3.0, 5.0], type: "structural", notes: "Major structural — requires significant disassembly" },
    core_support:             { hours: [3.0, 5.0], type: "structural" },
    upper_tie_bar:            { hours: [0.5, 1.0], type: "structural" },
    hood:                     { hours: [0.5, 1.0], type: "body", notes: "Bolt-on, fast. CCC includes hood pad R&I" },
    hood_hinge:               { hours: [0.3, 0.3], type: "body", notes: "Per side. Included in CCC hood R&R, NOT in Mitchell" },
    hood_latch:               { hours: [0.2, 0.3], type: "body" },
    hood_insulator:           { hours: [0.1, 0.2], type: "body", notes: "Usually included in hood R&R" },
    grille:                   { hours: [0.2, 0.5], type: "body", notes: "CCC may include in bumper cover R&R; Mitchell separate" },
    grille_assembly:          { hours: [0.3, 0.5], type: "body" },
    grille_surround:          { hours: [0.2, 0.3], type: "body" },
    emblem:                   { hours: [0.1, 0.2], type: "body" },
    badge:                    { hours: [0.1, 0.2], type: "body" },

    // Fenders & Wheel Area
    front_fender:             { hours: [1.0, 2.0], type: "body", notes: "Bolt-on. Typical midsize ~1.5 hrs" },
    rear_fender:              { hours: [1.5, 2.5], type: "body" },
    fender_extension:         { hours: [0.3, 0.5], type: "body" },
    fender_flare:             { hours: [0.3, 0.5], type: "body" },
    fender_molding:           { hours: [0.2, 0.3], type: "body" },
    inner_fender:             { hours: [0.5, 1.0], type: "body" },
    fender_liner:             { hours: [0.3, 0.5], type: "body" },
    inner_fender_liner:       { hours: [0.3, 0.5], type: "body" },
    wheelhouse_liner:         { hours: [0.3, 0.5], type: "body" },
    splash_shield:            { hours: [0.2, 0.3], type: "body" },
    splash_guard:             { hours: [0.2, 0.3], type: "body" },
    mud_flap:                 { hours: [0.1, 0.2], type: "body" },

    // Body Side & Pillars
    rocker_panel:             { hours: [8.0, 10.0], type: "structural", notes: "Welded panel. Full replace with inner+outer ~16 hrs" },
    outer_rocker_panel:       { hours: [8.0, 10.0], type: "structural" },
    quarter_panel:            { hours: [10.0, 18.0], type: "structural", notes: "Full welded replace. Forum data: 16-23 hrs each" },
    rear_quarter_panel:       { hours: [10.0, 18.0], type: "structural" },
    lower_quarter_patch_panel: { hours: [4.0, 8.0], type: "structural", notes: "Partial section replace" },
    body_side_panel:          { hours: [8.0, 14.0], type: "structural" },
    a_pillar:                 { hours: [6.0, 10.0], type: "structural" },
    b_pillar:                 { hours: [6.0, 10.0], type: "structural" },
    c_pillar:                 { hours: [5.0, 8.0], type: "structural" },
    roof_side_rail:           { hours: [4.0, 8.0], type: "structural" },

    // Doors
    front_door_shell:         { hours: [3.0, 6.0], type: "body", notes: "Includes transfer of all components" },
    rear_door_shell:          { hours: [3.0, 6.0], type: "body" },
    door_skin:                { hours: [4.0, 6.0], type: "structural", notes: "Requires welding/bonding + full transfer" },
    outer_door_skin:          { hours: [4.0, 6.0], type: "structural" },
    door_handle:              { hours: [0.3, 0.5], type: "body" },
    outer_door_handle:        { hours: [0.3, 0.5], type: "body" },
    door_mirror:              { hours: [0.3, 0.5], type: "body", notes: "NOT included in door skin R&R in CCC or Mitchell" },
    outside_rearview_mirror:  { hours: [0.3, 0.5], type: "body" },
    side_view_mirror:         { hours: [0.3, 0.5], type: "body" },
    mirror_cover:             { hours: [0.1, 0.2], type: "body" },
    door_molding:             { hours: [0.2, 0.3], type: "body" },
    door_belt_molding:        { hours: [0.2, 0.3], type: "body" },
    door_weatherstrip:        { hours: [0.2, 0.3], type: "body" },
    door_check:               { hours: [0.2, 0.3], type: "body" },
    door_hinge_upper:         { hours: [0.3, 0.5], type: "body" },
    door_hinge_lower:         { hours: [0.3, 0.5], type: "body" },
    door_latch:               { hours: [0.3, 0.5], type: "body" },
    door_lock_actuator:       { hours: [0.5, 0.8], type: "body" },
    door_trim_panel:          { hours: [0.3, 0.5], type: "body" },
    window_regulator:         { hours: [0.8, 1.5], type: "body" },
    window_motor:             { hours: [0.5, 0.8], type: "body" },

    // Glass & Glazing
    windshield:               { hours: [1.0, 1.5], type: "glass", notes: "Includes urethane kit. Cure time not counted" },
    front_windshield:         { hours: [1.0, 1.5], type: "glass" },
    rear_window:              { hours: [0.8, 1.5], type: "glass" },
    back_glass:               { hours: [0.8, 1.5], type: "glass" },
    side_window_glass:        { hours: [0.5, 0.8], type: "glass" },
    door_glass:               { hours: [0.5, 0.8], type: "glass" },
    quarter_glass:            { hours: [0.3, 0.5], type: "glass" },
    sunroof_glass:            { hours: [0.8, 1.5], type: "glass" },

    // Roof
    roof_panel:               { hours: [8.0, 14.0], type: "structural", notes: "Welded panel" },
    roof_rack:                { hours: [0.3, 0.5], type: "body" },

    // Rear End
    rear_bumper_cover:        { hours: [1.5, 2.8], type: "body", notes: "Real estimate: 2.2 hrs" },
    rear_bumper:              { hours: [1.5, 2.8], type: "body" },
    rear_bumper_reinforcement: { hours: [0.5, 1.0], type: "body" },
    rear_bumper_absorber:     { hours: [0.3, 0.5], type: "body" },
    trunk_lid:                { hours: [0.5, 1.0], type: "body", notes: "Bolt-on, similar to hood" },
    deck_lid:                 { hours: [0.5, 1.0], type: "body" },
    tailgate:                 { hours: [0.8, 1.5], type: "body" },
    liftgate:                 { hours: [0.8, 1.5], type: "body" },
    liftgate_glass:           { hours: [0.5, 0.8], type: "glass" },
    rear_spoiler:             { hours: [0.3, 0.5], type: "body" },
    trunk_hinge:              { hours: [0.3, 0.3], type: "body", notes: "Per side" },
    trunk_latch:              { hours: [0.2, 0.3], type: "body" },
    trunk_weatherstrip:       { hours: [0.2, 0.3], type: "body" },

    // Lighting
    headlamp_assembly:        { hours: [0.3, 0.8], type: "body", notes: "Typical ~0.5 hrs. Aiming required post-install" },
    headlight_assembly:       { hours: [0.3, 0.8], type: "body" },
    fog_lamp:                 { hours: [0.2, 0.4], type: "body" },
    fog_light:                { hours: [0.2, 0.4], type: "body" },
    daytime_running_lamp:     { hours: [0.2, 0.3], type: "body" },
    turn_signal_lamp:         { hours: [0.1, 0.3], type: "body" },
    side_marker_lamp:         { hours: [0.1, 0.2], type: "body" },
    tail_lamp_assembly:       { hours: [0.3, 0.5], type: "body" },
    tail_light_assembly:      { hours: [0.3, 0.5], type: "body" },
    high_mount_stop_lamp:     { hours: [0.2, 0.3], type: "body" },
    third_brake_light:        { hours: [0.2, 0.3], type: "body" },
    license_plate_lamp:       { hours: [0.1, 0.2], type: "body" },

    // Exterior Trim & Misc
    body_side_molding:        { hours: [0.2, 0.5], type: "body" },
    wheel_arch_molding:       { hours: [0.2, 0.3], type: "body" },
    running_board:            { hours: [0.5, 1.0], type: "body" },
    side_step:                { hours: [0.5, 1.0], type: "body" },
    fuel_filler_door:         { hours: [0.2, 0.3], type: "body" },
    antenna:                  { hours: [0.2, 0.3], type: "body" },
    shark_fin_antenna:        { hours: [0.2, 0.3], type: "body" },
    cowl_panel:               { hours: [0.3, 0.5], type: "body" },
    wiper_arm:                { hours: [0.1, 0.2], type: "body" },
    wiper_linkage:            { hours: [0.5, 1.0], type: "mechanical" },

    // Structural Panels
    front_frame_rail:         { hours: [6.0, 12.0], type: "structural" },
    rear_frame_rail:          { hours: [5.0, 10.0], type: "structural" },
    rear_body_panel:          { hours: [3.0, 6.0], type: "structural", notes: "Panel behind rear bumper" },
    tail_panel:               { hours: [3.0, 6.0], type: "structural" },
    strut_tower_front:        { hours: [4.0, 8.0], type: "structural" },
    strut_tower_rear:         { hours: [4.0, 8.0], type: "structural" },
    front_floor_pan:          { hours: [4.0, 8.0], type: "structural" },
    rear_floor_pan:           { hours: [4.0, 8.0], type: "structural" },
    trunk_floor_pan:          { hours: [3.0, 6.0], type: "structural" },
    firewall:                 { hours: [8.0, 15.0], type: "structural" },
    dash_panel:               { hours: [8.0, 15.0], type: "structural" },
    front_crossmember:        { hours: [2.0, 4.0], type: "structural" },
    rear_crossmember:         { hours: [2.0, 4.0], type: "structural" },

    // Mechanical / Cooling / Drivetrain
    radiator:                 { hours: [1.0, 2.0], type: "mechanical", notes: "Drain, disconnect, R&R" },
    radiator_assembly:        { hours: [1.0, 2.0], type: "mechanical" },
    ac_condenser:             { hours: [1.0, 2.0], type: "mechanical", notes: "Requires A/C evacuate before R&R" },
    ac_compressor:            { hours: [1.5, 3.0], type: "mechanical" },
    ac_evaporator:            { hours: [4.0, 8.0], type: "mechanical", notes: "Requires dash removal on most vehicles" },
    intercooler:              { hours: [1.0, 2.0], type: "mechanical" },
    cooling_fan_assembly:     { hours: [0.5, 1.0], type: "mechanical" },
    cooling_fan:              { hours: [0.5, 1.0], type: "mechanical" },
    water_pump:               { hours: [2.0, 4.0], type: "mechanical" },
    thermostat:               { hours: [0.5, 1.5], type: "mechanical" },
    alternator:               { hours: [1.0, 2.0], type: "mechanical" },
    starter:                  { hours: [1.0, 2.5], type: "mechanical" },
    battery:                  { hours: [0.3, 0.5], type: "mechanical" },
    battery_tray:             { hours: [0.3, 0.5], type: "mechanical" },
    power_steering_pump:      { hours: [1.5, 3.0], type: "mechanical" },
    power_steering_rack:      { hours: [2.5, 4.0], type: "mechanical" },
    steering_column:          { hours: [2.0, 4.0], type: "mechanical" },
    exhaust_manifold:         { hours: [1.5, 3.0], type: "mechanical" },
    catalytic_converter:      { hours: [1.0, 2.0], type: "mechanical" },
    muffler:                  { hours: [0.5, 1.5], type: "mechanical" },
    engine_mount:             { hours: [1.0, 2.5], type: "mechanical" },
    transmission_mount:       { hours: [0.8, 1.5], type: "mechanical" },

    // Suspension & Steering
    strut_assembly_front:     { hours: [1.5, 2.5], type: "mechanical", notes: "Per side, includes spring" },
    strut_assembly_rear:      { hours: [1.0, 2.0], type: "mechanical" },
    shock_absorber:           { hours: [0.5, 1.5], type: "mechanical" },
    control_arm_upper:        { hours: [1.0, 2.0], type: "mechanical" },
    control_arm_lower:        { hours: [1.5, 2.5], type: "mechanical" },
    tie_rod_end:              { hours: [0.5, 1.0], type: "mechanical" },
    stabilizer_bar_link:      { hours: [0.3, 0.8], type: "mechanical" },
    wheel_hub_bearing:        { hours: [1.0, 2.5], type: "mechanical" },
    cv_axle:                  { hours: [1.0, 2.0], type: "mechanical" },
    knuckle:                  { hours: [1.5, 3.0], type: "mechanical" },
    ball_joint:               { hours: [1.0, 2.0], type: "mechanical" },
    coil_spring:              { hours: [1.0, 2.0], type: "mechanical" },

    // Wheels & Brakes
    wheel_rim:                { hours: [0.3, 0.5], type: "body" },
    tire:                     { hours: [0.3, 0.5], type: "body", notes: "Mount + balance" },
    wheel_tire:               { hours: [0.3, 0.5], type: "body" },
    brake_caliper:            { hours: [0.5, 1.0], type: "mechanical" },
    brake_rotor:              { hours: [0.3, 0.8], type: "mechanical" },
    brake_hose:               { hours: [0.5, 1.0], type: "mechanical" },

    // Electrical & ADAS
    airbag_module:            { hours: [0.5, 1.0], type: "diagnostic" },
    airbag_sensor:            { hours: [0.3, 0.8], type: "diagnostic" },
    seat_belt_pretensioner:   { hours: [0.5, 1.0], type: "diagnostic" },
    abs_sensor:               { hours: [0.3, 0.8], type: "diagnostic" },
    parking_sensor:           { hours: [0.3, 0.5], type: "diagnostic" },
    backup_camera:            { hours: [0.3, 0.8], type: "diagnostic" },
    front_camera:             { hours: [0.3, 0.5], type: "diagnostic", notes: "ADAS — requires calibration" },
    radar_sensor:             { hours: [0.3, 0.5], type: "diagnostic" },
    wiring_harness_front:     { hours: [3.0, 6.0], type: "diagnostic" },
    wiring_harness_rear:      { hours: [2.0, 4.0], type: "diagnostic" },

    // Truck/SUV Specific
    bed_side_panel:           { hours: [6.0, 10.0], type: "structural", notes: "Welded, similar to quarter panel" },
    bed_floor:                { hours: [4.0, 8.0], type: "structural" },
    bed_rail:                 { hours: [2.0, 4.0], type: "body" },
    tonneau_cover:            { hours: [0.3, 0.5], type: "body" },
    trailer_hitch:            { hours: [0.5, 1.5], type: "mechanical" },
    step_bumper:              { hours: [0.5, 1.0], type: "body" },
  },

  // ========== REFINISH (PAINT) HOURS — per panel, full refinish ==========
  refinish: {
    hood:                     { hours: [3.0, 3.0], materials_per_hr: 40 },
    front_fender:             { hours: [3.0, 3.5], materials_per_hr: 40, notes: "3.5 includes edging" },
    rear_fender:              { hours: [3.0, 3.5], materials_per_hr: 40 },
    front_bumper_cover:       { hours: [2.5, 3.5], materials_per_hr: 40 },
    front_bumper:             { hours: [2.5, 3.5], materials_per_hr: 40 },
    rear_bumper_cover:        { hours: [2.5, 3.5], materials_per_hr: 40 },
    rear_bumper:              { hours: [2.5, 3.5], materials_per_hr: 40 },
    front_door_shell:         { hours: [2.5, 3.0], materials_per_hr: 40 },
    rear_door_shell:          { hours: [2.5, 3.0], materials_per_hr: 40 },
    quarter_panel:            { hours: [3.0, 3.5], materials_per_hr: 40 },
    rear_quarter_panel:       { hours: [3.0, 3.5], materials_per_hr: 40 },
    trunk_lid:                { hours: [2.5, 3.0], materials_per_hr: 40 },
    deck_lid:                 { hours: [2.5, 3.0], materials_per_hr: 40 },
    tailgate:                 { hours: [2.5, 3.0], materials_per_hr: 40 },
    liftgate:                 { hours: [2.5, 3.0], materials_per_hr: 40 },
    roof_panel:               { hours: [3.0, 3.5], materials_per_hr: 40 },
    rocker_panel:             { hours: [1.5, 2.0], materials_per_hr: 40 },
    door_mirror:              { hours: [0.4, 0.6], materials_per_hr: 40 },
    outside_rearview_mirror:  { hours: [0.4, 0.6], materials_per_hr: 40 },
    side_view_mirror:         { hours: [0.4, 0.6], materials_per_hr: 40 },
    mirror_cover:             { hours: [0.4, 0.6], materials_per_hr: 40 },
    grille_surround:          { hours: [0.3, 0.5], materials_per_hr: 40 },
    fender_flare:             { hours: [0.5, 1.0], materials_per_hr: 40 },
    rear_spoiler:             { hours: [1.0, 1.5], materials_per_hr: 40 },
    body_side_molding:        { hours: [0.3, 0.5], materials_per_hr: 40 },
  },

  // ========== BLEND TIMES — % of full refinish ==========
  blend: {
    two_stage_pct: 0.50,   // CCC/Mitchell default: 50% of full refinish
    three_stage_pct: 0.70, // Tricoat: 70% of full refinish
  },

  // ========== PAINT OVERLAP DEDUCTIONS ==========
  overlap: {
    adjacent_panel_deduct: 0.4,     // hrs deducted for each additional adjacent panel
    non_adjacent_panel_deduct: 0.2, // hrs deducted for non-adjacent panels
  },

  // ========== REPAIR HOURS (dent/damage) ==========
  // Generic severity-based fallback (used when no per-component entry exists)
  repair: {
    light:    { hours: [0.5, 1.5], description: "Small dent, minor crease" },
    moderate: { hours: [1.5, 3.0], description: "Medium dent, single crease" },
    heavy:    { hours: [3.0, 6.0], description: "Large area, multiple creases" },
  },

  // Per-component repair hours — [minor, moderate, severe] in hours
  // Sources: CCC P-pages, Mitchell repair times, DEG inquiries, I-CAR
  repair_by_component: {
    front_bumper_cover:     { minor: [0.5, 1.0], moderate: [1.5, 2.5], severe: [3.0, 4.0] },
    rear_bumper_cover:      { minor: [0.5, 1.0], moderate: [1.5, 2.5], severe: [3.0, 4.0] },
    front_bumper:           { minor: [0.5, 1.0], moderate: [1.5, 2.5], severe: [3.0, 4.0] },
    rear_bumper:            { minor: [0.5, 1.0], moderate: [1.5, 2.5], severe: [3.0, 4.0] },
    hood:                   { minor: [0.5, 1.5], moderate: [2.0, 3.5], severe: [3.5, 5.0] },
    front_fender:           { minor: [0.5, 1.5], moderate: [2.0, 3.5], severe: [3.5, 5.0] },
    rear_fender:            { minor: [0.5, 1.5], moderate: [2.0, 3.5], severe: [3.5, 5.0] },
    front_door_shell:       { minor: [0.5, 1.5], moderate: [2.0, 3.0], severe: [3.0, 5.0] },
    rear_door_shell:        { minor: [0.5, 1.5], moderate: [2.0, 3.0], severe: [3.0, 5.0] },
    quarter_panel:          { minor: [1.0, 2.0], moderate: [3.0, 5.0], severe: [5.0, 8.0], notes: "Welded — repair preferred when possible" },
    rear_quarter_panel:     { minor: [1.0, 2.0], moderate: [3.0, 5.0], severe: [5.0, 8.0] },
    trunk_lid:              { minor: [0.5, 1.0], moderate: [1.5, 2.5], severe: [3.0, 4.0] },
    deck_lid:               { minor: [0.5, 1.0], moderate: [1.5, 2.5], severe: [3.0, 4.0] },
    tailgate:               { minor: [0.5, 1.0], moderate: [1.5, 3.0], severe: [3.0, 5.0] },
    roof_panel:             { minor: [1.0, 2.0], moderate: [2.5, 4.0], severe: [4.0, 6.0] },
    rocker_panel:           { minor: [1.0, 2.0], moderate: [2.5, 4.0], severe: [4.0, 6.0] },
    body_side_panel:        { minor: [1.0, 2.0], moderate: [3.0, 5.0], severe: [5.0, 8.0] },
    rear_body_panel:        { minor: [0.5, 1.5], moderate: [2.0, 3.5], severe: [3.5, 5.0] },
    door_skin:              { minor: [0.5, 1.5], moderate: [2.0, 3.0], severe: [3.0, 5.0] },
    a_pillar:               { minor: [1.0, 2.0], moderate: [3.0, 5.0], severe: [5.0, 8.0] },
    b_pillar:               { minor: [1.0, 2.0], moderate: [3.0, 5.0], severe: [5.0, 8.0] },
    radiator_support:       { minor: [1.0, 2.0], moderate: [2.0, 3.5], severe: [3.5, 5.0] },
    bed_side_panel:         { minor: [1.0, 2.0], moderate: [3.0, 5.0], severe: [5.0, 8.0] },
  },

  // ========== VEHICLE CLASS MULTIPLIERS ==========
  vehicle_class: {
    compact_sedan:    { multiplier: [0.85, 0.95] },
    midsize_sedan:    { multiplier: [1.0, 1.0] },   // baseline
    fullsize_sedan:   { multiplier: [1.05, 1.15] },
    compact_suv:      { multiplier: [1.05, 1.15] },
    midsize_suv:      { multiplier: [1.10, 1.25] },
    fullsize_suv:     { multiplier: [1.15, 1.35] },
    truck:            { multiplier: [1.15, 1.35] },
    luxury_sedan:     { multiplier: [1.10, 1.25] },
    sports_car:       { multiplier: [1.05, 1.20] },
    aluminum_body:    { multiplier: [1.50, 1.50], notes: "1.5x rate multiplier (F-150 etc)" },
  },

  // ========== SUBLET / FLAT-RATE SERVICES ==========
  sublet: {
    pre_repair_scan:          { cost: [30, 75] },
    post_repair_scan:         { cost: [30, 75] },
    pre_post_scan_combined:   { cost: [100, 150] },
    adas_calibration_basic:   { cost: [150, 300] },
    adas_calibration_standard: { cost: [300, 600] },
    adas_calibration_complex: { cost: [600, 1000] },
    wheel_alignment_2:        { cost: [60, 100] },
    wheel_alignment_4:        { cost: [100, 250] },
    frame_pull_setup:         { hours: 1.5 },
    frame_pull_typical:       { cost: [350, 400] },
    ac_evacuate_recharge:     { cost: [150, 250] },
  },

  // ========== PAINT MATERIALS RATE (per refinish hour) ==========
  paint_materials: {
    low: 32,
    mid: 40,
    high: 55,
    notes: "2024-2025 average: $40-55/refinish hour. Use mid for estimates.",
  },
};

// Helper: get labor hours for a component (normalized name lookup)
export function getLaborHours(componentName, operation = "rr") {
  const normalized = componentName.toLowerCase().replace(/[\s\-]+/g, "_").replace(/_?(lh|rh|lf|rf|lr|rr)$/i, "");
  const section = operation === "refinish" ? LABOR_TIMES.refinish : LABOR_TIMES.rr_body;
  if (section[normalized]) return section[normalized];
  // Try partial match
  for (const [key, val] of Object.entries(section)) {
    if (normalized.includes(key) || key.includes(normalized)) return val;
  }
  return null;
}

// Helper: get refinish hours for a component
export function getRefinishHours(componentName) {
  return getLaborHours(componentName, "refinish");
}

// Helper: get per-component repair hours by severity
// Returns { hours: [low, high] } or null
export function getRepairHours(componentName, severity = "moderate") {
  const normalized = componentName.toLowerCase().replace(/[\s\-]+/g, "_").replace(/_?(lh|rh|lf|rf|lr|rr)$/i, "");
  const sev = severity.toLowerCase();
  const sevKey = sev === "minor" ? "minor" : sev === "severe" ? "severe" : "moderate";
  const section = LABOR_TIMES.repair_by_component;
  // Exact match
  if (section[normalized]?.[sevKey]) return { hours: section[normalized][sevKey], type: section[normalized].notes?.includes("Welded") ? "structural" : "body" };
  // Partial match
  for (const [key, val] of Object.entries(section)) {
    if ((normalized.includes(key) || key.includes(normalized)) && val[sevKey]) {
      return { hours: val[sevKey], type: val.notes?.includes("Welded") ? "structural" : "body" };
    }
  }
  return null;
}

// Helper: get vehicle class multiplier
export function getClassMultiplier(vehicleClass) {
  const cls = vehicleClass?.toLowerCase().replace(/[\s\-]+/g, "_");
  return LABOR_TIMES.vehicle_class[cls]?.multiplier || [1.0, 1.0];
}

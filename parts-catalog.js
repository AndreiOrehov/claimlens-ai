// Standardized auto body parts catalog — Gemini must pick from these names
export const PARTS_CATALOG = {
  front_end: [
    "front_bumper", "front_bumper_cover", "front_bumper_reinforcement", "bumper_absorber",
    "bumper_bracket", "bumper_mount", "bumper_valance", "front_bumper_molding", "lower_valance_panel", "air_dam",
    "radiator_support", "core_support", "upper_tie_bar", "front_panel", "front_apron",
    "hood", "hood_hinge", "hood_latch", "hood_lock_support", "hood_latch_support",
    "hood_striker", "hood_insulator", "hood_pad", "hood_molding", "hood_trim",
    "grille", "grille_assembly", "grille_molding", "grille_surround", "emblem", "badge",
  ],
  fenders_wheel_area: [
    "front_fender", "rear_fender", "fender_extension", "fender_flare", "fender_molding",
    "inner_fender", "fender_apron", "fender_liner", "inner_fender_liner", "wheelhouse_liner",
    "splash_shield", "splash_guard", "mud_flap", "mud_guard",
  ],
  body_side_pillars: [
    "rocker_panel", "outer_rocker_panel", "inner_rocker_panel", "dog_leg",
    "quarter_panel", "rear_quarter_panel", "lower_quarter_patch_panel",
    "body_side_panel", "side_body_panel",
    "a_pillar", "b_pillar", "c_pillar", "d_pillar",
    "roof_side_rail", "roof_side_panel", "drip_rail", "roof_drip_molding", "side_sill_garnish",
  ],
  doors: [
    "front_door_shell", "front_door_panel", "rear_door_shell", "rear_door_panel",
    "sliding_door", "door_outer_panel", "door_inner_panel", "door_skin", "outer_door_skin",
    "door_handle", "outer_door_handle", "door_handle_bezel",
    "door_mirror", "outside_rearview_mirror", "side_view_mirror", "mirror_cover", "mirror_cap",
    "door_molding", "door_belt_molding", "belt_molding", "beltline_molding",
    "door_weatherstrip", "door_seal", "weatherstrip",
    "door_check", "door_check_strap", "door_hinge_upper", "door_hinge_lower",
    "door_latch", "door_lock_actuator", "door_striker",
    "door_trim_panel", "interior_door_panel", "door_step_plate", "scuff_plate",
  ],
  glass_glazing: [
    "windshield", "front_windshield", "front_glass",
    "rear_window", "back_glass", "backlite",
    "side_window_glass", "door_glass", "quarter_glass", "quarter_window",
    "vent_glass", "vent_window", "sunroof_glass", "moonroof_glass", "sunroof_panel",
    "roof_panel_with_sunroof_opening",
    "windshield_molding", "back_glass_molding", "window_molding", "window_weatherstrip",
    "window_regulator", "manual_window_regulator", "power_window_regulator", "window_motor",
  ],
  roof_upper_body: [
    "roof_panel", "roof_skin", "roof_bow", "roof_reinforcement",
    "roof_rack", "roof_molding", "sunroof_frame", "sunroof_wind_deflector",
  ],
  rear_end: [
    "rear_bumper", "rear_bumper_cover", "rear_bumper_reinforcement", "rear_bumper_absorber",
    "rear_bumper_bracket", "rear_bumper_stay", "rear_bumper_molding", "rear_valance_panel", "lower_rear_valance",
    "rear_body_panel", "tail_panel", "rear_crossmember", "rear_body_crossmember",
    "trunk_lid", "trunk_lid_panel", "deck_lid",
    "tailgate", "liftgate", "liftgate_glass", "tailgate_glass",
    "tailgate_spoiler", "rear_spoiler",
    "trunk_hinge", "trunk_torsion_bar", "trunk_latch", "trunk_lock_cylinder",
    "trunk_weatherstrip", "trunk_seal",
  ],
  lighting: [
    "headlamp_assembly", "headlight_assembly", "headlamp_housing", "headlamp_bracket",
    "fog_lamp", "fog_light", "daytime_running_lamp", "drl",
    "turn_signal_lamp", "indicator_lamp", "side_marker_lamp",
    "tail_lamp_assembly", "tail_light_assembly",
    "stop_lamp", "brake_light", "high_mount_stop_lamp", "third_brake_light",
    "reverse_lamp", "backup_lamp",
    "license_plate_lamp", "license_plate_light",
    "reflector", "rear_reflector", "side_reflector",
  ],
  exterior_trim_misc: [
    "body_side_molding", "wheel_arch_molding", "wheel_opening_molding", "door_edge_molding",
    "bumper_protector", "bumper_guard",
    "side_step", "running_board", "step_bar", "nerf_bar",
    "splash_guard", "stone_guard",
    "fuel_filler_door", "gas_door", "fuel_filler_neck_housing", "fuel_pocket",
    "antenna", "roof_antenna", "fender_antenna", "shark_fin_antenna",
    "cowl_panel", "cowl_top_panel", "cowl_grille", "cowl_vent_grille",
    "wiper_arm", "wiper_blade", "wiper_linkage", "wiper_transmission", "cowl_side_panel",
  ],
  structural_panels: [
    "front_frame_rail", "front_side_member", "rear_frame_rail", "rear_side_member",
    "front_floor_pan", "rear_floor_pan", "trunk_floor_pan", "spare_tire_well",
    "front_apron_panel", "front_side_member_extension",
    "rear_wheelhouse", "inner_rear_wheelhouse", "front_wheelhouse", "inner_front_wheelhouse",
    "inner_fender_house",
    "front_crossmember", "center_crossmember", "rear_crossmember_structural",
    "strut_tower_front", "strut_tower_rear", "shock_tower_front", "shock_tower_rear",
    "firewall", "dash_panel", "dash_panel_reinforcement",
  ],
};

// Flat list of all part names for quick lookup
export const ALL_PARTS = Object.values(PARTS_CATALOG).flat();

// Build compact string for prompt injection
export const PARTS_CATALOG_PROMPT = Object.entries(PARTS_CATALOG)
  .map(([cat, parts]) => `${cat}: ${parts.join(", ")}`)
  .join("\n");

P = "person"
SHEETS = {
    "ww1_inf": ("ww1", P, 1.75, ["uk_soldier_walk", "uk_soldier_stand", "fr_poilu_walk", "fr_poilu_stand", "de_soldier_walk", "de_pickelhaube_stand", "us_doughboy_walk", "ru_soldier_stand", "uk_officer_stand", "de_officer_binoculars"]),
    "ww1_act": ("ww1", P, 1.75, ["soldier_charge", "soldier_kneel_aim", "soldier_throw_grenade", "soldier_gasmask", "soldier_prone_aim", "soldier_wounded_lying", "soldier_sit_tired", "soldier_dig", "medic_walk", "soldier_surrender"]),
    "ww2_inf": ("ww2", P, 1.75, ["us_gi_walk", "us_gi_stand", "uk_soldier_walk", "su_soldier_ppsh_walk", "su_soldier_winter_stand", "de_soldier_walk", "de_soldier_mp40_stand", "jp_soldier_walk", "jp_soldier_stand", "fr_soldier_stand"]),
    "ww2_act": ("ww2", P, 1.75, ["soldier_charge", "soldier_kneel_fire", "soldier_throw_grenade", "soldier_prone_aim", "radio_operator_kneel", "medic_kneel", "officer_binoculars", "soldier_carry_mg", "soldier_wounded_lying", "soldier_surrender"]),
    "civ_1910_40": ("ww", P, 1.7, ["man_suit_walk", "worker_flatcap_walk", "woman_coat_walk", "woman_1910_stand", "boy_stand", "girl_stand", "refugee_man_bundle", "refugee_woman_suitcase", "nurse_stand", "factory_woman_wrench"]),
    "ww1_veh": ("ww1", "vehicle", 2.5, ["mark4_tank", "renault_ft", "ambulance_model_t", "supply_truck", "field_gun", "motorcycle_sidecar"]),
    "ww2_tank": ("ww2", "vehicle", 2.8, ["sherman", "t34", "panzer4", "tiger1", "chi_ha", "halftrack_251"]),
    "ww2_veh": ("ww2", "vehicle", 2.2, ["jeep", "kubelwagen", "gmc_truck", "opel_blitz", "de_motorcycle_sidecar", "katyusha"]),
    "ww1_air": ("ww1", "aircraft", 3.0, ["sopwith_camel", "fokker_dr1", "spad13", "zeppelin", "observation_balloon", "gotha_bomber"]),
    "ww2_air": ("ww2", "aircraft", 3.5, ["spitfire", "bf109", "p51", "zero", "b17", "stuka", "il2", "ju52"]),
    "navy": ("ww", "ship", 30.0, ["ww1_dreadnought", "ww1_uboat", "ww2_battleship", "ww2_carrier", "ww2_destroyer", "higgins_boat"]),
    "heavy_wpn": ("ww", "weapon", 2.0, ["ww1_howitzer", "flak88", "at_gun", "vickers_mg", "mg42", "mortar", "searchlight", "aa_quad_mg"]),
    "props": ("ww", "prop", 0.8, ["sandbags", "barbed_wire_coil", "czech_hedgehog", "ammo_crate", "oil_drum", "helmet_ground", "rifle", "stick_grenade", "gas_mask", "field_telephone", "backpack_radio", "signpost", "stretcher", "jerrycan", "barrel", "shells_row", "crate_stack", "field_kitchen_pot"]),
    "set_pieces": ("ww", "structure", 3.0, ["pillbox", "sandbag_mg_nest", "watchtower", "army_tent", "hospital_tent", "wire_fence", "dugout_entrance", "trench_wall"]),
    "buildings": ("ww", "building", 10.0, ["townhouse", "townhouse_ruined", "church_ruined", "farmhouse", "factory", "wall_ruin"]),
    "nature": ("ww", "nature", 5.0, ["tree_shattered", "tree_burnt", "tree_dead", "poplar", "pine", "pine_snow", "palm", "bush_green", "bush_dry", "rubble", "crater", "rock"]),
}
HEIGHT_FIX = {
    "ww1_act/soldier_prone_aim": 0.5, "ww1_act/soldier_wounded_lying": 0.6, "ww1_act/soldier_sit_tired": 1.0, "ww1_act/soldier_kneel_aim": 1.2,
    "ww2_act/soldier_prone_aim": 0.5, "ww2_act/soldier_wounded_lying": 0.6, "ww2_act/soldier_kneel_fire": 1.2, "ww2_act/radio_operator_kneel": 1.3, "ww2_act/medic_kneel": 1.2,
    "civ_1910_40/boy_stand": 1.3, "civ_1910_40/girl_stand": 1.25,
    "ww1_veh/renault_ft": 2.1, "ww1_veh/ambulance_model_t": 2.2, "ww1_veh/field_gun": 1.6, "ww1_veh/motorcycle_sidecar": 1.0,
    "ww2_veh/jeep": 1.8, "ww2_veh/kubelwagen": 1.6, "ww2_veh/gmc_truck": 2.9, "ww2_veh/opel_blitz": 2.8, "ww2_veh/de_motorcycle_sidecar": 1.0, "ww2_veh/katyusha": 3.0,
    "ww2_tank/chi_ha": 2.2, "ww2_tank/halftrack_251": 2.0,
    "ww1_air/zeppelin": 30.0, "ww1_air/observation_balloon": 25.0, "ww2_air/b17": 5.8, "ww2_air/ju52": 4.5,
    "navy/higgins_boat": 3.0, "navy/ww1_uboat": 8.0,
    "heavy_wpn/ww1_howitzer": 2.5, "heavy_wpn/flak88": 2.4, "heavy_wpn/at_gun": 1.4, "heavy_wpn/vickers_mg": 0.8, "heavy_wpn/mg42": 0.7, "heavy_wpn/mortar": 1.0, "heavy_wpn/searchlight": 2.0, "heavy_wpn/aa_quad_mg": 2.0,
    "props/sandbags": 0.9, "props/barbed_wire_coil": 0.8, "props/czech_hedgehog": 1.4, "props/ammo_crate": 0.4, "props/oil_drum": 0.9, "props/helmet_ground": 0.2, "props/rifle": 0.3, "props/stick_grenade": 0.1, "props/gas_mask": 0.25, "props/field_telephone": 0.25, "props/backpack_radio": 0.5, "props/signpost": 2.0, "props/stretcher": 0.3, "props/jerrycan": 0.45, "props/barrel": 0.9, "props/shells_row": 0.6, "props/crate_stack": 1.2, "props/field_kitchen_pot": 1.0,
    "set_pieces/pillbox": 2.5, "set_pieces/sandbag_mg_nest": 1.3, "set_pieces/watchtower": 7.0, "set_pieces/army_tent": 2.5, "set_pieces/hospital_tent": 3.0, "set_pieces/wire_fence": 1.5, "set_pieces/dugout_entrance": 2.2, "set_pieces/trench_wall": 2.2,
    "buildings/church_ruined": 20.0, "buildings/factory": 18.0, "buildings/wall_ruin": 3.0, "buildings/farmhouse": 7.0,
    "nature/tree_shattered": 4.0, "nature/poplar": 14.0, "nature/pine": 10.0, "nature/pine_snow": 10.0, "nature/palm": 9.0, "nature/bush_green": 1.2, "nature/bush_dry": 1.0, "nature/rubble": 1.0, "nature/crater": 0.6, "nature/rock": 1.2,
}
BACKGROUNDS = {
    "bg_ww1_nomansland": "ww1", "bg_ww1_trench": "ww1", "bg_ww2_ruins": "ww2", "bg_ww2_beach": "ww2", "bg_ww2_snow": "ww2",
    "bg_ww2_jungle": "ww2", "bg_ww2_desert": "ww2", "bg_ww2_airfield": "ww2", "bg_ww2_blitz": "ww2", "bg_home_front": "ww",
}
SPLIT_NAMES = {
    "props": ["sandbags", "barbed_wire_coil", "czech_hedgehog", "ammo_crate", "oil_drum", "helmet_ground", "rifle", "stick_grenade", "gas_mask", "field_telephone", "backpack_radio", "signpost", "stretcher", "jerrycan", "barrel", "shell", "shell_b", "shell_c", "crate_stack", "field_kitchen_pot"],
    "ww2_tank": ["sherman", "t34", "panzer4", "tiger1_clipped", "chi_ha", "panzer4_b", "tiger1", "chi_ha_b", "halftrack_251"],
}
HEIGHT_FIX.update({"props/shell": 0.4, "props/shell_b": 0.4, "props/shell_c": 0.4, "ww2_tank/chi_ha_b": 2.2})

from beats_lib import B, C, ALIAS

ALIAS.update({
    "frank": "auto_261125_09cb9f_10__frank_james_duster",
    "bill": "auto_261125_09cb9f_10__bloody_bill_anderson_mounted",
    "derail": "auto_261125_09cb9f_10__derailed_express_car_tilted",
    "news": "auto_261125_09cb9f_10__old_missouri_newspaper",
    "chair": "auto_261125_09cb9f_10__wooden_parlor_chair_upright",
    "chair_down": "auto_261125_09cb9f_10__wooden_parlor_chair_toppled",
    "loco": "west_trains__1870s_american_steam_locomotive_cowcatcher",
    "pcar": "west_trains__1870s_passenger_railroad_car",
    "cav_ride": "west_mounted__us_cavalry_trooper_galloping_horse",
    "cav": "west_military_native__us_cavalry_trooper_1870s_blue",
    "cav_fire": "west_military_native__us_cavalry_soldier_foot_firing",
    "outlaw_ride": "west_mounted__outlaw_galloping_black_horse_firing",
    "outlaw_bandana": "west_outlaws__wild_west_outlaw_bandana_over",
    "outlaw_winch": "west_outlaws__wild_west_outlaw_standing_winchester",
    "outlaw_dead": "west_outlaws_act__wild_west_outlaw_lying_dead",
    "outlaw_tied": "west_outlaws_act__wild_west_outlaw_hands_tied",
    "outlaw_wounded": "west_outlaws_act__wounded_wild_west_outlaw_sitting",
    "outlaw_surr": "west_outlaws_act__wild_west_outlaw_raising_hands",
    "outlaw_count": "west_outlaws__wild_west_outlaw_counting_stolen",
    "outlaw_young": "west_outlaws__young_ragged_wild_west_outlaw",
    "pinkerton": "west_law__pinkerton_detective_bowler_hat_suit",
    "marshal": "west_law__us_marshal_long_coat_badge",
    "sheriff_aim": "west_law__wild_west_sheriff_aiming_revolver",
    "deputy": "west_law__wild_west_deputy_shotgun",
    "judge": "west_law__wild_west_judge_black_suit",
    "banker": "west_town__wild_west_banker_suit_pocket",
    "doctor": "west_town__wild_west_town_doctor_black",
    "prospector": "west_frontier__gold_prospector_miner_pickaxe_pan",
    "crowd": "west_frontier2__wild_west_town_crowd_five",
    "engineer": "west_frontier2__wild_west_train_engineer_cap",
    "undertaker": "west_frontier2__wild_west_undertaker_measuring_tape",
    "horse_black": "west_animals__saddled_black_horse_standing",
    "horse_brown": "west_animals__saddled_brown_horse_standing",
    "church": "west_buildings__wild_west_church_bell_tower",
    "grave": "west_props__wooden_grave_cross",
    "bible": "west_props__old_bible",
    "money": "west_props__money_sack_dollar_sign",
    "dollars": "west_props__stack_dollar_bills",
    "safe": "west_props__bank_safe",
    "poster": "west_props__blank_wanted_poster_nailed_board",
    "revolver": "west_guns__colt_single_action_revolver",
    "gunbelt": "west_guns__gun_belt_holster_bullets",
    "noose": "west_props__noose_rope_hanging",
    "tree": "west_nature__cottonwood_tree",
    "lantern": "west_guns__lantern",
    "wagon": "west_vehicles__covered_wagon_prairie_schooner_pulled",
    "plow": "west_frontier2__frontier_farmer_plowing_behind_horse",
    "hay": "west_props2__hay_bale",
    "telegraph": "west_props2__telegraph_pole",
    "bartender": "west_town__wild_west_bartender_polishing_glass",
    "family": "west_frontier2__frontier_settler_family_three_walking",
    "girl": "west_frontier__frontier_girl_plain_dress_bonnet",
    "boy_ragged": "west_frontier__ragged_frontier_boy_barefoot",
    "shop": "west_town__wild_west_shopkeeper_apron_sleeve",
})

J = "jesse_adult_"
Y = "jesse_young_"
O = "jesse_old_"

B(1, None, "bg_missouri_forest_trail", [C(Y + "guerrilla_ride", "cl", "r", mv="r"), C("bill", "r", "r", mv="r")], f="wide", label=("JESSE JAMES", "1847 - 1882", 0, "Jesse"), focus="Jesse", smoke=True)
B(1, "killers", "bg_missouri_forest_trail", [C("bill", "c", "l")], f="close", cam="push", tag=("AGE 16", "", "sixteen"))
B(2, None, "bg_west_bank_interior", [C(J + "aim", "cl", "r"), C("banker", "cr", "l")], f="medium", flash="banks", shake="banks")
B(2, "trains", "bg_west_railroad", [C("derail", "c", "r"), C(J + "walk", "cr", "l")], f="wide", smoke=True)
B(2, "sixteen", "bg_west_railroad", [C("outlaw_ride", "cl", "r", mv="r"), C(J + "ride", "c", "r", mv="r")], f="wide", tag=("16 YEARS", "1866 - 1882", "sixteen"))
B(3, None, "bg_west_town_street", [C("news", "c")], kind="paper", paper=[("JESSE JAMES", "h", "newspapers"), ("A HERO?", "l", "hero")])
B(4, None, "bg_st_joseph_parlor_interior", [C(O + "reach", "c", "l")], f="medium", cam="push", dark=0.3)
B(5, None, "bg_st_joseph_parlor_interior", [C("bob_ford", "cl", "r"), C(O + "stand", "cr", "r")], f="medium", focus="house", dark=0.35, sub=0)
B(6, None, "bg_st_joseph_parlor_interior", [], kind="rew", f="wide", cam="pull", dark=0.4)
B(7, None, "bg_jj_farm", [C("jesse_baby", "c", "r")], kind="scene", f="close", warm=True)
B(8, None, "bg_jj_farm", [C("jesse_baby", "c")], f="close", plate=("NO GUNS", "", None, "guns"))
B(9, None, "bg_jj_farm", [C("jesse_baby", "c")], f="close", plate=("NO HORSE", "", None, "horse"))
B(10, None, "bg_jj_farm", [C("jesse_baby", "c")], f="close", plate=("NO PRICE ON YOUR HEAD", "", None, "price"))
B(11, None, "bg_jj_farm", [C("jesse_baby", "c")], f="wide", cam="pull", dark=0.2)

B(13, None, "bg_jj_farm", [C("zerelda_young", "c", "r")], f="wide", tag=("SEPT 5, 1847", "Clay County, Missouri"), warm=True)
B(14, None, "bg_jj_farm", [C(Y + "boy", "c", "r")], f="medium", label=("JESSE WOODSON JAMES", "born 1847", 0, "Jesse"), focus="Jesse")
B(15, None, "bg_jj_farm", [C(Y + "boy_run", "cl", "r", mv="r")], f="wide", plate=("CLAY COUNTY", "Missouri", None, "Clay"))
B(16, None, "bg_jj_farm", [C("robert_preacher", "c", "r")], f="medium", label=("ROBERT JAMES", "Baptist preacher", 0, "Robert"))
B(17, None, "bg_west_town_street", [C("church", "c"), C("robert_preacher", "cl", "r")], f="wide")
B(18, None, "bg_west_town_street", [C("robert_preacher", "c", "r"), C("bible", "cr", place="near")], f="medium", plate=("A COLLEGE", "William Jewell, 1849", None, "college"))
B(19, None, "bg_jj_farm", [C("bible", "c")], f="close", focus=True)
B(21, None, "bg_jj_farm", [C("zerelda_young", "c", "r")], f="medium", label=("ZERELDA", "your mother", 0, "Zerelda"), focus="Zerelda")
B(22, None, "bg_jj_farm", [C("boy_ragged", "cr", "l"), C(Y + "boy", "cl", "r")], f="medium", label=("FRANK", "4 years older", 0, "Frank"))
B(24, None, "bg_jj_farm", [C("boy_ragged", "c", "r"), C(Y + "boy_run", "cl", "r", mv="r")], f="wide")
B(25, None, "bg_jj_farm", [C(Y + "boy", "c", "l")], f="close")
B(26, None, "bg_jj_farm", [C("plow", "c", "r", mv="r")], f="wide", plate=("HEMP & TOBACCO", "", None, "hemp"))
B(27, None, "bg_jj_farm", [C("plow", "c", "r", mv="r")], f="wide", cam="pull", dark=0.25, plate=("SLAVE-OWNING FARM", "6 enslaved people", None, "enslaved"))
B(28, None, "bg_west_gold_camp", [C("robert_preacher", "cl", "r", mv="r")], f="wide", tag=("1850", "Jesse is 3"), plate=("CALIFORNIA", "Gold Rush", None, "California"))
B(29, None, "bg_west_gold_camp", [C("robert_preacher", "cl", "r"), C("prospector", "cr", "l", crowd=3)], f="medium")
B(30, None, "bg_jj_farm", [C(Y + "boy", "c", "r")], f="wide", cam="pull", dark=0.3)
B(31, None, "bg_west_cemetery", [C("grave", "c")], f="medium", cam="pull", dark=0.3, cool=True)
B(32, None, "bg_jj_farm", [C("zerelda_young", "c", "r")], f="medium")
B(34, None, "bg_jj_farm", [C("reuben_samuel", "cr", "l"), C("zerelda_young", "cl", "r")], f="medium", label=("REUBEN SAMUEL", "stepfather, doctor", 0, "Reuben"))
B(36, None, "bg_jj_farm", [C(Y + "boy_run", "cl", "r", mv="r"), C("boy_ragged", "cr", "l")], f="wide", warm=True)
B(37, None, "bg_west_prairie", [C("plow", "cr", "r")], f="wide", plate=("MISSOURI", "a border state", None, "Missouri"))
B(38, None, "bg_west_town_street", [C("crowd", "cl", "r"), C("cav", "cr", "l")], f="wide")
B(40, None, "bg_jj_farm", [C("cav_ride", "r", "l", mv="l")], f="wide", tag=("1861", "Civil War"), smoke=True, shake="war")

B(41, None, "bg_missouri_forest_trail", [C("frank_teen", "c", "r")], f="medium", label=("FRANK", "Confederate", 0, "Frank"))
B(42, None, "bg_missouri_forest_trail", [C("frank_teen", "cl", "r", mv="r"), C("outlaw_ride", "cr", "r", mv="r")], f="wide", plate=("QUANTRILL'S RAIDERS", "", None, "Quantrill"))
B(43, None, "bg_jj_farm", [C(Y + "teen_hoe", "c", "r")], f="medium", tag=("AGE 14", "1861"))
B(45, None, "bg_jj_farm", [C(Y + "teen_hoe", "cl", "r")], f="wide")
B(46, None, "bg_jj_farm", [C("union_militia", "cr", "l", crowd=3)], f="wide", tag=("MAY 1863", ""))
B(48, None, "bg_jj_farm", [C("union_militia", "cr", "l"), C("zerelda_young", "cl", "r")], f="medium")
B(49, None, "bg_jj_farm", [C("union_militia", "cr", "l"), C("reuben_samuel", "cl", "r")], f="medium", focus="stepfather")
B(50, None, "bg_jj_farm", [C("union_militia", "c", "l")], f="close", dark=0.35, focus="rope")
B(51, None, "bg_jj_farm", [C("zerelda_young", "c", "r")], f="medium", cam="pull", dark=0.45, shake="hang")
B(54, None, "bg_jj_farm", [C("reuben_samuel", "c", "r")], f="medium", dark=0.25)
B(56, None, "bg_jj_farm", [C(Y + "teen_hoe", "cl", "r"), C("union_militia", "cr", "l")], f="medium")
B(57, None, "bg_jj_farm", [C(Y + "teen_kneel", "c", "r")], f="close", flash="whip", shake="whip", dark=0.3)
B(58, None, "bg_jj_farm", [C(Y + "teen_kneel", "c", "r")], kind="scene", f="close", tag=("AGE 15", ""))
B(59, None, "bg_missouri_forest_trail", [C(Y + "guerrilla_ride", "c", "r", mv="r")], f="wide", tag=("1864", "Age 16"))
B(62, None, "bg_missouri_forest_trail", [C("bill", "cr", "l"), C(Y + "guerrilla", "cl", "r")], f="medium", label=("BLOODY BILL", "Anderson", 0, "Bloody"), focus="Bloody")
B(63, None, "bg_missouri_forest_trail", [C("bill", "c", "l")], f="close", dark=0.2)
B(64, None, "bg_missouri_forest_trail", [C(Y + "wounded", "c")], f="medium", flash="bullet", shake="bullet")
B(65, None, "bg_missouri_forest_trail", [C(Y + "guerrilla", "c", "r")], f="medium")
B(66, None, "bg_west_railroad", [C("loco", "c", "l")], f="wide", tag=("SEPT 27, 1864", ""))
B(67, None, "bg_west_railroad", [C("loco", "cl", "l"), C("pcar", "r", "l")], f="wide", plate=("CENTRALIA", "Missouri", None, "Centralia"))
B(68, None, "bg_west_railroad", [C("bill", "c", "l"), C("loco", "r", "l")], f="wide", smoke=True)
B(69, None, "bg_west_railroad", [C("cav", "c", "r", crowd=4)], f="wide")
B(70, None, "bg_west_railroad", [C("outlaw_surr", "c", "r")], f="close")
B(71, None, "bg_west_railroad", [C(Y + "guerrilla", "cl", "r"), C("outlaw_surr", "cr", "l", crowd=3)], f="wide", dark=0.25)
B(73, None, "bg_west_railroad", [C("bill", "cl", "r")], f="wide", cam="pull", dark=0.45, flash="shoot", shake="shoot", smoke=True)
B(74, None, "bg_west_prairie", [C("cav_ride", "cr", "l", mv="l")], f="wide")
B(75, None, "bg_west_prairie", [C("outlaw_dead", "c")], f="wide", cam="pull", dark=0.4, smoke=True)
B(76, None, "bg_west_prairie", [C(Y + "guerrilla", "cl", "r"), C("frank_teen", "cr", "l")], f="medium")
B(77, None, "bg_west_prairie", [C(Y + "guerrilla", "c", "r")], f="close", tag=("AGE 17", ""))
B(78, None, "bg_missouri_forest_trail", [C("bill", "c", "l")], f="wide", cam="pull", dark=0.35, flash="killed")
B(79, None, "bg_west_prairie", [C("cav", "c", "r")], f="wide", tag=("SPRING 1865", "war ends"))
B(80, None, "bg_west_prairie", [C(Y + "guerrilla_ride", "cl", "r", mv="r")], f="wide")
B(81, None, "bg_west_prairie", [C(Y + "wounded", "cl"), C("cav_fire", "cr", "l")], f="medium", flash="shoots", shake="shoots")
B(82, None, "bg_west_prairie", [C(Y + "wounded", "c")], f="close", plate=("HIS STORY", "historians doubt it", None, "story"))
B(84, None, "bg_west_cabin_interior", [C(Y + "wounded", "c")], f="medium", dark=0.2)
B(85, None, "bg_west_cabin_interior", [C(Y + "wounded", "cl"), C("zee", "cr", "l")], f="medium", warm=True)
B(87, None, "bg_west_cabin_interior", [C("zee", "c", "l")], f="medium", label=("ZEE", "Zerelda Mimms, cousin", 0, "Zerelda"), focus="Zerelda", warm=True)
B(89, None, "bg_west_cabin_interior", [C("zee", "c", "l")], f="close", warm=True)

B(90, None, "bg_west_town_street", [C(J + "stand", "c", "r")], f="wide", tag=("1865", "Age 18"))
B(91, None, "bg_west_town_street", [C(J + "bust", "c")], kind="bust", f="close")
B(92, None, "bg_west_town_street", [C("crowd", "cl", "r"), C("judge", "cr", "l")], f="medium", plate=("NO VOTE", "no preaching, no law", None, "vote"))
B(95, None, "bg_west_bank_interior", [C("banker", "c", "r"), C("safe", "cr")], f="medium")
B(96, None, "bg_snowy_liberty_bank_street", [C("crowd", "cr", "l")], f="wide", tag=("FEB 1866", ""), cool=True)
B(97, None, "bg_snowy_liberty_bank_street", [C("outlaw_ride", "cl", "r", mv="r", crowd=3)], f="wide", plate=("LIBERTY", "Missouri", None, "Liberty"), cool=True)
B(99, None, "bg_snowy_liberty_bank_street", [C("outlaw_count", "c", "r")], f="medium", cool=True)
B(100, None, "bg_snowy_liberty_bank_street", [C(J + "bust", "c")], kind="bust", f="close", cool=True)
B(102, None, "bg_snowy_liberty_bank_street", [C(J + "ride", "c", "r", mv="r")], f="wide", cool=True)
B(103, None, "bg_west_cabin_interior", [C(Y + "wounded", "c")], f="medium")
B(104, None, "bg_west_town_street", [C(J + "walk", "cl", "r", mv="r")], f="wide")
B(105, None, "bg_west_town_street", [C(J + "walk", "cl", "r", mv="r"), C("frank", "c", "r", mv="r")], f="wide", tag=("DEC 1869", "Gallatin, Missouri"))
B(107, None, "bg_west_bank_interior", [C(J + "walk", "cl", "r", mv="r"), C("banker", "cr", "l")], f="wide")
B(108, None, "bg_west_bank_interior", [C("banker", "c", "l")], f="close", focus="cashier")
B(109, None, "bg_west_bank_interior", [C(J + "bust", "c")], kind="bust", f="close", dark=0.2)
B(110, None, "bg_west_bank_interior", [C("banker", "c", "l")], f="close", plate=("JOHN SHEETS", "wrong man", None, "isn't"))
B(111, None, "bg_west_bank_interior", [C(J + "aim", "cl", "r"), C("banker", "cr", "l")], f="medium", flash="shoot", shake="shoot", dark=0.3)
B(112, None, "bg_west_town_street", [C("horse_black", "c", "r")], f="medium", shake="panics")
B(114, None, "bg_west_town_street", [C("horse_black", "cr", "l", mv="l")], f="wide", smoke=True)
B(115, None, "bg_west_town_street", [C("frank", "c", "r", mv="r")], f="wide")
B(116, None, "bg_west_town_street", [C("horse_black", "c", "l")], f="close", focus="yours")
B(117, None, "bg_west_town_street", [C("horse_black", "cl", "r"), C("sheriff_aim", "cr", "l")], f="medium")
B(118, None, "bg_west_town_street", [C("news", "c")], kind="paper", paper=[("WANTED", "h", "name"), ("JESSE JAMES", "l", "newspaper")])
B(119, None, "bg_west_town_street", [C("edwards_editor", "c", "r")], f="medium", label=("JOHN NEWMAN EDWARDS", "Kansas City Times", 0, (120, "John")), focus=(120, "John"))
B(121, None, "bg_west_town_street", [C("edwards_editor", "cl", "r"), C(J + "stand", "cr", "l")], f="medium")
B(122, None, "bg_west_town_street", [C(J + "stand", "c", "r")], f="close", plate=("ROBIN HOOD?", "", None, "Robin"), warm=True)
B(123, None, "bg_west_bank_interior", [C("money", "c")], f="close")
B(124, None, "bg_jj_farm", [C("family", "c", "r")], f="medium")
B(125, None, "bg_west_town_street", [C(J + "bust", "c")], kind="bust", f="close")
B(126, None, "bg_west_town_street", [C("outlaw_count", "c", "r")], f="medium", plate=("NO EVIDENCE", "he gave to the poor", None, "evidence"))
B(127, None, "bg_west_town_street", [C("crowd", "c", "r")], f="medium")
B(128, None, "bg_west_cabin_interior", [C(J + "stand", "c", "r"), C("news", "cr", place="table")], f="medium", warm=True)
B(129, None, "bg_west_railroad", [C("outlaw_bandana", "cl", "r")], f="wide", tag=("JULY 1873", "Adair, Iowa"))
B(131, None, "bg_west_railroad", [C(J + "walk", "cl", "r"), C("outlaw_bandana", "c", "r")], f="medium", plate=("ADAIR", "Iowa", None, "rail"))
B(132, None, "bg_west_railroad", [C("loco", "c", "l", mv="l")], f="wide", smoke=True)
B(133, None, "bg_west_railroad", [C("derail", "c")], f="medium", shake="tips", flash="tips", smoke=True)
B(134, None, "bg_west_railroad", [C("derail", "c")], f="medium", cam="pull", dark=0.4)
B(135, None, "bg_west_railroad", [C(J + "aim", "cl", "r"), C("pcar", "r", "l")], f="wide")
B(136, None, "bg_west_railroad", [C("derail", "cl"), C(J + "stand", "cr", "l")], f="wide", plate=("FIRST TRAIN ROBBERIES", "in the American West", None, "first"))
B(137, None, "bg_west_town_street", [C(J + "walk", "c", "r", mv="r")], f="wide")
B(138, None, "bg_west_town_street", [C(J + "bust", "c")], kind="bust", f="close", warm=True)
B(139, None, "bg_west_ranch", [C(J + "stand", "cl", "r"), C("zee", "cr", "l")], f="medium", tag=("1874", "Age 26"), warm=True)
B(140, None, "bg_west_ranch", [C("zee", "c", "l")], f="close", warm=True)

B(142, None, "bg_west_railroad", [C("loco", "c", "l")], f="wide")
B(143, None, "bg_west_town_street", [C("pinkerton", "c", "r", crowd=3)], f="wide", plate=("PINKERTON AGENCY", "", None, "Pinkerton"))
B(144, None, "bg_west_town_street", [C("pinkerton", "c", "r")], f="close")
B(145, None, "bg_jj_farm", [C("zerelda_old", "cl", "r"), C("reuben_samuel", "cr", "l")], f="wide", tag=("JAN 1875", "night"), dark=0.45, cool=True)
B(147, None, "bg_jj_farm", [C("pinkerton", "cl", "r", crowd=3)], f="wide", dark=0.4, cool=True)
B(148, None, "bg_jj_farm", [C("pinkerton", "c", "r")], f="medium", dark=0.4, cool=True)
B(149, None, "bg_west_camp_night", [C(J + "stand", "c", "r"), C("frank", "cr", "l")], f="medium", dark=0.3)
B(150, None, "bg_jj_farm", [C("pinkerton_throw", "c", "r")], f="medium", dark=0.4, cool=True)
B(151, None, "bg_jj_farm", [C("pinkerton", "r", "l")], f="wide", flash="explodes", shake="explodes", smoke=True, dark=0.3)
B(152, None, "bg_jj_farm", [C("archie", "c", "r")], f="medium", label=("ARCHIE", "age 8", 0, "Archie"), dark=0.3)
B(153, None, "bg_west_cemetery", [C("grave", "c")], f="medium", cam="pull", dark=0.45)
B(154, None, "bg_jj_farm", [C("zerelda_old", "c", "r")], f="medium", dark=0.3)
B(155, None, "bg_jj_farm", [C("doctor", "cl", "r"), C("zerelda_old", "cr", "l")], f="medium", dark=0.3)
B(156, None, "bg_jj_farm", [C("zerelda_young", "c", "r")], f="medium", warm=True)
B(159, None, "bg_jj_farm", [C("zerelda_old", "c", "r")], f="close", focus="arm")
B(160, None, "bg_west_town_street", [C("crowd", "cl", "r"), C("pinkerton", "cr", "l")], f="wide")
B(161, None, "bg_wooden_courtroom_interior", [C("judge", "c", "r")], f="medium", plate=("AMNESTY BILL", "1875", None, "bill"))
B(162, None, "bg_wooden_courtroom_interior", [C("judge", "c", "r")], f="close", plate=("FAILED", "", None, "Nearly"))
B(163, None, "bg_west_camp_night", [C(J + "bust", "c")], kind="bust", f="close", warm=True)
B(165, None, "bg_west_camp_night", [C(J + "stand", "c", "r")], f="medium", plate=("WHO'S NEXT?", "comment below", None, "next"), warm=True)
B(167, None, "bg_west_camp_night", [C(J + "bust", "c")], kind="bust", f="close", warm=True)
B(168, None, "bg_west_prairie", [C(J + "ride", "c", "r", mv="r")], f="wide")

B(169, None, "bg_northfield", [C("outlaw_ride", "cl", "r", mv="r", crowd=3)], f="wide", tag=("SEPT 7, 1876", ""))
B(170, None, "bg_northfield", [C("crowd", "cr", "l")], f="wide", plate=("NORTHFIELD", "Minnesota", None, "Northfield"))
B(171, None, "bg_west_prairie", [C(J + "ride", "c", "r", mv="r")], f="wide")
B(172, None, "bg_northfield", [C(J + "ride", "cl", "r", mv="r"), C("outlaw_ride", "c", "r", mv="r", crowd=3)], f="wide")
B(173, None, "bg_northfield", [C(J + "stand", "c", "r")], f="medium", label=("YOU", "", 0, "You"))
B(174, None, "bg_northfield", [C("frank", "c", "r")], f="medium", label=("FRANK", "", 0, "Frank"))
B(175, None, "bg_northfield", [C("outlaw_winch", "cl", "r", crowd=3)], f="medium", plate=("THE YOUNGERS", "Cole, Jim, Bob", None, "Younger"))
B(176, None, "bg_northfield", [C("outlaw_bandana", "c", "r", crowd=3)], f="medium")
B(177, None, "bg_west_bank_interior", [C("outlaw_bandana", "cl", "r", crowd=3), C("heywood", "cr", "l")], f="wide", plate=("FIRST NATIONAL BANK", "", None, "First"))
B(178, None, "bg_west_bank_interior", [C("heywood", "c", "l")], f="close", label=("JOSEPH HEYWOOD", "cashier", 0, "Joseph"))
B(179, None, "bg_west_bank_interior", [C("safe", "c")], f="close", focus=True)
B(181, None, "bg_west_bank_interior", [C("heywood", "c", "l")], f="medium", cam="pull", flash="shot", shake="shot", dark=0.4)
B(182, None, "bg_northfield", [C("crowd", "c", "l")], f="wide")
B(183, None, "bg_northfield", [C("shop", "cl", "r"), C("townsman_rifle", "cr", "l")], f="medium")
B(184, None, "bg_northfield", [C("student_rifle", "c", "l")], f="medium", flash="fires", shake="fires")
B(185, None, "bg_northfield", [C("outlaw_dead", "c", crowd=2)], f="wide", cam="pull", dark=0.35, smoke=True)
B(186, None, "bg_northfield", [C("outlaw_wounded", "c", "r")], f="medium", flash="hit", smoke=True)
B(187, None, "bg_northfield", [C(J + "ride", "cr", "l", mv="l")], f="wide", smoke=True)
B(188, None, "bg_west_prairie", [C("cav_ride", "cl", "r", mv="r", crowd=4)], f="wide", tag=("2 WEEKS", "manhunt"))
B(189, None, "bg_mn_swamp", [C("outlaw_wounded", "c", "r")], f="medium", plate=("MADELIA SWAMP", "", None, "swamp"))
B(190, None, "bg_mn_swamp", [C("outlaw_tied", "c", "r", crowd=3), C("deputy", "r", "l")], f="medium")
B(193, None, "bg_west_prairie", [C(J + "ride", "cl", "r", mv="r"), C("frank", "cr", "r", mv="r")], f="wide")
B(196, None, "bg_jj_farm", [C(Y + "boy_run", "cl", "r", mv="r"), C("boy_ragged", "cr", "l")], f="wide", warm=True)
B(198, None, "bg_west_prairie", [C(J + "bust", "c")], kind="bust", f="close")

B(199, None, "bg_west_ranch", [C(J + "walk", "cl", "r", mv="r")], f="wide", cam="pull")
B(200, None, "bg_west_ranch", [C(J + "walk", "c", "r")], f="wide", plate=("TENNESSEE", "1876 - 1879", None, "Tennessee"))
B(202, None, "bg_west_ranch", [C(J + "stand", "c", "r")], f="medium", label=("J.D. HOWARD", "alias", 0, "Howard"))
B(203, None, "bg_west_ranch", [C(J + "ride", "c", "r", mv="r")], f="wide")
B(204, None, "bg_west_ranch", [C("plow", "c", "r")], f="wide")
B(205, None, "bg_west_ranch", [C(J + "stand", "cl", "r"), C("zee", "c", "l"), C("boy_ragged", "cr", "l"), C("girl", "r", "l")], f="wide", warm=True)
B(206, None, "bg_west_ranch", [C("zee", "cl", "r"), C(J + "stand", "cr", "l")], f="medium", warm=True)
B(208, None, "bg_west_ranch", [C("dollars", "c")], f="close", cam="pull", dark=0.2)
B(209, None, "bg_west_camp_night", [C(J + "stand", "cl", "r"), C("outlaw_young", "cr", "l", crowd=3)], f="wide", tag=("1879", "new gang"), warm=True)
B(211, None, "bg_west_camp_night", [C("outlaw_young", "c", "l")], f="close", warm=True)
B(213, None, "bg_west_railroad", [C("loco", "c", "l"), C(J + "aim", "cl", "r")], f="wide", plate=("GLENDALE", "1879", None, "Glendale"), smoke=True)
B(215, None, "bg_west_railroad", [C("pcar", "c", "l"), C("outlaw_bandana", "cl", "r")], f="wide", tag=("1881", "Winston, Missouri"))
B(217, None, "bg_west_railroad", [C("outlaw_dead", "c")], f="medium", cam="pull", dark=0.4, flash="shot")
B(218, None, "bg_wyoming_governor_office", [C("crittenden", "c", "r")], f="medium", label=("GOV. CRITTENDEN", "Missouri", 0, "Thomas"))
B(219, None, "bg_wyoming_governor_office", [C("poster", "c")], kind="paper", paper=[("REWARD", "h", "Five"), ("$5,000 EACH", "l", "thousand")], stamp=("DEAD OR ALIVE", "Frank"))
B(220, None, "bg_wyoming_governor_office", [C("crittenden", "l", "r"), C("bob_ford", "r", "l")], f="medium", dark=0.25)
B(222, None, "bg_wyoming_governor_office", [C("charley_ford", "cl", "r"), C("bob_ford", "cr", "r")], f="medium", label=("BOB FORD", "age 20", 1, "Bob"))
B(224, None, "bg_west_cabin_interior", [C("bob_ford", "c", "r"), C("news", "cr", place="table")], f="medium")
B(225, None, "bg_west_cabin_interior", [C("bob_ford", "c", "r")], f="close", dark=0.3, focus="reward")
B(226, None, "bg_st_joseph_parlor_interior", [C("zee", "cl", "r"), C("girl", "cr", "l")], f="wide", tag=("1882", "Saint Joseph, Missouri"))
B(228, None, "bg_west_town_street", [C("church", "cl")], f="wide")
B(229, None, "bg_st_joseph_parlor_interior", [C(O + "walk", "c", "r")], f="medium", label=("THOMAS HOWARD", "alias, age 34", 0, "Howard"))
B(230, None, "bg_st_joseph_parlor_interior", [C(O + "walk", "cl", "r"), C("charley_ford", "cr", "l")], f="wide")
B(231, None, "bg_st_joseph_parlor_interior", [C(O + "stand", "c", "r")], f="wide", tag=("APRIL 3, 1882", "morning"), warm=True)
B(233, None, "bg_st_joseph_parlor_interior", [C("zee", "c", "l")], f="medium", warm=True)
B(235, None, "bg_st_joseph_parlor_interior", [C(O + "walk", "cl", "r", swap=[(O + "stand", 235, "gun")]), C("gunbelt", "cr", place="table")], f="medium", focus="gun")
B(236, None, "bg_st_joseph_parlor_interior", [C("gunbelt", "c", place="table")], f="close")
B(237, None, "bg_st_joseph_parlor_interior", [C("sampler", "c", place="wall")], f="close", focus="picture")
B(240, None, "bg_st_joseph_parlor_interior", [C(O + "reach", "c", "l")], f="medium")
B(241, None, "bg_st_joseph_parlor_interior", [C(O + "reach", "cr", "r"), C("bob_ford", "cl", "r")], f="wide", dark=0.25)
B(242, None, "bg_st_joseph_parlor_interior", [C("sampler", "c", place="wall")], f="close", focus="sampler")
B(244, None, "bg_st_joseph_parlor_interior", [C("sampler", "c", place="wall")], kind="paper", paper=[("IN GOD WE TRUST", "h", "God")])
B(245, None, "bg_west_town_street", [C("robert_preacher", "c", "r")], f="medium", warm=True)
B(247, None, "bg_st_joseph_parlor_interior", [C("bob_ford", "c", "r")], f="close", dark=0.35, focus="revolver")
B(248, None, "bg_st_joseph_parlor_interior", [C(O + "reach", "cr", "r"), C("bob_ford", "cl", "r")], f="medium", flash="shot", shake="shot", dark=0.4)
B(250, None, "bg_st_joseph_parlor_interior", [C(O + "fallen", "c"), C("chair_down", "cr")], f="medium", cam="pull", dark=0.4)
B(251, None, "bg_st_joseph_parlor_interior", [C(O + "bust", "c")], kind="bust", f="close", tag=("AGE 34", ""), dark=0.3)
B(252, None, "bg_st_joseph_parlor_interior", [], kind="black")

B(253, None, "bg_west_town_street", [C("bob_ford", "c", "r", mv="r"), C("telegraph", "r")], f="wide")
B(254, None, "bg_west_town_street", [C("money", "c")], f="close")
B(255, None, "bg_wooden_courtroom_interior", [C("charley_ford", "cl", "r"), C("judge", "cr", "l")], f="wide", plate=("THE FORD BROTHERS", "charged with murder", None, "Fords"))
B(257, None, "bg_wooden_courtroom_interior", [C("judge", "c", "l")], f="wide", tag=("SENTENCED TO HANG", "", "hang"), dark=0.25)
B(258, None, "bg_wyoming_governor_office", [C("crittenden", "c", "r")], f="medium", plate=("PARDONED", "same day", None, "pardons"))
B(259, None, "bg_stage_1880", [C("bob_ford", "cl", "r"), C("charley_ford", "cr", "l")], f="wide", warm=True)
B(260, None, "bg_stage_1880", [C(O + "reach", "cr", "r"), C("bob_ford", "cl", "r")], f="medium", warm=True)
B(261, None, "bg_stage_1880", [C("crowd", "c", "l")], f="medium")
B(262, None, "bg_tombstone_pool_hall_night", [C("outlaw_dead", "c")], f="medium", cam="pull", tag=("1892", "Creede, Colorado"), flash="shot", dark=0.35, plate=("BOB FORD", "shot dead", None, "Bob"))
B(263, None, "bg_west_prairie", [C("frank", "c", "r")], f="medium")
B(264, None, "bg_wyoming_governor_office", [C("frank", "cl", "r", mv="r"), C("crittenden", "cr", "l")], f="medium", tag=("OCT 1882", ""))
B(265, None, "bg_wyoming_governor_office", [C("revolver", "c", place="table")], f="close", focus="pistol")
B(266, None, "bg_wooden_courtroom_interior", [C("frank", "c", "r"), C("judge", "r", "l")], f="medium", plate=("NOT GUILTY", "", None, "refuse"))
B(267, None, "bg_jj_farm", [C("frank", "c", "r")], f="wide", tag=("1915", "Frank dies at 72"))
B(268, None, "bg_jj_farm", [C("frank", "cl", "r"), C("family", "cr", "l")], f="wide", warm=True)
B(269, None, "bg_west_cemetery", [C("zerelda_old", "cl", "r"), C("gravestone", "c")], f="medium", cool=True)
B(270, None, "bg_west_cemetery", [C("gravestone", "c")], f="close", plate=("TRAITOR & COWARD", "on his gravestone", None, "traitor"))
B(271, None, "bg_west_cemetery", [C("crowd", "c", "l")], f="wide", dark=0.25)
B(272, None, "bg_west_cemetery", [C("gravestone", "c")], f="medium", cam="pull", dark=0.3)
B(274, None, "bg_west_cemetery", [C("undertaker", "cl", "r"), C("gravestone", "c")], f="wide", tag=("1995", "exhumation"))
B(275, None, "bg_west_cemetery", [C("dna_vial", "c")], kind="paper", paper=[("DNA TEST", "h", "DNA"), ("1995", "n", "test")], stamp=("MATCH", (276, "certainly")))

B(277, None, None, [], kind="montage", montage=(["bg_jj_farm", "bg_missouri_forest_trail", "bg_west_railroad", "bg_northfield"], ["1847", "1864", "1873", "1876"]))
B(278, None, "bg_jj_farm", [C(Y + "boy", "c", "r")], f="medium", warm=True)
B(279, None, "bg_west_town_street", [C(J + "aim", "c", "r")], f="medium")
B(280, None, "bg_missouri_forest_trail", [C(Y + "guerrilla_ride", "cl", "r", mv="r"), C("bill", "cr", "r", mv="r")], f="wide")
B(281, None, "bg_west_bank_interior", [C(J + "aim", "cl", "r"), C("banker", "cr", "l")], f="medium")
B(282, None, "bg_west_railroad", [C("derail", "c")], f="medium", smoke=True)
B(283, None, "bg_jj_farm", [C("archie", "c", "r")], f="medium", dark=0.3)
B(284, None, "bg_northfield", [C(J + "ride", "cr", "l", mv="l")], f="wide", smoke=True)
B(285, None, "bg_st_joseph_parlor_interior", [C(O + "reach", "c", "l")], f="medium", dark=0.3)
B(287, None, "bg_st_joseph_parlor_interior", [C(O + "reach", "cr", "r"), C("bob_ford", "cl", "r")], f="wide", dark=0.35)
B(288, None, "bg_jj_farm", [C(J + "bust", "c")], kind="bust", f="close", label=("JESSE WOODSON JAMES", "1847 - 1882", 0, "Jesse"))
B(289, None, "bg_west_town_street", [C("news", "c")], kind="paper", paper=[("ROBIN HOOD", "h", "prove"), ("OR ROBBER?", "l", (291, "sell"))])
B(292, None, "bg_west_camp_night", [C(J + "bust", "c")], kind="bust", f="close", warm=True)
B(293, None, "bg_west_camp_night", [C(J + "stand", "c", "r")], f="medium", plate=("REBEL OR ROBBER?", "comment below", None, "rebel"), end="robber", warm=True)

from beats_lib import B, C, ALIAS

ALIAS.update({
    "murmillo": "rome_arena__gladiator_murmillo",
    "retiarius": "rome_arena__gladiator_retiarius",
    "thraex_lib": "rome_arena__gladiator_thraex",
    "fallen": "rome_arena__gladiator_fallen",
    "lanista": "rome_arena__lanista_trainer",
    "leg_stand": "rome_legion__legionary_stand",
    "leg_march": "rome_legion__legionary_march",
    "leg_attack": "rome_legion__legionary_attack",
    "leg_shield": "rome_legion_act__legionary_shield_up",
    "leg_dig": "rome_legion_act__legionary_dig",
    "leg_surr": "rome_legion_act__legionary_surrender",
    "leg_wounded": "rome_legion_act__legionary_wounded",
    "leg_rest": "rome_legion_act__legionary_rest",
    "leg_column": "rome_more__column_five_roman_legionaries_marching",
    "testudo": "rome_more__group_six_roman_legionaries_testudo",
    "wall_build": "rome_more__roman_soldiers_building_wall_stones",
    "centurion": "rome_legion__centurion_stand",
    "legate": "rome_legion__legate_cape",
    "general_point": "rome_legion_act__general_pointing",
    "signifer": "rome_legion__signifer_stand",
    "cav_roman": "ancient_mounted__roman_cavalry_gallop",
    "senator": "rome_civ__senator_toga_speech",
    "senator_stand": "rome_civ__senator_toga_stand",
    "slave_chains": "rome_more__roman_slave_chains_walking",
    "slave_amphora": "rome_civ__slave_carry_amphora",
    "cook": "rome_more__roman_cook_stirring_pot",
    "plebeian": "rome_civ__plebeian_man_walk",
    "farmer": "ancient_civ__farmer_ancient",
    "thracian": "near_east_more__thracian_warrior_rhomphaia",
    "gaul": "ancient_enemies__gaul_warrior",
    "horse": "ancient_animals__brown_horse_standing_saddle",
    "horse_gallop": "ancient_animals__white_horse_galloping_rider",
    "sheep": "ancient_animals__sheep",
    "goat": "ancient_animals__goat",
    "merchant_ship": "ancient_ships__roman_merchant_ship",
    "trireme": "ancient_ships__roman_trireme",
    "tent": "ancient_structures__legion_tent",
    "cmd_tent": "ancient_structures__commander_tent",
    "palisade": "ancient_structures__palisade_wall",
    "brazier": "ancient_props__brazier_fire",
    "campfire": "ancient_props__campfire_pot",
    "coin_chest": "ancient_props__coin_chest",
    "grain": "ancient_props__grain_sacks",
    "weapon_rack": "ancient_props__weapon_rack",
    "scutum": "ancient_props__scutum_shield",
    "gladius": "ancient_props2__gladius_sword",
    "eagle": "ancient_props__legion_eagle_standard",
    "scroll": "ancient_props__scroll",
    "cage": "ancient_props2__wooden_cage",
    "bread": "ancient_props__bread_loaves",
    "olive": "ancient_nature__olive_tree",
    "pine": "ancient_nature__umbrella_pine",
    "blacksmith": "rome_more__roman_blacksmith_hammering_anvil",
    "statue": "ancient_structures__marble_statue",
})

A = "spartacus_adult_"
Y = "spartacus_young_"

B(1, None, "bg_rome_colosseum_arena", [C(Y + "thraex", "cl", "r"), C("murmillo", "cr", "l")], f="wide", label=("SPARTACUS", "c. 100 - 71 BC", 0, "Spartacus"), focus="Spartacus")
B(1, "death", "bg_rome_colosseum_arena", [C(Y + "thraex", "c", "r")], f="close", flash="death", shake="death")
B(2, None, "bg_sp_kitchen", [C(A + "cleaver", "c", "r", mv="r")], f="medium", smoke=True)
B(2, "kitchen", "bg_sp_kitchen", [C("cleaver", "c", place="table")], f="close")
B(3, None, "bg_ancient_battlefield", [C(A + "point", "cl", "r"), C("rebel_farm", "c", "r", crowd=3)], f="wide", smoke=True)
B(3, "strongest", "bg_ancient_battlefield", [C("leg_shield", "c", "l", crowd=4)], f="wide", flash="strongest", shake="strongest")
B(4, None, "bg_sp_appian", [C("leg_stand", "r", "l", crowd=2)], f="wide", dark=0.3)
B(5, None, "bg_sp_appian", [C("leg_stand", "r", "l", crowd=2)], f="wide", cam="pull", dark=0.35, plate=("6,000", "on the road to Rome", None, "Six"))
B(6, None, "bg_sp_appian", [], kind="rew", f="wide", cam="pull", dark=0.4)
B(7, None, "bg_sp_thrace", [C("spartacus_baby", "c")], f="close", warm=True)
B(8, None, "bg_sp_thrace", [C("spartacus_baby", "c")], f="close", plate=("NO SWORD", "", None, "sword"))
B(9, None, "bg_sp_thrace", [C("spartacus_baby", "c")], f="close", plate=("NO CHAINS", "", None, "chains"))
B(10, None, "bg_sp_thrace", [C("spartacus_baby", "c")], f="close", plate=("NO ARMY", "", None, "army"))
B(11, None, "bg_rome_forum", [C("senator_stand", "c", "r")], f="wide")
B(12, None, "bg_rome_forum", [C("senator_stand", "c", "r")], f="close")

B(13, None, "bg_sp_thrace", [C("spartacus_baby", "c")], f="wide", tag=("c. 100 BC", "year unknown"), warm=True)
B(15, None, "bg_sp_thrace", [C(Y + "boy", "c", "r")], f="wide", plate=("THRACE", "", None, "Thrace"))
B(16, None, "bg_sp_thrace", [], kind="paper", paper=[("BULGARIA", "h", "Bulgaria"), ("GREECE & TURKEY", "n", "Greece")])
B(17, None, "bg_sp_thrace", [C(Y + "boy", "c", "r")], f="close", focus="name")
B(18, None, "bg_rome_forum", [C("scroll", "c")], kind="paper", paper=[("SPARTACUS", "h", "Spartacus"), ("a Roman record", "n", "write")])
B(19, None, "bg_sp_thrace", [C("thracian", "cl", "r", crowd=3), C("horse", "r", "l")], f="wide")
B(20, None, "bg_sp_thrace", [C(Y + "boy", "c", "r")], f="medium", plate=("CHILDHOOD", "unknown", None, "childhood"))
B(22, None, "bg_sp_thrace", [C(Y + "youth", "c", "r")], f="medium", tag=("AGE 20", ""))
B(23, None, "bg_rome_villa_interior", [C("scroll", "c", place="table")], f="medium", plate=("PLUTARCH", "ancient writer", None, "Plutarch"))
B(24, None, "bg_sp_thrace", [C(Y + "youth", "c", "r")], f="close", warm=True)
B(25, None, "bg_sp_thrace", [C(Y + "youth", "cl", "r"), C("prophetess", "cr", "l")], f="medium")
B(26, None, "bg_sp_thrace", [C("prophetess", "c", "l")], f="close", label=("PROPHETESS", "of Dionysus", 0, "prophetess"), focus="prophetess")
B(27, None, "bg_sp_cell", [C(Y + "sleep", "c")], f="medium", dark=0.35, cool=True)
B(27, "snake", "bg_sp_cell", [C("snake", "c")], f="close", focus="snake", dark=0.35)
B(28, None, "bg_sp_thrace", [C("prophetess", "c", "l")], f="close", plate=("GREAT POWER", "", None, "power"), dark=0.2)
B(29, None, "bg_sp_thrace", [C("prophetess", "c", "l")], f="close", plate=("A TERRIBLE END", "", None, "terrible"), dark=0.35)
B(30, None, "bg_sp_cell", [C("snake", "c")], f="close", dark=0.3)

B(31, None, "bg_roman_countryside", [C("leg_column", "c", "r", mv="r")], f="wide")
B(32, None, "bg_rome_camp", [C(Y + "auxiliary", "c", "r")], f="medium", label=("AUXILIARY", "hired soldier", 0, "hired"))
B(33, None, "bg_roman_countryside", [C(Y + "auxiliary", "c", "l", mv="l")], f="wide")
B(33, "caught", "bg_roman_countryside", [C(Y + "chained", "cl", "r"), C("leg_stand", "cr", "l")], f="medium")
B(34, None, "bg_rome_street", [C(Y + "chained", "c", "r", mv="r")], f="medium", plate=("SLAVE", "", None, "slave"), dark=0.2)
B(35, None, "bg_rome_street", [C("lanista", "cl", "r"), C(Y + "chained", "cr", "l")], f="medium")
B(36, None, "bg_sp_ludus", [C(Y + "thraex", "c", "r")], f="wide", plate=("CAPUA", "gladiator schools", None, "rich"))
B(37, None, "bg_sp_ludus", [C("batiatus", "c", "r")], f="medium", label=("LENTULUS BATIATUS", "owner", 0, "Lentulus"))
B(38, None, "bg_sp_ludus", [C("batiatus", "cl", "r"), C(Y + "thraex", "cr", "l")], f="medium")
B(39, None, "bg_sp_ludus", [C(Y + "thraex", "c", "r")], f="medium", label=("THRAEX", "Thracian fighter", 0, "Thracian"))
B(40, None, "bg_sp_cell", [C(Y + "sit_cell", "c", "r")], f="medium", dark=0.3)
B(41, None, "bg_sp_kitchen", [C("cook", "c", "r"), C("bread", "cr", place="table")], f="medium")
B(42, None, "bg_sp_ludus", [C(Y + "thraex", "cl", "r"), C("murmillo", "c", "r"), C("retiarius", "cr", "l")], f="wide", plate=("HORDEARII", "barley men", None, "barley"))
B(43, None, "bg_rome_colosseum_arena", [C("fallen", "c")], f="medium", cam="pull", dark=0.35)
B(44, None, "bg_sp_cell", [C(Y + "sit_cell", "c", "r")], f="close", dark=0.3)
B(45, None, "bg_sp_ludus", [C(Y + "thraex", "cl", "r"), C("crixus", "c", "l"), C("oenomaus", "cr", "l")], f="medium", tag=("~200", "plotters"), dark=0.25)
B(46, None, "bg_sp_ludus", [C("batiatus", "c", "l")], f="close", dark=0.2)
B(47, None, "bg_sp_ludus", [C("batiatus", "cl", "r"), C("leg_stand", "cr", "l", crowd=2)], f="medium", shake="discovered")

B(48, None, "bg_sp_ludus", [C(A + "stand", "cl", "r"), C("crixus", "cr", "l")], f="wide", tag=("73 BC", "Capua"), dark=0.2)
B(49, None, "bg_sp_ludus", [C(A + "bust", "c")], kind="bust", f="close")
B(50, None, "bg_sp_kitchen", [C(A + "cleaver", "cl", "r", mv="r"), C("crixus", "cr", "r", mv="r")], f="wide", tag=("~70", "gladiators"))
B(51, None, "bg_sp_kitchen", [C("cleaver", "cl", place="table"), C("meat_spit", "cr", place="table")], f="close", focus="cleavers")
B(52, None, "bg_rome_street", [C(A + "cleaver", "cl", "r", mv="r"), C("leg_wounded", "cr", "l")], f="wide", flash="fight", shake="fight")
B(53, None, "bg_roman_countryside", [C("weapon_wagon", "c", "l")], f="wide")
B(54, None, "bg_roman_countryside", [C(A + "stand", "c", "r"), C("weapon_wagon", "cr", "l")], f="medium")
B(55, None, "bg_sp_vesuvius", [C(A + "stand", "cl", "r"), C("crixus", "c", "r"), C("oenomaus", "cr", "r")], f="wide", plate=("MOUNT VESUVIUS", "", None, "Vesuvius"))
B(56, None, "bg_sp_vesuvius", [], kind="paper", paper=[("POMPEII", "h", "Pompeii"), ("buried in 79 AD", "n", "buries")])
B(57, None, "bg_sp_vesuvius", [C(A + "stand", "c", "r")], f="medium")
B(58, None, "bg_sp_vesuvius", [C(A + "stand", "cl", "r"), C("crixus", "c", "l"), C("oenomaus", "cr", "l")], f="medium", label=("CRIXUS", "Gaul", 1, "Crixus"))
B(58, "Oenomaus", "bg_sp_vesuvius", [C("oenomaus", "c", "l")], f="close", label=("OENOMAUS", "Gaul", 0, "Oenomaus"))
B(59, None, "bg_rome_senate", [C("senator", "c", "r", crowd=3)], f="wide")
B(60, None, "bg_rome_camp", [C("glaber", "cl", "r"), C("leg_stand", "cr", "r", crowd=3)], f="wide", label=("GLABER", "praetor", 0, "Gaius"), tag=("3,000 MEN", "", "three"))
B(61, None, "bg_rome_camp", [C("glaber", "c", "r")], f="close")
B(62, None, "bg_sp_vesuvius", [C("leg_shield", "c", "l", crowd=3)], f="wide", focus="path")
B(63, None, "bg_sp_vesuvius", [C(A + "bust", "c")], kind="bust", f="close", dark=0.2)
B(64, None, "bg_sp_vesuvius", [C("vine_ladder", "cr")], f="wide")
B(65, None, "bg_sp_vesuvius", [C(A + "stand", "cl", "r"), C("vine_ladder", "cr")], f="medium")
B(66, None, "bg_sp_vesuvius", [C(A + "climb", "c", "r")], f="medium", dark=0.4, cool=True)
B(67, None, "bg_rome_camp", [C(A + "point", "cl", "r", mv="r"), C("rebel_farm", "c", "r", mv="r", crowd=3)], f="wide", dark=0.4, cool=True)
B(68, None, "bg_rome_camp", [C(A + "fight", "cl", "r"), C("leg_surr", "cr", "l", crowd=2)], f="wide", flash="attack", shake="attack", dark=0.3, smoke=True)
B(69, None, "bg_rome_camp", [C("leg_wounded", "cr", "l", crowd=3)], f="wide", smoke=True)
B(70, None, "bg_sp_vesuvius", [C(A + "point", "c", "r")], f="medium", warm=True)

B(71, None, "bg_roman_countryside", [C("rebel_farm", "cl", "r", mv="r", crowd=3), C(A + "stand", "r", "l")], f="wide")
B(72, None, "bg_roman_countryside", [C("rebel_farm", "c", "r")], f="medium")
B(73, None, "bg_roman_countryside", [C("rebel_shepherd", "c", "r"), C("sheep", "cr", "r")], f="medium")
B(74, None, "bg_roman_countryside", [C("rebel_shepherd", "cl", "r"), C("goat", "cr", "r")], f="medium")
B(75, None, "bg_sp_camp", [C("rebel_farm", "c", "r", crowd=5)], f="wide", tag=("THOUSANDS", ""))
B(76, None, "bg_rome_camp", [C("legate", "c", "r"), C("leg_stand", "cr", "r", crowd=3)], f="wide", label=("VARINIUS", "praetor", 0, "Publius"))
B(77, None, "bg_roman_countryside", [C("leg_rest", "c", "r")], f="medium", plate=("COSSINIUS", "bathing", None, "Cossinius"))
B(78, None, "bg_roman_countryside", [C("leg_rest", "c", "l", mv="l")], f="wide")
B(79, None, "bg_roman_countryside", [C(A + "fight", "cl", "r"), C("leg_wounded", "cr", "l")], f="medium", flash="dies")
B(80, None, "bg_sp_camp", [C("leg_shield", "cr", "l", crowd=4)], f="wide", dark=0.3)
B(81, None, "bg_sp_camp", [C("palisade", "c")], f="medium", dark=0.45, cool=True)
B(82, None, "bg_sp_camp", [C("campfire", "c")], f="medium", dark=0.4, warm=True)
B(83, None, "bg_sp_camp", [C(A + "point", "cl", "l", mv="l"), C("rebel_farm", "c", "l", mv="l", crowd=3)], f="wide", dark=0.45, cool=True)
B(84, None, "bg_ancient_battlefield", [C(A + "fight", "cl", "r"), C("leg_attack", "cr", "l", crowd=3)], f="wide", flash="beat", shake="beat", smoke=True)
B(85, None, "bg_ancient_battlefield", [C(A + "ride", "c", "r")], f="medium", focus="horse")
B(86, None, "bg_sp_thrace", [C("prophetess", "c", "l")], f="close", warm=True)
B(87, None, "bg_sp_thrace", [C("prophetess", "c", "l")], f="close", plate=("GREAT POWER", "", None, "Great"))
B(88, None, "bg_sp_camp", [C(A + "point", "c", "r")], f="medium", warm=True)
B(89, None, "bg_sp_camp", [C(A + "stand", "cl", "r"), C("rebel_farm", "cr", "l", crowd=5)], f="wide", tag=("70,000", "people"))
B(90, None, "bg_sp_camp", [C("rebel_shepherd", "c", "l", crowd=5)], f="wide", cam="pull")
B(92, None, "bg_sp_camp", [C(A + "stand", "c", "r"), C("coin_chest", "cr")], f="medium", warm=True)
B(93, None, "bg_sp_camp", [C("coin_chest", "c")], f="close", plate=("APPIAN", "ancient writer", None, "Appian"))
B(94, None, "bg_sp_camp", [C(A + "stand", "cl", "r"), C("merchant_ship", "r")], f="medium")
B(95, None, "bg_sp_camp", [C("blacksmith", "c", "r")], f="medium", warm=True, plate=("IRON & BRONZE", "", None, "iron"))
B(96, None, "bg_sp_camp", [C(A + "stand", "cl", "r"), C("crixus", "cr", "l")], f="medium", dark=0.2)
B(97, None, "bg_sp_camp", [C("crixus", "c", "l")], f="close", focus="Crixus")
B(98, None, "bg_alps_pass", [C(A + "point", "c", "r")], f="wide", plate=("THE ALPS", "home", None, "Alps"))
B(99, None, "bg_sp_camp", [C(A + "bust", "c")], kind="bust", f="close")
B(100, None, "bg_roman_countryside", [C(A + "stand", "cl", "l"), C("crixus", "cr", "r", mv="r")], f="wide", cam="pull")

B(101, None, "bg_rome_senate", [C("senator", "c", "r")], f="wide", tag=("72 BC", ""))
B(102, None, "bg_roman_countryside", [C("leg_column", "cl", "r", mv="r"), C("signifer", "r", "r")], f="wide", tag=("2 CONSULS", "2 armies", "consuls"))
B(103, None, "bg_roman_countryside", [C("crixus", "cl", "r", mv="r"), C("gaul", "c", "r", mv="r", crowd=3)], f="wide", tag=("30,000", "men"))
B(104, None, "bg_ancient_battlefield", [C("leg_attack", "c", "l", crowd=4)], f="wide", plate=("MOUNT GARGANUS", "", None, "Garganus"), smoke=True)
B(105, None, "bg_ancient_battlefield", [C("crixus", "c", "r")], f="medium", cam="pull", flash="dies", dark=0.4)
B(106, None, "bg_ancient_battlefield", [C(A + "fight", "cl", "r"), C("leg_wounded", "cr", "l")], f="medium", flash="beat", shake="beat")
B(107, None, "bg_ancient_battlefield", [C(A + "ride", "cl", "r", mv="r"), C("leg_surr", "cr", "l", crowd=2)], f="wide")
B(108, None, "bg_sp_camp", [C(A + "bust", "c")], kind="bust", f="close", dark=0.3)
B(109, None, "bg_rome_colosseum_arena", [C("leg_attack", "cl", "r"), C("leg_shield", "cr", "l")], f="wide", tag=("300", "prisoners"), dark=0.3)
B(110, None, "bg_rome_colosseum_arena", [C(A + "stand", "c", "r")], f="medium", dark=0.3)
B(111, None, "bg_sp_ludus", [C(Y + "thraex", "c", "r")], f="close", dark=0.2)
B(112, None, "bg_sp_camp", [C(A + "bust", "c")], kind="bust", f="close", warm=True)
B(114, None, "bg_sp_camp", [C(A + "stand", "c", "r")], f="medium", plate=("WHO'S NEXT?", "comment below", None, "next"), warm=True)
B(116, None, "bg_sp_camp", [C(A + "bust", "c")], kind="bust", f="close", warm=True)
B(117, None, "bg_roman_countryside", [C(A + "ride", "c", "r", mv="r")], f="wide")

B(118, None, "bg_roman_countryside", [C(A + "point", "cl", "r", mv="r"), C("rebel_farm", "c", "r", mv="r", crowd=4)], f="wide")
B(119, None, "bg_alps_pass", [C(A + "stand", "c", "r")], f="wide", plate=("MUTINA", "foot of the Alps", None, "Mutina"))
B(120, None, "bg_alps_pass", [C("legate", "cr", "l"), C("leg_attack", "r", "l", crowd=3)], f="wide", tag=("10,000", "men"))
B(121, None, "bg_alps_pass", [C(A + "fight", "cl", "r"), C("leg_wounded", "cr", "l")], f="medium", flash="crush", shake="crush")
B(122, None, "bg_alps_pass", [C(A + "stand", "c", "r")], f="wide")
B(123, None, "bg_alps_pass", [C(A + "stand", "c", "r")], f="medium", warm=True)
B(124, None, "bg_alps_pass", [C(A + "bust", "c")], kind="bust", f="close")
B(125, None, "bg_alps_pass", [C(A + "stand", "c", "l"), C("rebel_farm", "cr", "l", mv="l", crowd=3)], f="wide", cam="pull")
B(126, None, "bg_alps_pass", [C(A + "bust", "c")], kind="bust", f="close", plate=("WHY?", "", None, "Why"))
B(128, None, "bg_roman_countryside", [C("rebel_farm", "c", "l"), C("olive", "cr")], f="medium", warm=True)
B(129, None, "bg_rome_forum", [C("statue", "c")], f="wide")
B(130, None, "bg_rome_villa_interior", [C("scroll", "c", place="table")], kind="paper", paper=[("PLUTARCH", "n", "ancient"), ("APPIAN", "n", "writers"), ("NO ANSWER", "h", "agree")])

B(131, None, "bg_rome_senate", [C("senator", "c", "r", crowd=3)], f="wide", dark=0.2)
B(132, None, "bg_rome_senate", [C("senator_stand", "c", "l")], f="medium")
B(133, None, "bg_rome_senate", [C("crassus", "c", "r")], f="medium")
B(134, None, "bg_rome_senate", [C("crassus", "c", "r")], f="close", label=("MARCUS CRASSUS", "richest man in Rome", 0, "Marcus"), focus="Marcus")
B(135, None, "bg_rome_camp", [C("crassus", "cl", "r"), C("leg_column", "cr", "r")], f="wide")
B(136, None, "bg_rome_camp", [C("leg_rest", "c", "l", mv="l")], f="medium")
B(137, None, "bg_rome_camp", [C("crassus", "cl", "r"), C("leg_stand", "cr", "l", crowd=4)], f="wide", plate=("DECIMATION", "", None, "Decimation"), dark=0.3)
B(138, None, "bg_rome_camp", [], kind="paper", paper=[("1 IN 10", "h", "ten")])
B(139, None, "bg_rome_camp", [C("leg_stand", "c", "l", crowd=4)], f="wide", cam="pull", dark=0.4, shake="death")
B(140, None, "bg_rome_camp", [C("crassus", "c", "r")], f="close", dark=0.25)
B(141, None, "bg_roman_countryside", [C(A + "point", "c", "r", mv="r")], f="wide", plate=("BRUTTIUM", "the toe of Italy", None, "toe"))
B(142, None, "bg_mediterranean_harbor", [C(A + "stand", "cl", "r"), C("pirate", "cr", "l")], f="medium", label=("PIRATES", "Cilician", 1, "pirates"))
B(143, None, "bg_mediterranean_harbor", [C("merchant_ship", "c", "r")], f="wide", plate=("SICILY", "", None, "Sicily"))
B(144, None, "bg_mediterranean_harbor", [C("coin_chest", "c")], f="close")
B(145, None, "bg_mediterranean_harbor", [C("merchant_ship", "c", "l", mv="l")], f="wide")
B(146, None, "bg_mediterranean_harbor", [C(A + "stand", "c", "r")], f="medium", cam="pull", dark=0.25)
B(147, None, "bg_rome_camp", [C("crassus", "c", "r")], f="medium")
B(148, None, "bg_sp_trench", [C("leg_dig", "c", "r", crowd=4)], f="wide", plate=("SEA TO SEA", "", None, "sea"))
B(149, None, "bg_sp_trench", [C("wall_build", "c", "r")], f="medium")
B(150, None, "bg_sp_trench", [C(A + "bust", "c")], kind="bust", f="close", dark=0.3, cool=True)
B(151, None, "bg_sp_trench", [C("rebel_farm", "c", "r", crowd=3)], f="wide", cool=True, dark=0.2)
B(152, None, "bg_sp_trench", [C("rebel_farm", "c", "r", crowd=4)], f="wide", dark=0.4, cool=True)
B(153, None, "bg_sp_trench", [C(A + "point", "cl", "r", mv="r"), C("rebel_shepherd", "c", "r", mv="r", crowd=3)], f="wide", dark=0.35, cool=True, plate=("1/3 OF THE ARMY", "", None, "third"))

B(154, None, "bg_rome_senate", [C("senator", "c", "r")], f="wide", tag=("71 BC", ""))
B(155, None, "bg_rome_camp", [C("pompey", "c", "r")], f="medium", label=("POMPEY", "back from Spain", 0, "Pompey"))
B(156, None, "bg_mediterranean_harbor", [C("trireme", "c", "r")], f="wide")
B(157, None, "bg_ancient_battlefield", [C("leg_column", "cl", "r", mv="r"), C("testudo", "cr", "l")], f="wide")
B(158, None, "bg_ancient_battlefield", [C("rebel_farm", "c", "r", crowd=3)], f="wide", flash="wipes", cam="pull", dark=0.35, smoke=True)
B(159, None, "bg_rome_camp", [C("crassus", "cl", "r"), C("pompey", "r", "l")], f="medium")
B(160, None, "bg_sp_camp", [C("rebel_farm", "cl", "r", crowd=3)], f="wide", dark=0.4, plate=("A WARNING", "", None, "crucify"))
B(161, None, "bg_sp_camp", [C(A + "bust", "c")], kind="bust", f="close", dark=0.3)
B(162, None, "bg_sp_river", [C(A + "stand", "cl", "r"), C("crassus", "r", "l")], f="wide", plate=("SILARUS RIVER", "", None, "Silarus"))
B(163, None, "bg_sp_river", [C(A + "stand", "cl", "r"), C("horse", "cr", "l")], f="medium")
B(164, None, "bg_sp_river", [C(A + "fight", "c", "r")], f="close")
B(165, None, "bg_sp_river", [C("dead_horse", "c")], f="medium", flash="kill", shake="kill", dark=0.3)
B(166, None, "bg_sp_river", [C(A + "bust", "c")], kind="bust", f="close")
B(167, None, "bg_sp_river", [C("horse_gallop", "c", "r")], f="wide", plate=("WIN: MANY HORSES", "", None, "win"))
B(168, None, "bg_sp_river", [C(A + "stand", "c", "r")], f="close", plate=("LOSE: NO NEED", "", None, "lose"))
B(169, None, "bg_sp_river", [C(A + "fight", "cl", "r", mv="r"), C("crassus", "r", "l")], f="wide")
B(170, None, "bg_sp_river", [C(A + "fight", "c", "r"), C("leg_attack", "cr", "l", crowd=3)], f="wide", smoke=True)
B(171, None, "bg_sp_river", [C(A + "fight", "cl", "r"), C("centurion", "cr", "l")], f="medium", flash="kill", shake="kill")
B(172, None, "bg_sp_river", [C(A + "fight", "c", "r"), C("leg_shield", "cl", "r", crowd=2), C("leg_attack", "r", "l", crowd=2)], f="wide", dark=0.3)
B(173, None, "bg_sp_river", [C(A + "fight", "c", "r")], f="close", cam="pull", flash="down", dark=0.4)
B(174, None, "bg_sp_river", [C("gladius", "c")], f="medium", cam="pull", dark=0.35)
B(175, None, "bg_sp_cell", [C("snake", "c")], f="close", dark=0.3)
B(176, None, "bg_sp_thrace", [C("prophetess", "c", "l")], f="close", dark=0.3)
B(177, None, "bg_sp_appian", [], kind="black")
B(178, None, "bg_sp_river", [C(Y + "chained", "c", "r", crowd=4), C("leg_stand", "r", "l")], f="wide", tag=("6,000", "captured"), dark=0.3)
B(179, None, "bg_sp_appian", [C("leg_stand", "cr", "l", crowd=2)], f="wide", dark=0.35, plate=("APPIAN WAY", "", None, "Appian"))
B(180, None, "bg_sp_appian", [], kind="paper", paper=[("CAPUA", "n", "Capua"), ("ROME", "h", "Rome")])
B(181, None, "bg_rome_camp", [C("pompey", "c", "r", mv="r")], f="medium")
B(182, None, "bg_alps_pass", [C("cav_roman", "c", "r", mv="r", crowd=3)], f="wide", tag=("5,000", "more"))
B(183, None, "bg_rome_senate", [C("pompey", "c", "r"), C("senator", "cr", "l", crowd=3)], f="wide")
B(184, None, "bg_rome_senate", [C("crassus", "c", "l")], f="close", dark=0.2)
B(185, None, "bg_rome_forum", [C(A + "point", "c", "r")], f="wide", cam="pull", warm=True, plate=("REBELLION", "2,000 years later", None, "rebellion"))

B(186, None, None, [], kind="montage", montage=(["bg_sp_thrace", "bg_sp_ludus", "bg_sp_vesuvius", "bg_sp_river"], ["THRACE", "CAPUA", "VESUVIUS", "SILARUS"]))
B(187, None, "bg_sp_thrace", [C(Y + "youth", "c", "r")], f="medium", warm=True)
B(188, None, "bg_ancient_battlefield", [C(A + "point", "c", "r")], f="medium")
B(189, None, "bg_sp_kitchen", [C(A + "cleaver", "c", "r", mv="r")], f="medium")
B(190, None, "bg_sp_vesuvius", [C(A + "climb", "c", "r")], f="medium", cool=True)
B(191, None, "bg_ancient_battlefield", [C(A + "fight", "cl", "r"), C("leg_shield", "cr", "l", crowd=3)], f="wide")
B(192, None, "bg_alps_pass", [C(A + "stand", "c", "l")], f="wide", cam="pull")
B(193, None, "bg_sp_river", [C(A + "fight", "c", "r")], f="close", dark=0.3)
B(194, None, "bg_sp_vesuvius", [C(A + "bust", "c")], kind="bust", f="close", label=("SPARTACUS", "c. 100 - 71 BC", 0, "Spartacus"))
B(195, None, "bg_alps_pass", [C(A + "stand", "c", "r")], f="wide")
B(196, None, "bg_alps_pass", [C(A + "stand", "c", "r")], f="medium", plate=("FREEDOM", "one march away", None, "freedom"))
B(197, None, "bg_sp_camp", [C(A + "bust", "c")], kind="bust", f="close", warm=True)
B(198, None, "bg_alps_pass", [C(A + "stand", "c", "l")], f="medium", plate=("WHY TURN BACK?", "comment below", None, "Why"), end="back")

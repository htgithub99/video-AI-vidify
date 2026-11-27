import json

STYLE = "Bold cartoon illustration, thick black outlines, flat cel shading, warm muted colours, consistent with a history explainer cartoon"
ANIME = "Anime illustration in the style of a hand-drawn 1990s Japanese TV anime, clean bold black outlines, flat cel shading, soft muted colours, expressive but realistic adult proportions, Victorian England"
SAME = " This is the same person as in the attached reference image: keep the same face shape, nose, eyes, eyebrows, hair colour and skin tone; only the age, clothes and pose change as described."
NOF = " Never draw furniture with a figure (no bed, cot, chair, bench, stool or sofa) unless a pose names it: a lying figure lies flat on nothing, a sitting figure sits on nothing; the scene already has the furniture."


def cast(style, desc, poses, ref=None):
    p = f"{style}. A character pose sheet on a plain pure white background: the same character in {len(poses)} poses side by side in one row (or two rows), each pose clearly separated with empty white space, full body, side view facing right, same scale, feet visible, every companion a pose mentions (horse, baby, rope) drawn with that pose as one connected figure (a pose described as a bust is head and shoulders facing the viewer instead). Character: {desc}. Poses in order: " + "; ".join(f"{i+1}) {d}" for i, (n, d) in enumerate(poses)) + f". Exactly {len(poses)} figures. Each held item appears once, never doubled.{NOF} No text, no captions, no labels, no ground shadows, no background scenery." + (SAME if ref else "")
    return {"prompt": p, "names": [n for n, _ in poses], "ref": ref, "kind": "cast"}


def items(style, its, cols, rows):
    p = f"{style}. A sprite sheet on a plain pure white background with exactly {len(its)} separate items in a {cols}x{rows} grid, read left to right, top to bottom, each item whole and not cut off, empty white space between items, side view facing right, consistent scale within kinds, every person clearly different from the others at a glance. Items in order: " + "; ".join(f"{i+1}) {d}" for i, (n, d, h) in enumerate(its)) + f".{NOF} No text, no captions, no labels, no ground shadows."
    return {"prompt": p, "names": [n for n, _, _ in its], "heights": [h for _, _, h in its], "kind": "items"}


def bg(style, desc):
    return {"prompt": f"{style}. A 16:9 background scene at eye level: {desc}. No people, no animals, no vehicles, no text. Keep the lower third open flat ground where characters can stand.", "kind": "bg"}


Q = {}

JJ = "Jesse James, lean young American man, light brown hair, clean-shaven or light stubble, sharp blue eyes, narrow face"
Q["jesse"] = {
    "j_adult": cast(STYLE, JJ + ", age 25, outlaw in a long tan duster coat over a grey vest, dark wide-brim hat, gun belt", [
        ("walk", "walking with revolver holstered"), ("aim", "aiming a revolver at an enemy off to the right"), ("ride", "galloping on a dark bay horse, holding the reins"),
        ("stand", "standing with arms crossed"), ("bust", "bust, head and shoulders, three-quarter view facing the viewer, calm mouth")]),
    "j_young": cast(STYLE, JJ, [
        ("boy", "boy age 6 in a plain shirt and short trousers, barefoot, standing"), ("boy_run", "boy age 6 running"),
        ("teen_hoe", "farm boy age 15 in a homespun shirt and suspenders holding a hoe"), ("teen_kneel", "boy age 15 kneeling in the dirt with his head down, sad"),
        ("guerrilla", "teen age 17 Confederate bushwhacker in a decorated guerrilla shirt and slouch hat holding a revolver"),
        ("guerrilla_ride", "teen age 17 bushwhacker riding a galloping horse"), ("wounded", "teen age 17 lying flat on his back resting, eyes closed, a bandage around his chest")], ref="j_adult"),
    "j_old": cast(STYLE, JJ + ", age 34, now with a short full beard, in a white shirt, dark waistcoat and trousers, no hat, no gun", [
        ("stand", "standing, looking up at a wall"), ("reach", "standing on a small wooden chair, reaching up with both hands to straighten a picture frame"),
        ("fallen", "lying face down on the floor, fallen"), ("walk", "walking with a gun belt on"), ("bust", "bust, head and shoulders, three-quarter view facing the viewer")], ref="j_adult"),
    "jj_family": items(STYLE, [
        ("robert_preacher", "Robert James, Baptist preacher in a black frock coat holding a Bible, dark hair, 1840s", 1.8),
        ("zerelda_young", "Zerelda James, tall strong young mother in a plain 1850s dress and apron, dark hair in a bun", 1.8),
        ("zerelda_old", "Zerelda Samuel, older tall stern woman in a black dress, her right sleeve empty and pinned up, no right arm", 1.8),
        ("reuben_samuel", "Dr Reuben Samuel, quiet country doctor in a brown coat, grey beard", 1.75),
        ("archie", "Archie, boy age 8 in a nightshirt", 1.25),
        ("zee", "Zee Mimms, slim young woman with auburn hair in a modest blue 1870s dress", 1.65),
        ("frank_teen", "Frank James at 19, Confederate guerrilla with a dark moustache and a black slouch hat", 1.8),
        ("union_militia", "Union militiaman in a blue coat and kepi holding a coiled rope", 1.78)], 4, 2),
    "jj_others": items(STYLE, [
        ("bob_ford", "Bob Ford, skinny young man age 20, slicked dark hair, no hat, brown suit, aiming a revolver to the right", 1.75),
        ("charley_ford", "Charley Ford, older brother, round face, moustache, bowler hat, grey suit", 1.78),
        ("heywood", "Joseph Heywood, bank cashier in a black suit and spectacles, hands raised in refusal", 1.78),
        ("student_rifle", "young medical student in a white shirt firing a rifle to the right", 1.75),
        ("townsman_rifle", "Minnesota shopkeeper in an apron aiming a shotgun to the right", 1.75),
        ("crittenden", "Governor Thomas Crittenden, grey-bearded politician in a black suit", 1.8),
        ("edwards_editor", "newspaper editor John Newman Edwards writing in a notebook, frock coat", 1.78),
        ("pinkerton_throw", "Pinkerton detective in a bowler hat throwing a round iron device to the right", 1.78)], 4, 2),
    "jj_props": items(STYLE, [
        ("sampler", "framed cross-stitch sampler picture with a plain border, no words", 0.4), ("coins", "pile of silver dollar coins", 0.1),
        ("iron_device", "round black iron incendiary device with a short burning fuse", 0.25), ("telegraph_key", "brass telegraph key", 0.15),
        ("dna_vial", "glass laboratory test tube in a rack", 0.2), ("gravestone", "old granite gravestone, blank face", 1.0)], 3, 2),
    "bg_jj_farm": bg(STYLE, "a Missouri farm in the 1850s: a two-room log farmhouse with a stone chimney, a big old coffee bean tree in the yard, hemp fields and a rail fence behind, rolling green hills"),
    "bg_northfield": bg(STYLE, "Northfield, Minnesota in 1876: a main street with a two-storey stone bank building with tall windows, a hardware store and a hotel, dirt street, hitching rails"),
    "bg_mn_swamp": bg(STYLE, "a Minnesota slough at the edge of the woods: tall reeds, willows, muddy water, autumn grey sky"),
    "bg_stage_1880": bg(STYLE, "an 1880s theatre stage seen from the front row: red velvet curtains pulled open, a painted parlour backdrop, footlights along the stage edge"),
}

MR = "Manfred von Richthofen, slim German man, short fair blond hair parted, light blue eyes, clean-shaven, square jaw"
Q["redbaron"] = {
    "mr_adult": cast(STYLE, MR + ", age 24, German pilot in a long dark leather flying coat over a grey uniform, peaked officer cap", [
        ("stand", "standing straight"), ("walk", "walking"), ("medal", "standing proudly with a blue cross medal at his collar, field grey uniform"),
        ("bandage", "standing with a white bandage wrapped around his head"), ("cushion", "walking slowly carrying medals on a black cushion"),
        ("bust", "bust, head and shoulders, three-quarter view facing the viewer, leather flying helmet pushed up")]),
    "mr_young": cast(STYLE, MR, [
        ("boy_hunt", "boy age 10 in a Norfolk jacket aiming a hunting rifle at a deer off to the right"), ("boy_antlers", "boy age 10 holding up a pair of deer antlers"),
        ("cadet", "cadet age 13 in a dark Prussian cadet uniform standing at attention"), ("uhlan_ride", "Uhlan lancer age 20 in a Prussian ulan uniform and square-top czapka helmet riding a horse with a long lance"),
        ("uhlan", "Uhlan lancer age 20 standing holding a long lance"), ("supply", "officer age 22 in field grey handing out a crate of food"),
        ("observer", "observer age 23 in a flying coat holding a map and binoculars")], ref="mr_adult"),
    "mr_people": items(STYLE, [
        ("boelcke", "Oswald Boelcke, German ace pilot with dark brown hair and dark eyes, white scarf, black leather jacket", 1.75),
        ("lothar", "Lothar von Richthofen, younger brother, taller, wavy light brown hair, long grey coat", 1.8),
        ("mother", "Kunigunde von Richthofen, Prussian noblewoman in a dark 1910s dress", 1.68),
        ("father", "Albrecht von Richthofen, Prussian cavalry major with a grey moustache", 1.8),
        ("roy_brown", "Captain Roy Brown, Canadian RAF pilot, dark hair, brown flying coat", 1.78),
        ("wop_may", "Wilfrid May, young Canadian pilot with a boyish face, brown leather coat", 1.75),
        ("aus_gunner", "Australian soldier in a slouch hat firing a Lewis machine gun up into the sky to the right", 1.75),
        ("pallbearers", "six Australian officers carrying a coffin on their shoulders, walking right", 1.8),
        ("hawker", "Major Lanoe Hawker, British pilot with a moustache, leather coat", 1.78),
        ("souvenir_soldier", "British soldier running away with a strip of red fabric", 1.75)], 5, 2),
    "mr_planes": items(STYLE, [
        ("albatros_red", "all-red German Albatros D.III biplane fighter with black iron crosses, flying", 0),
        ("albatros_two", "green German Albatros two-seat reconnaissance biplane with observer in the back seat, flying", 0),
        ("fe2b", "British FE.2b two-seat pusher biplane with RAF roundels, flying", 0),
        ("dh2", "British Airco DH.2 single-seat pusher biplane with roundels, flying", 0),
        ("dr1_red", "all-red Fokker Dr.I triplane with black iron crosses, flying", 0),
        ("dr1_crashed", "all-red Fokker Dr.I triplane crash-landed in a field, nose down, wings broken", 0)], 3, 2),
    "mr_props": items(STYLE, [
        ("silver_cup", "small engraved silver trophy cup", 0.12), ("blue_max", "Pour le Merite medal, blue enamel Maltese cross", 0.06),
        ("antlers", "mounted deer antlers on a wooden plaque", 0.6), ("lewis_gun", "trophy Lewis machine gun hanging on a wall", 1.3),
        ("cups_shelf", "wooden shelf holding many small silver cups in a row", 0.5), ("wreath", "funeral wreath of laurel with a ribbon, no words", 0.8)], 3, 2),
    "bg_mr_bedroom": bg(STYLE, "a Prussian manor bedroom around 1917: wood-panelled walls covered with deer antlers and hunting trophies, a narrow bed, a window with lace curtains"),
    "bg_mr_cadet": bg(STYLE, "a grey Prussian military cadet school courtyard around 1905, brick barracks, a flagpole, gravel parade ground"),
    "bg_mr_airfield": bg(STYLE, "a German WW1 front-line airfield in 1917: canvas aircraft hangar tents, a grass field, wooden huts, poplars"),
    "bg_mr_sky_low": bg(STYLE, "the view from a low-flying plane over the Somme valley in 1918: a winding river, a ridge, shell-cratered fields and trench lines below, grey clouds"),
    "bg_mr_cemetery": bg(STYLE, "a small French village military cemetery at Bertangles in 1918, wooden crosses, a low stone wall, poplars, overcast sky"),
}

SP = "Spartacus, tall muscular Thracian man, dark curly hair, short dark beard, strong nose, olive skin"
Q["spartacus"] = {
    "sp_adult": cast(STYLE, SP + ", age 30, rebel leader in a brown tunic with a bronze Thracian helmet carried, belt, curved sica sword", [
        ("stand", "standing holding a curved sword"), ("point", "pointing forward with his sword, leading"), ("fight", "fighting, sword swinging to the right"),
        ("cleaver", "running with a kitchen cleaver, wearing a plain gladiator loincloth and arm wrap"), ("climb", "climbing down a long rope ladder made of twisted vines, the ladder drawn with him"),
        ("ride", "riding a brown horse, sword raised"), ("bust", "bust, head and shoulders, three-quarter view facing the viewer")]),
    "sp_young": cast(STYLE, SP, [
        ("boy", "boy age 8 in a wool Thracian tunic standing beside a small horse, holding its rope"), ("youth", "young Thracian warrior age 20 with a curved rhomphaia blade and a fox-skin cap"),
        ("auxiliary", "young man age 22 in Roman auxiliary armour"), ("chained", "slave age 24 walking with chained wrists, head down"),
        ("thraex", "gladiator age 26 in thraex armour: griffin-crested helmet, small square shield, curved short sword"), ("sit_cell", "gladiator age 26 sitting on the ground hugging his knees"),
        ("sleep", "man age 24 lying flat asleep on his back, a small snake coiled near his face")], ref="sp_adult"),
    "sp_people": items(STYLE, [
        ("prophetess", "Thracian prophetess of Dionysus, a woman in a long dark robe with ivy in her hair", 1.68),
        ("crixus", "Crixus, big Gaulish gladiator with long red hair and a drooping moustache, bare chest, long sword", 1.85),
        ("oenomaus", "Oenomaus, Gaulish gladiator with a shaved head and blond beard, round shield", 1.8),
        ("batiatus", "Lentulus Batiatus, plump gladiator school owner in a fine tunic, ringed fingers", 1.7),
        ("crassus", "Marcus Crassus, middle-aged Roman general, receding hair, muscled bronze cuirass, red cloak", 1.75),
        ("glaber", "Roman praetor Glaber in a white toga with a red border", 1.75),
        ("pompey", "Pompey, Roman general with a tuft of hair over his forehead, gilded armour", 1.75),
        ("pirate", "Cilician pirate captain with a curved sword and a headscarf", 1.75),
        ("rebel_farm", "runaway farm slave with a pitchfork, ragged tunic", 1.72),
        ("rebel_shepherd", "runaway shepherd with a staff and sheepskin cloak", 1.72)], 5, 2),
    "sp_props": items(STYLE, [
        ("cleaver", "iron butcher cleaver", 0.35), ("meat_spit", "long iron meat spit", 1.0), ("vine_ladder", "long rope ladder of twisted green vines", 4.0),
        ("weapon_wagon", "ox wagon loaded with gladiator weapons and shields", 2.2), ("snake", "coiled snake", 0.3), ("dead_horse", "brown horse lying dead on its side", 0.8)], 3, 2),
    "bg_sp_thrace": bg(STYLE, "a Thracian mountain village around 100 BC: round wooden huts with thatched roofs, wooded mountains, horses' paddock"),
    "bg_sp_ludus": bg(STYLE, "the training yard of a Roman gladiator school in Capua: sand yard, wooden training posts, colonnade with barred cell doors"),
    "bg_sp_cell": bg(STYLE, "inside a small stone gladiator cell: bare stone walls, straw on the floor, one tiny barred window, a heavy wooden door"),
    "bg_sp_kitchen": bg(STYLE, "a Roman school kitchen: brick hearth with fire, hanging pots, butcher table, clay jars"),
    "bg_sp_vesuvius": bg(STYLE, "the green summit of Mount Vesuvius in 73 BC before the eruption: a wide flat crater with rocky cliffs covered in wild grapevines, a view down to the bay of Naples"),
    "bg_sp_camp": bg(STYLE, "a huge rebel camp in the hills of southern Italy at dusk: rough tents, campfires, wagons, olive trees"),
    "bg_sp_trench": bg(STYLE, "a long Roman trench with an earth wall and wooden palisade crossing a snowy hilly landscape in southern Italy, winter"),
    "bg_sp_river": bg(STYLE, "a wide open plain beside the Silarus river in southern Italy, low hills, spring grass, morning"),
    "bg_sp_appian": bg(STYLE, "the Appian Way at dusk: a straight Roman stone road running into the distance, lined on both sides by tall plain wooden crosses as distant silhouettes, red sky"),
}

SH = "Sherlock Holmes, tall very thin English man, sharp hawk-like nose, grey eyes, slicked-back black hair, pale skin"
Q["sherlock"] = {
    "sh_adult": cast(ANIME, SH + ", age 30, in a grey Inverness cape and matching deerstalker cap", [
        ("stand", "standing with a magnifying glass"), ("walk", "walking briskly"), ("point", "pointing to the right, explaining"),
        ("home", "at home in a mouse-grey dressing gown, holding a violin and bow"), ("lie", "lying flat on his back with his hands folded, bored, dressing gown"),
        ("fight", "grappling, arms out to the right, in a dark travelling coat"), ("bust", "bust, head and shoulders, three-quarter view facing the viewer, calm")]),
    "sh_young": cast(ANIME, SH, [
        ("boy", "boy age 10 in a Victorian school suit, reading a book"), ("student", "college student age 19 in a dark academic gown"),
        ("student_bed", "college student age 19 lying flat with a bandaged ankle"), ("priest", "age 34 disguised as a nonconformist clergyman with a broad black hat"),
        ("bookseller", "age 40 disguised as an old hunched book collector with white sideburns, carrying books"),
        ("lab", "age 27 in shirtsleeves holding up a test tube"), ("old_bees", "age 60 with grey hair in a beekeeper's veil hat, holding a smoker")], ref="sh_adult"),
    "sh_people": items(ANIME, [
        ("watson", "Dr John Watson, sturdy Englishman with a brown moustache, bowler hat, brown tweed suit, walking stick", 1.78),
        ("mycroft", "Mycroft Holmes, very large heavy man in a black frock coat, same hawk nose", 1.82),
        ("hudson", "Mrs Hudson, motherly landlady in a dark Victorian dress and white apron, carrying a tea tray", 1.6),
        ("lestrade", "Inspector Lestrade, small thin man with a sallow ferret-like face, brown coat", 1.65),
        ("irene", "Irene Adler, elegant opera singer with dark hair in an evening gown", 1.7),
        ("moriarty", "Professor James Moriarty, tall, thin, round-shouldered, high domed bald forehead, deep-set eyes, black frock coat", 1.85),
        ("moran", "Colonel Sebastian Moran, burly man with a grey moustache aiming an air rifle to the right", 1.8),
        ("trevor_old", "old Mr Trevor, burly country squire with a cauliflower ear, tweed", 1.78),
        ("victor", "Victor Trevor, cheerful young college student", 1.78),
        ("von_bork", "Von Bork, German spy in an evening suit, blond", 1.82)], 5, 2),
    "sh_things": items(ANIME, [
        ("bull_terrier", "bull terrier dog", 0.5), ("hound", "huge black hound with a glowing outline, snarling", 1.0), ("irregulars", "three ragged Victorian street boys walking", 1.3),
        ("hansom", "black Victorian hansom cab pulled by a horse", 2.5), ("wax_bust", "wax bust of a thin man with a hawk nose", 0.6), ("beehive", "white wooden beehive", 0.9),
        ("violin", "violin with bow", 0.6), ("telegram_boy", "Swiss boy messenger running", 1.4), ("cane", "walking stick", 0.9)], 3, 3),
    "bg_sh_221b": bg(ANIME, "the sitting room of 221B Baker Street in 1881: a fireplace with two armchairs, bookshelves, chemistry bench by the window, papers everywhere, gaslight"),
    "bg_sh_street": bg(ANIME, "Baker Street, London in the 1880s on a foggy evening: brick terraced houses, gas lamps, wet cobblestones"),
    "bg_sh_lab": bg(ANIME, "a Victorian hospital chemistry laboratory at St Bartholomew's: long wooden benches with glass retorts, test tubes and Bunsen burners, tall windows"),
    "bg_sh_college": bg(ANIME, "a small Victorian college room: a narrow bed, a desk with books, a tall window over stone quadrangle"),
    "bg_sh_dining": bg(ANIME, "a country house dining room in Norfolk: long table set for dinner with candles, portraits, wood panelling"),
    "bg_sh_falls": bg(ANIME, "the Reichenbach Falls in the Swiss Alps: a narrow wet rock path at the edge of a deep gorge with a huge roaring waterfall, mist, pines"),
    "bg_sh_moor": bg(ANIME, "Dartmoor at night: misty empty moorland, granite tors, a moon behind clouds"),
    "bg_sh_tibet": bg(ANIME, "a Tibetan monastery high in snowy mountains, prayer flags, stone steps"),
    "bg_sh_sussex": bg(ANIME, "a small farm cottage on the Sussex Downs by the sea: chalky green hills, white beehives in a garden, sea cliffs"),
    "bg_sh_lodge": bg(ANIME, "a pretty Victorian villa on a quiet London street at dusk, gas lamp, front garden gate"),
}

BABY = lambda style, desc, ref: {"prompt": f"{style}. On a plain pure white background: this character as a newborn baby at age 0, sitting in a simple wooden crib, front view facing the viewer, a cross angry frown, arms crossed, whole crib visible and not cut off. The baby wears only simple baby clothes of the era (a plain gown or swaddle): no hat, no weapon, no belt, no adult costume. Same face features and hair colour as the reference picture of this character: {desc}. No text, no captions, no ground shadow, no room behind.", "names": ["baby"], "ref": ref, "kind": "cast"}
Q["jesse"]["j_baby"] = BABY(STYLE, JJ, "j_adult")
Q["redbaron"]["mr_baby"] = BABY(STYLE, MR, "mr_adult")
Q["spartacus"]["sp_baby"] = BABY(STYLE, SP, "sp_adult")
Q["sherlock"]["sh_baby"] = BABY(ANIME, SH, "sh_adult")
json.dump(Q, open("/home/claude/four/assets_queue.json", "w"), ensure_ascii=False, indent=1)
print({k: len(v) for k, v in Q.items()}, sum(len(v) for v in Q.values()))

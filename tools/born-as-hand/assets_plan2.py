import json
import sys

sys.path.insert(0, "/home/claude/four")
from assets_plan import STYLE, NOF, items, bg

ANIME_JP = "Anime illustration in the style of a hand-drawn 1990s Japanese TV anime, clean bold black outlines, flat cel shading, soft muted colours, expressive but realistic adult proportions, feudal Japan around 1600"
ROW = " Draw them in one single row, every figure as tall as possible, from near the top edge to near the bottom edge of the image."


def cast(style, desc, poses):
    p = f"{style}. A character pose sheet on a plain pure white background: the same character in {len(poses)} poses side by side.{ROW} Each pose clearly separated with empty white space, full body, side view facing right, same scale, feet visible, every companion a pose mentions drawn with that pose as one connected figure. Character: {desc}. Poses in order: " + "; ".join(f"{i+1}) {d}" for i, (n, d) in enumerate(poses)) + f". Exactly {len(poses)} figures. Each held item appears once, never doubled.{NOF} No text, no captions, no labels, no ground shadows, no background scenery."
    return {"prompt": p, "names": [n for n, _ in poses], "kind": "cast"}


def bust(style, desc):
    return {"prompt": f"{style}. {desc}. One single large bust portrait, head and shoulders only, three-quarter view facing the viewer, calm mouth, centred, filling most of the image height, on a plain pure white background. No text, no letters, no frame, no other people, no shadow on the ground.", "names": ["bust"], "kind": "cast"}


def baby(style, desc):
    return {"prompt": f"{style}. On a plain pure white background: {desc} as a newborn baby at age 0, sitting in a simple wooden crib, front view facing the viewer, a cross angry frown, arms crossed, whole crib visible and centred, filling most of the image height. No text.", "names": ["baby"], "kind": "cast"}


Q = {}
AU = "Audie Murphy, small slim American boy-faced young man, wavy reddish-brown hair, freckles, hazel eyes, boyish round face"
Q["audie"] = {
    "au_kid": cast(STYLE, AU + ", age 10, in patched faded overalls and a torn shirt, barefoot", [("stand", "standing, hands in pockets"), ("aim", "aiming an old single-shot rifle at something off to the right"), ("pick", "bent over picking cotton, dragging a long cotton sack")]),
    "au_teen": cast(STYLE, AU + ", age 16, in a worn work shirt and trousers, old cap", [("stand", "standing, sad, head slightly down"), ("walk", "walking with a small cloth bag"), ("fist", "standing with clenched fists, angry")]),
    "au_gi": cast(STYLE, AU + ", age 18, US Army WW2 infantry private in olive drab uniform, M1 steel helmet, M1 rifle", [("walk", "walking carrying his rifle"), ("aim", "aiming his rifle off to the right"), ("throw", "throwing a hand grenade forward")]),
    "au_sgt": cast(STYLE, AU + ", age 19, US Army WW2 sergeant in olive drab field jacket, M1 helmet, carbine", [("stand", "standing at ease with his carbine"), ("run", "running forward with his carbine"), ("phone", "holding a field telephone handset to his ear, shouting")]),
    "au_lt": cast(STYLE, AU + ", age 19, US Army second lieutenant in a winter olive drab overcoat, M1 helmet", [("stand", "standing in snow gear, tired"), ("limp", "limping, his right leg bloody, carbine in hand"), ("salute", "standing at attention, saluting")]),
    "au_star": cast(STYLE, AU + ", age 30, Hollywood film actor in the 1950s", [("suit", "standing in a smart grey 1950s suit and tie"), ("cowboy", "in a western cowboy costume with hat, revolver holstered, standing"), ("lie", "lying flat on his back, eyes open, in pyjamas, a pistol beside his hand")]),
    "au_bust": bust(STYLE, AU + ", age 20, US Army lieutenant in olive drab uniform with medals and ribbons on his chest, garrison cap"),
    "au_baby": baby(STYLE, "a red-haired freckled American"),
    "au_people": items(STYLE, [
        ("mother", "tired thin 1930s Texas sharecropper mother in a faded print dress and apron", 1.65),
        ("father", "lanky 1930s Texas sharecropper father in overalls and a battered hat", 1.8),
        ("sister", "young woman age 20 in a 1940s dress, holding a paper", 1.65),
        ("kids", "three small barefoot poor children in ragged clothes standing together", 1.1),
        ("tipton", "US Army WW2 soldier, friendly older man with a moustache, M1 helmet", 1.8),
        ("recruiter", "1940s US Army recruiting sergeant in uniform", 1.8),
        ("reporter", "1940s press photographer with a big flash camera", 1.75),
        ("wife", "1950s young woman in a neat blouse and skirt", 1.65),
    ], 4, 2),
    "au_things": items(STYLE, [
        ("cotton_sack", "long canvas cotton-picking sack, half full", 0.6),
        ("medal", "Medal of Honor: gold star on a light blue ribbon", 0.2),
        ("magazine", "1945 picture magazine on a table, cover photo of a young soldier, no letters", 0.4),
        ("camera", "1950s movie camera on a tripod", 1.6),
        ("gravestone", "plain white military headstone, no letters", 0.9),
        ("plane", "small 1960s twin-engine business aeroplane flying", 2.6),
    ], 3, 2),
    "bg_au_cotton": bg(STYLE, "a Texas cotton field in the 1930s with a small leaning wooden sharecropper shack with a tin roof, flat land, dry sky"),
    "bg_au_shack": bg(STYLE, "inside a poor 1930s sharecropper shack: bare board walls, an iron stove, a table, a crowded bed, one small window"),
    "bg_au_recruit": bg(STYLE, "a small 1942 US Army recruiting office: desk, flags, enlistment posters with pictures only, wooden floor"),
    "bg_au_anzio": bg(STYLE, "the Anzio beachhead in 1944: flat muddy fields with foxholes, sandbags, broken farmhouses, grey sky"),
    "bg_au_hill": bg(STYLE, "a dry rocky hill in southern France in summer 1944 with vineyards, scrub and a stone wall"),
    "bg_au_hollywood": bg(STYLE, "a 1950s Hollywood film studio backlot: a western town film set with a camera crane and lights"),
    "bg_au_bedroom": bg(STYLE, "a 1950s bedroom at night with a bedside lamp switched on, a bed, curtains, dark blue light"),
    "bg_au_arlington": bg(STYLE, "Arlington National Cemetery: green lawns with rows of plain white headstones, trees, clear morning"),
    "bg_au_fog": bg(STYLE, "forested Virginia mountains in thick fog and rain, dark clouds"),
}
BK = "Billy the Kid, skinny young American with light brown hair, slightly buck front teeth, grey-blue eyes, cheerful face"
Q["billy"] = {
    "bk_boy": cast(STYLE, BK + ", age 12, in a plain shirt, suspenders and short trousers", [("stand", "standing, smiling"), ("read", "standing reading a book"), ("sing", "singing with mouth open, arms out")]),
    "bk_teen": cast(STYLE, BK + ", age 15, thin, in a dirty shirt and cap", [("scared", "standing scared, hands raised a little"), ("climb", "climbing up inside a brick chimney, only legs and body visible, drawn with the chimney"), ("run", "running away")]),
    "bk_kid": cast(STYLE, BK + ", age 18, cowboy in a wide grey sombrero-style hat, vest, bandana, gun belt", [("stand", "standing, smiling"), ("draw", "drawing a revolver, aiming off to the right"), ("ride", "riding a brown horse, holding the reins")]),
    "bk_kid2": cast(STYLE, BK + ", age 21, outlaw in a wide grey hat, vest and gun belt", [("rifle", "standing holding a Winchester rifle"), ("chains", "standing in leg irons and chains, grinning"), ("socks", "walking in socks, no boots, carrying a butcher knife, in the dark")]),
    "bk_bust": bust(STYLE, BK + ", age 20, in a wide grey hat and a dark vest, slight grin"),
    "bk_baby": baby(STYLE, "a light-haired Irish-American"),
    "bk_people": items(STYLE, [
        ("catherine", "cheerful Irish-American woman in a plain 1870s dress, curly hair, laughing", 1.65),
        ("joseph", "small boy age 8 in 1870s clothes", 1.2),
        ("antrim", "stern thin man in an 1870s miner's clothes and hat", 1.8),
        ("sheriff", "1870s town sheriff with a badge and moustache", 1.8),
        ("cahill", "big burly blacksmith in a leather apron, angry", 1.9),
        ("tunstall", "young English rancher age 24 in a tweed jacket and hat, kind face", 1.8),
        ("garrett", "very tall thin 1880s lawman with a black moustache, black hat, sheriff badge", 1.95),
        ("wallace", "1880s governor with a grey beard in a black frock coat", 1.8),
        ("olinger", "big mean deputy with a double-barrelled shotgun", 1.85),
        ("regulators", "four armed cowboys standing together", 1.8),
    ], 5, 2),
    "bk_things": items(STYLE, [
        ("newspaper", "folded old newspaper, no readable letters", 0.3),
        ("letter", "handwritten letter on paper, no readable letters", 0.3),
        ("tintype", "small old tin photograph in a frame showing young men playing croquet", 0.3),
        ("grave", "simple wooden grave marker in a fenced plot, no letters", 1.0),
        ("burning_house", "adobe house on fire with flames from the windows", 4.0),
        ("stone_hut", "small stone hut in the snow", 3.0),
    ], 3, 2),
    "bg_bk_santafe": bg(STYLE, "Santa Fe plaza in the 1870s: adobe buildings with wooden porches, a church tower, dirt square"),
    "bg_bk_silver": bg(STYLE, "Silver City, New Mexico in the 1870s: a mining town street with wooden saloons, hills with mine shafts"),
    "bg_bk_lincoln": bg(STYLE, "Lincoln, New Mexico in 1878: one long dirt street with adobe stores, a two-storey adobe courthouse, mountains"),
    "bg_bk_road": bg(STYLE, "a lonely dirt road through juniper hills in New Mexico, late afternoon"),
    "bg_bk_snow": bg(STYLE, "a snowy New Mexico plain at dawn with low hills, frozen ground"),
    "bg_bk_maxwell": bg(STYLE, "a dark adobe bedroom at night with a bed, a doorway lit by moonlight, a wooden chair"),
    "bg_bk_dance": bg(STYLE, "a lively Mexican-American dance hall in Fort Sumner in 1880: adobe walls, lanterns, a fiddle player's stool"),
}
MU = "Miyamoto Musashi, a tall rugged Japanese swordsman with untidy long black hair tied loosely back, thick dark eyebrows, intense eyes, strong jaw, an original design"
Q["musashi"] = {
    "mu_boy": cast(ANIME_JP, MU + ", age 13, a wiry tough boy in a plain grey kimono and straw sandals", [("stand", "standing, defiant"), ("staff", "charging forward with a wooden staff raised"), ("write", "writing his name with a brush on a wooden notice board, the board drawn with him")]),
    "mu_ronin": cast(ANIME_JP, MU + ", age 20, wandering ronin in a worn dark blue kimono and hakama, two swords at his belt", [("walk", "walking on a road, hands in his sleeves"), ("draw", "drawing his long sword"), ("strike", "striking down with his long sword")]),
    "mu_two": cast(ANIME_JP, MU + ", age 21, ronin in a dark blue kimono and hakama, headband", [("two", "fighting stance holding two swords, one in each hand"), ("crouch", "crouching, hiding, hand on his sword"), ("run", "running fast with two swords drawn")]),
    "mu_island": cast(ANIME_JP, MU + ", age 28, in a dark kimono with sleeves tied back, headband", [("carve", "sitting carving a long wooden oar with a knife"), ("oar", "standing holding a long wooden sword carved from an oar over his head"), ("boat", "standing in a small wooden rowing boat with an oar, drawn with the boat")]),
    "mu_old": cast(ANIME_JP, MU + ", age 60, old with long grey hair and beard, in a plain brown robe", [("walk", "walking with a wooden staff"), ("paint", "kneeling and painting with an ink brush on paper"), ("write", "kneeling and writing at a low desk")]),
    "mu_bust": bust(ANIME_JP, MU + ", age 28, dark kimono, headband"),
    "mu_baby": baby(ANIME_JP, "a Japanese"),
    "mu_people": items(ANIME_JP, [
        ("father", "stern Japanese martial artist father with a moustache in a dark kimono, holding an iron jitte", 1.75),
        ("dorin", "kind elderly Buddhist priest with shaved head in grey robes", 1.6),
        ("kihei", "proud samurai in a brown kimono with a katana, arrogant", 1.75),
        ("seijuro", "elegant samurai swordmaster in a fine white and black kimono", 1.75),
        ("students", "five samurai students with swords, spears and bows standing together", 1.75),
        ("kojiro", "handsome samurai with long hair in a red kimono, holding a very long sword", 1.8),
        ("lord", "Japanese lord in formal court robes, seated pose standing", 1.7),
        ("crowd", "group of Japanese villagers watching", 1.6),
    ], 4, 2),
    "mu_things": items(ANIME_JP, [
        ("notice", "wooden notice board on a post with a paper sign, no letters", 1.8),
        ("pine", "huge old pine tree", 8.0),
        ("scabbard", "a sword scabbard floating on water", 0.9),
        ("shrike", "Japanese ink painting of a shrike bird on a dry branch, on a hanging scroll", 1.4),
        ("book", "an old Japanese bound book and an ink stone with a brush", 0.3),
        ("boat", "small empty wooden rowing boat", 1.2),
    ], 3, 2),
    "bg_mu_village": bg(ANIME_JP, "a small farming village in Harima province: thatched farmhouses, rice paddies, low green mountains"),
    "bg_mu_temple": bg(ANIME_JP, "a quiet Buddhist mountain temple courtyard: wooden hall, stone lanterns, maple trees"),
    "bg_mu_battle": bg(ANIME_JP, "the misty battlefield of Sekigahara in 1600 after the battle: hills, broken banners on the ground, smoke"),
    "bg_mu_road": bg(ANIME_JP, "an old Japanese highway through cedar forest, stone path, mountains"),
    "bg_mu_kyoto": bg(ANIME_JP, "a field outside Kyoto in 1604 with the city's temple roofs in the distance, autumn grass"),
    "bg_mu_pine": bg(ANIME_JP, "a lonely crossroads with one giant old pine tree at night before dawn, rice fields, mist"),
    "bg_mu_island": bg(ANIME_JP, "a tiny flat sandy island in a strait with calm sea and distant green coast, morning"),
    "bg_mu_cave": bg(ANIME_JP, "inside a quiet rock cave on a mountain with a stone Buddhist carving on the wall, candle light"),
    "bg_mu_castle": bg(ANIME_JP, "the courtyard of Kumamoto castle with its black castle keep, stone walls, raked gravel"),
}
CA = "Julius Caesar, slim Roman man with a sharp face, dark eyes, short dark hair combed forward, clean-shaven"
Q["caesar"] = {
    "ca_boy": cast(STYLE, CA + ", age 15, in a white boy's toga with a purple border", [("stand", "standing, serious"), ("walk", "walking through a street"), ("sad", "standing sad, head down")]),
    "ca_young": cast(STYLE, CA + ", age 20, in a plain tunic and cloak", [("hide", "hiding, crouching, looking back"), ("run", "running away"), ("sick", "lying flat on his back, sick with fever")]),
    "ca_pirate": cast(STYLE, CA + ", age 25, in a fine white tunic and red cloak", [("laugh", "standing, laughing, one hand raised"), ("read", "reading a poem from a scroll out loud"), ("point", "pointing forward, giving an order")]),
    "ca_general": cast(STYLE, CA + ", age 45, Roman general in a muscled bronze cuirass and a long red cloak", [("stand", "standing proudly"), ("point", "pointing forward, commanding"), ("ride", "riding a white horse")]),
    "ca_dictator": cast(STYLE, CA + ", age 55, older with thinning hair and a laurel wreath, in a purple-bordered toga", [("stand", "standing, calm"), ("walk", "walking"), ("fall", "falling, covering his face with his toga")]),
    "ca_bust": bust(STYLE, CA + ", age 50, laurel wreath, purple toga"),
    "ca_baby": baby(STYLE, "a dark-haired Roman"),
    "ca_people": items(STYLE, [
        ("aurelia", "strict elegant Roman mother in a stola, hair in a bun", 1.7),
        ("cornelia", "young Roman wife in a pale blue stola", 1.65),
        ("sulla", "cruel old Roman dictator with a blotchy red face in a toga", 1.75),
        ("pirates", "three Cilician pirates with curved swords and earrings", 1.75),
        ("pompey", "heavy Roman general with a round face and a forelock of hair, red cloak", 1.8),
        ("crassus", "rich bald Roman with a gold ring and a fine toga, holding a money bag", 1.75),
        ("julia", "young Roman woman age 17 in a yellow stola", 1.6),
        ("vercingetorix", "Gallic king with long blond moustache and a winged helmet, on foot", 1.85),
        ("cleopatra", "young Egyptian queen with a gold headdress and white dress", 1.65),
        ("brutus", "serious young Roman senator in a toga with a hidden dagger", 1.8),
        ("senators", "four Roman senators in togas with daggers", 1.75),
    ], 4, 3),
    "ca_things": items(STYLE, [
        ("list", "a long papyrus scroll with a list of names, no readable letters", 0.5),
        ("ship", "small ancient pirate galley with a sail", 4.0),
        ("cross", "plain wooden cross on a beach", 3.0),
        ("statue", "marble statue of Alexander the Great", 2.4),
        ("wall", "a long Roman wooden siege wall with towers", 4.0),
        ("pompey_statue", "marble statue of a Roman general on a pedestal", 3.0),
    ], 3, 2),
    "bg_ca_subura": bg(STYLE, "the crowded Subura district of ancient Rome: tall brick apartment blocks, washing lines, shops, narrow street"),
    "bg_ca_house": bg(STYLE, "the atrium of a modest Roman noble house: pool, columns, painted walls, ancestor masks on the wall"),
    "bg_ca_forum": bg(STYLE, "the Roman Forum around 80 BC: temples with columns, the speakers' platform, stone pavement"),
    "bg_ca_hills": bg(STYLE, "wild hills of the Sabine country in Italy at dusk: rocks, scrub, a shepherd's hut"),
    "bg_ca_sea": bg(STYLE, "a small rocky Aegean island beach with blue sea, around 75 BC"),
    "bg_ca_gaul": bg(STYLE, "dense forests and a river valley in Gaul with a Gallic hill fort of wooden walls in the distance"),
    "bg_ca_alesia": bg(STYLE, "a Gallic hilltop fortress town of Alesia seen from the plain, surrounded by Roman ditches and wooden walls"),
    "bg_ca_rubicon": bg(STYLE, "a small shallow river in northern Italy in winter dawn, pebble banks, bare trees"),
    "bg_ca_egypt": bg(STYLE, "a royal palace hall in Alexandria with painted columns, palms and the sea in the window"),
    "bg_ca_senate": bg(STYLE, "the hall of Pompey's theatre where the Roman senate meets: marble columns, benches, a statue niche"),
}
json.dump(Q, open("/home/claude/four/assets_queue2.json", "w"), ensure_ascii=False, indent=1)
print({k: len(v) for k, v in Q.items()}, sum(len(v) for v in Q.values()))

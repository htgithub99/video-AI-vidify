import json, sys
sys.path.insert(0, "/home/claude/four")
from assets_plan import STYLE, ANIME
from assets_plan2 import ANIME_JP

CROP = "each drawing is a medium shot from the top of the head down to the middle of the chest, as tall as the full image height, the head near the top edge and the chest cut off flat by the bottom edge of the image, shoulders fully inside the drawing"
TAIL = "Exactly 3 drawings side by side in one row, clearly separated with empty white space, same scale, plain pure white background. No hands raised, no held items in front of the face. No text, no captions, no labels, no frame, no shadows, no background scenery."


def hero(style, desc):
    return {"prompt": f"{style}. A character sheet: the same character drawn 3 times; {CROP}. Character: {desc}. Drawings in order: 1) three-quarter view turned to the right, calm, mouth closed; 2) three-quarter view turned to the right, talking, mouth open, serious; 3) three-quarter view turned to the left, worried frown, mouth closed. {TAIL}", "names": ["r", "talk", "l"], "kind": "bust3"}


def people(style, trio):
    return {"prompt": f"{style}. Three different people side by side; {CROP}; every person in three-quarter view turned to the left, mouth closed. People in order: " + "; ".join(f"{i+1}) {d}" for i, (n, d) in enumerate(trio)) + f". {TAIL}", "names": [n for n, _ in trio], "kind": "bust3"}


H = {
 "jesse": (STYLE, "Jesse James, lean young American man, light brown hair, sharp blue eyes, narrow face", {
   "boy": "age 6, a small boy in a plain shirt", "farm": "age 15, farm boy in a homespun shirt and suspenders", "bush": "age 17, Confederate bushwhacker in a decorated guerrilla shirt and slouch hat",
   "adult": "age 25, outlaw in a long tan duster coat over a grey vest, dark wide-brim hat", "old": "age 34, short full beard, white shirt and dark waistcoat, no hat"},
   [("robert", "Robert James, Baptist preacher in a black frock coat, dark hair, 1840s"), ("zerelda", "Zerelda James, tall strong mother in a plain 1850s dress, dark hair in a bun"), ("frank", "Frank James, Confederate guerrilla with a dark moustache and a black slouch hat")],
   [("bob", "Bob Ford, skinny young man age 20, slicked dark hair, brown suit"), ("zee", "Zee Mimms, slim young woman with auburn hair in a modest blue 1870s dress"), ("pinkerton", "Pinkerton detective in a bowler hat and dark suit, stern")]),
 "redbaron": (STYLE, "Manfred von Richthofen, slim German man, short fair blond hair parted, light blue eyes, clean-shaven, square jaw", {
   "boy": "age 10, boy in a brown Norfolk jacket", "cadet": "age 13, in a dark Prussian cadet uniform", "uhlan": "age 20, Uhlan lancer officer in a Prussian ulan uniform and square-top czapka helmet",
   "observer": "age 23, in a brown leather flying coat and goggles pushed up on a flying cap", "adult": "age 24, German fighter pilot in a long dark leather flying coat over a grey uniform, peaked officer cap, Pour le Merite medal at the collar"},
   [("boelcke", "Oswald Boelcke, German ace pilot with dark brown hair, white scarf, black leather jacket"), ("lothar", "Lothar von Richthofen, wavy light brown hair, long grey coat"), ("mother", "Kunigunde von Richthofen, Prussian noblewoman in a dark 1910s dress")],
   [("father", "Albrecht von Richthofen, Prussian cavalry major with a grey moustache"), ("brown", "Captain Roy Brown, Canadian pilot, dark hair, brown flying coat"), ("may", "Wilfrid May, young Canadian pilot with a boyish face, brown leather coat")]),
 "spartacus": (STYLE, "Spartacus, tall muscular Thracian man, dark curly hair, short dark beard, strong nose, olive skin", {
   "boy": "age 8, a boy in a wool Thracian tunic, no beard", "warrior": "age 20, young Thracian warrior in a fox-skin cap, short beard", "slave": "age 24, slave in a torn grey tunic with an iron collar, tired",
   "gladiator": "age 26, gladiator with a bare muscular chest and a leather shoulder guard, no helmet", "adult": "age 30, rebel leader in a brown tunic with a leather chest strap and a red cloak"},
   [("crixus", "Crixus, big Gaulish gladiator with long red hair and a drooping moustache, bare chest"), ("batiatus", "Lentulus Batiatus, plump gladiator school owner in a fine tunic"), ("prophetess", "Thracian prophetess, a woman in a long dark robe with ivy in her hair")],
   [("crassus", "Marcus Crassus, middle-aged Roman general, receding hair, muscled bronze cuirass, red cloak"), ("glaber", "Roman praetor Glaber in a white toga with a red border"), ("oenomaus", "Oenomaus, Gaulish gladiator with a shaved head and blond beard")]),
 "sherlock": (ANIME, "Sherlock Holmes, tall very thin English man, sharp hawk-like nose, grey eyes, slicked-back black hair, pale skin", {
   "boy": "age 10, boy in a Victorian school suit", "student": "age 19, college student in a dark academic gown", "home": "age 27, in a white shirt with rolled sleeves and a dark waistcoat",
   "adult": "age 30, in a grey Inverness cape and matching deerstalker cap", "old": "age 60, grey hair, in a tweed country jacket"},
   [("watson", "Dr John Watson, sturdy Englishman with a brown moustache, brown tweed suit"), ("hudson", "Mrs Hudson, motherly landlady in a dark Victorian dress and white apron"), ("lestrade", "Inspector Lestrade, small thin man with a sallow ferret-like face, brown coat")],
   [("irene", "Irene Adler, elegant opera singer with dark hair in an evening gown"), ("moriarty", "Professor James Moriarty, tall thin, high domed bald forehead, deep-set eyes, black frock coat"), ("mycroft", "Mycroft Holmes, very large heavy man in a black frock coat, hawk nose")]),
 "audie": (STYLE, "Audie Murphy, small slim American boy-faced young man, wavy reddish-brown hair, freckles, hazel eyes, boyish round face", {
   "kid": "age 10, in patched faded overalls and a torn shirt", "teen": "age 16, in a worn work shirt and an old cap", "gi": "age 18, US Army WW2 infantry private in olive drab uniform and M1 steel helmet",
   "sgt": "age 19, US Army WW2 sergeant in an olive drab field jacket and M1 helmet", "lt": "age 19, US Army second lieutenant in a winter olive drab overcoat and M1 helmet", "star": "age 30, Hollywood actor in a smart grey 1950s suit and tie"},
   [("mother", "tired thin 1930s Texas sharecropper mother in a faded print dress"), ("father", "lanky 1930s Texas sharecropper father in overalls and a battered hat"), ("sister", "young woman age 20 in a 1940s dress")],
   [("tipton", "US Army WW2 soldier, friendly older man with a moustache, M1 helmet"), ("recruiter", "1940s US Army recruiting sergeant in uniform"), ("wife", "1950s young woman in a neat blouse")]),
 "billy": (STYLE, "Billy the Kid, skinny young American with light brown hair, slightly buck front teeth, grey-blue eyes, cheerful face", {
   "boy": "age 12, in a plain shirt and suspenders", "teen": "age 15, thin, in a dirty shirt and cap", "kid": "age 18, cowboy in a wide grey sombrero-style hat, vest and bandana", "kid2": "age 21, outlaw in a wide grey hat and dark vest"},
   [("catherine", "cheerful Irish-American woman in a plain 1870s dress, curly hair"), ("tunstall", "young English rancher age 24 in a tweed jacket and hat, kind face"), ("garrett", "very tall thin 1880s lawman with a black moustache, black hat, sheriff badge")],
   [("wallace", "1880s governor with a grey beard in a black frock coat"), ("olinger", "big mean deputy with a moustache and a hat"), ("antrim", "stern thin man in an 1870s miner's clothes and hat")]),
 "musashi": (ANIME_JP, "Miyamoto Musashi, a tall rugged Japanese swordsman with untidy long black hair tied loosely back, thick dark eyebrows, intense eyes, strong jaw, an original design", {
   "boy": "age 13, a wiry tough boy in a plain grey kimono", "ronin": "age 20, wandering ronin in a worn dark blue kimono", "two": "age 21, ronin in a dark blue kimono with a headband",
   "island": "age 28, in a dark kimono with sleeves tied back, headband", "old": "age 60, old with long grey hair and beard, plain brown robe"},
   [("father", "stern Japanese martial artist father with a moustache in a dark kimono"), ("dorin", "kind elderly Buddhist priest with shaved head in grey robes"), ("seijuro", "elegant samurai swordmaster in a fine white and black kimono")],
   [("kojiro", "handsome samurai with long hair in a red kimono"), ("kihei", "proud arrogant samurai in a brown kimono"), ("lord", "Japanese lord in formal court robes")]),
 "caesar": (STYLE, "Julius Caesar, slim Roman man with a sharp face, dark eyes, short dark hair combed forward, clean-shaven", {
   "boy": "age 15, in a white boy's toga with a purple border", "young": "age 20, in a plain tunic and cloak", "pirate": "age 25, in a fine white tunic and red cloak",
   "general": "age 45, Roman general in a muscled bronze cuirass and a long red cloak", "dictator": "age 55, thinning hair and a laurel wreath, purple-bordered toga"},
   [("aurelia", "strict elegant Roman mother in a stola, hair in a bun"), ("sulla", "cruel old Roman dictator with a blotchy red face in a toga"), ("pompey", "heavy Roman general with a round face and a forelock of hair, red cloak")],
   [("cleopatra", "young Egyptian queen with a gold headdress"), ("brutus", "serious young Roman senator in a toga"), ("vercingetorix", "Gallic king with a long blond moustache and a winged helmet")]),
}
PRE = {"jesse": "jb", "redbaron": "rb", "spartacus": "sb", "sherlock": "hb", "audie": "ab", "billy": "kb", "musashi": "mb", "caesar": "cb"}
Q = {}
for v, (style, desc, ages, p1, p2) in H.items():
    q = {f"{PRE[v]}_{a}": hero(style, f"{desc}, {d}") for a, d in ages.items()}
    q[f"{PRE[v]}_p1"] = people(style, p1)
    q[f"{PRE[v]}_p2"] = people(style, p2)
    Q[v] = q
json.dump(Q, open("/home/claude/four/assets_queue3.json", "w"), indent=0)
print({v: len(q) for v, q in Q.items()}, sum(len(q) for q in Q.values()))

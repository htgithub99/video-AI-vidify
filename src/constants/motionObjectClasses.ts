export const MOTION_OBJECT_CLASSES = ["mount", "draft", "wheeled", "tracked", "boat", "aircraft", "artillery", "handWeapon", "machine", "fixture", "handItem", "bird", "smallAnimal"] as const;
export type MotionObjectClass = (typeof MOTION_OBJECT_CLASSES)[number];
export const MOTION_OBJECT_SIZES = ["large", "handheld"] as const;
export type MotionObjectSize = (typeof MOTION_OBJECT_SIZES)[number];
export const MOTION_OBJECT_HANDHELD_CLASSES: readonly MotionObjectClass[] = ["handWeapon", "handItem"];
export const MOTION_OBJECT_HANDHELD: MotionObjectSize = "handheld";
const B = "(?<![\\p{L}\\p{N}])";
const E = "(?![\\p{L}\\p{N}])";
const word = (body: string): RegExp => new RegExp(`${B}(?:${body})${E}`, "iu");
export const MOTION_OBJECT_CLASS_MATCH: readonly (readonly [MotionObjectClass, RegExp])[] = [
  ["tracked", word("tanks?|panzers?|tigers?|shermans?|t-?34s?|armou?red (?:vehicles?|cars?)|half-?tracks?|tracked|xe tăng|thiết giáp|xe bọc thép")],
  ["artillery", word("cannons?|guns? (?:crew|battery|carriage)|field guns?|howitzers?|mortars?|artillery|gatlings?|machine ?guns?|\\d+-?pounders?|pháo|đại bác|súng máy|súng thần công")],
  ["aircraft", word("planes?|aircraft|aeroplanes?|airplanes?|bombers?|fighters?|biplanes?|helicopters?|rockets?|zeppelins?|balloons?|gliders?|máy bay|khinh khí cầu|trực thăng")],
  ["boat", word("boats?|ships?|galleys?|canoes?|rafts?|barges?|junks?|sampans?|frigates?|landing craft|vessels?|thuyền|tàu|ghe|bè|xuồng")],
  ["wheeled", word("wagons?|carts?|carriages?|chariots?|coaches?|jeeps?|trucks?|lorr(?:y|ies)|cars?|automobiles?|bicycles?|motorcycles?|wheelbarrows?|limbers?|caissons?|xe ngựa|xe bò|xe kéo|xe đạp|xe máy|xe tải|ô tô|xe jeep")],
  ["draft", word("oxen|ox|mules?|donkeys?|buffalo(?:es)?|camels?|elephants?|reindeer|yaks?|trâu|bò kéo|la|lừa|lạc đà|voi")],
  ["mount", word("horses?|stallions?|mares?|ponies|pony|steeds?|chargers?|mounts?|ngựa")],
  ["fixture", word("coffins?|caskets?|altars?|shrines?|incense burners?|censers?|(?:a|the|old|stone|village) wells?|tombs?|graves?|gravestones?|temple bells?|bamboo cots?|quan tài|bàn thờ|lư hương|bát hương|giếng|ngôi mộ|nấm mồ|chõng tre|chuông chùa")],
  ["handWeapon", word("rifles?|muskets?|carbines?|pistols?|revolvers?|swords?|sabres?|sabers?|spears?|assegais?|lances?|bows?|crossbows?|axes?|daggers?|bayonets?|shields?|súng trường|súng lục|gươm|kiếm|giáo|mác|cung|nỏ|rìu|dao|khiên|lưỡi lê")],
  ["machine", word("engines?|looms?|presses?|pumps?|turbines?|generators?|cranes?|winches?|mills?|forges?|anvils?|telegraphs?|radios?|typewriters?|computers?|laptops?|smartphones?|microscopes?|satellites?|light ?bulbs?|máy|cối xay|lò rèn|máy in|điện tín")],
  ["bird", word("birds?|chickens?|hens?|roosters?|ducks?|geese|goose|crows?|ravens?|herons?|owls?|eagles?|hawks?|pigeons?|doves?|sparrows?|gulls?|gà|vịt|chim|ngỗng|cò|quạ|đại bàng|diều hâu|bồ câu")],
  ["smallAnimal", word("dogs?|hounds?|pupp(?:y|ies)|cats?|kittens?|pigs?|boars?|hogs?|goats?|sheep|lambs?|rabbits?|hares?|rats?|mice|mouse|snakes?|monkeys?|chó|mèo|lợn|heo|dê|cừu|thỏ|chuột|rắn|khỉ")],
];
export const MOTION_OBJECT_CLASS_NOTES: Record<MotionObjectClass, string> = {
  mount: "Riding animal: body longer than tall, neck rising from the chest to a long head with ears, four legs with a knee that bends forward in front and a hock that bends backward behind, hooves on the ground, tail at the rear; a rider sits on the back with hips over the saddle and the far leg hidden.",
  draft: "Draft animal: heavy barrel body, short strong legs, low head with horns or a long neck as the species needs; harness or yoke links it to the load behind, the traces run from its shoulders to the hitch.",
  wheeled: "Wheeled vehicle: a body or bed carried on visible wheels with spokes or rims that touch the ground; a draft animal or driver sits in front; the shafts, pole or bonnet point in the travel direction.",
  tracked: "Tracked vehicle: a low box hull on two continuous tracks with road wheels inside, a turret on top and the gun barrel pointing forward; a crew member shows from the chest up through the hatch.",
  boat: "Boat: a hull sitting in the water with the waterline across it, bow higher or sharper than the stern, mast with sail or oars where the era needs; people sit or stand inside the hull, not on the water.",
  aircraft: "Aircraft: a fuselage with wings on both sides, tail fin at the rear, propeller or engines where the era needs, wheels or floats under it; it flies above the horizon or rests on the ground on its wheels.",
  artillery: "Artillery piece: a barrel on a carriage with two large spoked wheels on the ground and a trail stretching back; the crew stands at its side or behind with hands on the wheel, the breech or the firing lanyard; muzzle flash and smoke start at the muzzle.",
  handWeapon: "Hand weapon: one piece held in the hand with the grip inside the fist, the blade, barrel or shaft continuing in a straight line from it; a rifle has a stock at the shoulder, a barrel in front and the muzzle pointing where it is aimed.",
  machine: "Machine: a solid base on the ground or a table, the working part (wheel, crank, lever, barrel) attached to it, the operator's hands on the crank, lever or keys.",
  handItem: "Small hand-held item (book, scroll, candle, coins, mirror): drawn at its real small size in or next to the hand that holds it, with its simple recognisable shape.",
  fixture: "Household or ritual object (altar, coffin, well, tomb, bed): a solid shape standing on the ground or floor at its real size next to people, built from simple flat parts with its era and region details.",
  bird: "Bird: a round body with a small head and beak, wings folded along the sides or spread when flying, two thin legs under the body, a tail at the rear.",
  smallAnimal: "Small animal: a body on four short legs, the head at the front with ears and snout as the species needs, tail at the rear; it stands, sits or lies on its support.",
};
const part = (name: string, body: string): { name: string; match: RegExp } => ({ name, match: new RegExp(`(?:^|[_-])(?:${body})s?(?:[_-]|$)`, "i") });
export const MOTION_OBJECT_CLASS_PARTS: Record<MotionObjectClass, readonly { name: string; match: RegExp }[]> = {
  mount: [part("head", "head|neck"), part("legs", "legs?")],
  draft: [part("head", "head|neck"), part("legs", "legs?")],
  wheeled: [part("wheels", "wheels?"), part("body", "body|bed|hull|cab|frame")],
  tracked: [part("tracks", "tracks?|treads?"), part("hull", "hull|body"), part("turret", "turret|gun|barrel")],
  boat: [part("hull", "hull")],
  aircraft: [part("fuselage", "fuselage|body"), part("wings", "wings?")],
  artillery: [part("barrel", "barrel|gun|tube|muzzle|cannon"), part("wheels", "wheels?")],
  handWeapon: [part("grip", "barrel|blade|shaft|stock|grip|handle|bow")],
  machine: [part("base", "base|body|frame")],
  fixture: [part("body", "base|body|frame")],
  handItem: [part("body", "body|frame|handle")],
  bird: [part("head", "head|beak"), part("wings", "wings?|legs?")],
  smallAnimal: [part("head", "head"), part("legs", "legs?")],
};
export const MOTION_OBJECT_ANIMAL_CLASSES: readonly MotionObjectClass[] = ["mount", "draft", "bird", "smallAnimal"];
export const MOTION_OBJECT_PART_CHECK_CLASSES: readonly MotionObjectClass[] = ["mount", "draft", "wheeled", "tracked", "boat", "aircraft", "artillery", "bird", "smallAnimal"];
export const MOTION_OBJECT_CLASS_LEGS: Partial<Record<MotionObjectClass, number>> = { mount: 4, draft: 4, smallAnimal: 4, bird: 2 };
export const MOTION_OBJECT_CLASS_LABEL: Record<MotionObjectClass, string> = {
  mount: "riding animal",
  draft: "draft animal",
  wheeled: "wheeled vehicle",
  tracked: "tracked vehicle",
  boat: "boat",
  aircraft: "aircraft",
  artillery: "artillery piece",
  handWeapon: "hand weapon",
  machine: "machine",
  fixture: "household or ritual object",
  handItem: "hand-held item",
  bird: "bird",
  smallAnimal: "small animal",
};

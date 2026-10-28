export const MOTION_REMOTION_SPACE = {
  REVISION: 4,
  BUILD_REVISION: 5,
  BACKGROUND_REVISION: 3,
  SIMPLE_INTERIOR: /(?:house|room|hut|home)\s+interior|interior\s+(?:of|room)|gian (?:nhà|giữa)|trong (?:nhà|phòng)/iu,
  SIMPLE_WALL: /\b(?:slate|blue[- ]gr[ae]y|gr[ae]y)[^.;,]{0,35}\bwalls?\b|tường (?:xám|ghi)/iu,
  SPECIAL_INTERIOR: /\b(?:palace|castle|cathedral|factory|hospital|spaceship|cave|temple|pagoda)\b|cung điện|lâu đài|bệnh viện|hang động|nhà máy|chùa|đình/iu,
  ROOM_COLORS: { wall: "#414a55", floor: "#454944", line: "#2b3339", trim: "#303841", opening: "#171f28" },
  COFFIN_REVISION: 3,
  OPEN_COFFIN: /\b(?:open|opened|opening|lidless)\b|mở nắp|không nắp|nắp mở/iu,
  CUSTOM_COFFIN: /\b(?:white|red|black|blue|green|gold|silver|metal|glass)\b|trắng|đen|đỏ|xanh|vàng|kính|kim loại/iu,
  COFFIN_COLORS: { wood: "#735039", side: "#49372d", lid: "#886044", ink: "#252730" },
  OPENING_POLICY:
    "The only permitted openings are the doorway, gate or window rectangles explicitly listed in spaceGuide.regions. A threshold is only a low strip on the floor, NOT an opening or window. Do not add decorative black rectangles, side doors, wall panels resembling windows, or a second door from the prose description. Do not draw movable objects mentioned in the location description. Floor lines must converge to the supplied vanishing point; no vertical parallel grid.",
  MAT_WIDTH: 0.34,
  MAT_HEIGHT: 0.075,
  HORIZON: 0.38,
  BACK_GROUND: 0.46,
  FRONT_GROUND: 0.88,
  CHARACTER_HEIGHT: { child: 0.43, adult: 0.6, senior: 0.57 },
  COMPOSITION_GUIDE:
    "The locationComposition is the shared storyboard layout before any asset drawing. All layers use this camera and these normalized ground points, sizes, relations and architectural sockets. Draw only the requested layer, reserving the other subjects' areas. The same physical location and object keep the same design across cuts; detail shots crop this layout. Do not redesign the scene or add furniture to fill free space.",
  COFFIN_GUIDE:
    "Use a tight landscape viewBox about 720x420. A solid CLOSED human-length wooden coffin rests HORIZONTALLY on the floor in shallow three-quarter perspective. The long lid runs diagonally from the broad near end at bottom-left to the narrow far end at top-right: lid corners roughly (70,235),(530,65),(650,145),(240,330). Side panels drop only about 50 pixels below this lid. Add two short supports, no long legs. The whole visible silhouette is wider than tall. Never draw a standing coffin, obelisk, tower, chair, open tray or tall pedestal. Preserve a recognizable tapered closed lid and shallow solid side panels.",
  ALTAR: /\baltar\b|bàn thờ|bàn cúng/iu,
  COFFIN: /\bcoffin\b|quan tài/iu,
  BED: /\bbed\b|giường/iu,
  SEAT: /\b(?:stool|chair|bench)\b|ghế/iu,
  MOVE: /\b(?:walks? to|moves? to|steps? (?:to|toward)|approaches?|retreats?)\b|(?:bước|đi|tiến|lùi) (?:đến|tới|ra|vào|lại)/iu,
  SEATED: /\b(?:sitting|seated|sit|squatting)\b/iu,
  SEATED_HEIGHT: 0.68,
  COMPLEX_VIEW: /\b(?:over[- ]shoulder|upper[- ]body|bust|head[- ]only)\b/iu,
  SIMPLE_VIEW: "standing full body in three-quarter view, arms relaxed, neutral closed mouth",
  GROUND_SEAT: /\b(?:ground|floor|mat)\b|sàn|mặt đất|chiếu/iu,
  BACK: /\b(?:back turned|back to|from behind)\b/iu,
  FEAR: /\b(?:frightened|terrified|afraid|shocked|horrified)\b/iu,
  GUIDE:
    "Use one shared camera for the complete location: eye-level view across a room, vanishing point (0.5,0.38), rear wall/floor seam y=0.38. Floor lines converge to that point; show a substantial floor, not a narrow strip. All coordinates in the supplied spaceGuide are normalized 0..1. Draw each architectural opening EXACTLY at its supplied rectangle; do not draw a second opening elsewhere. Keep the rest of the architecture continuous. People, altars and movable furniture are separate layers. The altar is against the rear wall, actors in the foreground. Use restrained irregular line texture, door jamb thickness and a skirting board, not a blank gray rectangle. Return the supplied floor and socket regions unchanged because the drawing must follow them.",
  OBJECT_GUIDE:
    "The object shares the supplied room camera, with the rear wall/floor seam at y=0.38. Keep a coherent three-quarter projection, recognizable construction and natural proportions. No detached ground slab or unrelated support. A coffin must unmistakably be a closed human-length coffin with a tapered closed lid, side panels and short supports, its LONG axis receding toward the rear wall, never a broad horizontal bench, table, open tray or bowl. An altar is a broad cabinet/table seen from the front with a shallow visible top, never a chair. A low stool has a compact seat and short legs.",
  CHARACTER_GUIDE:
    "Draw this actual person's identity in a natural three-quarter or side view, using the same eye-level camera as the room. Use a tight portrait viewBox around the full person, e.g. 360x900; do not place a tiny person in a 1920x1080 landscape canvas. Rounded pale oval face, small asymmetrical features, adult head about one fifth of full body height, slim shoulders and natural close trouser legs. Head, neck, shoulders, torso and limbs MUST overlap at their joints: no floating head, detached hands or transparent gap between chin/neck/collar. Avoid identical front-facing angular dolls, giant heads, rectangular torsos and clenched fists. Use the requested viewing direction. Mouth stays closed for narrated illustrations. When eyes are visible put open eyes in g id=horror-eyes and closed eyelids in g id=horror-lids opacity=0, same location. Preserve separate props and transparent margins; do not draw a detached ground shadow.",
} as const;

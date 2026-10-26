class FolkText:
    CATALOG = "folk_blocking_catalog.json"
    GROUP = '<g id="%s">%s</g>'
    OCC = '<g data-occ="%d">%s</g>'
    MIRROR = '<g transform="translate(1920 0) scale(-1 1)">%s</g>'
    DESC = "%s. Original reusable illustration with fixed furniture contacts, separate participant roles and continuous day/night geometry."
    CHARACTER_DESC = "%s. %s clothing, %s hair, consistent front/side/back identity and independent sitting/lying postures."
    PROP_DESC = "%s. Original clear silhouette for Vietnamese folk horror illustration; independently movable object, never baked into a character or background."
    PIECE_DESC = "%s. Furniture with measured contact points in the same coordinate system as the fixed scene."
    CONTACT = "%s contact on %s"
    NIGHT = " Night"
    MIRRORED = " Mirrored"
    MANIFEST = "installed.json"
    PLANNED = "planned.json"
    BACKUP = "backup"
    COLLISION = "Refusing to overwrite an asset outside this expansion pack: %s"
    INVALID = "Invalid fixed contact or role binding: %s"
    KEY_RE = r"^[a-z][a-z0-9_]*$"
    PLOT_TITLE = "Fixed interaction library / %s / %s"
    REFERENCES = "docs/video-references/khuatmatkytruyen"
    COVERAGE = "reference-coverage.json"
    REVIEW = "overview_and_selected_frames"
    FAMILIES = {
        "patients": "Two separate floor mats; caregiver between them; hearth and suspended pot at the side.",
        "bedside": "One horizontal bed; separate standing and sitting caregiver positions beside the head.",
        "hospital": "Metal hospital bed; visitor chair clear of the patient; medical shelf at the rear.",
        "grooming": "Subject sits in front; groomer sits or stands on a separate support behind the head.",
        "stairs": "Raised landing connected by visible steps to the ground; people above and below remain on different levels.",
        "rafters": "Standing on the raised daybed beside a column; observer stays on the floor below.",
        "scaffold": "Carpenter on scaffold platform near roof beams; observer on floor below.",
        "cradle": "Infant lies inside the cradle; caregiver stands beside it on the room floor.",
        "mourning": "Body lies on the bier; mourners stand clear beside head or foot.",
        "canopy": "Funeral canopy with rear memorial shelf and open brick yard for mourners.",
        "ritual": "Officiant behind offering table; visitor in front; three distinct object surfaces.",
        "conversation": "Two separate wooden chairs with a low tea table between them.",
        "cards": "Separate player seats around a card table; table occludes lower bodies.",
        "counter": "Seller behind counter, customer in front, ledger and goods on separate surfaces.",
        "repair": "Mechanic behind work counter; customer in the aisle; roller door behind.",
        "doorway": "Inside room and outside threshold have separate ground contacts; bed stays at the side.",
        "rescue": "Survivor lies on a flat bank rock; rescuer stands on dry ground; river behind.",
        "boat": "Rower stands and passenger sits inside the same ferry hull; hull occludes feet.",
        "bamboo": "Bamboo clearing with separate people and a low surface for the offering bowl.",
        "forest": "Clear forest path with front and rear search positions; trees frame the sides.",
        "village": "Highland stilt houses behind a clear village meeting yard.",
        "grave": "Grave mound and tablet behind clear watcher positions; no actor stands inside the mound.",
        "well": "Well mouth with dry standing contacts on each side and a bucket surface at the rim.",
        "shrine": "Banyan roots and small spirit shrine behind clear worshipper ground.",
        "banana": "Banana grove and old hut behind a clear path for two travellers.",
        "field": "Rice fields behind an earthen path and a lone grave mound at the side.",
        "bridge": "Wooden bridge deck has its own ground level above the water; banks remain separate.",
        "kitchen": "Brick hearth with exact pot surface, separate cook position and rear jar shelf.",
        "teaching": "Teacher stands beside board; pupil sits on a drawn bench clear of the teacher.",
        "bell": "Temple bell on a raised landing and separate visitor on lower ground.",
        "hammock": "Person lies inside the stretched hammock; companion stands beside the head."
    }

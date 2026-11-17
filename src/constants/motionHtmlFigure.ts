// How the AI draws its own people and animals. The body numbers depend on the chosen proportion: BODY is the native
// big-head figure; any other proportion sends its own numbers instead (motionProportions), never both.
export const MOTION_HTML_FIGURE = {
  JOIN: "\n",
  INTRO: "FIGURES (your person function draws every person, near and far, from o alone; every size from the person's height H = o.h, no fixed pixel offsets):",
  FACE: "- Face: skin #f8f8f6 (light) or #5c3c28 (dark), dot eyes, angled brows, a curved mouth or an open mouth for shout; the expression option sets them; headgear sits low on the head.",
  LIMBS: "- Body: a torso narrower at the waist, arms and legs as tapered limb shapes bending at elbow and knee, mitten hands, shoes or bare feet; back arm before the torso, front arm after; legs step from o.distance while walking or running (phase = distance / (0.9 * head radius) * PI) and stand still otherwise; the pose option places arms and legs, reachAt or pointAt sends the near hand to a point, and the hold item is drawn in that hand.",
  BODY: "- Big-head proportions (head radius r = H / 4.35): head circle r resting on the collar with no neck (head centre 3.35r above the ground, top 4.35r); torso about 1.6r tall from 0.9r to 2.5r above the ground; legs from the hem at 0.9r down to the shoes (0 to 0.15r), shorter than the torso.",
  ANIMAL: "- Animals: a contoured side silhouette (body, neck, head with ears or horns, tail, four legs with knees and hooves), never a slab; a rider (o.rider) sits on the saddle with the near leg in the stirrup.",
  GROUND: "- GROUND: every foot, hoof, wheel and leg stands on its ground point (o.x, o.y) with a small contact shadow; farther figures stand higher and smaller.",
} as const;

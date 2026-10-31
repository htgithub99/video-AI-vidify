export const MOTION_CAMERA = {
  MODES: ["push", "left", "right", "up", "down", "pull", "follow", "hold"],
  DIRECTION_MODES: ["follow", "push", "pull", "hold"],
  MAX_ZOOM: 0.045,
  SPEED: 0.0037,
  FOLLOW_SPEED: 0.005,
  SAMPLE_FPS: 15,
  BROWSER_SOURCE: (frame: string, modes: string, pace: string): string => `function(input){return (${frame})(input,${modes},${pace});}`,
  ENGINE_SCRIPT: (source: string): string => `\nMotionEngine.cameraFrame = ${source};`,
  SIGNATURE: (engine: string, revision: number): string => `${engine}:camera-${revision}`,
  DIRECTION_PROMPT:
    "CAMERA DIRECTION: scene motion includes camera. In the same drawing response set design.cameraMotion={mode:follow|push|pull|hold,subjectId,focus:{x,y}}. subjectId is the actual SVG layer group of the main action's person, animal or held-object assembly; focus is its initial canvas-space point normalized 0..1. Include descriptive design.placements boxes for this subject and essential partners so the camera protects them; these boxes describe the SVG and never determine its layout. Follow visible travel, push gently toward an important gesture/expression, pull for a reveal; hold for quiet moments, maps or crowded frames with no clear subject. The renderer follows the subject's authored group/ancestor transforms, not individual blinking eyes or swinging limbs. Keep its whole travel inside the SVG canvas with breathing room. Do not bake a camera pan/zoom into SVG or animate the background to simulate a camera. One slow motivated move per continuous shot, no arbitrary direction changes. Off means hold. This metadata never repositions artwork.",
} as const;

MotionKit.frame(ctx, { x: 640, groundY: 560, zoom: 1.35, shot: 'wide' });
MotionKit.terrain(ctx, { kind: 'sky', time: 'dawn', x: 640, y: -260, width: 2200, height: 620, seed: 1 });
MotionKit.terrain(ctx, { kind: 'ground', ground: 'grass', x: 640, y: 300, width: 2200, height: 60, seed: 2 });
MotionKit.scenery(ctx, { kind: 'river', x: 640, y: 352, width: 2000, height: 120, seed: 3 });
MotionKit.terrain(ctx, { kind: 'ground', ground: 'mud', x: 640, y: 472, width: 2200, height: 520, seed: 4 });
MotionKit.stage(ctx, [
  { fn: 'vehicle', kind: 'trebuchet', x: 980, y: 330, p: 18, facing: -1, mark: 'engine', seed: 5 },
  { fn: 'person', x: 1040, y: 332, p: 14, facing: -1, seed: 6 },
  { fn: 'person', x: lerp(300, 420, p), y: 560, r: 34, facing: 1, pose: 'walk', distance: lerp(0, 120, p), mark: 'hero', seed: 7 },
]);

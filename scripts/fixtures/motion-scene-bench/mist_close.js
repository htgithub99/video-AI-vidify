MotionKit.frame(ctx, { x: 640, groundY: 700, zoom: 1, shot: 'close' });
MotionKit.terrain(ctx, { kind: 'sky', time: 'night', x: 640, y: -260, width: 2200, height: 700, seed: 1 });
MotionKit.terrain(ctx, { kind: 'ground', ground: 'mud', x: 640, y: 440, width: 2200, height: 560, seed: 2 });
MotionKit.stage(ctx, [
  { fn: 'person', x: lerp(400, 500, p), y: 700, r: 80, facing: 1, pose: 'walk', distance: lerp(0, 100, p), expression: 'worried', mark: 'hero', seed: 3 },
  { fn: 'person', x: 800, y: 700, r: 80, facing: -1, pose: p < 0.5 ? 'stand' : 'point', mark: 'friend', seed: 4 },
]);
MotionKit.cloud(ctx, { x: lerp(200, 700, p), y: 380, r: 110, stretch: 2, flat: true, seed: 5 });
MotionKit.cloud(ctx, { x: 640, y: 20, r: 120, stretch: 2, flat: true, seed: 6 });

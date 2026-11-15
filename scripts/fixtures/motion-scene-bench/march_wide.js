MotionKit.frame(ctx, { x: lerp(560, 760, p), groundY: 560, zoom: 1, shot: 'wide' });
MotionKit.terrain(ctx, { kind: 'sky', time: 'day', x: 640, y: -260, width: 2400, height: 650, seed: 1 });
MotionKit.terrain(ctx, { kind: 'hills', x: 640, y: 380, width: 2400, height: 90, layers: 2, seed: 2 });
MotionKit.terrain(ctx, { kind: 'ground', ground: 'grass', x: 640, y: 400, width: 2400, height: 600, seed: 3 });
MotionKit.stage(ctx, [
  { fn: 'person', x: lerp(300, 700, p), y: 560, r: 30, facing: 1, pose: 'walk', distance: lerp(0, 400, p), hold: 'spear', mark: 'hero', seed: 4 },
  { fn: 'person', x: lerp(220, 620, p), y: 556, r: 30, facing: 1, pose: 'walk', distance: lerp(0, 400, p), hold: 'spear', seed: 5 },
  { fn: 'animal', kind: 'horse', x: lerp(500, 900, p), y: 540, p: 28, facing: 1, pose: 'walk', rider: { seed: 6 }, mark: 'king', seed: 7 },
  { fn: 'person', x: 900, y: 200, r: 30, facing: -1, pose: 'stand', mark: 'floater', seed: 8 },
  { fn: 'tree', kind: 'oak', x: 1150, y: 420, r: 40, seed: 9 },
]);

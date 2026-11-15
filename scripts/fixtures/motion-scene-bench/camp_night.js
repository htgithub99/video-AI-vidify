MotionKit.frame(ctx, { x: 640, groundY: 600, zoom: 1, shot: 'medium' });
MotionKit.terrain(ctx, { kind: 'sky', time: 'night', x: 640, y: -260, width: 2200, height: 700, seed: 1 });
MotionKit.terrain(ctx, { kind: 'ground', ground: 'mud', x: 640, y: 440, width: 2200, height: 560, seed: 2 });
MotionKit.stage(ctx, [
  { fn: 'prop', kind: 'wagonFort', x: 640, y: 470, count: 4, p: 26, facing: 1, seed: 3 },
  { fn: 'prop', kind: 'chain', x: 1000, y: 650, width: 160, sag: 6, p: 30, seed: 4 },
  { fn: 'prop', kind: 'campfire', x: 640, y: 610, p: 40, mark: 'fire', seed: 6 },
  { fn: 'prop', kind: 'rope', x: 790, y: 640, p: 40, mark: 'rope', seed: 7 },
  { fn: 'person', x: lerp(420, 520, p), y: 600, r: 40, pose: p < 0.5 ? 'sit' : 'stand', facing: 1, mark: 'hero', seed: 8 },
  { fn: 'person', x: 880, y: 602, r: 40, facing: -1, pose: 'point', mark: 'sergeant', seed: 9 },
]);
MotionKit.scenery(ctx, { kind: 'mistBand', x: 640, y: 470, r: 60, width: 2200, seed: 9 });
MotionKit.effect(ctx, { kind: 'night', strength: 1 });
MotionKit.stage(ctx, [
  { fn: 'person', x: 260, y: 640, r: 40, facing: 1, pose: 'stand', barefoot: true, wounded: true, mark: 'refugee', seed: 21 },
]);

MotionKit.frame(ctx, { x: lerp(640, 680, p), groundY: 588, zoom: lerp(1, 1.08, p), shot: 'medium' });
MotionKit.terrain(ctx, { kind: 'sky', time: 'night', x: 640, y: -260, width: 2200, height: 650, seed: 1 });
MotionKit.terrain(ctx, { kind: 'hills', x: 640, y: 332, width: 2200, height: 36, layers: 1, seed: 2 });
MotionKit.scenery(ctx, { kind: 'river', x: 880, y: 344, width: 1900, height: 300, seed: 3 });
MotionKit.terrain(ctx, { kind: 'ground', ground: 'mud', x: -260, y: 430, width: 960, height: 580, seed: 4 });
MotionKit.stage(ctx, [
  { fn: 'prop', kind: 'bridge', x: 760, y: 594, width: 900, height: 120, seed: 5 },
  { fn: 'effect', kind: 'fire', x: 980, y: 336, r: 12, seed: 6, mark: 'farfire' },
  { fn: 'effect', kind: 'fire', x: 1120, y: 470, r: 14, seed: 7, mark: 'wetfire' },
  { fn: 'prop', kind: 'torch', x: 300, y: 586, p: 36, seed: 8 },
  { fn: 'person', x: lerp(560, 640, p), y: 588, r: 42, facing: 1, pose: 'walk', distance: lerp(0, 80, p), mark: 'hero', seed: 9 },
  { fn: 'person', x: 820, y: 588, r: 42, facing: -1, pose: 'fight', mark: 'rider', seed: 10 },
  { fn: 'person', x: 1050, y: 520, r: 30, facing: -1, pose: 'stand', mark: 'wetman', seed: 11 },
]);
MotionKit.effect(ctx, { kind: 'night', strength: 1 });

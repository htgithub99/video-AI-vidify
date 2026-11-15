MotionKit.frame(ctx, { x: 640, groundY: 600, zoom: 1, shot: 'medium' });
MotionKit.terrain(ctx, { kind: 'sky', time: 'day', x: 640, y: -260, width: 2200, height: 700, seed: 1 });
MotionKit.terrain(ctx, { kind: 'ground', ground: 'grass', x: 640, y: 440, width: 2200, height: 560, seed: 2 });
const ph = MotionKit.phase(p, 3);
MotionKit.stage(ctx, [
  { fn: 'prop', kind: 'arrows', x: 640, y: 640, count: 8, p: 40, mark: 'arrows', seed: 3 },
  { fn: 'person', x: lerp(380, 480, ph.index === 0 ? ph.k : 1), y: 600, r: 40, pose: ph.index === 0 ? 'walk' : ph.index === 1 ? 'point' : 'stand', facing: 1, mark: 'hero', seed: 8 },
  { fn: 'person', x: 900, y: 602, r: 40, facing: -1, pose: 'stand', mark: 'sergeant', seed: 9 },
  { fn: 'animal', kind: 'horse', x: 1080, y: 604, p: 40, facing: -1, pose: 'stand', mark: 'horse', seed: 10 },
]);

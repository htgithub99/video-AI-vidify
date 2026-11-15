MotionKit.frame(ctx, { x: 640, groundY: 640, zoom: 1, shot: 'medium' });
MotionKit.terrain(ctx, { kind: 'sky', time: 'day', x: 640, y: -260, width: 2200, height: 700, seed: 1 });
MotionKit.terrain(ctx, { kind: 'ground', ground: 'grass', x: 640, y: 560, width: 2200, height: 440, seed: 2 });
MotionKit.chart(ctx, { kind: 'bar', x: 120, y: 120, width: 360, height: 220, values: [3, 5, 8], labels: ['1200', '1240', '1280'], grow: Math.min(1, p * 2) });
MotionKit.icon(ctx, { kind: 'coin', x: 640, y: 200, r: 44, pop: Math.min(1.2, p * 3) });
MotionKit.icon(ctx, { kind: 'swords', x: 780, y: 200, r: 44, pop: Math.min(1.2, p * 3) });
MotionKit.arrow(ctx, { from: [660, 260], to: [980, 380], curve: 0.2, width: 8, grow: p });
MotionKit.box(ctx, { x: 900, y: 90, width: 280, height: 90, text: 'Trade grows', size: 26 });
MotionKit.timeline(ctx, { x: 160, y: 470, width: 960, items: [{ year: 1206, label: 'Empire' }, { year: 1241, label: 'Mohi' }, { year: 1279, label: 'Song' }], progress: p });
MotionKit.stage(ctx, [
  { fn: 'person', x: lerp(420, 520, p), y: 640, r: 46, facing: 1, pose: 'point', pointAt: [700, 200], mark: 'hero', seed: 3 },
  { fn: 'prop', kind: 'scroll', x: 820, y: 640, p: 46, mark: 'scroll', seed: 4 },
]);
MotionKit.scenery(ctx, { kind: 'pond', x: 1080, y: 610, width: 260, height: 50, seed: 5 });

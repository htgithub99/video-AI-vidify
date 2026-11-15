MotionKit.frame(ctx, { x: 640, groundY: 600, zoom: 1, shot: 'wide' });
MotionKit.terrain(ctx, { kind: 'sky', time: 'day', x: 640, y: -260, width: 2200, height: 680, seed: 1 });
MotionKit.terrain(ctx, { kind: 'ground', ground: 'sand', x: 640, y: 420, width: 2200, height: 580, seed: 2 });
MotionKit.building(ctx, { kind: 'pyramid', x: 1050, y: 430, p: 12, width: 420, mark: 'pyramid' });
MotionKit.building(ctx, { kind: 'palace', x: 220, y: 440, p: 14, mark: 'palace' });
MotionKit.scenery(ctx, { kind: 'ford', x: 640, y: 470, width: 600, height: 40, seed: 3 });
MotionKit.stage(ctx, [
  { fn: 'prop', kind: 'spear', x: 300, y: 640, p: 30, mark: 'spear', seed: 4 },
  { fn: 'prop', kind: 'axe', x: 480, y: 650, p: 30, mark: 'axe', seed: 5 },
  { fn: 'prop', kind: 'scroll', x: 600, y: 655, p: 30, mark: 'scroll', seed: 6 },
  { fn: 'prop', kind: 'bow', x: 700, y: 650, p: 30, mark: 'bow', seed: 7 },
  { fn: 'prop', kind: 'bucket', x: 800, y: 650, p: 30, mark: 'bucket', seed: 8 },
  { fn: 'prop', kind: 'stonePile', x: 920, y: 655, p: 30, mark: 'stonepile', seed: 9 },
  { fn: 'prop', kind: 'zzgizmo', x: 1100, y: 650, p: 30, seed: 10 },
  { fn: 'prop', kind: 'pike', x: 1180, y: 690, p: 30, mark: 'pike', seed: 14 },
  { fn: 'prop', kind: 'letter', x: 1040, y: 690, p: 30, mark: 'letter', seed: 15 },
  { fn: 'prop', kind: 'crossbow', x: 200, y: 690, p: 30, mark: 'crossbow', seed: 16 },
  { fn: 'person', x: lerp(380, 460, p), y: 600, r: 34, pose: 'walk', distance: lerp(0, 80, p), facing: 1, mark: 'hero', seed: 11 },
]);
MotionKit.crowd(ctx, { formation: 'ring', mounted: true, x: 640, y: 520, count: 6, spread: 260, p: 14, seed: 12, mark: 'riders' });
MotionKit.volley(ctx, { kind: 'fireball', from: [1200, 300], to: [500, 560], count: 3, spread: 60, progress: p, r: 10, seed: 13 });

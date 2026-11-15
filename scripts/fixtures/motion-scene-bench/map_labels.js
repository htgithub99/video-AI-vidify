MotionKit.frame(ctx, { shot: 'map', x: 640, y: 360, zoom: 1 });
ctx.fillStyle = '#e2d3b0'; ctx.fillRect(0, 0, 1280, 720);
ctx.fillStyle = '#b9cfd6'; ctx.beginPath(); ctx.moveTo(0, 560); ctx.bezierCurveTo(400, 500, 800, 620, 1280, 540); ctx.lineTo(1280, 720); ctx.lineTo(0, 720); ctx.closePath(); ctx.fill();
MotionKit.arrow(ctx, { from: [320, 220], to: [880, 400], curve: 0.2, width: 9, color: '#8a2f26', grow: p });
ctx.fillStyle = '#26201c'; ctx.beginPath(); ctx.arc(320, 220, 12, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(880, 400, 12, 0, Math.PI * 2); ctx.fill();
MotionKit.label(ctx, { x: 320, y: 180, text: 'Marcianople', size: 14 });
MotionKit.label(ctx, { x: 880, y: 360, text: 'Adrianople', size: 24 });
MotionKit.stage(ctx, [{ fn: 'prop', kind: 'banner', x: lerp(320, 820, p), y: lerp(250, 420, p), p: 14, mark: 'hero', seed: 2 }]);

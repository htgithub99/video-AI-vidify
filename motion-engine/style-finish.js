(function (root) {
  "use strict";
  const ME = root.MotionEngine;
  if (!ME) return;
  const FX = root.MotionStyleFinishText;
  const hex = (h) => {
    const s = String(h || FX.EMPTY).replace(FX.HEX_PREFIX_RE, FX.EMPTY);
    const v =
      s.length === 3
        ? s
            .split(FX.EMPTY)
            .map((ch) => ch + ch)
            .join(FX.EMPTY)
        : s.padEnd(6, FX.ZERO);
    return [parseInt(v.slice(0, 2), 16) / 255, parseInt(v.slice(2, 4), 16) / 255, parseInt(v.slice(4, 6), 16) / 255];
  };
  const num = (v, d) => (Number.isFinite(Number(v)) ? Number(v) : d);
  const compile = (gl, type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || String(type));
    return s;
  };
  ME.styleFinishActive = (finish) => !!finish && typeof finish === FX.OBJECT && Object.keys(finish).some((k) => !FX.NON_VISUAL.includes(k));
  ME.createStyleFinish = (finish, W, H) => {
    if (!ME.styleFinishActive(finish)) return null;
    if (typeof OffscreenCanvas === FX.UNDEFINED && typeof document === FX.UNDEFINED) return null;
    const canvas = ME.makeCanvas(W, H);
    if (!canvas) return null;
    const gl = canvas.getContext(FX.WEBGL2, { preserveDrawingBuffer: true, antialias: false, premultipliedAlpha: false });
    if (!gl) return null;
    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, FX.VERTEX));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FX.FRAGMENT));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) || FX.WEBGL2);
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, FX.POSITION);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    const u = (name) => gl.getUniformLocation(prog, name);
    const f = finish;
    const scale = H / 1080;
    const pal = (f.palette || []).slice(0, FX.MAX_PALETTE).map(hex);
    const flat = new Float32Array(FX.MAX_PALETTE * 3);
    pal.forEach((c, i) => flat.set(c, i * 3));
    const edge = f.edges || {};
    const half = f.halftone || {};
    const mono = f.mono || {};
    const film = f.film || {};
    const line = f.lineArt || {};
    const tint = f.tint || {};
    const dark = f.darkness || {};
    gl.uniform2f(u(FX.U_RES), W, H);
    gl.uniform1f(u(FX.U_PIXEL), num(f.pixel, 0) * scale);
    gl.uniform3fv(u(FX.U_PAL), flat);
    gl.uniform1i(u(FX.U_PAL_COUNT), pal.length);
    gl.uniform1f(u(FX.U_PAL_MIX), num(f.paletteMix, pal.length ? 1 : 0));
    gl.uniform1i(u(FX.U_DITHER), FX.DITHER[f.dither] || 0);
    gl.uniform1f(u(FX.U_DITHER_AMT), num(f.ditherAmount, 0.18));
    gl.uniform1f(u(FX.U_POSTERIZE), num(f.posterize, 0));
    const ec = hex(edge.color || FX.COLOR_1A1A1A);
    gl.uniform4f(u(FX.U_EDGE), ec[0], ec[1], ec[2], num(edge.strength, 0));
    gl.uniform1f(u(FX.U_EDGE_WIDTH), num(edge.width, 1.2) * scale);
    gl.uniform1i(u(FX.U_PAPER), FX.PAPER[f.paper && f.paper.kind] || 0);
    gl.uniform1f(u(FX.U_PAPER_AMT), num(f.paper && f.paper.strength, 0));
    gl.uniform3fv(u(FX.U_PAPER_COLOR), hex((f.paper && f.paper.color) || half.paper || FX.COLOR_F2EAD8));
    gl.uniform3f(u(FX.U_HALFTONE), num(half.size, 7) * scale, num(half.strength, 0), (num(half.angle, 45) * Math.PI) / 180);
    gl.uniform3fv(u(FX.U_INK), hex(half.ink || FX.COLOR_151515));
    gl.uniform1f(u(FX.U_MISREG), num(f.misregister, 0) * scale);
    gl.uniform1f(u(FX.U_BLEED), num(f.bleed, 0));
    gl.uniform1f(u(FX.U_BLUR_R), num(f.blurRadius, 6) * scale);
    gl.uniform1f(u(FX.U_BOIL), num(f.boil, 0) * scale);
    gl.uniform1i(u(FX.U_MONO), FX.MONO[mono.kind] || 0);
    gl.uniform3fv(u(FX.U_MONO_A), hex(mono.dark || FX.COLOR_141210));
    gl.uniform3fv(u(FX.U_MONO_B), hex(mono.light || FX.COLOR_EFE6D2));
    gl.uniform1f(u(FX.U_FLICKER), num(film.flicker, 0));
    gl.uniform1f(u(FX.U_SCRATCHES), num(film.scratches, 0));
    gl.uniform1f(u(FX.U_GRAIN), num(f.grain, 0));
    gl.uniform1f(u(FX.U_GLOW), num(f.glow, 0));
    gl.uniform1f(u(FX.U_CHROMA), num(f.chroma, 0) * scale);
    gl.uniform1f(u(FX.U_SCAN), num(f.scanlines, 0));
    gl.uniform1f(u(FX.U_TILT), num(f.tiltShift, 0));
    gl.uniform1f(u(FX.U_DARK), num(dark.amount, 0));
    gl.uniform1f(u(FX.U_TORCH), num(dark.torch, 0));
    gl.uniform1i(u(FX.U_LINE), FX.LINE[line.kind] || 0);
    gl.uniform3fv(u(FX.U_LINE_BG), hex(line.background || FX.COLOR_22352C));
    gl.uniform3fv(u(FX.U_LINE_FG), hex(line.color || FX.COLOR_F2F2EA));
    gl.uniform1f(u(FX.U_LINE_FILL), num(line.fill, 0.3));
    gl.uniform1f(u(FX.U_SAT), num(f.saturation, 1));
    gl.uniform1f(u(FX.U_CONTRAST), num(f.contrast, 1));
    const tc = hex(tint.color || FX.COLOR_808080);
    gl.uniform4f(u(FX.U_TINT), tc[0], tc[1], tc[2], num(tint.amount, 0));
    gl.uniform1f(u(FX.U_VIGNETTE), num(f.vignette, 0));
    const levels = Array.isArray(f.levels) ? f.levels : [0, 1];
    gl.uniform2f(u(FX.U_LEVELS), num(levels[0], 0), num(levels[1], 1));
    const frameLoc = u(FX.U_FRAME);
    gl.viewport(0, 0, W, H);
    return {
      canvas,
      apply(src, frame) {
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
        gl.uniform1f(frameLoc, frame);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        return canvas;
      },
      dispose() {
        gl.deleteTexture(tex);
        gl.deleteBuffer(buf);
        gl.deleteProgram(prog);
      },
    };
  };
})(typeof window !== "undefined" ? window : globalThis);

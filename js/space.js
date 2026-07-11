/* ============================================================================
   space.js — EVENT HORIZON: the WebGL universe behind everything.
   ----------------------------------------------------------------------------
   A single full-screen fragment shader renders the whole cosmos:

     • a gravitationally-lensed BLACK HOLE — Einstein-ring light bending,
       a doppler-shifted accretion disk, a photon ring, and the lensed
       far-side arcs above and below the shadow (the "Gargantua" look)
     • a domain-warped volumetric nebula whose palette shifts per sector
     • four parallax starfield layers + a deep-field galaxy layer
     • warp streaking driven by scroll velocity and nav jumps
     • a hyperdrive easter-egg mode

   No libraries, no Three.js — a fullscreen triangle and a few KB of GLSL.
   Pauses when hidden / FX off; degrades render scale if frames run slow;
   returns null silently when WebGL is unavailable (CSS gradient shows).

   Exported: initSpace(canvas) -> api | null
     api.setPointer(nx, ny)   // -1..1
     api.setScroll(p)         // 0..1 journey progress (velocity is derived)
     api.setSector(s)         // 0..5 — eases hole position/palette per sector
     api.warpBurst()          // nav-jump warp flash
     api.setHyper(on)         // konami hyperdrive
     api.setIntensity(v)      // 0..1 master
     api.getVel() / api.getFps()
     api.pause() / api.resume() / api.still(intensity)
   ========================================================================== */

const VERT = `
attribute vec2 aPos;
void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;

uniform vec2  uRes;
uniform float uTime;
uniform vec2  uPointer;    // -1..1, smoothed
uniform float uScroll;     // 0..1 journey
uniform float uVel;        // 0..1 derived scroll velocity -> warp streaks
uniform float uWarp;       // nav/load warp burst, 1 -> 0
uniform float uIntensity;  // 0..1 master fx
uniform float uSector;     // 0..5, smoothed current sector
uniform vec4  uHole;       // x, y, radius, strength
uniform float uHyper;      // hyperdrive 0..1

/* ---------------- noise toolkit ---------------- */
float hash21(vec2 p){
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
vec2 hash22(vec2 p){
  float n = sin(dot(p, vec2(41.0, 289.0)));
  return fract(vec2(262144.0, 32768.0) * n);
}
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for(int i = 0; i < 5; i++){ v += a * vnoise(p); p = m * p; a *= 0.5; }
  return v;
}
mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

/* tent weight: 1 at sector k, fading to 0 one sector away */
float secW(float k){ return max(0.0, 1.0 - abs(uSector - k)); }

/* ---------------- starfield ---------------- */
/* one parallax layer; 'streak' vertically smears stars during warp */
float starLayer(vec2 uv, float density, float seed, float streak){
  vec2 g = uv * density;
  vec2 cell = floor(g);
  vec2 f = fract(g) - 0.5;
  float gate = step(0.48, hash21(cell * 1.7 + seed));
  vec2 pos = (hash22(cell + seed) - 0.5) * 0.72;
  float rnd = hash21(cell + seed + 7.1);
  vec2 q = f - pos;
  q.y *= mix(1.0, 0.10, streak);
  float d = length(q);
  float size = 0.008 + 0.030 * rnd * rnd;
  float core = smoothstep(size, 0.0, d);
  float glow = smoothstep(size * 4.5, 0.0, d) * 0.22;
  float tw = 0.55 + 0.45 * sin(uTime * (1.0 + 2.2 * rnd) + rnd * 40.0);
  return (core + glow) * gate * mix(tw, 1.0, streak) * (0.35 + 0.95 * rnd);
}

/* faint tilted elliptical smudges — distant galaxies for the deep field */
float galaxies(vec2 uv, float seed){
  vec2 g = uv * 6.0;
  vec2 cell = floor(g);
  vec2 f = fract(g) - 0.5;
  float gate = step(0.90, hash21(cell + seed));
  vec2 pos = (hash22(cell + seed * 3.1) - 0.5) * 0.6;
  float a = hash21(cell + seed + 2.2) * 6.2832;
  vec2 q = (f - pos) * rot(a);
  q.x *= 0.42;
  return gate * exp(-length(q) * 24.0);
}

/* ---------------- nebula, tinted per sector ---------------- */
vec3 sectorTint(){
  /* 00 arrival, 01 forge, 02 operator, 03 deep field, 04 archive, 05 channel */
  vec3 t = vec3(0.45, 0.40, 1.00);                                  // violet-blue
  t = mix(t, vec3(0.10, 0.90, 0.85), smoothstep(0.5, 1.0, uSector)
                                   * smoothstep(2.0, 1.5, uSector)); // teal forge
  t = mix(t, vec3(0.60, 0.35, 1.00), secW(2.0));                     // violet
  t = mix(t, vec3(0.55, 0.60, 0.85), secW(3.0));                     // slate field
  t = mix(t, vec3(0.25, 0.55, 1.00), secW(4.0));                     // indigo
  t = mix(t, vec3(1.00, 0.40, 0.70), secW(5.0));                     // magenta
  /* hyperdrive: cycle hue */
  vec3 hyper = 0.6 + 0.4 * cos(uTime * 2.0 + vec3(0.0, 2.1, 4.2));
  return mix(t, hyper, uHyper);
}

vec3 nebula(vec2 uv, float t){
  vec2 p = uv * 1.30 + vec2(t * 0.012, t * 0.006);
  float w = fbm(p * 0.55 + t * 0.02);
  float n = fbm(p + w);
  n = pow(clamp(n, 0.0, 1.0), 1.25);
  vec3 tint = sectorTint();
  vec3 deep = tint * 0.35;
  vec3 mid  = tint;
  vec3 hot  = mix(vec3(1.0, 0.45, 0.75), tint * 1.4, 0.35);
  vec3 col = mix(deep, mid, smoothstep(0.18, 0.60, n));
  col = mix(col, hot, smoothstep(0.55, 0.92, n));
  return col * smoothstep(0.22, 0.85, n);
}

/* the whole background, sampled at (possibly lensed) coordinates */
vec3 background(vec2 uv, vec2 par, float descent, float speed){
  float t = uTime;
  float rad = length(uv);

  vec3 col = mix(vec3(0.012, 0.016, 0.05), vec3(0.03, 0.035, 0.10),
                 smoothstep(-0.7, 0.8, uv.y));
  col += sectorTint() * 0.05 * (1.0 - smoothstep(0.0, 1.2, rad));

  col += nebula(uv * 0.9 + par * 0.5 + vec2(0.0, descent * 0.30), t)
         * (0.50 + 0.40 * uIntensity);

  /* starfields, far -> near; nearer layers streak more under warp */
  float deepW = secW(3.0);                          // photography = deep field
  float stars = 0.0;
  vec2 s1 = uv + par * 0.25 + vec2(0.0, descent * 0.55);
  vec2 s2 = uv + par * 0.50 + vec2(0.0, descent * 0.95);
  vec2 s3 = uv + par * 0.85 + vec2(0.0, descent * 1.55);
  vec2 s4 = uv + par * 1.20 + vec2(0.0, descent * 2.20);
  stars += starLayer(s1, 10.0, 1.0,  speed * 0.25) * 0.65;
  stars += starLayer(s2, 18.0, 13.0, speed * 0.55) * 0.90;
  stars += starLayer(s3, 30.0, 41.0, speed * 0.80) * 1.10;
  stars += starLayer(s4, 46.0, 97.0, speed * 0.95) * (0.70 + deepW * 0.9);
  stars *= 1.0 + speed * 2.2 + deepW * 0.35;
  col += vec3(0.90, 0.95, 1.00) * stars * 1.05;

  /* deep-field galaxies bloom in during the photography sector */
  if (deepW > 0.01){
    float gal = galaxies(uv + par * 0.2 + vec2(0.0, descent * 0.4), 5.0)
              + galaxies(uv * 1.7 + par * 0.3 + vec2(3.0, descent * 0.6), 11.0) * 0.7;
    col += mix(vec3(1.0, 0.85, 0.70), vec3(0.70, 0.80, 1.0), 0.5) * gal * deepW * 0.85;
  }
  return col;
}

void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  float t = uTime;

  vec2  par     = uPointer * 0.05;
  float descent = uScroll * 0.85;
  float speed   = clamp(uVel + uWarp + uHyper * 0.8, 0.0, 1.0);
  float rad     = length(uv);

  /* ---------- gravitational lensing around the hole ---------- */
  vec2  bh = uHole.xy + uPointer * 0.012;     // tiny parallax — it feels alive
  float R  = max(uHole.z, 1e-3);
  float S  = uHole.w;                          // strength 0..1
  vec2  ld = uv - bh;
  float r  = length(ld) + 1e-4;

  /* radial compression toward the photon sphere + frame-drag swirl */
  float bend  = (R * R * 2.6) / (r * r);
  float swirl = 0.45 * R / r;
  vec2 lensed = bh + rot(swirl * S) * (ld * max(0.04, 1.0 - bend * S));
  vec2 bgUv   = mix(uv, lensed, S);

  vec3 col = background(bgUv, par, descent, speed);

  /* ---------- the shadow ---------- */
  col *= mix(1.0, smoothstep(R * 0.92, R * 1.05, r), S);

  /* ---------- accretion disk (tilted, doppler-shifted, turbulent) ---- */
  if (S > 0.003){
    vec2 dq = ld * rot(-0.32);
    float side = dq.y;            // + = far side (hidden behind the shadow)
    dq.y *= 4.6;                  // perspective flatten
    float dr = length(dq);

    /* rigidly rotating turbulence — cartesian, so no atan() seam */
    vec2 nuv = rot(t * 0.22) * (dq / R);
    float turb = fbm(nuv * 1.9 + fbm(nuv * 0.9) * 1.4);

    float band = smoothstep(R * 1.10, R * 1.55, dr) * smoothstep(R * 4.4, R * 2.0, dr);
    /* the far half hides behind the shadow; its light reappears as arcs */
    float backHide = mix(1.0, smoothstep(R * 1.05, R * 2.2, r), step(0.0, side));
    /* doppler beaming: the approaching side burns brighter */
    float dop = mix(0.30, 2.30, smoothstep(-1.0, 1.0, -dq.x / max(dr, 1e-3)));

    float heat = smoothstep(R * 3.6, R * 1.3, dr);
    vec3 diskCol = mix(vec3(1.00, 0.42, 0.12), vec3(1.00, 0.86, 0.55), heat);
    diskCol = mix(diskCol, sectorTint() * 1.6, 0.18);

    col += diskCol * band * backHide * dop * (0.35 + 1.55 * turb) * 1.45 * S;

    /* lensed far-side arcs over and under the shadow */
    float arc  = exp(-pow((r - R * 1.42) / (R * 0.16), 2.0));
    float aTex = 0.55 + 0.45 * fbm(rot(t * 0.18) * (ld / R) * 2.2);
    float topW = smoothstep(0.05, 0.85,  ld.y / r);
    float botW = smoothstep(0.05, 0.85, -ld.y / r) * 0.45;
    col += vec3(1.00, 0.72, 0.38) * arc * (topW + botW) * aTex * 1.25 * S;

    /* photon ring — the knife-edge of light */
    float ring = exp(-pow((r - R * 1.08) / (R * 0.040), 2.0));
    col += vec3(1.00, 0.88, 0.70) * ring * 1.9 * S;
    /* soft ambient glow seating the hole in the nebula */
    col += sectorTint() * exp(-r * 2.4) * 0.22 * S;
    col += vec3(1.00, 0.70, 0.40) * exp(-pow((r - R * 1.2) / (R * 0.9), 2.0)) * 0.18 * S;
  }

  /* ---------- warp speed-lines + chromatic fringe ---------- */
  if (speed > 0.005){
    vec2 dir = normalize(uv + 1e-4);
    float lines = starLayer(uv * vec2(1.0, 0.06) + vec2(0.0, descent * 3.0), 26.0, 71.0, 0.97);
    col += vec3(0.75, 0.85, 1.0) * lines * speed * 1.6;
    col += vec3(0.10, 0.03, -0.06) * speed * rad * 1.4;   // fringing at the edges
    col += sectorTint() * speed * 0.07;
  }

  /* vignette, filmic tone, gamma */
  col *= 1.0 - 0.40 * smoothstep(0.55, 1.45, rad);
  col = col / (col + vec3(0.55));
  col = pow(col, vec3(0.82));

  gl_FragColor = vec4(col, 1.0);
}
`;

/* per-sector targets for the hole: x, y (uv space, y up), radius, strength */
const HOLE_TARGETS = [
  [ 0.00,  0.300, 0.135, 1.00],  // 00 arrival — crowning the name, upper centre
  [-0.52,  0.300, 0.052, 0.55],  // 01 forge — receding off the port bow
  [ 0.55,  0.330, 0.038, 0.42],  // 02 operator
  [ 0.62,  0.380, 0.024, 0.16],  // 03 deep field — almost gone
  [-0.58,  0.360, 0.024, 0.14],  // 04 archive
  [ 0.00,  0.210, 0.085, 0.85],  // 05 channel — the return
];

function compile(gl, type, src){
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)){
    console.warn("[space] shader compile failed:", gl.getShaderInfoLog(sh));
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

export function initSpace(canvas){
  const opts = { antialias: false, alpha: false, depth: false, stencil: false,
                 powerPreference: "high-performance", preserveDrawingBuffer: true,
                 failIfMajorPerformanceCaveat: false };
  const gl = canvas.getContext("webgl", opts) || canvas.getContext("experimental-webgl", opts);
  if (!gl) return null;

  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return null;

  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)){
    console.warn("[space] program link failed:", gl.getProgramInfoLog(prog));
    return null;
  }
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, "aPos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const U = {};
  for (const n of ["uRes","uTime","uPointer","uScroll","uVel","uWarp",
                   "uIntensity","uSector","uHole","uHyper"]){
    U[n] = gl.getUniformLocation(prog, n);
  }

  const state = {
    pointer: [0, 0], pTarget: [0, 0],
    scroll: 0, scrollS: 0, vel: 0,
    sector: 0, sectorS: 0,
    hole: [...HOLE_TARGETS[0]],
    warp: 1, hyper: 0, hyperT: 0,
    intensity: 1,
    time: 0, paused: false, raf: 0,
    last: performance.now(),
    fps: 60, slow: 0, quality: 1,
  };

  let dprCap = Math.min(window.devicePixelRatio || 1, 1.6);
  if (matchMedia("(max-width: 760px)").matches) dprCap = Math.min(window.devicePixelRatio || 1, 1.25);

  function resize(){
    const scale = dprCap * state.quality;
    const w = Math.max(1, Math.floor(canvas.clientWidth * scale));
    const h = Math.max(1, Math.floor(canvas.clientHeight * scale));
    if (canvas.width !== w || canvas.height !== h){
      canvas.width = w; canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
  }

  function draw(){
    resize();
    gl.uniform2f(U.uRes, canvas.width, canvas.height);
    gl.uniform1f(U.uTime, state.time);
    gl.uniform2f(U.uPointer, state.pointer[0], state.pointer[1]);
    gl.uniform1f(U.uScroll, state.scrollS);
    gl.uniform1f(U.uVel, Math.min(1, state.vel));
    gl.uniform1f(U.uWarp, state.warp);
    gl.uniform1f(U.uIntensity, state.intensity);
    gl.uniform1f(U.uSector, state.sectorS);
    gl.uniform4f(U.uHole, ...state.hole);
    gl.uniform1f(U.uHyper, state.hyperT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function frame(now){
    const dt = Math.min(0.05, (now - state.last) / 1000);
    state.last = now;

    state.fps += ((dt > 0 ? 1 / dt : 60) - state.fps) * 0.05;
    state.time += dt * (0.6 + 0.4 * state.intensity + state.hyperT * 0.8);

    /* smooth pointer / scroll; velocity falls out of the scroll chase */
    state.pointer[0] += (state.pTarget[0] - state.pointer[0]) * 0.06;
    state.pointer[1] += (state.pTarget[1] - state.pointer[1]) * 0.06;
    const gap = state.scroll - state.scrollS;
    state.scrollS += gap * Math.min(1, dt * 6.0);
    state.vel += (Math.min(1, Math.abs(gap) * 9.0) - state.vel) * Math.min(1, dt * 5.0);

    /* ease sector + hole toward targets */
    state.sectorS += (state.sector - state.sectorS) * Math.min(1, dt * 2.2);
    const k = Math.max(0, Math.min(HOLE_TARGETS.length - 1, Math.round(state.sector)));
    const tgt = HOLE_TARGETS[k];
    for (let i = 0; i < 4; i++){
      state.hole[i] += (tgt[i] - state.hole[i]) * Math.min(1, dt * 1.8);
    }

    /* decay bursts */
    state.warp = Math.max(0, state.warp - dt * 0.55);
    state.hyperT += ((state.hyper ? 1 : 0) - state.hyperT) * Math.min(1, dt * 2.5);

    draw();

    if (dt > 0.026){ if (++state.slow > 40 && state.quality > 0.6){ state.quality -= 0.15; state.slow = 0; } }
    else state.slow = Math.max(0, state.slow - 1);

    state.raf = requestAnimationFrame(frame);
  }

  function start(){
    if (state.raf || state.paused) return;
    state.last = performance.now();
    state.raf = requestAnimationFrame(frame);
  }
  function stop(){
    if (state.raf) cancelAnimationFrame(state.raf);
    state.raf = 0;
  }

  canvas.addEventListener("webglcontextlost", (e) => { e.preventDefault(); stop(); }, false);
  canvas.addEventListener("webglcontextrestored", () => { if (!state.paused) start(); }, false);

  resize();
  draw();
  start();

  return {
    supported: true,
    setPointer(nx, ny){ state.pTarget[0] = nx; state.pTarget[1] = ny; },
    setScroll(p){ state.scroll = Math.max(0, Math.min(1, p)); },
    setSector(s){ state.sector = Math.max(0, Math.min(5, s)); },
    warpBurst(){ state.warp = Math.min(1, state.warp + 0.9); },
    setHyper(on){ state.hyper = !!on; },
    getVel(){ return state.vel; },
    getFps(){ return Math.round(state.fps); },
    setIntensity(v){
      state.intensity = Math.max(0, Math.min(1, v));
      if (state.intensity === 0 && state.paused) draw();
    },
    pause(){ state.paused = true; stop(); draw(); },
    resume(){ if (state.paused){ state.paused = false; start(); } },
    /* one settled, static frame — used by ?still=1 and reduced motion */
    still(intensity = 1){
      state.intensity = Math.max(0, Math.min(1, intensity));
      state.warp = 0; state.vel = 0; state.time = 8.0;
      state.scrollS = state.scroll; state.sectorS = state.sector;
      const k = Math.max(0, Math.min(HOLE_TARGETS.length - 1, Math.round(state.sector)));
      state.hole = [...HOLE_TARGETS[k]];
      state.paused = true; stop(); resize(); draw();
    },
    resize,
  };
}

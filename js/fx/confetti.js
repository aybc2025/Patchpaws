// Win confetti: paw prints, fabric scraps and yarn dots on one full-screen canvas.
// Particles are allocated once and recycled; the frame loop allocates nothing.
const COLORS = ['#F6A6B9', '#FFC39E', '#F8E59A', '#A9E3BF', '#93D3D6', '#A3BEF4', '#C8B3F0', '#FFC54D'];
const POOL = 110;
const pool = Array.from({ length: POOL }, () => ({ alive: false, x: 0, y: 0, vx: 0, vy: 0, rot: 0, vr: 0, size: 0, life: 0, max: 0, shape: 0, color: '' }));
let canvas = null, c2d = null, raf = 0, last = 0, dpr = 1;

function ensureCanvas() {
  if (canvas) return;
  canvas = document.createElement('canvas');
  canvas.className = 'confetti';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.append(canvas);
  c2d = canvas.getContext('2d');
}

function resize() {
  dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
}

function drawPaw(size) {
  c2d.beginPath(); c2d.ellipse(0, size * 0.25, size * 0.42, size * 0.34, 0, 0, Math.PI * 2); c2d.fill();
  for (const [x, y] of [[-0.48, -0.12], [-0.18, -0.42], [0.18, -0.42], [0.48, -0.12]]) {
    c2d.beginPath(); c2d.arc(x * size, y * size, size * 0.15, 0, Math.PI * 2); c2d.fill();
  }
}

function frame(t) {
  const dt = Math.min(0.033, (t - last) / 1000);
  last = t;
  c2d.setTransform(1, 0, 0, 1, 0, 0);
  c2d.clearRect(0, 0, canvas.width, canvas.height);
  let alive = 0;
  for (const p of pool) {
    if (!p.alive) continue;
    p.life += dt;
    if (p.life >= p.max || p.y > innerHeight + 40) { p.alive = false; continue; }
    alive++;
    p.vy += 900 * dt;
    p.vx *= 1 - 1.6 * dt; p.vy *= 1 - 0.9 * dt;
    p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
    const fade = Math.min(1, (p.max - p.life) / 0.4);
    c2d.globalAlpha = fade;
    c2d.fillStyle = p.color;
    c2d.setTransform(dpr, 0, 0, dpr, p.x * dpr, p.y * dpr);
    c2d.rotate(p.rot);
    if (p.shape === 0) drawPaw(p.size);
    else if (p.shape === 1) c2d.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.66);
    else { c2d.beginPath(); c2d.arc(0, 0, p.size / 2.6, 0, Math.PI * 2); c2d.fill(); }
  }
  c2d.globalAlpha = 1;
  if (alive) raf = requestAnimationFrame(frame);
  else { raf = 0; canvas.classList.remove('is-on'); }
}

/** Bursts from a screen point (CSS px). */
export function burst(x, y, count = 90) {
  ensureCanvas();
  resize();
  canvas.classList.add('is-on');
  let made = 0;
  for (const p of pool) {
    if (made >= count) break;
    if (p.alive) continue;
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1;
    const speed = 380 + Math.random() * 620;
    Object.assign(p, {
      alive: true, x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 10, size: 9 + Math.random() * 9,
      life: 0, max: 1.6 + Math.random() * 0.9, shape: made % 3, color: COLORS[made % COLORS.length],
    });
    made++;
  }
  if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
}

export function stopConfetti() {
  pool.forEach((p) => { p.alive = false; });
}

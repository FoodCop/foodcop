'use client';

import { useEffect, useRef } from 'react';

// Food DNA fingerprint as a slowly rotating 3D "data globe" (replaces the flat
// radar). Hand-rolled on a 2D canvas with a tiny perspective projection
// rather than three.js/R3F - a few hundred points/lines, so a WebGL context +
// the three bundle would be overkill for one widget.
//
// The globe is a geodesic mesh (subdivided icosahedron): every dot is a mesh
// junction joined to its neighbours by lines. Each DNA axis sits ON a
// junction as an emoji node - node size + glow follow the axis score, and the
// mesh lines running into it light up. Nothing is drawn outside the sphere.
// Drag to spin; it pauses off-screen and stops auto-rotating under
// prefers-reduced-motion.

export type GlobeAxis = {
  label: string;
  emoji: string;
  /** 0-1, already normalized. */
  value: number;
};

type Vec3 = [number, number, number];

const YELLOW = '241, 199, 77';
const PALE = '247, 221, 146';
const INK = '36, 31, 22';
const MESH_FREQUENCY = 4; // icosphere subdivision -> 162 junctions, 480 lines
const BASE_SPIN = 0.004; // radians per 16ms frame

const normalize = ([x, y, z]: Vec3): Vec3 => {
  const l = Math.hypot(x, y, z);
  return [x / l, y / l, z / l];
};

// Geodesic sphere: split each icosahedron face into freq^2 triangles, push
// the points out onto the unit sphere, and dedupe shared vertices/edges.
function icosphere(freq: number): { verts: Vec3[]; edges: [number, number][] } {
  const t = (1 + Math.sqrt(5)) / 2;
  const base: Vec3[] = [
    [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
    [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
    [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1],
  ];
  const faces = [
    [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
    [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
    [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
    [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
  ];

  const verts: Vec3[] = [];
  const index = new Map<string, number>();
  const vertexId = (p: Vec3) => {
    const n = normalize(p);
    const key = n.map((c) => c.toFixed(4)).join(',');
    let id = index.get(key);
    if (id === undefined) {
      id = verts.length;
      verts.push(n);
      index.set(key, id);
    }
    return id;
  };

  const edgeSet = new Set<string>();
  const edges: [number, number][] = [];
  const addEdge = (a: number, b: number) => {
    const key = a < b ? `${a}-${b}` : `${b}-${a}`;
    if (!edgeSet.has(key)) {
      edgeSet.add(key);
      edges.push([a, b]);
    }
  };

  for (const [ia, ib, ic] of faces) {
    const [A, B, C] = [base[ia], base[ib], base[ic]];
    // grid[i][j] = point at barycentric (i, j) steps along AB / AC.
    const grid: number[][] = [];
    for (let i = 0; i <= freq; i++) {
      grid[i] = [];
      for (let j = 0; j <= freq - i; j++) {
        const k = freq - i - j;
        grid[i][j] = vertexId([
          (A[0] * k + B[0] * i + C[0] * j) / freq,
          (A[1] * k + B[1] * i + C[1] * j) / freq,
          (A[2] * k + B[2] * i + C[2] * j) / freq,
        ]);
      }
    }
    for (let i = 0; i <= freq; i++) {
      for (let j = 0; j <= freq - i; j++) {
        if (i + 1 <= freq - j) addEdge(grid[i][j], grid[i + 1][j]);
        if (j + 1 <= freq - i) addEdge(grid[i][j], grid[i][j + 1]);
        if (i + 1 <= freq && j - 1 >= 0 && j - 1 <= freq - i - 1) addEdge(grid[i][j], grid[i + 1][j - 1]);
      }
    }
  }
  return { verts, edges };
}

// Target spots for the axis nodes: spread around the globe at alternating
// latitudes, then snapped to the nearest mesh junction.
function axisTarget(i: number, count: number): Vec3 {
  const lats = [0.45, -0.3, 0.2, -0.55, 0.6, -0.1];
  const lat = lats[i % lats.length];
  const lon = (i / count) * Math.PI * 2;
  const r = Math.cos(lat);
  return [Math.cos(lon) * r, Math.sin(lat), Math.sin(lon) * r];
}

export default function DnaGlobe({
  axes,
  animate = true,
  ariaLabel = 'Food DNA fingerprint globe',
}: {
  axes: GlobeAxis[];
  animate?: boolean;
  ariaLabel?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const axesRef = useRef(axes);
  const animateRef = useRef(animate);

  useEffect(() => {
    axesRef.current = axes;
    animateRef.current = animate;
  }, [axes, animate]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!wrap || !canvas || !ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fontFamily = getComputedStyle(canvas).fontFamily || 'sans-serif';
    const { verts, edges } = icosphere(MESH_FREQUENCY);

    // Snap each axis to its own nearest junction.
    const nodeVertexFor = (count: number) => {
      const taken = new Set<number>();
      return Array.from({ length: count }, (_, i) => {
        const target = axisTarget(i, count);
        let best = -1;
        let bestDot = -Infinity;
        verts.forEach((v, vi) => {
          if (taken.has(vi)) return;
          const d = v[0] * target[0] + v[1] * target[1] + v[2] * target[2];
          if (d > bestDot) {
            bestDot = d;
            best = vi;
          }
        });
        taken.add(best);
        return best;
      });
    };
    let nodeVerts = nodeVertexFor(axesRef.current.length);

    let w = 0;
    let dpr = 1;
    const resize = () => {
      w = wrap.clientWidth;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(w * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${w}px`;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    let visible = true;
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    io.observe(canvas);

    // Rotation state + drag inertia.
    let rotY = 0.5;
    let rotX = -0.3;
    let velY = reduced ? 0 : BASE_SPIN;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let grow = animateRef.current ? 0 : 1;

    const onDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      rotY += dx * 0.008;
      rotX = Math.max(-1.1, Math.min(1.1, rotX + dy * 0.008));
      velY = dx * 0.008;
    };
    const onUp = () => {
      dragging = false;
    };
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);

    type Item = { z: number; draw: () => void };
    let raf = 0;
    let prev = performance.now();

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!visible || w === 0) {
        prev = now;
        return;
      }
      const dt = Math.min(48, now - prev) / 16;
      prev = now;

      if (!dragging) {
        rotY += velY * dt;
        // Ease any fling back to the idle spin.
        velY += ((reduced ? 0 : BASE_SPIN) - velY) * 0.03 * dt;
      }
      const target = animateRef.current ? 1 : 0;
      grow += (target - grow) * 0.05 * dt;

      const list = axesRef.current;
      if (nodeVerts.length !== list.length) nodeVerts = nodeVertexFor(list.length);

      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);

      const cx = w / 2;
      // Sphere fills most of the square; nudged up to leave room for the
      // bottom nodes' labels.
      const cy = w * 0.47;
      const R = w * 0.39;
      const camera = 4.5; // camera distance in sphere radii

      // Rotate every junction once per frame, then project.
      const proj = verts.map(([x, y, z]) => {
        const x1 = x * cosY + z * sinY;
        const z1 = -x * sinY + z * cosY;
        const y2 = y * cosX - z1 * sinX;
        const z2 = y * sinX + z1 * cosX;
        const s = camera / (camera - z2);
        return { x: cx + x1 * R * s, y: cy - y2 * R * s, s, z: z2, yWorld: y };
      });

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, w);

      // Soft core glow inside the globe.
      const glow = ctx.createRadialGradient(cx, cy, R * 0.05, cx, cy, R * 1.15);
      glow.addColorStop(0, `rgba(${YELLOW}, 0.2)`);
      glow.addColorStop(0.7, `rgba(${YELLOW}, 0.05)`);
      glow.addColorStop(1, `rgba(${YELLOW}, 0)`);
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.15, 0, Math.PI * 2);
      ctx.fill();

      // Scanner: a band sweeping up and down that brightens the mesh it crosses.
      const scanY = Math.sin(now * 0.0006) * 0.95;
      const scanBoost = (yWorld: number) => Math.max(0, 1 - Math.abs(yWorld - scanY) / 0.16);

      const nodeScore = new Map<number, number>();
      nodeVerts.forEach((vi, i) => nodeScore.set(vi, Math.max(0, Math.min(1, list[i]?.value ?? 0))));

      const items: Item[] = [];

      // Mesh lines. Lines running into a DNA node glow yellow with its score.
      for (const [a, b] of edges) {
        const pa = proj[a];
        const pb = proj[b];
        const z = (pa.z + pb.z) / 2;
        const depth = (z + 1) / 2;
        const lit = Math.max(nodeScore.get(a) ?? -1, nodeScore.get(b) ?? -1);
        const scan = (scanBoost(pa.yWorld) + scanBoost(pb.yWorld)) / 2;
        items.push({
          z: z - 0.02,
          draw: () => {
            if (lit >= 0) {
              const pulse = 0.75 + 0.25 * Math.sin(now * 0.004);
              ctx.strokeStyle = `rgba(${YELLOW}, ${(0.25 + depth * 0.7) * (0.5 + lit * 0.5 * grow) * pulse})`;
              ctx.lineWidth = 1.2 + lit * 1.2;
            } else {
              ctx.strokeStyle = `rgba(${PALE}, ${0.04 + depth * 0.26 + scan * 0.45})`;
              ctx.lineWidth = 0.8;
            }
            ctx.beginPath();
            ctx.moveTo(pa.x, pa.y);
            ctx.lineTo(pb.x, pb.y);
            ctx.stroke();
          },
        });
      }

      // Junction dots.
      proj.forEach((p, vi) => {
        if (nodeScore.has(vi)) return;
        const depth = (p.z + 1) / 2;
        const scan = scanBoost(p.yWorld);
        items.push({
          z: p.z,
          draw: () => {
            ctx.fillStyle = `rgba(${scan > 0.3 ? YELLOW : PALE}, ${0.1 + depth * 0.6 + scan * 0.3})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, (0.9 + depth * 1.3 + scan * 0.8) * p.s, 0, Math.PI * 2);
            ctx.fill();
          },
        });
      });

      // DNA nodes: emoji on the junction, sized by score.
      nodeVerts.forEach((vi, i) => {
        const axis = list[i];
        if (!axis) return;
        const p = proj[vi];
        const v = Math.max(0, Math.min(1, axis.value));
        const depth = (p.z + 1) / 2;
        items.push({
          z: p.z + 0.01,
          draw: () => {
            const r = (13 + 9 * v * grow) * p.s;
            ctx.globalAlpha = 0.25 + depth * 0.75;

            // Score halo ring
            ctx.strokeStyle = `rgba(${YELLOW}, 0.35)`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(p.x, p.y, r + 5 + 2 * Math.sin(now * 0.004 + i), 0, Math.PI * 2);
            ctx.stroke();

            // Bubble
            ctx.shadowColor = `rgba(${YELLOW}, 0.9)`;
            ctx.shadowBlur = 10 + depth * 16;
            ctx.fillStyle = `rgba(${INK}, 0.95)`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.strokeStyle = `rgb(${YELLOW})`;
            ctx.lineWidth = 1.8;
            ctx.stroke();

            // Emoji
            ctx.font = `${Math.round(r * 1.05)}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(axis.emoji, p.x, p.y + 1);

            // Label + score, only while facing the viewer.
            if (depth > 0.45) {
              ctx.globalAlpha = Math.min(1, (depth - 0.45) / 0.25);
              const label = axis.label.toUpperCase();
              const pct = `${Math.round(v * 100)}%`;
              ctx.font = `800 11px ${fontFamily}`;
              const tw = ctx.measureText(label).width + ctx.measureText(pct).width + 22;
              const ly = p.y + r + 14;
              // Frosted pill behind the label so it reads over the mesh.
              ctx.fillStyle = `rgba(${INK}, 0.82)`;
              ctx.beginPath();
              ctx.roundRect(p.x - tw / 2, ly - 9, tw, 18, 9);
              ctx.fill();
              ctx.textAlign = 'left';
              ctx.fillStyle = '#ffffff';
              const lx = p.x - tw / 2 + 8;
              ctx.fillText(label, lx, ly + 0.5);
              ctx.fillStyle = `rgb(${YELLOW})`;
              ctx.fillText(pct, lx + ctx.measureText(label).width + 6, ly + 0.5);
            }
            ctx.globalAlpha = 1;
          },
        });
      });

      items.sort((a, b) => a.z - b.z);
      for (const it of items) it.draw();
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
    };
  }, []);

  return (
    <div className="fz-dna-globe" ref={wrapRef}>
      <canvas ref={canvasRef} className="fz-dna-globe__canvas" role="img" aria-label={ariaLabel} />
      <ul className="visually-hidden">
        {axes.map((a) => (
          <li key={a.label}>
            {a.label}: {Math.round(a.value * 100)}%
          </li>
        ))}
      </ul>
      <div className="fz-dna-globe__hint" aria-hidden="true">Drag to spin</div>
    </div>
  );
}

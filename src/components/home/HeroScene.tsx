'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

type CardDef = { image: string; pos: [number, number, number] };

// Sized/spaced for planeGeometry [3.2, 4.8] cards - depth range must stay in
// sync with KEYFRAMES and the fog distance below.
const CARD_DEFS: CardDef[] = [
  { image: '/images/hero-cards/noodles-wine.jpg', pos: [-3.2, 0.5, -1.5] },
  { image: '/images/hero-cards/pancake-stack.jpg', pos: [3.4, -0.4, -5.0] },
  { image: '/images/hero-cards/tandoori-red.jpg', pos: [-3.0, -0.7, -8.5] },
  { image: '/images/hero-cards/grilled-peppers.jpg', pos: [3.2, 0.8, -12.0] },
  { image: '/images/hero-cards/smoky-pot.jpg', pos: [0, -1.0, -15.5] },
];

/* Camera "shots" - interpolated by scroll progress (0-1 across the hero's
   320vh pin), same shape as the cinematic-scroll reference: a handful of
   keyframed position/lookAt pairs instead of one continuous linear path, so
   the motion has distinct beats rather than a single dolly move. Depth
   matches CARD_DEFS's -1.5..-15.5 spread. */
const KEYFRAMES: { p: number; pos: THREE.Vector3; look: THREE.Vector3 }[] = [
  { p: 0, pos: new THREE.Vector3(0, 0, 10), look: new THREE.Vector3(0, 0, 0) },
  { p: 0.22, pos: new THREE.Vector3(-2.6, 0.4, 5.5), look: new THREE.Vector3(-2.8, 0.4, -2) },
  { p: 0.48, pos: new THREE.Vector3(2.8, -0.3, 1.0), look: new THREE.Vector3(3.0, -0.3, -5.0) },
  { p: 0.74, pos: new THREE.Vector3(-2.2, -0.6, -4.5), look: new THREE.Vector3(-2.6, -0.7, -9.0) },
  { p: 1, pos: new THREE.Vector3(1.0, 0.4, -10.5), look: new THREE.Vector3(0.6, 0.1, -16.5) },
];

function computePath(p: number, outPos: THREE.Vector3, outLook: THREE.Vector3) {
  const clamped = THREE.MathUtils.clamp(p, 0, 1);
  let i = 0;
  while (i < KEYFRAMES.length - 2 && clamped > KEYFRAMES[i + 1].p) i++;
  const a = KEYFRAMES[i];
  const b = KEYFRAMES[i + 1];
  const span = b.p - a.p || 1;
  const t = THREE.MathUtils.smoothstep((clamped - a.p) / span, 0, 1);
  outPos.lerpVectors(a.pos, b.pos, t);
  outLook.lerpVectors(a.look, b.look, t);
}

// Draws a photo into a rounded-corner canvas with a soft vignette + hairline
// border, so it reads as a designed "card" floating in the scene rather than
// a bare rectangle - and so it blends into the dark scene at its edges.
function loadCardTexture(url: string): Promise<THREE.CanvasTexture> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const w = 600;
      const h = 900;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      const r = 32;

      ctx.beginPath();
      ctx.moveTo(r, 0);
      ctx.arcTo(w, 0, w, h, r);
      ctx.arcTo(w, h, 0, h, r);
      ctx.arcTo(0, h, 0, 0, r);
      ctx.arcTo(0, 0, w, 0, r);
      ctx.closePath();
      ctx.clip();

      const scale = Math.max(w / img.width, h / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);

      const vignette = ctx.createRadialGradient(w / 2, h / 2, h * 0.32, w / 2, h / 2, h * 0.78);
      vignette.addColorStop(0, 'rgba(0,0,0,0)');
      vignette.addColorStop(1, 'rgba(0,0,0,0.4)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, w, h);

      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(255,255,255,0.14)';
      ctx.stroke();

      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      resolve(tex);
    };
    img.onerror = reject;
    img.src = url;
  });
}

function CameraRig({ progressRef }: { progressRef: React.MutableRefObject<number> }) {
  const { camera } = useThree();
  const smoothedPos = useRef(new THREE.Vector3(0, 0, 10));
  const smoothedLook = useRef(new THREE.Vector3(0, 0, 0));
  const targetPos = useRef(new THREE.Vector3());
  const targetLook = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    computePath(progressRef.current, targetPos.current, targetLook.current);
    const damp = 1 - Math.pow(0.0025, Math.min(delta, 0.1));
    smoothedPos.current.lerp(targetPos.current, damp);
    smoothedLook.current.lerp(targetLook.current, damp);
    camera.position.copy(smoothedPos.current);
    camera.lookAt(smoothedLook.current);
  });

  return null;
}

type LoadedCard = CardDef & { texture: THREE.CanvasTexture };

function useCardTextures(): LoadedCard[] {
  const [cards, setCards] = useState<LoadedCard[]>([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all(CARD_DEFS.map(async (def) => ({ ...def, texture: await loadCardTexture(def.image) })))
      .then((loaded) => {
        if (!cancelled) setCards(loaded);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return cards;
}

function Cards({ cards }: { cards: LoadedCard[] }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ camera, clock }) => {
    const group = groupRef.current;
    if (!group) return;
    const t = clock.elapsedTime;
    group.children.forEach((child, i) => {
      const base = cards[i].pos;
      child.position.y = base[1] + Math.sin(t * 0.5 + i * 1.3) * 0.15;
      child.quaternion.copy(camera.quaternion);
    });
  });

  return (
    <group ref={groupRef}>
      {cards.map((c, i) => (
        <mesh key={i} position={c.pos}>
          <planeGeometry args={[3.2, 4.8]} />
          <meshBasicMaterial map={c.texture} transparent toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

const PARTICLE_COUNT = 160;
function buildParticlePositions(): Float32Array {
  const arr = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    arr[i * 3] = (Math.random() - 0.5) * 11;
    arr[i * 3 + 1] = (Math.random() - 0.5) * 7;
    arr[i * 3 + 2] = -Math.random() * 18 + 1;
  }
  return arr;
}
// Computed once at module load (not render), so it's a stable reference and
// never re-rolled - these are purely ambient decoration, not state.
const PARTICLE_POSITIONS = buildParticlePositions();

function Particles() {
  const ref = useRef<THREE.Points>(null);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.015;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[PARTICLE_POSITIONS, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.035} color="#FFC909" transparent opacity={0.4} sizeAttenuation depthWrite={false} />
    </points>
  );
}

function Scene({ progressRef }: { progressRef: React.MutableRefObject<number> }) {
  const cards = useCardTextures();
  return (
    <>
      <fog attach="fog" args={['#0a0a0a', 8, 22]} />
      <ambientLight intensity={0.4} />
      <pointLight position={[5, 5, 5]} intensity={40} color="#FFC909" />
      <pointLight position={[-5, -3, 2]} intensity={20} color="#BF2C20" />
      {cards.length > 0 && <Cards cards={cards} />}
      <Particles />
      <CameraRig progressRef={progressRef} />
    </>
  );
}

export default function HeroScene() {
  const progressRef = useRef(0);
  // Safe to read directly during render (not inside useEffect/useState): this
  // component is dynamic-imported with ssr:false, so it only ever renders
  // client-side and there's no server-rendered HTML for it to mismatch.
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (reduced) return;

    function onScroll() {
      const heroEl = document.getElementById('hero');
      if (!heroEl) return;
      const top = heroEl.offsetTop;
      const h = heroEl.offsetHeight;
      const wH = window.innerHeight;
      progressRef.current = Math.max(0, Math.min((window.scrollY - top) / Math.max(1, h - wH), 1));
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [reduced]);

  if (reduced) return null;

  return (
    <div className="hero-scene" aria-hidden="true">
      <Canvas dpr={[1, 1.75]} camera={{ fov: 45, position: [0, 0, 10] }} gl={{ antialias: true, alpha: true }}>
        <Scene progressRef={progressRef} />
      </Canvas>
    </div>
  );
}

"use client";

import { Suspense, useLayoutEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import {
  ANCHORS,
  CALLOUTS,
  KEYFRAMES,
  type CalloutId,
  type Keyframe,
} from "@/lib/content";
import { calloutEls, scrollState } from "@/lib/store";

const MODEL_URL = "/models/cakmak.glb";
const SCALE = 40;
const LID_OPEN = THREE.MathUtils.degToRad(95);
const Z_AXIS = new THREE.Vector3(0, 0, 1);
const CALLOUT_IDS = Object.keys(CALLOUTS) as CalloutId[];

/** Anahtar karedeki model dönüşümüne göre bir parçanın dünya konumu */
function anchorWorld(kf: Keyframe, id: CalloutId, xf: number) {
  const m = new THREE.Matrix4().compose(
    new THREE.Vector3(kf.pos[0] * xf, kf.pos[1], kf.pos[2]),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(0, kf.rotY, 0)),
    new THREE.Vector3(SCALE, SCALE, SCALE),
  );
  return new THREE.Vector3(...ANCHORS[id]).applyMatrix4(m);
}

/** Bölümler arasında beklemeli (plato) yumuşak geçiş */
function segment(p: number) {
  const n = KEYFRAMES.length - 1;
  const x = THREE.MathUtils.clamp(p, 0, 1) * n;
  const i = Math.min(Math.floor(x), n - 1);
  const raw = x - i;
  const t = THREE.MathUtils.smoothstep(raw, 0.18, 0.82);
  return { i, t, x };
}

type Rig = {
  bone: THREE.Bone;
  rest: THREE.Quaternion;
  axis: THREE.Vector3;
};

function makeRig(root: THREE.Object3D, name: string): Rig | null {
  const bone = root.getObjectByName(name) as THREE.Bone | undefined;
  if (!bone) return null;
  // Kemiğin model köküne göre dinlenme dünya dönüşü
  const qw = new THREE.Quaternion();
  let o: THREE.Object3D | null = bone;
  while (o && o !== root) {
    qw.premultiply(o.quaternion);
    o = o.parent;
  }
  return {
    bone,
    rest: bone.quaternion.clone(),
    axis: Z_AXIS.clone().applyQuaternion(qw.clone().invert()).normalize(),
  };
}

function setRig(rig: Rig | null, angle: number) {
  if (!rig) return;
  const q = new THREE.Quaternion().setFromAxisAngle(rig.axis, angle);
  rig.bone.quaternion.copy(rig.rest).multiply(q);
}

function Lighter() {
  const { scene } = useGLTF(MODEL_URL);
  const group = useRef<THREE.Group>(null);
  const { camera, size } = useThree();

  const rigs = useMemo(
    () => ({ lid: makeRig(scene, "Kapak"), wheel: makeRig(scene, "Cark") }),
    [scene],
  );

  useLayoutEffect(() => {
    scene.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        const mesh = o as THREE.Mesh;
        mesh.frustumCulled = false;
        const mat = mesh.material as THREE.MeshStandardMaterial;
        mat.envMapIntensity = 2.2;
      }
    });
  }, [scene]);

  // Anlık (yumuşatılmış) durum
  const cur = useRef({
    pos: new THREE.Vector3(KEYFRAMES[0].pos[0], KEYFRAMES[0].pos[1], 0),
    rotY: KEYFRAMES[0].rotY,
    lid: 0,
    wheel: 0,
    camPos: new THREE.Vector3(0, 0, 7),
    target: new THREE.Vector3(),
    weights: Object.fromEntries(CALLOUT_IDS.map((id) => [id, 0])) as Record<
      CalloutId,
      number
    >,
  });

  const tmp = useMemo(
    () => ({
      a: new THREE.Vector3(),
      b: new THREE.Vector3(),
      ta: new THREE.Vector3(),
      tb: new THREE.Vector3(),
      v: new THREE.Vector3(),
    }),
    [],
  );

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    const aspect = size.width / size.height;
    const xf = THREE.MathUtils.clamp(aspect / 1.6, 0.25, 1);
    const zf = aspect < 1 ? 1.25 / aspect : 1;
    const { i, t, x } = segment(scrollState.p);
    const A = KEYFRAMES[i];
    const B = KEYFRAMES[i + 1];
    const c = cur.current;
    const k = Math.min(1, dt * 5);

    // Model
    tmp.a.set(A.pos[0] * xf, A.pos[1], A.pos[2]);
    tmp.b.set(B.pos[0] * xf, B.pos[1], B.pos[2]);
    c.pos.lerp(tmp.v.lerpVectors(tmp.a, tmp.b, t), k);
    c.rotY += (THREE.MathUtils.lerp(A.rotY, B.rotY, t) - c.rotY) * k;
    c.lid += (THREE.MathUtils.lerp(A.lid, B.lid, t) - c.lid) * k;
    c.wheel += (THREE.MathUtils.lerp(A.wheel ?? 0, B.wheel ?? 0, t) - c.wheel) * k;

    const float = Math.sin(state.clock.elapsedTime * 0.8) * 0.03;
    g.position.set(c.pos.x, c.pos.y + float, c.pos.z);
    g.rotation.set(0, c.rotY, 0);
    setRig(rigs.lid, c.lid * LID_OPEN);
    setRig(rigs.wheel, -c.wheel);

    // Kamera
    const tA = A.focus ? anchorWorld(A, A.focus, xf) : tmp.ta.set(0, 0, 0);
    const tB = B.focus ? anchorWorld(B, B.focus, xf) : tmp.tb.set(0, 0, 0);
    const target = tmp.v.lerpVectors(tA, tB, t);
    c.target.lerp(target, k);
    const camA = new THREE.Vector3(...A.cam).multiplyScalar(A.focus ? 1 : zf).add(tA);
    const camB = new THREE.Vector3(...B.cam).multiplyScalar(B.focus ? 1 : zf).add(tB);
    c.camPos.lerp(camA.lerp(camB, t), k);
    camera.position.copy(c.camPos);
    camera.lookAt(c.target);

    // Etiketler: aktif bölüme yakınlıkla görünürlük
    const nearest = Math.round(x);
    const dist = Math.abs(x - nearest);
    const vis = 1 - THREE.MathUtils.smoothstep(dist, 0.12, 0.3);
    g.updateMatrixWorld(true);
    for (const id of CALLOUT_IDS) {
      const want = KEYFRAMES[nearest].callouts.includes(id) ? vis : 0;
      c.weights[id] += (want - c.weights[id]) * Math.min(1, dt * 8);
      const w = c.weights[id];
      const els = calloutEls.get(id);
      if (!els) continue;
      if (w < 0.01) {
        els.label.style.opacity = "0";
        els.line.style.opacity = "0";
        els.dot.style.opacity = "0";
        els.ring.style.opacity = "0";
        continue;
      }
      const p = tmp.v.set(...ANCHORS[id]).applyMatrix4(g.matrixWorld).project(camera);
      const sx = (p.x * 0.5 + 0.5) * size.width;
      const sy = (-p.y * 0.5 + 0.5) * size.height;
      const [ox, oy] = CALLOUTS[id].offset;
      const scale = Math.min(1, size.width / 1100);
      const right = ox >= 0;
      const below = oy >= 0;
      const lw = els.label.offsetWidth + 8;
      const lh = els.label.offsetHeight;
      const m = 16;
      let lx = sx + ox * scale;
      let ly = sy + oy * scale;
      // Etiket kutusunu tamamen ekran içinde tut
      lx = right
        ? THREE.MathUtils.clamp(lx, m, size.width - lw - m)
        : THREE.MathUtils.clamp(lx, lw + m, size.width - m);
      ly = below
        ? THREE.MathUtils.clamp(ly, 12 + m, size.height - lh + 12 - m)
        : THREE.MathUtils.clamp(ly, lh - 12 + m, size.height - 12 - m);
      const grow = THREE.MathUtils.smoothstep(w, 0.05, 0.75);
      els.line.setAttribute("x1", String(sx));
      els.line.setAttribute("y1", String(sy));
      els.line.setAttribute("x2", String(sx + (lx - sx) * grow));
      els.line.setAttribute("y2", String(sy + (ly - sy) * grow));
      els.line.style.opacity = String(w);
      els.dot.setAttribute("cx", String(sx));
      els.dot.setAttribute("cy", String(sy));
      els.dot.style.opacity = String(w);
      els.ring.setAttribute("cx", String(sx));
      els.ring.setAttribute("cy", String(sy));
      els.ring.style.opacity = String(w * 0.6);
      els.label.style.transform = `translate(${lx}px, ${ly}px) translate(${right ? "8px" : "calc(-100% - 8px)"}, ${below ? "-12px" : "calc(-100% + 12px)"})`;
      els.label.style.opacity = String(THREE.MathUtils.smoothstep(w, 0.55, 1));
    }
  });

  return (
    <group ref={group} scale={SCALE}>
      <primitive object={scene} />
    </group>
  );
}

function Studio() {
  return (
    <Environment resolution={256}>
      <Lightformer form="rect" intensity={4} position={[0, 5, 2]} rotation-x={Math.PI / 2} scale={[10, 3, 1]} />
      <Lightformer form="rect" intensity={6} position={[-5, 1, 1]} rotation-y={Math.PI / 2} scale={[8, 0.6, 1]} />
      <Lightformer form="rect" intensity={6} position={[5, 0.5, 1]} rotation-y={-Math.PI / 2} scale={[8, 0.6, 1]} />
      {/* Kamera tarafında geniş yumuşak panel: lake ön yüzde degrade yansıma */}
      <Lightformer form="rect" intensity={3} position={[4, 2, 7]} rotation-y={Math.PI + 0.5} scale={[5, 7, 1]} />
      <Lightformer form="rect" intensity={1.2} position={[-4, -1, 7]} rotation-y={Math.PI - 0.5} scale={[4, 6, 1]} />
      <Lightformer form="ring" intensity={1.5} position={[2, 3, -4]} scale={3} />
      <Lightformer form="rect" intensity={0.6} color="#ffd9a8" position={[0, -3, 2]} rotation-x={-Math.PI / 2} scale={[8, 4, 1]} />
    </Environment>
  );
}

export default function Scene() {
  return (
    <Canvas
      className="scene-canvas"
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      camera={{ fov: 30, near: 0.05, far: 100, position: [0, 0, 7] }}
    >
      <ambientLight intensity={0.15} />
      <directionalLight position={[3, 5, 4]} intensity={1.2} />
      <Suspense fallback={null}>
        <Studio />
        <Lighter />
      </Suspense>
    </Canvas>
  );
}

useGLTF.preload(MODEL_URL);

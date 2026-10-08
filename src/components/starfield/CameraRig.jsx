import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import gsap from 'gsap';
import * as THREE from 'three';

/*
 * Planetarium-style camera, like a telescope on a GoTo mount:
 *   scroll / pinch    zoom by changing the field of view (FOV), toward the
 *                     point under the cursor / between the fingers.
 *   drag              look around from where you stand; the sky tracks the
 *                     pointer 1:1 at any zoom, with a little momentum.
 *   shift- or right-drag   orbit around the current target to see the real
 *                     3D depth between stars.
 * Whenever `pose` changes (a sector or star was selected, or Recenter), input
 * is suspended and position, look-at target and FOV are tweened together as a
 * slew; control returns on arrival.
 */
export const MIN_FOV = 3;
export const MAX_FOV = 100;
const ZOOM_SPEED = 0.0012; // per wheel delta unit, exponential
const ORBIT_SPEED = 0.005; // radians per pixel
const MAX_ELEVATION = THREE.MathUtils.degToRad(88);
const INERTIA_DECAY = 6; // per second

const UP = new THREE.Vector3(0, 1, 0);

/* Direction ↔ (azimuth, elevation) about world-up; azimuth grows when turning left. */
function toAngles(v) {
  const n = v.clone().normalize();
  return { az: Math.atan2(n.x, n.z), el: Math.asin(THREE.MathUtils.clamp(n.y, -1, 1)) };
}
function fromAngles(az, el, out = new THREE.Vector3()) {
  return out.set(Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az));
}

export default function CameraRig({ pose, reducedMotion, onSlewChange, cameraRef }) {
  const { camera, gl, size } = useThree();
  const target = useRef(new THREE.Vector3(...pose.target));
  const initialPose = useRef(pose);
  const slewing = useRef(false);
  const targetFov = useRef(pose.fov);
  const zoomAnchor = useRef({ x: 0, y: 0 });
  const velocity = useRef({ az: 0, el: 0 });
  const sizeRef = useRef(size);
  sizeRef.current = size;

  useEffect(() => {
    if (cameraRef) cameraRef.current = camera;
  }, [camera, cameraRef]);

  /* Rotate the view direction (look-around) or the camera about the target (orbit). */
  const turn = (dAz, dEl, mode = 'look') => {
    const cam = camera.position;
    const t = target.current;
    if (mode === 'look') {
      const offset = t.clone().sub(cam);
      const dist = offset.length();
      const { az, el } = toAngles(offset);
      const dir = fromAngles(az + dAz, THREE.MathUtils.clamp(el + dEl, -MAX_ELEVATION, MAX_ELEVATION));
      t.copy(cam).add(dir.multiplyScalar(dist));
    } else {
      const offset = cam.clone().sub(t);
      const dist = offset.length();
      const { az, el } = toAngles(offset);
      const dir = fromAngles(az + dAz, THREE.MathUtils.clamp(el + dEl, -MAX_ELEVATION, MAX_ELEVATION));
      cam.copy(t).add(dir.multiplyScalar(dist));
    }
    camera.lookAt(t);
  };

  /* Radians of sky per screen pixel at the current zoom, so drags track the pointer. */
  const radPerPx = () => THREE.MathUtils.degToRad(camera.fov) / sizeRef.current.height;

  /* ── Slews ─────────────────────────────────────────────────────────────── */
  useEffect(() => {
    const applyFov = () => camera.updateProjectionMatrix();
    velocity.current = { az: 0, el: 0 };

    // Initial pose (incl. StrictMode's effect re-run): the camera already starts there, so place it without a slew.
    if (reducedMotion || pose === initialPose.current) {
      camera.position.set(...pose.position);
      target.current.set(...pose.target);
      camera.fov = pose.fov;
      targetFov.current = pose.fov;
      applyFov();
      camera.lookAt(target.current);
      onSlewChange?.(false);
      return undefined;
    }

    // Once the mount has moved, returning to the home pose (Recenter) should slew too.
    initialPose.current = null;
    slewing.current = true;
    onSlewChange?.(true);
    const tl = gsap.timeline({
      defaults: { duration: 2.2, ease: 'power3.inOut' },
      onComplete: () => {
        slewing.current = false;
        targetFov.current = camera.fov;
        onSlewChange?.(false);
      },
    });
    tl.to(camera.position, { x: pose.position[0], y: pose.position[1], z: pose.position[2] }, 0)
      .to(target.current, { x: pose.target[0], y: pose.target[1], z: pose.target[2] }, 0)
      .to(camera, { fov: pose.fov, onUpdate: applyFov }, 0);
    return () => {
      tl.kill();
      slewing.current = false;
      targetFov.current = camera.fov;
    };
    // pose is recreated by the parent only when a new slew is requested.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pose, reducedMotion]);

  /* ── Pointer, wheel and pinch input ────────────────────────────────────── */
  useEffect(() => {
    const el = gl.domElement;
    const pointers = new Map(); // pointerId → { x, y }
    let drag = null; // { mode, lastX, lastY, lastT }
    let pinch = null; // { dist, fov }

    const toNdc = (x, y) => {
      const r = el.getBoundingClientRect();
      return { x: ((x - r.left) / r.width) * 2 - 1, y: -((y - r.top) / r.height) * 2 + 1 };
    };

    const onPointerDown = (e) => {
      if (slewing.current) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      velocity.current = { az: 0, el: 0 };
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinch = { dist: Math.hypot(a.x - b.x, a.y - b.y), fov: targetFov.current };
        drag = null;
      } else if (pointers.size === 1) {
        const orbit = e.shiftKey || e.button === 2;
        drag = { mode: orbit ? 'orbit' : 'look', lastX: e.clientX, lastY: e.clientY, lastT: performance.now() };
      }
    };

    const onPointerMove = (e) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (slewing.current) return;

      if (pinch && pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        zoomAnchor.current = toNdc((a.x + b.x) / 2, (a.y + b.y) / 2);
        targetFov.current = THREE.MathUtils.clamp((pinch.fov * pinch.dist) / Math.max(dist, 1), MIN_FOV, MAX_FOV);
        return;
      }
      if (!drag) return;
      const dx = e.clientX - drag.lastX;
      const dy = e.clientY - drag.lastY;
      const now = performance.now();
      const dt = Math.max(1, now - drag.lastT) / 1000;
      drag.lastX = e.clientX;
      drag.lastY = e.clientY;
      drag.lastT = now;
      if (drag.mode === 'look') {
        // Grab-the-sky: dragging right turns the view left so the sky follows the pointer.
        const k = radPerPx();
        turn(dx * k, dy * k, 'look');
        velocity.current = { az: (dx * k) / dt, el: (dy * k) / dt };
      } else {
        turn(-dx * ORBIT_SPEED, dy * ORBIT_SPEED, 'orbit');
      }
    };

    const onPointerUp = (e) => {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinch = null;
      if (pointers.size === 0) {
        // Only keep momentum if the pointer was still moving when released.
        if (!drag || drag.mode !== 'look' || performance.now() - drag.lastT > 80) velocity.current = { az: 0, el: 0 };
        drag = null;
      }
    };

    const onWheel = (e) => {
      e.preventDefault();
      if (slewing.current) return;
      zoomAnchor.current = toNdc(e.clientX, e.clientY);
      const delta = e.deltaMode === 1 ? e.deltaY * 33 : e.deltaY;
      targetFov.current = THREE.MathUtils.clamp(targetFov.current * Math.exp(delta * ZOOM_SPEED), MIN_FOV, MAX_FOV);
    };

    const onContextMenu = (e) => e.preventDefault();

    el.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('contextmenu', onContextMenu);
    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('contextmenu', onContextMenu);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, camera]);

  /* ── Per-frame: smooth zoom toward the anchor, momentum, aim the camera ── */
  const before = useRef(new THREE.Vector3());
  const after = useRef(new THREE.Vector3());
  useFrame((_, delta) => {
    if (!slewing.current) {
      const fovGap = targetFov.current - camera.fov;
      if (Math.abs(fovGap) > 0.005) {
        // Keep the sky point under the zoom anchor fixed on screen while the FOV changes.
        const { x, y } = zoomAnchor.current;
        camera.lookAt(target.current);
        camera.updateMatrixWorld();
        before.current.set(x, y, 0.5).unproject(camera).sub(camera.position);
        camera.fov += fovGap * Math.min(1, delta * 12);
        camera.updateProjectionMatrix();
        after.current.set(x, y, 0.5).unproject(camera).sub(camera.position);
        const a = toAngles(before.current);
        const b = toAngles(after.current);
        let dAz = a.az - b.az;
        if (dAz > Math.PI) dAz -= Math.PI * 2;
        if (dAz < -Math.PI) dAz += Math.PI * 2;
        turn(dAz, a.el - b.el, 'look');
      }

      const v = velocity.current;
      if (Math.abs(v.az) + Math.abs(v.el) > 1e-4) {
        turn(v.az * delta, v.el * delta, 'look');
        const decay = Math.exp(-INERTIA_DECAY * delta);
        v.az *= decay;
        v.el *= decay;
      }
    }
    camera.up.copy(UP);
    camera.lookAt(target.current);
  });

  return null;
}

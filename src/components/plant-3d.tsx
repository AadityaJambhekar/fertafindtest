import { useEffect, useRef, useState } from "react";

type Body = { x: number; y: number; vx: number; vy: number; angle: number; omega: number };
type Grab = { localX: number; localY: number; pointerX: number; pointerY: number; lastX: number; lastY: number; time: number; throwX: number; throwY: number };
type Particle = { id: number; x: number; y: number; vx: number; vy: number; size: number; shade: string; settled: boolean };
type GrowingPlant = { id: number; x: number; growth: number };
type SoilCluster = { since: number; x: number };

const BAG_WIDTH = 145;
const BAG_HEIGHT = 220;
const toRadians = (degrees: number) => degrees * Math.PI / 180;
const rotate = (x: number, y: number, degrees: number) => {
  const angle = toRadians(degrees);
  return { x: x * Math.cos(angle) - y * Math.sin(angle), y: x * Math.sin(angle) + y * Math.cos(angle) };
};
const angleDelta = (target: number, current: number) => ((target - current + 540) % 360) - 180;

export function Plant3D() {
  const stage = useRef<HTMLDivElement>(null);
  const body = useRef<Body>({ x: 250, y: 150, vx: 0, vy: 0, angle: 0, omega: 0 });
  const grab = useRef<Grab | null>(null);
  const particles = useRef<Particle[]>([]);
  const particleId = useRef(0);
  const lastSpill = useRef(0);
  const initialized = useRef(false);
  const growingPlants = useRef<GrowingPlant[]>([]);
  const soilClusters = useRef<Map<number, SoilCluster>>(new Map());
  const plantId = useRef(0);
  const [render, setRender] = useState(body.current);
  const [particleRender, setParticleRender] = useState<Particle[]>([]);
  const [plantRender, setPlantRender] = useState<GrowingPlant[]>([]);

  const resetPlayground = () => {
    grab.current = null;
    particles.current = [];
    growingPlants.current = [];
    soilClusters.current.clear();
    particleId.current = 0;
    plantId.current = 0;
    lastSpill.current = 0;
    initialized.current = false;
    body.current = { x: 250, y: 150, vx: 0, vy: 0, angle: 0, omega: 0 };
    setRender({ ...body.current });
    setParticleRender([]);
    setPlantRender([]);
  };

  useEffect(() => {
    let frame = 0;
    let last = performance.now();
    const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
    const spill = (count: number) => {
      const item = body.current;
      const opening = rotate(0, -BAG_HEIGHT * 0.42, item.angle);
      const direction = rotate(0, -1, item.angle);
      particles.current.push(...Array.from({ length: count }, () => ({
        id: particleId.current++,
        x: item.x + opening.x + (Math.random() - 0.5) * 22,
        y: item.y + opening.y + (Math.random() - 0.5) * 8,
        vx: direction.x * (1 + Math.random() * 2) + item.vx * 0.14 + (Math.random() - 0.5) * 1.8,
        vy: direction.y * (1 + Math.random() * 2) + item.vy * 0.08,
        size: 4 + Math.random() * 5,
        shade: Math.random() > 0.5 ? "#6f451f" : Math.random() > 0.5 ? "#8b5a2b" : "#4d321c",
        settled: false,
      })));
      // Settled fertilizer remains in the playground. Only airborne overflow is trimmed.
      if (particles.current.length > 1200) {
        const airborne = particles.current.findIndex((particle) => !particle.settled);
        if (airborne >= 0) particles.current.splice(airborne, 1);
      }
    };

    const animate = (now: number) => {
      const dt = Math.min(2, (now - last) / 16.67);
      last = now;
      const node = stage.current;
      const item = body.current;
      if (node) {
        if (!initialized.current) {
          item.x = node.clientWidth >= 800 ? node.clientWidth * 0.76 : node.clientWidth * 0.66;
          item.y = Math.min(205, node.clientHeight * 0.34);
          initialized.current = true;
        }
        const held = grab.current;
        if (held) {
          // A damped pendulum and position spring give the bag soft, cartoon-like weight.
          const distanceFromCenter = Math.hypot(held.localX, held.localY);
          if (distanceFromCenter > 12) {
            const localGripAngle = Math.atan2(-held.localY, -held.localX) * 180 / Math.PI;
            const hangingAngle = 90 - localGripAngle;
            item.omega += angleDelta(hangingAngle, item.angle) * 0.00028 * dt;
          }
          item.omega = clamp(item.omega, -0.72, 0.72);
          item.omega *= Math.pow(0.82, dt);
          item.angle += item.omega * dt;
          const updatedGrip = rotate(held.localX, held.localY, item.angle);
          const targetX = held.pointerX - updatedGrip.x;
          const targetY = held.pointerY - updatedGrip.y;
          item.vx += (targetX - item.x) * 0.18 * dt;
          item.vy += (targetY - item.y) * 0.18 * dt;
          item.vx *= Math.pow(0.72, dt);
          item.vy *= Math.pow(0.72, dt);
          item.vx = clamp(item.vx, -24, 24);
          item.vy = clamp(item.vy, -24, 24);
          item.x += item.vx * dt;
          item.y += item.vy * dt;
          if (Math.abs(angleDelta(0, item.angle)) > 38 && now - lastSpill.current > 75) { spill(2); lastSpill.current = now; }
        } else {
          item.vy = Math.min(28, item.vy + 1.05 * dt);
          item.x += item.vx * dt;
          item.y += item.vy * dt;
          item.angle += item.omega * dt;
          item.vx *= Math.pow(0.993, dt);
          item.omega *= Math.pow(0.955, dt);
        }

        // A stable radius prevents the floor from jumping as the rectangle rotates.
        const radius = BAG_HEIGHT / 2;
        const visibleBagFloorOffset = BAG_HEIGHT * 0.33;
        const minX = radius; const maxX = node.clientWidth - radius;
        const minY = radius; const maxY = node.clientHeight - visibleBagFloorOffset - 6;
        if (item.x < minX || item.x > maxX) { item.x = clamp(item.x, minX, maxX); item.vx *= -0.52; item.omega *= -0.45; }
        if (item.y < minY || item.y > maxY) {
          const hitFloor = item.y > maxY;
          item.y = clamp(item.y, minY, maxY);
          if (!held) {
            if (hitFloor) {
              item.vy = Math.abs(item.vy) > 5 ? -Math.abs(item.vy) * 0.2 : 0;
              item.vx *= 0.5;
              item.omega *= 0.52;
            } else item.vy *= -0.3;
          }
        }
        if (!held && item.y >= maxY - 0.5 && Math.abs(item.vy) < 1.3) {
          item.vy = 0;
          item.vx *= Math.pow(0.68, dt);
          item.omega *= Math.pow(0.62, dt);
          item.angle += angleDelta(0, item.angle) * Math.min(1, 0.1 * dt);
        }
      }

      const floor = (node?.clientHeight ?? 460) - 7;
      particles.current = particles.current.map((dot) => {
        if (dot.settled) return dot;
        const next = { ...dot, x: dot.x + dot.vx * dt, y: dot.y + dot.vy * dt, vy: dot.vy + 0.5 * dt, vx: dot.vx * Math.pow(0.994, dt) };
        if (next.x < 5 || next.x > (node?.clientWidth ?? 500) - 5) { next.x = clamp(next.x, 5, (node?.clientWidth ?? 500) - 5); next.vx *= -0.35; }
        if (next.y >= floor) {
          next.y = floor - Math.random() * 7;
          next.vx *= 0.3;
          next.vy = 0;
          next.settled = true;
        }
        return next;
      });
      // Soil must build up and remain concentrated before a plant begins growing.
      // Each separate pile can create its own plant.
      const settled = particles.current.filter((dot) => dot.settled);
      const bins = new Map<number, Particle[]>();
      for (const dot of settled) {
        const bin = Math.floor(dot.x / 86);
        bins.set(bin, [...(bins.get(bin) ?? []), dot]);
      }
      for (const [bin, dots] of bins) {
        if (dots.length < 24) { soilClusters.current.delete(bin); continue; }
        const x = dots.reduce((sum, dot) => sum + dot.x, 0) / dots.length;
        const existing = soilClusters.current.get(bin);
        if (!existing) soilClusters.current.set(bin, { since: now, x });
        else existing.x += (x - existing.x) * 0.04;
        const cluster = soilClusters.current.get(bin)!;
        const hasPlant = growingPlants.current.some((plant) => Math.abs(plant.x - cluster.x) < 82);
        if (!hasPlant && now - cluster.since >= 2600) {
          growingPlants.current.push({ id: plantId.current++, x: cluster.x, growth: 0 });
        }
      }
      for (const [bin] of soilClusters.current) if (!bins.has(bin)) soilClusters.current.delete(bin);
      growingPlants.current = growingPlants.current.map((plant) => ({
        ...plant,
        growth: Math.min(1, plant.growth + 0.0036 * dt),
      }));
      setRender({ ...item });
      setParticleRender([...particles.current]);
      setPlantRender(growingPlants.current.map((plant) => ({ ...plant })));
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);

    const move = (event: PointerEvent) => {
      const held = grab.current;
      const node = stage.current;
      if (!held || !node) return;
      const rect = node.getBoundingClientRect();
      const elapsed = Math.max(1, event.timeStamp - held.time);
      held.pointerX = event.clientX - rect.left;
      held.pointerY = event.clientY - rect.top;
      held.throwX = clamp(((event.clientX - held.lastX) / elapsed) * 18, -24, 24);
      held.throwY = clamp(((event.clientY - held.lastY) / elapsed) * 18, -24, 24);
      body.current.omega += clamp((event.clientX - held.lastX) * -held.localY * 0.000025, -0.06, 0.06);
      const shake = Math.abs(held.throwX) + Math.abs(held.throwY) + Math.abs(body.current.omega) * 2;
      if (shake > 13 && performance.now() - lastSpill.current > 55) { spill(shake > 24 ? 5 : 3); lastSpill.current = performance.now(); }
      held.lastX = event.clientX; held.lastY = event.clientY; held.time = event.timeStamp;
    };
    const release = () => {
      if (grab.current) {
        body.current.vx = grab.current.throwX * 0.42;
        body.current.vy = grab.current.throwY;
        body.current.omega = clamp(body.current.omega, -0.9, 0.9);
        if (Math.hypot(body.current.vx, body.current.vy) > 3) spill(9);
      }
      grab.current = null;
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", release); window.removeEventListener("pointercancel", release); };
  }, []);

  return <div ref={stage} className="plant-3d-stage fertilizer-playground front-page-physics" aria-label="Interactive fertilizer bag. Grab any point and throw it across the homepage hero.">
    <button type="button" className="plant-3d-reset" onClick={resetPlayground} aria-label="Reset fertilizer playground">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.9 8.1A8 8 0 1 1 4 14" /><path d="M4.9 3.8v4.3h4.3" /></svg>
      Reset
    </button>
    {particleRender.map((dot) => <span key={dot.id} className="fertilizer-particle" style={{ width: dot.size, height: dot.size, backgroundColor: dot.shade, transform: `translate3d(${dot.x}px, ${dot.y}px, 0) rotate(45deg)` }} />)}
    {plantRender.map((plant) => <svg key={plant.id} className="fertilizer-growing-plant" viewBox="0 0 126 154" aria-label="A tree growing from the collected fertilizer" style={{ left: plant.x, transform: `translateX(-50%) scale(${plant.growth})` }}>
      <ellipse cx="63" cy="148" rx="40" ry="6" fill="#6f451f" opacity=".28" />
      <path d="M56 145c5-33 4-66 2-101h13c-2 36-1 69 5 101Z" fill="#76502b" />
      <path d="M63 96 37 73M66 78l26-25M61 62 45 43" fill="none" stroke="#76502b" strokeWidth="7" strokeLinecap="round" />
      <circle cx="63" cy="43" r="29" fill="#178A45" />
      <circle cx="39" cy="66" r="25" fill="#48B85C" />
      <circle cx="88" cy="61" r="28" fill="#2f9f50" />
      <circle cx="66" cy="78" r="29" fill="#178A45" />
      <circle cx="45" cy="38" r="20" fill="#54bd65" />
      <circle cx="87" cy="33" r="22" fill="#48B85C" />
      <path d="M32 60c21 9 43 9 67-2" fill="none" stroke="#82cf86" strokeWidth="3" strokeLinecap="round" opacity=".55" />
    </svg>)}
    <div className="fertilizer-bag" style={{ transform: `translate3d(${render.x - BAG_WIDTH / 2}px, ${render.y - BAG_HEIGHT / 2}px, 0) rotate(${render.angle}deg)` }} onPointerDown={(event) => {
      const rect = stage.current?.getBoundingClientRect(); if (!rect) return;
      const pointerX = event.clientX - rect.left; const pointerY = event.clientY - rect.top;
      const local = rotate(pointerX - body.current.x, pointerY - body.current.y, -body.current.angle);
      grab.current = { localX: local.x, localY: local.y, pointerX, pointerY, lastX: event.clientX, lastY: event.clientY, time: event.timeStamp, throwX: 0, throwY: 0 };
      body.current.vx = 0; body.current.vy = 0;
    }}>
      <div className="fertilizer-bag-crop"><img src="/fertilizer-bag-clean.png" alt="Fertilizer bag" draggable={false} /></div>
    </div>
    <span className="plant-3d-hint">Grab anywhere &amp; throw</span>
  </div>;
}

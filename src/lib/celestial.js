import * as THREE from 'three';

/* ── Deterministic randomness ─────────────────────────────────────────────── */

export function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function rand() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ── Sky geometry ─────────────────────────────────────────────────────────── */

/*
 * The scene is a planetarium: the origin is the observer and RA/Dec map onto
 * directions with north up (+Y) and RA increasing to the LEFT when facing
 * RA 0h (−Z), just like the real sky seen from the ground. A star's distance
 * from the origin is set (log-scaled) by its real distance in light years,
 * so orbiting the camera shows genuine depth between stars in a pattern.
 */
const SKY_BASE = 250;
const DEPTH_PER_DECADE = 22;
const DSO_DEFAULT_LY = 3000;

export function raDecToDirection(ra, dec) {
  const a = (ra / 24) * Math.PI * 2;
  const d = THREE.MathUtils.degToRad(dec);
  return new THREE.Vector3(-Math.cos(d) * Math.sin(a), Math.sin(d), -Math.cos(d) * Math.cos(a));
}

export function skyRadius(ly = DSO_DEFAULT_LY) {
  return SKY_BASE + Math.log10(Math.max(ly, 1)) * DEPTH_PER_DECADE;
}

export function raDecToPosition(ra, dec, ly) {
  return raDecToDirection(ra, dec).multiplyScalar(skyRadius(ly));
}

/* Ecliptic longitude (degrees) → equatorial RA (hours) / Dec (degrees), J2000 obliquity. */
const OBLIQUITY = THREE.MathUtils.degToRad(23.4393);
export function eclipticToRaDec(lambdaDeg) {
  const l = THREE.MathUtils.degToRad(lambdaDeg);
  let ra = Math.atan2(Math.sin(l) * Math.cos(OBLIQUITY), Math.cos(l));
  if (ra < 0) ra += Math.PI * 2;
  return { ra: (ra / (Math.PI * 2)) * 24, dec: THREE.MathUtils.radToDeg(Math.asin(Math.sin(OBLIQUITY) * Math.sin(l))) };
}

/*
 * Solar-system targets have no fixed position, so they're spaced along this
 * stretch of the ecliptic, the path the Sun, Moon and planets really follow,
 * which runs through Taurus and Gemini just south of Auriga.
 */
const SOLAR_SYSTEM_LAMBDA = [64, 106];

/* Items farther than this from a sector's centre still get a real star, but don't stretch the camera framing. */
const FRAMING_RADIUS_DEG = 35;

/* Spectral class → 0 (hot/blue) … 1 (cool/red), used to tint stars between theme tokens. */
const SPECTRAL_TEMP = { O: 0.05, B: 0.15, A: 0.35, F: 0.5, G: 0.65, K: 0.8, M: 0.95 };
export const spectralTemp = (spec) => SPECTRAL_TEMP[spec] ?? 0.5;

/*
 * Builds the whole sky from the sector list + catalog. For every sector:
 *   stars      — one per content item, at a real catalog star (item.star or the
 *                next brightest unused one), or at item.coords for DSOs; if the
 *                constellation runs out of stars, a seeded spot near its centre.
 *   background — catalog stars with no item, drawn dim and non-interactive.
 *   lines      — real stick-figure segments as [from, to] positions.
 *   glows      — real nebulae/clusters for the nebula layer.
 * Also returns `byItem`, an itemId → star info lookup for the UI.
 */
export function buildSky(sectors, catalog, itemsFor, contextNames = []) {
  const named = {};
  Object.values(catalog).forEach((c) =>
    c.stars.forEach((s) => {
      named[s.name] = { ...s, constellation: c.name, position: raDecToPosition(s.ra, s.dec, s.ly).toArray() };
    }),
  );

  const sky = { sectors: {}, byItem: {} };

  sectors.forEach((sector) => {
    const con = catalog[sector.constellation];
    const centerDir = new THREE.Vector3();
    con.stars.forEach((s) => centerDir.add(raDecToDirection(s.ra, s.dec)));
    centerDir.normalize();
    const center = centerDir.clone().multiplyScalar(300);
    const centerRaDec = directionToRaDec(centerDir);

    const items = itemsFor(sector);
    const claimed = new Set(items.map((i) => i.star).filter(Boolean));
    const spare = con.stars.filter((s) => !claimed.has(s.name));
    const solarItems = items.filter((i) => i.solarSystem);

    const stars = items.map((item, index) => {
      let info;
      if (item.solarSystem) {
        const k = solarItems.indexOf(item);
        const [l0, l1] = SOLAR_SYSTEM_LAMBDA;
        const lambda = solarItems.length > 1 ? l0 + ((l1 - l0) * k) / (solarItems.length - 1) : (l0 + l1) / 2;
        const { ra, dec } = eclipticToRaDec(lambda);
        info = {
          name: item.target || item.title,
          designation: '',
          ra,
          dec,
          mag: 5,
          spec: null,
          ly: 1500,
          constellation: con.name,
          deepSky: true,
          solarSystem: true,
        };
        info.position = raDecToPosition(ra, dec, info.ly).toArray();
      } else if (item.coords) {
        info = {
          name: item.catalogId || item.target || item.title,
          designation: item.catalogId || '',
          ra: item.coords.ra,
          dec: item.coords.dec,
          mag: 5,
          spec: null,
          ly: item.coords.ly ?? DSO_DEFAULT_LY,
          constellation: item.coords.constellation ?? con.name,
          deepSky: true,
        };
        info.position = raDecToPosition(info.ra, info.dec, info.ly).toArray();
      } else if (item.star && named[item.star]) {
        info = named[item.star];
      } else if (spare.length) {
        info = named[spare.shift().name];
      } else {
        // Constellation exhausted: seeded point within ~7° of the centre.
        const rand = mulberry32(hashString(`${sector.id}:${item.id}`));
        const ra = centerRaDec.ra + (rand() - 0.5) * 0.9;
        const dec = centerRaDec.dec + (rand() - 0.5) * 14;
        info = { name: item.id, designation: '', ra, dec, mag: 3.5, spec: 'A', ly: 500, constellation: con.name };
        info.position = raDecToPosition(ra, dec, info.ly).toArray();
      }
      const star = { ...info, item, index, temp: info.deepSky ? 0.5 : spectralTemp(info.spec) };
      sky.byItem[item.id] = star;
      return star;
    });

    const used = new Set(stars.map((s) => s.name));
    const background = con.stars
      .filter((s) => !used.has(s.name))
      .map((s) => ({ ...named[s.name], temp: spectralTemp(s.spec) }));

    const lines = con.lines
      .filter(([a, b]) => named[a] && named[b])
      .map(([a, b]) => [named[a].position, named[b].position]);

    const glows = (con.glows || []).map((g) => ({
      ...g,
      position: raDecToDirection(g.ra, g.dec).multiplyScalar(skyRadius(1500) + 25).toArray(),
    }));

    // Label sits just below the constellation's southernmost star.
    const minDec = Math.min(...con.stars.map((s) => s.dec));
    const labelPosition = raDecToDirection(centerRaDec.ra, minDec - 4).multiplyScalar(300).toArray();

    sky.sectors[sector.id] = {
      // Everything that should be in frame when the sector is viewed (far-flung items like M13 excepted).
      points: [...stars, ...background]
        .filter((st) => raDecToDirection(st.ra, st.dec).angleTo(centerDir) <= THREE.MathUtils.degToRad(FRAMING_RADIUS_DEG))
        .map((st) => st.position),
      center: center.toArray(),
      ra: centerRaDec.ra,
      dec: centerRaDec.dec,
      constellation: con.name,
      labelPosition,
      stars,
      background,
      lines,
      glows,
    };
  });

  // Context-only constellations (e.g. Hercules around M13): stars, figure and glows, no items.
  sky.context = contextNames
    .filter((n) => catalog[n])
    .map((n) => {
      const con = catalog[n];
      const centerDir = new THREE.Vector3();
      con.stars.forEach((s) => centerDir.add(raDecToDirection(s.ra, s.dec)));
      const { ra } = directionToRaDec(centerDir.normalize());
      const minDec = Math.min(...con.stars.map((s) => s.dec));
      return {
        name: con.name,
        background: con.stars.map((s) => ({ ...named[s.name], temp: spectralTemp(s.spec) })),
        lines: con.lines.filter(([a, b]) => named[a] && named[b]).map(([a, b]) => [named[a].position, named[b].position]),
        glows: (con.glows || []).map((g) => ({
          ...g,
          position: raDecToDirection(g.ra, g.dec).multiplyScalar(skyRadius(1500) + 25).toArray(),
        })),
        labelPosition: raDecToDirection(ra, minDec - 4).multiplyScalar(300).toArray(),
      };
    });

  sky.allPoints = Object.values(sky.sectors).flatMap((sec) => sec.points);

  // Every drawn constellation as a list of star directions, for "what am I looking at?" lookups.
  sky.fields = [
    ...sectors.map((sector) => {
      const sec = sky.sectors[sector.id];
      return {
        name: sec.constellation,
        dirs: [...sec.stars.filter((st) => !st.deepSky), ...sec.background].map((st) => raDecToDirection(st.ra, st.dec)),
      };
    }),
    ...sky.context.map((con) => ({
      name: con.name,
      dirs: con.background.map((st) => raDecToDirection(st.ra, st.dec)),
    })),
  ];
  return sky;
}

/* ── Camera poses ─────────────────────────────────────────────────────────── */

const UP = new THREE.Vector3(0, 1, 0);
const NO_INSETS = { top: 0, right: 0, bottom: 0, left: 0 };

/*
 * Frames `points` around `center`, viewed from the observer's side, so they
 * fit inside the part of the screen not covered by UI. `insets` are the
 * covered fractions of the viewport per side (see viewportInsets in
 * layout.js). The camera backs off along the centre direction far enough for
 * the pattern's horizontal and vertical extent to fit the visible rectangle,
 * and the look-at target is offset so the pattern lands in that rectangle's
 * centre rather than the screen's.
 */
export function framePose({ center, points = [], minExtent = 6, insets = NO_INSETS, aspect = 16 / 9, fov = 50, margin = 1.12, minDistance = 30, maxDistance = 900 }) {
  const c = new THREE.Vector3(...center);
  const dir = c.clone().normalize();
  const right = new THREE.Vector3().crossVectors(dir, UP).normalize();
  const up = new THREE.Vector3().crossVectors(right, dir).normalize();

  let hx = minExtent;
  let hy = minExtent;
  const d = new THREE.Vector3();
  points.forEach((p) => {
    d.set(...p).sub(c);
    hx = Math.max(hx, Math.abs(d.dot(right)));
    hy = Math.max(hy, Math.abs(d.dot(up)));
  });

  // Visible rectangle in normalised device coordinates.
  const x0 = -1 + 2 * insets.left;
  const x1 = 1 - 2 * insets.right;
  const y0 = -1 + 2 * insets.bottom;
  const y1 = 1 - 2 * insets.top;
  const hw = Math.max(0.2, (x1 - x0) / 2);
  const hh = Math.max(0.2, (y1 - y0) / 2);
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;

  const tanV = Math.tan(THREE.MathUtils.degToRad(fov / 2));
  const tanH = tanV * aspect;
  const distance = THREE.MathUtils.clamp(Math.max(hx / (hw * tanH), hy / (hh * tanV)) * margin, minDistance, maxDistance);

  const position = c.clone().sub(dir.clone().multiplyScalar(distance));
  const target = c
    .clone()
    .sub(right.clone().multiplyScalar(cx * distance * tanH))
    .sub(up.clone().multiplyScalar(cy * distance * tanV));
  return { position: position.toArray(), target: target.toArray(), fov };
}

/* All-sky overview framing every sector. */
export function homePose(sky, view = {}) {
  const dir = new THREE.Vector3();
  Object.values(sky.sectors).forEach((s) => dir.add(new THREE.Vector3(...s.center).normalize()));
  return framePose({ center: dir.normalize().multiplyScalar(300).toArray(), points: sky.allPoints, fov: 60, margin: 1.06, ...view });
}

/* Frames one constellation (plus any of its items placed outside it, e.g. deep-sky photos). */
export function sectorPose(skySector, view = {}) {
  return framePose({ center: skySector.center, points: skySector.points, fov: 50, ...view });
}

/*
 * Close-up on a single star, the way a telescope does it: stay back near the
 * observer and narrow the field of view, rather than flying up to the star.
 * Flying close breaks the sky's geometry (stars only a little nearer than
 * the target end up beside or behind the camera), which hid Hercules around M13.
 */
export function itemPose(starPosition, view = {}) {
  return framePose({ center: starPosition, minExtent: 9, fov: 30, margin: 1, minDistance: 220, ...view });
}

/*
 * Which constellation is at the centre of the view: the one with a star
 * closest to the view direction, if within `maxDeg`. Returns its name or null.
 */
const _view = new THREE.Vector3();
export function constellationInView(camera, fields, maxDeg = 22) {
  camera.getWorldDirection(_view);
  let best = null;
  let bestAngle = THREE.MathUtils.degToRad(maxDeg);
  fields.forEach((f) =>
    f.dirs.forEach((d) => {
      const a = _view.angleTo(d);
      if (a < bestAngle) {
        bestAngle = a;
        best = f.name;
      }
    }),
  );
  return best;
}

/* Angle (degrees) between the view direction and the direction from the camera to `point`. */
const _toPoint = new THREE.Vector3();
export function angleToPoint(camera, point) {
  camera.getWorldDirection(_view);
  _toPoint.set(...point).sub(camera.position);
  return THREE.MathUtils.radToDeg(_view.angleTo(_toPoint));
}

/* ── Sky coordinates ──────────────────────────────────────────────────────── */

/* Converts a world-space direction into right ascension (hours) and declination (degrees). */
export function directionToRaDec(dir) {
  const d = dir.clone().normalize();
  let ra = (Math.atan2(-d.x, -d.z) / (Math.PI * 2)) * 24;
  if (ra < 0) ra += 24;
  const dec = THREE.MathUtils.radToDeg(Math.asin(THREE.MathUtils.clamp(d.y, -1, 1)));
  return { ra, dec };
}

const _ndc = new THREE.Vector3();
/* RA/Dec under a normalised-device-coordinate point for the given camera. */
export function ndcToRaDec(x, y, camera) {
  _ndc.set(x, y, 0.5).unproject(camera).sub(camera.position);
  return directionToRaDec(_ndc);
}

const pad = (n, w = 2) => String(Math.floor(n)).padStart(w, '0');

export function formatRA(hours) {
  const h = Math.floor(hours);
  const mFloat = (hours - h) * 60;
  const m = Math.floor(mFloat);
  const s = (mFloat - m) * 60;
  return `${pad(h)}h ${pad(m)}m ${s.toFixed(1).padStart(4, '0')}s`;
}

export function formatDec(deg) {
  const sign = deg < 0 ? '-' : '+';
  const abs = Math.abs(deg);
  const d = Math.floor(abs);
  const mFloat = (abs - d) * 60;
  const m = Math.floor(mFloat);
  const s = Math.floor((mFloat - m) * 60);
  return `${sign}${pad(d)}° ${pad(m)}′ ${pad(s)}″`;
}

/* Local sidereal time (hours) for a longitude in degrees east. */
export function localSiderealTime(date, longitude) {
  const jd = date.getTime() / 86400000 + 2440587.5;
  const d = jd - 2451545.0;
  const gmst = 18.697374558 + 24.06570982441908 * d;
  let lst = (gmst + longitude / 15) % 24;
  if (lst < 0) lst += 24;
  return lst;
}

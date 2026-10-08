/*
 * Real sky data for the five neighbouring winter constellations the portfolio
 * sectors live in: Orion, Taurus, Gemini, Auriga and Canis Major.
 *
 * Coordinates are J2000 (RA in hours, Dec in degrees), `mag` is apparent
 * visual magnitude, `spec` the spectral class letter (drives star colour) and
 * `ly` the approximate distance in light years (drives depth in the 3D scene).
 * `lines` are the traditional stick-figure segments; a line may reference a
 * star from a neighbouring constellation (Auriga borrows Elnath from Taurus).
 * `glows` mark real nebulae / clusters that get a soft cloud in the scene.
 */

/* Right ascension from hours, minutes, seconds → decimal hours. */
export const hms = (h, m = 0, s = 0) => h + m / 60 + s / 3600;
/* Declination from degrees, arcminutes, arcseconds → decimal degrees (sign taken from `d`, use -0 for e.g. -0°18′). */
export const dms = (d, m = 0, s = 0) => {
  const sign = d < 0 || Object.is(d, -0) ? -1 : 1;
  return sign * (Math.abs(d) + m / 60 + s / 3600);
};

const star = (name, designation, ra, dec, mag, spec, ly) => ({ name, designation, ra, dec, mag, spec, ly });

export const constellations = {
  Orion: {
    name: 'Orion',
    genitive: 'Orionis',
    stars: [
      star('Rigel', 'β Ori', hms(5, 14, 32.3), dms(-8, 12, 6), 0.13, 'B', 860),
      star('Betelgeuse', 'α Ori', hms(5, 55, 10.3), dms(7, 24, 25), 0.5, 'M', 548),
      star('Bellatrix', 'γ Ori', hms(5, 25, 7.9), dms(6, 20, 59), 1.64, 'B', 250),
      star('Alnilam', 'ε Ori', hms(5, 36, 12.8), dms(-1, 12, 7), 1.69, 'B', 2000),
      star('Alnitak', 'ζ Ori', hms(5, 40, 45.5), dms(-1, 56, 34), 1.77, 'O', 1260),
      star('Saiph', 'κ Ori', hms(5, 47, 45.4), dms(-9, 40, 11), 2.09, 'B', 650),
      star('Mintaka', 'δ Ori', hms(5, 32, 0.4), dms(-0, 17, 57), 2.23, 'O', 1200),
      star('Meissa', 'λ Ori', hms(5, 35, 8.3), dms(9, 56, 3), 3.33, 'O', 1100),
    ],
    lines: [
      ['Meissa', 'Betelgeuse'],
      ['Meissa', 'Bellatrix'],
      ['Betelgeuse', 'Bellatrix'],
      ['Betelgeuse', 'Alnitak'],
      ['Bellatrix', 'Mintaka'],
      ['Alnitak', 'Alnilam'],
      ['Alnilam', 'Mintaka'],
      ['Alnitak', 'Saiph'],
      ['Mintaka', 'Rigel'],
    ],
    glows: [{ name: 'M42 Orion Nebula', ra: hms(5, 35, 17), dec: dms(-5, 23, 28), size: 34, tint: 'nebula-3' }],
  },

  Taurus: {
    name: 'Taurus',
    genitive: 'Tauri',
    stars: [
      star('Aldebaran', 'α Tau', hms(4, 35, 55.2), dms(16, 30, 33), 0.85, 'K', 65),
      star('Elnath', 'β Tau', hms(5, 26, 17.5), dms(28, 36, 27), 1.65, 'B', 134),
      star('Alcyone', 'η Tau', hms(3, 47, 29.1), dms(24, 6, 18), 2.87, 'B', 440),
      star('Tianguan', 'ζ Tau', hms(5, 37, 38.7), dms(21, 8, 33), 3.0, 'B', 440),
      star('Lambda Tauri', 'λ Tau', hms(4, 0, 40.8), dms(12, 29, 25), 3.47, 'B', 480),
      star('Ain', 'ε Tau', hms(4, 28, 36.9), dms(19, 10, 50), 3.53, 'K', 147),
      star('Prima Hyadum', 'γ Tau', hms(4, 19, 47.6), dms(15, 37, 39), 3.65, 'G', 154),
      star('Secunda Hyadum', 'δ¹ Tau', hms(4, 22, 56.1), dms(17, 32, 33), 3.76, 'K', 153),
    ],
    lines: [
      ['Tianguan', 'Aldebaran'],
      ['Aldebaran', 'Prima Hyadum'],
      ['Prima Hyadum', 'Lambda Tauri'],
      ['Elnath', 'Ain'],
      ['Ain', 'Secunda Hyadum'],
      ['Secunda Hyadum', 'Prima Hyadum'],
    ],
    glows: [{ name: 'M45 Pleiades', ra: hms(3, 47, 24), dec: dms(24, 7), size: 26, tint: 'nebula-2' }],
  },

  Gemini: {
    name: 'Gemini',
    genitive: 'Geminorum',
    stars: [
      star('Pollux', 'β Gem', hms(7, 45, 18.9), dms(28, 1, 34), 1.14, 'K', 34),
      star('Castor', 'α Gem', hms(7, 34, 35.9), dms(31, 53, 18), 1.58, 'A', 51),
      star('Alhena', 'γ Gem', hms(6, 37, 42.7), dms(16, 23, 57), 1.92, 'A', 109),
      star('Mebsuta', 'ε Gem', hms(6, 43, 55.9), dms(25, 7, 52), 3.06, 'G', 840),
      star('Wasat', 'δ Gem', hms(7, 20, 7.4), dms(21, 58, 56), 3.53, 'F', 60),
      star('Tejat', 'μ Gem', hms(6, 22, 57.6), dms(22, 30, 49), 2.87, 'M', 230),
      star('Propus', 'η Gem', hms(6, 14, 52.7), dms(22, 30, 24), 3.3, 'M', 700),
      star('Mekbuda', 'ζ Gem', hms(7, 4, 6.5), dms(20, 34, 13), 3.9, 'G', 1200),
    ],
    lines: [
      ['Castor', 'Pollux'],
      ['Castor', 'Mebsuta'],
      ['Mebsuta', 'Tejat'],
      ['Tejat', 'Propus'],
      ['Pollux', 'Wasat'],
      ['Wasat', 'Mekbuda'],
      ['Mekbuda', 'Alhena'],
    ],
    glows: [{ name: 'M35', ra: hms(6, 8, 54), dec: dms(24, 20), size: 16, tint: 'nebula-2' }],
  },

  Auriga: {
    name: 'Auriga',
    genitive: 'Aurigae',
    stars: [
      star('Capella', 'α Aur', hms(5, 16, 41.4), dms(45, 59, 53), 0.08, 'G', 43),
      star('Menkalinan', 'β Aur', hms(5, 59, 31.7), dms(44, 56, 51), 1.9, 'A', 81),
      star('Mahasim', 'θ Aur', hms(5, 59, 43.3), dms(37, 12, 45), 2.62, 'A', 166),
      star('Hassaleh', 'ι Aur', hms(4, 56, 59.6), dms(33, 9, 58), 2.69, 'K', 490),
      star('Almaaz', 'ε Aur', hms(5, 1, 58.1), dms(43, 49, 24), 3.0, 'F', 2000),
      star('Haedus', 'η Aur', hms(5, 6, 30.9), dms(41, 14, 4), 3.17, 'B', 240),
    ],
    lines: [
      ['Capella', 'Menkalinan'],
      ['Menkalinan', 'Mahasim'],
      ['Mahasim', 'Elnath'],
      ['Elnath', 'Hassaleh'],
      ['Hassaleh', 'Capella'],
      ['Capella', 'Almaaz'],
      ['Almaaz', 'Haedus'],
    ],
    glows: [
      { name: 'IC 405 Flaming Star', ra: hms(5, 16, 5), dec: dms(34, 27), size: 22, tint: 'nebula-1' },
      { name: 'IC 410', ra: hms(5, 22, 44), dec: dms(33, 22), size: 18, tint: 'nebula-3' },
    ],
  },

  'Canis Major': {
    name: 'Canis Major',
    genitive: 'Canis Majoris',
    stars: [
      star('Sirius', 'α CMa', hms(6, 45, 8.9), dms(-16, 42, 58), -1.46, 'A', 8.6),
      star('Adhara', 'ε CMa', hms(6, 58, 37.5), dms(-28, 58, 20), 1.5, 'B', 430),
      star('Wezen', 'δ CMa', hms(7, 8, 23.5), dms(-26, 23, 36), 1.83, 'F', 1600),
      star('Mirzam', 'β CMa', hms(6, 22, 42.0), dms(-17, 57, 21), 1.98, 'B', 500),
      star('Aludra', 'η CMa', hms(7, 24, 5.7), dms(-29, 18, 11), 2.45, 'B', 2000),
      star('Furud', 'ζ CMa', hms(6, 20, 18.8), dms(-30, 3, 48), 3.02, 'B', 360),
      star('Muliphein', 'γ CMa', hms(7, 3, 45.5), dms(-15, 37, 50), 4.1, 'B', 400),
    ],
    lines: [
      ['Mirzam', 'Sirius'],
      ['Sirius', 'Muliphein'],
      ['Sirius', 'Wezen'],
      ['Wezen', 'Adhara'],
      ['Wezen', 'Aludra'],
      ['Adhara', 'Furud'],
    ],
    glows: [{ name: 'M41', ra: hms(6, 46, 0), dec: dms(-20, 44), size: 16, tint: 'nebula-2' }],
  },
};

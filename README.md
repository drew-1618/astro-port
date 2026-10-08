# AGJ · Observatory Portfolio

A portfolio site built as an interactive starmap of the real winter sky, using React, react-three-fiber and Tailwind. The five sectors are five neighboring constellations: Orion, Taurus, Gemini, Auriga and Canis Major. Every project, role, skill group, school and photo is drawn as a real star or deep-sky object at its true J2000 position. The constellation lines are the traditional stick figures, and each star's distance from the camera reflects its real distance in light years.

```bash
npm install
npm run dev      # local dev server at http://localhost:5173/
npm run dev:lan  # same, but reachable from other devices on your network
npm run build    # production build → dist/
npm run preview  # serve the build at http://localhost:4173/astro-port/
```

## Deployment

The site is live at **https://drew-1618.github.io/astro-port/**. Every push to `main` triggers `.github/workflows/deploy.yml`, which builds the site and publishes it to GitHub Pages, usually within a couple of minutes. You can follow progress in the repo's **Actions** tab.

Production builds use the base path `/astro-port/` (set in `vite.config.js`). If you rename the repo or move the site to a custom domain, update `base` there.

## Editing content

All content lives in **`src/data/portfolioData.js`**. You never need to edit a component to add content:

| Want to add…          | Append an object to | Result                                   |
| --------------------- | ------------------- | ---------------------------------------- |
| A project             | `projects`          | New star in Sector Alpha + card + modal  |
| A job / co-op         | `experience`        | New star in Sector Beta + mission log    |
| A skill group         | `skills`            | New star in Sector Gamma + sensor panel  |
| An astrophoto         | `astrophotos`       | New star in Sector Delta + gallery card  |
| A school              | `education`         | New star in Sector Epsilon               |

### Which star an item becomes

| Sector  | Constellation | Content       |
| ------- | ------------- | ------------- |
| Alpha   | Orion         | projects      |
| Beta    | Taurus        | experience    |
| Gamma   | Gemini        | skills        |
| Delta   | Auriga        | astrophotos   |
| Epsilon | Canis Major   | education + comms (Sirius) |

- Set `star: 'Betelgeuse'` on an item to choose its star. The star names are listed in `src/data/skyCatalog.js`.
- If you leave `star` out, the item takes the brightest unused star in that constellation.
- Astrophotos use `coords: { ra: hms(5, 35, 17), dec: dms(-5, 23) }` instead. That places the photo's star at the target's real coordinates, even if they fall in a different constellation (an M42 photo would sit in Orion).
- Solar-system targets like Saturn or the Moon have no fixed coordinates. Leave `coords` out and they take a star in the sector instead.
- If a constellation runs out of named stars, any extra items get a seeded spot near its center.
- Catalog stars that no item uses are still drawn, dimmer and not clickable, so each constellation stays complete.

### Still to fill in
- `profile.contact.key`: lets the contact form deliver messages straight to your inbox. Get a free access key at [web3forms.com](https://web3forms.com) by entering your email; the key arrives by email. Paste it in as `contact: { provider: 'web3forms', key: '...' }`. Formspree works too: `{ provider: 'formspree', key: '<form id>' }`. The key is safe to publish, since it can only send mail to you. Until a key is set, Transmit opens the visitor's mail app instead.
- `projects[].repo` / `projects[].demo`: once you add a URL, the button appears in the Observation Log.
- `astrophotos`: real captures live in `public/astro/` (full size, max 2400px) and `public/astro/thumbs/` (800px). Keep originals in the git-ignored `AstroPhotos/` folder. Gear and integration details are filled in only where the photo's EXIF data recorded them; fill in the rest (telescope, mount, sub counts, dates) and they'll appear automatically.

  To add a photo:
  ```bash
  convert AstroPhotos/NAME.jpg -auto-orient -strip -resize '2400x2400>' -interlace JPEG -quality 84 public/astro/ID.jpg
  convert AstroPhotos/NAME.jpg -auto-orient -strip -resize '800x800>'   -interlace JPEG -quality 80 public/astro/thumbs/ID.jpg
  ```
  Then add an entry to `astrophotos` with `image: '/astro/ID.jpg'` and `thumb: '/astro/thumbs/ID.jpg'`. Use `coords` for deep-sky targets, or `solarSystem: true` for the Sun, Moon, planets and comets, which are placed along the ecliptic.

## Structure

```
src/data/portfolioData.js         content + sector definitions
src/data/skyCatalog.js            real stars, stick figures and nebulae for the five constellations
src/lib/celestial.js              RA/Dec → 3D sky, star assignment, camera poses, sidereal time
src/lib/theme.js                  CSS theme tokens → THREE.Color
src/lib/useAmbientAudio.js        WebAudio ambience + slew chirp
src/components/StarfieldCanvas.jsx    R3F scene
src/components/starfield/*        background stars (shader), nebulae, sector clusters, camera rig (GSAP)
src/components/HudOverlay.jsx     header/footer telemetry, nav dock, reticle, toggles
src/components/SectorPanel.jsx    sector drawer (bottom sheet on mobile)
src/components/sections/*         projects, experience, skills, education
src/components/GallerySection.jsx astrophotography grid
src/components/ObservationModal.jsx   shared detail modal (project / role / photo)
src/components/TransmissionTerminal.jsx   contact form (direct send via src/lib/sendMessage.js, mailto fallback)
```

## Theming

Colors are RGB triples stored as CSS variables in `src/index.css` (`:root[data-theme='sky']` and `[data-theme='red']`). Tailwind's color names map to these variables, and the 3D scene reads the same variables, so the Dark-Sky Red filter recolors everything at once. To change the palette, edit the variables.

## Responsive layouts

`src/lib/layout.js` picks one of three layouts:

| Layout    | When                                    | Navigation          | Content panel                           |
| --------- | --------------------------------------- | ------------------- | --------------------------------------- |
| desktop   | ≥ 1024px wide                           | left sector dock    | right side panel, footer telemetry      |
| mobile    | phones and tablets held upright         | bottom tab bar      | bottom sheet: tap the handle or swipe to collapse |
| landscape | phone on its side (≤ 540px tall)        | left icon rail      | right side panel                        |

The camera framing (`framePose` in `celestial.js`) fits each constellation into whatever part of the screen the UI leaves open, so it's re-framed when you rotate, resize, or collapse the sheet. If you change the size of the header, panel, sheet or tab bar, update the matching pixel values in `CHROME` in `layout.js`. The landscape media query is defined twice and must stay identical: once in `layout.js` and once as the `land` screen in `tailwind.config.js`.

## Controls

Navigation works like a planetarium or telescope (`src/components/starfield/CameraRig.jsx`):

- **Scroll / pinch:** zoom by changing the field of view (3°–100°) toward the point under the cursor or between your fingers. The FOV readout updates live.
- **Drag / one finger:** look around from where you stand. The sky follows the pointer at any zoom and keeps a little momentum when you let go.
- **Shift+drag / right-drag:** orbit around the current target to see the real 3D depth between stars.
- **Swipe left/right in a detail view (touch):** previous / next entry.
- Clicking a sector, a star or Recenter moves the camera to that view, undoing any manual zoom or drag.

- `Esc` closes the modal. With no modal open, it closes the sector panel and returns to the all-sky view.
- `←` / `→` step through entries while the modal is open.

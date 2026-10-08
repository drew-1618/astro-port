/*
 * ─────────────────────────────────────────────────────────────────────────────
 *  PORTFOLIO DATA — the single source of truth for every piece of content.
 *
 *  Add a project / role / photo / skill by appending an object to the relevant
 *  array below. The starfield, navigation, cards and modals are all generated
 *  from these arrays; no component code needs to change.
 *
 *  Fields set to null (unknown gear, dates, links) are simply not shown.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { dms, hms } from './skyCatalog';

export const profile = {
  name: 'Andrew Garrett Johnson',
  initials: 'AGJ',
  callsign: 'OBS-AGJ',
  title: 'CS @ Tennessee Tech · Math Minor',
  location: 'Cookeville, TN / Knoxville, TN',
  // Observatory "site" shown in the HUD. Approximate, Cookeville TN.
  site: { name: 'Cookeville, TN', lat: 36.16, lon: -85.5 },
  email: 'andrewjohnson11235@gmail.com',
  /*
   * Contact form delivery (GitHub Pages has no server, so a form-to-email
   * service relays messages to `email`). Paste a Web3Forms access key
   * (https://web3forms.com, free, no account) or switch provider to
   * 'formspree' and use a Formspree form ID. Leave `key` empty and the form
   * opens the visitor's mail app instead.
   */
  contact: { provider: 'web3forms', key: '001a0331-aa6c-47de-b3f3-e86c64e44647' },
  links: {
    github: 'https://github.com/drew-1618',
    linkedin: 'https://www.linkedin.com/in/andrew-garrett-j',
  },
  summary:
    'Computer Science student (Mathematics minor) at Tennessee Tech with two co-op rotations at Adtran across software test automation and technical solutions engineering. I like work that sits where software meets hardware: networks, embedded radios, CI pipelines, and the occasional night under a dark sky.',
};

/*
 * Sectors map 1:1 to content arrays via `key`, and each lives in a real
 * constellation (see skyCatalog.js). The five are neighbours in the winter
 * sky, clustered around Orion. Every item in a sector is drawn as a real star
 * of that constellation: set `star` on the item to pick which one, or leave
 * it out to take the next brightest unused star. Items with `coords` (e.g.
 * astrophotos) are placed at those exact RA/Dec coordinates instead.
 * `modalKind` decides whether clicking a star opens the ObservationModal
 * (project | role | photo) or scrolls the sector panel to that entry (null).
 */
export const sectors = [
  {
    id: 'alpha',
    short: 'Projects', // mobile tab-bar label
    key: 'projects',
    name: 'Sector Alpha',
    subtitle: 'The Stellar Nursery',
    description: 'Featured engineering & software projects.',
    constellation: 'Orion',
    modalKind: 'project',
    icon: 'Sparkles',
  },
  {
    id: 'beta',
    short: 'Experience', // mobile tab-bar label
    key: 'experience',
    name: 'Sector Beta',
    subtitle: 'Orbital Logs',
    description: 'Professional experience, co-ops & roles.',
    constellation: 'Taurus',
    modalKind: 'role',
    icon: 'Orbit',
  },
  {
    id: 'gamma',
    short: 'Skills', // mobile tab-bar label
    key: 'skills',
    name: 'Sector Gamma',
    subtitle: 'Deep-Sky Sensor Array',
    description: 'Languages, tooling, systems & instrumentation.',
    constellation: 'Gemini',
    modalKind: null,
    icon: 'Radar',
  },
  {
    id: 'delta',
    short: 'Astro', // mobile tab-bar label
    key: 'astrophotos',
    name: 'Sector Delta',
    subtitle: 'Observational Logbook',
    description: 'Astrophotography & visual imaging.',
    constellation: 'Auriga',
    modalKind: 'photo',
    icon: 'Aperture',
  },
  {
    id: 'epsilon',
    short: 'Education', // mobile tab-bar label
    key: 'education',
    name: 'Sector Epsilon',
    subtitle: 'Origins & Ground Station',
    description: 'Education, academics & comms.',
    constellation: 'Canis Major',
    modalKind: null,
    icon: 'RadioTower',
    // Extra stars that aren't backed by a content array entry.
    extraStars: [{ id: 'comms', title: 'Transmission Terminal', star: 'Sirius' }],
  },
];

export const projects = [
  {
    id: 'gocandidit',
    star: 'Betelgeuse',
    targetId: 'AGJ-0001',
    title: 'GoCandidIt',
    context: 'Personal Project',
    classification: ['Full-Stack', 'Desktop', 'AI Integration'],
    timeline: { start: 'Summer 2026', end: null },
    summary:
      'A multi-platform resume builder with an Electron desktop client and a dynamic web frontend, backed by an AI content pipeline.',
    description:
      'GoCandidIt is a resume builder that runs as both an Electron desktop app and a web app against one shared backend. A Node.js + Express API persists resumes in SQLite, ships as a Docker container, and calls out to AI APIs over REST endpoints to generate content tailored to a specific job posting. Local authentication scopes state per user and keeps a full version history of every resume.',
    architecture: [
      'Electron desktop client and dynamic web frontend sharing a single REST API.',
      'Node.js + Express service layer backed by SQLite, containerised with Docker.',
      'AI APIs integrated via RESTful endpoints to automate tailored content generation.',
      'Local authentication managing per-user state and resume version history.',
    ],
    metrics: [
      { label: 'Clients', value: 'Desktop + Web' },
      { label: 'Persistence', value: 'SQLite' },
      { label: 'Deploy', value: 'Docker' },
      { label: 'History', value: 'Versioned' },
    ],
    stack: ['Electron', 'Node.js', 'Express', 'SQLite', 'Docker', 'REST', 'AI APIs'],
    repo: 'https://github.com/drew-1618/gocandidit',
    demo: null,
    featured: true,
  },
  {
    id: 'range-sentinel',
    star: 'Rigel',
    targetId: 'AGJ-0002',
    title: 'Range Sentinel',
    context: 'Collaborative Project',
    classification: ['IoT', 'Embedded', 'Long-Range Radio'],
    timeline: { start: 'Spring 2026', end: 'Spring 2026' },
    summary:
      'A long-range, internet-free IoT network of ESP32 + LoRa nodes that monitors cattle gates and property perimeters.',
    description:
      'Range Sentinel watches rural property where there is no Wi-Fi or cellular coverage. ESP32 microcontrollers paired with LoRa radios report gate and perimeter state over long-range links back to a base node. The base ESP32 serves its own web dashboard (HTML, Bootstrap, CSS, JavaScript) straight out of LittleFS flash, so anyone nearby gets real-time status from a phone with no internet connection.',
    architecture: [
      'ESP32 sensor nodes transmitting gate / perimeter state over LoRa radio.',
      'Fully offline topology — no internet or cellular dependency.',
      'Dashboard (HTML, Bootstrap, CSS, JS) stored in LittleFS and served by the ESP32 itself.',
      'Real-time feedback pushed to the local dashboard as node events arrive.',
    ],
    metrics: [
      { label: 'Link', value: 'LoRa' },
      { label: 'Internet', value: 'Not required' },
      { label: 'MCU', value: 'ESP32' },
      { label: 'Storage', value: 'LittleFS' },
    ],
    stack: ['ESP32', 'LoRa', 'LittleFS', 'HTML', 'Bootstrap', 'JavaScript'],
    repo: 'https://github.com/RangeSentinel/RangeSentinel_Firmware',
    demo: null,
    featured: true,
  },
  {
    id: 'kmeans-palette',
    star: 'Bellatrix',
    targetId: 'AGJ-0003',
    title: 'K-Means Color Palette Generator',
    context: 'Personal Project',
    classification: ['Machine Learning', 'Computer Vision', 'Unsupervised'],
    timeline: { start: 'November 2025', end: 'November 2025' },
    summary:
      'Unsupervised ML tool that extracts dominant color schemes from images by clustering pixels in perceptual L*a*b* space.',
    description:
      'The tool converts an image into the L*a*b* color space, where Euclidean distance roughly matches how people perceive color difference, and then clusters its pixels with scikit-learn K-Means to pull out the dominant palette. It picks the number of clusters itself: the Elbow Method scores a range of k values and a Knee Locator finds the inflection point, so k never has to be tuned by hand.',
    architecture: [
      'Pixel data converted to L*a*b* for perceptually accurate distance.',
      'scikit-learn K-Means clustering to isolate dominant colors.',
      'Elbow Method + Knee Locator to programmatically select optimal k.',
      'Automated hyperparameter tuning — no manual cluster count required.',
    ],
    metrics: [
      { label: 'Color Space', value: 'L*a*b*' },
      { label: 'Model', value: 'K-Means' },
      { label: 'k Selection', value: 'Elbow + Knee' },
      { label: 'Tuning', value: 'Automated' },
    ],
    stack: ['Python', 'scikit-learn', 'Kneed'],
    repo: 'https://github.com/drew-1618/K-Means_image_palette_extractor',
    demo: null,
    featured: false,
  },
  {
    id: 'net-degradation-sim',
    star: 'Saiph',
    targetId: 'AGJ-0004',
    title: 'Network Degradation Simulator',
    context: 'Adtran Hackathon Project',
    classification: ['Networking', 'Simulation', 'Visualization'],
    timeline: { start: 'November 2025', end: 'November 2025' },
    summary:
      'Real-time visualizer showing how latency, packet loss and jitter change user experience across LAN, Wi-Fi, LTE and satellite links.',
    description:
      'Built at an Adtran hackathon, the simulator shows what bad network conditions feel like to a user. A custom degradation engine runs traffic through an asynchronous queue that adds latency, packet loss and jitter, using profiles modelled on LAN, Wi-Fi, 4G LTE and satellite links. A Pygame front end renders the effect in real time, so the trade-offs are easy to see when evaluating UX under tight network budgets.',
    architecture: [
      'Asynchronous queue-based degradation engine injecting latency, loss and jitter.',
      'Connection profiles modelling LAN, Wi-Fi, 4G LTE and Satellite links.',
      'Real-time Pygame visualizer rendering the user-facing impact.',
    ],
    metrics: [
      { label: 'Link Profiles', value: '4' },
      { label: 'Impairments', value: 'Latency · Loss · Jitter' },
      { label: 'Engine', value: 'Async queue' },
      { label: 'Event', value: 'Hackathon' },
    ],
    stack: ['Python', 'Pygame', 'asyncio'],
    repo: 'https://github.com/drew-1618/network-degredation-simulator',
    demo: null,
    featured: false,
  },
  {
    id: 'netops-mcp',
    star: 'Alnilam',
    targetId: 'AGJ-0005',
    title: 'NetOps MCP Server',
    context: 'Personal Project',
    classification: ['AI Tooling', 'Networking', 'Diagnostics'],
    timeline: { start: 'September 2026', end: null },
    summary:
      'A Model Context Protocol server that gives LLM clients like Claude Desktop structured, bottom-up network diagnostics across OSI layers 1–3.',
    description:
      'NetOps MCP lets an AI assistant troubleshoot a network the way an engineer would: from the physical link up, instead of jumping to conclusions. It exposes active probes (ping, gateway and Wi-Fi telemetry, DNS resolution) as MCP tools, serves standards-based triage runbooks as MCP resources, and provides a triage prompt that walks the model through a disciplined layer-by-layer sequence. Running inside WSL2, it reaches across the Hyper-V boundary into Windows host binaries (netsh.exe, route.exe) to read physical Wi-Fi signal, link rate and default-gateway state that Linux tools can\'t see.',
    architecture: [
      'Full MCP primitive coverage: tools (run_ping, get_gateway_telemetry, get_wifi_telemetry, resolve_dns, lookup_remediation, create_incident_ticket), runbook resources and a triage_network prompt.',
      'WSL2 host-boundary traversal into Windows netsh.exe / route.exe for physical-layer telemetry.',
      'Defensive input validation against command chaining and option injection, with hard timeouts on every subprocess call.',
      'SQLite persistence for triage incidents that degrades gracefully on I/O failure.',
    ],
    metrics: [
      { label: 'OSI Layers', value: 'L1–L3' },
      { label: 'MCP Tools', value: '6' },
      { label: 'Primitives', value: 'Tools · Resources · Prompts' },
      { label: 'Client', value: 'Claude Desktop' },
    ],
    stack: ['Python', 'MCP', 'Pydantic', 'dnspython', 'SQLite', 'WSL2', 'uv'],
    repo: 'https://github.com/drew-1618/netops-mcp',
    demo: null,
    featured: true,
  },
  {
    id: 'weather-app',
    star: 'Alnitak',
    targetId: 'AGJ-0006',
    title: 'Cookeville Weather App',
    context: 'Personal Project',
    classification: ['Web App', 'PWA', 'Live Data'],
    timeline: { start: 'March 2026', end: 'March 2026' },
    summary:
      'An installable web app with live current conditions, a 24-hour hourly forecast and a 7-day outlook for Cookeville, TN.',
    description:
      'A dependency-free weather app in vanilla HTML and JavaScript, powered by the Open-Meteo forecast API. It shows current conditions (temperature, feels-like, humidity, wind, precipitation), a rolling 24-hour forecast that starts at the current hour, and a daily outlook with highs and lows, sunrise and sunset, daylight and sunshine duration, and wind gusts. Weather codes map to day and night icons, a "last updated" readout tracks data freshness, and a web app manifest lets it be installed to a phone\'s home screen.',
    architecture: [
      'Single fetch to the Open-Meteo API returning current, hourly and daily data in imperial units.',
      'Hourly view aligned to the current hour; daily view mapped to weekday names.',
      'Weather-code → icon and description mapping with separate day / night variants.',
      'Web app manifest for standalone, home-screen install.',
    ],
    metrics: [
      { label: 'Data', value: 'Open-Meteo API' },
      { label: 'Forecast', value: '24h + 7-day' },
      { label: 'Frameworks', value: 'None' },
      { label: 'Install', value: 'PWA manifest' },
    ],
    stack: ['JavaScript', 'HTML', 'CSS', 'Open-Meteo API'],
    repo: 'https://github.com/drew-1618/weather-app',
    demo: 'https://drew-1618.github.io/weather-app/',
    featured: false,
  },
  {
    id: 'star-data-viz',
    star: 'Mintaka',
    targetId: 'AGJ-0007',
    title: 'Star Data Visualization',
    context: 'Guided Project · freeCodeCamp',
    classification: ['Data Analysis', 'Astronomy', 'Visualization'],
    timeline: { start: 'December 2024', end: 'December 2024' },
    summary:
      'Exploratory analysis of a tabular star catalog, from cleaning the data to plotting a Hertzsprung–Russell diagram.',
    description:
      'A Jupyter notebook that cleans a dataset of star properties and turns it into visual insight with pandas, NumPy, Matplotlib and Seaborn. The headline plot is a Hertzsprung–Russell diagram showing how stars separate into the main sequence, giants and white dwarfs by temperature and luminosity, supported by distribution plots, counts by star color and type, box plots and a full pair plot. Built by following a freeCodeCamp tutorial.',
    architecture: [
      'Data cleaning into a reusable cleaned_star_data.csv.',
      'Hertzsprung–Russell diagram of temperature vs. luminosity by star type.',
      'Distribution subplots, count bar plots, box plots and a Seaborn pair plot.',
    ],
    metrics: [
      { label: 'Plots', value: '6' },
      { label: 'Headline', value: 'H–R Diagram' },
      { label: 'Format', value: 'Jupyter' },
    ],
    stack: ['Python', 'pandas', 'NumPy', 'Matplotlib', 'Seaborn', 'Jupyter'],
    repo: 'https://github.com/drew-1618/Star_data_visualization',
    demo: null,
    featured: false,
  },
];

export const experience = [
  {
    id: 'adtran-solutions',
    star: 'Aldebaran',
    missionId: 'MSN-2026-B',
    org: 'Adtran Inc.',
    role: 'Technical Sales & Solutions Engineering Co-Op',
    location: 'Huntsville, AL',
    start: 'May 2026',
    end: 'August 2026',
    summary:
      'Customer-facing lab engineering: reproducing field issues, standing up orchestration platforms, and evaluating device coverage.',
    impact: [
      'Reverse-engineered a complex, non-standard switch CLI to configure port flows, flowpoint shapers, and policers, successfully reproducing and troubleshooting a customer SFP auto-negotiation issue.',
      'Deployed Oktopus on Ubuntu and optimized the system messaging architecture by migrating the MQTT broker to Eclipse Mosquitto for low-latency device orchestration.',
      'Staged enterprise cloud platforms on bare-metal Rocky Linux servers using KVM and SSH for customer lab testing.',
      'Authored NPI documentation and conducted comparative SDG coverage testing to evaluate device performance.',
    ],
    tools: ['Oktopus', 'MQTT', 'Eclipse Mosquitto', 'Ubuntu', 'Rocky Linux', 'KVM', 'SSH', 'SFP / Switch CLI'],
  },
  {
    id: 'adtran-swdev',
    star: 'Elnath',
    missionId: 'MSN-2025-A',
    org: 'Adtran Inc.',
    role: 'Software Development Co-Op',
    location: 'Huntsville, AL',
    start: 'August 2025',
    end: 'December 2025',
    summary:
      'Test automation and CI/CD engineering for traffic policing and QoS features on carrier networking gear.',
    impact: [
      'Developed automated test scenarios using Python and Behave to validate traffic policing and QoS functionality.',
      'Optimized the test execution process by implementing a dynamic tagging system, allowing developers to isolate specific feature tests and significantly reduce execution time.',
      'Diagnosed and resolved complex integration issues, including a byte-count discrepancy on aggregation switches, by identifying and mitigating root-cause vendor hardware constraints.',
      'Enhanced CI/CD reliability by upgrading Jenkins pipelines and Bash scripts to support automated firmware version detection and backward compatibility.',
    ],
    tools: ['Python', 'Behave', 'Jenkins', 'Groovy', 'Bash', 'QoS / Policing'],
  },
  {
    id: 'pstcc-tutor',
    star: 'Ain',
    missionId: 'MSN-2025-T',
    org: 'Pellissippi State Community College',
    role: 'Academic Tutor',
    location: 'Knoxville, TN',
    start: 'January 2025',
    end: 'May 2025',
    summary: 'Tutoring C++, data structures, algorithms and calculus.',
    impact: [
      'Guided students in C++, data structures, algorithms, and calculus, adapting teaching methods for student needs.',
      'Conducted real-time virtual code reviews to identify common sticking points and strengthen students’ debugging methodologies, enhancing their problem-solving abilities.',
      'Provided technical guidance on low-level data manipulation and troubleshooting, helping students resolve logic errors related to direct memory access.',
    ],
    tools: ['C++', 'Data Structures', 'Algorithms', 'Calculus'],
  },
];

export const skills = [
  {
    id: 'languages',
    star: 'Pollux',
    group: 'Languages',
    band: 'B',
    items: [
      { name: 'Python' },
      { name: 'C++' },
      { name: 'JavaScript' },
      { name: 'R' },
      { name: 'SQL', note: 'MySQL · SQLite' },
      { name: 'Bash' },
      { name: 'Groovy' },
      { name: 'HTML/CSS' },
    ],
  },
  {
    id: 'frameworks',
    star: 'Castor',
    group: 'Frameworks & Backend',
    band: 'V',
    items: [
      { name: 'Node.js' },
      { name: 'Express' },
      { name: 'Electron' },
      { name: 'Behave', note: 'BDD testing' },
      { name: 'MySQL' },
      { name: 'SQLite' },
      { name: 'Bootstrap' },
      { name: 'REST APIs' },
    ],
  },
  {
    id: 'systems',
    star: 'Alhena',
    group: 'Hardware/Embedded & Systems',
    band: 'R',
    items: [
      { name: 'ESP32' },
      { name: 'LoRa' },
      { name: 'LittleFS' },
      { name: 'Linux', note: 'Ubuntu · Rocky' },
      { name: 'KVM' },
      { name: 'SSH' },
      { name: 'MQTT', note: 'Eclipse Mosquitto' },
      { name: 'Docker' },
      { name: 'Jenkins' },
      { name: 'Git / GitHub' },
      { name: 'Vim' },
      { name: 'VS Code' },
    ],
  },
  {
    id: 'data',
    star: 'Mebsuta',
    group: 'Data Science/AI',
    band: 'I',
    items: [
      { name: 'scikit-learn' },
      { name: 'K-Means / Clustering' },
      { name: 'Jupyter' },
      { name: 'RStudio' },
      { name: 'AI API Integration' },
    ],
  },
  {
    id: 'optics',
    star: 'Wasat',
    group: 'Optical/Astrophotography Gear',
    band: 'Hα',
    items: [
      { name: 'Celestron NexStar 130 SLT', note: '130mm Newtonian · GoTo mount' },
      { name: 'Nikon D3200', note: 'DSLR' },
      { name: '2× Barlow lens' },
      { name: '8mm eyepiece', note: 'eyepiece projection' },
      { name: '200mm telephoto' },
      { name: 'Snapseed', note: 'processing' },
      { name: 'Eclipse & lunar imaging' },
      { name: 'Planetary imaging' },
      { name: 'Deep-sky imaging' },
    ],
  },
];

/*
 * Astrophotography captures. `image` / `thumb` are paths under /public
 * (the deploy base path is added automatically). `placeholder` is only used
 * when `image` is null.
 *
 * Where a capture's star goes in the sky:
 *   coords: { ra, dec, constellation } → the target's real J2000 position
 *                          (constellation is the one it actually lies in).
 *   solarSystem: true    → Sun, Moon, planets and comets move, so they're
 *                          spaced along the ecliptic near Auriga/Taurus/Gemini.
 *
 * Gear / integration fields are only filled in where they're known (from the
 * photo's EXIF data); null fields are simply not shown.
 */
const D3200_ECLIPSE = { telescope: '200mm telephoto lens', focalLength: '200mm', mount: null, camera: 'Nikon D3200' };
const D3200 = { telescope: null, focalLength: null, mount: null, camera: 'Nikon D3200' };
// Celestron NexStar 130 SLT: 130mm f/5 Newtonian reflector on a computerized GoTo alt-az mount.
const NEXSTAR_BARLOW = {
  telescope: 'Celestron NexStar 130 SLT (130mm Newtonian)',
  focalLength: '650mm · 1300mm with 2× Barlow',
  mount: 'NexStar SLT GoTo alt-az',
  camera: 'Nikon D3200',
};
const NEXSTAR_PROJECTION = {
  telescope: 'Celestron NexStar 130 SLT (130mm Newtonian)',
  focalLength: '650mm (eyepiece projection)',
  eyepiece: '8mm',
  mount: 'NexStar SLT GoTo alt-az',
  camera: 'Nikon D3200',
};
const NO_INTEGRATION = { subs: null, subExposure: null, isoGain: null, totalTime: null, filters: null, barlow: null };

export const astrophotos = [
  {
    id: 'eclipse-2024-sequence',
    target: 'Total Solar Eclipse Sequence',
    catalogId: 'TSE 2024-04-08',
    type: 'Solar Eclipse · Composite',
    solarSystem: true,
    image: '/astro/eclipse-2024-sequence.jpg',
    thumb: '/astro/thumbs/eclipse-2024-sequence.jpg',
    optics: D3200_ECLIPSE,
    integration: { ...NO_INTEGRATION, subExposure: '1/250s (totality frame)' },
    processing: ['Snapseed'],
    date: '2024-04-08',
    location: null,
    notes: 'The Great North American Eclipse, from first partial phases through the diamond ring and totality, back out to partial phases, composited into one frame.',
  },
  {
    id: 'm42-orion-nebula',
    target: 'Orion Nebula',
    catalogId: 'M42 / M43',
    type: 'Emission Nebula',
    coords: { ra: hms(5, 35, 17), dec: dms(-5, 23, 28), constellation: 'Orion' },
    image: '/astro/m42-orion-nebula.jpg',
    thumb: '/astro/thumbs/m42-orion-nebula.jpg',
    optics: NEXSTAR_BARLOW,
    integration: { ...NO_INTEGRATION, barlow: '2×' },
    processing: [],
    date: null,
    location: null,
    notes: 'The nearest large star-forming region to Earth, about 1,350 light years away, with its smaller companion M43 (De Mairan\'s Nebula) just above.',
  },
  {
    id: 'orion-belt-sword',
    target: 'Orion\'s Belt & Sword',
    catalogId: 'Alnitak · NGC 2024 · M42',
    type: 'Wide Field · Nebulae',
    coords: { ra: hms(5, 38), dec: dms(-3, 30), constellation: 'Orion' },
    image: '/astro/orion-belt-sword.jpg',
    thumb: '/astro/thumbs/orion-belt-sword.jpg',
    optics: D3200,
    integration: NO_INTEGRATION,
    processing: ['Snapseed'],
    date: null,
    location: null,
    notes: 'Wide field from the belt star Alnitak with the Flame Nebula beside it, down to the Orion Nebula and the Running Man in the sword.',
  },
  {
    id: 'm45-pleiades',
    target: 'Pleiades',
    catalogId: 'M45',
    type: 'Open Cluster · Reflection Nebula',
    coords: { ra: hms(3, 47, 24), dec: dms(24, 7), constellation: 'Taurus' },
    image: '/astro/m45-pleiades.jpg',
    thumb: '/astro/thumbs/m45-pleiades.jpg',
    optics: D3200,
    integration: NO_INTEGRATION,
    processing: ['Snapseed'],
    date: null,
    location: null,
    notes: 'The Seven Sisters, a young open cluster about 444 light years away, wrapped in the blue reflection nebulosity it\'s currently drifting through.',
  },
  {
    id: 'comet-c2022-e3-ztf',
    target: 'Comet ZTF',
    catalogId: 'C/2022 E3 (ZTF)',
    type: 'Comet',
    solarSystem: true,
    image: '/astro/comet-c2022-e3-ztf.jpg',
    thumb: '/astro/thumbs/comet-c2022-e3-ztf.jpg',
    optics: D3200,
    integration: NO_INTEGRATION,
    processing: [],
    date: '2023-01-28',
    location: null,
    notes: 'The "green comet", caught a few days before its closest approach to Earth on February 1, 2023. Its coma glows green from diatomic carbon fluorescing in sunlight.',
  },
  {
    id: 'globular-cluster',
    target: 'Hercules Globular Cluster',
    catalogId: 'M13',
    type: 'Globular Cluster',
    coords: { ra: hms(16, 41, 41), dec: dms(36, 27, 35), constellation: 'Hercules' },
    image: '/astro/globular-cluster.jpg',
    thumb: '/astro/thumbs/globular-cluster.jpg',
    optics: NEXSTAR_BARLOW,
    integration: { ...NO_INTEGRATION, barlow: '2×' },
    processing: ['Snapseed'],
    date: null,
    location: null,
    notes: 'A dense ball of a few hundred thousand old stars about 22,000 light years away, on the western edge of the Keystone in Hercules. It sits in the summer sky, far from the winter constellations: drag around to find it.',
  },
  {
    id: 'eclipse-2024-totality',
    target: 'Totality',
    catalogId: 'TSE 2024-04-08',
    type: 'Solar Eclipse · Corona',
    solarSystem: true,
    image: '/astro/eclipse-2024-totality.jpg',
    thumb: '/astro/thumbs/eclipse-2024-totality.jpg',
    optics: D3200_ECLIPSE,
    integration: { ...NO_INTEGRATION, subExposure: '1/100s', isoGain: null, totalTime: 'Single frame', filters: 'None (totality only)' },
    processing: ['Snapseed'],
    date: '2024-04-08',
    location: null,
    notes: 'The solar corona during totality, with small red prominences visible along the Moon\'s limb. f/7.1 at 200mm.',
  },
  {
    id: 'eclipse-2024-diamond-ring',
    target: 'Diamond Ring',
    catalogId: 'TSE 2024-04-08',
    type: 'Solar Eclipse',
    solarSystem: true,
    image: '/astro/eclipse-2024-diamond-ring.jpg',
    thumb: '/astro/thumbs/eclipse-2024-diamond-ring.jpg',
    optics: D3200_ECLIPSE,
    integration: { ...NO_INTEGRATION, subExposure: '1/250s', totalTime: 'Single frame' },
    processing: ['Snapseed'],
    date: '2024-04-08',
    location: null,
    notes: 'The last bead of sunlight breaking through a lunar valley as totality ends. f/7.1 at 200mm.',
  },
  {
    id: 'lunar-eclipse',
    target: 'Total Lunar Eclipse',
    catalogId: 'TLE 2025-03-14',
    type: 'Lunar Eclipse',
    solarSystem: true,
    image: '/astro/lunar-eclipse.jpg',
    thumb: '/astro/thumbs/lunar-eclipse.jpg',
    optics: D3200,
    integration: NO_INTEGRATION,
    processing: [],
    date: '2025-03-14',
    location: null,
    notes: 'The March 14, 2025 "Blood Worm Moon": the Moon inside Earth\'s umbra, lit only by sunlight filtered red through Earth\'s atmosphere.',
  },
  {
    id: 'jupiter',
    target: 'Jupiter',
    catalogId: 'Sol V',
    type: 'Planet',
    solarSystem: true,
    image: '/astro/jupiter.jpg',
    thumb: '/astro/thumbs/jupiter.jpg',
    optics: NEXSTAR_PROJECTION,
    integration: NO_INTEGRATION,
    processing: [],
    date: null,
    location: null,
    notes: 'Cloud belts and the Great Red Spot, shot by projecting the image through an 8mm eyepiece straight onto the camera sensor.',
  },
  {
    id: 'saturn',
    target: 'Saturn',
    catalogId: 'Sol VI',
    type: 'Planet',
    solarSystem: true,
    image: '/astro/saturn.jpg',
    thumb: '/astro/thumbs/saturn.jpg',
    optics: NEXSTAR_PROJECTION,
    integration: NO_INTEGRATION,
    processing: ['Snapseed'],
    date: null,
    location: null,
    notes: 'The ring system, with the planet\'s shadow falling across the rings behind the globe.',
  },
  {
    id: 'moon-first-quarter',
    target: 'First Quarter Moon',
    catalogId: 'Luna',
    type: 'Lunar',
    solarSystem: true,
    image: '/astro/moon-first-quarter.jpg',
    thumb: '/astro/thumbs/moon-first-quarter.jpg',
    optics: D3200,
    integration: NO_INTEGRATION,
    processing: ['Snapseed'],
    date: null,
    location: null,
    notes: 'Half-lit Moon against a starfield. Craters stand out best along the terminator, where shadows are longest.',
  },
];

export const education = [
  {
    id: 'ttu',
    star: 'Adhara',
    school: 'Tennessee Technological University',
    location: 'Cookeville, TN',
    degree: 'Bachelor of Science in Computer Science',
    concentration: 'Minor in Mathematics',
    gpa: '3.86',
    start: null,
    end: 'Expected December 2026',
    honors: [],
    milestones: [],
  },
  {
    id: 'pstcc',
    star: 'Mirzam',
    school: 'Pellissippi State Community College',
    location: 'Knoxville, TN',
    degree: 'Associate of Science in Computer Science',
    concentration: null,
    gpa: '3.92',
    start: null,
    end: 'May 2024',
    honors: ['Phi Theta Kappa Honor Society'],
    milestones: [
      { label: 'TNCIS Study Abroad — Greece', date: '2023' },
      { label: 'TNCIS Study Abroad — The Alps', date: '2024' },
    ],
  },
];

/* Maps a sector `key` to its content array. */
export const collections = { projects, experience, skills, astrophotos, education };

/* Every item that gets a star in the given sector's cluster. */
export function sectorItems(sector) {
  return [...(collections[sector.key] || []), ...(sector.extraStars || [])];
}

/* Display label for a star belonging to any collection. */
export function itemLabel(item) {
  return item.title || item.role || item.group || item.target || item.school || item.id;
}

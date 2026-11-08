import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const outDir = resolve(dirname(fileURLToPath(import.meta.url)), '../public/heroes');

const HEAD_PATH =
  'M256 82 C320 82 358 126 358 196 C358 238 344 270 320 290 C302 304 280 312 256 312 C232 312 210 304 192 290 C168 270 154 238 154 196 C154 126 192 82 256 82 Z';

function defs(h) {
  const mask = h.mask ?? ['#facc15', '#b45309'];
  const metal = h.metal ?? ['#e2e8f0', '#64748b'];
  const accent = h.accent ?? ['#fde68a', '#f59e0b'];
  const hair = h.hair ?? ['#3b2318', '#1c110b'];
  const cape = h.cape ?? ['#dc2626', '#7f1d1d'];
  return `
  <defs>
    <radialGradient id="bg" cx="50%" cy="26%" r="82%">
      <stop offset="0%" stop-color="${h.bg[0]}"/>
      <stop offset="100%" stop-color="${h.bg[1]}"/>
    </radialGradient>
    <radialGradient id="halo" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#fff" stop-opacity=".2"/>
      <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="skin" cx="36%" cy="26%" r="84%">
      <stop offset="0%" stop-color="${h.skin.light}"/>
      <stop offset="62%" stop-color="${h.skin.mid}"/>
      <stop offset="100%" stop-color="${h.skin.dark}"/>
    </radialGradient>
    <linearGradient id="suit" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${h.suit[0]}"/>
      <stop offset="58%" stop-color="${h.suit[1]}"/>
      <stop offset="100%" stop-color="${h.suit[2] ?? h.suit[1]}"/>
    </linearGradient>
    <linearGradient id="hair" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${hair[0]}"/>
      <stop offset="100%" stop-color="${hair[1]}"/>
    </linearGradient>
    <linearGradient id="mask" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${mask[0]}"/>
      <stop offset="55%" stop-color="${mask[1]}"/>
      <stop offset="100%" stop-color="${mask[2] ?? mask[1]}"/>
    </linearGradient>
    <linearGradient id="metal" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${metal[0]}"/>
      <stop offset="100%" stop-color="${metal[1]}"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${accent[0]}"/>
      <stop offset="100%" stop-color="${accent[1]}"/>
    </linearGradient>
    <linearGradient id="cape" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${cape[0]}"/>
      <stop offset="100%" stop-color="${cape[1]}"/>
    </linearGradient>
    <radialGradient id="vignette" cx="50%" cy="38%" r="76%">
      <stop offset="58%" stop-color="#000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000" stop-opacity=".34"/>
    </radialGradient>
  </defs>`;
}

function eye(cx, h, lashes = false) {
  const iris = h.eye.iris;
  return `
  <ellipse cx="${cx}" cy="200" rx="27" ry="15" fill="#f8fafc"/>
  <ellipse cx="${cx}" cy="201" rx="26" ry="12.5" fill="#fff"/>
  <circle cx="${cx + 2}" cy="200" r="11.5" fill="${iris}"/>
  <circle cx="${cx + 2}" cy="202" r="7" fill="${iris}" opacity=".55"/>
  <circle cx="${cx + 2}" cy="200" r="5" fill="#0f172a"/>
  <circle cx="${cx - 2}" cy="195" r="3.5" fill="#fff"/>
  <circle cx="${cx + 7}" cy="205" r="1.8" fill="#fff" opacity=".7"/>
  <path d="M${cx - 27} 193 Q${cx} 181 ${cx + 27} 193" fill="none" stroke="${h.skin.shadow}" stroke-width="2.5" opacity=".28"/>
  ${lashes ? `<path d="M${cx - 26} 187 Q${cx} 200 ${cx + 26} 187" fill="none" stroke="#1f2937" stroke-width="3.4" stroke-linecap="round"/>` : ''}
  `;
}

function brows(h, style = 'soft') {
  const color = h.eye.brow ?? '#3b2318';
  if (style === 'stern') {
    return `
    <path d="M190 185 Q220 169 246 181" fill="none" stroke="${color}" stroke-width="8" stroke-linecap="round"/>
    <path d="M322 185 Q292 169 266 181" fill="none" stroke="${color}" stroke-width="8" stroke-linecap="round"/>
    `;
  }
  return `
  <path d="M192 181 Q220 169 246 179" fill="none" stroke="${color}" stroke-width="7" stroke-linecap="round"/>
  <path d="M320 181 Q292 169 266 179" fill="none" stroke="${color}" stroke-width="7" stroke-linecap="round"/>
  `;
}

function mouth(style, h) {
  const lip = h.lip ?? '#a34b45';
  if (style === 'lips') {
    return `
    <path d="M226 254 Q256 242 286 254 Q256 282 226 254 Z" fill="${lip}"/>
    <path d="M234 258 Q256 266 278 258" fill="none" stroke="#fff" stroke-width="2" opacity=".2"/>
    `;
  }
  if (style === 'stern') {
    return `
    <path d="M228 262 Q256 250 284 262" fill="none" stroke="${lip}" stroke-width="7" stroke-linecap="round"/>
    <path d="M236 264 Q256 258 276 264" fill="none" stroke="#000" stroke-width="2.4" opacity=".16"/>
    `;
  }
  if (style === 'grin') {
    return `
    <path d="M224 250 Q256 278 288 250 Q256 262 224 250 Z" fill="${lip}"/>
    <path d="M232 254 Q256 264 280 254" fill="none" stroke="#fff" stroke-width="2" opacity=".25"/>
    `;
  }
  if (style === 'groot') {
    return `
    <path d="M222 256 Q256 274 290 256" fill="none" stroke="#3f2410" stroke-width="9" stroke-linecap="round"/>
    <path d="M232 261 Q256 268 280 261" fill="none" stroke="#a16207" stroke-width="3" opacity=".55"/>
    `;
  }
  if (style === 'none') return '';
  return `
  <path d="M226 255 Q256 271 286 255" fill="none" stroke="${lip}" stroke-width="7" stroke-linecap="round"/>
  <path d="M234 260 Q256 268 278 260" fill="none" stroke="#fff" stroke-width="2" opacity=".14"/>
  `;
}

function face(h, opts = {}) {
  if (h.skipFace) return '';
  const eyeMode = opts.eyes ?? 'normal';
  const mouthStyle = opts.mouth ?? 'smile';
  const lashes = Boolean(opts.lashes);

  let eyeLayer = '';
  if (eyeMode === 'normal') {
    eyeLayer = `${brows(h, opts.browStyle)}${eye(220, h, lashes)}${eye(292, h, lashes)}`;
  } else if (eyeMode === 'glow') {
    eyeLayer = `
    <ellipse cx="220" cy="200" rx="25" ry="13" fill="#f0fbff"/>
    <ellipse cx="292" cy="200" rx="25" ry="13" fill="#f0fbff"/>
    <ellipse cx="220" cy="200" rx="16" ry="8" fill="#dff7ff" opacity=".8"/>
    <ellipse cx="292" cy="200" rx="16" ry="8" fill="#dff7ff" opacity=".8"/>
    <path d="M192 181 Q220 169 246 179" fill="none" stroke="${h.eye.brow}" stroke-width="7" stroke-linecap="round"/>
    <path d="M320 181 Q292 169 266 179" fill="none" stroke="${h.eye.brow}" stroke-width="7" stroke-linecap="round"/>
    `;
  } else if (eyeMode === 'metal') {
    eyeLayer = `
    ${brows(h, opts.browStyle)}
    ${eye(220, h, lashes)}
    <ellipse cx="292" cy="200" rx="26" ry="15" fill="#0f172a"/>
    <circle cx="292" cy="200" r="11.5" fill="#ef4444"/>
    <circle cx="292" cy="200" r="5" fill="#7f1d1d"/>
    <circle cx="288" cy="196" r="3" fill="#fecaca"/>
    `;
  }

  return `
  <path d="${HEAD_PATH}" fill="url(#skin)"/>
  <ellipse cx="153" cy="212" rx="18" ry="24" fill="${h.skin.dark}"/>
  <ellipse cx="359" cy="212" rx="18" ry="24" fill="${h.skin.dark}"/>
  <path d="M296 98 C334 126 354 164 352 212 C350 258 326 292 294 310 C318 282 330 250 330 210 C330 162 310 122 296 98 Z" fill="${h.skin.shadow}" opacity=".15"/>
  <ellipse cx="208" cy="234" rx="36" ry="21" fill="#fff" opacity=".075"/>
  <ellipse cx="304" cy="234" rx="36" ry="21" fill="#fff" opacity=".055"/>
  <path d="M188 173 Q218 159 246 175 Q218 167 192 181 Z" fill="${h.skin.shadow}" opacity=".16"/>
  <path d="M324 173 Q294 159 266 175 Q294 167 320 181 Z" fill="${h.skin.shadow}" opacity=".12"/>
  <path d="M256 200 C250 218 249 232 254 240" fill="none" stroke="${h.skin.shadow}" stroke-width="4" opacity=".28" stroke-linecap="round"/>
  <ellipse cx="259" cy="243" rx="8" ry="4" fill="#fff" opacity=".1"/>
  ${eyeLayer}
  ${mouth(mouthStyle, h)}
  <path d="M196 254 C208 304 304 304 316 254 C310 300 290 318 256 318 C222 318 202 300 196 254 Z" fill="${h.skin.shadow}" opacity=".13"/>
  <ellipse cx="256" cy="302" rx="28" ry="8" fill="#fff" opacity=".06"/>
  `;
}

function neck(h) {
  return `
  <path d="M210 280 L302 280 L310 346 L202 346 Z" fill="url(#skin)"/>
  <path d="M210 280 L256 316 L302 280 L302 302 L256 340 L210 302 Z" fill="${h.skin.shadow}" opacity=".22"/>
  <ellipse cx="256" cy="328" rx="58" ry="13" fill="${h.skin.shadow}" opacity=".18"/>
  `;
}

function body(h, extras = '') {
  const cape = h.cape
    ? `<path d="M122 512 C108 416 142 354 208 336 L256 386 L304 336 C370 354 404 416 390 512 Z" fill="url(#cape)"/>
       <path d="M208 336 L256 386 L304 336" fill="none" stroke="#fff" stroke-width="6" opacity=".16"/>`
    : '';
  return `
  ${cape}
  <ellipse cx="256" cy="506" rx="210" ry="36" fill="#000" opacity=".2"/>
  <path d="M92 512 C102 424 156 364 226 346 L286 346 C356 364 410 424 420 512 Z" fill="url(#suit)"/>
  <path d="M92 512 C102 460 128 416 172 388 C178 448 180 484 182 512 Z" fill="#000" opacity=".2"/>
  <path d="M420 512 C410 460 384 416 340 388 C334 448 332 484 330 512 Z" fill="#fff" opacity=".09"/>
  <path d="M92 512 C106 468 138 424 188 396" fill="none" stroke="#fff" stroke-width="7" opacity=".11"/>
  <path d="M420 512 C406 468 374 424 324 396" fill="none" stroke="#fff" stroke-width="5" opacity=".07"/>
  ${extras}
  `;
}

function collar(h, color = 'url(#accent)', width = 14) {
  return `<path d="M206 348 C226 384 286 384 306 348" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/>`;
}

function shortHair() {
  return `
  <path d="M162 198 C158 126 198 78 256 78 C314 78 354 126 350 198 C344 158 318 132 256 132 C204 132 174 158 162 198 Z" fill="url(#hair)"/>
  <path d="M240 80 C252 100 254 120 250 140" fill="none" stroke="#fff" stroke-width="4" opacity=".16"/>
  <path d="M186 150 C206 116 270 106 312 130 C282 116 222 120 194 152 Z" fill="#fff" opacity=".14"/>
  <path d="M200 138 C214 124 236 118 256 118" fill="none" stroke="#fff" stroke-width="3" opacity=".12"/>
  <path d="M168 180 C166 210 168 236 174 258 C166 230 164 202 168 180 Z" fill="url(#hair)"/>
  <path d="M344 180 C346 210 344 236 338 258 C346 230 348 202 344 180 Z" fill="url(#hair)"/>
  `;
}

function longHairBack() {
  return `
  <path d="M146 220 C138 134 190 66 256 66 C322 66 374 134 366 220 L382 360 C360 392 320 400 300 366 L292 250 L220 250 L212 366 C192 400 152 392 130 360 Z" fill="url(#hair)"/>
  <path d="M196 112 C178 180 176 258 188 336" fill="none" stroke="#fff" stroke-width="5" opacity=".12"/>
  <path d="M316 112 C334 180 336 258 324 336" fill="none" stroke="#000" stroke-width="6" opacity=".08"/>
  `;
}

function longHairFront() {
  return `
  <path d="M164 198 C158 128 198 80 256 80 C314 80 354 128 348 198 C338 156 312 132 256 132 C200 132 174 156 164 198 Z" fill="url(#hair)"/>
  <path d="M164 198 C154 250 156 306 170 350 C178 304 178 250 184 206 Z" fill="url(#hair)"/>
  <path d="M348 198 C358 250 356 306 342 350 C334 304 334 250 328 206 Z" fill="url(#hair)"/>
  <path d="M238 82 C250 102 252 122 248 142" fill="none" stroke="#fff" stroke-width="4" opacity=".18"/>
  <path d="M196 128 C228 104 288 104 316 128" fill="none" stroke="#fff" stroke-width="7" opacity=".14"/>
  <path d="M176 214 C168 258 170 304 180 338" fill="none" stroke="#fff" stroke-width="4" opacity=".12"/>
  <path d="M336 214 C344 258 342 304 332 338" fill="none" stroke="#000" stroke-width="4" opacity=".07"/>
  `;
}

function bobHair() {
  return `
  <path d="M150 210 C142 128 194 72 256 72 C318 72 370 128 362 210 L368 300 C356 330 330 338 310 316 L304 228 L208 228 L202 316 C182 338 156 330 144 300 Z" fill="url(#hair)"/>
  <path d="M164 198 C158 130 198 82 256 82 C314 82 354 130 348 198 C336 154 312 132 256 132 C200 132 176 154 164 198 Z" fill="url(#hair)"/>
  <path d="M170 210 C162 250 166 288 176 314 C182 280 182 246 186 214 Z" fill="url(#hair)"/>
  <path d="M342 210 C350 250 346 288 336 314 C330 280 330 246 326 214 Z" fill="url(#hair)"/>
  <path d="M238 84 C250 104 252 124 248 144" fill="none" stroke="#fff" stroke-width="4" opacity=".18"/>
  <path d="M204 122 C228 104 282 104 306 122" fill="none" stroke="#fff" stroke-width="6" opacity=".13"/>
  <path d="M172 214 C164 254 168 292 178 316" fill="none" stroke="#fff" stroke-width="4" opacity=".1"/>
  `;
}

function starPath(cx, cy, outer, inner) {
  const points = [];
  for (let i = 0; i < 10; i += 1) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    points.push(`${(cx + Math.cos(angle) * radius).toFixed(1)},${(cy + Math.sin(angle) * radius).toFixed(1)}`);
  }
  return points.join(' ');
}

const heroes = {
  wolverine: {
    bg: ['#fde68a', '#8a4b12'],
    suit: ['#3b5bb5', '#1e3a8a', '#172554'],
    skin: { light: '#f8d0b0', mid: '#e6a276', dark: '#bf754e', shadow: '#8a4b31' },
    hair: ['#fde047', '#b45309'],
    mask: ['#fde047', '#facc15', '#b45309'],
    accent: ['#fef08a', '#ca8a04'],
    eye: { iris: '#1d4ed8', brow: '#111827' },
    lip: '#7f3f2b',
    bodyExtras: `
      <path d="M188 360 L256 432 L324 360 L310 512 L202 512 Z" fill="url(#accent)"/>
      <path d="M210 366 L256 416 L302 366" fill="none" stroke="#1e3a8a" stroke-width="10" stroke-linecap="round"/>
      <path d="M216 452 L256 486 L296 452" fill="none" stroke="#1e3a8a" stroke-width="8" opacity=".5"/>
      <path d="M126 376 C156 344 196 338 228 348 L220 386 C192 378 160 384 138 402 Z" fill="url(#accent)"/>
      <path d="M386 376 C356 344 316 338 284 348 L292 386 C320 378 352 384 374 402 Z" fill="url(#accent)"/>
      <path d="M132 380 C158 356 188 350 214 356" fill="none" stroke="#1e3a8a" stroke-width="5" opacity=".45"/>
      <path d="M380 380 C354 356 324 350 298 356" fill="none" stroke="#1e3a8a" stroke-width="5" opacity=".45"/>
    `,
    face: { eyes: 'none', mouth: 'none' },
    overlay: `
      <path d="${HEAD_PATH}" fill="url(#mask)"/>
      <path d="M154 196 C154 126 192 82 256 82 C320 82 358 126 358 196 C358 210 356 224 351 236 C341 180 306 144 256 144 C206 144 171 180 161 236 C156 224 154 210 154 196 Z" fill="#fef9c3" opacity=".24"/>
      <path d="M214 236 C226 278 286 278 298 236 C298 284 280 308 256 308 C232 308 214 284 214 236 Z" fill="url(#skin)"/>
      <path d="M220 250 C230 286 282 286 292 250 C290 292 278 306 256 306 C234 306 222 292 220 250 Z" fill="#8a4b31" opacity=".13"/>
      <path d="M228 276 Q256 266 284 276" fill="none" stroke="#7f3f2b" stroke-width="7" stroke-linecap="round"/>
      <path d="M236 280 Q256 273 276 280" fill="none" stroke="#fff" stroke-width="2" opacity=".12"/>
      <g fill="#7f3f2b" opacity=".26">
        <circle cx="224" cy="260" r="2.2"/><circle cx="234" cy="266" r="2"/><circle cx="246" cy="262" r="2"/>
        <circle cx="266" cy="262" r="2"/><circle cx="278" cy="266" r="2"/><circle cx="288" cy="260" r="2.2"/>
        <circle cx="230" cy="274" r="1.8"/><circle cx="282" cy="274" r="1.8"/>
      </g>
      <path d="M176 184 C146 160 118 126 106 100 C144 122 174 148 194 178 Z" fill="#111827"/>
      <path d="M336 184 C366 160 394 126 406 100 C368 122 338 148 318 178 Z" fill="#111827"/>
      <path d="M180 184 C154 162 132 136 120 116 C152 136 176 158 192 178 Z" fill="#334155" opacity=".45"/>
      <path d="M332 184 C358 162 380 136 392 116 C360 136 336 158 320 178 Z" fill="#334155" opacity=".45"/>
      <path d="M184 190 L252 180 L244 220 L188 222 Z" fill="#0f172a"/>
      <path d="M328 190 L260 180 L268 220 L324 222 Z" fill="#0f172a"/>
      <path d="M192 198 L248 188 L240 212 L198 216 Z" fill="#f8fafc"/>
      <path d="M320 198 L264 188 L272 212 L314 216 Z" fill="#f8fafc"/>
      <path d="M192 198 L248 188" stroke="#e2e8f0" stroke-width="3" stroke-linecap="round"/>
      <path d="M320 198 L264 188" stroke="#e2e8f0" stroke-width="3" stroke-linecap="round"/>
      <path d="M196 206 C206 246 210 268 206 292" fill="none" stroke="#000" stroke-width="8" opacity=".1" stroke-linecap="round"/>
      <path d="M316 206 C306 246 302 268 306 292" fill="none" stroke="#000" stroke-width="8" opacity=".1" stroke-linecap="round"/>
    `,
    hairFront: '',
    foreground: `
      <g fill="url(#metal)" stroke="#475569" stroke-width="3">
        <path d="M338 476 L364 384 L376 390 L356 484 Z"/>
        <path d="M358 476 L384 378 L396 384 L376 484 Z"/>
        <path d="M378 476 L404 372 L416 378 L396 484 Z"/>
      </g>
      <path d="M330 470 C346 444 394 440 418 470 L414 512 L334 512 Z" fill="#1e3a8a"/>
      <path d="M342 470 C358 454 392 452 408 470" fill="none" stroke="#3b5bb5" stroke-width="6" opacity=".7"/>
    `,
  },

  thor: {
    bg: ['#cbd5e1', '#1e293b'],
    suit: ['#94a3b8', '#475569', '#1e293b'],
    skin: { light: '#f8d2b2', mid: '#e7a87c', dark: '#c07b54', shadow: '#8f4f35' },
    hair: ['#fde68a', '#b45309'],
    metal: ['#e2e8f0', '#64748b'],
    accent: ['#fef08a', '#f59e0b'],
    cape: ['#dc2626', '#7f1d1d'],
    eye: { iris: '#3b82f6', brow: '#8a5a1a' },
    lip: '#9a4a3f',
    bodyExtras: `
      <path d="M196 378 L256 424 L316 378 L330 512 L182 512 Z" fill="url(#metal)"/>
      <path d="M200 390 L256 430 L312 390" fill="none" stroke="#f8fafc" stroke-width="6" opacity=".45"/>
      <circle cx="214" cy="390" r="24" fill="#cbd5e1" stroke="#64748b" stroke-width="6"/>
      <circle cx="298" cy="390" r="24" fill="#cbd5e1" stroke="#64748b" stroke-width="6"/>
      <circle cx="214" cy="390" r="10" fill="#64748b"/>
      <circle cx="298" cy="390" r="10" fill="#64748b"/>
      <path d="M120 370 C150 356 184 352 214 358" fill="none" stroke="#dc2626" stroke-width="18" stroke-linecap="round"/>
      <path d="M392 370 C362 356 328 352 298 358" fill="none" stroke="#dc2626" stroke-width="18" stroke-linecap="round"/>
      <path d="M256 430 L256 512" stroke="#f59e0b" stroke-width="8" opacity=".7"/>
    `,
    face: { mouth: 'smile' },
    hairBack: `
      <path d="M176 180 C160 250 164 320 180 360 C192 312 194 250 198 210 Z" fill="url(#hair)"/>
      <path d="M336 180 C352 250 348 320 332 360 C320 312 318 250 314 210 Z" fill="url(#hair)"/>
    `,
    overlay: `
      <path d="M170 184 C174 118 210 84 256 84 C302 84 338 118 342 184 C334 148 300 124 256 124 C212 124 178 148 170 184 Z" fill="url(#metal)"/>
      <path d="M170 184 C210 166 302 166 342 184" fill="none" stroke="#f59e0b" stroke-width="9"/>
      <path d="M172 172 C140 150 112 122 94 96 C130 112 164 136 186 166 Z" fill="url(#metal)"/>
      <path d="M340 172 C372 150 400 122 418 96 C382 112 348 136 326 166 Z" fill="url(#metal)"/>
      <path d="M116 118 L154 150 M130 108 L166 140 M146 100 L180 132" stroke="#94a3b8" stroke-width="4" opacity=".65"/>
      <path d="M396 118 L358 150 M382 108 L346 140 M366 100 L332 132" stroke="#94a3b8" stroke-width="4" opacity=".65"/>
      <path d="M186 190 C176 240 180 292 192 332 C200 290 202 240 204 206 Z" fill="url(#hair)"/>
      <path d="M326 190 C336 240 332 292 320 332 C312 290 310 240 308 206 Z" fill="url(#hair)"/>
      <path d="M198 246 C210 306 302 306 314 246 C312 314 288 336 256 336 C224 336 200 314 198 246 Z" fill="url(#hair)"/>
      <path d="M210 268 C222 310 290 310 302 268" fill="none" stroke="#d97706" stroke-width="4" opacity=".45"/>
      <path d="M226 268 Q256 256 286 268" fill="none" stroke="#7c2d12" stroke-width="8" stroke-linecap="round"/>
    `,
    foreground: `
      <path d="M228 284 Q256 296 284 284" fill="none" stroke="#7c2d12" stroke-width="6" stroke-linecap="round"/>
      <g transform="translate(358 418) rotate(-16)">
        <rect width="96" height="52" rx="9" fill="url(#metal)" stroke="#475569" stroke-width="6"/>
        <rect x="10" y="9" width="76" height="34" rx="5" fill="#cbd5e1"/>
        <rect x="40" y="52" width="16" height="54" rx="6" fill="#78350f"/>
        <path d="M40 62 L56 62" stroke="#f59e0b" stroke-width="5"/>
      </g>
    `,
  },

  'black-panther': {
    bg: ['#c4b5fd', '#4c1d95'],
    suit: ['#312e81', '#0f172a', '#020617'],
    skin: { light: '#1f2937', mid: '#0f172a', dark: '#020617', shadow: '#000000' },
    mask: ['#4c1d95', '#1e293b', '#020617'],
    metal: ['#e2e8f0', '#64748b'],
    accent: ['#e9d5ff', '#7c3aed'],
    eye: { iris: '#e2e8f0', brow: '#111827' },
    collarColor: 'url(#metal)',
    bodyExtras: `
      <path d="M196 378 L256 424 L316 378 L330 512 L182 512 Z" fill="#0f172a"/>
      <path d="M196 378 L256 424 L316 378" fill="none" stroke="#a78bfa" stroke-width="6" opacity=".8"/>
      <path d="M132 380 C160 356 190 350 218 356" fill="none" stroke="#7c3aed" stroke-width="8" opacity=".7"/>
      <path d="M380 380 C352 356 322 350 294 356" fill="none" stroke="#7c3aed" stroke-width="8" opacity=".7"/>
      <g fill="url(#metal)" stroke="#94a3b8" stroke-width="2">
        <path d="M214 398 L222 440 L230 398 Z"/>
        <path d="M236 398 L244 448 L252 398 Z"/>
        <path d="M258 398 L266 448 L274 398 Z"/>
        <path d="M280 398 L288 440 L296 398 Z"/>
      </g>
      <path d="M208 390 C230 410 282 410 304 390" fill="none" stroke="#cbd5e1" stroke-width="3" opacity=".6"/>
    `,
    skipFace: true,
    overlay: `
      <path d="${HEAD_PATH}" fill="url(#mask)"/>
      <path d="M188 106 L168 56 L216 86 Z" fill="url(#mask)" stroke="#a78bfa" stroke-width="3"/>
      <path d="M324 106 L344 56 L296 86 Z" fill="url(#mask)" stroke="#a78bfa" stroke-width="3"/>
      <path d="M196 114 L184 80 L210 96 Z" fill="#7c3aed" opacity=".55"/>
      <path d="M316 114 L328 80 L302 96 Z" fill="#7c3aed" opacity=".55"/>
      <path d="M184 190 L250 180 L242 214 L190 218 Z" fill="#e2e8f0"/>
      <path d="M328 190 L262 180 L270 214 L322 218 Z" fill="#e2e8f0"/>
      <path d="M184 190 L250 180" stroke="#94a3b8" stroke-width="5" stroke-linecap="round"/>
      <path d="M328 190 L262 180" stroke="#94a3b8" stroke-width="5" stroke-linecap="round"/>
      <path d="M226 250 C238 238 274 238 286 250 C274 274 238 274 226 250 Z" fill="#0f172a"/>
      <path d="M256 240 L256 262" stroke="#64748b" stroke-width="3" opacity=".45"/>
      <path d="M214 258 C226 306 286 306 298 258" fill="none" stroke="#4c1d95" stroke-width="5" opacity=".7"/>
      <path d="M190 230 C198 270 204 292 202 312" fill="none" stroke="#7c3aed" stroke-width="3" opacity=".5"/>
      <path d="M322 230 C314 270 308 292 310 312" fill="none" stroke="#7c3aed" stroke-width="3" opacity=".5"/>
      <path d="M204 302 C230 322 282 322 308 302" fill="none" stroke="#e2e8f0" stroke-width="5" opacity=".35"/>
    `,
  },

  'doctor-strange': {
    bg: ['#ddd6fe', '#5b21b6'],
    suit: ['#1e40af', '#1e3a8a', '#172554'],
    skin: { light: '#f8d2b2', mid: '#e7a87c', dark: '#c07b54', shadow: '#8f4f35' },
    hair: ['#3b2318', '#1c110b'],
    accent: ['#fef08a', '#f59e0b'],
    cape: ['#dc2626', '#7f1d1d'],
    eye: { iris: '#4b5563', brow: '#2b1a0e' },
    lip: '#8c4a3a',
    bodyExtras: `
      <path d="M120 374 C150 350 190 344 220 354 L256 390 L292 354 C322 344 362 350 392 374 L384 512 L128 512 Z" fill="url(#cape)" opacity=".92"/>
      <path d="M196 378 L256 424 L316 378 L330 512 L182 512 Z" fill="url(#suit)"/>
      <path d="M196 378 L256 424 L316 378" fill="none" stroke="#f59e0b" stroke-width="7"/>
      <circle cx="256" cy="452" r="26" fill="#f59e0b"/>
      <circle cx="256" cy="452" r="16" fill="#065f46"/>
      <circle cx="256" cy="452" r="8" fill="#fef08a"/>
      <path d="M256 424 L256 438" stroke="#f59e0b" stroke-width="6"/>
      <path d="M220 354 L256 390 L292 354" fill="none" stroke="#fca5a5" stroke-width="5" opacity=".5"/>
    `,
    face: { mouth: 'smile' },
    hairBack: '',
    hairFront: `
      <path d="M164 200 C160 128 198 82 256 82 C314 82 352 128 348 200 C342 160 318 136 256 136 C204 136 174 158 164 200 Z" fill="url(#hair)"/>
      <path d="M186 160 C198 142 220 132 244 130" fill="none" stroke="#fff" stroke-width="5" opacity=".14"/>
      <path d="M176 172 C172 198 176 222 184 244 C180 216 180 190 184 170 Z" fill="#cbd5e1"/>
      <path d="M336 172 C340 198 336 222 328 244 C332 216 332 190 328 170 Z" fill="#cbd5e1"/>
      <path d="M238 84 C250 104 252 122 248 140" fill="none" stroke="#fff" stroke-width="4" opacity=".16"/>
    `,
    overlay: `
      <path d="M188 332 C200 300 226 290 256 290 C286 290 312 300 324 332 L324 358 L188 358 Z" fill="#1e3a8a"/>
      <path d="M188 332 C200 300 226 290 256 290 C286 290 312 300 324 332" fill="none" stroke="#f59e0b" stroke-width="5"/>
      <path d="M212 268 C220 312 292 312 300 268 C300 310 282 328 256 328 C230 328 212 310 212 268 Z" fill="url(#hair)"/>
      <path d="M230 260 Q256 250 282 260" fill="none" stroke="#2b1a0e" stroke-width="7" stroke-linecap="round"/>
      <path d="M242 270 Q256 282 270 270" fill="none" stroke="#2b1a0e" stroke-width="5" stroke-linecap="round"/>
    `,
    foreground: `
      <circle cx="118" cy="382" r="54" fill="none" stroke="#fbbf24" stroke-width="4" opacity=".5"/>
      <circle cx="118" cy="382" r="40" fill="none" stroke="#fbbf24" stroke-width="2" opacity=".4"/>
      <path d="M118 328 L118 436 M64 382 L172 382 M80 344 L156 420 M156 344 L80 420" stroke="#fbbf24" stroke-width="2" opacity=".35"/>
      <circle cx="394" cy="382" r="54" fill="none" stroke="#fbbf24" stroke-width="4" opacity=".5"/>
      <circle cx="394" cy="382" r="40" fill="none" stroke="#fbbf24" stroke-width="2" opacity=".4"/>
      <path d="M394 328 L394 436 M340 382 L448 382 M356 344 L432 420 M432 344 L356 420" stroke="#fbbf24" stroke-width="2" opacity=".35"/>
    `,
  },

  'captain-marvel': {
    bg: ['#fef3c7', '#b45309'],
    suit: ['#1e40af', '#1e3a8a', '#172554'],
    skin: { light: '#f8d2b2', mid: '#e7a87c', dark: '#c07b54', shadow: '#8f4f35' },
    hair: ['#fde68a', '#d4a017'],
    accent: ['#fef08a', '#f59e0b'],
    eye: { iris: '#3b82f6', brow: '#8a5a1a' },
    lip: '#b04545',
    bodyExtras: `
      <path d="M118 370 C150 356 188 352 222 358 L256 402 L290 358 C324 352 362 356 394 370 L384 512 L128 512 Z" fill="#b91c1c" opacity=".9"/>
      <path d="M128 512 L160 380 L196 512 Z" fill="#7f1d1d" opacity=".5"/>
      <path d="M384 512 L352 380 L316 512 Z" fill="#7f1d1d" opacity=".5"/>
      <polygon points="${starPath(256, 430, 42, 18)}" fill="url(#accent)"/>
      <path d="M256 388 L256 472" stroke="#fff" stroke-width="4" opacity=".2"/>
    `,
    face: { mouth: 'lips', lashes: true },
    hairBack: longHairBack(),
    hairFront: longHairFront(),
    overlay: '',
  },

  'black-widow': {
    bg: ['#fecdd3', '#881337'],
    suit: ['#334155', '#1e293b', '#0f172a'],
    skin: { light: '#fbe0d0', mid: '#efb89a', dark: '#c98b6d', shadow: '#8f5740' },
    hair: ['#dc2626', '#7f1d1d'],
    accent: ['#fca5a5', '#b91c1c'],
    eye: { iris: '#16a34a', brow: '#5b1a1a' },
    lip: '#b91c1c',
    bodyExtras: `
      <path d="M128 512 L158 382 L196 512 Z" fill="#0f172a"/>
      <path d="M384 512 L354 382 L316 512 Z" fill="#0f172a"/>
      <path d="M196 382 L256 430 L316 382" fill="none" stroke="#64748b" stroke-width="10" stroke-linecap="round"/>
      <path d="M232 406 L280 406 L256 434 Z" fill="#ef4444"/>
      <path d="M232 462 L280 462 L256 434 Z" fill="#ef4444"/>
      <path d="M254 382 L254 512" stroke="#94a3b8" stroke-width="4" opacity=".4"/>
      <g fill="#94a3b8" opacity=".8">
        <rect x="146" y="430" width="8" height="54" rx="4"/>
        <rect x="358" y="430" width="8" height="54" rx="4"/>
      </g>
    `,
    face: { mouth: 'lips', lashes: true },
    hairBack: bobHair(),
    hairFront: `
      <path d="M164 198 C158 130 198 82 256 82 C314 82 354 130 348 198 C336 154 312 132 256 132 C200 132 176 154 164 198 Z" fill="url(#hair)"/>
      <path d="M170 210 C162 250 166 288 176 314 C182 280 182 246 186 214 Z" fill="url(#hair)"/>
      <path d="M342 210 C350 250 346 288 336 314 C330 280 330 246 326 214 Z" fill="url(#hair)"/>
      <path d="M206 120 C230 102 282 102 306 120" fill="none" stroke="#fca5a5" stroke-width="6" opacity=".2"/>
    `,
    overlay: '',
  },

  'green-lantern': {
    bg: ['#a7f3d0', '#065f46'],
    suit: ['#16a34a', '#047857', '#064e3b'],
    skin: { light: '#e8bd97', mid: '#c98b62', dark: '#a05f3c', shadow: '#6b3d24' },
    hair: ['#5b3a22', '#2b1a0e'],
    accent: ['#d1fae5', '#10b981'],
    eye: { iris: '#0f766e', brow: '#2b1a0e' },
    lip: '#8c4a3a',
    bodyExtras: `
      <path d="M128 512 L160 382 L196 512 Z" fill="#064e3b"/>
      <path d="M384 512 L352 382 L316 512 Z" fill="#064e3b"/>
      <circle cx="256" cy="430" r="42" fill="#ecfdf5"/>
      <circle cx="256" cy="430" r="35" fill="#059669"/>
      <rect x="218" y="416" width="76" height="10" rx="5" fill="#ecfdf5"/>
      <rect x="218" y="436" width="76" height="10" rx="5" fill="#ecfdf5"/>
      <circle cx="382" cy="476" r="30" fill="#34d399" opacity=".35"/>
      <circle cx="382" cy="476" r="20" fill="none" stroke="#a7f3d0" stroke-width="7"/>
    `,
    face: { mouth: 'smile' },
    hairBack: '',
    hairFront: shortHair(),
    overlay: `
      <path d="M166 190 C190 172 236 174 256 194 C276 174 322 172 346 190 C334 222 302 234 282 216 C270 204 264 202 256 210 C248 202 242 204 230 216 C210 234 178 222 166 190 Z" fill="#047857"/>
      <path d="M166 190 C190 172 236 174 256 194 C276 174 322 172 346 190" fill="none" stroke="#6ee7b7" stroke-width="5" opacity=".45"/>
      <ellipse cx="220" cy="202" rx="23" ry="12" fill="#ecfdf5"/>
      <ellipse cx="292" cy="202" rx="23" ry="12" fill="#ecfdf5"/>
      <ellipse cx="220" cy="202" rx="12" ry="7" fill="#a7f3d0" opacity=".55"/>
      <ellipse cx="292" cy="202" rx="12" ry="7" fill="#a7f3d0" opacity=".55"/>
    `,
  },

  'scarlet-witch': {
    bg: ['#fecdd3', '#7f1d1d'],
    suit: ['#be123c', '#881337', '#4c0519'],
    skin: { light: '#f8d8c6', mid: '#e9b294', dark: '#c58363', shadow: '#8d5036' },
    hair: ['#b45309', '#7c2d12'],
    accent: ['#fecdd3', '#e11d48'],
    eye: { iris: '#15803d', brow: '#5b2a12' },
    lip: '#9f1239',
    bodyExtras: `
      <path d="M128 512 L160 382 L196 512 Z" fill="#4c0519"/>
      <path d="M384 512 L352 382 L316 512 Z" fill="#4c0519"/>
      <path d="M196 382 L256 430 L316 382" fill="none" stroke="#fb7185" stroke-width="8" stroke-linecap="round" opacity=".8"/>
      <path d="M120 452 C88 404 98 350 142 326" fill="none" stroke="#f43f5e" stroke-width="9" opacity=".65" stroke-linecap="round"/>
      <path d="M392 452 C424 404 414 350 370 326" fill="none" stroke="#f43f5e" stroke-width="9" opacity=".65" stroke-linecap="round"/>
      <circle cx="108" cy="410" r="12" fill="#fb7185" opacity=".45"/>
      <circle cx="404" cy="410" r="12" fill="#fb7185" opacity=".45"/>
      <circle cx="140" cy="326" r="8" fill="#fecdd3" opacity=".5"/>
      <circle cx="372" cy="326" r="8" fill="#fecdd3" opacity=".5"/>
    `,
    face: { mouth: 'lips', lashes: true },
    hairBack: longHairBack(),
    hairFront: `
      <path d="M164 198 C158 128 198 80 256 80 C314 80 354 128 348 198 C338 156 312 132 256 132 C200 132 174 156 164 198 Z" fill="url(#hair)"/>
      <path d="M164 198 C154 250 156 306 170 350 C178 304 178 250 184 206 Z" fill="url(#hair)"/>
      <path d="M348 198 C358 250 356 306 342 350 C334 304 334 250 328 206 Z" fill="url(#hair)"/>
      <path d="M196 128 C228 104 288 104 316 128" fill="none" stroke="#fdba74" stroke-width="7" opacity=".2"/>
    `,
    overlay: '',
    foreground: `
      <path d="M188 150 L204 118 L222 146 L256 108 L290 146 L308 118 L324 150 L308 170 L204 170 Z" fill="#be123c"/>
      <path d="M204 170 L308 170" stroke="#fda4af" stroke-width="5" opacity=".65"/>
      <path d="M222 146 L256 108 L290 146" fill="none" stroke="#fecdd3" stroke-width="4" opacity=".55"/>
      <circle cx="256" cy="132" r="8" fill="#fecdd3"/>
    `,
  },

  cyborg: {
    bg: ['#a5f3fc', '#0e7490'],
    suit: ['#94a3b8', '#475569', '#1e293b'],
    skin: { light: '#b98256', mid: '#8d5524', dark: '#5c3416', shadow: '#3a1f0d' },
    hair: ['#1f2937', '#0b1120'],
    metal: ['#e2e8f0', '#64748b'],
    accent: ['#a5f3fc', '#0891b2'],
    eye: { iris: '#38bdf8', brow: '#111827' },
    lip: '#6b3d24',
    bodyExtras: `
      <path d="M128 512 L160 382 L196 512 Z" fill="#334155"/>
      <path d="M384 512 L352 382 L316 512 Z" fill="#334155"/>
      <circle cx="256" cy="430" r="38" fill="#0891b2" opacity=".35"/>
      <circle cx="256" cy="430" r="26" fill="none" stroke="#67e8f9" stroke-width="8"/>
      <path d="M142 392 L178 412 L164 448" fill="none" stroke="#67e8f9" stroke-width="5" opacity=".8"/>
      <path d="M370 392 L334 412 L348 448" fill="none" stroke="#67e8f9" stroke-width="5" opacity=".8"/>
      <g fill="#67e8f9" opacity=".7">
        <circle cx="154" cy="462" r="4"/><circle cx="174" cy="478" r="3"/><circle cx="146" cy="488" r="3"/>
        <circle cx="358" cy="462" r="4"/><circle cx="338" cy="478" r="3"/><circle cx="366" cy="488" r="3"/>
      </g>
      <path d="M196 382 L256 430 L316 382" fill="none" stroke="#cbd5e1" stroke-width="8" opacity=".5"/>
    `,
    face: { eyes: 'metal', mouth: 'stern', browStyle: 'stern' },
    hairBack: '',
    hairFront: `
      <path d="M164 200 C160 128 198 82 256 82 C286 82 312 94 330 114 C308 112 286 120 270 136 C250 116 208 116 188 146 C176 162 168 180 164 200 Z" fill="url(#hair)"/>
    `,
    overlay: `
      <path d="M256 82 C320 82 358 126 358 196 C358 238 344 270 320 290 L256 312 Z" fill="url(#metal)"/>
      <path d="M256 82 C320 82 358 126 358 196 C358 238 344 270 320 290 L256 312 Z" fill="#0f172a" opacity=".12"/>
      <path d="M256 98 L256 304" stroke="#475569" stroke-width="4" opacity=".7"/>
      <path d="M286 114 C324 136 340 172 338 210 C336 252 316 282 288 300" fill="none" stroke="#f8fafc" stroke-width="4" opacity=".35"/>
      <path d="M272 146 L316 160 L304 192" fill="none" stroke="#94a3b8" stroke-width="4"/>
      <path d="M276 246 L320 234 L308 206" fill="none" stroke="#94a3b8" stroke-width="4"/>
      <rect x="270" y="258" width="38" height="30" rx="8" fill="#64748b"/>
      <path d="M278 268 L300 268 M278 278 L300 278" stroke="#cbd5e1" stroke-width="3"/>
      <circle cx="292" cy="200" r="13" fill="#ef4444" opacity=".45"/>
    `,
  },

  'ant-man': {
    bg: ['#fecaca', '#991b1b'],
    suit: ['#dc2626', '#991b1b', '#7f1d1d'],
    skin: { light: '#b91c1c', mid: '#991b1b', dark: '#7f1d1d', shadow: '#450a0a' },
    metal: ['#e2e8f0', '#64748b'],
    accent: ['#fecaca', '#dc2626'],
    eye: { iris: '#ef4444', brow: '#111827' },
    bodyExtras: `
      <path d="M128 512 L160 382 L196 512 Z" fill="#7f1d1d"/>
      <path d="M384 512 L352 382 L316 512 Z" fill="#7f1d1d"/>
      <path d="M196 382 L256 430 L316 382" fill="none" stroke="#cbd5e1" stroke-width="9" stroke-linecap="round"/>
      <circle cx="256" cy="430" r="24" fill="#0f172a"/>
      <ellipse cx="256" cy="430" rx="10" ry="14" fill="#f8fafc"/>
      <path d="M236 416 L226 404 M276 416 L286 404 M236 444 L226 456 M276 444 L286 456" stroke="#f8fafc" stroke-width="4" stroke-linecap="round"/>
      <path d="M256 388 L256 472" stroke="#f8fafc" stroke-width="4" opacity=".4"/>
    `,
    skipFace: true,
    overlay: `
      <path d="M154 196 C154 124 192 80 256 80 C320 80 358 124 358 196 C358 250 326 292 286 308 L226 308 C186 292 154 250 154 196 Z" fill="url(#suit)"/>
      <path d="M172 196 C172 138 204 102 256 102 C308 102 340 138 340 196 C340 242 312 278 278 292 L234 292 C200 278 172 242 172 196 Z" fill="url(#metal)"/>
      <path d="M188 194 C196 154 222 128 256 128 C290 128 316 154 324 194 C316 166 290 148 256 148 C222 148 196 166 188 194 Z" fill="#fff" opacity=".26"/>
      <ellipse cx="220" cy="202" rx="29" ry="18" fill="#111827"/>
      <ellipse cx="292" cy="202" rx="29" ry="18" fill="#111827"/>
      <ellipse cx="220" cy="200" rx="18" ry="11" fill="#ef4444"/>
      <ellipse cx="292" cy="200" rx="18" ry="11" fill="#ef4444"/>
      <circle cx="214" cy="196" r="4" fill="#fecaca"/>
      <circle cx="286" cy="196" r="4" fill="#fecaca"/>
      <path d="M232 258 L280 258 L272 284 L240 284 Z" fill="#475569"/>
      <path d="M238 264 L274 264 M238 272 L274 272" stroke="#94a3b8" stroke-width="3"/>
      <path d="M170 156 C120 112 96 92 76 66" stroke="#cbd5e1" stroke-width="10" stroke-linecap="round" fill="none"/>
      <path d="M342 156 C392 112 416 92 436 66" stroke="#cbd5e1" stroke-width="10" stroke-linecap="round" fill="none"/>
      <circle cx="76" cy="66" r="8" fill="#ef4444"/>
      <circle cx="436" cy="66" r="8" fill="#ef4444"/>
      <path d="M256 128 L256 176" stroke="#dc2626" stroke-width="6" opacity=".5"/>
      <path d="M196 176 L228 168" stroke="#fff" stroke-width="5" opacity=".2" stroke-linecap="round"/>
    `,
  },

  storm: {
    bg: ['#bae6fd', '#075985'],
    suit: ['#334155', '#111827', '#020617'],
    skin: { light: '#b98256', mid: '#8d5524', dark: '#5c3416', shadow: '#3a1f0d' },
    hair: ['#f8fafc', '#94a3b8'],
    accent: ['#e0f2fe', '#f59e0b'],
    eye: { iris: '#e0f2fe', brow: '#1f2937' },
    lip: '#6b3d24',
    bodyExtras: `
      <path d="M128 512 L160 382 L196 512 Z" fill="#020617"/>
      <path d="M384 512 L352 382 L316 512 Z" fill="#020617"/>
      <path d="M262 390 L226 446 L252 446 L238 488 L292 424 L264 424 Z" fill="url(#accent)"/>
      <path d="M196 382 L256 430 L316 382" fill="none" stroke="#e2e8f0" stroke-width="8" stroke-linecap="round" opacity=".75"/>
      <path d="M120 392 C86 356 90 312 124 292" fill="none" stroke="#bae6fd" stroke-width="6" opacity=".55" stroke-linecap="round"/>
      <path d="M392 392 C426 356 422 312 388 292" fill="none" stroke="#bae6fd" stroke-width="6" opacity=".55" stroke-linecap="round"/>
    `,
    face: { eyes: 'glow', mouth: 'lips', lashes: true },
    hairBack: `
      <path d="M140 216 C128 128 188 58 256 58 C324 58 384 128 372 216 C396 286 388 342 352 372 C326 392 300 386 292 354 L286 236 L226 236 L220 354 C212 386 186 392 160 372 C124 342 116 286 140 216 Z" fill="url(#hair)"/>
    `,
    hairFront: `
      <path d="M160 198 C152 126 196 76 256 76 C316 76 360 126 352 198 C338 150 310 126 256 126 C202 126 174 150 160 198 Z" fill="url(#hair)"/>
      <path d="M160 198 C142 248 142 306 156 358 C168 304 170 250 178 208 Z" fill="url(#hair)"/>
      <path d="M352 198 C370 248 370 306 356 358 C344 304 342 250 334 208 Z" fill="url(#hair)"/>
      <path d="M190 120 C226 90 292 90 328 120" fill="none" stroke="#fff" stroke-width="8" opacity=".45"/>
      <path d="M172 210 C160 260 162 310 174 348" fill="none" stroke="#e2e8f0" stroke-width="4" opacity=".35"/>
      <path d="M340 210 C352 260 350 310 338 348" fill="none" stroke="#e2e8f0" stroke-width="4" opacity=".35"/>
    `,
    overlay: '',
  },

  shazam: {
    bg: ['#fef08a', '#a16207'],
    suit: ['#dc2626', '#991b1b', '#7f1d1d'],
    skin: { light: '#f8d2b2', mid: '#e7a87c', dark: '#c07b54', shadow: '#8f4f35' },
    hair: ['#1f2937', '#0b1120'],
    accent: ['#fef08a', '#facc15'],
    cape: ['#f8fafc', '#cbd5e1'],
    eye: { iris: '#3b82f6', brow: '#111827' },
    lip: '#9a4a3f',
    bodyExtras: `
      <path d="M128 512 L160 382 L196 512 Z" fill="#7f1d1d"/>
      <path d="M384 512 L352 382 L316 512 Z" fill="#7f1d1d"/>
      <path d="M262 390 L226 446 L252 446 L238 488 L292 424 L264 424 Z" fill="url(#accent)"/>
      <path d="M196 382 L256 430 L316 382" fill="none" stroke="#fef08a" stroke-width="10" stroke-linecap="round"/>
      <path d="M206 360 L256 408 L306 360" fill="none" stroke="#f8fafc" stroke-width="14" stroke-linecap="round"/>
    `,
    face: { mouth: 'smile' },
    hairBack: '',
    hairFront: shortHair(),
    overlay: '',
  },

  hawkeye: {
    bg: ['#ddd6fe', '#5b21b6'],
    suit: ['#7c3aed', '#4c1d95', '#2e1065'],
    skin: { light: '#f3c9a8', mid: '#dfa276', dark: '#b8784f', shadow: '#84492c' },
    hair: ['#92400e', '#451a03'],
    accent: ['#ddd6fe', '#8b5cf6'],
    eye: { iris: '#4f46e5', brow: '#451a03' },
    lip: '#8c4a3a',
    bodyExtras: `
      <path d="M128 512 L160 382 L196 512 Z" fill="#2e1065"/>
      <path d="M384 512 L352 382 L316 512 Z" fill="#2e1065"/>
      <path d="M182 372 L334 512" stroke="#312e81" stroke-width="26" opacity=".9"/>
      <path d="M196 382 L256 430 L316 382" fill="none" stroke="#c4b5fd" stroke-width="8" stroke-linecap="round" opacity=".75"/>
      <circle cx="256" cy="440" r="34" fill="#ede9fe" opacity=".9"/>
      <circle cx="256" cy="440" r="26" fill="#7c3aed"/>
      <circle cx="256" cy="440" r="16" fill="#ede9fe"/>
      <circle cx="256" cy="440" r="7" fill="#7c3aed"/>
      <path d="M330 356 L372 344 L386 430 L344 442 Z" fill="#312e81" opacity=".95"/>
      <path d="M338 346 L330 306 M352 342 L350 302 M366 338 L372 300" stroke="#ddd6fe" stroke-width="5" stroke-linecap="round"/>
      <path d="M330 306 L322 292 L338 300 Z" fill="#c4b5fd"/>
      <path d="M350 302 L344 288 L358 296 Z" fill="#c4b5fd"/>
      <path d="M372 300 L368 286 L380 294 Z" fill="#c4b5fd"/>
    `,
    face: { mouth: 'smile' },
    hairBack: '',
    hairFront: shortHair(),
    overlay: `
      <path d="M166 190 C190 172 236 174 256 194 C276 174 322 172 346 190 C334 222 302 234 282 216 C270 204 264 202 256 210 C248 202 242 204 230 216 C210 234 178 222 166 190 Z" fill="#6d28d9"/>
      <path d="M166 190 C190 172 236 174 256 194 C276 174 322 172 346 190" fill="none" stroke="#c4b5fd" stroke-width="5" opacity=".5"/>
      <ellipse cx="220" cy="200" rx="22" ry="12" fill="#ede9fe"/>
      <ellipse cx="292" cy="200" rx="22" ry="12" fill="#ede9fe"/>
      <ellipse cx="220" cy="200" rx="11" ry="6" fill="#c4b5fd" opacity=".7"/>
      <ellipse cx="292" cy="200" rx="11" ry="6" fill="#c4b5fd" opacity=".7"/>
    `,
    foreground: `
      <path d="M396 312 C462 368 462 462 396 518" fill="none" stroke="#7c3aed" stroke-width="14"/>
      <path d="M396 312 L396 518" stroke="#ede9fe" stroke-width="2.5"/>
      <rect x="384" y="398" width="24" height="46" rx="10" fill="#312e81"/>
      <path d="M396 312 L428 334 L428 350" fill="none" stroke="#c4b5fd" stroke-width="4"/>
      <path d="M396 518 L428 496 L428 480" fill="none" stroke="#c4b5fd" stroke-width="4"/>
    `,
  },

  supergirl: {
    bg: ['#bfdbfe', '#1d4ed8'],
    suit: ['#2563eb', '#1d4ed8', '#1e3a8a'],
    skin: { light: '#f8d8c6', mid: '#e9b294', dark: '#c58363', shadow: '#8d5036' },
    hair: ['#fde68a', '#d4a017'],
    accent: ['#fef08a', '#facc15'],
    cape: ['#dc2626', '#991b1b'],
    eye: { iris: '#2563eb', brow: '#a16207' },
    lip: '#b04545',
    bodyExtras: `
      <path d="M118 370 C150 356 188 352 222 358 L256 402 L290 358 C324 352 362 356 394 370 L384 512 L128 512 Z" fill="url(#suit)"/>
      <path d="M222 404 L290 404 L282 474 L256 490 L230 474 Z" fill="#dc2626" stroke="#facc15" stroke-width="6"/>
      <path d="M274 416 C260 404 238 410 238 426 C238 444 274 438 274 458 C274 476 250 480 238 468" fill="none" stroke="#facc15" stroke-width="9" stroke-linecap="round"/>
      <path d="M256 382 L256 404" stroke="#facc15" stroke-width="6" opacity=".7"/>
    `,
    face: { mouth: 'lips', lashes: true },
    hairBack: longHairBack(),
    hairFront: longHairFront(),
    overlay: '',
  },

  groot: {
    bg: ['#bbf7d0', '#14532d'],
    suit: ['#92400e', '#78350f', '#451a03'],
    skin: { light: '#c28a4a', mid: '#92400e', dark: '#5b2f12', shadow: '#3f2410' },
    hair: ['#4d7c0f', '#365314'],
    accent: ['#d9f99d', '#65a30d'],
    eye: { iris: '#fde68a', brow: '#3f2410' },
    lip: '#3f2410',
    bodyExtras: `
      <path d="M128 512 L160 382 L196 512 Z" fill="#5b2f12"/>
      <path d="M384 512 L352 382 L316 512 Z" fill="#5b2f12"/>
      <path d="M196 382 L256 430 L316 382" fill="none" stroke="#a16207" stroke-width="12" stroke-linecap="round"/>
      <path d="M110 512 C130 440 160 390 210 360" fill="none" stroke="#78350f" stroke-width="18" stroke-linecap="round"/>
      <path d="M402 512 C382 440 352 390 302 360" fill="none" stroke="#78350f" stroke-width="18" stroke-linecap="round"/>
      <path d="M142 444 C118 420 112 394 122 372" fill="none" stroke="#65a30d" stroke-width="10" stroke-linecap="round" opacity=".8"/>
      <path d="M370 444 C394 420 400 394 390 372" fill="none" stroke="#65a30d" stroke-width="10" stroke-linecap="round" opacity=".8"/>
      <ellipse cx="156" cy="382" rx="18" ry="10" fill="#4d7c0f" opacity=".8"/>
      <ellipse cx="356" cy="382" rx="18" ry="10" fill="#4d7c0f" opacity=".8"/>
    `,
    skipFace: true,
    overlay: `
      <path d="${HEAD_PATH}" fill="url(#skin)"/>
      <path d="M256 82 C320 82 358 126 358 196 C358 226 348 254 332 276 C328 212 306 160 256 130 C206 160 184 212 180 276 C164 254 154 226 154 196 C154 126 192 82 256 82 Z" fill="#e0b36a" opacity=".32"/>
      <g fill="none" stroke="#5b2f12" stroke-width="7" opacity=".55" stroke-linecap="round">
        <path d="M178 224 C196 214 210 218 218 232"/>
        <path d="M334 224 C316 214 302 218 294 232"/>
        <path d="M206 276 C220 266 234 268 242 280"/>
        <path d="M306 276 C292 266 278 268 270 280"/>
        <path d="M256 112 C248 136 250 156 258 170"/>
        <path d="M256 214 C248 232 250 248 258 262"/>
        <path d="M214 142 C206 156 204 170 210 182"/>
        <path d="M298 142 C306 156 308 170 302 182"/>
      </g>
      <path d="M190 196 C204 186 218 188 228 198" fill="none" stroke="#451a03" stroke-width="8" stroke-linecap="round"/>
      <path d="M322 196 C308 186 294 188 284 198" fill="none" stroke="#451a03" stroke-width="8" stroke-linecap="round"/>
      <ellipse cx="220" cy="202" rx="18" ry="14" fill="#fef3c7"/>
      <ellipse cx="292" cy="202" rx="18" ry="14" fill="#fef3c7"/>
      <circle cx="220" cy="202" r="8" fill="#f59e0b"/>
      <circle cx="292" cy="202" r="8" fill="#f59e0b"/>
      <circle cx="220" cy="202" r="3" fill="#fff"/>
      <circle cx="292" cy="202" r="3" fill="#fff"/>
      <path d="M222 262 Q256 280 290 262" fill="none" stroke="#3f2410" stroke-width="9" stroke-linecap="round"/>
      <path d="M232 267 Q256 274 280 267" fill="none" stroke="#a16207" stroke-width="3" opacity=".55"/>
      <ellipse cx="186" cy="122" rx="20" ry="9" transform="rotate(-28 186 122)" fill="#4d7c0f"/>
      <ellipse cx="326" cy="122" rx="20" ry="9" transform="rotate(28 326 122)" fill="#4d7c0f"/>
      <ellipse cx="230" cy="92" rx="14" ry="6" transform="rotate(-16 230 92)" fill="#65a30d"/>
      <ellipse cx="286" cy="94" rx="12" ry="5" transform="rotate(18 286 94)" fill="#65a30d"/>
    `,
  },
};

function buildSvg(h) {
  const faceOpts = h.face ?? {};
  const layers = [
    `<rect width="512" height="512" fill="url(#bg)"/>`,
    `<circle cx="256" cy="192" r="184" fill="url(#halo)"/>`,
    body(h, h.bodyExtras ?? ''),
    collar(h, h.collarColor ?? 'url(#accent)', h.collarWidth ?? 14),
    neck(h),
    h.hairBack ?? '',
    face(h, faceOpts),
    h.overlay ?? '',
    h.hairFront ?? '',
    h.foreground ?? '',
    `<rect width="512" height="512" fill="url(#vignette)" opacity=".7"/>`,
  ];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
${defs(h)}
${layers.join('\n')}
</svg>
`;
}

for (const [name, hero] of Object.entries(heroes)) {
  const svg = buildSvg(hero).replace(/[ \t]+$/gm, '');
  writeFileSync(resolve(outDir, `${name}.svg`), svg);
  console.log(`wrote ${name}.svg (${svg.length} bytes)`);
}

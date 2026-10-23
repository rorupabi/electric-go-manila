// Generated product illustrations (SVG -> WebP via sharp). Original artwork, so no image licensing issues.
// Canvas is 1400x1050 (4:3, matches the product card ratio).

export type ArtStyle =
  | 'scooter-compact' | 'scooter-commuter' | 'scooter-seated' | 'scooter-offroad'
  | 'bike-stepthru' | 'bike-folding' | 'bike-city' | 'bike-belt' | 'bike-cargo' | 'bike-mtb';

const INK = '#0b1f17';
const VOLT = '#bef264';

function wheel(cx: number, cy: number, r: number, opts: { knobby?: boolean; spokes?: boolean; fat?: boolean } = {}) {
  const tire = opts.fat ? 30 : opts.knobby ? 26 : 18;
  const rim = r - tire / 2 - 6;
  let out = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${INK}" stroke-width="${tire}"/>`;
  if (opts.knobby || opts.fat) {
    out += `<circle cx="${cx}" cy="${cy}" r="${r + tire / 2 - 2}" fill="none" stroke="${INK}" stroke-width="8" stroke-dasharray="10 12"/>`;
  }
  out += `<circle cx="${cx}" cy="${cy}" r="${rim}" fill="#ffffff" stroke="#94a3a0" stroke-width="4"/>`;
  if (opts.spokes) {
    for (let a = 0; a < 180; a += 22.5) {
      const rad = (a * Math.PI) / 180;
      const dx = Math.cos(rad) * rim;
      const dy = Math.sin(rad) * rim;
      out += `<line x1="${cx - dx}" y1="${cy - dy}" x2="${cx + dx}" y2="${cy + dy}" stroke="#b6c2bf" stroke-width="2.5"/>`;
    }
  }
  out += `<circle cx="${cx}" cy="${cy}" r="${Math.max(16, r * 0.16)}" fill="#cbd5d1" stroke="${INK}" stroke-width="6"/>`;
  return out;
}

const tube = (d: string, w = 18, color = INK) =>
  `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;

function spring(x1: number, y1: number, x2: number, y2: number) {
  const n = 7;
  const pts: string[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = x1 + (x2 - x1) * t + (i % 2 ? 12 : -12);
    const y = y1 + (y2 - y1) * t;
    pts.push(`${x},${y}`);
  }
  return `<polyline points="${pts.join(' ')}" fill="none" stroke="${VOLT}" stroke-width="7" stroke-linejoin="round"/>`;
}

function scooter(style: ArtStyle, color: string) {
  const big = style === 'scooter-offroad';
  const r = style === 'scooter-compact' ? 72 : big ? 118 : 92;
  const y = 860 - r;
  const rx = 330;
  const fx = 1060;
  let s = '';
  // fenders
  s += tube(`M ${rx - r - 10} ${y - 8} A ${r + 22} ${r + 22} 0 0 1 ${rx + r * 0.7} ${y - r * 0.85}`, 12, color);
  s += tube(`M ${fx - r * 0.7} ${y - r * 0.9} A ${r + 22} ${r + 22} 0 0 1 ${fx + r + 6} ${y - 14}`, 12, color);
  s += wheel(rx, y, r, { knobby: big });
  s += wheel(fx, y, r, { knobby: big });
  // deck
  const deckY = y - (big ? 70 : 46);
  s += `<rect x="${rx + 40}" y="${deckY - 22}" width="${fx - rx - 150}" height="${big ? 56 : 44}" rx="20" fill="${color}" stroke="${INK}" stroke-width="10"/>`;
  s += `<rect x="${rx + 70}" y="${deckY - 30}" width="${fx - rx - 220}" height="12" rx="6" fill="${INK}" opacity="0.85"/>`;
  s += tube(`M ${rx} ${y} L ${rx + 60} ${deckY}`, 16);
  // stem + fork
  const topX = fx - 120;
  const topY = big ? 230 : 250;
  s += tube(`M ${fx} ${y} L ${fx - 70} ${deckY - 10} L ${topX} ${topY}`, big ? 26 : 22);
  s += tube(`M ${fx - 70} ${deckY - 10} L ${fx - 150} ${deckY}`, 16);
  s += tube(`M ${topX - 95} ${topY} L ${topX + 85} ${topY}`, 18);
  s += tube(`M ${topX - 95} ${topY} L ${topX - 55} ${topY}`, 26, '#334155');
  s += tube(`M ${topX + 45} ${topY} L ${topX + 85} ${topY}`, 26, '#334155');
  // battery/display accent on the stem, headlight
  s += tube(`M ${topX + 12} ${topY + 70} L ${topX + 28} ${topY + 170}`, 22, VOLT);
  s += `<rect x="${topX - 34}" y="${topY - 34}" width="68" height="24" rx="8" fill="${INK}"/><rect x="${topX - 24}" y="${topY - 28}" width="48" height="12" rx="4" fill="${VOLT}"/>`;
  s += `<circle cx="${topX + 34}" cy="${topY + 46}" r="16" fill="#fef9c3" stroke="${INK}" stroke-width="6"/>`;
  if (style === 'scooter-seated') {
    s += tube(`M ${rx + 230} ${deckY - 20} L ${rx + 250} ${deckY - 300}`, 18);
    s += `<rect x="${rx + 160}" y="${deckY - 330}" width="190" height="44" rx="22" fill="${INK}"/>`;
    s += `<rect x="${rx + 120}" y="${deckY - 110}" width="150" height="70" rx="12" fill="${color}" stroke="${INK}" stroke-width="8"/>`;
  }
  if (big) {
    s += spring(fx - 30, y - 90, fx - 60, deckY - 40);
    s += spring(rx + 30, y - 80, rx + 90, deckY - 10);
    s += `<circle cx="${rx}" cy="${y}" r="34" fill="${VOLT}" stroke="${INK}" stroke-width="6"/><circle cx="${fx}" cy="${y}" r="34" fill="${VOLT}" stroke="${INK}" stroke-width="6"/>`;
  }
  if (style === 'scooter-compact') {
    s += `<circle cx="${fx - 72}" cy="${deckY - 10}" r="16" fill="${VOLT}" stroke="${INK}" stroke-width="6"/>`; // folding hinge
  }
  return s;
}

function bike(style: ArtStyle, color: string) {
  const folding = style === 'bike-folding';
  const cargo = style === 'bike-cargo';
  const mtb = style === 'bike-mtb';
  const r = folding ? 128 : cargo ? 150 : 172;
  const y = 870 - r;
  const rx = folding ? 450 : cargo ? 300 : 360;
  const fx = folding ? 960 : cargo ? 1100 : 1040;
  const bbX = folding ? 690 : cargo ? 730 : 660;
  const bbY = y + 18;
  const seatTop = { x: bbX - 70, y: folding ? 470 : mtb ? 470 : 430 };
  const headTop = { x: fx - 110, y: folding ? 450 : 440 };
  const headBot = { x: fx - 85, y: headTop.y + 90 };
  let s = '';

  if (style === 'bike-city' || style === 'bike-belt' || style === 'bike-stepthru' || cargo) {
    s += tube(`M ${rx - r - 8} ${y - 6} A ${r + 24} ${r + 24} 0 0 1 ${rx + r * 0.75} ${y - r * 0.8}`, 10, color);
    s += tube(`M ${fx - r * 0.75} ${y - r * 0.8} A ${r + 24} ${r + 24} 0 0 1 ${fx + r + 8} ${y - 6}`, 10, color);
  }
  s += wheel(rx, y, r, { spokes: !folding, knobby: mtb, fat: cargo });
  s += wheel(fx, y, r, { spokes: !folding, knobby: mtb, fat: cargo });

  // frame
  if (style === 'bike-stepthru') {
    s += tube(`M ${headBot.x} ${headBot.y} C ${headBot.x - 140} ${headBot.y + 140}, ${bbX + 60} ${bbY - 20}, ${bbX} ${bbY}`, 24);
  } else if (folding) {
    s += tube(`M ${headBot.x} ${headBot.y} L ${bbX - 10} ${bbY - 110} L ${bbX} ${bbY}`, 30);
    s += `<circle cx="${(headBot.x + bbX) / 2}" cy="${(headBot.y + bbY - 110) / 2}" r="18" fill="${VOLT}" stroke="${INK}" stroke-width="6"/>`;
  } else {
    s += tube(`M ${seatTop.x + 10} ${seatTop.y + (mtb ? 40 : 10)} L ${headTop.x} ${headTop.y + 10}`, 18); // top tube
    s += tube(`M ${bbX} ${bbY} L ${headBot.x} ${headBot.y}`, 22); // down tube
  }
  s += tube(`M ${bbX} ${bbY} L ${seatTop.x} ${seatTop.y}`, 18); // seat tube
  s += tube(`M ${bbX} ${bbY} L ${rx} ${y}`, 14); // chain stay
  s += tube(`M ${seatTop.x + 6} ${seatTop.y + 30} L ${rx} ${y}`, 14); // seat stay
  s += tube(`M ${headTop.x} ${headTop.y} L ${headBot.x} ${headBot.y}`, 24);
  s += tube(`M ${headBot.x} ${headBot.y} L ${fx} ${y}`, mtb ? 26 : 16); // fork
  if (mtb) s += spring(headBot.x + 18, headBot.y + 30, fx - 20, y - 80);

  // battery on the down tube (or rear rack for step-thru/cargo)
  const bx1 = bbX + (headBot.x - bbX) * 0.18;
  const by1 = bbY + (headBot.y - bbY) * 0.18;
  const bx2 = bbX + (headBot.x - bbX) * 0.7;
  const by2 = bbY + (headBot.y - bbY) * 0.7;
  if (style !== 'bike-stepthru' && !folding) s += tube(`M ${bx1} ${by1} L ${bx2} ${by2}`, 44, color) + tube(`M ${bx1 + 10} ${by1 - 6} L ${bx1 + 40} ${by1 - 22}`, 10, VOLT);
  if (folding) s += `<rect x="${seatTop.x - 30}" y="${seatTop.y + 40}" width="60" height="150" rx="16" fill="${color}" stroke="${INK}" stroke-width="8" transform="rotate(-14 ${seatTop.x} ${seatTop.y + 115})"/>`;

  // seat post + saddle, stem + bars
  const saddleY = seatTop.y - (folding ? 120 : 50);
  s += tube(`M ${seatTop.x} ${seatTop.y} L ${seatTop.x - 14} ${saddleY}`, 14);
  s += `<path d="M ${seatTop.x - 90} ${saddleY - 4} Q ${seatTop.x - 20} ${saddleY - 34} ${seatTop.x + 50} ${saddleY - 10} L ${seatTop.x + 46} ${saddleY + 10} Q ${seatTop.x - 20} ${saddleY - 2} ${seatTop.x - 86} ${saddleY + 14} Z" fill="${INK}"/>`;
  const barY = headTop.y - (folding ? 150 : style === 'bike-stepthru' || style === 'bike-city' ? 90 : 55);
  s += tube(`M ${headTop.x} ${headTop.y} L ${headTop.x - 18} ${barY}`, 16);
  s += mtb
    ? tube(`M ${headTop.x - 90} ${barY + 6} L ${headTop.x + 60} ${barY - 6}`, 14)
    : tube(`M ${headTop.x - 18} ${barY} Q ${headTop.x - 110} ${barY - 10} ${headTop.x - 120} ${barY + 40}`, 14);
  s += `<circle cx="${headTop.x + 20}" cy="${headTop.y + 30}" r="15" fill="#fef9c3" stroke="${INK}" stroke-width="6"/>`;

  // drivetrain: chainring + chain (or belt)
  s += `<circle cx="${bbX}" cy="${bbY}" r="34" fill="#e2e8f0" stroke="${INK}" stroke-width="8"/>`;
  s += tube(`M ${bbX} ${bbY - 30} L ${rx} ${y - 18} M ${bbX} ${bbY + 30} L ${rx} ${y + 18}`, style === 'bike-belt' ? 8 : 5, style === 'bike-belt' ? '#475569' : '#64748b');
  s += tube(`M ${bbX} ${bbY} L ${bbX + 40} ${bbY + 70}`, 10);
  s += `<rect x="${bbX + 18}" y="${bbY + 64}" width="50" height="14" rx="4" fill="${INK}"/>`;
  s += `<circle cx="${rx}" cy="${y}" r="28" fill="${VOLT}" stroke="${INK}" stroke-width="6"/>`; // hub motor

  if (style === 'bike-stepthru') {
    s += `<rect x="${rx - 40}" y="${seatTop.y + 40}" width="230" height="50" rx="14" fill="${color}" stroke="${INK}" stroke-width="8"/>`; // rack battery
    s += `<path d="M ${headTop.x + 10} ${headTop.y - 50} h 120 l -16 100 h -88 Z" fill="none" stroke="${INK}" stroke-width="10" stroke-linejoin="round"/>`; // basket
  }
  if (style === 'bike-city' || style === 'bike-belt') {
    s += tube(`M ${rx - 70} ${seatTop.y + 60} L ${seatTop.x - 30} ${seatTop.y + 60} M ${rx - 40} ${seatTop.y + 60} L ${rx} ${y - 20}`, 10);
  }
  if (cargo) {
    s += `<rect x="${rx - 120}" y="${seatTop.y + 50}" width="${seatTop.x - rx + 120}" height="34" rx="10" fill="${color}" stroke="${INK}" stroke-width="8"/>`;
    s += tube(`M ${rx - 100} ${seatTop.y + 84} L ${rx - 60} ${y - 10} M ${seatTop.x - 40} ${seatTop.y + 84} L ${rx + 40} ${y - 30}`, 10);
    s += `<rect x="${rx - 110}" y="${seatTop.y - 40}" width="190" height="90" rx="10" fill="#fde68a" stroke="${INK}" stroke-width="8"/>`; // crate
  }
  return s;
}

function skyline() {
  const blocks = [
    [40, 520, 90, 400], [150, 600, 70, 320], [235, 470, 110, 450], [360, 560, 80, 360], [455, 430, 70, 490],
    [540, 590, 120, 330], [990, 500, 90, 420], [1095, 420, 75, 500], [1185, 560, 100, 360], [1300, 480, 80, 440],
  ];
  return blocks.map(([x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="#b9d8c4" opacity="0.65"/>`).join('')
    + `<rect x="0" y="880" width="1400" height="170" fill="#9fb8ad"/><rect x="0" y="872" width="1400" height="14" fill="#ffffff" opacity="0.6"/>`
    + Array.from({ length: 9 }, (_, i) => `<rect x="${i * 170 + 30}" y="950" width="90" height="10" rx="5" fill="#ffffff" opacity="0.7"/>`).join('');
}

export function productSvg(style: ArtStyle, color: string, scene: 'studio' | 'street'): string {
  const art = style.startsWith('scooter') ? scooter(style, color) : bike(style, color);
  const bg = scene === 'studio'
    ? `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4faf5"/><stop offset="1" stop-color="#d6ecdc"/></linearGradient>
         <radialGradient id="sh" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="${INK}" stop-opacity="0.22"/><stop offset="1" stop-color="${INK}" stop-opacity="0"/></radialGradient></defs>
       <rect width="1400" height="1050" fill="url(#g)"/>
       <circle cx="1170" cy="200" r="250" fill="${color}" opacity="0.12"/><circle cx="160" cy="900" r="190" fill="${VOLT}" opacity="0.25"/>
       <ellipse cx="700" cy="880" rx="560" ry="34" fill="url(#sh)"/>`
    : `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dff3ff"/><stop offset="1" stop-color="#f3fbef"/></linearGradient></defs>
       <rect width="1400" height="1050" fill="url(#sky)"/><circle cx="1180" cy="170" r="80" fill="#fde68a" opacity="0.9"/>${skyline()}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="1050" viewBox="0 0 1400 1050">${bg}<g>${art}</g></svg>`;
}

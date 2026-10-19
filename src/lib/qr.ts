/**
 * A small QR code generator (byte mode, error correction level M, versions 1–10, up to 213 bytes).
 * Enough for a UPI payment link. No dependencies, so it works on the server and in the browser.
 */

// [total codewords, EC codewords per block, blocks of size A, data per block A, blocks of size B, data per block B]
const VERSIONS: [number, number, number, number, number, number][] = [
  [26, 10, 1, 16, 0, 0], [44, 16, 1, 28, 0, 0], [70, 26, 1, 44, 0, 0], [100, 18, 2, 32, 0, 0], [134, 24, 2, 43, 0, 0],
  [172, 16, 4, 27, 0, 0], [196, 18, 4, 31, 0, 0], [242, 22, 2, 38, 2, 39], [292, 22, 3, 36, 2, 37], [346, 26, 4, 43, 1, 44],
];
const ALIGNMENT: number[][] = [[], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]];

const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
(() => {
  let value = 1;
  for (let i = 0; i < 255; i++) { EXP[i] = value; LOG[value] = i; value <<= 1; if (value & 0x100) value ^= 0x11d; }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
})();
const multiply = (a: number, b: number) => (a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]]);

function reedSolomon(data: number[], ecLength: number) {
  let generator = [1];
  for (let i = 0; i < ecLength; i++) {
    const next = new Array(generator.length + 1).fill(0);
    for (let j = 0; j < generator.length; j++) { next[j] ^= generator[j]; next[j + 1] ^= multiply(generator[j], EXP[i]); }
    generator = next;
  }
  const result = new Array(ecLength).fill(0);
  for (const byte of data) {
    const factor = byte ^ result[0];
    result.shift(); result.push(0);
    for (let i = 0; i < ecLength; i++) result[i] ^= multiply(generator[i + 1], factor);
  }
  return result;
}

function encodeData(bytes: number[], version: number) {
  const [total, ecPer, blocksA, dataA, blocksB, dataB] = VERSIONS[version - 1];
  const dataCodewords = blocksA * dataA + blocksB * dataB;
  const bits: number[] = [];
  const push = (value: number, length: number) => { for (let i = length - 1; i >= 0; i--) bits.push((value >>> i) & 1); };
  push(0b0100, 4);
  push(bytes.length, version >= 10 ? 16 : 8);
  for (const byte of bytes) push(byte, 8);
  push(0, Math.min(4, dataCodewords * 8 - bits.length));
  while (bits.length % 8) bits.push(0);
  const codewords: number[] = [];
  for (let i = 0; i < bits.length; i += 8) codewords.push(parseInt(bits.slice(i, i + 8).join(""), 2));
  for (let pad = 0xec; codewords.length < dataCodewords; pad = pad === 0xec ? 0x11 : 0xec) codewords.push(pad);

  const blocks: { data: number[]; ec: number[] }[] = [];
  let offset = 0;
  for (let b = 0; b < blocksA + blocksB; b++) {
    const size = b < blocksA ? dataA : dataB;
    const data = codewords.slice(offset, offset + size);
    offset += size;
    blocks.push({ data, ec: reedSolomon(data, ecPer) });
  }
  const out: number[] = [];
  const longest = Math.max(dataA, dataB);
  for (let i = 0; i < longest; i++) for (const block of blocks) if (i < block.data.length) out.push(block.data[i]);
  for (let i = 0; i < ecPer; i++) for (const block of blocks) out.push(block.ec[i]);
  if (out.length !== total) throw new Error("QR layout error");
  return out;
}

function bchFormat(data: number) {
  let rem = data << 10;
  for (let i = 14; i >= 10; i--) if ((rem >>> i) & 1) rem ^= 0x537 << (i - 10);
  return ((data << 10) | rem) ^ 0x5412;
}
function bchVersion(version: number) {
  let rem = version << 12;
  for (let i = 17; i >= 12; i--) if ((rem >>> i) & 1) rem ^= 0x1f25 << (i - 12);
  return (version << 12) | rem;
}

const MASKS: ((r: number, c: number) => boolean)[] = [
  (r, c) => (r + c) % 2 === 0, (r) => r % 2 === 0, (_r, c) => c % 3 === 0, (r, c) => (r + c) % 3 === 0,
  (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0, (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
  (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0, (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
];

function penalty(m: boolean[][]) {
  const n = m.length;
  let score = 0;
  for (let pass = 0; pass < 2; pass++) {
    for (let a = 0; a < n; a++) {
      let run = 1;
      for (let b = 1; b < n; b++) {
        const same = (pass ? m[b][a] : m[a][b]) === (pass ? m[b - 1][a] : m[a][b - 1]);
        if (same) { run++; if (run === 5) score += 3; else if (run > 5) score += 1; } else run = 1;
      }
    }
  }
  for (let r = 0; r < n - 1; r++) for (let c = 0; c < n - 1; c++) if (m[r][c] === m[r][c + 1] && m[r][c] === m[r + 1][c] && m[r][c] === m[r + 1][c + 1]) score += 3;
  const pattern = [true, false, true, true, true, false, true, false, false, false, false];
  const reversed = [...pattern].reverse();
  for (let pass = 0; pass < 2; pass++) for (let a = 0; a < n; a++) for (let b = 0; b <= n - 11; b++) {
    let p1 = true, p2 = true;
    for (let k = 0; k < 11; k++) { const v = pass ? m[b + k][a] : m[a][b + k]; if (v !== pattern[k]) p1 = false; if (v !== reversed[k]) p2 = false; }
    if (p1) score += 40;
    if (p2) score += 40;
  }
  let dark = 0;
  for (const row of m) for (const cell of row) if (cell) dark++;
  score += Math.floor(Math.abs((dark * 100) / (n * n) - 50) / 5) * 10;
  return score;
}

/** Returns the QR code as rows of booleans (true = dark module), without the quiet zone. */
export function qrMatrix(text: string, forceMask?: number): boolean[][] {
  const bytes = Array.from(new TextEncoder().encode(text));
  let version = 0;
  for (let v = 1; v <= 10; v++) {
    const [, , blocksA, dataA, blocksB, dataB] = VERSIONS[v - 1];
    if (bytes.length + (v >= 10 ? 3 : 2) <= blocksA * dataA + blocksB * dataB) { version = v; break; }
  }
  if (!version) throw new Error("Text is too long for this QR code.");
  const size = 17 + 4 * version;
  const codewords = encodeData(bytes, version);

  const modules: boolean[][] = Array.from({ length: size }, () => new Array(size).fill(false));
  const reserved: boolean[][] = Array.from({ length: size }, () => new Array(size).fill(false));
  const set = (r: number, c: number, dark: boolean, fixed = true) => { if (r < 0 || c < 0 || r >= size || c >= size) return; modules[r][c] = dark; if (fixed) reserved[r][c] = true; };

  const finder = (r0: number, c0: number) => {
    for (let r = -1; r <= 7; r++) for (let c = -1; c <= 7; c++) {
      const edge = r === -1 || r === 7 || c === -1 || c === 7;
      const ring = r === 0 || r === 6 || c === 0 || c === 6;
      const core = r >= 2 && r <= 4 && c >= 2 && c <= 4;
      set(r0 + r, c0 + c, !edge && (ring || core));
    }
  };
  finder(0, 0); finder(0, size - 7); finder(size - 7, 0);
  for (let i = 8; i < size - 8; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
  const positions = ALIGNMENT[version - 1];
  for (const r of positions) for (const c of positions) {
    if ((r === 6 && c === 6) || (r === 6 && c === positions[positions.length - 1]) || (c === 6 && r === positions[positions.length - 1])) continue;
    for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) set(r + dr, c + dc, Math.max(Math.abs(dr), Math.abs(dc)) !== 1);
  }
  // Reserve the format areas (filled in per mask) and the version blocks.
  for (let i = 0; i < 9; i++) { if (i === 6) continue; set(8, i, false); set(i, 8, false); }
  for (let i = 0; i < 8; i++) { set(8, size - 1 - i, false); set(size - 1 - i, 8, false); }
  set(size - 8, 8, true);
  if (version >= 7) {
    const info = bchVersion(version);
    for (let i = 0; i < 18; i++) {
      const dark = ((info >>> i) & 1) === 1;
      const a = Math.floor(i / 3), b = (i % 3) + size - 11;
      set(a, b, dark); set(b, a, dark);
    }
  }

  // Place the data bits in the zig-zag order.
  const bits: boolean[] = [];
  for (const byte of codewords) for (let i = 7; i >= 0; i--) bits.push(((byte >>> i) & 1) === 1);
  let index = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vertical = 0; vertical < size; vertical++) {
      for (let j = 0; j < 2; j++) {
        const c = right - j;
        const upward = ((right + 1) & 2) === 0;
        const r = upward ? size - 1 - vertical : vertical;
        if (reserved[r][c]) continue;
        modules[r][c] = index < bits.length ? bits[index] : false;
        index++;
      }
    }
  }

  let best: boolean[][] | null = null;
  let bestScore = Infinity;
  for (let mask = 0; mask < 8; mask++) {
    if (forceMask !== undefined && mask !== forceMask) continue;
    const candidate = modules.map((row) => row.slice());
    for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (!reserved[r][c] && MASKS[mask](r, c)) candidate[r][c] = !candidate[r][c];
    const format = bchFormat((0b00 << 3) | mask); // error correction level M = 00
    const bit = (i: number) => ((format >>> i) & 1) === 1;
    for (let i = 0; i <= 5; i++) candidate[i][8] = bit(i);
    candidate[7][8] = bit(6); candidate[8][8] = bit(7); candidate[8][7] = bit(8);
    for (let i = 9; i < 15; i++) candidate[8][14 - i] = bit(i);
    for (let i = 0; i < 8; i++) candidate[8][size - 1 - i] = bit(i);
    for (let i = 8; i < 15; i++) candidate[size - 15 + i][8] = bit(i);
    candidate[size - 8][8] = true;
    const score = penalty(candidate);
    if (score < bestScore) { bestScore = score; best = candidate; }
  }
  return best!;
}

/** The QR code as an SVG string (includes the 4-module quiet zone). */
export function qrSvg(text: string, options: { size?: number; dark?: string; light?: string } = {}) {
  const matrix = qrMatrix(text);
  const quiet = 4;
  const side = matrix.length + quiet * 2;
  let path = "";
  matrix.forEach((row, r) => { let start = -1; row.forEach((cell, c) => {
    if (cell && start < 0) start = c;
    if ((!cell || c === row.length - 1) && start >= 0) { const end = cell ? c + 1 : c; path += `M${start + quiet} ${r + quiet}h${end - start}v1h-${end - start}z`; start = -1; }
  }); });
  const px = options.size ?? 240;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${side} ${side}" width="${px}" height="${px}" shape-rendering="crispEdges" role="img"><rect width="${side}" height="${side}" fill="${options.light ?? "#fff"}"/><path d="${path}" fill="${options.dark ?? "#000"}"/></svg>`;
}

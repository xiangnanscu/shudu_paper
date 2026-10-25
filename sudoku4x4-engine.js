'use strict';
/**
 * 四宫格（4×4，2×2 宫）试题类引擎
 *
 * 做了什么
 *   1. 枚举全部 288 个 4×4 终盘；
 *   2. 用对称群（数字重命名 24 × 行/列/带重排与转置 128 = 3072）把"有唯一解的题"
 *      归并为等价类，共 4710 类（原始唯一解题共 13,579,680 道）；
 *   3. 对每一类计算两套"工作量"（见下），并给出一道代表题和它的解；
 *   4. instantiate(类) 随机施加一个对称变换，生成该类的一道具体试题。
 *
 * 两套工作量（同一道题在两种求解者模型下的代价）
 *   naked  只会"唯余法"（一个格子只剩一个候选数）的求解者
 *   full   同时会"唯余法 + 摒除法"（一个数在一个单元里只剩一个位置）的求解者
 *
 *   求解按"轮"进行：每轮把盘面扫一遍，把此刻就能确定的所有格一起填上，再扫下一遍。
 *   第 r 轮空格数为 N、能确定的格数为 n，则该轮代价 = n × (1 + ln(N / n))，
 *   工作量 = 各轮代价之和。n 越小（要找的格子越少），每一步越难找。
 *   这是理想化模型，与填格顺序无关；是否贴近真人体感需要用解题数据校准。
 *
 * 对象字段（均可直接入库）
 *   id            1..4710，按代表题字符串升序，稳定不变
 *   puzzle        代表题，16 位字符串，行优先，'0' 表示空格
 *   solution      对应的唯一解，16 位字符串
 *   givens/blanks 给定数个数 / 空格数
 *   variants      该类能生成的不同试题数（≤ 3072）
 *   workloadNaked, roundsNaked, widthsNaked   唯余法模型：工作量 / 轮数 / 每轮填格数
 *   workloadFull,  roundsFull,  widthsFull    唯余+摒除模型：同上
 *
 * 注意：blanks = 0 的 2 个类是完整盘面（没有可做的题），组卷时请用 blanks > 0 过滤。
 *
 * 用法
 *   node sudoku4x4-engine.js --out classes.json [--csv classes.csv] [--verify]
 *   const { buildClasses, instantiate } = require('./sudoku4x4-engine');
 */

// ---------------------------------------------------------------- 几何
const UNITS = (() => {
  const u = [];
  for (let r = 0; r < 4; r++) u.push([0, 1, 2, 3].map((c) => r * 4 + c));
  for (let c = 0; c < 4; c++) u.push([0, 1, 2, 3].map((r) => r * 4 + c));
  for (let b = 0; b < 4; b++) {
    const br = (b >> 1) * 2;
    const bc = (b & 1) * 2;
    u.push([[0, 0], [0, 1], [1, 0], [1, 1]].map(([dr, dc]) => (br + dr) * 4 + bc + dc));
  }
  return u;
})();

const PEERS = (() => {
  const p = Array.from({ length: 16 }, () => new Set());
  for (const u of UNITS) for (const i of u) for (const j of u) if (i !== j) p[i].add(j);
  return p.map((s) => [...s]);
})();

function permutations(arr) {
  if (arr.length <= 1) return [arr.slice()];
  const out = [];
  arr.forEach((x, i) => {
    const rest = arr.slice(0, i).concat(arr.slice(i + 1));
    for (const p of permutations(rest)) out.push([x, ...p]);
  });
  return out;
}

/** 128 个格子位置变换：行重排(8) × 列重排(8) × 转置(2)；行重排只在带内换行或整带互换 */
const CELL_MAPS = (() => {
  const perms = permutations([0, 1, 2, 3]).filter(
    (p) => (p[0] >> 1) === (p[1] >> 1) && (p[2] >> 1) === (p[3] >> 1)
  );
  const maps = [];
  for (const rp of perms) {
    for (const cp of perms) {
      for (const t of [0, 1]) {
        const m = new Array(16);
        for (let i = 0; i < 16; i++) {
          let nr = rp[i >> 2];
          let nc = cp[i & 3];
          if (t) [nr, nc] = [nc, nr];
          m[i] = nr * 4 + nc;
        }
        maps.push(m);
      }
    }
  }
  return maps;
})();

/** 24 个数字重命名：dp[d-1] 为数字 d 的新名字 */
const DIGIT_PERMS = permutations([1, 2, 3, 4]);

// ---------------------------------------------------------------- 终盘与求解
function enumerateSolutions() {
  const sols = [];
  const g = new Array(16).fill(0);
  const rec = (i) => {
    if (i === 16) { sols.push(g.slice()); return; }
    for (let d = 1; d <= 4; d++) {
      if (PEERS[i].every((j) => g[j] !== d)) { g[i] = d; rec(i + 1); g[i] = 0; }
    }
  };
  rec(0);
  return sols;
}

/** 回溯求解，最多数到 limit 个解；返回 { count, first } */
function solve(puzzle, limit = 2) {
  const g = Array.from(puzzle, Number);
  let count = 0;
  let first = null;
  const rec = () => {
    if (count >= limit) return;
    let best = -1;
    let bestMask = 0;
    let bestN = 5;
    for (let i = 0; i < 16; i++) {
      if (g[i]) continue;
      let seen = 0;
      for (const j of PEERS[i]) if (g[j]) seen |= 1 << (g[j] - 1);
      const free = 15 & ~seen;
      const n = popcount(free);
      if (n < bestN) { bestN = n; best = i; bestMask = free; if (n === 0) return; }
    }
    if (best < 0) { count++; if (!first) first = g.join(''); return; }
    for (let d = 0; d < 4; d++) {
      if (bestMask >> d & 1) { g[best] = d + 1; rec(); g[best] = 0; }
    }
  };
  rec();
  return { count, first };
}

function popcount(x) { x -= (x >> 1) & 0x5; return (x & 0x3) + ((x >> 2) & 0x3); } // 仅用于 4 位

// ---------------------------------------------------------------- 规范形（类的名字）
/**
 * 对 16 位数组 p（0 表示空）求规范形：
 * 对每个位置变换，把数字按首次出现顺序重新编号，取字典序最小者。
 * 返回 { key, digits }，key 为按 5 进制解释的整数（字典序 == 数值序）。
 */
function canonical(p) {
  let bestKey = Infinity;
  let bestDigits = null;
  const base = new Array(16);
  const out = new Array(16);
  for (let k = 0; k < CELL_MAPS.length; k++) {
    const m = CELL_MAPS[k];
    for (let i = 0; i < 16; i++) base[m[i]] = p[i];
    const nm = [0, 0, 0, 0, 0];
    let next = 1;
    let key = 0;
    for (let i = 0; i < 16; i++) {
      let d = base[i];
      if (d) { if (!nm[d]) nm[d] = next++; d = nm[d]; }
      out[i] = d;
      key = key * 5 + d;
    }
    if (key < bestKey) { bestKey = key; bestDigits = out.slice(); }
  }
  return { key: bestKey, digits: bestDigits };
}

// ---------------------------------------------------------------- 两套工作量
/**
 * mode: 'naked' 只用唯余法；'full' 唯余 + 摒除
 * 返回 { widths, rounds, workload }
 */
function profile(puzzleDigits, mode) {
  const cand = new Array(16).fill(15);
  const placed = new Array(16).fill(false);
  const place = (i, d) => {
    const bit = 1 << (d - 1);
    if (!(cand[i] & bit)) throw new Error('inconsistent puzzle');
    cand[i] = bit;
    placed[i] = true;
    for (const j of PEERS[i]) cand[j] &= ~bit;
  };
  for (let i = 0; i < 16; i++) if (puzzleDigits[i]) place(i, puzzleDigits[i]);

  let remaining = placed.filter((x) => !x).length;
  const widths = [];
  let cost = 0;
  while (remaining > 0) {
    const moves = new Map();
    for (let i = 0; i < 16; i++) {
      if (!placed[i] && popcount(cand[i]) === 1) moves.set(i, Math.log2(cand[i]) + 1);
    }
    if (mode === 'full') {
      for (const u of UNITS) {
        for (let d = 0; d < 4; d++) {
          let cnt = 0;
          let last = -1;
          for (const i of u) if (cand[i] >> d & 1) { cnt++; last = i; }
          if (cnt === 1 && !placed[last] && !moves.has(last)) moves.set(last, d + 1);
        }
      }
    }
    if (moves.size === 0) throw new Error('stuck: needs a technique beyond singles');
    const n = moves.size;
    cost += n * (1 + Math.log(remaining / n));
    widths.push(n);
    for (const [i, d] of moves) place(i, d);
    remaining -= n;
  }
  return { widths, rounds: widths.length, workload: Math.round(cost * 1e4) / 1e4 };
}

// ---------------------------------------------------------------- 构建全部类
function buildClasses() {
  const sols = enumerateSolutions(); // 288

  // 1) 终盘按对称等价分组，每组取一个代表（共 2 组，大小 96 与 192）
  const solGroups = new Map();
  for (const s of sols) {
    const { key } = canonical(s);
    if (!solGroups.has(key)) solGroups.set(key, []);
    solGroups.get(key).push(s);
  }
  const reps = [...solGroups.values()].map((v) => v[0]);

  // 2) 每个代表终盘：枚举其全部"唯一解"的给定子集
  const classKeys = new Map(); // key -> digits
  for (const s of reps) {
    const maskSet = new Set();
    for (const t of sols) {
      if (t === s) continue;
      let am = 0;
      for (let i = 0; i < 16; i++) if (t[i] === s[i]) am |= 1 << i;
      maskSet.add(am);
    }
    const all = [...maskSet];
    const maximal = all.filter((a) => !all.some((b) => b !== a && (a & ~b) === 0));
    const p = new Array(16);
    for (let M = 0; M < 65536; M++) {
      let unique = true;
      for (const am of maximal) if ((M & ~am) === 0) { unique = false; break; }
      if (!unique) continue;
      for (let i = 0; i < 16; i++) p[i] = (M >> i & 1) ? s[i] : 0;
      const { key, digits } = canonical(p);
      if (!classKeys.has(key)) classKeys.set(key, digits);
    }
  }

  // 3) 稳定排序 + 计算各属性
  const keys = [...classKeys.keys()].sort((a, b) => a - b);
  const GROUP_ORDER = CELL_MAPS.length * DIGIT_PERMS.length; // 3072
  return keys.map((key, idx) => {
    const digits = classKeys.get(key);
    const puzzle = digits.join('');
    const sol = solve(puzzle, 2);
    if (sol.count !== 1) throw new Error('class representative is not unique: ' + puzzle);
    const naked = profile(digits, 'naked');
    const full = profile(digits, 'full');
    const givens = digits.filter(Boolean).length;
    return {
      id: idx + 1,
      puzzle,
      solution: sol.first,
      givens,
      blanks: 16 - givens,
      variants: GROUP_ORDER / stabilizerSize(digits),
      workloadNaked: naked.workload,
      roundsNaked: naked.rounds,
      widthsNaked: naked.widths,
      workloadFull: full.workload,
      roundsFull: full.rounds,
      widthsFull: full.widths,
    };
  });
}

/** 使题目保持不变的（位置变换, 数字重命名）对数，用轨道-稳定子定理得到变体数 */
function stabilizerSize(p) {
  let count = 0;
  const base = new Array(16);
  for (const m of CELL_MAPS) {
    for (let i = 0; i < 16; i++) base[m[i]] = p[i];
    for (const dp of DIGIT_PERMS) {
      let same = true;
      for (let i = 0; i < 16; i++) {
        const q = base[i] ? dp[base[i] - 1] : 0;
        if (q !== p[i]) { same = false; break; }
      }
      if (same) count++;
    }
  }
  return count;
}

// ---------------------------------------------------------------- 由类生成试题
/** 可复现的随机数：mulberry32(seed) 返回 () => [0,1) */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function transform(str, m, dp) {
  const out = new Array(16);
  for (let i = 0; i < 16; i++) {
    const d = str.charCodeAt(i) - 48;
    out[m[i]] = d ? dp[d - 1] : 0;
  }
  return out.join('');
}

/**
 * 由类对象生成一道具体试题：在 3072 个对称变换里均匀随机取一个。
 * 同一类的所有试题难度（两套工作量）相同。
 */
function instantiate(cls, rng = Math.random) {
  const m = CELL_MAPS[Math.floor(rng() * CELL_MAPS.length)];
  const dp = DIGIT_PERMS[Math.floor(rng() * DIGIT_PERMS.length)];
  return {
    classId: cls.id,
    puzzle: transform(cls.puzzle, m, dp),
    solution: transform(cls.solution, m, dp),
  };
}

// ---------------------------------------------------------------- 自检
function verify(classes, { samplePerClass = 3 } = {}) {
  const fail = (msg) => { throw new Error('VERIFY FAILED: ' + msg); };
  if (classes.length !== 4710) fail('class count ' + classes.length);
  const sumVariants = classes.reduce((a, c) => a + c.variants, 0);
  if (sumVariants !== 13579680) fail('variant sum ' + sumVariants);
  if (new Set(classes.map((c) => c.puzzle)).size !== classes.length) fail('duplicate puzzles');
  const rng = mulberry32(20261025);
  for (const c of classes) {
    const dg = Array.from(c.puzzle, Number);
    if (canonical(dg).digits.join('') !== c.puzzle) fail('not canonical: ' + c.puzzle);
    const s = solve(c.puzzle, 2);
    if (s.count !== 1 || s.first !== c.solution) fail('solution mismatch: ' + c.puzzle);
    for (let k = 0; k < samplePerClass; k++) {
      const q = instantiate(c, rng);
      const r = solve(q.puzzle, 2);
      if (r.count !== 1 || r.first !== q.solution) fail('variant not unique: ' + q.puzzle);
      const qd = Array.from(q.puzzle, Number);
      if (profile(qd, 'naked').workload !== c.workloadNaked) fail('naked workload not invariant');
      if (profile(qd, 'full').workload !== c.workloadFull) fail('full workload not invariant');
    }
  }
  return { classes: classes.length, sumVariants };
}

// ---------------------------------------------------------------- 导出 / CLI
function toCsv(classes) {
  const cols = [
    'id', 'puzzle', 'solution', 'givens', 'blanks', 'variants',
    'workloadNaked', 'roundsNaked', 'widthsNaked', 'workloadFull', 'roundsFull', 'widthsFull',
  ];
  const cell = (v) => (Array.isArray(v) ? '"' + JSON.stringify(v) + '"' : String(v));
  return [cols.join(',')].concat(classes.map((c) => cols.map((k) => cell(c[k])).join(','))).join('\n') + '\n';
}

module.exports = { buildClasses, instantiate, verify, mulberry32, toCsv, solve, profile, CELL_MAPS, DIGIT_PERMS };

if (require.main === module) {
  const fs = require('fs');
  const args = process.argv.slice(2);
  const arg = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
  const t0 = Date.now();
  const classes = buildClasses();
  console.log(`built ${classes.length} classes in ${Date.now() - t0} ms`);
  if (args.includes('--verify')) console.log('verify ok:', verify(classes));
  const out = arg('--out');
  if (out) { fs.writeFileSync(out, JSON.stringify(classes)); console.log('wrote', out); }
  const csv = arg('--csv');
  if (csv) { fs.writeFileSync(csv, toCsv(classes)); console.log('wrote', csv); }
}

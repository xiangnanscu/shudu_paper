'use strict';
/**
 * 预构建四宫格数独等价类题库脚本
 * 运行方式: node scripts/generate-classes.js
 */
const fs = require('fs');
const path = require('path');
const { buildClasses } = require('../sudoku4x4-engine');

console.log('Generating sudoku classes from mathematical engine...');
const t0 = Date.now();
const classes = buildClasses().filter((c) => c.blanks > 0);
console.log(`Built ${classes.length} valid classes in ${Date.now() - t0} ms`);

const easy = [];
const medium = [];
const hard = [];

for (const c of classes) {
  // [id, puzzle, solution, workloadNaked, blanks, roundsNaked]
  const item = [
    c.id,
    c.puzzle,
    c.solution,
    c.workloadNaked,
    c.blanks,
    c.roundsNaked,
  ];
  if (c.workloadNaked < 8.0) {
    easy.push(item);
  } else if (c.workloadNaked < 11.0) {
    medium.push(item);
  } else {
    hard.push(item);
  }
}

console.log(`Partitioned by workloadNaked:`);
console.log(`  Easy   (< 8.0):       ${easy.length} classes`);
console.log(`  Medium (8.0 ~ 11.0):  ${medium.length} classes`);
console.log(`  Hard   (>= 11.0):     ${hard.length} classes`);

const outPath = path.resolve(__dirname, '../frontend/src/core/sudoku-classes.json');
fs.writeFileSync(outPath, JSON.stringify({ easy, medium, hard }));
const sizeKb = (fs.statSync(outPath).size / 1024).toFixed(1);
console.log(`Successfully wrote ${outPath} (${sizeKb} KB)`);

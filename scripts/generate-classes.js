'use strict';
/**
 * 预构建四宫格数独等价类 CSV 题库脚本
 * 运行方式: node scripts/generate-classes.js
 */
const fs = require('fs');
const path = require('path');
const { buildClasses } = require('../sudoku4x4-engine');

console.log('Generating sudoku classes from mathematical engine...');
const t0 = Date.now();
const classes = buildClasses().filter((c) => c.blanks > 0);
console.log(`Built ${classes.length} valid classes in ${Date.now() - t0} ms`);

// 按 workloadNaked 升序排列；若工作量相同按 puzzle 字符串排序保证绝对稳定
classes.sort((a, b) => {
  if (a.workloadNaked !== b.workloadNaked) {
    return a.workloadNaked - b.workloadNaked;
  }
  return a.puzzle.localeCompare(b.puzzle);
});

console.log('Workload range:');
console.log(`  Min: ${classes[0].workloadNaked} (puzzle: ${classes[0].puzzle})`);
console.log(`  Max: ${classes[classes.length - 1].workloadNaked} (puzzle: ${classes[classes.length - 1].puzzle})`);

// 按 CSV 保存原始表格数据：puzzle,solution,workloadNaked
const rows = ['puzzle,solution,workloadNaked'];
for (const c of classes) {
  rows.push(`${c.puzzle},${c.solution},${c.workloadNaked}`);
}
const csvContent = rows.join('\n') + '\n';

const outPath = path.resolve(__dirname, '../frontend/src/core/sudoku-classes.csv');
fs.writeFileSync(outPath, csvContent, 'utf8');
const sizeKb = (fs.statSync(outPath).size / 1024).toFixed(1);
console.log(`Successfully wrote ${outPath} (${sizeKb} KB, ${classes.length} rows)`);

// 清理旧的 json 文件
const oldJsonPath = path.resolve(__dirname, '../frontend/src/core/sudoku-classes.json');
if (fs.existsSync(oldJsonPath)) {
  fs.unlinkSync(oldJsonPath);
  console.log(`Removed obsolete file: ${oldJsonPath}`);
}

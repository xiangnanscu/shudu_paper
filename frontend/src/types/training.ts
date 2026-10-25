import type { Grid4x4, SymbolType } from "./sudoku";

/**
 * 训练技巧分类
 * - naked_single: 唯余法 (单元格唯一可能数 / 观察格子 peers 排除其他数)
 * - hidden_single: 摒除法 (区域内数字唯一位置 / 外部激光封锁其他空格)
 */
export type TrainingTechnique = "naked_single" | "hidden_single";

/**
 * 训练模式：
 * - naked: 唯余专项训练
 * - hidden: 摒除专项训练
 * - mixed: 综合随机实战
 */
export type TrainingMode = "naked" | "hidden" | "mixed";

/**
 * 提示分级数据结构
 */
export interface TrainingHintStep {
  level: 1 | 2 | 3; // 1: 轻度思路点拨, 2: 视觉雷达/激光全开, 3: 揭晓真相与推导
  title: string;
  description: string;
}

/**
 * 摒除激光射线定义
 */
export interface LaserBeam {
  sourceR: number;
  sourceC: number;
  val: number;
  direction: "row" | "col"; // 激光发射方向
  lineIndex: number; // 所在行或列号 (0-3)
  blockedCells: Array<{ r: number; c: number }>; // 在目标区域内被该激光切中阻挡的空格
}

/**
 * 训练题目详细模型
 */
export interface TrainingQuestion {
  id: string;
  technique: TrainingTechnique;
  puzzle: Grid4x4; // 题目盘面 (0 表示待填空格)
  solution: Grid4x4; // 完整终盘解
  targetCell: { r: number; c: number }; // 关键目标格
  targetValue: number; // 目标格正确数字 (1-4)

  // 唯余法专有分析数据
  nakedDetails?: {
    rowNumbers: number[]; // 同行已有数字 (不含0)
    colNumbers: number[]; // 同列已有数字 (不含0)
    blockNumbers: number[]; // 同宫已有数字 (不含0)
    seenNumbers: number[]; // 汇总 peers 中已经出现的数字集合 (如 [1, 2, 3])
    missingNumber: number; // 唯一缺失的数字 (即 targetValue)
  };

  // 摒除法专有分析数据
  hiddenDetails?: {
    unitType: "block" | "row" | "col"; // 目标区域类型 (最形象生动的是 2x2 宫)
    unitIndex: number; // 目标区域索引 (0-3)
    targetDigit: number; // 正在寻找安家位置的数字
    laserBeams: LaserBeam[]; // 外部发射过来的摒除激光束
    emptyCellsInUnit: Array<{ r: number; c: number }>; // 目标区域内原本所有的空格
    blockedCellsInUnit: Array<{ r: number; c: number }>; // 被激光封锁的空格列表
  };

  // 分级引导文本与说明
  hints: TrainingHintStep[];
}

/**
 * 训练连对与成就统计
 */
export interface TrainingStats {
  totalSolved: number;
  currentStreak: number;
  bestStreak: number;
  nakedSolved: number;
  hiddenSolved: number;
  stars: number;
}

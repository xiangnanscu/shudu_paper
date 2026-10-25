import type { DifficultyMode, DifficultyTier } from "../types/sudoku";

/**
 * 核心难度映射：根据难度模式与题目序号计算当前的 DifficultyTier（easy / medium / hard）
 * 依据 workloadNaked 分档标准：
 * - 简单 (easy):   workloadNaked < 8.0 (已知数约 9~15，基础唯余)
 * - 适中 (medium): 8.0 <= workloadNaked < 11.0 (已知数约 7~10，综合进阶)
 * - 困难 (hard):   workloadNaked >= 11.0 (已知数约 4~9，深度推演)
 */
export function getDifficultyTier(
  diffType: DifficultyMode,
  indexOnPage: number,
  totalOnPage: number
): DifficultyTier {
  switch (diffType) {
    case "easy":
    case "starter":
      return "easy";

    case "medium":
    case "medium_hypo_direct":
    case "medium_hypo_deep":
    case "medium_hypo_mixed":
      return "medium";

    case "hard":
      return "hard";

    case "mixed_page": {
      // 阶梯递进：整卷由浅入深，依次过渡为简单 -> 适中 -> 困难
      const ratio = totalOnPage > 1 ? indexOnPage / (totalOnPage - 1) : 0.5;
      if (ratio < 0.34) {
        return "easy";
      } else if (ratio < 0.67) {
        return "medium";
      } else {
        return "hard";
      }
    }

    case "random":
    default: {
      const tiers: DifficultyTier[] = ["easy", "medium", "hard"];
      return tiers[Math.floor(Math.random() * tiers.length)];
    }
  }
}

/**
 * 兼容保留：获取难度对应的典型已知数参考值
 */
export function getDifficultyClues(
  diffType: DifficultyMode,
  indexOnPage: number,
  totalOnPage: number
): number {
  const tier = getDifficultyTier(diffType, indexOnPage, totalOnPage);
  switch (tier) {
    case "easy":
      return [9, 10, 11, 12][Math.floor(Math.random() * 4)];
    case "medium":
      return [7, 8, 9][Math.floor(Math.random() * 3)];
    case "hard":
      return [5, 6, 7][Math.floor(Math.random() * 3)];
    default:
      return 8;
  }
}

/**
 * 判断是否属于中级假设专题难度（历史数据兼容）
 */
export function isHypothesisDifficulty(diffType: DifficultyMode): boolean {
  return (
    diffType === "medium_hypo_direct" ||
    diffType === "medium_hypo_deep" ||
    diffType === "medium_hypo_mixed"
  );
}

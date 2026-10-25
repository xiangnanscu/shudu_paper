import type { DifficultyMode, TierDivision } from "../types/sudoku";
import type { PaperConfig } from "../types/config";

export interface DifficultyOption {
  value: DifficultyMode;
  label: string;
}

export interface TierInfo {
  tierIndex: number;
  totalTiers: number;
  tierName: string;
}

/**
 * 3 档制配置元数据（默认）
 */
const TIERS_3 = [
  { value: "easy", name: "简单", label: "★ 简单 (L1 · 基础唯余)" },
  { value: "medium", name: "适中", label: "★★ 适中 (L2 · 综合进阶)" },
  { value: "hard", name: "困难", label: "★★★ 困难 (L3 · 深度推演)" },
] as const;

/**
 * 5 档制配置元数据
 */
const TIERS_5 = [
  { value: "tier_5_1", name: "入门", label: "★ 1档·入门 (起步启蒙)" },
  { value: "tier_5_2", name: "基础", label: "★★ 2档·基础 (巩固认知)" },
  { value: "tier_5_3", name: "适中", label: "★★★ 3档·适中 (能力进阶)" },
  { value: "tier_5_4", name: "提高", label: "★★★★ 4档·提高 (排查强化)" },
  { value: "tier_5_5", name: "挑战", label: "★★★★★ 5档·挑战 (思维拓展)" },
] as const;

/**
 * 6 档制配置元数据
 */
const TIERS_6 = [
  { value: "tier_6_1", name: "1级", label: "★ 1级·起步 (萌芽探索)" },
  { value: "tier_6_2", name: "2级", label: "★★ 2级·初阶 (规律感知)" },
  { value: "tier_6_3", name: "3级", label: "★★★ 3级·中阶 (稳扎稳打)" },
  { value: "tier_6_4", name: "4级", label: "★★★★ 4级·进阶 (多维推导)" },
  { value: "tier_6_5", name: "5级", label: "★★★★★ 5级·高阶 (深度盘面)" },
  { value: "tier_6_6", name: "6级", label: "★★★★★★ 6级·专家 (极境挑战)" },
] as const;

/**
 * 获取当前分档制下的具体难度选项列表
 */
export function getDifficultyOptions(division: TierDivision = 3): DifficultyOption[] {
  let list: readonly { value: string; label: string }[];
  if (division === 5) {
    list = TIERS_5;
  } else if (division === 6) {
    list = TIERS_6;
  } else {
    list = TIERS_3;
  }

  const result: DifficultyOption[] = list.map((item) => ({
    value: item.value as DifficultyMode,
    label: item.label,
  }));

  // 通用策略选项
  result.push({
    value: "mixed_page",
    label: "📈 阶梯递进 (由浅入深按比例平滑过渡)",
  });
  result.push({
    value: "random",
    label: "🎲 全库随机 (全题库无偏随机抽取)",
  });

  return result;
}

/**
 * 根据分档制和具体配置，计算出题目在当前页对应的动态档位信息
 */
export function resolveTierForPuzzle(
  config: PaperConfig,
  indexOnPage: number,
  totalOnPage: number
): TierInfo {
  const division: TierDivision = config.tierDivision || 3;
  const diff = config.difficulty;

  // 1. 处理阶梯递进模式 (mixed_page)
  if (diff === "mixed_page") {
    const ratio = totalOnPage > 1 ? indexOnPage / (totalOnPage - 1) : 0.5;
    const tierIndex = Math.min(
      division - 1,
      Math.floor(ratio * division)
    );
    return {
      tierIndex,
      totalTiers: division,
      tierName: getTierNameByDivision(tierIndex, division),
    };
  }

  // 2. 处理全库随机模式 (random)
  if (diff === "random") {
    const tierIndex = Math.floor(Math.random() * division);
    return {
      tierIndex,
      totalTiers: division,
      tierName: getTierNameByDivision(tierIndex, division),
    };
  }

  // 3. 处理 5 档模式特定值
  if (diff.startsWith("tier_5_")) {
    const idx = parseInt(diff.replace("tier_5_", ""), 10) - 1;
    const validIdx = Math.max(0, Math.min(4, isNaN(idx) ? 2 : idx));
    return {
      tierIndex: validIdx,
      totalTiers: 5,
      tierName: TIERS_5[validIdx]?.name || "适中",
    };
  }

  // 4. 处理 6 档模式特定值
  if (diff.startsWith("tier_6_")) {
    const idx = parseInt(diff.replace("tier_6_", ""), 10) - 1;
    const validIdx = Math.max(0, Math.min(5, isNaN(idx) ? 2 : idx));
    return {
      tierIndex: validIdx,
      totalTiers: 6,
      tierName: TIERS_6[validIdx]?.name || "3级",
    };
  }

  // 5. 处理 3 档（默认及别名）
  if (diff === "easy" || diff === "starter") {
    return {
      tierIndex: 0,
      totalTiers: division,
      tierName: getTierNameByDivision(0, division),
    };
  }
  if (diff === "hard") {
    return {
      tierIndex: division - 1,
      totalTiers: division,
      tierName: getTierNameByDivision(division - 1, division),
    };
  }

  // 默认: 适中
  const defaultIdx = Math.floor(division / 2);
  return {
    tierIndex: defaultIdx,
    totalTiers: division,
    tierName: getTierNameByDivision(defaultIdx, division),
  };
}

/**
 * 根据档位索引与分档制获取中文名称
 */
export function getTierNameByDivision(
  tierIndex: number,
  division: TierDivision
): string {
  if (division === 5) {
    return TIERS_5[tierIndex]?.name || `${tierIndex + 1}档`;
  }
  if (division === 6) {
    return TIERS_6[tierIndex]?.name || `${tierIndex + 1}级`;
  }
  return TIERS_3[tierIndex]?.name || "适中";
}

/**
 * 获取难度值的友好展示名称（用于弹窗、记录、标题等）
 */
export function getDifficultyDisplayLabel(diff: string): string {
  const map: Record<string, string> = {
    easy: "简单 (3档·L1)",
    medium: "适中 (3档·L2)",
    hard: "困难 (3档·L3)",
    mixed_page: "阶梯递进",
    random: "全库随机",
    tier_5_1: "入门 (5档·L1)",
    tier_5_2: "基础 (5档·L2)",
    tier_5_3: "适中 (5档·L3)",
    tier_5_4: "提高 (5档·L4)",
    tier_5_5: "挑战 (5档·L5)",
    tier_6_1: "1级 (6档·入门)",
    tier_6_2: "2级 (6档·初阶)",
    tier_6_3: "3级 (6档·中阶)",
    tier_6_4: "4级 (6档·进阶)",
    tier_6_5: "5级 (6档·高阶)",
    tier_6_6: "6级 (6档·专家)",
    starter: "入门级",
    medium_hypo_direct: "假设·直显",
    medium_hypo_deep: "假设·深度",
    medium_hypo_mixed: "假设·综合",
  };
  return map[diff] || diff;
}

/**
 * 兼容保留：获取难度对应的典型已知数参考值
 */
export function getDifficultyClues(
  diffType: DifficultyMode,
  indexOnPage: number,
  totalOnPage: number
): number {
  const { tierIndex, totalTiers } = resolveTierForPuzzle(
    { difficulty: diffType, tierDivision: 3 } as PaperConfig,
    indexOnPage,
    totalOnPage
  );
  const ratio = tierIndex / Math.max(1, totalTiers - 1);
  if (ratio <= 0.3) return 10;
  if (ratio <= 0.7) return 8;
  return 6;
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

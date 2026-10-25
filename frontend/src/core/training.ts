import type { Grid4x4, SymbolType } from "../types/sudoku";
import type {
  TrainingQuestion,
  TrainingTechnique,
  TrainingMode,
  TrainingHintStep,
  LaserBeam,
} from "../types/training";
import { SYMBOL_SETS } from "./symbols";

// 四宫格单位常数
const BLOCK_COORDS: Array<Array<[number, number]>> = [
  // 宫 0 (左上)
  [
    [0, 0],
    [0, 1],
    [1, 0],
    [1, 1],
  ],
  // 宫 1 (右上)
  [
    [0, 2],
    [0, 3],
    [1, 2],
    [1, 3],
  ],
  // 宫 2 (左下)
  [
    [2, 0],
    [2, 1],
    [3, 0],
    [3, 1],
  ],
  // 宫 3 (右下)
  [
    [2, 2],
    [2, 3],
    [3, 2],
    [3, 3],
  ],
];

/**
 * 随机生成一个绝对合法的 4x4 数独完全解
 */
export function generateValidSolution(rng = Math.random): Grid4x4 {
  // 随机置换 1-4
  const digits = [1, 2, 3, 4].sort(() => rng() - 0.5);
  const [a, b, c, d] = digits;

  // 基础标准拉丁方矩阵 (满四宫格数独性质)
  const base: Grid4x4 = [
    [a, b, c, d],
    [c, d, a, b],
    [b, a, d, c],
    [d, c, b, a],
  ];

  // 随机带内交换行 (行0与行1, 行2与行3)
  if (rng() > 0.5) {
    [base[0], base[1]] = [base[1], base[0]];
  }
  if (rng() > 0.5) {
    [base[2], base[3]] = [base[3], base[2]];
  }

  // 随机整带交换 (行带 0-1 与 行带 2-3)
  if (rng() > 0.5) {
    const row0 = [...base[0]];
    const row1 = [...base[1]];
    base[0] = [...base[2]];
    base[1] = [...base[3]];
    base[2] = row0;
    base[3] = row1;
  }

  // 随机列带内交换 (列0与列1, 列2与列3)
  if (rng() > 0.5) {
    for (let r = 0; r < 4; r++) {
      const temp = base[r][0];
      base[r][0] = base[r][1];
      base[r][1] = temp;
    }
  }
  if (rng() > 0.5) {
    for (let r = 0; r < 4; r++) {
      const temp = base[r][2];
      base[r][2] = base[r][3];
      base[r][3] = temp;
    }
  }

  // 随机整列带交换
  if (rng() > 0.5) {
    for (let r = 0; r < 4; r++) {
      const c0 = base[r][0];
      const c1 = base[r][1];
      base[r][0] = base[r][2];
      base[r][1] = base[r][3];
      base[r][2] = c0;
      base[r][3] = c1;
    }
  }

  return base;
}

/**
 * 获取格子所在宫号 (0-3)
 */
export function getBlockIndex(r: number, c: number): number {
  return Math.floor(r / 2) * 2 + Math.floor(c / 2);
}

/**
 * 获取格子所在宫的所有坐标
 */
export function getBlockCoords(r: number, c: number): Array<[number, number]> {
  const b = getBlockIndex(r, c);
  return BLOCK_COORDS[b] as Array<[number, number]>;
}

/**
 * 格式化符号名称（数字、水果、动物等）
 */
export function getSymbolName(val: number, symbolType: SymbolType): string {
  const symbol = SYMBOL_SETS[symbolType]?.[val] || String(val);
  switch (symbolType) {
    case "fruits": {
      const names = { 1: "苹果", 2: "香蕉", 3: "葡萄", 4: "草莓" };
      return `${symbol} ${names[val as 1 | 2 | 3 | 4] || ""}`;
    }
    case "animals": {
      const names = { 1: "小猫", 2: "小狗", 3: "小兔", 4: "熊猫" };
      return `${symbol} ${names[val as 1 | 2 | 3 | 4] || ""}`;
    }
    case "shapes": {
      const names = { 1: "圆圈", 2: "三角", 3: "方块", 4: "五角星" };
      return `${symbol} ${names[val as 1 | 2 | 3 | 4] || ""}`;
    }
    case "letters":
      return `字母 ${symbol}`;
    default:
      return `数字 ${symbol}`;
  }
}

/**
 * 生成【唯余法 (Naked Single)】专项训练题
 *
 * 特征：目标格所在十字行、列或所在宫，已经聚集了其余 3 个不同的数，使得该格仅剩唯一候选数！
 */
export function generateNakedSingleQuestion(
  symbolType: SymbolType = "numbers",
  rng = Math.random
): TrainingQuestion {
  const solution = generateValidSolution(rng);
  const targetR = Math.floor(rng() * 4);
  const targetC = Math.floor(rng() * 4);
  const targetValue = solution[targetR][targetC];
  const blockIdx = getBlockIndex(targetR, targetC);

  // 初始化全空盘面
  const puzzle: Grid4x4 = [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];

  // 必须看到的 3 个其他数字
  const otherDigits = [1, 2, 3, 4].filter((d) => d !== targetValue);

  // 唯余形态：50% 直观同区域集中 (如整行、整列或整宫三缺一)，50% 十字交叉启发式 (行、列、宫各提供部分)
  const isStraightLine = rng() < 0.5;

  if (isStraightLine) {
    // 随机选择同区域：行、列或宫
    const typeChoice = Math.floor(rng() * 3);
    if (typeChoice === 0) {
      // 整行唯余：填满本行其他 3 格
      for (let c = 0; c < 4; c++) {
        if (c !== targetC) puzzle[targetR][c] = solution[targetR][c];
      }
    } else if (typeChoice === 1) {
      // 整列唯余：填满本列其他 3 格
      for (let r = 0; r < 4; r++) {
        if (r !== targetR) puzzle[r][targetC] = solution[r][targetC];
      }
    } else {
      // 整宫唯余：填满本宫其他 3 格
      for (const [r, c] of BLOCK_COORDS[blockIdx]) {
        if (r !== targetR || c !== targetC) {
          puzzle[r][c] = solution[r][c];
        }
      }
    }
  } else {
    // 十字交叉唯余：行、列、宫各自贡献已知数，汇聚排除
    // 目标：确保 peer 内出现 otherDigits 的每一个数字
    const neededDigits = new Set(otherDigits);

    // 收集所有同行、同列、同宫的候选格子
    const peerCells: Array<{ r: number; c: number; val: number }> = [];
    for (let c = 0; c < 4; c++) {
      if (c !== targetC) peerCells.push({ r: targetR, c, val: solution[targetR][c] });
    }
    for (let r = 0; r < 4; r++) {
      if (r !== targetR) peerCells.push({ r, c: targetC, val: solution[r][targetC] });
    }
    for (const [r, c] of BLOCK_COORDS[blockIdx]) {
      if (r !== targetR && c !== targetC) {
        peerCells.push({ r, c, val: solution[r][c] });
      }
    }

    // 打乱顺序，按需点亮已知数
    peerCells.sort(() => rng() - 0.5);
    for (const cell of peerCells) {
      if (neededDigits.has(cell.val)) {
        puzzle[cell.r][cell.c] = cell.val;
        neededDigits.delete(cell.val);
      }
    }
    // 如果碰巧还没集齐，强行补齐
    if (neededDigits.size > 0) {
      for (const d of neededDigits) {
        const found = peerCells.find((c) => c.val === d);
        if (found) puzzle[found.r][found.c] = found.val;
      }
    }
  }

  // 偶尔在盘面其他无关区域添加 1-2 个散落已知数，增强真实感
  if (rng() > 0.4) {
    const emptyUnrelated: Array<[number, number]> = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (
          puzzle[r][c] === 0 &&
          (r !== targetR || c !== targetC) &&
          r !== targetR &&
          c !== targetC &&
          getBlockIndex(r, c) !== blockIdx
        ) {
          emptyUnrelated.push([r, c]);
        }
      }
    }
    if (emptyUnrelated.length > 0) {
      const [er, ec] = emptyUnrelated[Math.floor(rng() * emptyUnrelated.length)];
      puzzle[er][ec] = solution[er][ec];
    }
  }

  // 提取 peer 已有数字
  const rowNumbers: number[] = [];
  for (let c = 0; c < 4; c++) {
    if (puzzle[targetR][c] > 0) rowNumbers.push(puzzle[targetR][c]);
  }
  const colNumbers: number[] = [];
  for (let r = 0; r < 4; r++) {
    if (puzzle[r][targetC] > 0) colNumbers.push(puzzle[r][targetC]);
  }
  const blockNumbers: number[] = [];
  for (const [r, c] of BLOCK_COORDS[blockIdx]) {
    if (puzzle[r][c] > 0) blockNumbers.push(puzzle[r][c]);
  }
  const seenSet = new Set<number>([...rowNumbers, ...colNumbers, ...blockNumbers]);
  const seenNumbers = Array.from(seenSet).sort((a, b) => a - b);

  // 动态生成生动形象的 3 级引导
  const targetSymbol = getSymbolName(targetValue, symbolType);
  const seenSymbols = seenNumbers.map((v) => getSymbolName(v, symbolType)).join("、");

  const hints: TrainingHintStep[] = [
    {
      level: 1,
      title: "观察目标格子",
      description: `看高亮闪烁的这个小格子（第 ${targetR + 1} 行第 ${targetC + 1} 列），仔细看看它的行、列和同一个 2x2 宫格里，已经住下了哪些伙伴？`,
    },
    {
      level: 2,
      title: "开启十字雷达",
      description: `十字雷达扫描中！它的同行、同列和同宫已经出现了：【${seenSymbols}】。4 样伙伴里已经来了 3 样！`,
    },
    {
      level: 3,
      title: "唯余锁定唯一解",
      description: `太棒了！因为四宫格每行、每列、每个宫都必须有 1~4，既然其他 3 个都齐了，那这个格子只剩下唯一的可能——必须填【${targetSymbol}】！`,
    },
  ];

  return {
    id: `naked_${Date.now()}_${Math.floor(rng() * 1000)}`,
    technique: "naked_single",
    puzzle,
    solution,
    targetCell: { r: targetR, c: targetC },
    targetValue,
    nakedDetails: {
      rowNumbers,
      colNumbers,
      blockNumbers,
      seenNumbers,
      missingNumber: targetValue,
    },
    hints,
  };
}

/**
 * 生成【摒除法 (Hidden Single / 排除法)】专项训练题
 *
 * 特征：聚焦某一个区域（最形象的是 2x2 宫），目标是为某个数字 targetDigit 找家。
 * 该宫内的其他空格被外部同行/同列已有的该数字发射“激光”封锁，只剩一个唯一安全格子！
 */
export function generateHiddenSingleQuestion(
  symbolType: SymbolType = "numbers",
  rng = Math.random
): TrainingQuestion {
  const solution = generateValidSolution(rng);

  // 随机挑选一个 2x2 宫作为目标城堡 (0-3)
  const targetBlockIdx = Math.floor(rng() * 4);
  const blockCoords = BLOCK_COORDS[targetBlockIdx];

  // 随机选定目标数字 targetDigit (1-4)
  const targetDigit = Math.floor(rng() * 4) + 1;

  // 在目标宫中定位 targetDigit 所在的格子，它就是唯一的正解目标格
  let targetCell = { r: 0, c: 0 };
  for (const [r, c] of blockCoords) {
    if (solution[r][c] === targetDigit) {
      targetCell = { r, c };
      break;
    }
  }

  // 目标宫内的其他 3 个格子
  const otherBlockCells = blockCoords.filter(
    ([r, c]) => !(r === targetCell.r && c === targetCell.c)
  );

  // 初始化盘面
  const puzzle: Grid4x4 = [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];

  // 构建激光束与封锁空格
  const laserBeams: LaserBeam[] = [];
  const blockedCellsInUnit: Array<{ r: number; c: number }> = [];

  // 在目标宫内，我们可以让其中 1 个格子是已知数（非 targetDigit），其余 1~2 个格子是空格且被外部激光扫射
  // 决定是否在宫内放 1 个已知数
  const hasClueInBlock = rng() > 0.3;
  let clueCellInBlock: [number, number] | null = null;
  if (hasClueInBlock && otherBlockCells.length > 0) {
    const chosen = otherBlockCells[Math.floor(rng() * otherBlockCells.length)];
    clueCellInBlock = chosen;
    puzzle[chosen[0]][chosen[1]] = solution[chosen[0]][chosen[1]];
  }

  // 找出需要被外部激光摒除的空格
  const needLaserCells = otherBlockCells.filter(
    ([r, c]) => !(clueCellInBlock && r === clueCellInBlock[0] && c === clueCellInBlock[1])
  );

  for (const [r, c] of needLaserCells) {
    blockedCellsInUnit.push({ r, c });

    // 寻找外部的 targetDigit 来发射激光！
    // 可以在外部同行 (r 行的另外两列) 或者外部同列 (c 列的另外两行)
    // 看看 solution 里外部哪一行或列有 targetDigit
    let foundLaser = false;

    // 尝试行激光：同行外部两列是否有 targetDigit
    for (let col = 0; col < 4; col++) {
      if (getBlockIndex(r, col) !== targetBlockIdx && solution[r][col] === targetDigit) {
        puzzle[r][col] = targetDigit;
        laserBeams.push({
          sourceR: r,
          sourceC: col,
          val: targetDigit,
          direction: "row",
          lineIndex: r,
          blockedCells: [{ r, c }],
        });
        foundLaser = true;
        break;
      }
    }

    if (!foundLaser) {
      // 尝试列激光：同列外部两行是否有 targetDigit
      for (let row = 0; row < 4; row++) {
        if (getBlockIndex(row, c) !== targetBlockIdx && solution[row][c] === targetDigit) {
          puzzle[row][c] = targetDigit;
          laserBeams.push({
            sourceR: row,
            sourceC: c,
            val: targetDigit,
            direction: "col",
            lineIndex: c,
            blockedCells: [{ r, c }],
          });
          foundLaser = true;
          break;
        }
      }
    }
  }

  // 偶尔在无关角落放 1 个已知数，让盘面看起来自然丰富
  if (rng() > 0.5) {
    const unrelatedCells: Array<[number, number]> = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (
          puzzle[r][c] === 0 &&
          getBlockIndex(r, c) !== targetBlockIdx &&
          !(r === targetCell.r || c === targetCell.c)
        ) {
          unrelatedCells.push([r, c]);
        }
      }
    }
    if (unrelatedCells.length > 0) {
      const [ur, uc] = unrelatedCells[Math.floor(rng() * unrelatedCells.length)];
      puzzle[ur][uc] = solution[ur][uc];
    }
  }

  // 目标区域原本所有的空格
  const emptyCellsInUnit: Array<{ r: number; c: number }> = [
    { r: targetCell.r, c: targetCell.c },
    ...blockedCellsInUnit,
  ];

  // 动态生成生动形象的 3 级引导
  const targetSymbol = getSymbolName(targetDigit, symbolType);
  const blockNames = ["左上角", "右上角", "左下角", "右下角"];
  const blockName = blockNames[targetBlockIdx];

  const hints: TrainingHintStep[] = [
    {
      level: 1,
      title: "寻找目标与小城堡",
      description: `请注意看【${blockName}】的 2x2 小城堡！这个小城堡里还缺【${targetSymbol}】。它应该住进哪个房间呢？`,
    },
    {
      level: 2,
      title: "发射摒除探照光！",
      description: `发射探照激光！看外部其他格子已经有的【${targetSymbol}】，沿着行或列发射出红色的警戒线，穿过了城堡里的其他空格！那些空格都被封锁了，绝对不能再填【${targetSymbol}】！`,
    },
    {
      level: 3,
      title: "锁定唯一的安全房间",
      description: `奇迹发生啦！小城堡里其他空格全被激光扫到封锁了，唯独只有（第 ${targetCell.r + 1} 行第 ${targetCell.c + 1} 列）这个安全房间没有被扫到！所以【${targetSymbol}】必须填在这里！`,
    },
  ];

  return {
    id: `hidden_${Date.now()}_${Math.floor(rng() * 1000)}`,
    technique: "hidden_single",
    puzzle,
    solution,
    targetCell,
    targetValue: targetDigit,
    hiddenDetails: {
      unitType: "block",
      unitIndex: targetBlockIdx,
      targetDigit,
      laserBeams,
      emptyCellsInUnit,
      blockedCellsInUnit,
    },
    hints,
  };
}

/**
 * 根据所选模式生成一道训练题
 */
export function generateTrainingQuestion(
  mode: TrainingMode,
  symbolType: SymbolType = "numbers",
  rng = Math.random
): TrainingQuestion {
  if (mode === "naked") {
    return generateNakedSingleQuestion(symbolType, rng);
  } else if (mode === "hidden") {
    return generateHiddenSingleQuestion(symbolType, rng);
  } else {
    // 综合随机实战 50% 唯余, 50% 摒除
    return rng() < 0.5
      ? generateNakedSingleQuestion(symbolType, rng)
      : generateHiddenSingleQuestion(symbolType, rng);
  }
}

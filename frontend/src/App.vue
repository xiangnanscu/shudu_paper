<template>
  <!-- 唯余与摒除技巧专项训练模块 -->
  <TrainingModule
    v-if="currentModule === 'training'"
    :initial-symbol-type="config.symbolType"
    @back-to-paper="currentModule = 'paper'"
  />

  <div v-else class="app-layout">
    <!-- 侧边栏配置 -->
    <SidebarConfig
      :config="config"
      :is-open="isSidebarOpen"
      @close="isSidebarOpen = false"
      @print="handlePrint"
      @regenerate="handleRegenerate"
      @change-structure="handleStructureChange"
      @open-training="handleOpenTraining"
    />

    <!-- 右侧主预览与做题区 -->
    <main
      ref="previewAreaRef"
      class="preview-container"
      @scroll="handlePreviewScroll"
      @click="handleContainerClick"
    >
      <!-- 试卷上方做题状态工具条 (吸顶) -->
      <ExamTopBar
        :exam-status="exam.status.value"
        :formatted-time="timer.formattedTime.value"
        :filled-count="exam.filledCount.value"
        :total-holes="sudoku.totalHoles.value"
        @open-sidebar="isSidebarOpen = true"
        @open-training="handleOpenTraining"
        @start-exam="handleStartExam"
        @submit-exam="handleSubmitExam"
        @restart-exam="handleRestartExam"
        @open-drawer="cloudRecords.openDrawer"
        @print-exam="handlePrint"
      />

      <!-- 移动端单题专注做题视图 (一次只显示一道题，超大盘面，防误触) -->
      <MobileSingleExam
        v-if="viewMode === 'single'"
        :puzzles="sudoku.flatPuzzles.value"
        :exam-status="exam.status.value"
        :user-answers="exam.userAnswers.value"
        :symbol-map="sudoku.currentSymbolMap.value"
        :exam-result="exam.currentResult.value"
        :corrected-puzzle-ids="correctedPuzzleIds"
        @start-exam="handleStartExam"
        @submit-exam="handleSubmitExam"
        @fill="handleSingleExamFill"
        @redo-puzzle="handleOpenSingleRedo"
      />

      <!-- 动态缩放容器 (保证 A4 移动端贴合且排版一致，在打印模式下始终完整呈现) -->
      <div
        v-if="!(isReviewModalOpen && reviewRecordDetail)"
        class="paper-container-wrapper"
        :class="{
          'hidden-on-screen': viewMode === 'single',
          'hidden-for-review-print': isReviewModalOpen && reviewRecordDetail
        }"
      >
        <PaperScaleContainer
          :puzzles-data="sudoku.puzzlesData.value"
          :board-size="sudoku.boardSize.value"
          :cell-font-size="sudoku.cellFontSize.value"
          :symbol-map="sudoku.currentSymbolMap.value"
          :exam-status="exam.status.value"
          :user-answers="exam.userAnswers.value"
          :active-cell="keypad.activeCell.value"
          :config="config"
          :exam-result="exam.currentResult.value"
          :corrected-puzzle-ids="correctedPuzzleIds"
          :scale="scale.scale.value"
          :container-height="scale.containerHeight.value"
          :container-margin-bottom="scale.containerMarginBottom.value"
          @select-cell="handleSelectCell"
        />
      </div>

      <!-- 历史复盘试卷专用 A4 打印容器 (当在复盘详情弹窗中点击打印时，高清输出老师批改试卷) -->
      <div
        v-if="isReviewModalOpen && reviewRecordDetail"
        class="review-print-sheet-wrapper"
      >
        <div id="pagesWrapper">
          <PaperSheet
            v-for="(pagePuzzles, idx) in reviewPagesData"
            :key="'review-print-page-' + idx"
            :page-index="idx"
            :current-page-number="idx + 1"
            :total-sheets="reviewPagesData.length"
            :puzzles="pagePuzzles"
            :board-size="reviewBoardSize"
            :cell-font-size="reviewCellFontSize"
            :symbol-map="reviewSymbolMap"
            exam-status="submitted"
            :user-answers="reviewRecordDetail.userAnswers"
            :active-cell="null"
            :config="reviewPaperConfig"
            :exam-result="reviewExamResult"
            :corrected-puzzle-ids="correctedPuzzleIds"
            :is-answer-sheet="false"
          />
        </div>
      </div>
    </main>

    <!-- 浮动小键盘 -->
    <KeypadPopover
      :is-open="keypad.isOpen.value"
      :placement="keypad.placement.value"
      :popover-left="keypad.popoverLeft.value"
      :popover-top="keypad.popoverTop.value"
      :arrow-left="keypad.arrowLeft.value"
      :has-user-val="keypad.hasUserVal.value"
      :symbol-map="sudoku.currentSymbolMap.value"
      @fill="handleKeypadFill"
    />

    <!-- 做题记录抽屉 (WeChat Drawer) -->
    <HistoryDrawer
      :is-open="cloudRecords.isDrawerOpen.value"
      :loading="cloudRecords.loading.value"
      :load-error="cloudRecords.loadError.value"
      :stats="cloudRecords.stats.value"
      :grouped-records="cloudRecords.groupedRecords.value"
      @close="cloudRecords.closeDrawer"
      @reload="cloudRecords.loadHistory"
      @view-detail="handleViewRecordDetail"
      @redo="handleRedoRecord"
    />

    <!-- 试卷复盘与详情模态窗 (Exam Review Modal) -->
    <ExamReviewModal
      :is-open="isReviewModalOpen"
      :loading="reviewLoading"
      :load-error="reviewError"
      :record="reviewRecordDetail"
      :symbol-map="reviewSymbolMap"
      :corrected-puzzle-ids="correctedPuzzleIds"
      :paper-config="reviewPaperConfig"
      :exam-result="reviewExamResult"
      @close="isReviewModalOpen = false"
      @redo="handleRedoRecord"
      @redo-puzzle="handleOpenSingleRedo"
      @print="handlePrintReviewExam"
    />

    <!-- 单题订正重做模态窗 (Single Puzzle Redo Modal) -->
    <SingleRedoModal
      :is-open="isSingleRedoOpen"
      :puzzle="activeRedoPuzzle"
      :symbol-map="sudoku.currentSymbolMap.value"
      @close="isSingleRedoOpen = false"
      @success="handleSingleRedoSuccess"
    />

    <!-- 成绩批改弹窗 (Score Modal) -->
    <ScoreModal
      :is-open="exam.isScoreModalOpen.value"
      :result="exam.currentResult.value"
      :sync-status="cloudRecords.syncStatus.value"
      :sync-error="cloudRecords.syncError.value"
      @close="exam.closeScoreModal"
      @restart="handleRestartExam"
      @regenerate="handleRegenerate"
      @retry-sync="handleRetrySync"
      @print="handlePrintFromScoreModal"
    />

    <!-- iOS / iPadOS 添加到主屏幕引导弹窗 -->
    <IosInstallGuideModal
      :visible="showIOSGuide"
      @close="closeIOSGuide"
    />

    <!-- 通用自定义确认弹窗 (替代原生 confirm/alert) -->
    <ConfirmDialog
      :is-open="isConfirmOpen"
      :state="confirmState"
      @confirm="onConfirmOk"
      @cancel="onConfirmCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, toRef, watch, onMounted, onUnmounted, nextTick } from "vue";
import type { PaperConfig } from "./types/config";
import type { ExamRecordDetail } from "./types/record";
import type { SudokuPuzzle } from "./types/sudoku";
import type { ExamResult } from "./types/exam";
import { SYMBOL_SETS } from "./core/symbols";
import { getDifficultyDisplayLabel } from "./core/difficulty";
import { useSudoku } from "./composables/useSudoku";
import { useExamTimer } from "./composables/useExamTimer";
import { useExam } from "./composables/useExam";
import { useKeypad } from "./composables/useKeypad";
import { useCloudRecords } from "./composables/useCloudRecords";
import { useResponsiveScale } from "./composables/useResponsiveScale";
import { useKeyboard } from "./composables/useKeyboard";
import { usePWAInstall } from "./composables/usePWAInstall";
import { useConfirmDialog } from "./composables/useConfirmDialog";

import SidebarConfig from "./components/sidebar/SidebarConfig.vue";
import ExamTopBar from "./components/exam/ExamTopBar.vue";
import MobileSingleExam from "./components/exam/MobileSingleExam.vue";
import PaperScaleContainer from "./components/paper/PaperScaleContainer.vue";
import PaperSheet from "./components/paper/PaperSheet.vue";
import KeypadPopover from "./components/exam/KeypadPopover.vue";
import HistoryDrawer from "./components/drawer/HistoryDrawer.vue";
import ScoreModal from "./components/exam/ScoreModal.vue";
import ExamReviewModal from "./components/review/ExamReviewModal.vue";
import SingleRedoModal from "./components/review/SingleRedoModal.vue";
import IosInstallGuideModal from "./components/exam/IosInstallGuideModal.vue";
import ConfirmDialog from "./components/common/ConfirmDialog.vue";
import TrainingModule from "./components/training/TrainingModule.vue";

const currentModule = ref<"paper" | "training">("paper");

const { showIOSGuide, closeIOSGuide } = usePWAInstall();

// 自定义确认弹窗（替代原生 confirm/alert）
const {
  isOpen: isConfirmOpen,
  state: confirmState,
  showConfirm,
  confirm: onConfirmOk,
  cancel: onConfirmCancel,
} = useConfirmDialog();

// 复盘模态窗状态
const isReviewModalOpen = ref(false);
const reviewLoading = ref(false);
const reviewError = ref<string | null>(null);
const reviewRecordDetail = ref<ExamRecordDetail | null>(null);

// 单题订正重做状态
const isSingleRedoOpen = ref(false);
const activeRedoPuzzle = ref<SudokuPuzzle | null>(null);
const correctedPuzzleIds = ref<Set<number>>(new Set());

// 试卷及考务基础配置
const config = reactive<PaperConfig>({
  pagesCount: 1,
  rowsPerPage: 2, // 默认 2 行 (6 题 · 启蒙特大 · 推荐)
  tierDivision: 3,
  difficulty: "medium",
  symbolType: "numbers",
  paperTitle: "四宫格数独 · 启蒙思维训练卷",
  paperSubtitle: "专项要点：唯余法阶梯训练 · 科学量化工作量",
  studentName: "",
  studentClass: "",
  showName: true,
  showClass: true,
  showDate: true,
  showTime: true,
  showScore: true,
  appendAnswerPage: false,
  showAnswers: false,
});

// 状态 Hook 实例化
const isSidebarOpen = ref(false);
const previewAreaRef = ref<HTMLElement | null>(null);

const sudoku = useSudoku(config);
const timer = useExamTimer();
const exam = useExam();
const keypad = useKeypad();
const cloudRecords = useCloudRecords();

const scale = useResponsiveScale(
  previewAreaRef,
  toRef(config, "pagesCount"),
  toRef(config, "appendAnswerPage")
);

// 视图模式：手机自动单题 ('single')，宽屏自动整卷排版 ('paper')
// 智能自适应屏幕尺寸，无需用户手动常驻切换
const isMobileScreen = ref(typeof window !== "undefined" && window.innerWidth <= 768);
const viewMode = ref<"single" | "paper">(isMobileScreen.value ? "single" : "paper");

function handleScreenResize() {
  const isMobile = window.innerWidth <= 768;
  if (isMobileScreen.value !== isMobile) {
    isMobileScreen.value = isMobile;
    viewMode.value = isMobile ? "single" : "paper";
    if (!isMobile) {
      nextTick(() => {
        scale.updateScale();
      });
    }
  }
}

// 键盘快捷键监听
useKeyboard({
  onFill: handleKeypadFill,
  onEscape: () => {
    // 确认弹窗打开时 Esc 仅关闭弹窗本身（由 ConfirmDialog 处理）
    if (isConfirmOpen.value) return;
    keypad.close();
    cloudRecords.closeDrawer();
    exam.closeScoreModal();
    isReviewModalOpen.value = false;
    isSidebarOpen.value = false;
  },
  onRegenerate: handleRegenerate,
  getActiveCell: () => keypad.activeCell.value,
});

// 难度值对应的展示名称（与规格面板选项一致）
const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "简单",
  medium: "适中",
  hard: "困难",
  mixed_page: "阶梯",
  random: "随机",
  starter: "入门",
  medium_hypo_direct: "假设·直显",
  medium_hypo_deep: "假设·深度",
  medium_hypo_mixed: "假设·综合",
};

// 当前试卷实际采用的规格快照（用于取消修改时回滚下拉框）
const appliedStructure = {
  pagesCount: config.pagesCount,
  rowsPerPage: config.rowsPerPage,
  tierDivision: config.tierDivision,
  difficulty: config.difficulty as string,
};

function snapshotAppliedStructure() {
  appliedStructure.pagesCount = config.pagesCount;
  appliedStructure.rowsPerPage = config.rowsPerPage;
  appliedStructure.tierDivision = config.tierDivision;
  appliedStructure.difficulty = config.difficulty;
}

// 开始做题确认弹窗（展示试卷信息，友好引导）
async function confirmStartExam(): Promise<boolean> {
  return showConfirm({
    variant: "info",
    icon: "🚀",
    title: "准备好开始挑战了吗？",
    message: "点击开始后将启动计时，作答过程中可随时交卷评分。",
    confirmText: "开始计时答题",
    cancelText: "再看看",
    stats: [
      { label: "题目数量", value: `${sudoku.flatPuzzles.value.length} 题` },
      { label: "待填空格", value: `${sudoku.totalHoles.value} 格` },
      { label: "试卷难度", value: getDifficultyDisplayLabel(config.difficulty) },
    ],
  });
}

// 防误触：作答中的试卷在被放弃前统一弹窗确认
async function confirmAbandonExam(reason: string): Promise<boolean> {
  if (exam.status.value !== "doing") return true;
  return showConfirm({
    variant: "warning",
    icon: "✋",
    title: "当前试卷尚未完成",
    message:
      `${reason}，当前作答进度（已填 ${exam.filledCount.value}/${sudoku.totalHoles.value} 格 · ` +
      `用时 ${timer.formattedTime.value}）将被放弃，且无法恢复。`,
    confirmText: "放弃并继续",
    cancelText: "继续作答",
  });
}

// 切换进入唯余与摒除技巧专项训练
async function handleOpenTraining() {
  if (exam.status.value === "doing") {
    const ok = await confirmAbandonExam("前往技巧训练");
    if (!ok) return;
    exam.resetExam();
    timer.reset();
  }
  currentModule.value = "training";
}

// 监听答案透显设置切换 body 类名
watch(
  () => config.showAnswers,
  (val) => {
    document.body.classList.toggle("show-answers", val);
  },
  { immediate: true }
);

// 格位点击交互
async function handleSelectCell(
  elem: HTMLElement,
  puzzleId: number,
  r: number,
  c: number
) {
  if (exam.status.value === "submitted") return;

  if (exam.status.value === "ready") {
    if (!(await confirmStartExam())) return;
    exam.startExam();
    timer.start();
  }

  const key = `${puzzleId}_${r}_${c}`;
  const hasVal = exam.userAnswers.value[key] !== undefined;
  keypad.open(elem, puzzleId, r, c, hasVal);
}

// 虚拟键盘填入
function handleKeypadFill(val: number) {
  if (!keypad.activeCell.value) return;
  const { puzzleId, r, c } = keypad.activeCell.value;

  // 提取对应题目的标准答案以记录并判定
  const targetPuzzle = sudoku.flatPuzzles.value.find((p) => p.id === puzzleId);
  const solutionVal = targetPuzzle ? targetPuzzle.solution[r][c] : undefined;

  exam.fillCell(
    puzzleId,
    r,
    c,
    val,
    timer.elapsedSeconds.value,
    solutionVal
  );
  keypad.close();
}

// 移动端单题专注视图下的填数处理
async function handleSingleExamFill(payload: {
  puzzleId: number;
  r: number;
  c: number;
  val: number;
}) {
  if (exam.status.value === "submitted") return;

  if (exam.status.value === "ready") {
    if (!(await confirmStartExam())) return;
    exam.startExam();
    timer.start();
  }

  const { puzzleId, r, c, val } = payload;
  const targetPuzzle = sudoku.flatPuzzles.value.find((p) => p.id === puzzleId);
  const solutionVal = targetPuzzle ? targetPuzzle.solution[r][c] : undefined;

  exam.fillCell(
    puzzleId,
    r,
    c,
    val,
    timer.elapsedSeconds.value,
    solutionVal
  );
}

// 打开单题订正重做
function handleOpenSingleRedo(puzzle: SudokuPuzzle) {
  activeRedoPuzzle.value = puzzle;
  isSingleRedoOpen.value = true;
}

// 单题重做订正成功闭环处理
function handleSingleRedoSuccess(payload: {
  puzzleId: number;
  timeSpent: number;
  userAnswers: Record<string, number>;
}) {
  const nextSet = new Set(correctedPuzzleIds.value);
  nextSet.add(payload.puzzleId);
  correctedPuzzleIds.value = nextSet;

  // 若处于已交卷批改状态，同步更正主试卷中的答案，让错题在卷面上实时转绿
  if (exam.status.value === "submitted") {
    Object.entries(payload.userAnswers).forEach(([posKey, val]) => {
      const key = `${payload.puzzleId}_${posKey}`;
      exam.userAnswers.value[key] = val;
    });
  }

  // 若当前正在查看历史复盘，同步更正复盘详情中的作答
  if (reviewRecordDetail.value) {
    Object.entries(payload.userAnswers).forEach(([posKey, val]) => {
      const key = `${payload.puzzleId}_${posKey}`;
      reviewRecordDetail.value!.userAnswers[key] = val;
    });
  }
}

// 打开试卷详情与步骤复盘
async function handleViewRecordDetail(recordId: string) {
  cloudRecords.closeDrawer();
  correctedPuzzleIds.value = new Set();
  isReviewModalOpen.value = true;
  reviewLoading.value = true;
  reviewError.value = null;
  reviewRecordDetail.value = null;

  try {
    const detail = await cloudRecords.fetchRecordDetail(recordId);
    if (!detail) {
      throw new Error("未能获取到试卷详细信息");
    }
    reviewRecordDetail.value = detail;
  } catch (err: any) {
    reviewError.value = err.message || "加载试卷详情失败，请检查网络或稍后重试";
  } finally {
    reviewLoading.value = false;
  }
}

// 历史复盘试卷专用 A4 打印数据切片与配置
const reviewPagesData = computed<SudokuPuzzle[][]>(() => {
  if (!reviewRecordDetail.value || !reviewRecordDetail.value.puzzles) return [];
  const puzzles = reviewRecordDetail.value.puzzles;
  const rows = reviewRecordDetail.value.rows_per_page ?? reviewRecordDetail.value.rowsPerPage ?? 2;
  const perPage = rows * 3;
  const pages: SudokuPuzzle[][] = [];
  for (let i = 0; i < puzzles.length; i += perPage) {
    pages.push(puzzles.slice(i, i + perPage));
  }
  return pages.length > 0 ? pages : [puzzles];
});

const reviewPaperConfig = computed<PaperConfig>(() => {
  const r = reviewRecordDetail.value;
  return {
    pagesCount: reviewPagesData.value.length || 1,
    rowsPerPage: (r?.rows_per_page ?? r?.rowsPerPage ?? 2) as 2 | 3,
    difficulty: (r?.difficulty ?? "medium") as any,
    symbolType: (r?.symbol_type ?? r?.symbolType ?? "numbers") as any,
    paperTitle: config.paperTitle || "四宫格数独思维训练",
    paperSubtitle: config.paperSubtitle || "培养专注力 · 建立数感 · 锻炼逻辑推理",
    studentName: r?.student_name ?? r?.studentName ?? config.studentName ?? "",
    studentClass: r?.student_class ?? r?.studentClass ?? config.studentClass ?? "",
    showName: true,
    showClass: true,
    showDate: true,
    showTime: true,
    showScore: true,
    appendAnswerPage: false,
    showAnswers: false,
  };
});

const reviewExamResult = computed<ExamResult | null>(() => {
  const r = reviewRecordDetail.value;
  if (!r) return null;
  const totalHoles = r.total_holes ?? r.totalHoles ?? 0;
  const correctHoles = r.correct_holes ?? r.correctHoles ?? 0;
  return {
    score: r.score ?? 0,
    timeSpent: r.time_spent ?? r.timeSpent ?? 0,
    totalPuzzles: r.total_puzzles ?? r.totalPuzzles ?? (r.puzzles ? r.puzzles.length : 0),
    correctPuzzles: r.correct_puzzles ?? r.correctPuzzles ?? 0,
    totalHoles,
    correctHoles,
    wrongHoles: totalHoles - correctHoles,
    difficulty: (r.difficulty ?? "medium") as any,
    symbolType: (r.symbol_type ?? r.symbolType ?? "numbers") as any,
    studentName: r.student_name ?? r.studentName ?? config.studentName ?? "",
    studentClass: r.student_class ?? r.studentClass ?? config.studentClass ?? "",
    pagesCount: reviewPagesData.value.length || 1,
    rowsPerPage: (r.rows_per_page ?? r.rowsPerPage ?? 2) as 2 | 3,
    createdAt: r.created_at ?? r.createdAt ?? "",
  };
});

const reviewBoardSize = computed(() => {
  const rows = reviewRecordDetail.value?.rows_per_page ?? reviewRecordDetail.value?.rowsPerPage ?? 2;
  return rows === 3 ? "172px" : "198px";
});

const reviewCellFontSize = computed(() => {
  const rows = reviewRecordDetail.value?.rows_per_page ?? reviewRecordDetail.value?.rowsPerPage ?? 2;
  return rows === 3 ? "24px" : "28px";
});

const reviewSymbolMap = computed(() => {
  const type = (reviewRecordDetail.value?.symbol_type ?? reviewRecordDetail.value?.symbolType ?? "numbers") as keyof typeof SYMBOL_SETS;
  return SYMBOL_SETS[type] || SYMBOL_SETS.numbers;
});

function handlePrintReviewExam() {
  nextTick(() => {
    window.print();
  });
}

// 重做选中的历史试卷 (错卷重做)
async function handleRedoRecord(recordOrId: string | ExamRecordDetail) {
  let detail: ExamRecordDetail | null = null;
  if (typeof recordOrId === "object" && recordOrId !== null) {
    detail = recordOrId;
  } else {
    try {
      detail = await cloudRecords.fetchRecordDetail(recordOrId);
    } catch (err: any) {
      showConfirm({
        variant: "danger",
        icon: "📡",
        title: "加载试卷失败",
        message: "加载试卷失败：" + (err.message || "未知错误") + "，请检查网络后重试。",
        confirmText: "我知道了",
        hideCancel: true,
      });
      return;
    }
  }

  if (!detail || !detail.puzzles || detail.puzzles.length === 0) {
    showConfirm({
      variant: "warning",
      icon: "🧩",
      title: "无法重做该试卷",
      message: "该试卷记录缺少题目数据，无法重新做题。",
      confirmText: "我知道了",
      hideCancel: true,
    });
    return;
  }

  if (!(await confirmAbandonExam("重做该卷将放弃当前作答"))) {
    return;
  }

  // 关闭所有弹层
  cloudRecords.closeDrawer();
  isReviewModalOpen.value = false;
  isSingleRedoOpen.value = false;
  exam.closeScoreModal();
  keypad.close();
  correctedPuzzleIds.value = new Set();

  // 恢复试卷参数
  if (detail.difficulty) {
    config.difficulty = detail.difficulty as any;
  }
  if (detail.symbol_type || detail.symbolType) {
    config.symbolType = (detail.symbol_type || detail.symbolType) as any;
  }
  if (detail.pages_count || detail.pagesCount) {
    config.pagesCount = (detail.pages_count || detail.pagesCount)!;
  }
  if (detail.rows_per_page || detail.rowsPerPage) {
    config.rowsPerPage = (detail.rows_per_page || detail.rowsPerPage)!;
  }

  // 载入试题并重新按行数分页
  sudoku.loadHistoricalPuzzles(detail.puzzles, config.rowsPerPage);
  snapshotAppliedStructure();

  // 重新开始答题
  exam.restartCurrentExam();
  timer.reset();
  timer.start();

  nextTick(() => {
    scale.updateScale();
    if (previewAreaRef.value) {
      previewAreaRef.value.scrollTo({ top: 0, behavior: "smooth" });
    }
  });
}

// 开始做题按钮
async function handleStartExam() {
  if (!(await confirmStartExam())) return;
  exam.startExam();
  timer.start();
}

// 交卷评分
async function handleSubmitExam() {
  // 防误触：仍有空格未填时先确认
  const unDone = sudoku.totalHoles.value - exam.filledCount.value;
  if (unDone > 0) {
    const ok = await showConfirm({
      variant: "warning",
      icon: "📝",
      title: `还有 ${unDone} 个空格未填写`,
      message: "现在交卷将按已填内容评分，未填写的空格会计为错误。",
      confirmText: "仍然交卷",
      cancelText: "继续作答",
    });
    if (!ok) return;
  }

  const result = exam.submitExam(
    sudoku.flatPuzzles.value,
    sudoku.totalHoles.value,
    timer.elapsedSeconds.value,
    config
  );

  if (result) {
    timer.stop();
    keypad.close();
    cloudRecords.saveRecord(result);
  }
}

// 重新开始当前这一套题
function handleRestartExam() {
  correctedPuzzleIds.value = new Set();
  isSingleRedoOpen.value = false;
  exam.restartCurrentExam();
  timer.reset();
  timer.start();
  keypad.close();
}

// 换一批全新试题（含防误触确认）
async function handleRegenerate() {
  if (!(await confirmAbandonExam("换一批将生成全新试卷"))) return;
  applyRegenerate();
}

function applyRegenerate() {
  correctedPuzzleIds.value = new Set();
  isSingleRedoOpen.value = false;
  sudoku.generateAll();
  snapshotAppliedStructure();
  exam.resetExam();
  timer.reset();
  keypad.close();
  nextTick(() => {
    scale.updateScale();
  });
}

// 试卷结构改变（页数、行数、难度分档、难度改变时自动重新生成，含防误触确认）
async function handleStructureChange() {
  const structureChanged =
    config.pagesCount !== appliedStructure.pagesCount ||
    config.rowsPerPage !== appliedStructure.rowsPerPage ||
    config.tierDivision !== appliedStructure.tierDivision ||
    config.difficulty !== appliedStructure.difficulty;
  if (!structureChanged) return;

  if (!(await confirmAbandonExam("修改规格将重新生成整套试卷"))) {
    // 取消修改：回滚下拉框到当前试卷实际采用的规格
    config.pagesCount = appliedStructure.pagesCount;
    config.rowsPerPage = appliedStructure.rowsPerPage;
    config.tierDivision = appliedStructure.tierDivision;
    config.difficulty = appliedStructure.difficulty as any;
    return;
  }

  applyRegenerate();
}

// 打印试卷
function handlePrint() {
  window.print();
}

// 从成绩弹窗直接打印批改试卷
function handlePrintFromScoreModal() {
  exam.closeScoreModal();
  nextTick(() => {
    window.print();
  });
}

// 重试云端同步
function handleRetrySync() {
  if (exam.currentResult.value) {
    cloudRecords.saveRecord(exam.currentResult.value);
  }
}

// 滚动时关闭小键盘防脱靶
function handlePreviewScroll() {
  if (keypad.isOpen.value) {
    keypad.close();
  }
}

// 点击工作区空白处关闭小键盘
function handleContainerClick(e: MouseEvent) {
  const target = e.target as HTMLElement;
  if (!target.closest(".sudoku-cell.empty") && !target.closest(".cell-keypad-popover")) {
    keypad.close();
  }
}

// 防误触：作答中关闭/刷新页面前提示（浏览器原生离页确认，无法自定义外观）
function handleBeforeUnload(e: BeforeUnloadEvent) {
  if (exam.status.value === "doing") {
    e.preventDefault();
    e.returnValue = "";
  }
}

onMounted(() => {
  window.addEventListener("beforeunload", handleBeforeUnload);
  window.addEventListener("resize", handleScreenResize);
  window.addEventListener("orientationchange", handleScreenResize);

  // 清理旧版无效缓存
  try {
    localStorage.removeItem("shudu_local_records");
  } catch (e) {}

  // 初始生成题目
  sudoku.generateAll();
  snapshotAppliedStructure();

  // 预拉取云端记录
  cloudRecords.loadHistory();

  nextTick(() => {
    scale.updateScale();
  });
});

onUnmounted(() => {
  window.removeEventListener("beforeunload", handleBeforeUnload);
  window.removeEventListener("resize", handleScreenResize);
  window.removeEventListener("orientationchange", handleScreenResize);
});
</script>

<style>
@import "./styles/index.css";

.app-layout {
  display: flex;
  width: 100%;
  min-height: 100vh;
  flex: 1;
}

@media (max-width: 960px) {
  .app-layout {
    flex-direction: column;
  }
}
</style>

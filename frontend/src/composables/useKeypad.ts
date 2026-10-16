import { ref, type CSSProperties } from "vue";
import type { ActiveCell } from "../types/exam";

export function useKeypad() {
  const activeCell = ref<ActiveCell | null>(null);
  const isOpen = ref(false);
  const placement = ref<"placement-bottom" | "placement-top">("placement-bottom");
  const arrowLeft = ref(50);
  const popoverLeft = ref(0);
  const popoverTop = ref(0);
  const hasUserVal = ref(false);

  function open(
    cellElem: HTMLElement,
    puzzleId: number,
    r: number,
    c: number,
    currentValExists: boolean
  ) {
    activeCell.value = {
      puzzleId,
      r,
      c,
      element: cellElem,
    };
    hasUserVal.value = currentValExists;
    isOpen.value = true;

    // 计算精准定位
    const cellRect = cellElem.getBoundingClientRect();
    const boardElem = cellElem.closest(".sudoku-board");
    const cardElem = cellElem.closest(".sudoku-card");

    const boardRect = boardElem ? boardElem.getBoundingClientRect() : cellRect;
    const cardRect = cardElem ? cardElem.getBoundingClientRect() : boardRect;

    const popoverWidth = currentValExists ? 256 : 210;
    const popoverHeight = 56;
    const gap = 8;

    // 1. 水平定位：以数独盘面中心为基准居中，并防止屏幕两侧溢出
    let popoverCenterX = boardRect.left + boardRect.width / 2;
    const minCenterX = popoverWidth / 2 + 10;
    const maxCenterX = window.innerWidth - popoverWidth / 2 - 10;
    popoverCenterX = Math.max(minCenterX, Math.min(maxCenterX, popoverCenterX));

    // 2. 指示箭头：精准指向当前点击方格的水平中心
    const cellCenterX = cellRect.left + cellRect.width / 2;
    const leftEdge = popoverCenterX - popoverWidth / 2;
    let arrowX = cellCenterX - leftEdge;
    arrowX = Math.max(16, Math.min(popoverWidth - 16, arrowX));
    arrowLeft.value = arrowX;

    // 3. 垂直定位：绝对不遮挡 [boardRect.top, boardRect.bottom] 宫格区域
    const spaceBelow = window.innerHeight - boardRect.bottom;
    const spaceAbove = cardRect.top;
    const needSpace = popoverHeight + gap + 10;

    let top = 0;
    if (spaceBelow >= needSpace || spaceBelow >= spaceAbove) {
      placement.value = "placement-bottom";
      top = boardRect.bottom + gap;
    } else {
      placement.value = "placement-top";
      const anchorTop =
        cardRect.top >= popoverHeight + gap + 8 ? cardRect.top : boardRect.top;
      top = anchorTop - gap - popoverHeight;
    }

    popoverLeft.value = popoverCenterX;
    popoverTop.value = top;
  }

  function close() {
    activeCell.value = null;
    isOpen.value = false;
  }

  return {
    activeCell,
    isOpen,
    placement,
    arrowLeft,
    popoverLeft,
    popoverTop,
    hasUserVal,
    open,
    close,
  };
}

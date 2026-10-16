import { onMounted, onUnmounted } from "vue";
import type { ActiveCell } from "../types/exam";

interface KeyboardOptions {
  onFill: (val: number) => void;
  onEscape: () => void;
  onRegenerate: () => void;
  getActiveCell: () => ActiveCell | null;
}

export function useKeyboard(options: KeyboardOptions) {
  function handleKeyDown(e: KeyboardEvent) {
    const activeCell = options.getActiveCell();

    // 1. Esc 优先关闭任何浮层
    if (e.key === "Escape") {
      options.onEscape();
      return;
    }

    // 2. 处于输入激活状态时的按键处理
    if (activeCell) {
      if (["1", "2", "3", "4"].includes(e.key)) {
        e.preventDefault();
        options.onFill(parseInt(e.key, 10));
        return;
      }

      const letterMap: Record<string, number> = {
        a: 1,
        b: 2,
        c: 3,
        d: 4,
        A: 1,
        B: 2,
        C: 3,
        D: 4,
      };
      if (letterMap[e.key]) {
        e.preventDefault();
        options.onFill(letterMap[e.key]);
        return;
      }

      if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        options.onFill(0);
        return;
      }
    }

    // 3. 全局按键 R（未激活单元格且焦点不在输入框时重新生成）
    const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
    if (["input", "select", "textarea"].includes(targetTag)) {
      return;
    }

    if (e.key.toLowerCase() === "r" && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      options.onRegenerate();
    }
  }

  onMounted(() => {
    window.addEventListener("keydown", handleKeyDown);
  });

  onUnmounted(() => {
    window.removeEventListener("keydown", handleKeyDown);
  });
}

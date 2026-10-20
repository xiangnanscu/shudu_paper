import { reactive, ref } from "vue";

export type ConfirmVariant = "info" | "warning" | "danger" | "success";

export interface ConfirmStat {
  label: string;
  value: string;
}

export interface ConfirmOptions {
  icon?: string;
  title: string;
  message?: string;
  variant?: ConfirmVariant;
  confirmText?: string;
  cancelText?: string;
  /** 为 true 时仅显示确认按钮（用于提示类弹窗，替代原生 alert） */
  hideCancel?: boolean;
  /** 可选的统计信息卡片（如题数 / 空格数 / 难度） */
  stats?: ConfirmStat[];
}

export interface ConfirmDialogState {
  icon: string;
  title: string;
  message: string;
  variant: ConfirmVariant;
  confirmText: string;
  cancelText: string;
  hideCancel: boolean;
  stats: ConfirmStat[];
}

const DEFAULT_STATE: ConfirmDialogState = {
  icon: "💡",
  title: "",
  message: "",
  variant: "info",
  confirmText: "确定",
  cancelText: "取消",
  hideCancel: false,
  stats: [],
};

/**
 * 自定义确认弹窗（Promise 风格，替代原生 confirm/alert）
 *
 * const { showConfirm } = useConfirmDialog();
 * if (await showConfirm({ title: "确定吗？" })) { ... }
 */
export function useConfirmDialog() {
  const isOpen = ref(false);
  const state = reactive<ConfirmDialogState>({ ...DEFAULT_STATE });

  let resolver: ((ok: boolean) => void) | null = null;

  function showConfirm(options: ConfirmOptions): Promise<boolean> {
    Object.assign(state, DEFAULT_STATE, options);
    isOpen.value = true;
    return new Promise<boolean>((resolve) => {
      resolver = resolve;
    });
  }

  function settle(ok: boolean) {
    if (!isOpen.value) return;
    isOpen.value = false;
    resolver?.(ok);
    resolver = null;
  }

  return {
    isOpen,
    state,
    showConfirm,
    confirm: () => settle(true),
    cancel: () => settle(false),
  };
}

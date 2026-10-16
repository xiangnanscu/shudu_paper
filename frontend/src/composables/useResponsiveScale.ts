import { ref, onMounted, onUnmounted, watch, type Ref } from "vue";

export function useResponsiveScale(
  previewAreaRef: Ref<HTMLElement | null>,
  pagesCount: Ref<number>,
  appendAnswerPage: Ref<boolean>
) {
  const scale = ref(1);
  const containerHeight = ref<string>("auto");
  const containerMarginBottom = ref<string>("0px");

  function updateScale() {
    if (!previewAreaRef.value) return;

    // A4 宽度 210mm 在标准 96dpi 下约为 794px
    const standardWidth = 794;
    const availableWidth =
      previewAreaRef.value.clientWidth -
      (window.innerWidth <= 768 ? 16 : 48);

    if (availableWidth < standardWidth) {
      const s = Math.max(0.38, Math.min(1, availableWidth / standardWidth));
      scale.value = s;

      // 补偿因 transform scale 产生的空间间隙 (A4 高度约为 1123px)
      const standardHeight = 1123;
      const examPages = pagesCount.value || 1;
      const totalPageCount = appendAnswerPage.value
        ? examPages * 2
        : examPages;
      const originalTotalHeight = (standardHeight + 24) * totalPageCount;

      containerHeight.value = `${originalTotalHeight * s}px`;
      containerMarginBottom.value = "24px";
    } else {
      scale.value = 1;
      containerHeight.value = "auto";
      containerMarginBottom.value = "0px";
    }
  }

  onMounted(() => {
    updateScale();
    window.addEventListener("resize", updateScale);
    window.addEventListener("orientationchange", () => {
      setTimeout(updateScale, 200);
    });
  });

  onUnmounted(() => {
    window.removeEventListener("resize", updateScale);
  });

  // 当页数或答案设置改变时重新计算高度
  watch([pagesCount, appendAnswerPage], () => {
    updateScale();
  });

  return {
    scale,
    containerHeight,
    containerMarginBottom,
    updateScale,
  };
}

import { ref, onMounted, onUnmounted, watch, nextTick, type Ref } from "vue";

export function useResponsiveScale(
  previewAreaRef: Ref<HTMLElement | null>,
  pagesCount: Ref<number>,
  appendAnswerPage: Ref<boolean>
) {
  const scale = ref(1);
  const containerHeight = ref<string>("auto");
  const containerMarginBottom = ref<string>("0px");
  let resizeObserver: ResizeObserver | null = null;

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
    // 首次多重校准，确保布局稳定和首屏渲染完成
    updateScale();
    nextTick(() => {
      updateScale();
      requestAnimationFrame(updateScale);
    });

    // 使用 ResizeObserver 监听 previewArea 真实容器尺寸变化
    if (previewAreaRef.value && typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        updateScale();
      });
      resizeObserver.observe(previewAreaRef.value);
    }

    window.addEventListener("resize", updateScale);
    window.addEventListener("orientationchange", () => {
      setTimeout(updateScale, 200);
    });
  });

  onUnmounted(() => {
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
    window.removeEventListener("resize", updateScale);
  });

  // 当页数或答案设置改变时重新计算高度
  watch([pagesCount, appendAnswerPage], () => {
    nextTick(updateScale);
  });

  return {
    scale,
    containerHeight,
    containerMarginBottom,
    updateScale,
  };
}

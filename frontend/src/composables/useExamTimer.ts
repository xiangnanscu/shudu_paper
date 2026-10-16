import { ref, computed } from "vue";

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function useExamTimer() {
  const elapsedSeconds = ref(0);
  let timerInterval: ReturnType<typeof setInterval> | null = null;

  const formattedTime = computed(() => formatTime(elapsedSeconds.value));

  function start() {
    stop();
    timerInterval = setInterval(() => {
      elapsedSeconds.value++;
    }, 1000);
  }

  function stop() {
    if (timerInterval !== null) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function reset() {
    stop();
    elapsedSeconds.value = 0;
  }

  return {
    elapsedSeconds,
    formattedTime,
    start,
    stop,
    reset,
  };
}

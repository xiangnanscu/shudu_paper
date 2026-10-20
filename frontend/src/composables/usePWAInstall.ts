import { ref, onMounted, onUnmounted } from "vue";

// Holds the deferred prompt across components
let deferredPrompt: any = null;

const canInstall = ref(false);
const isStandalone = ref(false);
const isIOS = ref(false);
const showIOSGuide = ref(false);
const installSuccess = ref(false);

export function usePWAInstall() {
  function checkStandalone() {
    if (typeof window === "undefined") return false;
    const isStandaloneMedia = window.matchMedia("(display-mode: standalone)").matches;
    const isNavigatorStandalone = (window.navigator as any)?.standalone === true;
    return isStandaloneMedia || isNavigatorStandalone;
  }

  function checkIOS() {
    if (typeof window === "undefined") return false;
    const ua = window.navigator.userAgent;
    const isIosDevice = /iPad|iPhone|iPod/.test(ua);
    const isIpadOS =
      window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1;
    return (isIosDevice || isIpadOS) && !(window as any).MSStream;
  }

  function handleBeforeInstallPrompt(e: Event) {
    e.preventDefault();
    deferredPrompt = e;
    canInstall.value = true;
  }

  function handleAppInstalled() {
    deferredPrompt = null;
    canInstall.value = false;
    isStandalone.value = true;
    installSuccess.value = true;
  }

  onMounted(() => {
    isStandalone.value = checkStandalone();
    isIOS.value = checkIOS();

    // If already in standalone mode, no need to offer installation
    if (isStandalone.value) {
      canInstall.value = false;
      return;
    }

    // For iOS, if not standalone, we can offer the iOS guide
    if (isIOS.value) {
      canInstall.value = true;
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
  });

  onUnmounted(() => {
    window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.removeEventListener("appinstalled", handleAppInstalled);
  });

  async function promptInstall(): Promise<"accepted" | "dismissed" | "ios_guide" | "unavailable"> {
    if (isStandalone.value) {
      return "unavailable";
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        deferredPrompt = null;
        canInstall.value = false;
        return "accepted";
      }
      return "dismissed";
    }

    if (isIOS.value) {
      showIOSGuide.value = true;
      return "ios_guide";
    }

    return "unavailable";
  }

  function closeIOSGuide() {
    showIOSGuide.value = false;
  }

  function openIOSGuide() {
    showIOSGuide.value = true;
  }

  return {
    canInstall,
    isStandalone,
    isIOS,
    showIOSGuide,
    installSuccess,
    promptInstall,
    openIOSGuide,
    closeIOSGuide,
  };
}

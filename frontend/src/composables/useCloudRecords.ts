import { ref, computed } from "vue";
import type { ExamRecordEntity, ExamStats } from "../types/record";
import type { ExamResult } from "../types/exam";
import { getClientUuid } from "../core/client-uuid";

const OFFLINE_QUEUE_KEY = "shudu_offline_records_queue";
const CACHED_RECORDS_KEY = "shudu_cached_records";
const CACHED_STATS_KEY = "shudu_cached_stats";

export interface TimelineGroup {
  key: string;
  label: string;
  list: ExamRecordEntity[];
}

export function useCloudRecords() {
  const isDrawerOpen = ref(false);
  const loading = ref(false);
  const loadError = ref<string | null>(null);

  const stats = ref<ExamStats>({
    totalRecords: 0,
    maxScore: 0,
    avgScore: 0,
    totalTimeSpent: 0,
  });

  const records = ref<ExamRecordEntity[]>([]);

  // 云端同步状态 (新增离线暂存状态 offline_saved)
  const syncStatus = ref<"idle" | "syncing" | "success" | "error" | "offline_saved">("idle");
  const syncError = ref<string | null>(null);

  // 离线队列同步处理
  async function syncOfflineQueue() {
    if (typeof window === "undefined" || !navigator.onLine) return;
    try {
      const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
      if (!raw) return;
      const queue: any[] = JSON.parse(raw);
      if (!Array.isArray(queue) || queue.length === 0) return;

      const remaining: any[] = [];
      for (const payload of queue) {
        try {
          const res = await fetch("/api/records", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          if (!data.success) throw new Error(data.error || "同步失败");
        } catch {
          remaining.push(payload);
        }
      }

      if (remaining.length > 0) {
        localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining));
      } else {
        localStorage.removeItem(OFFLINE_QUEUE_KEY);
        // 队列全部补传成功后拉取最新云端历史
        await loadHistory();
      }
    } catch (e) {
      console.warn("Sync offline queue error:", e);
    }
  }

  // 监听网络重新连接事件
  if (typeof window !== "undefined") {
    window.addEventListener("online", () => {
      syncOfflineQueue();
    });
  }

  // 从本地缓存加载离线快照
  function loadCachedLocalData() {
    try {
      const cachedRec = localStorage.getItem(CACHED_RECORDS_KEY);
      const cachedSt = localStorage.getItem(CACHED_STATS_KEY);
      if (cachedRec) {
        records.value = JSON.parse(cachedRec);
      }
      if (cachedSt) {
        stats.value = JSON.parse(cachedSt);
      }
    } catch (err) {
      console.warn("Failed to load local cached records:", err);
    }
  }

  // 时间段分组
  const groupedRecords = computed<TimelineGroup[]>(() => {
    const groups: Record<string, TimelineGroup> = {
      today: { key: "today", label: "今天", list: [] },
      yesterday: { key: "yesterday", label: "昨天", list: [] },
      last7days: { key: "last7days", label: "近 7 天", list: [] },
      earlier: { key: "earlier", label: "更早之前", list: [] },
    };

    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    ).getTime();
    const yesterdayStart = todayStart - 86400000;
    const sevenDaysStart = todayStart - 7 * 86400000;

    records.value.forEach((rec) => {
      const timeStr =
        rec.created_at || rec.createdAt || new Date().toISOString();
      const recTime = new Date(timeStr).getTime();

      if (recTime >= todayStart) {
        groups.today.list.push(rec);
      } else if (recTime >= yesterdayStart) {
        groups.yesterday.list.push(rec);
      } else if (recTime >= sevenDaysStart) {
        groups.last7days.list.push(rec);
      } else {
        groups.earlier.list.push(rec);
      }
    });

    return Object.values(groups).filter((g) => g.list.length > 0);
  });

  async function loadHistory() {
    loading.value = true;
    loadError.value = null;
    const clientUuid = getClientUuid();

    // 先尝试触发排队的离线数据补传
    syncOfflineQueue();

    try {
      const res = await fetch(`/api/records?clientUuid=${encodeURIComponent(clientUuid)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "云端读取失败");

      records.value = data.records || [];
      stats.value = data.stats || {
        totalRecords: 0,
        maxScore: 0,
        avgScore: 0,
        totalTimeSpent: 0,
      };

      // 成功获取后更新本地离线快照
      try {
        localStorage.setItem(CACHED_RECORDS_KEY, JSON.stringify(records.value));
        localStorage.setItem(CACHED_STATS_KEY, JSON.stringify(stats.value));
      } catch {}
    } catch (e: any) {
      console.warn("Load history from cloud failed, fallback to local cache:", e);
      // 离线优雅降级：读取缓存
      loadCachedLocalData();
      if (records.value.length > 0) {
        loadError.value = "当前处于离线状态，正在显示已缓存的历史记录";
      } else {
        loadError.value = e.message || "网络异常，未能成功连接云端数据库";
      }
    } finally {
      loading.value = false;
    }
  }

  async function saveRecord(result: ExamResult) {
    syncStatus.value = "syncing";
    syncError.value = null;

    const clientUuid = getClientUuid();
    const payload = {
      ...result,
      clientUuid,
    };

    // 检查是否离线
    const isOffline = typeof navigator !== "undefined" && !navigator.onLine;

    if (isOffline) {
      // 离线暂存队列
      enqueueOfflineRecord(payload, result);
      return;
    }

    try {
      const res = await fetch("/api/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "云端存储未响应成功");

      syncStatus.value = "success";
      // 静默拉取最新列表
      loadHistory();
    } catch (err: any) {
      console.warn("Save to cloud failed, saving to offline queue:", err);
      // 网络波动报错也进入离线保护队列，保证用户数据绝不丢失
      enqueueOfflineRecord(payload, result);
    }
  }

  function enqueueOfflineRecord(payload: any, result: ExamResult) {
    try {
      const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
      const queue = raw ? JSON.parse(raw) : [];
      queue.push(payload);
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));

      // 乐观更新当前记录与本地统计快照
      const optimisticRecord: ExamRecordEntity = {
        id: "offline_" + Date.now(),
        client_uuid: payload.clientUuid,
        score: result.score,
        time_spent: result.timeSpent,
        total_puzzles: result.totalPuzzles,
        correct_puzzles: result.correctPuzzles,
        total_holes: result.totalHoles,
        correct_holes: result.correctHoles,
        difficulty: result.difficulty,
        pages_count: result.pagesCount,
        rows_per_page: result.rowsPerPage,
        created_at: new Date().toISOString(),
      };
      records.value.unshift(optimisticRecord);

      syncStatus.value = "offline_saved";
      syncError.value = null;
    } catch (e: any) {
      syncStatus.value = "error";
      syncError.value = "本地存储异常，暂存失败";
    }
  }

  function openDrawer() {
    isDrawerOpen.value = true;
    loadHistory();
  }

  function closeDrawer() {
    isDrawerOpen.value = false;
  }

  return {
    isDrawerOpen,
    loading,
    loadError,
    stats,
    records,
    groupedRecords,
    syncStatus,
    syncError,
    loadHistory,
    saveRecord,
    openDrawer,
    closeDrawer,
    syncOfflineQueue,
  };
}

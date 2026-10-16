import { ref, computed } from "vue";
import type { ExamRecordEntity, ExamStats } from "../types/record";
import type { ExamResult } from "../types/exam";
import { getClientUuid } from "../core/client-uuid";

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

  // 云端同步状态
  const syncStatus = ref<"idle" | "syncing" | "success" | "error">("idle");
  const syncError = ref<string | null>(null);

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
    } catch (e: any) {
      console.error("Load history from cloud failed:", e);
      loadError.value = e.message || "网络异常，未能成功连接云端数据库";
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
      console.error("Save to cloud failed:", err);
      syncStatus.value = "error";
      syncError.value = err.message || "网络异常，云端保存失败";
    }
  }

  async function deleteRecord(id: string) {
    if (!confirm("确定要删除这条答题记录吗？删除后不可恢复。")) {
      return;
    }

    try {
      const res = await fetch(`/api/records/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "删除失败");
      }
      await loadHistory();
    } catch (e: any) {
      alert("云端删除失败: " + (e.message || "网络异常"));
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
    deleteRecord,
    openDrawer,
    closeDrawer,
  };
}

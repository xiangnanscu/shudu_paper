# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 常用命令

### 开发与本地调试
- `npm run dev`：启动前端 Vite 开发服务（端口 `5173`，自动反向代理 `/api` 到 `http://localhost:8787`）。
- `npm run dev:worker`：启动本地 Cloudflare Worker 与 D1 数据库环境（通过 Wrangler 运行在 `http://localhost:8787`）。

### 构建与部署
- `npm run build`：执行生产环境打包（自动运行 `generate-icons` 生成 PWA 图标，并将 Vite 前端产物编译输出至根目录 `public/`）。
- `npm run build:frontend`：前端构建核心命令（生成图标并执行 Vite 构建）。
- `npm run generate-icons`：单独运行基于 Sharp 的高清 PWA 应用图标生成脚本。
- `npm run deploy`：构建并一键部署至 Cloudflare 生产环境（`npm run build && wrangler deploy`）。

### 类型检查
本项目未配置独立测试框架（如 Vitest/Jest），日常开发与提交前使用 TypeScript 编译器进行类型检查：
- 前端类型检查：`npx vue-tsc --noEmit -p frontend/tsconfig.json`
- 后端 Worker 类型检查：`npx tsc --noEmit`

---

## 架构与核心工作流

本项目是一套专为儿童思维启蒙设计的四宫格数独试卷生成与在线答题系统，同时支持高保真 A4 纸张排版打印、在线答题及 100 分制自动批改打分、PWA 离线运行和云端做题记录持久化。

### 全栈架构总览
- **前端 SPA / PWA**：位于 `frontend/` 目录，技术栈为 Vue 3（Composition API）+ TypeScript + Vite + `vite-plugin-pwa`。打包输出路径直接重定向为根目录的 `public/`。
- **后端 Serverless 服务**：单文件 Cloudflare Worker（位于 `src/index.ts`），连接 Cloudflare D1 关系型数据库（`shudu_paper_db`，数据库表结构定义见 `schema.sql`）。
- **静态资源托管与路由分发**：由 `wrangler.jsonc` 统一管理 Cloudflare Workers Assets：
  - `run_worker_first: ["/api/*"]`：所有 `/api/*` 请求优先交由 Worker 逻辑处理。
  - `not_found_handling: "single-page-application"`：其他非 API 请求统一回退至 `public/index.html`，实现前端 SPA 路由接管。

### 后端 API 规范 (`src/index.ts`)
- `POST /api/records`：接收并存储答题成绩、耗时、难度、题型符号、总空位数/做对数，以及包含题目快照和作答详情的 JSON 载荷（`detail_json`）。
- `GET /api/records?clientUuid=...`：根据客户端匿名 UUID 查询用户的聚合统计数据（练习总数、历史最高分、平均分、累计耗时）与最近历史做题记录列表。
- `GET /api/records/:id`：查询单次做题的完整题目快照与对错明细。
- `DELETE /api/records/:id`：返回 HTTP 403 明确禁止删除，保障做题记录的完整性与真实性。

### 前端分层架构 (`frontend/src/`)
- **`core/`（纯 TypeScript 算法层，无框架依赖）**：
  - `engine.ts`：4x4 数独回溯生成算法、唯一解验证（`countSolutions`）、挖空逻辑，以及两格假设法特征提取分析（`analyzeHypothesisFeatures`）。
  - `difficulty.ts`：已知数（线索数）分配策略，支持入门、初级、中级、高级、随机、全卷混合，以及专门的中级假设法专项训练（`medium_hypo_*`）。
  - `symbols.ts`：符号集字典，支持 5 种题型（经典数字 `1-4`、英文字母 `A-D`、几何图形 `●▲■★`、趣味水果、萌趣动物）。
  - `client-uuid.ts`：持久化在 `localStorage` 的客户端匿名唯一标识，支持无登录体系下的多端数据隔离与记录归属。
- **`composables/`（响应式状态管理与业务逻辑）**：
  - `useSudoku.ts`：试卷生成、多页切片、题目尺寸与字号自适应计算。
  - `useExam.ts`：考试状态机调度（`ready` 准备 -> `doing` 做题中 -> `submitted` 已提交）、答题数据追踪及 100 分制评分判定。
  - `useCloudRecords.ts`：与云端 API 交互，按时间轴（今天、昨天、近7天、更早之前）智能聚类分组；内置**离线暂存队列（`shudu_offline_records_queue`）**，断网做题本地暂存并在连网后自动静默补传。
  - `useKeypad.ts` / `useKeyboard.ts`：浮动选择面板（Popover）的坐标定位及物理键盘（数字键 1-4、字母键 A-D、方向键、退格键）交互。
  - `useResponsiveScale.ts`：移动端与平板设备上的 A4 试卷等比缩放计算引擎（`paper-scale-container`），确保小屏设备上无横向滚动条并完整贴合。
  - `usePWAInstall.ts`：PWA 安装引导与 iOS Safari 添加主屏幕弹窗提示。
- **`components/`（视图组件）**：
  - `paper/`：高保真 A4 试卷渲染组件；在 `@media print` 打印模式下自动隐藏所有交互按钮与浮层，保持纯净排版。
  - `sidebar/`：左侧出题与格式设置面板（在移动端自动转换为抽屉式交互）。
  - `drawer/`：微信小程序风格的侧滑做题记录抽屉与学习统计看板。
  - `exam/`：吸顶考试状态工具栏（`ExamTopBar.vue`）、浮动填题面板（`KeypadPopover.vue`）与得分评语勋章弹窗（`ScoreModal.vue`）。
  - `review/`：历史试卷详情查看与复盘回放模态窗（`ExamReviewModal.vue`）、全局作答总览（`ReviewPaperOverview.vue`，支持填数顺序角标）与动态步骤推演播放器（`ReviewStepPlayer.vue`，支持单步回放、滑块进度、自动播放与冲突诊断）。

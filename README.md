# 四宫格数独试卷生成与在线答题系统 (A4 打印 & 智能评分全栈版)

专为儿童逻辑思维启蒙与数独教学设计的**四宫格数独智能练习与试卷生成系统**。既支持高保真 **A4 纸张排版打印**，又支持**网页/手机/平板直接交互做题、100分制自动批改打分、微信小程序风格做题记录与时间轴统计**，并基于 Cloudflare Workers + D1 数据库实现云端持久化。

---

## 🌟 核心特性

### 1. 网页直接交互做题（保持原有 A4 外观不变）
- **无损排版**：完全保留原有的标准 A4 试卷外观、比例、三列栅格与粗线边框，既可打印又可在屏幕上直接做题。
- **浮动选择面板 (Popover)**：点击任意空白区域，自动弹出匹配当前题型的浮动选择面板：
  - 经典数字：`1, 2, 3, 4` + `⌫ 清除`
  - 英文字母：`A, B, C, D` + `⌫ 清除`
  - 几何图形：`●, ▲, ■, ★` + `⌫ 清除`
  - 趣味水果：`🍎, 🍌, 🍇, 🍓` + `⌫ 清除`
  - 萌趣动物：`🐱, 🐶, 🐰, 🐼` + `⌫ 清除`
- **连填与键盘快捷支持**：填入后自动聚焦下一个空格；同时支持物理键盘直接按 `1~4` 或 `A~D` 键填入、`Backspace` 清除、方向键切换。

### 2. 试卷上方状态栏与 100 分自动评分
- **吸顶做题工具栏**：位于试卷上方，常驻展示**做题计时器（分:秒）**、**填空进度条**、**交卷评分按钮**与**做题记录入口**。
- **100 分制智能评分**：
  - 基于总待填空格与正确空格科学打分：$\text{Score} = \text{round}(CorrectHoles / TotalHoles \times 100)$。
- **卷面即时批改反馈**：
  - **卷头考务栏**：自动盖上大红色手写体风格得分印章（如 `💯 100分`），并自动回填实际耗时（如 `3分25秒`）与日期。
  - **对错状态显色**：做对的空格以浅绿色背景标注对勾 `✓`；做错的空格以浅红色标注，划掉错误答案并展示正确答案；漏填空格标黄提示。
- **成绩勋章弹窗**：弹出精美评价弹窗（满分奖杯撒花、等级评语、正确率、全对题数等）。

### 3. 后端持久化与微信小程序风格做题记录
- **Cloudflare Workers + D1 数据库**：采用 Serverless SQLite 实时记录每次做题成绩、耗时、题型、题目快照与对错详情。
- **微信小程序风格侧滑抽屉**：
  - **顶部学习看板**：练习总次数、历史最高分（金色奖章）、平均得分、累计练习时长。
  - **时间段智能聚类**：自动按 **“今天”**、**“昨天”**、**“近 7 天”**、**“更早之前”** 分组展示做题卡片。
  - **卡片精美信息**：动态颜色圆形得分徽章、难度、题量、题型、耗时、具体时刻，记录真实完整不可篡改与删除。

### 4. 手机与平板竖屏响应式优化
- **左侧配置面板弹出抽屉化**：在手机或平板竖屏模式下，左侧侧边栏自动收纳为向左滑出的抽屉，顶部保留悬浮“⚙️ 出题设置”按钮，主体 100% 留给试卷。
- **A4 试卷等比动态缩放**：针对小屏设备内置 `paper-scale-container` 动态缩放引擎，在 iPhone、iPad 竖屏上整张 A4 试卷以完美比例 100% 贴合屏幕宽度完整呈现，杜绝横向滚动。
- **触控优化**：按钮与按键严格遵循 ≥44px 触控热区标准，点击顺滑灵敏。

### 5. PWA 原生级桌面与平板安装支持
- **全平台一键安装**：支持在 iPad、Android 平板、Windows、macOS 和手机上作为独立 App 安装到桌面，享受无浏览器地址栏的全屏沉浸式刷题体验。
- **离线自治与离线做题**：数独生成、作答、智能评分核心算法 100% 前端本地运行，断网或无信号环境下可完整出题与答题。
- **做题记录离线队列与自动补传**：离线提交答卷时自动暂存至本地队列，恢复连网后自动触发静默补传至云端数据库。
- **设备专属引导**：针对 iOS/iPadOS Safari 提供专属图文安装指引；在 Chromium/桌面端提供一键安装按钮。
- **安全区域与高清矢量图标**：全套适配标准 192x192、512x512、Maskable 自适应图标与 Apple Touch Icon，全面支持全面屏 Safe Area。

### 6. 专业 A4 打印保障
- 打印时自动隐藏所有在线做题按钮、状态栏、抽屉与弹窗，零多余空白页，保持原汁原味的高清教学习题纸。

---

## 🌐 在线访问入口

- **自定义域名**：[https://shudu-paper.toreal.site](https://shudu-paper.toreal.site)
- **Workers 备用入口**：[https://shudu-paper.torealsite.workers.dev](https://shudu-paper.torealsite.workers.dev)

> 注：根据 RFC 1123 / RFC 952 互联网域名规范，DNS 主机名不允许包含下划线（`_`），因此子域名采用合规的标准连字符 `shudu-paper.toreal.site`。

---

## 📁 项目结构

```text
shudu_paper/
├── frontend/                   # Vue 3 + TypeScript 前端源码工程
│   ├── index.html              # 前端 SPA 入口
│   ├── vite.config.ts          # Vite 构建配置（产物直接输出至 ../public）
│   ├── tsconfig.json           # 前端独立 TypeScript 配置
│   └── src/
│       ├── main.ts             # 应用入口
│       ├── App.vue             # 顶层布局与状态组装
│       ├── core/               # 纯 TypeScript 算法层 (数独回溯引擎、难度策略、符号映射)
│       ├── composables/        # 响应式状态管理 (useSudoku, useExam, useKeypad, useCloudRecords 等)
│       ├── components/         # 细粒度组件 (Sidebar, Paper, Exam, Drawer 等)
│       ├── styles/             # 模块化样式表 (variables, paper, sudoku, print 等)
│       └── types/              # 领域模型与接口契约
├── public/                     # Vite 生产构建产物（由 Cloudflare Workers Assets 托管）
│   ├── index.html
│   └── assets/
├── src/                        # 后端 Cloudflare Worker
│   └── index.ts                # RESTful API (/api/records) 与 D1 数据库交互
├── schema.sql                  # Cloudflare D1 数据库表结构与索引
├── wrangler.jsonc              # Cloudflare Workers + D1 + 域名配置
├── package.json                # 工程配置与统一脚本
├── tsconfig.json               # Cloudflare Worker 后端 TS 配置
└── README.md                   # 项目文档
```

---

## 🛠️ 本地开发与部署指令

```bash
# 1. 安装项目依赖
npm install

# 2. 启动前端 Vite 极速热更新开发服务 (默认端口 5173，自动反代 /api 至后端)
npm run dev

# 3. 启动本地 Worker + D1 数据库服务
npm run dev:worker

# 4. 执行前端生产打包 (自动输出到 public/ 目录)
npm run build

# 5. 一键打包并部署至 Cloudflare 生产环境
npm run deploy
```

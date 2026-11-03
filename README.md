# 酒馆战棋 · 全种族最优解手册

> 11 个种族 × 7 格站位 × 一条指数曲线。  
> 不只告诉你「摆什么」，更讲清楚**为什么**——为什么同样的 7 个格子，有人只能烂分，有人能把身材堆到上万。

[![Deploy](https://github.com/nikomao/tavern-tome/actions/workflows/pages.yml/badge.svg)](https://github.com/nikomao/tavern-tome/actions/workflows/pages.yml)

[在线预览](https://nikom-blog.org/) · [版本快照](#版本) · [MIT / CC BY-NC-SA](#许可)

![页面预览](preview.png)

## 为什么做这个

大多数阵容攻略是「抄作业」：告诉你带哪 7 张牌，却不解释原因。  
这个项目想把酒馆战棋当成一个**成长系统**来讲清楚：

- 为什么加法永远打不过乘法
- 为什么经济等于「触发次数」
- 为什么站位本质是「攻击次数的分配方案」
- 为什么一张全种族融合怪 + 一条乘数链，能把 4/4 推成 65,536

## 内容

| 章节 | 讲什么 |
| --- | --- |
| 00 从零开始 | 目标、一回合循环、前 10 回合节奏、酒馆等级、选牌四问、**10 回合模拟器** |
| 周报 | 本周最强组合（T0/T1/T2）、核心卡、强弱与克制 |
| 英雄 / 饰品 | 选择原则 + 本周梯度（T0/T1/T2） |
| 阵容反查 | 输入英雄 + 最多 3 张牌，推荐最该玩的流派 |
| 卡池 | 1218 张卡的独立查询页（本 / 种族 / 类型 / 关键词） |
| 01 三条底层定律 | 加法/乘法、经济=触发、站位=分配 |
| 02 成长数学 | 线性 vs 复利、乘数链、可交互成长模拟器（线性/对数） |
| 03 融合怪专题 | 全种族标签、喝茶体系骨架、4⁸ = 65,536 的推导 |
| 04 站位总纲 | 7 格功能分区、12 条铁律、针对矩阵 |
| 05 全种族图鉴 | 11 个种族：卡图、核心组件、标准站位、终盘 7 格 |
| 06–08 | 一页速查、一局四次决策、22 条术语 |

### 11 个种族

畸变怪 · 元素 · 恶魔 · 纳迦 · 海盗 · 野兽 · 龙 · 机械 · 鱼人 · 亡灵 · 野猪人

每个种族包含：梯度定位、核心组件（带卡图与官方名）、7 格站位、运营节奏、为什么强、天敌、常见错误。

## 特性

- **纯静态**：无框架、无构建、无后端，双击 `index.html` 就能看
- **离线可用 & PWA 支持**：配备 `sw.js` 与 `manifest.json`，可安装到手机/桌面离线使用，卡图本地化
- **种族成长流水线**：每个种族讲透「核心资源从何而来」、「身材贴给谁（载体选择）」与「从零到上万三阶成长链（加法→乘数→复利）」
- **本周最佳深度指南**：不仅给出 7 张卡，更拆解「为什么是本周最佳」、基于卡牌的联动闭环，以及新手实操三步法
- **卡牌识别**：悬停/点击卡图，查看官方全名、酒馆等级、身材、种族、完整效果
- **第一局模拟器**：10 个回合的教练模式，每步给反馈与结算评分
- **每周环境榜**：本周最强组合 + 核心卡 + 克制关系，每周改 `data.js` 的 `META` 即可
- **完整卡池**：1218 张酒馆战棋卡，按本 / 种族 / 类型 / 关键词搜索，点卡看完整效果，并可跳到对应流派
- **阵容反查**：选英雄 + 手里的牌，按核心/种族/关键词打分，给出前 3 个方向和理由
- **酒馆视觉**：木质、黄铜、烛光，灯笼与火星动画（尊重系统的"减少动态效果"）
- **繁中自动构建**：`node scripts/build_zhtw.mjs` 自动同步对齐台服术语（手下/死亡之聲/聖盾術/合體等）
- **3 套方案**：每个种族都有「标准 / 低配 / 混搭」三套 7 格终盘，并写明拿到什么牌才玩
- **教学动画**：三条定律各配一个可播放的小演示（加乘赛跑、触发次数、站位对打）
- **可交互**：翻倍积木逐格点亮、乘数链逐段展开、成长模拟器带三档预设
- **响应式**：桌面与手机都能读

## 快速开始

```bash
git clone https://github.com/nikomao/tavern-tome.git
cd tavern-tome
```

直接双击 `index.html`，或起一个静态服务器：

```bash
python -m http.server 8080
# 打开 http://localhost:8080
```

## 目录结构

```
tavern-tome/
├── index.html            # 页面结构（八个章节与深度指南）
├── styles.css            # 暗色视觉样式与响应式布局
├── app.js                # 核心渲染、种族标签页与卡牌浮窗
├── sim.js                # 成长数学模拟器 + 10回合教练模式
├── finder.js             # 阵容反查推荐器
├── search.js             # 全局快捷搜索 (Cmd/Ctrl + K)
├── comp-notes.js         # 本周最佳深度指南（为什么最佳、卡牌成长闭环、三步实操）
├── data.js               # 11 个种族（含资源运用、载体、三阶成长链）、站位数据
├── cards.js              # 卡牌别名与官方数据映射
├── cards.html            # 卡池查询页
├── sw.js                 # PWA Service Worker 离线缓存
├── manifest.json         # PWA 安装清单
├── scripts/
│   ├── build_zhtw.mjs    # 自动化同步构建繁体中文版 (zh-TW)
│   ├── fetch_cards.py    # 抓取并压缩卡图
│   └── fetch_firestone.mjs # 抓取真实天梯大数据
├── zh-TW/                # 自动化生成的繁体中文版
├── preview.png           # 预览图
├── LICENSE               # MIT（代码）
└── NOTICE.md             # 分层授权与卡图版权说明
```

## 数据与卡图

- 卡牌数据来自 [HearthstoneJSON](https://hearthstonejson.com/)（中文卡名、等级、身材、描述）。
- 卡图来自 [ZeroToHeroes](https://static.zerotoheroes.com/) 的卡牌原画 CDN，已本地化为 240×240 WebP。
- 想换版本 / 补新卡：

```bash
pip install -r requirements.txt
python scripts/fetch_cards.py
```

脚本会读取 `cards.js` 里的卡图路径，重新下载并覆盖 `cards/`。

> 社区俗称已对齐官方卡名：仙女龙=折跃之翼、红龙=赤红守备巨龙、摩托车=极速野猪骑士、白狼=巨狼戈德林；恩佐斯是英雄，不是随从。
> 目前图鉴与卡池里所有收录卡都有卡图（1218/1218）。

## 周报怎么更新

1. GitHub Action `.github/workflows/weekly-meta.yml` 每周一自动检查 HearthstoneJSON 的卡池哈希。
2. 哈希变化时自动开一个 issue（不会重复开），提醒你复核梯度。
3. 人工改 `data.js` 的 `META`（周数、日期、组合），并把 `.github/patch-hash.txt` 更新成最新哈希。
4. 提交后 Pages 自动部署。

> 自动化只负责「提醒」，不自动改梯度——环境判断仍然需要人。

## 对局模式（边玩边对照）

`play.html?comp=dragon_shield`

- 7 格按**手工站位**排序，点击切换 缺 / 有 / 金
- 自动生成缺卡清单，按本数排序
- 回合、本数、金币、血量可调，状态存在 localStorage
- 快捷键：`1–7` 标记卡牌，`空格` 下一回合，`R` 重置
- 「置顶小窗」用 Document Picture-in-Picture（Chrome/Edge 116+），游戏开**无边框窗口化**才能一直看到
- 手机上同一页可用，当第二屏

## 数据源与统计

页面里的英雄/周报现在接入 **Firestone / ZeroToHeroes** 的公开统计（每补丁更新），并标注数据日期、分段与样本量。

```bash
# 拉取最新统计（可用 100/50/25/10/1 指定 MMR 分位）
node scripts/fetch_firestone.mjs 100
# 写入 stats.js
node scripts/import_stats.mjs stats-input.json
```

字段：`source / url / fetchedAt / bracket / region / sample`，
`heroes[]`（name, tier, winrate, pickrate）、`comps[]`（name, tier, top4, win）。

- 没有数据时：徽章显示「社区整理（非统计）」
- 有数据时：徽章显示「HSReplay · 10000+ · 日期 · 样本 N」，英雄列表带胜率
- 数据只影响展示，不改动卡牌事实数据

### 每周自动更新

`.github/workflows/weekly-stats.yml` 每周一 10:00（北京时间）自动：

1. 跑 `scripts/fetch_firestone.mjs` 拉最新统计
2. 跑 `scripts/import_stats.mjs` 写入 `stats.js`
3. 如果数据有变化，自动开一个 PR（分支 `stats/weekly`）等你复核

也可以在 Actions 页面手动触发，并指定 MMR 分位（100/50/25/10/1）。

## 如何贡献

1. 发现卡名、梯度、站位有误：直接改 `data.js` 或 `cards.js`，提 PR。
2. 想加一个种族 / 新版本环境：在 `data.js` 的 `TRIBES` 里加一项即可，页面会自动生成标签页、站位条和速查表。
3. 卡图缺失：把图片放进 `cards/` 并在 `cards.js` 里补 `img` 字段。
4. 提 Issue 时请带上：版本号、分段、对局截图或卡牌名。

## 版本

- 环境快照：炉石传说 **37.0「黑暗帝国」**（2026.11）
- 卡池、数值与梯度会随补丁轮换；页面里「为什么」的部分是方法论，不随版本失效。

## 许可

本项目采用**分层授权**，详见 [NOTICE.md](NOTICE.md)：

| 内容 | 许可 |
| --- | --- |
| 代码（HTML/CSS/JS/脚本） | [MIT](LICENSE) |
| 文字与数据（data.js、cards.js、README） | CC BY-NC-SA 4.0 |
| 卡牌图像（cards/） | © Blizzard Entertainment，不在开源许可内 |

## 免责声明

这是一个**非官方、非商业**的同人学习项目，与 Blizzard Entertainment 无隶属或背书关系。
《炉石传说》、酒馆战棋及相关卡牌图像的版权归 Blizzard 所有，本项目遵循 Fan Content Policy 使用。
如有侵权，请联系删除。

---

## English

A static, offline-friendly study guide for **Hearthstone Battlegrounds**: 11 tribes, optimal boards and positioning, plus the math behind exponential stat growth (and why an all-tribe Amalgam can reach tens of thousands of stats).

Open `index.html` to read — no build step, no server required. Card art is © Blizzard Entertainment and is **not** covered by the MIT license; code is MIT, text is CC BY-NC-SA 4.0. See [NOTICE.md](NOTICE.md).
